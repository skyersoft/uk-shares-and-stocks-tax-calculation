import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TimelineEvent } from '../../types/timeline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PortfolioTimelineChartProps {
  events: TimelineEvent[];
  className?: string;
}

const YEAR_BOUNDARY_TYPES = new Set(['YEAR_END', 'CURRENT_DATE']);

/**
 * Formats a date string "YYYY-MM-DD" to a short label like "Jun 2024".
 */
function fmtDate(isoDate: string): string {
  const [y, m] = isoDate.split('-');
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

/**
 * Format GBP amount with k/m suffix for tooltip readability.
 */
function fmtGbp(n: number): string {
  const abs = Math.abs(n);
  const prefix = n < 0 ? '-£' : '£';
  if (abs >= 1_000_000) return prefix + (abs / 1_000_000).toFixed(2) + 'm';
  if (abs >= 1_000) return prefix + (abs / 1_000).toFixed(1) + 'k';
  return prefix + abs.toFixed(2);
}

export const PortfolioTimelineChart: React.FC<PortfolioTimelineChartProps> = ({
  events,
  className = '',
}) => {
  const { labels, datasets, yearEndIndices } = useMemo(() => {
    const labels = events.map((e) => fmtDate(e.event_date));

    const unrealisedValue = events.map((e) => e.unrealised_value_gbp);
    const unrealisedGL = events.map((e) => e.unrealised_gain_loss_gbp);
    const realisedGL = events.map((e) => e.realised_gain_loss_gbp);
    const realisedTax = events.map((e) => e.realised_tax_gbp);
    const income = events.map((e) => e.income_gbp);

    // Indices of YEAR_END / CURRENT_DATE for special point styling
    const yearEndIndices = events
      .map((e, i) => ({ i, type: e.event_type }))
      .filter((x) => YEAR_BOUNDARY_TYPES.has(x.type))
      .map((x) => x.i);

    const pointRadius = events.map((_, i) =>
      yearEndIndices.includes(i) ? 7 : 2
    );
    const pointStyle = events.map((e) =>
      e.event_type === 'YEAR_END'
        ? 'rectRot'        // diamond
        : e.event_type === 'CURRENT_DATE'
        ? 'star'
        : 'circle'
    );

    const datasets: ChartData<'line'>['datasets'] = [
      {
        label: 'Unrealised Value',
        data: unrealisedValue,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.08)',
        tension: 0.3,
        fill: false,
        pointRadius,
        pointStyle,
        borderWidth: 2,
      },
      {
        label: 'Unrealised G/L',
        data: unrealisedGL,
        borderColor: '#198754',
        backgroundColor: 'rgba(25,135,84,0.08)',
        tension: 0.3,
        fill: false,
        pointRadius,
        pointStyle,
        borderWidth: 1.5,
      },
      {
        label: 'Realised G/L',
        data: realisedGL,
        borderColor: '#fd7e14',
        backgroundColor: 'rgba(253,126,20,0.08)',
        tension: 0.3,
        fill: false,
        pointRadius,
        pointStyle,
        borderWidth: 1.5,
      },
      {
        label: 'Realised Tax',
        data: realisedTax,
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220,53,69,0.08)',
        tension: 0.3,
        fill: false,
        pointRadius,
        pointStyle,
        borderWidth: 1.5,
      },
      {
        label: 'Income',
        data: income,
        borderColor: '#6f42c1',
        backgroundColor: 'rgba(111,66,193,0.08)',
        tension: 0.3,
        fill: false,
        pointRadius,
        pointStyle,
        borderWidth: 1.5,
      },
    ];

    return { labels, datasets, yearEndIndices };
  }, [events]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx === undefined) return '';
            const ev = events[idx];
            return `${ev.label} · ${ev.event_date}`;
          },
          label: (item) => {
            return ` ${item.dataset.label}: ${fmtGbp(item.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          font: { size: 11 },
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          callback: (v) => fmtGbp(Number(v)),
          font: { size: 11 },
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  if (events.length === 0) {
    return (
      <div className={`text-center text-muted py-5 ${className}`}>
        <i className="fas fa-chart-line fa-3x mb-3 opacity-25"></i>
        <p>No timeline data available.</p>
      </div>
    );
  }

  return (
    <div className={`portfolio-timeline-chart ${className}`}>
      <Line data={{ labels, datasets }} options={options} />
      {yearEndIndices.length > 0 && (
        <p className="text-muted small text-center mt-2">
          <span className="me-3">
            <i className="fas fa-diamond me-1 text-warning"></i>Tax Year End
          </span>
          <span>
            <i className="fas fa-star me-1 text-primary"></i>Today
          </span>
        </p>
      )}
    </div>
  );
};
