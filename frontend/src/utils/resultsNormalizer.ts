import {
  CalculationResult,
  MarketSummary,
  NormalizedDisposal,
  NormalizedDividend,
  NormalizedHolding,
  NormalizedResults,
  PortfolioAnalysis,
  ResultsMetrics,
  TaxCalculation
} from '../types/calculation';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toNumber = (value: unknown, fallback = 0): number => {
  if (isFiniteNumber(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDisposals = (raw: any): NormalizedDisposal[] => {
  const disposals: any[] =
    raw?.tax_analysis?.capital_gains?.disposals ||
    raw?.tax_report?.disposals ||
    [];

  if (!Array.isArray(disposals)) return [];

  return disposals.map((disposal: any): NormalizedDisposal => {
    const proceeds = toNumber(disposal?.proceeds);
    const costBasis = toNumber(disposal?.cost_basis);
    const expenses = toNumber(disposal?.expenses);
    const gainLoss =
      disposal?.gain_or_loss != null
        ? toNumber(disposal.gain_or_loss)
        : proceeds - costBasis - expenses;

    const rawDate =
      disposal?.disposal_date || disposal?.sell_date || disposal?.date || '';
    const normalizedDate =
      typeof rawDate === 'string' && rawDate.includes('T')
        ? rawDate.split('T')[0]
        : typeof rawDate === 'string'
          ? rawDate.split(' ')[0] || rawDate
          : '';

    return {
      disposalDate: normalizedDate,
      symbol: disposal?.security?.symbol || disposal?.symbol || 'UNKNOWN',
      quantity: toNumber(disposal?.quantity),
      proceeds,
      costBasis,
      gainLoss,
      raw: disposal
    };
  });
};

const normalizeDividends = (raw: any): NormalizedDividend[] => {
  const dividends: any[] =
    raw?.tax_analysis?.dividend_income?.dividends ||
    raw?.tax_report?.dividend_income?.dividends ||
    [];

  if (!Array.isArray(dividends)) return [];

  return dividends.map((dividend: any): NormalizedDividend => {
    const gross = toNumber(dividend?.amount_gbp);
    const withholding = toNumber(dividend?.withholding_tax_gbp);
    const net = gross - withholding;

    const rawDate = dividend?.payment_date || '';
    const normalizedDate =
      typeof rawDate === 'string' && rawDate.includes('T')
        ? rawDate.split('T')[0]
        : typeof rawDate === 'string'
          ? rawDate.split(' ')[0] || rawDate
          : '';

    return {
      paymentDate: normalizedDate,
      symbol:
        dividend?.security?.symbol ||
        dividend?.ticker ||
        dividend?.symbol ||
        'UNKNOWN',
      name: dividend?.security?.name || dividend?.name,
      grossAmount: gross,
      withholdingTax: withholding,
      netAmount: net,
      raw: dividend
    };
  });
};

const extractSymbolCandidates = (holding: any): string | null => {
  const candidates = [
    holding?.security?.symbol,
    holding?.security?.ticker,
    holding?.security?.security_id,
    holding?.security?.cusip,
    holding?.security?.isin,
    holding?.symbol,
    holding?.ticker,
    holding?.code,
    holding?.security_id
  ].filter((candidate) => typeof candidate === 'string' && candidate.trim() !== '');

  if (candidates.length > 0) return candidates[0];
  return null;
};

const computeHoldingReturnPct = (
  unrealizedGainLoss: number,
  totalCost: number,
  backendReturn?: unknown
): number => {
  const backendValue = toNumber(backendReturn, Number.NaN);
  if (!Number.isNaN(backendValue)) return backendValue;

  if (totalCost <= 0) return 0;
  return (unrealizedGainLoss / totalCost) * 100;
};

const normalizeHoldingsFromSummaries = (
  marketSummaries: Record<string, MarketSummary> | undefined | null
): NormalizedHolding[] => {
  if (!marketSummaries || typeof marketSummaries !== 'object') return [];

  const entries = Object.values(marketSummaries);
  if (!entries.length) return [];

  const normalized: NormalizedHolding[] = [];

  entries.forEach((summary) => {
    if (!summary?.holdings || !Array.isArray(summary.holdings)) return;

    summary.holdings.forEach((holding: any) => {
      const averageCostGBP =
        toNumber(holding?.average_cost_gbp) ||
        toNumber(holding?.avg_cost_gbp) ||
        toNumber(holding?.average_cost);

      const quantity = toNumber(holding?.quantity);
      const currentValueGBP =
        toNumber(holding?.current_value_gbp) ||
        toNumber(holding?.current_value) ||
        toNumber(holding?.value);

      const explicitTotalCost = holding?.total_cost_gbp;
      const totalCostGBP =
        explicitTotalCost != null
          ? toNumber(explicitTotalCost)
          : averageCostGBP * quantity;

      const explicitUnrealized = holding?.unrealized_gain_loss;
      const unrealizedGainLoss =
        explicitUnrealized != null
          ? toNumber(explicitUnrealized)
          : currentValueGBP - totalCostGBP;

      const returnPct = computeHoldingReturnPct(
        unrealizedGainLoss,
        totalCostGBP,
        holding?.total_return_pct
      );

      const symbol = extractSymbolCandidates(holding);
      const currency = summary?.currency || holding?.currency;

      normalized.push({
        symbol: symbol || (quantity > 100 ? 'MIXED PORTFOLIO' : 'UNKNOWN'),
        name:
          holding?.security?.name ||
          holding?.name ||
          holding?.security_name ||
          undefined,
        quantity,
        averageCostGBP,
        currentValueGBP,
        totalCostGBP,
        unrealizedGainLoss,
        returnPct,
        currency,
        raw: holding
      });
    });
  });

  return normalized;
};

const normalizeHoldingsFromPortfolioReport = (raw: any): NormalizedHolding[] => {
  const fallbackHoldings: any[] = [];

  if (Array.isArray(raw?.portfolio_report?.holdings)) {
    fallbackHoldings.push(...raw.portfolio_report.holdings);
  }

  if (raw?.portfolio_report?.markets) {
    Object.values(raw.portfolio_report.markets).forEach((market: any) => {
      if (Array.isArray(market?.holdings)) {
        fallbackHoldings.push(...market.holdings);
      }
    });
  }

  if (!fallbackHoldings.length) return [];

  return fallbackHoldings.map((holding: any): NormalizedHolding => {
    const averageCostGBP =
      toNumber(holding?.average_cost_gbp) ||
      toNumber(holding?.avg_cost_gbp) ||
      toNumber(holding?.average_cost);

    const quantity = toNumber(holding?.quantity);
    const currentValueGBP =
      toNumber(holding?.current_value_gbp) ||
      toNumber(holding?.current_value) ||
      toNumber(holding?.value);

    const explicitTotalCost = holding?.total_cost_gbp;
    const totalCostGBP =
      explicitTotalCost != null
        ? toNumber(explicitTotalCost)
        : averageCostGBP * quantity;

    const explicitUnrealized = holding?.unrealized_gain_loss;
    const unrealizedGainLoss =
      explicitUnrealized != null
        ? toNumber(explicitUnrealized)
        : currentValueGBP - totalCostGBP;

    const returnPct = computeHoldingReturnPct(
      unrealizedGainLoss,
      totalCostGBP,
      holding?.total_return_pct
    );

    return {
      symbol:
        holding?.security?.symbol ||
        holding?.symbol ||
        holding?.ticker ||
        'UNKNOWN',
      name: holding?.security?.name || holding?.name,
      quantity,
      averageCostGBP,
      currentValueGBP,
      totalCostGBP,
      unrealizedGainLoss,
      returnPct,
      currency: holding?.currency,
      raw: holding
    };
  });
};

const deepSearchHoldings = (raw: any): any[] => {
  const discovered: any[] = [];
  const visited = new WeakSet();
  const stack: Array<{ value: any; path: string }> = [{ value: raw, path: 'root' }];

  while (stack.length) {
    const { value, path } = stack.pop()!;

    if (!value || typeof value !== 'object') continue;
    if (visited.has(value)) continue;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        stack.push({ value: entry, path: `${path}[${index}]` });
      });
      continue;
    }

    Object.entries(value).forEach(([key, child]) => {
      const nextPath = `${path}.${key}`;
      if (key === 'holdings' && Array.isArray(child) && child.length) {
        discovered.push(...child);
      } else {
        stack.push({ value: child, path: nextPath });
      }
    });
  }

  return discovered;
};

const normalizeHoldings = (raw: any): NormalizedHolding[] => {
  const primary = normalizeHoldingsFromSummaries(raw?.portfolio_analysis?.market_summaries);
  if (primary.length) return primary;

  const fallback = normalizeHoldingsFromPortfolioReport(raw);
  if (fallback.length) return fallback;

  const deep = deepSearchHoldings(raw);
  if (!deep.length) return [];

  return deep.map((holding: any): NormalizedHolding => {
    const averageCostGBP =
      toNumber(holding?.average_cost_gbp) ||
      toNumber(holding?.avg_cost_gbp) ||
      toNumber(holding?.average_cost);

    const quantity = toNumber(holding?.quantity);
    const currentValueGBP =
      toNumber(holding?.current_value_gbp) ||
      toNumber(holding?.current_value) ||
      toNumber(holding?.value);

    const explicitTotalCost = holding?.total_cost_gbp;
    const totalCostGBP =
      explicitTotalCost != null
        ? toNumber(explicitTotalCost)
        : averageCostGBP * quantity;

    const explicitUnrealized = holding?.unrealized_gain_loss;
    const unrealizedGainLoss =
      explicitUnrealized != null
        ? toNumber(explicitUnrealized)
        : currentValueGBP - totalCostGBP;

    const returnPct = computeHoldingReturnPct(
      unrealizedGainLoss,
      totalCostGBP,
      holding?.total_return_pct
    );

    return {
      symbol: extractSymbolCandidates(holding) || 'UNKNOWN',
      name:
        holding?.security?.name ||
        holding?.name ||
        holding?.security_name ||
        undefined,
      quantity,
      averageCostGBP,
      currentValueGBP,
      totalCostGBP,
      unrealizedGainLoss,
      returnPct,
      currency: holding?.currency,
      raw: holding
    };
  });
};

const computeMetrics = (raw: any): ResultsMetrics => {
  const taxReport = raw?.tax_report || {};
  const portfolioReport = raw?.portfolio_report || {};
  const portfolioAnalysis = raw?.portfolio_analysis;

  const totalTaxLiability =
    toNumber(taxReport?.summary?.estimated_tax_liability?.total_estimated_tax) ||
    toNumber(taxReport?.summary?.estimated_tax_liability?.capital_gains_tax) +
      toNumber(taxReport?.summary?.estimated_tax_liability?.dividend_tax) +
      toNumber(taxReport?.summary?.estimated_tax_liability?.currency_gains_tax);

  const portfolioValue =
    toNumber(portfolioReport?.grand_total?.total_value) ||
    toNumber(portfolioAnalysis?.total_portfolio_value);

  const totalReturnPercent =
    toNumber(portfolioReport?.grand_total?.total_return_pct) ||
    (isFiniteNumber(portfolioAnalysis?.total_unrealized_gain_loss_percent)
      ? portfolioAnalysis.total_unrealized_gain_loss_percent
      : 0);

  return {
    totalTaxLiability,
    portfolioValue,
    totalReturnPercent
  };
};

const deriveTaxYear = (raw: any): string | null => {
  if (typeof raw?.tax_year === 'string') return raw.tax_year;
  if (typeof raw?.taxReport?.tax_year === 'string') return raw.taxReport.tax_year;
  if (typeof raw?.tax_report?.tax_year === 'string') return raw.tax_report.tax_year;
  return null;
};

const shouldShowCgtWarning = (taxYear: string | null): boolean =>
  taxYear === '2024-2025';

export const normalizeCalculationResults = (raw: CalculationResult | any): NormalizedResults => {
  const disposals = normalizeDisposals(raw);
  const dividends = normalizeDividends(raw);
  const holdings = normalizeHoldings(raw);
  const metrics = computeMetrics(raw);
  const taxYear = deriveTaxYear(raw);

  const portfolioAnalysis: PortfolioAnalysis | null = raw?.portfolio_analysis || null;
  const taxAnalysis: TaxCalculation | null = raw?.tax_analysis || null;

  return {
    taxYear,
    metrics,
    disposals,
    dividends,
    holdings,
    counts: {
      disposals: disposals.length,
      dividends: dividends.length,
      holdings: holdings.length
    },
    showCgtWarning: shouldShowCgtWarning(taxYear),
    portfolioAnalysis,
    taxAnalysis,
    taxReport: raw?.tax_report || null,
    portfolioReport: raw?.portfolio_report || null
  };
};
