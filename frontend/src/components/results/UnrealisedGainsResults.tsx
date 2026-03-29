import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import {
  UnrealisedGainsResult,
  UnrealisedPosition,
} from '../../types/calculation';

interface UnrealisedGainsResultsProps {
  data: UnrealisedGainsResult;
  className?: string;
}

type SortKey = 'symbol' | 'current_value_gbp' | 'unrealised_gain_loss_gbp' | 'gain_loss_pct';
type SortDir = 'asc' | 'desc';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

const fmtNative = (n: number, currency: string) => {
  if (currency === 'GBP') return fmt(n);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
};

const gainClass = (v: number) => (v >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold');

// ── Metric card helper ────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  colour?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, sub, colour = 'primary' }) => (
  <div className="col-6 col-md-3">
    <div className={`card border-0 shadow-sm h-100 border-start border-4 border-${colour}`}>
      <div className="card-body p-3">
        <div className="d-flex align-items-center mb-2">
          <i className={`${icon} me-2 text-${colour}`} />
          <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            {label}
          </small>
        </div>
        <div className={`h5 mb-0 text-${colour}`}>{value}</div>
        {sub && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{sub}</div>}
      </div>
    </div>
  </div>
);

// ── Positions table ───────────────────────────────────────────────────────────

const PositionsTable: React.FC<{ positions: UnrealisedPosition[] }> = ({ positions }) => {
  const [sortKey, setSortKey] = useState<SortKey>('unrealised_gain_loss_gbp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState('');

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    const filtered = filter
      ? positions.filter(
          p =>
            p.symbol.toLowerCase().includes(filter.toLowerCase()) ||
            (p.name || '').toLowerCase().includes(filter.toLowerCase()),
        )
      : positions;

    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [positions, sortKey, sortDir, filter]);

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (col !== sortKey) return <i className="fas fa-sort ms-1 opacity-25" />;
    return <i className={`fas fa-sort-${sortDir === 'asc' ? 'up' : 'down'} ms-1 text-primary`} />;
  };

  const Th: React.FC<{ col: SortKey; children: React.ReactNode; className?: string }> = ({
    col, children, className = '',
  }) => (
    <th
      className={`cursor-pointer user-select-none ${className}`}
      style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
      onClick={() => toggleSort(col)}
    >
      {children}
      <SortIcon col={col} />
    </th>
  );

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          placeholder="Filter by symbol or name…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="fas fa-search fa-2x mb-3 opacity-25" />
          <p>No positions match the filter.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <Th col="symbol">Symbol</Th>
                <th>Name</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Price</th>
                <Th col="current_value_gbp" className="text-end">Value (GBP)</Th>
                <th className="text-end">Cost Basis</th>
                <Th col="unrealised_gain_loss_gbp" className="text-end">Unrealised P&L</Th>
                <Th col="gain_loss_pct" className="text-end">P&L %</Th>
                <th className="text-center">Flags</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(pos => (
                <tr key={pos.symbol}>
                  <td className="fw-bold">{pos.symbol}</td>
                  <td className="text-muted" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pos.name || '—'}
                  </td>
                  <td className="text-end">{pos.quantity.toLocaleString('en-GB')}</td>
                  <td className="text-end">
                    <span>{fmtNative(pos.current_price_native, pos.price_currency)}</span>
                    {pos.price_currency !== 'GBP' && (
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {fmt(pos.current_price_gbp)} <span className="opacity-50">@{pos.fx_rate_to_gbp.toFixed(4)}</span>
                      </div>
                    )}
                  </td>
                  <td className="text-end">{fmt(pos.current_value_gbp)}</td>
                  <td className="text-end">{fmt(pos.cost_basis_gbp)}</td>
                  <td className={`text-end ${gainClass(pos.unrealised_gain_loss_gbp)}`}>
                    {fmt(pos.unrealised_gain_loss_gbp)}
                  </td>
                  <td className={`text-end ${gainClass(pos.gain_loss_pct)}`}>
                    {fmtPct(pos.gain_loss_pct)}
                  </td>
                  <td className="text-center">
                    {pos.has_recent_buys && (
                      <span
                        className="badge bg-warning text-dark"
                        title={`Last buy ${pos.days_since_last_buy ?? '?'} day(s) ago — B&B rule may apply`}
                      >
                        <i className="fas fa-bed me-1" />
                        B&B
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>
        {sorted.length} of {positions.length} position{positions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const UnrealisedGainsResults: React.FC<UnrealisedGainsResultsProps> = ({
  data,
  className = '',
}) => {
  const { portfolio, predictive_cgt, combined_with_realised, warnings, positions } = data;

  const unrealisedPct =
    portfolio.total_cost_basis_gbp > 0
      ? ((portfolio.total_unrealised_gain_loss_gbp / portfolio.total_cost_basis_gbp) * 100).toFixed(2)
      : '0.00';

  const saleDate = data.hypothetical_sale_date
    ? new Date(data.hypothetical_sale_date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'Today';

  const priceTime = data.price_fetched_at
    ? new Date(data.price_fetched_at).toLocaleString('en-GB')
    : null;

  const hasRealised = combined_with_realised.already_realised_gain_gbp !== 0;

  return (
    <div className={`unrealised-gains-results ${className}`}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h4 mb-1 text-primary">
            <i className="fas fa-chart-area me-2" />
            Unrealised Gains &amp; Predictive Tax
          </h2>
          <p className="text-muted mb-0">
            Tax year <strong>{data.tax_year}</strong> · Simulated sale date:{' '}
            <strong>{saleDate}</strong>
          </p>
          {priceTime && (
            <small className="text-muted">
              <i className="fas fa-clock me-1" />
              Prices fetched: {priceTime}
              {positions[0]?.price_source && ` · Source: ${positions[0].price_source}`}
            </small>
          )}
        </div>
        <span className="badge bg-info text-white py-2 px-3 fs-6">
          <i className="fas fa-file me-2" />
          {data.broker_file}
        </span>
      </div>

      {/* ── B&B warning ───────────────────────────────────────────────────── */}
      {warnings.affected_by_bb_rule && (
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="fas fa-exclamation-triangle me-3 mt-1 fs-5" />
            <div>
              <strong>Bed &amp; Breakfast Rule Applies</strong>
              <p className="mb-1">
                You have bought shares within the last 30 days that were also sold (or would be
                sold in this simulation). HMRC's B&amp;B rule changes how the cost basis is
                calculated for: {warnings.bb_rule_affected_symbols.join(', ')}.
              </p>
              <small>The predictive CGT figures already incorporate this matching rule.</small>
            </div>
          </div>
        </Alert>
      )}

      {/* ── Portfolio overview ────────────────────────────────────────────── */}
      <Card className="shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom px-4 pt-4 pb-3">
          <h5 className="mb-0 text-primary">
            <i className="fas fa-briefcase me-2" />
            Portfolio Overview
          </h5>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <MetricCard
              icon="fas fa-wallet"
              label="Current Market Value"
              value={fmt(portfolio.total_current_value_gbp)}
              colour="primary"
            />
            <MetricCard
              icon="fas fa-receipt"
              label="Total Cost Basis"
              value={fmt(portfolio.total_cost_basis_gbp)}
              colour="secondary"
            />
            <MetricCard
              icon="fas fa-chart-line"
              label="Unrealised P&L"
              value={fmt(portfolio.total_unrealised_gain_loss_gbp)}
              sub={`${portfolio.total_unrealised_gain_loss_gbp >= 0 ? '+' : ''}${unrealisedPct}%`}
              colour={portfolio.total_unrealised_gain_loss_gbp >= 0 ? 'success' : 'danger'}
            />
            <MetricCard
              icon="fas fa-layer-group"
              label="Open Positions"
              value={String(portfolio.number_of_positions)}
              colour="info"
            />
          </div>
        </div>
      </Card>

      {/* ── Predictive CGT ────────────────────────────────────────────────── */}
      <Card className="shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom px-4 pt-4 pb-3">
          <h5 className="mb-0 text-primary">
            <i className="fas fa-calculator me-2" />
            Predictive CGT — "If I Sold Everything Today"
          </h5>
          <small className="text-muted">
            Simulates disposing of all positions on {saleDate}, applying same-day, 30-day B&amp;B
            and Section 104 matching rules as required by HMRC.
          </small>
        </div>
        <div className="card-body p-4">
          <div className="row g-3 mb-4">
            <MetricCard
              icon="fas fa-arrow-up"
              label="Gross Gains"
              value={fmt(predictive_cgt.total_gains_gbp)}
              colour="success"
            />
            <MetricCard
              icon="fas fa-arrow-down"
              label="Gross Losses"
              value={fmt(predictive_cgt.total_losses_gbp)}
              colour="danger"
            />
            <MetricCard
              icon="fas fa-equals"
              label="Net Gain"
              value={fmt(predictive_cgt.net_gain_gbp)}
              colour={predictive_cgt.net_gain_gbp >= 0 ? 'success' : 'danger'}
            />
            <MetricCard
              icon="fas fa-shield-alt"
              label="Annual Exemption"
              value={fmt(predictive_cgt.annual_exemption_available_gbp)}
              sub={`Tax year ${data.tax_year}`}
              colour="info"
            />
          </div>

          {/* Taxable gain + estimated tax */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card border-warning h-100">
                <div className="card-body p-3 text-center">
                  <div className="text-muted small mb-1 text-uppercase fw-bold">Taxable Gain</div>
                  <div className="h4 mb-0 text-warning fw-bold">{fmt(predictive_cgt.taxable_gain_gbp)}</div>
                  <small className="text-muted">After annual exemption</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body p-3 text-center">
                  <div className="text-muted small mb-1 text-uppercase fw-bold">
                    Estimated CGT @ 18%
                  </div>
                  <div className="h4 mb-0 text-dark fw-bold">
                    {fmt(predictive_cgt.estimated_tax_basic_rate_gbp)}
                  </div>
                  <small className="text-muted">Basic rate taxpayer</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body p-3 text-center">
                  <div className="text-muted small mb-1 text-uppercase fw-bold">
                    Estimated CGT @ 24%
                  </div>
                  <div className="h4 mb-0 text-dark fw-bold">
                    {fmt(predictive_cgt.estimated_tax_higher_rate_gbp)}
                  </div>
                  <small className="text-muted">Higher rate taxpayer</small>
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-light border mt-4 mb-0">
            <i className="fas fa-info-circle me-2 text-primary" />
            <strong>Disclaimer:</strong> These are estimates only. Actual CGT depends on your
            other income, any losses brought forward, and whether you use the annual exemption
            elsewhere. Always consult a qualified tax adviser.
          </div>
        </div>
      </Card>

      {/* ── Combined with already-realised ───────────────────────────────── */}
      <Card className="shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom px-4 pt-4 pb-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 text-primary">
              <i className="fas fa-layer-group me-2" />
              Combined with Already-Realised Gains
            </h5>
            <small className="text-muted">
              {hasRealised
                ? `Includes £${combined_with_realised.already_realised_gain_gbp.toFixed(2)} already realised this tax year`
                : 'Enter gains already realised this year to see the combined picture'}
            </small>
          </div>
          {!hasRealised && (
            <span className="badge bg-secondary">No prior gains entered</span>
          )}
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="card border-0 bg-light h-100">
                <div className="card-body p-3 text-center">
                  <div className="text-muted small mb-1 text-uppercase fw-bold">Already Realised</div>
                  <div className="h5 mb-0 fw-bold">{fmt(combined_with_realised.already_realised_gain_gbp)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light h-100">
                <div className="card-body p-3 text-center">
                  <div className="text-muted small mb-1 text-uppercase fw-bold">Combined Net Gain</div>
                  <div className={`h5 mb-0 fw-bold ${gainClass(combined_with_realised.combined_net_gain_gbp)}`}>
                    {fmt(combined_with_realised.combined_net_gain_gbp)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light h-100">
                <div className="card-body p-3 text-center">
                  <div className="text-muted small mb-1 text-uppercase fw-bold">Combined Taxable</div>
                  <div className="h5 mb-0 fw-bold text-warning">
                    {fmt(combined_with_realised.combined_taxable_gain_gbp)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light h-100">
                <div className="card-body p-3 text-center">
                  <div className="text-muted small mb-1 text-uppercase fw-bold">Est. Tax (18% / 24%)</div>
                  <div className="h5 mb-0 fw-bold">
                    {fmt(combined_with_realised.estimated_tax_basic_rate_gbp)}
                    <span className="text-muted fw-normal mx-1">/</span>
                    {fmt(combined_with_realised.estimated_tax_higher_rate_gbp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Positions table ───────────────────────────────────────────────── */}
      <Card className="shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom px-4 pt-4 pb-3">
          <h5 className="mb-0 text-primary">
            <i className="fas fa-table me-2" />
            Position Detail
          </h5>
          <small className="text-muted">
            Click column headers to sort · B&amp;B badge = shares bought within the last 30 days
          </small>
        </div>
        <div className="card-body p-4">
          <PositionsTable positions={positions} />
        </div>
      </Card>
    </div>
  );
};

export default UnrealisedGainsResults;
