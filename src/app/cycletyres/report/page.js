'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

// Chart.js imports
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
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CycleTyresReportWithCharts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRange, setCustomRange] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchReport = async (m, sd, ed) => {
    setLoading(true);
    let url = '/cycletyres/monthly-report/?';
    if (sd && ed) {
      url += `start_date=${sd}&end_date=${ed}`;
    } else if (m) {
      url += `month=${m}`;
    }
    const res = await apiGet(url);
    if (res) {
      setData(res);
      if (!m && res.selected_month) {
        setSelectedMonth(res.selected_month);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport('', '', '');
  }, []);

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    setCustomRange(false);
    setStartDate('');
    setEndDate('');
    fetchReport(val, '', '');
  };

  const handleApplyRange = () => {
    if (startDate && endDate) {
      setCustomRange(true);
      fetchReport('', startDate, endDate);
    }
  };

  const handleResetRange = () => {
    setCustomRange(false);
    setStartDate('');
    setEndDate('');
    fetchReport(selectedMonth, '', '');
  };

  const items = data?.items || [];
  const totals = data?.totals || {};
  const timeline = data?.daily_timeline || [];
  const brands = data?.brand_breakdown || [];
  const sizes = data?.size_breakdown || [];
  const grades = data?.grade_distribution || {};
  const availableMonths = data?.available_months || [];

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        (item.size || '').toLowerCase().includes(q) ||
        (item.box_type || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q) ||
        (item.material || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const isMobile = windowWidth < 768;

  const theme = {
    bg: darkMode ? '#090d16' : '#f8fafc',
    bg2: darkMode ? '#131b2e' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#0f172a',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#222f49' : '#e2e8f0',
    shadow: darkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.06)',
    cardHover: darkMode ? '#18223a' : '#f1f5f9',
    chartGrid: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };

  // 1. Timeline Chart Data
  const timelineChartData = {
    labels: timeline.map((t) => t.date),
    datasets: [
      {
        type: 'line',
        label: 'Total Curing (Press)',
        data: timeline.map((t) => t.curing),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.12)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        type: 'bar',
        label: '1st Grade (Packing)',
        data: timeline.map((t) => t.first_grade),
        backgroundColor: 'rgba(37, 99, 235, 0.85)',
        borderRadius: 6,
      },
      {
        type: 'bar',
        label: 'Total Sales (Dispatch)',
        data: timeline.map((t) => t.total_sales),
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderRadius: 6,
      },
    ],
  };

  // 2. Brand Breakdown Chart Data
  const brandChartData = {
    labels: brands.map((b) => b.brand),
    datasets: [
      {
        label: 'Production (Pcs)',
        data: brands.map((b) => b.production),
        backgroundColor: '#2563eb',
        borderRadius: 8,
      },
      {
        label: 'Sales (Pcs)',
        data: brands.map((b) => b.sales),
        backgroundColor: '#f59e0b',
        borderRadius: 8,
      },
      {
        label: 'Current Stock',
        data: brands.map((b) => b.stock),
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
    ],
  };

  // 3. Grade Quality Distribution Doughnut Data
  const gradeDoughnutData = {
    labels: ['1st Grade (Black)', '2nd Grade (B Grade)', 'Rejected (Scrap)', 'RFM OK Stock'],
    datasets: [
      {
        data: [
          grades.first_grade || 0,
          grades.second_grade || 0,
          grades.rejected_grade || 0,
          grades.rfm_stock || 0,
        ],
        backgroundColor: ['#2563eb', '#f59e0b', '#ef4444', '#7c3aed'],
        borderWidth: 2,
        borderColor: darkMode ? '#131b2e' : '#ffffff',
        hoverOffset: 8,
      },
    ],
  };

  // 4. Top Moving Sizes Bar Data
  const sizeBarData = {
    labels: sizes.map((s) => s.size),
    datasets: [
      {
        label: 'Production Output',
        data: sizes.map((s) => s.production),
        backgroundColor: 'rgba(13, 148, 136, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Market Sales',
        data: sizes.map((s) => s.sales),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.text,
          font: { size: 11, weight: 'bold' },
          boxWidth: 14,
        },
      },
      tooltip: {
        backgroundColor: darkMode ? '#0f172a' : '#ffffff',
        titleColor: darkMode ? '#f8fafc' : '#0f172a',
        bodyColor: darkMode ? '#cbd5e1' : '#334155',
        borderColor: theme.border,
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { color: theme.chartGrid },
        ticks: { color: theme.text2, font: { size: 10 } },
      },
      y: {
        grid: { color: theme.chartGrid },
        ticks: { color: theme.text2, font: { size: 10 } },
      },
    },
  };

  const exportCSV = () => {
    const headers = ['SIZE', 'BOX TYPE', 'MATERIAL', 'BRAND', 'CURING', 'MONTHLY PROD', 'REJECTED', 'MONTHLY SALE', '1ST GRADE STOCK', '2ND GRADE STOCK', 'TOTAL STOCK'];
    const rows = filteredItems.map((item) => [
      item.size,
      item.box_type,
      item.material,
      item.brand,
      item.curing_qty || 0,
      item.monthly_production || 0,
      item.rejected_qty || 0,
      item.monthly_sale || 0,
      item.stock || 0,
      item.second_stock || 0,
      (item.stock || 0) + (item.second_stock || 0) + (item.rfm_stock || 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cycle_tyres_monthly_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'all 0.3s ease' }}>
      <Navbar />

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: isMobile ? '12px' : '24px' }}>
        {/* Header with AI Hub link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #059669, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                🚴 Cycle Tyre Analytics & Monthly Report
              </h1>
            </div>
            <p style={{ color: theme.text2, fontSize: '0.85rem', marginTop: '4px' }}>
              Multi-dimensional production curves, brand performance, sales trends & quality breakdown
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* AI Predictive Intelligence Button */}
            <Link
              href="/cycletyres/ai-analytics"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb, #0d9488)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🤖</span>
              <span>AI Demand & Sales Predictor</span>
              <span>➔</span>
            </Link>

            <button
              onClick={exportCSV}
              style={{ padding: '8px 18px', borderRadius: '50px', border: `2px solid #10b981`, backgroundColor: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
            >
              📥 CSV
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ padding: '8px 18px', borderRadius: '50px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
            >
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div style={{
          backgroundColor: theme.bg2, borderRadius: '16px', padding: isMobile ? '12px' : '18px',
          boxShadow: theme.shadow, border: `2px solid ${theme.border}`, marginBottom: '20px',
          display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end',
        }}>
          {/* Month Dropdown */}
          <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>📅 SELECT MONTH</label>
            <select
              value={customRange ? '' : selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="">-- Choose Month --</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>📆 START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>📆 END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleApplyRange}
              disabled={!startDate || !endDate}
              style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: (!startDate || !endDate) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700, opacity: (!startDate || !endDate) ? 0.5 : 1 }}
            >
              ✅ Apply Range
            </button>
            <button
              onClick={handleResetRange}
              style={{ padding: '9px 18px', borderRadius: '10px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
            >
              🔄 Reset
            </button>
          </div>

          {/* Search */}
          <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>🔍 SEARCH TYRE</label>
            <input
              type="text"
              placeholder="Search size, brand, material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: theme.bg2, borderRadius: '14px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: `6px solid #10b981`, boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🏭 Total Production (Packing)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{totals.total_monthly_production ?? 0} pcs</div>
            <div style={{ fontSize: '0.75rem', color: theme.text2, marginTop: '2px' }}>Total Curing: {totals.total_curing ?? 0} pcs</div>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '14px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: `6px solid #ef4444`, boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🚛 Total Market Sales</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{totals.total_monthly_sale ?? 0} pcs</div>
            <div style={{ fontSize: '0.75rem', color: theme.text2, marginTop: '2px' }}>Dispatched across dealers</div>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '14px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: `6px solid #2563eb`, boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>📦 1st Grade OK Stock</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{totals.total_stock ?? 0} pcs</div>
            <div style={{ fontSize: '0.75rem', color: theme.text2, marginTop: '2px' }}>2nd Grade: {totals.total_second_stock ?? 0} pcs</div>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '14px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: `6px solid #7c3aed`, boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>📊 Combined Grand Stock</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{totals.total_combined_stock ?? 0} pcs</div>
            <div style={{ fontSize: '0.75rem', color: theme.text2, marginTop: '2px' }}>RFM Stock: {totals.total_rfm_stock ?? 0} pcs</div>
          </div>
        </div>

        {/* Complex Responsive Charts Grid (2x2) */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
          
          {/* Chart 1: Production vs Sales Timeline */}
          <div style={{ backgroundColor: theme.bg2, borderRadius: '18px', padding: '20px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.text }}>
                📈 Production vs Sales Daily Trajectory
              </h3>
              <span style={{ fontSize: '0.75rem', color: theme.text2, fontWeight: 600 }}>Daily Trend</span>
            </div>
            <div style={{ height: '320px' }}>
              {timeline.length > 0 ? (
                <Line data={timelineChartData} options={chartOptions} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text2 }}>No timeline data for selected period</div>
              )}
            </div>
          </div>

          {/* Chart 2: Grade Quality Distribution Doughnut */}
          <div style={{ backgroundColor: theme.bg2, borderRadius: '18px', padding: '20px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.text }}>
                🥧 Quality & Grade Composition
              </h3>
              <span style={{ fontSize: '0.75rem', color: theme.text2, fontWeight: 600 }}>Output Ratio</span>
            </div>
            <div style={{ height: '320px', position: 'relative' }}>
              <Doughnut
                data={gradeDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: theme.text, font: { size: 11, weight: 'bold' } } },
                  },
                }}
              />
            </div>
          </div>

          {/* Chart 3: Brand Performance Bar Chart */}
          <div style={{ backgroundColor: theme.bg2, borderRadius: '18px', padding: '20px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.text }}>
                🏷️ Brand Production vs Sales Comparison
              </h3>
              <span style={{ fontSize: '0.75rem', color: theme.text2, fontWeight: 600 }}>Brand Performance</span>
            </div>
            <div style={{ height: '300px' }}>
              {brands.length > 0 ? (
                <Bar data={brandChartData} options={chartOptions} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text2 }}>No brand data</div>
              )}
            </div>
          </div>

          {/* Chart 4: Top Moving Sizes Bar Chart */}
          <div style={{ backgroundColor: theme.bg2, borderRadius: '18px', padding: '20px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: theme.text }}>
                📊 Top Moving Tyre Sizes (Volume)
              </h3>
              <span style={{ fontSize: '0.75rem', color: theme.text2, fontWeight: 600 }}>Top Sizes</span>
            </div>
            <div style={{ height: '300px' }}>
              {sizes.length > 0 ? (
                <Bar data={sizeBarData} options={chartOptions} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text2 }}>No size data</div>
              )}
            </div>
          </div>

        </div>

        {/* Detailed Report Table */}
        <div style={{ backgroundColor: theme.bg2, borderRadius: '18px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: theme.text }}>
              📋 Detailed Item-Wise Monthly Ledger
            </h3>
            <span style={{ fontSize: '0.8rem', color: theme.text2 }}>Showing {filteredItems.length} items</span>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '65vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', borderBottom: `2px solid ${theme.border}`, color: theme.text2, textAlign: 'center' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>SIZE</th>
                  <th style={{ padding: '10px 14px' }}>BOX TYPE</th>
                  <th style={{ padding: '10px 14px' }}>MATERIAL</th>
                  <th style={{ padding: '10px 14px' }}>BRAND</th>
                  <th style={{ padding: '10px 14px', color: '#0d9488' }}>CURING</th>
                  <th style={{ padding: '10px 14px', color: '#10b981' }}>MONTH PROD</th>
                  <th style={{ padding: '10px 14px', color: '#ef4444' }}>REJECTED</th>
                  <th style={{ padding: '10px 14px', color: '#f59e0b' }}>MONTH SALE</th>
                  <th style={{ padding: '10px 14px', color: '#2563eb' }}>1ST STOCK</th>
                  <th style={{ padding: '10px 14px' }}>2ND STOCK</th>
                  <th style={{ padding: '10px 14px', color: '#7c3aed' }}>COMBINED</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: idx % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: theme.text, textAlign: 'left' }}>{row.size}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(37,99,235,0.1)', color: '#2563eb', fontWeight: 600, fontSize: '0.75rem' }}>{row.box_type}</span></td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: theme.text2 }}>{row.material}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: theme.text }}>{row.brand}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#0d9488', fontWeight: 600 }}>{row.curing_qty || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#10b981', fontWeight: 800 }}>+{row.monthly_production || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#ef4444' }}>{row.rejected_qty || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#f59e0b', fontWeight: 800 }}>{row.monthly_sale || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{row.stock || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: theme.text2 }}>{row.second_stock || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#7c3aed' }}>{(row.stock || 0) + (row.second_stock || 0) + (row.rfm_stock || 0)}</td>
                  </tr>
                ))}
                {!filteredItems.length && (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: theme.text2 }}>
                      {loading ? '⏳ Loading report...' : 'No entries found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
