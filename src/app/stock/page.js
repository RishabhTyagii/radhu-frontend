'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function AutoTyreDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [darkMode, setDarkMode] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isCustomRange) {
      fetchDashboard({ month: selectedMonth });
    }
  }, [selectedMonth]);

  async function fetchDashboard({ month = '', start = '', end = '' } = {}) {
    setLoading(true);
    let params = [];
    if (start && end) {
      params.push(`start_date=${start}`);
      params.push(`end_date=${end}`);
    } else if (month) {
      params.push(`month=${month}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    const result = await apiGet(`/stock/dashboard/${query}`);
    if (result) {
      setData(result);
      if (!selectedMonth && result.selected_month && result.selected_month !== 'custom') {
        setSelectedMonth(result.selected_month);
      }
      if (result.start_date && result.end_date) {
        setStartDate(result.start_date);
        setEndDate(result.end_date);
      }
    }
    setLoading(false);
  }

  const handleApplyDateRange = () => {
    if (!startDate || !endDate) return;
    setIsCustomRange(true);
    fetchDashboard({ start: startDate, end: endDate });
  };

  const handleMonthChange = (month) => {
    setIsCustomRange(false);
    setSelectedMonth(month);
  };

  const handleResetFilters = () => {
    setIsCustomRange(false);
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
    fetchDashboard();
  };

  const rawItems = data?.items || [];
  const items = useMemo(() => {
    if (!debouncedSearch) return rawItems;
    const term = debouncedSearch.toLowerCase();
    return rawItems.filter(item =>
      (item.tyre || '').toLowerCase().includes(term) ||
      (item.pattern || '').toLowerCase().includes(term) ||
      (item.type || '').toLowerCase().includes(term)
    );
  }, [rawItems, debouncedSearch]);

  const stats = data?.stats || {};
  const filteredTotals = useMemo(() => {
    if (!debouncedSearch) return data?.totals || {};
    return items.reduce((acc, item) => {
      acc.prev_closing_first = (acc.prev_closing_first || 0) + (item.prev_closing_first || 0);
      acc.prev_closing_second = (acc.prev_closing_second || 0) + (item.prev_closing_second || 0);
      acc.prev_closing_third = (acc.prev_closing_third || 0) + (item.prev_closing_third || 0);
      acc.month_prod_total = (acc.month_prod_total || 0) + (item.month_prod_total || 0);
      acc.month_prod_first = (acc.month_prod_first || 0) + (item.month_prod_first || 0);
      acc.month_prod_second = (acc.month_prod_second || 0) + (item.month_prod_second || 0);
      acc.month_prod_third = (acc.month_prod_third || 0) + (item.month_prod_third || 0);
      acc.month_sale_first = (acc.month_sale_first || 0) + (item.month_sale_first || 0);
      acc.month_sale_second = (acc.month_sale_second || 0) + (item.month_sale_second || 0);
      acc.month_sale_third = (acc.month_sale_third || 0) + (item.month_sale_third || 0);
      acc.rfm_ok_tyre = (acc.rfm_ok_tyre || 0) + (item.rfm_ok_tyre || 0);
      acc.closing_first = (acc.closing_first || 0) + (item.closing_first || 0);
      acc.closing_second = (acc.closing_second || 0) + (item.closing_second || 0);
      acc.closing_third = (acc.closing_third || 0) + (item.closing_third || 0);
      acc.total_closing = (acc.total_closing || 0) + (item.total_closing || 0);
      return acc;
    }, {
      prev_closing_first: 0, prev_closing_second: 0, prev_closing_third: 0,
      month_prod_total: 0, month_prod_first: 0, month_prod_second: 0, month_prod_third: 0,
      month_sale_first: 0, month_sale_second: 0, month_sale_third: 0,
      rfm_ok_tyre: 0,
      closing_first: 0, closing_second: 0, closing_third: 0, total_closing: 0,
    });
  }, [items, debouncedSearch, data?.totals]);

  const availableMonths = data?.available_months || [];

  const handleExportCSV = () => {
    if (!items || !items.length) return;
    const filename = `Auto_Tyre_Dashboard_${selectedMonth || 'current'}_${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = ['TYRE', 'PATTERN', 'TYPE', 'LAST CL (1ST)', 'LAST CL (2ND)', 'LAST CL (3RD)', 'PROD (TOTAL)', 'PROD (1ST)', 'PROD (2ND)', 'PROD (3RD)', 'SALE (1ST)', 'SALE (2ND)', 'SALE (3RD)', 'RFM', 'CLOSING (1ST)', 'CLOSING (2ND)', 'CLOSING (3RD)', 'TOTAL STOCK'];
    const rows = items.map(item => [
      `"${item.tyre}"`, `"${item.pattern}"`, `"${item.type}"`,
      item.prev_closing_first, item.prev_closing_second, item.prev_closing_third,
      item.month_prod_total, item.month_prod_first, item.month_prod_second, item.month_prod_third,
      item.month_sale_first, item.month_sale_second, item.month_sale_third,
      item.rfm_ok_tyre,
      item.closing_first, item.closing_second, item.closing_third, item.total_closing
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const isMobile = windowWidth < 768;

  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    bg2: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#0f172a',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    primary: '#2563eb',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    purple: '#8b5cf6',
    hoverBg: darkMode ? '#1e3a8a22' : '#f0fdf4',
    shadow: darkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div style={{
      backgroundColor: theme.bg,
      color: theme.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`footer { display: none !important; }`}</style>

      {/* Invisible hover trigger zone at the very top */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '18px',
          zIndex: 9999, cursor: 'pointer'
        }}
        onMouseEnter={() => setShowNavbar(true)}
      />

      {/* Dropdown Navbar on Hover */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          zIndex: 9998,
          transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: showNavbar ? '0 10px 25px rgba(0,0,0,0.3)' : 'none',
        }}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <Navbar />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>

        {/* STICKY HEADER */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: theme.bg2,
          boxShadow: theme.shadow,
        }}>

          {/* Toolbar */}
          <div style={{
            borderBottom: `2px solid ${theme.border}`,
            padding: isMobile ? '8px 10px' : '10px 18px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '8px',
            flexWrap: 'wrap',
            backgroundColor: theme.bg2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: isMobile ? '1.05rem' : '1.3rem',
                fontWeight: 900,
                color: theme.text,
                background: 'linear-gradient(135deg, #0d9488, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                🚗 Auto Tyre Dashboard
              </span>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: '3px 8px', borderRadius: '16px', border: `1px solid ${theme.border}`,
                  backgroundColor: darkMode ? '#334155' : '#f1f5f9', color: theme.text,
                  cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                }}
              >
                {darkMode ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: isMobile ? '1' : '0 1 auto',
            }}>
              {/* Month Selector */}
              <select
                style={{
                  padding: '5px 10px', border: `2px solid ${!isCustomRange ? theme.primary : theme.border}`,
                  borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  backgroundColor: !isCustomRange && !darkMode ? '#eff6ff' : theme.bg2,
                  color: theme.text, height: '34px', minWidth: '115px', outline: 'none',
                }}
                value={isCustomRange ? 'custom' : selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>📅 {m.label}</option>
                ))}
                {isCustomRange && <option value="custom">📅 Custom Range</option>}
              </select>

              {/* Custom Date Range Filter */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                backgroundColor: isCustomRange ? (darkMode ? '#1e3a8a33' : '#eff6ff') : 'transparent',
                padding: '2px 4px', borderRadius: '8px', border: `1px solid ${isCustomRange ? '#3b82f6' : theme.border}`,
              }}>
                <input
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '4px 6px', border: `1px solid ${theme.border}`, borderRadius: '6px', fontSize: '0.75rem', backgroundColor: theme.bg2, color: theme.text, height: '28px', outline: 'none' }}
                />
                <span style={{ fontSize: '0.7rem', color: theme.text2 }}>to</span>
                <input
                  type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '4px 6px', border: `1px solid ${theme.border}`, borderRadius: '6px', fontSize: '0.75rem', backgroundColor: theme.bg2, color: theme.text, height: '28px', outline: 'none' }}
                />
                <button
                  onClick={handleApplyDateRange} disabled={!startDate || !endDate}
                  style={{ padding: '4px 8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: (!startDate || !endDate) ? 'not-allowed' : 'pointer', height: '28px', opacity: (!startDate || !endDate) ? 0.6 : 1 }}
                >Apply</button>
                {isCustomRange && (
                  <button onClick={handleResetFilters} style={{ padding: '4px 6px', backgroundColor: 'transparent', color: '#ef4444', border: 'none', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>✖</button>
                )}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', flex: isMobile ? '1' : '0 1 130px', minWidth: '100px' }}>
                <input
                  type="text"
                  style={{ padding: '5px 8px 5px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '0.75rem', width: '100%', backgroundColor: theme.bg2, color: theme.text, height: '34px', outline: 'none' }}
                  placeholder="🔍 Search tyre, pattern..." value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => isCustomRange ? fetchDashboard({ start: startDate, end: endDate }) : fetchDashboard({ month: selectedMonth })}
                style={{ padding: '5px 10px', backgroundColor: darkMode ? '#334155' : '#e2e8f0', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', height: '34px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> {!isMobile && 'Refresh'}
              </button>

              <button
                onClick={handleExportCSV}
                style={{ padding: '5px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', height: '34px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <i className="fas fa-file-excel"></i> Export
              </button>
            </div>
          </div>

          {/* TOP SUMMARY KPI CARDS */}
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '8px',
            padding: isMobile ? '8px 10px' : '10px 18px', backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', borderBottom: `1px solid ${theme.border}`,
          }}>
            <div style={{ backgroundColor: theme.bg2, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, borderLeft: '4px solid #0d9488' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🏭 Today Production</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0d9488', marginTop: '2px' }}>{(stats.today_production || 0).toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: theme.bg2, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🚛 Today Dispatch</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>{(stats.today_dispatch || 0).toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: theme.bg2, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, borderLeft: '4px solid #ec4899' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🔧 Total RFM</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ec4899', marginTop: '2px' }}>{(filteredTotals.rfm_ok_tyre || 0).toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: darkMode ? '#1e3a8a33' : '#eff6ff', padding: '8px 12px', borderRadius: '8px', border: '2px solid #3b82f6', gridColumn: isMobile ? 'span 2' : 'auto' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>🌟 Total Closing Stock</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1d4ed8', marginTop: '2px' }}>{(stats.total_closing || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.text2 }}>TYRES</span></div>
            </div>
          </div>

          {/* QUICK TOTALS SUMMARY STRIP */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px',
            backgroundColor: darkMode ? '#1e293b' : '#f8fafc', borderBottom: `1px solid ${theme.border}`,
            fontSize: '0.75rem', fontWeight: 700, overflowX: 'auto', whiteSpace: 'nowrap', gap: '16px',
          }}>
            <span>Showing <strong style={{ color: theme.primary }}>{items.length}</strong> Auto Tyres</span>
            <div style={{ display: 'flex', gap: '16px', color: theme.text2 }}>
              <span>Month Prod: <strong style={{ color: '#2563eb' }}>+{(stats.month_prod_total || 0).toLocaleString()}</strong></span>
              <span>Month Sale: <strong style={{ color: '#ef4444' }}>-{(filteredTotals.month_sale_first + filteredTotals.month_sale_second + filteredTotals.month_sale_third || 0).toLocaleString()}</strong></span>
              <span>RFM: <strong style={{ color: '#ec4899' }}>{(filteredTotals.rfm_ok_tyre || 0).toLocaleString()}</strong></span>
              <span>Total Closing: <strong style={{ color: '#10b981' }}>{(stats.total_closing || 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '8px' : '12px 18px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: theme.text2, gap: '12px' }}>
              <i className="fas fa-spinner fa-spin fa-2x" style={{ color: theme.primary }}></i>
              <span>Calculating stock metrics...</span>
            </div>
          ) : (
            <div style={{ backgroundColor: theme.bg2, borderRadius: '8px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left', minWidth: '1200px' }}>
                <thead>
                  <tr style={{ backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', borderBottom: `1px solid ${theme.border}`, color: theme.text2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    <th style={{ padding: '8px 10px' }} rowSpan="2">#</th>
                    <th style={{ padding: '8px 10px' }} rowSpan="2">TYRE</th>
                    <th style={{ padding: '8px 10px' }} rowSpan="2">PATTERN</th>
                    <th style={{ padding: '8px 10px' }} rowSpan="2">TYPE</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', backgroundColor: darkMode ? '#1a2744' : '#eff6ff', borderLeft: `1px solid ${theme.border}` }} colSpan="3">LAST CLOSING</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', backgroundColor: darkMode ? '#0f2922' : '#ecfdf5', borderLeft: `1px solid ${theme.border}` }} colSpan="4">PRODUCTION</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', backgroundColor: darkMode ? '#2d1a1a' : '#fef2f2', borderLeft: `1px solid ${theme.border}` }} colSpan="3">SALE / DISPATCH</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', backgroundColor: darkMode ? '#2d1f3d' : '#faf5ff', borderLeft: `1px solid ${theme.border}` }} rowSpan="2">RFM</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', backgroundColor: darkMode ? '#1a2744' : '#f0f9ff', borderLeft: `1px solid ${theme.border}` }} colSpan="3">CLOSING STOCK</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', backgroundColor: darkMode ? '#1e3a8a22' : '#dbeafe', borderLeft: `1px solid ${theme.border}`, color: theme.text }} rowSpan="2">TOTAL</th>
                  </tr>
                  <tr style={{ backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', borderBottom: `2px solid ${theme.border}`, color: theme.text2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                    <th style={{ padding: '4px 8px', textAlign: 'right', borderLeft: `1px solid ${theme.border}` }}>1ST</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>2ND</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>3RD</th>
                    
                    
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>1ST</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>2ND</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>3RD</th>

<th style={{ padding: '4px 8px', textAlign: 'right', borderLeft: `1px solid ${theme.border}`, color: '#10b981' }}>TOT</th>

                    <th style={{ padding: '4px 8px', textAlign: 'right', borderLeft: `1px solid ${theme.border}` }}>1ST</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>2ND</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>3RD</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', borderLeft: `1px solid ${theme.border}` }}>1ST</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>2ND</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>3RD</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hoverBg} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '6px 10px', color: theme.text2, fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 800, color: theme.text }}>{item.tyre}</td>
                      <td style={{ padding: '6px 10px', color: theme.text2, fontWeight: 600 }}>{item.pattern}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: item.type === 'TL' ? (darkMode ? '#1e3a8a55' : '#dbeafe') : (darkMode ? '#7c2d1255' : '#ffedd5'), color: item.type === 'TL' ? '#2563eb' : '#ea580c' }}>{item.type}</span></td>
                      {/* Last Closing */}
                      <td style={{ padding: '6px 8px', textAlign: 'right', borderLeft: `1px solid ${theme.border}` }}>{item.prev_closing_first}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{item.prev_closing_second}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{item.prev_closing_third}</td>

                      <td style={{ padding: '6px 8px', textAlign: 'right', color: theme.text2 }}>{item.month_prod_first}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: theme.text2 }}>{item.month_prod_second}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: theme.text2 }}>{item.month_prod_third}</td>



                      {/* Production */}
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#10b981', borderLeft: `1px solid ${theme.border}` }}>{item.month_prod_total}</td>

                      {/* Sale */}
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#ef4444', fontWeight: 600, borderLeft: `1px solid ${theme.border}` }}>{item.month_sale_first}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#ef4444' }}>{item.month_sale_second}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#ef4444' }}>{item.month_sale_third}</td>
                      {/* RFM */}
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#8b5cf6', fontWeight: 700, borderLeft: `1px solid ${theme.border}` }}>{item.rfm_ok_tyre}</td>
                      {/* Closing Stock */}
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, borderLeft: `1px solid ${theme.border}` }}>{item.closing_first}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{item.closing_second}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{item.closing_third}</td>
                      {/* Total */}
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#1d4ed8', backgroundColor: darkMode ? '#1e3a8a15' : '#eff6ff', fontSize: '0.8rem', borderLeft: `1px solid ${theme.border}` }}>{item.total_closing}</td>
                    </tr>
                  ))}
                  {!items.length && <tr><td colSpan="19" style={{ textAlign: 'center', padding: '40px', color: theme.text2 }}>No auto tyre items found.</td></tr>}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc', borderTop: `2px solid ${theme.border}`, fontWeight: 900, fontSize: '0.7rem' }}>
                      <td colSpan="4" style={{ padding: '10px 10px', color: theme.text }}>TOTALS</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderLeft: `1px solid ${theme.border}` }}>{filteredTotals.prev_closing_first}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{filteredTotals.prev_closing_second}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{filteredTotals.prev_closing_third}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#10b981', borderLeft: `1px solid ${theme.border}` }}>{filteredTotals.month_prod_total}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{filteredTotals.month_prod_first}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{filteredTotals.month_prod_second}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{filteredTotals.month_prod_third}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ef4444', borderLeft: `1px solid ${theme.border}` }}>{filteredTotals.month_sale_first}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ef4444' }}>{filteredTotals.month_sale_second}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ef4444' }}>{filteredTotals.month_sale_third}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#8b5cf6', borderLeft: `1px solid ${theme.border}` }}>{filteredTotals.rfm_ok_tyre}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderLeft: `1px solid ${theme.border}` }}>{filteredTotals.closing_first}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{filteredTotals.closing_second}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{filteredTotals.closing_third}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1d4ed8', backgroundColor: darkMode ? '#1e3a8a33' : '#dbeafe', fontSize: '0.8rem', borderLeft: `1px solid ${theme.border}` }}>{filteredTotals.total_closing}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}