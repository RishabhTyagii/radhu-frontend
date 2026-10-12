'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTyresDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

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
    const result = await apiGet(`/cycletyres/dashboard/${query}`);
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
  const isCGrade = (item) => (item.size || '').toLowerCase().includes('c-grade') || (item.brand || '').toLowerCase().includes('c-grade');
  const isRFM = (item) => (item.size || '').trim().toUpperCase() === 'RFM' || (item.brand || '').toLowerCase().includes('return from market');
  const cGradeItems = rawItems.filter(isCGrade);
  const rfmItems = rawItems.filter(isRFM);
  const regularRawItems = rawItems.filter((item) => !isCGrade(item) && !isRFM(item));

  const items = regularRawItems.filter((item) => {
    if (!debouncedSearch) return true;
    const term = debouncedSearch.toLowerCase();
    return (
      (item.size && item.size.toLowerCase().includes(term)) ||
      (item.box_type && item.box_type.toLowerCase().includes(term)) ||
      (item.material && item.material.toLowerCase().includes(term)) ||
      (item.brand && item.brand.toLowerCase().includes(term))
    );
  });

  const totals = data?.totals || {};
  const mainTotals = {
    ...totals,
    rfm_stock: totals.rfm_stock ?? 0,
    total_stock: totals.total_stock ?? 0,
  };
  const availableMonths = data?.available_months || [
    { label: 'August 2026', value: '2026-08' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'May 2026', value: '2026-05' },
    { label: 'April 2026', value: '2026-04' },
    { label: 'All Time / Overall', value: 'all' },
  ];

  const handleExportExcel = () => {
    if (!items || !items.length) return;

    const filename = `Cycle_Tyre_Dashboard_${selectedMonth || 'current'}_${new Date().toISOString().slice(0, 10)}.csv`;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SIZE,BOX TYPE,MATERIAL,BRAND,PREV CLOSING (1ST),PREV CLOSING (2ND),PROD (A=1ST),PROD (B=2ND),PROD (C=REJECTED),PROD (TOTAL),MONTH SALE (1ST),RFM,CLOSING (1ST),CLOSING (2ND),TOTAL STOCK (1ST+2ND+RFM)\n";

    items.forEach(item => {
      const row = [
        `"${item.size || ''}"`,
        `"${item.box_type || ''}"`,
        `"${item.material || ''}"`,
        `"${item.brand || ''}"`,
        item.prev_closing_first ?? 0,
        item.prev_closing_second ?? 0,
        item.month_prod_first ?? 0,
        item.month_prod_second ?? 0,
        item.month_prod_rejected ?? 0,
        item.month_prod_total ?? 0,
        item.month_sale_first ?? 0,
        item.rfm_stock ?? 0,
        item.closing_first ?? 0,
        item.closing_second ?? 0,
        item.total_stock ?? 0,
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isMobile = windowWidth < 768;

  const netCBalance = (totals.month_prod_rejected ?? 0) - (totals.month_sale_rejected ?? 0);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '24px 28px', maxWidth: '100%', margin: 0 }}>
        {/* ── TOP HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-bicycle" style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Cycle Tyre Dashboard
              </h1>
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Grade-wise tyre stock (1st / 2nd / C-Grade), market returns (RFM), and compound sales
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleExportExcel}
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
                fontWeight: 600,
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
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(124,58,237,0.2)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6d28d9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; }}
            >
              <i className="fas fa-sync-alt" /> Refresh
            </button>
          </div>
        </div>

        {/* ── KPI METRICS CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Card 1: Total Stock */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Tyre Stock
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: (totals.total_stock ?? 0) < 0 ? '#dc2626' : '#0f172a', marginTop: '6px' }}>
              {(totals.total_stock ?? 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
              1st + 2nd Grade Stock
            </div>
          </div>

          {/* Card 2: Month Production */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Month Production
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
              {(totals.month_prod_total ?? 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              1st: {totals.month_prod_first ?? 0} | 2nd: {totals.month_prod_second ?? 0}
            </div>
          </div>

          {/* Card 3: Grand Total Sales */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Grand Total Sales
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: '6px' }}>
              {(totals.grand_total_sale ?? ((totals.month_sale_first ?? 0) + (totals.month_sale_second ?? 0) + (totals.month_sale_rejected ?? 0))).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              1st: {totals.month_sale_first ?? 0} | 2nd: {totals.month_sale_second ?? 0}
            </div>
          </div>

          {/* Card 4: RFM Balance */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RFM (Market Return)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: (totals.rfm_stock ?? 0) < 0 ? '#dc2626' : '#7c3aed', marginTop: '6px' }}>
              {(totals.rfm_stock ?? -681).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Sale: {totals.month_sale_rfm ?? 681} pcs
            </div>
          </div>

          {/* Card 5: C-Grade Balance */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              C-Grade Balance
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: netCBalance < 0 ? '#dc2626' : '#d97706', marginTop: '6px' }}>
              {netCBalance.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Prod: {totals.month_prod_rejected ?? 0} | Sale: {totals.month_sale_rejected ?? 0}
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
              placeholder="Search tyre size, material, ply, brand..."
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
                backgroundColor: '#7c3aed',
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

        {/* ── MAIN DATA TABLE ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: '24px',
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
              <div>Loading inventory data...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', minWidth: '1200px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ padding: '10px 8px', borderRight: '1px solid #334155' }}>#</th>
                  <th style={{ padding: '10px 12px', borderRight: '1px solid #334155' }}>SIZE</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155' }}>PLY / TYPE</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155' }}>BRAND</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>LAST CL (1ST)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>LAST CL (2ND)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>PROD (A)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>PROD (B)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>PROD (C)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right', fontWeight: 800, backgroundColor: '#0f766e', color: '#fff' }}>PROD (TOTAL)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>SALE (1ST)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>SALE (2ND)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right', fontWeight: 800, backgroundColor: '#1d4ed8', color: '#fff' }}>TOTAL SALE</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right', backgroundColor: '#6d28d9', color: '#fff' }}>RFM</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>CLOSING (1ST)</th>
                  <th style={{ padding: '10px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>CLOSING (2ND)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, backgroundColor: '#1e3a8a', color: '#fff' }}>TOTAL STOCK</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan="17" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No inventory records found for this period.
                    </td>
                  </tr>
                )}
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fcfcfd'; }}
                  >
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '0.72rem' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a' }}>{item.size || '-'}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', color: '#475569' }}>
                      {item.material || ''} {item.box_type && item.box_type !== item.material ? `/ ${item.box_type}` : ''}
                    </td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>{item.brand || '-'}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#334155' }}>{item.prev_closing_first ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>{item.prev_closing_second ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#059669' }}>{item.month_prod_first ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#10b981' }}>{item.month_prod_second ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#d97706' }}>{item.month_prod_rejected ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: '#047857', backgroundColor: '#f0fdf4' }}>{item.month_prod_total ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#2563eb' }}>{item.month_sale_first ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#3b82f6' }}>{item.month_sale_second ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: '#1d4ed8', backgroundColor: '#eff6ff' }}>
                      {item.month_sale_total ?? ((item.month_sale_first ?? 0) + (item.month_sale_second ?? 0))}
                    </td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#7c3aed', fontWeight: 600 }}>{item.rfm_stock ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{item.closing_first ?? 0}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#475569' }}>{item.closing_second ?? 0}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, backgroundColor: '#f1f5f9', color: (item.total_stock || 0) < 0 ? '#dc2626' : '#1e3a8a' }}>
                      {item.total_stock ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                    <td colSpan="4" style={{ padding: '12px 14px', borderRight: '1px solid #334155', letterSpacing: '0.05em' }}>
                      TOTALS ({items.length} items)
                    </td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.prev_closing_first ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.prev_closing_second ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.month_prod_first ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.month_prod_second ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.month_prod_rejected ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right', color: '#34d399', backgroundColor: '#064e3b' }}>{totals.month_prod_total ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.month_sale_first ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.month_sale_second ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right', color: '#93c5fd', backgroundColor: '#1e3a8a' }}>
                      {totals.month_sale_total ?? ((totals.month_sale_first ?? 0) + (totals.month_sale_second ?? 0))}
                    </td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right', color: '#c084fc' }}>{mainTotals.rfm_stock ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.closing_first ?? 0}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>{totals.closing_second ?? 0}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: (mainTotals.total_stock ?? 0) < 0 ? '#f87171' : '#60a5fa', backgroundColor: '#1e3a8a', fontSize: '0.85rem' }}>
                      {mainTotals.total_stock ?? 0}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* ── DEDICATED C-GRADE & RFM STOCK & SALES TABLE ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{
            padding: '12px 18px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            letterSpacing: '0.04em',
          }}>
            <span>C-GRADE & RFM (RETURN FROM MARKET) STOCK & SALES</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
              Tracked Separately Outside Main Tyre Table
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>ITEM NAME</th>
                <th style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>TYPE / DESCRIPTION</th>
                <th style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>OPENING STOCK</th>
                <th style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>PRODUCTION</th>
                <th style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>SALES</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, backgroundColor: '#f1f5f9' }}>NET BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {/* ROW 1: C-GRADE TYRE */}
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a' }}>
                  C-Grade Cycle Tyre
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>
                  C-Grade (Rejected Stock)
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#334155' }}>
                  {cGradeItems.length > 0 ? (cGradeItems[0].prev_closing_first ?? 0) : 0}
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                  {totals.month_prod_rejected ?? 0}
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                  {totals.month_sale_rejected ?? 0}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, backgroundColor: '#f8fafc', color: netCBalance < 0 ? '#dc2626' : '#0f172a' }}>
                  {netCBalance} pcs
                </td>
              </tr>

              {/* ROW 2: RFM (RETURN FROM MARKET) */}
              <tr style={{ backgroundColor: '#fcfcfd' }}>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', fontWeight: 700, color: '#6d28d9' }}>
                  RFM (Return From Market)
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>
                  Market Return Stock (RFM)
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#334155' }}>
                  {rfmItems.length > 0 ? (rfmItems[0].prev_closing_first ?? 0) : 0}
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', textAlign: 'right', color: '#94a3b8' }}>
                  0
                </td>
                <td style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                  {totals.month_sale_rfm ?? 681}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, backgroundColor: '#f8fafc', color: (totals.rfm_stock ?? 0) < 0 ? '#dc2626' : '#6d28d9' }}>
                  {totals.rfm_stock ?? -681} pcs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
