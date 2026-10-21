"""Tests for the /inspect-file Lambda handler (synthetic data only)."""
import base64
import json
from unittest.mock import patch

import pytest

import deployment.lambda_handler as lh
from src.main.python.converters import register_default_converters
from src.main.python.services.file_inspector import inspect_files
from tests.unit.test_file_inspector import statement

BOUNDARY = "----testboundary123"


@pytest.fixture(autouse=True)
def wire_inspector():
    """The Lambda imports via main.python.*, which does not resolve in tests."""
    register_default_converters()
    with patch.object(lh, "inspect_files", inspect_files, create=True), \
            patch.object(lh, "INSPECT_AVAILABLE", True, create=True):
        yield


def multipart(files, fields=None):
    out = b""
    for name, value in (fields or {}).items():
        out += (f'--{BOUNDARY}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n'
                f'{value}\r\n').encode()
    for i, (filename, content) in enumerate(files):
        out += (f'--{BOUNDARY}\r\nContent-Disposition: form-data; name="file{i}"; '
                f'filename="{filename}"\r\nContent-Type: text/csv\r\n\r\n').encode()
        out += content + b"\r\n"
    return out + f"--{BOUNDARY}--\r\n".encode()


def event(body, content_type=f"multipart/form-data; boundary={BOUNDARY}", path="/inspect-file"):
    return {
        "httpMethod": "POST",
        "path": path,
        "headers": {"Content-Type": content_type},
        "body": base64.b64encode(body).decode(),
        "isBase64Encoded": True,
    }


def call(ev):
    return lh.lambda_handler(ev, None)


def test_inspect_returns_xray_json_for_activity_statement():
    body = multipart([("a.csv", statement([("AAPL", "2024-05-01", 10, 100)]))])
    resp = call(event(body))
    assert resp["statusCode"] == 200
    assert resp["headers"]["Access-Control-Allow-Origin"] == "*"
    assert resp["headers"]["Content-Type"] == "application/json"
    data = json.loads(resp["body"])
    assert set(data) == {"files", "expectations", "can_continue", "requires_acknowledgement"}
    f = data["files"][0]
    assert f["filename"] == "a.csv"
    assert f["rows"]["usable"] == 1
    assert f["summary"]["buys"] == 1


def test_inspect_multiple_files_returns_combined_expectations():
    buy = statement([("AAPL", "2024-05-01", 10, 100)])
    sell = statement([("AAPL", "2024-06-01", -10, 110)])
    resp = call(event(multipart([("sell.csv", sell), ("buy.csv", buy)])))
    data = json.loads(resp["body"])
    assert resp["statusCode"] == 200
    assert [f["filename"] for f in data["files"]] == ["sell.csv", "buy.csv"]
    exp = data["expectations"][0]
    assert exp["rule"] == "every_sell_has_earlier_buy"
    assert exp["passed"] is True

    only_sell = json.loads(call(event(multipart([("sell.csv", sell)])))["body"])
    assert only_sell["expectations"][0]["passed"] is False
    assert only_sell["requires_acknowledgement"] is True


def test_inspect_non_utf8_file_is_passed_as_bytes():
    raw = statement([("AAPL", "2024-05-01", 10, 100)]) + b"Notes,Data,caf\xe9\n"
    resp = call(event(multipart([("a.csv", raw)])))
    assert resp["statusCode"] == 200


def test_inspect_rejects_non_multipart():
    resp = call(event(b'{"a": 1}', content_type="application/json"))
    assert resp["statusCode"] == 400
    assert "error" in json.loads(resp["body"])
    assert resp["headers"]["Access-Control-Allow-Origin"] == "*"


def test_inspect_rejects_multipart_without_files():
    resp = call(event(multipart([], fields={"tax_year": "2024-2025"})))
    assert resp["statusCode"] == 400
    assert "error" in json.loads(resp["body"])


def test_inspect_rejects_oversize_with_message():
    big = b"x" * (lh.MAX_INSPECT_BYTES + 1)
    resp = call(event(multipart([("big.csv", big)])))
    assert resp["statusCode"] == 413
    msg = json.loads(resp["body"])["error"]
    assert "shorter date range" in msg
    assert resp["headers"]["Access-Control-Allow-Origin"] == "*"


def test_inspect_does_not_write_to_s3():
    body = multipart([("a.csv", statement([("AAPL", "2024-05-01", 10, 100)])), ("bad.csv", b"\x00\x01garbage")])
    with patch.object(lh, "log_error_file_to_s3") as s3, patch.object(lh, "boto3") as boto:
        call(event(body))
        call(event(b"nope", content_type="application/json"))
        with patch.object(lh, "inspect_files", side_effect=RuntimeError("boom"), create=True):
            call(event(body))
    s3.assert_not_called()
    boto.client.assert_not_called()


def test_inspect_internal_error_returns_500_json_with_cors():
    body = multipart([("a.csv", b"x")])
    with patch.object(lh, "inspect_files", side_effect=RuntimeError("boom"), create=True):
        resp = call(event(body))
    assert resp["statusCode"] == 500
    assert "error" in json.loads(resp["body"])
    assert resp["headers"]["Access-Control-Allow-Origin"] == "*"


def test_inspect_unavailable_returns_503_json():
    with patch.object(lh, "INSPECT_AVAILABLE", False, create=True):
        resp = call(event(multipart([("a.csv", b"x")])))
    assert resp["statusCode"] == 503
    assert "error" in json.loads(resp["body"])


def test_inspect_handles_non_base64_body():
    ev = event(multipart([("a.csv", statement([("AAPL", "2024-05-01", 10, 100)]))]))
    ev["body"] = multipart([("a.csv", statement([("AAPL", "2024-05-01", 10, 100)]))]).decode("latin-1")
    ev["isBase64Encoded"] = False
    assert call(ev)["statusCode"] == 200


@pytest.mark.parametrize("name", ["caf\u00e9.csv", "\u53d6\u5f15.csv"])
def test_inspect_non_ascii_filename_is_preserved(name):
    body = multipart([(name, statement([("AAPL", "2024-05-01", 10, 100)]))])
    data = json.loads(call(event(body))["body"])
    assert data["files"][0]["filename"] == name


def test_inspect_rfc5987_filename():
    content = statement([("AAPL", "2024-05-01", 10, 100)])
    body = (f'--{BOUNDARY}\r\nContent-Disposition: form-data; name="file0"; '
            f"filename*=UTF-8''caf%C3%A9.csv\r\n\r\n").encode() + content + f"\r\n--{BOUNDARY}--\r\n".encode()
    data = json.loads(call(event(body))["body"])
    assert data["files"][0]["filename"] == "caf\u00e9.csv"


def test_inspect_plain_field_named_file_prefix_is_ignored():
    body = multipart([], fields={"filetype": "csv"})
    resp = call(event(body))
    assert resp["statusCode"] == 400


def test_inspect_invalid_base64_returns_400():
    ev = event(b"x")
    ev["body"] = "!!!not base64!!!"
    resp = call(ev)
    assert resp["statusCode"] == 400
    assert "error" in json.loads(resp["body"])
