'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  blue: '#2563EB',
  green: '#059669',
  amber: '#D97706',
  red: '#DC2626',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  hover: '#F1F5F9',
  indigo: '#4F46E5',
  slate: '#475569',
};

const cardStyle = {
  background: C.card,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  border: `1px solid ${C.border}`,
  padding: '20px 24px',
};

const fontFamily = "'Inter', system-ui, sans-serif";

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

function pct(a, b) {
  if (!b || b === 0) return 0;
  return ((a / b) * 100).toFixed(1);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ height = 80, borderRadius = 12 }) {
  return (
    <div
      style={{
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, accentColor, subtext }) {
  return (
    <div
      style={{
        ...cardStyle,
        borderLeft: `4px solid ${accentColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 500, fontFamily }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: C.textPrimary,
          fontFamily,
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}
      >
        {fmt(value)}
        <span style={{ fontSize: 14, fontWeight: 400, color: C.textSecondary, marginLeft: 4 }}>
          pcs
        </span>
      </div>
      {subtext && (
        <div style={{ fontSize: 12, color: C.textSecondary, fontFamily }}>{subtext}</div>
      )}
    </div>
  );
}

// ─── Brand Table ──────────────────────────────────────────────────────────────
function BrandTable({ brands }) {
  const sorted = useMemo(
    () => [...(brands || [])].sort((a, b) => (b.production || 0) - (a.production || 0)).slice(0, 10),
    [brands]
  );

  function effColor(eff) {
    if (eff >= 95) return C.green;
    if (eff >= 90) return C.amber;
    return C.red;
  }

  return (
    <div style={{ ...cardStyle, flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: 15,
          fontWeight: 700,
          color: C.textPrimary,
          fontFamily,
        }}
      >
        🏷️ Brand Performance (Top 10)
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily, fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Brand', 'Production', 'Sales', 'Stock', 'Efficiency'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    textAlign: h === 'Brand' ? 'left' : 'right',
                    color: C.textSecondary,
                    fontWeight: 600,
                    borderBottom: `1px solid ${C.border}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const eff = parseFloat(pct(row.production, row.production + (row.rejected || 0)));
              const effVal = parseFloat(pct(row.sales, row.production));
              return (
                <tr
                  key={row.brand}
                  style={{
                    background: i % 2 === 0 ? C.card : C.bg,
                    transition: 'background 0.15s',
                  }}
                >
                  <td
                    style={{
                      padding: '8px 10px',
                      fontWeight: 600,
                      color: C.textPrimary,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {row.brand}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      color: C.textPrimary,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {fmt(row.production)}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      color: C.textPrimary,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {fmt(row.sales)}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      color: C.textPrimary,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {fmt(row.stock)}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <span
                      style={{
                        background: effColor(effVal) + '18',
                        color: effColor(effVal),
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {effVal}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Grade Donut ──────────────────────────────────────────────────────────────
function GradeDonut({ grade, totalCuring }) {
  const data = {
    labels: ['1st Grade', '2nd Grade', 'Rejected'],
    datasets: [
      {
        data: [
          grade?.first_grade || 0,
          grade?.second_grade || 0,
          grade?.rejected_grade || 0,
        ],
        backgroundColor: [C.green, C.amber, C.red],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const opts = {
    responsive: true,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: fontFamily, size: 12 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${fmt(ctx.raw)} pcs (${pct(ctx.raw, totalCuring)}%)`,
        },
      },
    },
  };

  // Center label plugin
  const centerPlugin = {
    id: 'centerLabel',
    beforeDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.textPrimary;
      ctx.font = `700 20px ${fontFamily}`;
      ctx.fillText(fmt(totalCuring), cx, cy - 8);
      ctx.font = `400 11px ${fontFamily}`;
      ctx.fillStyle = C.textSecondary;
      ctx.fillText('Total Curing', cx, cy + 12);
      ctx.restore();
    },
  };

  return (
    <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: 15,
          fontWeight: 700,
          color: C.textPrimary,
          fontFamily,
        }}
      >
        🎯 Grade Distribution
      </h3>
      <div style={{ maxWidth: 300, margin: '0 auto' }}>
        <Doughnut data={data} options={opts} plugins={[centerPlugin]} />
      </div>
    </div>
  );
}

// ─── Daily Trend Chart ────────────────────────────────────────────────────────
function DailyTrendChart({ timeline, monthLabel }) {
  const labels = (timeline || []).map((d) => d.date);
  const curingData = (timeline || []).map((d) => d.curing || 0);
  const salesData = (timeline || []).map((d) => d.total_sales || 0);

  const data = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Curing',
        data: curingData,
        backgroundColor: 'rgba(37,99,235,0.65)',
        borderRadius: 4,
        order: 2,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Sales',
        data: salesData,
        borderColor: '#F97316',
        backgroundColor: 'rgba(249,115,22,0.08)',
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.35,
        fill: true,
        order: 1,
        yAxisID: 'y',
      },
    ],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { family: fontFamily, size: 12 }, usePointStyle: true, padding: 16 },
      },
      title: {
        display: true,
        text: `Daily Production & Sales Trend — ${monthLabel || ''}`,
        font: { family: fontFamily, size: 14, weight: '600' },
        color: C.textPrimary,
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)} pcs`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: fontFamily, size: 11 }, color: C.textSecondary },
      },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: {
          font: { family: fontFamily, size: 11 },
          color: C.textSecondary,
          callback: (v) => fmt(v),
        },
      },
    },
  };

  return (
    <div style={{ ...cardStyle }}>
      <div style={{ height: 300 }}>
        <Bar data={data} options={opts} />
      </div>
    </div>
  );
}

// ─── SKU Table ────────────────────────────────────────────────────────────────
const EXCLUDED_BRANDS = ['Return From Market', 'Cycle Tyre Scrap'];
const PAGE_SIZE = 25;

function SkuTable({ items }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('curing_qty');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const excluded = useMemo(
    () => (items || []).filter((it) => EXCLUDED_BRANDS.includes(it.brand)),
    [items]
  );

  const filtered = useMemo(() => {
    let arr = (items || []).filter((it) => !EXCLUDED_BRANDS.includes(it.brand));
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (it) =>
          (it.sku || '').toLowerCase().includes(q) ||
          (it.size || '').toLowerCase().includes(q) ||
          (it.brand || '').toLowerCase().includes(q) ||
          (it.material || '').toLowerCase().includes(q)
      );
    }
    arr = [...arr].sort((a, b) => {
      const av = a[sortCol] ?? 0;
      const bv = b[sortCol] ?? 0;
      return sortAsc ? av - bv : bv - av;
    });
    return arr;
  }, [items, search, sortCol, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col) {
    if (sortCol === col) setSortAsc((v) => !v);
    else {
      setSortCol(col);
      setSortAsc(false);
    }
    setPage(1);
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <span style={{ color: C.border }}>↕</span>;
    return <span style={{ color: C.blue }}>{sortAsc ? '↑' : '↓'}</span>;
  }

  const thStyle = (col, align = 'right') => ({
    padding: '10px 10px',
    textAlign: align,
    color: C.textSecondary,
    fontWeight: 600,
    borderBottom: `2px solid ${C.border}`,
    whiteSpace: 'nowrap',
    fontSize: 12,
    cursor: ['curing_qty', 'monthly_sale'].includes(col) ? 'pointer' : 'default',
    userSelect: 'none',
    background: C.bg,
  });

  return (
    <div style={{ ...cardStyle }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily }}>
          📋 SKU-Level Details
        </h3>
        <input
          type="text"
          placeholder="Search SKU, size, brand, material…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            fontSize: 13,
            fontFamily,
            outline: 'none',
            width: 260,
            color: C.textPrimary,
            background: C.bg,
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thStyle(null, 'left')}>#</th>
              <th style={thStyle(null, 'left')}>SKU</th>
              <th style={thStyle(null, 'left')}>Size</th>
              <th style={thStyle(null, 'left')}>Box</th>
              <th style={thStyle(null, 'left')}>Mat.</th>
              <th style={thStyle(null, 'left')}>Brand</th>
              <th style={thStyle('curing_qty')} onClick={() => toggleSort('curing_qty')}>
                Curing <SortIcon col="curing_qty" />
              </th>
              <th style={thStyle('monthly_production')}>1st Grade</th>
              <th style={thStyle('second_stock')}>2nd Grade</th>
              <th style={thStyle('rejected_qty')}>Rejected</th>
              <th style={thStyle('monthly_sale')} onClick={() => toggleSort('monthly_sale')}>
                Sales <SortIcon col="monthly_sale" />
              </th>
              <th style={thStyle('stock')}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const inactive = !row.curing_qty && !row.monthly_sale;
              const active = row.monthly_production > 0;
              const globalIdx = (page - 1) * PAGE_SIZE + i + 1;
              return (
                <tr
                  key={row.id}
                  style={{
                    background: active
                      ? '#EFF6FF'
                      : i % 2 === 0
                      ? C.card
                      : C.bg,
                  }}
                >
                  <td style={{ padding: '7px 10px', color: C.textSecondary, borderBottom: `1px solid ${C.border}`, opacity: inactive ? 0.45 : 1 }}>{globalIdx}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: inactive ? C.textSecondary : C.textPrimary, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{row.sku}</td>
                  <td style={{ padding: '7px 10px', color: inactive ? C.textSecondary : C.textPrimary, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{row.size}</td>
                  <td style={{ padding: '7px 10px', color: C.textSecondary, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{row.box_type}</td>
                  <td style={{ padding: '7px 10px', color: C.textSecondary, borderBottom: `1px solid ${C.border}` }}>{row.material}</td>
                  <td style={{ padding: '7px 10px', color: inactive ? C.textSecondary : C.textPrimary, borderBottom: `1px solid ${C.border}`, fontWeight: 500 }}>{row.brand}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: inactive ? C.textSecondary : C.blue, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{fmt(row.curing_qty)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: inactive ? C.textSecondary : C.green, fontWeight: 500, borderBottom: `1px solid ${C.border}` }}>{fmt(row.monthly_production)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: row.second_stock > 0 ? C.amber : C.textSecondary, borderBottom: `1px solid ${C.border}` }}>{fmt(row.second_stock)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: row.rejected_qty > 0 ? C.red : C.textSecondary, borderBottom: `1px solid ${C.border}` }}>{fmt(row.rejected_qty)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: inactive ? C.textSecondary : C.textPrimary, fontWeight: 500, borderBottom: `1px solid ${C.border}` }}>{fmt(row.monthly_sale)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: inactive ? C.textSecondary : C.textPrimary, borderBottom: `1px solid ${C.border}` }}>{fmt(row.stock)}</td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: '24px', textAlign: 'center', color: C.textSecondary, fontFamily }}>
                  No items match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, color: C.textSecondary, fontFamily }}>
          Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items
          {excluded.length > 0 && (
            <span style={{ marginLeft: 12, color: C.amber }}>
              ({excluded.length} excluded: Return From Market / Scrap)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: page === 1 ? C.bg : C.card,
              color: page === 1 ? C.textSecondary : C.textPrimary,
              fontFamily,
              fontSize: 13,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            ← Previous
          </button>
          <span
            style={{
              padding: '6px 14px',
              fontSize: 13,
              color: C.textSecondary,
              fontFamily,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Page {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: page >= totalPages ? C.bg : C.card,
              color: page >= totalPages ? C.textSecondary : C.textPrimary,
              fontFamily,
              fontSize: 13,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CycleTyreReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');

  const fetchData = useCallback(async (month) => {
    setLoading(true);
    setError(null);
    try {
      const params = month ? `?month=${month}` : '';
      const res = await apiGet(`/api/cycletyres/monthly-report/${params}`);
      setData(res);
      if (res.selected_month && !month) {
        setSelectedMonth(res.selected_month);
      }
    } catch (err) {
      setError('Failed to load data. Retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData('');
  }, [fetchData]);

  function handleMonthChange(e) {
    const val = e.target.value;
    setSelectedMonth(val);
    fetchData(val);
  }

  const totals = data?.totals || {};
  const monthLabel =
    data?.available_months?.find((m) => m.value === data?.selected_month)?.label || '';
  const efficiency =
    totals.total_curing > 0
      ? pct(totals.total_monthly_production, totals.total_curing)
      : '0.0';

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { box-sizing: border-box; }
        input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        select:focus { border-color: #2563EB !important; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        button:hover:not(:disabled) { background: #F1F5F9 !important; }
      `}</style>

      <Navbar />

      <div
        style={{
          background: C.bg,
          minHeight: '100vh',
          fontFamily,
          color: C.textPrimary,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '24px 20px 48px',
          }}
        >
          {/* ── SECTION 1: Header ──────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 28,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>🚲</span>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.textPrimary,
                    letterSpacing: '-0.3px',
                  }}
                >
                  Cycle Tyre Monthly Analysis
                </h1>
              </div>
              <p style={{ margin: '4px 0 0 38px', fontSize: 13, color: C.textSecondary }}>
                Radhu Industries — Production & Sales Report
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {monthLabel && (
                <span
                  style={{
                    padding: '6px 14px',
                    background: `${C.blue}12`,
                    color: C.blue,
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {monthLabel}
                </span>
              )}
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                style={{
                  padding: '8px 36px 8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  fontFamily,
                  color: C.textPrimary,
                  background: C.card,
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                {(data?.available_months || []).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {error && (
                <button
                  onClick={() => fetchData(selectedMonth)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: `1px solid ${C.red}`,
                    color: C.red,
                    background: C.card,
                    fontSize: 13,
                    fontFamily,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  ↺ Retry
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div
              style={{
                ...cardStyle,
                borderLeft: `4px solid ${C.red}`,
                color: C.red,
                fontFamily,
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* ── SECTION 2: KPI Cards ───────────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={110} />)
            ) : (
              <>
                <KpiCard
                  icon="🏭"
                  label="Total Curing"
                  value={totals.total_curing}
                  accentColor={C.blue}
                  subtext={`Efficiency: ${efficiency}% 1st Grade yield`}
                />
                <KpiCard
                  icon="✅"
                  label="1st Grade Production"
                  value={totals.total_monthly_production}
                  accentColor={C.green}
                />
                <KpiCard
                  icon="❌"
                  label="Rejected (C-Grade)"
                  value={totals.total_rejected}
                  accentColor={C.red}
                  subtext={
                    totals.total_curing > 0
                      ? `Reject rate: ${pct(totals.total_rejected, totals.total_curing)}%`
                      : undefined
                  }
                />
                <KpiCard
                  icon="🛒"
                  label="Total Sales"
                  value={totals.total_monthly_sale}
                  accentColor={C.indigo}
                />
                <KpiCard
                  icon="📦"
                  label="1st Grade Stock"
                  value={totals.total_stock}
                  accentColor={C.slate}
                />
                <KpiCard
                  icon="📊"
                  label="2nd Grade Stock"
                  value={totals.total_second_stock}
                  accentColor={C.amber}
                />
              </>
            )}
          </div>

          {/* ── SECTION 3: Brand Table + Donut ────────────────────────── */}
          {!loading && !error && (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 24,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '2 1 400px', minWidth: 0 }}>
                  <BrandTable brands={data?.brand_breakdown} />
                </div>
                <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                  <GradeDonut
                    grade={data?.grade_distribution}
                    totalCuring={totals.total_curing}
                  />
                </div>
              </div>

              {/* ── SECTION 4: Daily Trend ─────────────────────────────── */}
              <div style={{ marginBottom: 24 }}>
                <DailyTrendChart
                  timeline={data?.daily_timeline}
                  monthLabel={monthLabel}
                />
              </div>

              {/* ── SECTION 5: SKU Table ───────────────────────────────── */}
              <SkuTable items={data?.items} />
            </>
          )}

          {/* Loading state for lower sections */}
          {loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 2 }}><Skeleton height={320} /></div>
                <div style={{ flex: 1 }}><Skeleton height={320} /></div>
              </div>
              <Skeleton height={320} />
              <Skeleton height={420} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
