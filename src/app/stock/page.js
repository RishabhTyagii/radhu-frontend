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
  const [showNavbar, setShowNavbar] = useState(false);

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
      if (item.is_export_row) {
        acc.export_sale = (acc.export_sale || 0) + (item.month_sale_first || 0);
        acc.export_closing = (acc.export_closing || 0) + (item.closing_first || 0);
      } else {
        acc.prev_closing_first = (acc.prev_closing_first || 0) + (item.prev_closing_first || 0);
        acc.prev_closing_second = (acc.prev_closing_second || 0) + (item.prev_closing_second || 0);
        acc.prev_closing_third = (acc.prev_closing_third || 0) + (item.prev_closing_third || 0);
        acc.month_prod_first = (acc.month_prod_first || 0) + (item.month_prod_first || 0);
        acc.month_prod_second = (acc.month_prod_second || 0) + (item.month_prod_second || 0);
        acc.month_prod_third = (acc.month_prod_third || 0) + (item.month_prod_third || 0);
        acc.month_prod_total = (acc.month_prod_total || 0) + (item.month_prod_total || 0);
        acc.month_sale_first = (acc.month_sale_first || 0) + (item.month_sale_first || 0);
        acc.month_sale_second = (acc.month_sale_second || 0) + (item.month_sale_second || 0);
        acc.month_sale_third = (acc.month_sale_third || 0) + (item.month_sale_third || 0);
        acc.rfm_ok_tyre = (acc.rfm_ok_tyre || 0) + (item.rfm_ok_tyre || 0);
        acc.closing_first = (acc.closing_first || 0) + (item.closing_first || 0);
        acc.closing_second = (acc.closing_second || 0) + (item.closing_second || 0);
        acc.closing_third = (acc.closing_third || 0) + (item.closing_third || 0);
        acc.total_closing = (acc.total_closing || 0) + (item.total_closing || 0);
      }
      return acc;
    }, {
      prev_closing_first: 0, prev_closing_second: 0, prev_closing_third: 0,
      month_prod_total: 0, month_prod_first: 0, month_prod_second: 0, month_prod_third: 0,
      month_sale_first: 0, month_sale_second: 0, month_sale_third: 0,
      export_sale: 0, export_closing: 0,
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

  const monthSalesTotal = (filteredTotals.month_sale_first || 0) + (filteredTotals.month_sale_second || 0) + (filteredTotals.month_sale_third || 0);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── AUTO-HIDE HOVER NAVBAR (HOVER TOP TO REVEAL) ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '16px',
          zIndex: 9999,
          cursor: 'pointer',
        }}
        onMouseEnter={() => setShowNavbar(true)}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 9998,
          transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: showNavbar ? '0 10px 25px -5px rgba(0, 0, 0, 0.35)' : 'none',
        }}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <Navbar />
      </div>

      {/* Subtle indicator bar for navbar hover */}
      <div
        style={{
          position: 'fixed',
          top: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9997,
          pointerEvents: 'none',
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          padding: '2px 12px',
          borderRadius: '12px',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          opacity: showNavbar ? 0 : 0.75,
          transition: 'opacity 0.2s',
          border: '1px solid #1e293b',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <i className="fas fa-chevron-down" style={{ marginRight: 5, fontSize: '0.6rem' }} /> Navigation
      </div>

      <main style={{ flex: 1, padding: '24px 28px', maxWidth: '100%', margin: 0, boxSizing: 'border-box' }}>
        {/* ── TOP HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                <i className="fas fa-car-side" style={{ color: '#38bdf8', fontSize: 16 }} />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Auto Tyre Dashboard
              </h1>
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Real-time multi-grade inventory ledger, production metrics, and sales dispatch
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
            >
              <i className="fas fa-file-export" style={{ color: '#059669' }} /> Export CSV
            </button>
            <button
              onClick={() => isCustomRange ? fetchDashboard({ start: startDate, end: endDate }) : fetchDashboard({ month: selectedMonth })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; }}
            >
              <i className="fas fa-sync-alt" /> Refresh
            </button>
          </div>
        </div>

        {/* ── KPI METRICS CARDS (NAVBAR PALETTE) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Card 1: Total Closing Stock */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', borderTop: '4px solid #0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Closing Stock
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
              {(stats.total_closing || filteredTotals.total_closing || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', fontWeight: 700 }}>
              All Grades Combined
            </div>
          </div>

          {/* Card 2: Month Production */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', borderTop: '4px solid #059669', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Month Production
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
              {(filteredTotals.month_prod_total || stats.month_prod_total || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              1st: {filteredTotals.month_prod_first || 0} | 2nd: {filteredTotals.month_prod_second || 0}
            </div>
          </div>

          {/* Card 3: Month Sales / Dispatch */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', borderTop: '4px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Month Total Sales
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#2563eb', marginTop: '6px' }}>
              {monthSalesTotal.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              1st: {filteredTotals.month_sale_first || 0} | 2nd: {filteredTotals.month_sale_second || 0}
            </div>
          </div>

          {/* Card 4: Today Activity */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', borderTop: '4px solid #38bdf8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today Activity
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
              {(stats.today_production || 0).toLocaleString()} <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>Prod</span>
              <span style={{ color: '#cbd5e1', margin: '0 8px' }}>/</span>
              {(stats.today_dispatch || 0).toLocaleString()} <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 800 }}>Disp</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Daily floor output
            </div>
          </div>

          {/* Card 5: Total RFM */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', borderTop: '4px solid #7c3aed', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total RFM Stock
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7c3aed', marginTop: '6px' }}>
              {(filteredTotals.rfm_ok_tyre || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Market Return inventory
            </div>
          </div>
        </div>

        {/* ── TOOLBAR / FILTERS BAR ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: '14px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: 240, flex: 1 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8', fontSize: '0.85rem' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tyre, pattern, type..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
              }}
            />
          </div>

          {/* Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Month:</label>
            <select
              value={isCustomRange ? 'custom' : selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableMonths.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              {isCustomRange && <option value="custom">Custom Range</option>}
            </select>
          </div>

          {/* Date Range Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Date Range:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#ffffff', color: '#1e293b' }}
            />
            <span style={{ color: '#94a3b8' }}>–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#ffffff', color: '#1e293b' }}
            />
            <button
              onClick={handleApplyDateRange}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
            {isCustomRange && (
              <button
                onClick={handleResetFilters}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #fca5a5',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN DATA TABLE (NAVBAR COHESIVE DARK THEME WITH CRISP WHITE TEXT) ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #cbd5e1',
          overflowX: 'auto',
          boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
              <div>Loading inventory data...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', minWidth: '1200px' }}>
              <thead>
                {/* TIER 1 HEADER: Unified Dark Slate Navy (#0f172a) with Crisp White (#ffffff) text */}
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', color: '#ffffff', fontWeight: 800, width: 40 }} rowSpan="2">#</th>
                  <th style={{ padding: '12px 14px', borderRight: '1px solid #1e293b', color: '#ffffff', fontWeight: 800 }} rowSpan="2">TYRE</th>
                  <th style={{ padding: '12px 12px', borderRight: '1px solid #1e293b', color: '#ffffff', fontWeight: 800 }} rowSpan="2">PATTERN</th>
                  <th style={{ padding: '12px 12px', borderRight: '1px solid #1e293b', color: '#ffffff', fontWeight: 800 }} rowSpan="2">TYPE</th>
                  
                  {/* Category Headers with Crisp White text */}
                  <th style={{ padding: '10px 8px', borderRight: '1px solid #1e293b', textAlign: 'center', color: '#ffffff', fontWeight: 800, letterSpacing: '0.04em' }} colSpan="3">
                    LAST CLOSING
                  </th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid #1e293b', textAlign: 'center', color: '#ffffff', fontWeight: 800, letterSpacing: '0.04em', background: '#093a3e' }} colSpan="4">
                    <span style={{ color: '#5eead4', marginRight: 6 }}>●</span>PRODUCTION
                  </th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid #1e293b', textAlign: 'center', color: '#ffffff', fontWeight: 800, letterSpacing: '0.04em', background: '#1e3a8a' }} colSpan="3">
                    <span style={{ color: '#93c5fd', marginRight: 6 }}>●</span>SALE / DISPATCH
                  </th>
                  <th style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'center', color: '#ffffff', fontWeight: 800, background: '#4c1d95', letterSpacing: '0.04em' }} rowSpan="2">
                    RFM
                  </th>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid #1e293b', textAlign: 'center', color: '#ffffff', fontWeight: 800, letterSpacing: '0.04em', background: '#0c4a6e' }} colSpan="3">
                    <span style={{ color: '#7dd3fc', marginRight: 6 }}>●</span>CLOSING STOCK
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', color: '#38bdf8', fontWeight: 900, background: '#0284c7', letterSpacing: '0.05em' }} rowSpan="2">
                    TOTAL
                  </th>
                </tr>

                {/* TIER 2 SUB-HEADER: Crisp Slate (#1e293b) with 100% Crisp White text */}
                <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                  {/* Last Closing Sub */}
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700 }}>1ST</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700 }}>2ND</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700 }}>3RD</th>
                  
                  {/* Production Sub */}
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#062d31' }}>1ST</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#062d31' }}>2ND</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#062d31' }}>3RD</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#5eead4', fontWeight: 900, background: '#042225' }}>TOT</th>

                  {/* Sale Sub */}
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#172554' }}>1ST</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#172554' }}>2ND</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#172554' }}>3RD</th>
                  
                  {/* Closing Sub */}
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#082f49' }}>1ST</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#082f49' }}>2ND</th>
                  <th style={{ padding: '7px 8px', borderRight: '1px solid #334155', textAlign: 'right', color: '#ffffff', fontWeight: 700, background: '#082f49' }}>3RD</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const isExp = item.is_export_row;
                  const rowBg = isExp ? '#f8fafc' : (idx % 2 === 0 ? '#ffffff' : '#fcfcfd');
                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: rowBg, transition: 'background-color 0.12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = rowBg; }}
                    >
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
                        {isExp ? '↳' : idx + 1}
                      </td>
                      <td style={{ padding: '9px 14px', borderRight: '1px solid #f1f5f9', fontWeight: 800, color: '#0f172a' }}>
                        {item.tyre}
                      </td>
                      <td style={{ padding: '9px 12px', borderRight: '1px solid #f1f5f9', color: '#334155', fontWeight: 500 }}>{item.pattern}</td>
                      <td style={{ padding: '9px 12px', borderRight: '1px solid #f1f5f9', color: '#475569', fontWeight: 500 }}>{item.type}</td>
                      
                      {/* LAST CLOSING */}
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#334155' }}>{isExp ? '-' : item.prev_closing_first}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>{isExp ? '-' : item.prev_closing_second}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#94a3b8' }}>{isExp ? '-' : item.prev_closing_third}</td>
                      
                      {/* PRODUCTION */}
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#047857', fontWeight: 600 }}>{isExp ? '-' : item.month_prod_first}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#059669' }}>{isExp ? '-' : item.month_prod_second}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>{isExp ? '-' : item.month_prod_third}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: '#065f46', backgroundColor: '#ecfdf5' }}>{isExp ? '-' : item.month_prod_total}</td>
                      
                      {/* SALE / DISPATCH */}
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#1d4ed8', fontWeight: 600 }}>{item.month_sale_first}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#2563eb' }}>{isExp ? '-' : item.month_sale_second}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>{isExp ? '-' : item.month_sale_third}</td>
                      
                      {/* RFM */}
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#6d28d9', fontWeight: 700, backgroundColor: '#faf5ff' }}>{isExp ? '-' : item.rfm_ok_tyre}</td>
                      
                      {/* CLOSING */}
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: '#0f172a', backgroundColor: '#f0f9ff' }}>{item.closing_first}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#334155', backgroundColor: '#f0f9ff' }}>{isExp ? '-' : item.closing_second}</td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b', backgroundColor: '#f0f9ff' }}>{isExp ? '-' : item.closing_third}</td>
                      
                      {/* TOTAL */}
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 900, backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.82rem' }}>
                        {item.total_closing}
                      </td>
                    </tr>
                  );
                })}
                {!items.length && (
                  <tr>
                    <td colSpan="19" style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                      No inventory records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                    <td colSpan="4" style={{ padding: '12px 14px', borderRight: '1px solid #1e293b', letterSpacing: '0.05em' }}>
                      TOTALS
                    </td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.prev_closing_first}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.prev_closing_second}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.prev_closing_third}</td>
                    
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.month_prod_first}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.month_prod_second}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.month_prod_third}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right', color: '#5eead4', backgroundColor: '#042225' }}>{filteredTotals.month_prod_total}</td>
                    
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.month_sale_first}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.month_sale_second}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.month_sale_third}</td>
                    
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right', color: '#e9d5ff', backgroundColor: '#3b0764' }}>{filteredTotals.rfm_ok_tyre}</td>
                    
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.closing_first}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.closing_second}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #1e293b', textAlign: 'right' }}>{filteredTotals.closing_third}</td>
                    
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ffffff', backgroundColor: '#0284c7', fontSize: '0.88rem', fontWeight: 900 }}>{filteredTotals.total_closing}</td>
                  </tr>
                  {(filteredTotals.export_closing > 0 || filteredTotals.export_sale > 0) && (
                    <tr style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1', fontWeight: 700 }}>
                      <td colSpan="4" style={{ padding: '10px 14px', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>EXPORT ON HOLD</td>
                      <td colSpan="3" style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>-</td>
                      <td colSpan="4" style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>-</td>
                      <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', color: '#2563eb' }}>{filteredTotals.export_sale || 0}</td>
                      <td colSpan="2" style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>-</td>
                      <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>-</td>
                      <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', color: '#0f172a' }}>{filteredTotals.export_closing || 0}</td>
                      <td colSpan="2" style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>-</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#0369a1' }}>{filteredTotals.export_closing || 0}</td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          )}
        </div>
      </main>
    </div>
  );
}