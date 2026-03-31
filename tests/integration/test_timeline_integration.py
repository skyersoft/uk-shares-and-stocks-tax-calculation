"""Integration tests for the /timeline endpoint (Task 3.1).

Runs TimelineCalculator against a real QFX file and verifies the response
structure and key financial metrics match the /calculate endpoint output.
"""
import json
import os
import sys

import pytest

# Ensure src/ is resolvable for main.python.* imports (same as lambda_handler.py expects)
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if os.path.join(_PROJECT_ROOT, 'src') not in sys.path:
    sys.path.insert(0, os.path.join(_PROJECT_ROOT, 'src'))
if os.path.join(_PROJECT_ROOT, 'deployment') not in sys.path:
    sys.path.insert(0, os.path.join(_PROJECT_ROOT, 'deployment'))

QFX_FILE = os.path.join(_PROJECT_ROOT, 'data', 'U11075163_20240408_20250404.qfx')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_multipart_event(file_content: str, filename: str) -> dict:
    """Craft a minimal Lambda-style event with multipart/form-data body."""
    boundary = "IntegrationTestBoundary1234567890"
    crlf = "\r\n"
    body = (
        f"--{boundary}{crlf}"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"{crlf}'
        f"Content-Type: application/octet-stream{crlf}"
        f"{crlf}"
        f"{file_content}"
        f"{crlf}"
        f"--{boundary}--{crlf}"
    )
    return {
        "httpMethod": "POST",
        "path": "/timeline",
        "headers": {
            "content-type": f"multipart/form-data; boundary={boundary}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        "body": body,
        "isBase64Encoded": False,
    }


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def timeline_response():
    """Call handle_timeline_request once with the real QFX file."""
    if not os.path.exists(QFX_FILE):
        pytest.skip(f"QFX fixture not found: {QFX_FILE}")

    from lambda_handler import handle_timeline_request  # noqa: PLC0415

    with open(QFX_FILE, "r", encoding="utf-8", errors="ignore") as fh:
        file_content = fh.read()

    event = _build_multipart_event(file_content, os.path.basename(QFX_FILE))
    return handle_timeline_request(event)


@pytest.fixture(scope="module")
def timeline_body(timeline_response):
    """Parsed JSON body from the timeline response."""
    assert timeline_response["statusCode"] == 200, (
        f"Expected 200, got {timeline_response['statusCode']}: "
        f"{timeline_response.get('body', '')[:200]}"
    )
    return json.loads(timeline_response["body"])


# ---------------------------------------------------------------------------
# Tests — HTTP layer
# ---------------------------------------------------------------------------

class TestTimelineHTTPLayer:
    def test_status_200(self, timeline_response):
        assert timeline_response["statusCode"] == 200

    def test_content_type_json(self, timeline_response):
        assert "application/json" in timeline_response["headers"]["Content-Type"]

    def test_cors_header_present(self, timeline_response):
        assert timeline_response["headers"].get("Access-Control-Allow-Origin") == "*"


# ---------------------------------------------------------------------------
# Tests — Response structure
# ---------------------------------------------------------------------------

class TestTimelineResponseStructure:
    def test_events_key_present(self, timeline_body):
        assert "events" in timeline_body

    def test_summary_key_present(self, timeline_body):
        assert "summary" in timeline_body

    def test_events_is_list(self, timeline_body):
        assert isinstance(timeline_body["events"], list)

    def test_events_not_empty(self, timeline_body):
        assert len(timeline_body["events"]) > 0, "Expected at least one event"

    def test_summary_has_all_required_fields(self, timeline_body):
        required = [
            "final_unrealised_value_gbp",
            "final_unrealised_gain_loss_gbp",
            "final_total_cost_basis_gbp",
            "final_realised_gain_loss_gbp",
            "final_realised_tax_gbp",
            "final_income_gbp",
            "predictive_cgt_gbp",
        ]
        summary = timeline_body["summary"]
        for field in required:
            assert field in summary, f"Summary missing field: {field}"

    def test_each_event_has_required_fields(self, timeline_body):
        required_fields = [
            "event_index",
            "event_date",
            "tax_year",
            "label",
            "event_type",
            "unrealised_value_gbp",
            "unrealised_gain_loss_gbp",
            "total_cost_basis_gbp",
            "realised_gain_loss_gbp",
            "realised_tax_gbp",
            "income_gbp",
        ]
        for event in timeline_body["events"][:10]:
            for field in required_fields:
                assert field in event, f"Event missing '{field}': {event.get('event_type')}"


# ---------------------------------------------------------------------------
# Tests — Event markers
# ---------------------------------------------------------------------------

class TestTimelineEventMarkers:
    def test_boundary_markers_present(self, timeline_body):
        """At least one boundary marker (YEAR_END or CURRENT_DATE) must be present.

        Multi-year files produce YEAR_END markers; single-year files that are
        still in-progress produce a CURRENT_DATE marker instead.
        """
        event_types = {e["event_type"] for e in timeline_body["events"]}
        assert event_types & {"YEAR_END", "CURRENT_DATE"}, (
            f"Expected at least one YEAR_END or CURRENT_DATE marker, got: {event_types}"
        )

    def test_current_date_marker_appended(self, timeline_body):
        event_types = {e["event_type"] for e in timeline_body["events"]}
        assert "CURRENT_DATE" in event_types, "Expected a CURRENT_DATE marker"

    def test_event_count_exceeds_raw_transaction_count(self, timeline_body):
        """Event list must include at least one marker beyond raw transactions."""
        events = timeline_body["events"]
        marker_types = {"YEAR_END", "CURRENT_DATE"}
        markers = [e for e in events if e["event_type"] in marker_types]
        raw_txns = [e for e in events if e["event_type"] not in marker_types]
        assert len(raw_txns) > 0, "No transaction events found"
        assert len(markers) >= 1, "No YEAR_END or CURRENT_DATE markers found"

    def test_events_sorted_by_date(self, timeline_body):
        events = timeline_body["events"]
        dates = [e["event_date"] for e in events]
        assert dates == sorted(dates), "Events are not in chronological order"

    def test_event_index_sequential(self, timeline_body):
        events = timeline_body["events"]
        for i, event in enumerate(events):
            assert event["event_index"] == i, (
                f"Non-sequential event_index at position {i}: {event['event_index']}"
            )


# ---------------------------------------------------------------------------
# Tests — Financial accuracy
# ---------------------------------------------------------------------------

class TestTimelineFinancialAccuracy:
    EXPECTED_REALISED_GAIN_GBP = 1293.40
    TOLERANCE_GBP = 50.0  # ±£50 tolerance for rounding and FX differences

    def test_realised_gain_matches_calculate_endpoint(self, timeline_body):
        """final_realised_gain_loss_gbp should match /calculate (~£1,293.40)."""
        realised = timeline_body["summary"]["final_realised_gain_loss_gbp"]
        assert abs(realised - self.EXPECTED_REALISED_GAIN_GBP) < self.TOLERANCE_GBP, (
            f"Expected final_realised_gain_loss_gbp ≈ £{self.EXPECTED_REALISED_GAIN_GBP:.2f}, "
            f"got £{realised:.2f}"
        )

    def test_unrealised_value_positive_for_file_with_holdings(self, timeline_body):
        """The QFX file has remaining holdings — unrealised value must be > 0."""
        summary = timeline_body["summary"]
        assert summary["final_unrealised_value_gbp"] > 0, (
            "Expected positive unrealised portfolio value for a file with holdings"
        )

    def test_total_cost_basis_positive(self, timeline_body):
        summary = timeline_body["summary"]
        assert summary["final_total_cost_basis_gbp"] > 0

    def test_boundary_events_have_predictive_cgt(self, timeline_body):
        """YEAR_END and CURRENT_DATE events must populate predictive_sell_all_cgt_gbp."""
        boundary_events = [
            e for e in timeline_body["events"]
            if e["event_type"] in {"YEAR_END", "CURRENT_DATE"}
        ]
        assert len(boundary_events) > 0, "Expected at least one YEAR_END or CURRENT_DATE event"
        for event in boundary_events:
            assert event.get("predictive_sell_all_cgt_gbp") is not None, (
                f"{event['event_type']} event at {event['event_date']} "
                f"missing predictive_sell_all_cgt_gbp"
            )

    def test_buy_events_have_symbol_and_quantity(self, timeline_body):
        buy_events = [e for e in timeline_body["events"] if e["event_type"] == "BUY"]
        assert len(buy_events) > 0, "No BUY events found"
        for event in buy_events[:5]:
            assert event.get("symbol") is not None, f"BUY event missing symbol: {event}"
            assert event.get("quantity") is not None, f"BUY event missing quantity: {event}"

    def test_sell_events_produce_realised_gain(self, timeline_body):
        """After a SELL, cumulative realised_gain_loss_gbp should be non-zero."""
        sell_events = [e for e in timeline_body["events"] if e["event_type"] == "SELL"]
        if not sell_events:
            pytest.skip("No SELL events in this QFX file")
        last_sell = sell_events[-1]
        assert last_sell["realised_gain_loss_gbp"] != 0, (
            "Expected non-zero realised_gain_loss_gbp after SELL events"
        )
