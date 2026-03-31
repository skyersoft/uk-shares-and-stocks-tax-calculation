/**
 * PrintReportPage — Accountant-quality UK CGT Tax Report
 *
 * A dedicated print-optimised page that renders all calculation data in a
 * clean, structured format suitable for HMRC submission and accountant review.
 *
 * Route: /print-report
 * Opened in a new tab by the "Print Results" button on ResultsPage.
 */
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalculation } from '../context/CalculationContext';
import { normalizeCalculationResults } from '../utils/resultsNormalizer';
import { DisposalEvent, NormalizedResults, PortfolioAnalysis } from '../types/calculation';
import { calculateComprehensiveTax } from '../utils/comprehensiveTaxCalculation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const gbp = (n: number | undefined | null, dp = 2): string => {
  const v = typeof n === 'number' && isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(v);
};

const num = (n: number | undefined | null, dp = 4): string => {
  const v = typeof n === 'number' && isFinite(n) ? n : 0;
  return v.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
};

const qty = (n: number | undefined | null): string => {
  const v = typeof n === 'number' && isFinite(n) ? n : 0;
  return v.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 6 });
};

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
};

const MATCHING_RULE_LABELS: Record<string, string> = {
  'same-day': 'Same-day',
  'bed-breakfast': '30-day (B&B)',
  section104: 'Section 104',
};

const UK_AEA: Record<string, number> = {
  '2024-2025': 3000,
  '2025-2026': 3000,
  '2023-2024': 6000,
  '2022-2023': 12300,
};

// ─── Shared print styles ──────────────────────────────────────────────────────

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', Arial, sans-serif;
    font-size: 9.5pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.4;
  }

  .report-page {
    background: #fff;
    max-width: 750px;
    margin: 0 auto;
    padding: 16px 20px 40px;
  }

  /* ── Screen-only controls ── */
  .screen-only {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 14px 20px;
    background: #1a3a5c;
    color: #fff;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 3px solid #0d6efd;
  }
  .btn-print {
    background: #0d6efd;
    color: #fff;
    border: none;
    padding: 8px 18px;
    border-radius: 5px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-back {
    background: transparent;
    color: #adb5bd;
    border: 1px solid #adb5bd;
    padding: 7px 14px;
    border-radius: 5px;
    font-size: 12px;
    cursor: pointer;
  }
  .btn-back:hover { color: #fff; border-color: #fff; }
  .screen-only-hint {
    font-size: 11px;
    color: #adb5bd;
    margin-left: auto;
  }

  /* ── Report header ── */
  .report-header {
    border-bottom: 2px solid #1a3a5c;
    padding-bottom: 14px;
    margin-bottom: 20px;
  }
  .report-title {
    font-size: 18pt;
    font-weight: 700;
    color: #1a3a5c;
    letter-spacing: -0.3px;
  }
  .report-subtitle {
    font-size: 10pt;
    color: #5a6a7a;
    margin-top: 2px;
  }
  .report-meta {
    font-size: 8.5pt;
    color: #6c757d;
    margin-top: 6px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
  .report-meta span { display: flex; align-items: center; gap: 5px; }

  /* ── Section structure ── */
  .section {
    margin-bottom: 24px;
    page-break-inside: avoid;
  }
  .section-header {
    background: #1a3a5c;
    color: #fff;
    padding: 5px 10px;
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .section-header .badge {
    background: rgba(255,255,255,0.2);
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 7.5pt;
    font-weight: 500;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }
  th {
    background: #f0f4f8;
    color: #2c3e50;
    font-weight: 600;
    padding: 5px 7px;
    text-align: left;
    border: 1px solid #cdd6e0;
    white-space: nowrap;
  }
  td {
    padding: 4px 7px;
    border: 1px solid #dde3ea;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f9fbfd; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .mono { font-family: 'Courier New', monospace; font-size: 8pt; }
  .gain-pos { color: #198754; font-weight: 600; }
  .gain-neg { color: #dc3545; font-weight: 600; }
  .gain-zero { color: #6c757d; }

  /* ── Summary / KPI tables ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }
  .kpi-card {
    border: 1px solid #cdd6e0;
    border-radius: 5px;
    padding: 10px 12px;
    background: #f8fbfe;
  }
  .kpi-label { font-size: 7.5pt; color: #6c757d; font-weight: 600; text-transform: uppercase; }
  .kpi-value { font-size: 13pt; font-weight: 700; color: #1a3a5c; margin-top: 3px; }
  .kpi-value.negative { color: #dc3545; }
  .kpi-value.positive { color: #198754; }
  .kpi-note { font-size: 7pt; color: #999; margin-top: 2px; }

  /* ── CGT calculation table ── */
  .calc-table td:first-child { width: 65%; }
  .calc-table td:last-child { text-align: right; font-weight: 600; padding-right: 12px; white-space: nowrap; }
  .calc-table .subtotal td { background: #eef3f9; font-weight: 600; }
  .calc-table .total td { background: #1a3a5c; color: #fff; font-weight: 700; font-size: 9pt; }
  .calc-table .total td:last-child { color: #ffd700; }
  .calc-table .indent { padding-left: 22px !important; }
  .calc-table .rule-row td { background: #fff9e6; font-style: italic; font-size: 7.5pt; color: #856404; }

  /* ── Pool cards ── */
  .pools-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .pool-card {
    border: 1px solid #cdd6e0;
    border-radius: 4px;
    padding: 8px 10px;
    background: #f8fbfe;
  }
  .pool-symbol { font-weight: 700; font-size: 9pt; color: #1a3a5c; }
  .pool-detail { font-size: 7.5pt; color: #6c757d; margin-top: 2px; }
  .pool-value { font-size: 9pt; font-weight: 600; color: #333; }

  /* ── Rule badges ── */
  .rule-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 600;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .rule-same-day { background: #ffe8cc; color: #8a4800; }
  .rule-bb { background: #d4edda; color: #155724; }
  .rule-s104 { background: #d1ecf1; color: #0c5460; }

  /* ── Disclaimer ── */
  .disclaimer {
    border-top: 1px solid #cdd6e0;
    padding-top: 12px;
    font-size: 7pt;
    color: #888;
    line-height: 1.5;
  }

  /* ── Page breaks ── */
  .page-break-before { page-break-before: always; }
  .no-break { page-break-inside: avoid; }

  /* ── Print media ── */
  @media print {
    @page {
      size: A4 portrait;
      margin: 15mm 14mm 15mm 14mm;
    }
    body { font-size: 8.5pt; }
    .screen-only { display: none !important; }
    .report-page { max-width: 100%; padding: 0; }
    .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    .pools-grid { grid-template-columns: repeat(4, 1fr); }
    a { text-decoration: none; color: inherit; }
    .section { page-break-inside: avoid; }
    th, td { font-size: 7.5pt; }
  }

  @media screen {
    body { background: #e9ecef; }
    .report-page {
      background: #fff;
      box-shadow: 0 2px 20px rgba(0,0,0,0.12);
      padding: 28px 32px 60px;
      margin: 0 auto 40px;
    }
  }
`;

// ─── Section 2: CGT Calculation ───────────────────────────────────────────────

interface CGTCalcProps {
  taxYear: string;
  disposalEvents: DisposalEvent[];
  normalizedResults: NormalizedResults;
}

const CGTCalculation: React.FC<CGTCalcProps> = ({ taxYear, disposalEvents, normalizedResults }) => {
  const aea = UK_AEA[taxYear] ?? 3000;

  // Aggregate from disposal events (preferred — full accuracy)
  const totalProceeds = useMemo(() => {
    if (disposalEvents.length) return disposalEvents.reduce((s, d) => s + (d.net_proceeds || d.proceeds_gbp || 0), 0);
    return normalizedResults.disposals.reduce((s, d) => s + (d.proceeds || 0), 0);
  }, [disposalEvents, normalizedResults]);

  const totalAllowableCost = useMemo(() => {
    if (disposalEvents.length) return disposalEvents.reduce((s, d) => s + (d.allowable_cost || d.cost_gbp || 0), 0);
    return normalizedResults.disposals.reduce((s, d) => s + (d.costBasis || 0), 0);
  }, [disposalEvents, normalizedResults]);

  const grossGains = useMemo(() => {
    const gains = disposalEvents.length
      ? disposalEvents.filter(d => d.total_gain_loss > 0).reduce((s, d) => s + d.total_gain_loss, 0)
      : normalizedResults.disposals.filter(d => d.gainLoss > 0).reduce((s, d) => s + d.gainLoss, 0);
    return gains;
  }, [disposalEvents, normalizedResults]);

  const grossLosses = useMemo(() => {
    const losses = disposalEvents.length
      ? disposalEvents.filter(d => d.total_gain_loss < 0).reduce((s, d) => s + Math.abs(d.total_gain_loss), 0)
      : normalizedResults.disposals.filter(d => d.gainLoss < 0).reduce((s, d) => s + Math.abs(d.gainLoss), 0);
    return losses;
  }, [disposalEvents, normalizedResults]);

  const netGain = grossGains - grossLosses;
  const taxableGain = Math.max(0, netGain - aea);
  const cgtBasicRate = taxableGain * 0.18;
  const cgtHigherRate = taxableGain * 0.24;

  const sameDay = disposalEvents.filter(d => d.matching_rule === 'same-day').length;
  const bb = disposalEvents.filter(d => d.matching_rule === 'bed-breakfast').length;
  const s104 = disposalEvents.filter(d => d.matching_rule === 'section104').length;

  return (
    <div className="section no-break">
      <div className="section-header">
        <span>Section 2 — Capital Gains Calculation (SA108)</span>
        <span className="badge">Tax Year {taxYear}</span>
      </div>
      <table className="calc-table">
        <tbody>
          <tr>
            <td>Total disposal proceeds (net of broker commissions)</td>
            <td className="text-right">{gbp(totalProceeds)}</td>
          </tr>
          <tr>
            <td className="indent">Less: Allowable acquisition costs (HMRC Section 104 pooling)</td>
            <td className="text-right">({gbp(totalAllowableCost)})</td>
          </tr>
          <tr className="subtotal">
            <td>Gross Capital Gains (before losses)</td>
            <td className="text-right">{gbp(grossGains)}</td>
          </tr>
          <tr>
            <td className="indent">Less: Capital Losses</td>
            <td className="text-right">({gbp(grossLosses)})</td>
          </tr>
          <tr className="subtotal">
            <td>Net Capital Gain / (Loss) for the Year</td>
            <td className={`text-right ${netGain >= 0 ? 'gain-pos' : 'gain-neg'}`}>{gbp(netGain)}</td>
          </tr>
          <tr className="rule-row">
            <td className="indent">HMRC matching rules applied — Same-day: {sameDay} · 30-day B&B: {bb} · Section 104 pool: {s104}</td>
            <td></td>
          </tr>
          <tr>
            <td>Less: Annual Exempt Amount (AEA) {taxYear}</td>
            <td className="text-right">({gbp(Math.min(aea, Math.max(0, netGain)))})</td>
          </tr>
          <tr className="subtotal">
            <td>Taxable Gain (after AEA)</td>
            <td className={`text-right ${taxableGain > 0 ? 'gain-neg' : 'gain-zero'}`}>{gbp(taxableGain)}</td>
          </tr>
          <tr className="rule-row">
            <td className="indent">CGT at 18% (Basic Rate — post October 2024)</td>
            <td className="text-right">{gbp(cgtBasicRate)}</td>
          </tr>
          <tr className="rule-row">
            <td className="indent">CGT at 24% (Higher Rate — post October 2024)</td>
            <td className="text-right">{gbp(cgtHigherRate)}</td>
          </tr>
          <tr className="total">
            <td>ESTIMATED CGT DUE (at 18% basic rate)</td>
            <td className="text-right">{gbp(cgtBasicRate)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: '7pt', color: '#888', marginTop: '6px', lineHeight: '1.5' }}>
        * Verify applicable CGT rate with your accountant based on your total taxable income. Post-October 2024 rates: 18% (basic rate), 24% (higher/additional rate).
        AEA {taxYear}: £{aea.toLocaleString('en-GB')}. Disposal matching follows TCGA 1992 s.105–s.107.
      </p>
    </div>
  );
};

// ─── Section 3: Disposal Schedule ────────────────────────────────────────────

interface DisposalTableProps {
  disposalEvents: DisposalEvent[];
  fallbackDisposals: NormalizedResults['disposals'];
}

const DisposalSchedule: React.FC<DisposalTableProps> = ({ disposalEvents, fallbackDisposals }) => {
  const hasRichData = disposalEvents.length > 0;

  if (!hasRichData && fallbackDisposals.length === 0) {
    return (
      <div className="section no-break">
        <div className="section-header"><span>Section 3 — Disposal Schedule</span></div>
        <p style={{ color: '#888', padding: '10px', fontSize: '8pt' }}>No disposal events recorded for this tax year.</p>
      </div>
    );
  }

  const totalProceeds = hasRichData
    ? disposalEvents.reduce((s, d) => s + (d.net_proceeds || d.proceeds_gbp || 0), 0)
    : fallbackDisposals.reduce((s, d) => s + d.proceeds, 0);

  const totalCost = hasRichData
    ? disposalEvents.reduce((s, d) => s + (d.allowable_cost || d.cost_gbp || 0), 0)
    : fallbackDisposals.reduce((s, d) => s + d.costBasis, 0);

  const totalGain = hasRichData
    ? disposalEvents.reduce((s, d) => s + d.total_gain_loss, 0)
    : fallbackDisposals.reduce((s, d) => s + d.gainLoss, 0);

  const ruleBadge = (rule: string) => {
    if (rule === 'same-day') return <span className="rule-badge rule-same-day">Same-Day</span>;
    if (rule === 'bed-breakfast') return <span className="rule-badge rule-bb">30-Day B&B</span>;
    return <span className="rule-badge rule-s104">S.104 Pool</span>;
  };

  return (
    <div className="section page-break-before">
      <div className="section-header">
        <span>Section 3 — Disposal Schedule</span>
        <span className="badge">{hasRichData ? disposalEvents.length : fallbackDisposals.length} disposals</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '72px' }}>Disposal Date</th>
            <th style={{ width: '58px' }}>Symbol</th>
            <th className="text-right" style={{ width: '60px' }}>Qty</th>
            {hasRichData && <th style={{ width: '68px' }}>Currency</th>}
            <th className="text-right" style={{ width: '80px' }}>Proceeds (£)</th>
            {hasRichData && <th className="text-right" style={{ width: '76px' }}>Commission (£)</th>}
            <th className="text-right" style={{ width: '80px' }}>Allowable Cost (£)</th>
            {hasRichData && <th className="text-right" style={{ width: '56px' }}>FX G/L (£)</th>}
            <th className="text-right" style={{ width: '80px' }}>Net Gain / (Loss)</th>
            <th style={{ width: '70px' }}>HMRC Rule</th>
          </tr>
        </thead>
        <tbody>
          {hasRichData
            ? disposalEvents.map((d, i) => {
                const gain = d.total_gain_loss;
                return (
                  <tr key={i}>
                    <td>{fmtDate(d.disposal_date)}</td>
                    <td className="mono">{d.security_symbol}</td>
                    <td className="text-right">{qty(d.quantity)}</td>
                    <td className="mono">{d.proceeds_original_currency || 'GBP'}</td>
                    <td className="text-right mono">{gbp(d.net_proceeds || d.proceeds_gbp)}</td>
                    <td className="text-right mono">{gbp(d.proceeds_commission)}</td>
                    <td className="text-right mono">{gbp(d.allowable_cost || d.cost_gbp)}</td>
                    <td className={`text-right mono ${d.fx_gain_loss > 0 ? 'gain-pos' : d.fx_gain_loss < 0 ? 'gain-neg' : ''}`}>
                      {d.fx_gain_loss !== 0 ? gbp(d.fx_gain_loss) : '—'}
                    </td>
                    <td className={`text-right mono ${gain > 0 ? 'gain-pos' : gain < 0 ? 'gain-neg' : 'gain-zero'}`}>
                      {gbp(gain)}
                    </td>
                    <td>{ruleBadge(d.matching_rule)}</td>
                  </tr>
                );
              })
            : fallbackDisposals.map((d, i) => {
                const gain = d.gainLoss;
                return (
                  <tr key={i}>
                    <td>{fmtDate(d.disposalDate)}</td>
                    <td className="mono">{d.symbol}</td>
                    <td className="text-right">{qty(d.quantity)}</td>
                    <td className="text-right mono">{gbp(d.proceeds)}</td>
                    <td className="text-right mono">{gbp(d.costBasis)}</td>
                    <td className={`text-right mono ${gain > 0 ? 'gain-pos' : gain < 0 ? 'gain-neg' : 'gain-zero'}`}>
                      {gbp(gain)}
                    </td>
                    <td><span className="rule-badge rule-s104">S.104 Pool</span></td>
                  </tr>
                );
              })
          }
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: '#eef3f9', fontSize: '8.5pt' }}>
            <td colSpan={hasRichData ? 4 : 2}><strong>TOTALS</strong></td>
            <td className="text-right mono">{gbp(totalProceeds)}</td>
            {hasRichData && <td></td>}
            <td className="text-right mono">{gbp(totalCost)}</td>
            {hasRichData && <td></td>}
            <td className={`text-right mono ${totalGain >= 0 ? 'gain-pos' : 'gain-neg'}`}>{gbp(totalGain)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── Section 4: Section 104 Pools ────────────────────────────────────────────

interface PoolsProps {
  pools: Record<string, any>;
  asAtDate: string;
}

const Section104Pools: React.FC<PoolsProps> = ({ pools, asAtDate }) => {
  const entries = Object.entries(pools || {});
  if (entries.length === 0) return null;

  return (
    <div className="section no-break">
      <div className="section-header">
        <span>Section 4 — Section 104 Pools (TCGA 1992 s.104)</span>
        <span className="badge">As at {fmtDate(asAtDate)} · {entries.length} positions</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Symbol / Security</th>
            <th className="text-right">Shares in Pool</th>
            <th className="text-right">Total Cost (£)</th>
            <th className="text-right">Average Cost per Share (£)</th>
            <th className="text-right">Cost per Share</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([symbol, pool]: [string, any]) => {
            const totalCost = pool?.total_cost || pool?.cost || 0;
            const sharesQty = pool?.quantity || pool?.shares || 0;
            const avgCost = sharesQty > 0 ? totalCost / sharesQty : 0;
            return (
              <tr key={symbol}>
                <td className="mono" style={{ fontWeight: 600 }}>{symbol}</td>
                <td className="text-right mono">{qty(sharesQty)}</td>
                <td className="text-right mono">{gbp(totalCost)}</td>
                <td className="text-right mono">{gbp(avgCost)}</td>
                <td className="text-right mono" style={{ color: '#888' }}>{num(avgCost, 6)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: '7pt', color: '#888', marginTop: '6px' }}>
        Section 104 pools represent the pooled acquisition cost of identical securities held. The average cost method is used per HMRC rules.
      </p>
    </div>
  );
};

// ─── Section 5: Portfolio Holdings ───────────────────────────────────────────

interface HoldingsProps { portfolioAnalysis: PortfolioAnalysis | null }

const PortfolioHoldings: React.FC<HoldingsProps> = ({ portfolioAnalysis }) => {
  if (!portfolioAnalysis) return null;

  const allHoldings: any[] = [];
  Object.entries(portfolioAnalysis.market_summaries || {}).forEach(([_market, summary]: [string, any]) => {
    (summary?.holdings || []).forEach((h: any) => {
      allHoldings.push({ ...h, market: _market, currency: summary.currency });
    });
  });

  if (allHoldings.length === 0) return null;

  const totalValue = portfolioAnalysis.total_portfolio_value || 0;
  const totalGL = portfolioAnalysis.total_unrealized_gain_loss || 0;

  return (
    <div className="section page-break-before">
      <div className="section-header">
        <span>Section 5 — Current Portfolio Holdings</span>
        <span className="badge">{allHoldings.length} positions</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Market</th>
            <th className="text-right">Quantity</th>
            <th className="text-right">Avg Cost (£)</th>
            <th className="text-right">Total Cost (£)</th>
            <th className="text-right">Current Value (£)</th>
            <th className="text-right">Unrealised G/L (£)</th>
            <th className="text-right">Return %</th>
          </tr>
        </thead>
        <tbody>
          {allHoldings.map((h: any, i) => {
            const symbol = h.security?.symbol || h.symbol || '—';
            const name = h.security?.name || h.name || '—';
            const q = h.quantity || 0;
            const avgCost = h.average_cost_gbp || h.average_cost || 0;
            const totalCost = h.total_cost_gbp || (q * avgCost) || 0;
            const value = h.current_value_gbp || h.market_value || 0;
            const gl = h.unrealized_gain_loss || (value - totalCost) || 0;
            const pct = totalCost > 0 ? (gl / totalCost) * 100 : 0;
            return (
              <tr key={i}>
                <td className="mono" style={{ fontWeight: 600 }}>{symbol}</td>
                <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</td>
                <td className="text-center" style={{ fontSize: '7.5pt', color: '#666' }}>{h.market || '—'}</td>
                <td className="text-right mono">{qty(q)}</td>
                <td className="text-right mono">{gbp(avgCost)}</td>
                <td className="text-right mono">{gbp(totalCost)}</td>
                <td className="text-right mono">{gbp(value)}</td>
                <td className={`text-right mono ${gl >= 0 ? 'gain-pos' : 'gain-neg'}`}>{gbp(gl)}</td>
                <td className={`text-right mono ${pct >= 0 ? 'gain-pos' : 'gain-neg'}`}>{pct.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: '#eef3f9' }}>
            <td colSpan={6}><strong>PORTFOLIO TOTALS</strong></td>
            <td className="text-right mono"><strong>{gbp(totalValue)}</strong></td>
            <td className={`text-right mono ${totalGL >= 0 ? 'gain-pos' : 'gain-neg'}`}><strong>{gbp(totalGL)}</strong></td>
            <td className="text-right mono">
              <strong className={totalGL >= 0 ? 'gain-pos' : 'gain-neg'}>
                {totalValue > 0 ? ((totalGL / (totalValue - totalGL)) * 100).toFixed(1) : '0.0'}%
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── Section 6: Dividends ─────────────────────────────────────────────────────

interface DividendsProps { dividends: NormalizedResults['dividends'] }

const DividendsTable: React.FC<DividendsProps> = ({ dividends }) => {
  if (!dividends || dividends.length === 0) return null;

  const totalGross = dividends.reduce((s, d) => s + d.grossAmount, 0);
  const totalWHT = dividends.reduce((s, d) => s + d.withholdingTax, 0);
  const totalNet = dividends.reduce((s, d) => s + d.netAmount, 0);

  return (
    <div className="section no-break">
      <div className="section-header">
        <span>Section 6 — Dividend Income</span>
        <span className="badge">{dividends.length} payments · Net: {gbp(totalNet)}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Payment Date</th>
            <th>Symbol</th>
            <th className="text-right">Gross Amount (£)</th>
            <th className="text-right">Withholding Tax (£)</th>
            <th className="text-right">Net Amount (£)</th>
            <th className="text-right">WHT Rate</th>
          </tr>
        </thead>
        <tbody>
          {dividends.map((d, i) => {
            const whtRate = d.grossAmount > 0 ? (d.withholdingTax / d.grossAmount * 100) : 0;
            return (
              <tr key={i}>
                <td>{fmtDate(d.paymentDate)}</td>
                <td className="mono" style={{ fontWeight: 600 }}>{d.symbol}</td>
                <td className="text-right mono">{gbp(d.grossAmount)}</td>
                <td className="text-right mono">{d.withholdingTax > 0 ? gbp(d.withholdingTax) : '—'}</td>
                <td className="text-right mono">{gbp(d.netAmount)}</td>
                <td className="text-right mono" style={{ color: '#888' }}>{whtRate > 0 ? whtRate.toFixed(0) + '%' : '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: '#eef3f9' }}>
            <td colSpan={2}><strong>TOTALS</strong></td>
            <td className="text-right mono">{gbp(totalGross)}</td>
            <td className="text-right mono">{gbp(totalWHT)}</td>
            <td className="text-right mono">{gbp(totalNet)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── Section 7: Currency Balances ────────────────────────────────────────────

interface CurrencyProps { currencyBalances: any[] | undefined }

const CurrencyBalancesSection: React.FC<CurrencyProps> = ({ currencyBalances }) => {
  if (!currencyBalances || currencyBalances.length === 0) return null;

  return (
    <div className="section no-break">
      <div className="section-header">
        <span>Section 7 — Currency Pool Balances</span>
        <span className="badge">{currencyBalances.length} currencies</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Currency</th>
            <th className="text-right">Balance (native)</th>
            <th className="text-right">FX Rate (£1 =)</th>
            <th className="text-right">Balance (£)</th>
          </tr>
        </thead>
        <tbody>
          {currencyBalances.map((c: any, i) => (
            <tr key={i}>
              <td className="mono" style={{ fontWeight: 700 }}>{c.currency}</td>
              <td className="text-right mono">{num(c.balance, 2)}</td>
              <td className="text-right mono">{num(c.fx_rate, 6)}</td>
              <td className="text-right mono">{gbp(c.balance_gbp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PrintReportPage: React.FC = () => {
  const { state } = useCalculation();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const normalizedResults: NormalizedResults | null = useMemo(() => {
    if (state.result) return state.result;
    if (state.raw) return normalizeCalculationResults(state.raw);
    return null;
  }, [state.result, state.raw]);

  const portfolioAnalysis: PortfolioAnalysis | null = useMemo(() => {
    if (normalizedResults?.portfolioAnalysis) return normalizedResults.portfolioAnalysis;
    if (state.raw?.portfolio_analysis) return state.raw.portfolio_analysis;
    return null;
  }, [normalizedResults, state.raw]);

  const taxCalculations = useMemo(() => {
    if (!normalizedResults) return null;
    const taxReport = normalizedResults.taxReport ?? state.raw?.tax_report;
    const taxAnalysis = normalizedResults.taxAnalysis ?? state.raw?.tax_analysis;
    if (!taxReport?.summary?.estimated_tax_liability) return null;
    const estimated = taxReport.summary.estimated_tax_liability || {};
    const sectionPools =
      taxAnalysis?.capital_gains?.section_104_pools || estimated.section_104_pools || {};
    return { sectionPools };
  }, [normalizedResults, state.raw]);

  const comprehensiveTax = useMemo(() => {
    if (!normalizedResults) return null;
    const taxYear = state.wizardData?.taxYear || normalizedResults.taxYear || '2025-2026';
    return calculateComprehensiveTax(normalizedResults, state.wizardData, taxYear);
  }, [normalizedResults, state.wizardData]);

  const disposalEvents: DisposalEvent[] = useMemo(() =>
    Array.isArray(state.raw?.disposal_events) ? state.raw.disposal_events : [],
    [state.raw]
  );

  const taxYear = normalizedResults?.taxYear || state.wizardData?.taxYear || '2025-2026';
  const aea = UK_AEA[taxYear] ?? 3000;

  // ── No data guard ──
  if (!normalizedResults) {
    return (
      <>
        <style>{PRINT_STYLES}</style>
        <div className="screen-only">
          <button className="btn-back" onClick={() => navigate('/calculator')}>← Back to Calculator</button>
        </div>
        <div className="report-page" style={{ textAlign: 'center', paddingTop: '60px' }}>
          <h2 style={{ color: '#1a3a5c' }}>No Calculation Data</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>
            Please run a tax calculation first, then click "Print Results".
          </p>
          <button
            className="btn-print"
            style={{ margin: '20px auto 0', display: 'inline-flex' }}
            onClick={() => navigate('/calculator')}
          >
            Go to Calculator
          </button>
        </div>
      </>
    );
  }

  const metrics = normalizedResults.metrics;
  const totalProceedsForSummary = disposalEvents.length
    ? disposalEvents.reduce((s, d) => s + (d.net_proceeds || d.proceeds_gbp || 0), 0)
    : normalizedResults.disposals.reduce((s, d) => s + d.proceeds, 0);
  const netGainForSummary = comprehensiveTax?.totalNonPropertyGains ?? metrics.totalTaxLiability;

  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* Screen-only toolbar */}
      <div className="screen-only">
        <button className="btn-back" onClick={() => navigate('/results')}>← Back to Results</button>
        <button className="btn-print" onClick={() => window.print()}>
          🖨 Print / Save as PDF
        </button>
        <span className="screen-only-hint">
          Use browser's Print dialog → "Save as PDF" for best results (A4, no margins)
        </span>
      </div>

      {/* Report content */}
      <div className="report-page">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="report-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="report-title">UK Capital Gains Tax Report</div>
              <div className="report-subtitle">Prepared by CGT Tax Tool — cgttaxtool.uk</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '8pt', color: '#6c757d' }}>
              <div style={{ fontWeight: 600, color: '#1a3a5c', fontSize: '10pt' }}>
                Tax Year {taxYear}
              </div>
              <div>Generated: {today}</div>
              <div>Transactions: {state.raw?.transaction_count || normalizedResults.counts.disposals}</div>
            </div>
          </div>
          <div className="report-meta">
            <span>📊 Disposals: <strong>{normalizedResults.counts.disposals}</strong></span>
            <span>💰 Dividends: <strong>{normalizedResults.counts.dividends}</strong></span>
            <span>📈 Holdings: <strong>{normalizedResults.counts.holdings}</strong></span>
            <span>🏦 AEA: <strong>{gbp(aea, 0)}</strong></span>
          </div>
        </div>

        {/* ── Section 1: Executive Summary ───────────────────────────────── */}
        <div className="section no-break">
          <div className="section-header"><span>Section 1 — Executive Summary</span></div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Total Tax Liability</div>
              <div className={`kpi-value ${metrics.totalTaxLiability > 0 ? 'negative' : ''}`}>
                {gbp(metrics.totalTaxLiability)}
              </div>
              <div className="kpi-note">CGT + Dividend Tax</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Portfolio Value</div>
              <div className="kpi-value">{gbp(metrics.portfolioValue)}</div>
              <div className="kpi-note">Current Market Value (£)</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Disposal Proceeds</div>
              <div className="kpi-value">{gbp(totalProceedsForSummary)}</div>
              <div className="kpi-note">Net of commissions</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Net Capital Gain / Loss</div>
              <div className={`kpi-value ${netGainForSummary >= 0 ? 'positive' : 'negative'}`}>
                {gbp(netGainForSummary)}
              </div>
              <div className="kpi-note">Before AEA deduction</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Annual Exempt Amount</div>
              <div className="kpi-value">{gbp(aea, 0)}</div>
              <div className="kpi-note">HMRC AEA {taxYear}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Return</div>
              <div className={`kpi-value ${metrics.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
                {metrics.totalReturnPercent.toFixed(2)}%
              </div>
              <div className="kpi-note">Overall portfolio performance</div>
            </div>
          </div>
        </div>

        {/* ── Section 2: CGT Calculation ─────────────────────────────────── */}
        <CGTCalculation
          taxYear={taxYear}
          disposalEvents={disposalEvents}
          normalizedResults={normalizedResults}
        />

        {/* ── Section 3: Disposal Schedule ───────────────────────────────── */}
        <DisposalSchedule
          disposalEvents={disposalEvents}
          fallbackDisposals={normalizedResults.disposals}
        />

        {/* ── Section 4: Section 104 Pools ───────────────────────────────── */}
        {taxCalculations && (
          <Section104Pools
            pools={taxCalculations.sectionPools}
            asAtDate={new Date().toISOString().split('T')[0]}
          />
        )}

        {/* ── Section 5: Portfolio Holdings ──────────────────────────────── */}
        <PortfolioHoldings portfolioAnalysis={portfolioAnalysis} />

        {/* ── Section 6: Dividends ───────────────────────────────────────── */}
        <DividendsTable dividends={normalizedResults.dividends} />

        {/* ── Section 7: Currency Balances ───────────────────────────────── */}
        <CurrencyBalancesSection currencyBalances={state.raw?.currency_balances} />

        {/* ── Disclaimer ─────────────────────────────────────────────────── */}
        <div className="disclaimer">
          <strong>Important Disclaimer:</strong> This report is generated automatically by CGT Tax Tool (cgttaxtool.uk) based on the transaction data you provided.
          It is intended as a guide only and does not constitute professional tax advice. Tax calculations use HMRC Section 104 pooling rules (TCGA 1992),
          same-day identification (s.105), and 30-day bed &amp; breakfast rules (s.106A). CGT rates reflect post-October 2024 changes (18%/24%).
          The Annual Exempt Amount for {taxYear} is £{aea.toLocaleString('en-GB')}.
          Always verify figures with a qualified accountant or HMRC before filing your Self Assessment (SA108).
          The provider accepts no liability for errors or omissions. Report generated: {today}.
        </div>
      </div>
    </>
  );
};

export default PrintReportPage;
