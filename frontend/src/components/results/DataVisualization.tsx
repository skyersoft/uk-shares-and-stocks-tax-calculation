import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { PortfolioAnalysis, Holding, TaxCalculation } from '../../types/calculation';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DataVisualizationProps {
  portfolioAnalysis: PortfolioAnalysis;
  taxCalculations: TaxCalculation;
  className?: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  portfolioAnalysis,
  taxCalculations,
  className = '',
}) => {
  // Portfolio allocation by security
  const getAllocationData = (): ChartData => {
    // Get all holdings from all market summaries
    const allHoldings = Object.values(portfolioAnalysis.market_summaries)
      .flatMap(summary => summary.holdings)
      .sort((a: Holding, b: Holding) => b.current_value_gbp - a.current_value_gbp)
      .slice(0, 10); // Top 10 holdings

    return {
      labels: allHoldings.map((h: Holding) => h.security?.symbol || 'N/A'),
      datasets: [
        {
          label: 'Portfolio Value (£)',
          data: allHoldings.map((h: Holding) => h.current_value_gbp),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Gains/Losses by security
  const getGainsLossesData = (): ChartData => {
    const holdingsWithGains = Object.values(portfolioAnalysis.market_summaries)
      .flatMap(summary => summary.holdings)
      .map((h: Holding) => ({
        symbol: h.security?.symbol || 'N/A',
        gain: h.unrealized_gain_loss || 0,
      }))
      .sort((a: {symbol: string, gain: number}, b: {symbol: string, gain: number}) => Math.abs(b.gain) - Math.abs(a.gain))
      .slice(0, 15); // Top 15 by absolute gain/loss

    return {
      labels: holdingsWithGains.map((h: {symbol: string, gain: number}) => h.symbol),
      datasets: [
        {
          label: 'Unrealized Gains/Losses (£)',
          data: holdingsWithGains.map((h: {symbol: string, gain: number}) => h.gain),
          backgroundColor: holdingsWithGains.map((h: {symbol: string, gain: number}) => 
            h.gain >= 0 ? '#28a745' : '#dc3545'
          ),
          borderColor: '#dee2e6',
          borderWidth: 1,
        },
      ],
    };
  };

  // Currency breakdown
  const getCurrencyData = (): ChartData => {
    const currencyTotals = portfolioAnalysis.market_summaries;
    const currencies = Object.keys(currencyTotals);

    if (currencies.length <= 1) {
      return {
        labels: [currencies[0] || 'GBP'],
        datasets: [
          {
            label: 'Portfolio Value',
            data: [portfolioAnalysis.total_portfolio_value],
            backgroundColor: ['#36A2EB'],
          },
        ],
      };
    }

    return {
      labels: currencies,
      datasets: [
        {
          label: 'Value by Currency (£)',
          data: currencies.map(currency => currencyTotals[currency].total_market_value),
          backgroundColor: [
            '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
          ],
        },
      ],
    };
  };

  // Tax liability breakdown
  const getTaxData = (): ChartData => {
    const totalDisposals = taxCalculations.disposal_calculations?.length || 0;
    const taxableDisposals = taxCalculations.disposal_calculations?.filter(
      (d: any) => d.taxable_gain > 0
    ).length || 0;
    const lossDisposals = totalDisposals - taxableDisposals;

    return {
      labels: ['Taxable Gains', 'Losses/Zero Gains'],
      datasets: [
        {
          label: 'Number of Disposals',
          data: [taxableDisposals, lossDisposals],
          backgroundColor: ['#dc3545', '#28a745'],
        },
      ],
    };
  };

  // Chart options
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: £${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `£${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: £${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  const countOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            return `${context.label}: ${value} disposals`;
          },
        },
      },
    },
  };

  return (
    <div className={`data-visualization ${className}`}>
      <div className="row">
        {/* Portfolio Allocation */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Portfolio Allocation
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Doughnut data={getAllocationData()} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Currency Breakdown */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-globe me-2"></i>
                Currency Breakdown
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Doughnut data={getCurrencyData()} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Gains/Losses by Security */}
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Unrealized Gains/Losses by Security
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '400px' }}>
                <Bar data={getGainsLossesData()} options={barOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Tax Analysis */}
        {taxCalculations.total_tax_liability > 0 && (
          <div className="col-lg-6 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-receipt me-2"></i>
                  Tax Analysis
                </h5>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Doughnut data={getTaxData()} options={countOptions} />
                </div>
                <div className="mt-3">
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="border-end">
                        <h6 className="text-muted mb-1">Total Tax</h6>
                        <span className="fs-5 fw-bold text-danger">
                          £{taxCalculations.total_tax_liability.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="col-6">
                      <h6 className="text-muted mb-1">Disposals</h6>
                      <span className="fs-5 fw-bold text-info">
                        {taxCalculations.disposal_calculations?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className={`${taxCalculations.total_tax_liability > 0 ? 'col-lg-6' : 'col-12'} mb-4`}>
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Portfolio Summary
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">Total Holdings</h6>
                    <span className="fs-4 fw-bold text-primary">
                      {Object.values(portfolioAnalysis.market_summaries).reduce((total, summary) => total + summary.holdings.length, 0)}
                    </span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">Total Value</h6>
                    <span className="fs-4 fw-bold text-success">
                      £{portfolioAnalysis.total_portfolio_value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">Total Gains</h6>
                    <span className={`fs-4 fw-bold ${portfolioAnalysis.total_unrealized_gain_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                      £{portfolioAnalysis.total_unrealized_gain_loss.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-1">Currencies</h6>
                    <span className="fs-4 fw-bold text-info">
                      {Object.keys(portfolioAnalysis.market_summaries).length || 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;