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
  const [darkMode, setDarkMode] = useState(false);

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
  const items = rawItems.filter((item) => {
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

  // Theme styles
  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    bg2: darkMode ? '#1e293b' : '#ffffff',
    bg3: darkMode ? '#334155' : '#f1f5f9',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    border2: darkMode ? '#475569' : '#cbd5e1',
    shadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
    shadowHover: darkMode ? '0 8px 32px rgba(59,130,246,0.25)' : '0 8px 32px rgba(59,130,246,0.15)',
    cardHover: darkMode ? '#334155' : '#f0fdf4',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
  };

  // Mobile card view
  const renderMobileCard = (item) => {
    const isNegative = (item.total_stock || 0) < 0;

    return (
      <div
        key={item.id}
        style={{
          backgroundColor: theme.bg2,
          borderBottom: `1px solid ${theme.border}`,
          padding: '12px 14px',
          transition: 'all 0.2s ease',
          borderRadius: '10px',
          margin: '6px 4px',
          borderLeft: `4px solid #3b82f6`,
          boxShadow: theme.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: theme.text }}>
              {item.size || '-'}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {item.box_type && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: darkMode ? 'rgba(16,185,129,0.2)' : '#dcfce7',
                  color: darkMode ? '#34d399' : '#166534',
                }}>{item.box_type}</span>
              )}
              {item.material && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: darkMode ? 'rgba(99,102,241,0.2)' : '#e0e7ff',
                  color: darkMode ? '#818cf8' : '#3730a3',
                }}>{item.material}</span>
              )}
              {item.brand && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: darkMode ? 'rgba(236,72,153,0.2)' : '#fce7f3',
                  color: darkMode ? '#f472b6' : '#831843',
                }}>{item.brand}</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: theme.text2, fontWeight: 700 }}>TOTAL STOCK</div>
            <div style={{
              fontSize: '1.3rem',
              fontWeight: 900,
              color: isNegative ? '#ef4444' : '#2563eb',
            }}>
              {item.total_stock ?? 0}
            </div>
          </div>
        </div>

        {/* 11 metrics in mini cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          marginTop: '8px',
          fontSize: '0.75rem',
        }}>
          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: theme.bg3, borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: theme.text2 }}>Last Cl (1st)</div>
            <div style={{ fontWeight: 800, color: '#3b82f6' }}>{item.prev_closing_first ?? 0}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: theme.bg3, borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: theme.text2 }}>Last Cl (2nd)</div>
            <div style={{ fontWeight: 800, color: '#f59e0b' }}>{item.prev_closing_second ?? 0}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: theme.bg3, borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: theme.text2 }}>Prod (Total)</div>
            <div style={{ fontWeight: 800, color: '#10b981' }}>{item.month_prod_total ?? 0}</div>
          </div>

          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: theme.bg3, borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: theme.text2 }}>Prod (1st)</div>
            <div style={{ fontWeight: 800, color: '#059669' }}>{item.month_prod_first ?? 0}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: theme.bg3, borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: theme.text2 }}>Prod (2nd)</div>
            <div style={{ fontWeight: 800, color: '#d97706' }}>{item.month_prod_second ?? 0}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: theme.bg3, borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: theme.text2 }}>Sale (1st)</div>
            <div style={{ fontWeight: 800, color: '#ef4444' }}>{item.month_sale_first ?? 0}</div>
          </div>

          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: theme.bg3, borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: theme.text2 }}>RFM</div>
            <div style={{ fontWeight: 800, color: '#8b5cf6' }}>{item.rfm_stock ?? 0}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: '#1d4ed8', fontWeight: 700 }}>Closing (1st)</div>
            <div style={{ fontWeight: 900, color: '#1e40af' }}>{item.closing_first ?? 0}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: darkMode ? '#78350f' : '#fef3c7', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.6rem', color: '#b45309', fontWeight: 700 }}>Closing (2nd)</div>
            <div style={{ fontWeight: 900, color: '#92400e' }}>{item.closing_second ?? 0}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: '#f8f8f8',
      color: '#333',
      minHeight: '100vh',
      fontFamily: 'Helvetica, Arial, sans-serif',
    }}>
      <style>{`footer { display: none !important; }`}</style>
      <Navbar />

      <div style={{ padding: '20px' }}>
        {/* DJANGO ADMIN HEADER */}
        <div style={{ backgroundColor: '#417690', padding: '10px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal' }}>Cycle Tyre Dashboard</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>Total Stock: <strong>{totals.total_stock ?? 0}</strong></span>
            <button onClick={handleExportExcel} style={{ backgroundColor: '#79aec8', border: 'none', color: '#fff', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Export CSV</button>
          </div>
        </div>

        {/* BREADCRUMB */}
        <div style={{ padding: '8px 20px', backgroundColor: '#79aec8', color: '#fff', fontSize: '12px' }}>
          Home &rsaquo; Stock &rsaquo; Cycle Tyre Dashboard
        </div>

        {/* TOOLBAR */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Search:</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="size, box type, brand..." style={{ padding: '4px', border: '1px solid #ccc', fontSize: '12px', width: '200px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Month:</label>
            <select value={isCustomRange ? 'custom' : selectedMonth} onChange={(e) => handleMonthChange(e.target.value)} style={{ padding: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
              {availableMonths.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              {isCustomRange && <option value="custom">Custom Range</option>}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Date Range:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
            <span style={{ fontSize: '12px' }}>-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
            <button onClick={handleApplyDateRange} style={{ padding: '4px 8px', backgroundColor: '#999', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Apply</button>
            {isCustomRange && <button onClick={handleResetFilters} style={{ padding: '4px 8px', backgroundColor: '#d9534f', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Clear</button>}
          </div>
          <button onClick={() => isCustomRange ? fetchDashboard({ start: startDate, end: endDate }) : fetchDashboard({ month: selectedMonth })} style={{ padding: '4px 8px', backgroundColor: '#417690', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Refresh</button>
        </div>

        {/* SUMMARY STATS */}
        <div style={{ marginTop: '20px', border: '1px solid #ccc', backgroundColor: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#efefef', borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Last Month Closing (1st)</th>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Last Month Closing (2nd)</th>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Month Production (Total)</th>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Month Sales (1st)</th>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>RFM</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Total Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>{totals.prev_closing_first ?? 0}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>{totals.prev_closing_second ?? 0}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>{totals.month_prod_total ?? 0}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>{totals.month_sale_first ?? 0}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>{totals.rfm_stock ?? 0}</td>
                <td style={{ padding: '8px', fontWeight: 'bold', color: '#417690' }}>{totals.total_stock ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MAIN DATA TABLE */}
        <div style={{ marginTop: '20px', border: '1px solid #ccc', backgroundColor: '#fff', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>Loading data...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#efefef', borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc' }}>#</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc' }}>SIZE</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc' }}>PLY / TYPE</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc' }}>BRAND</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>LAST CL (1ST)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>LAST CL (2ND)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>PROD (A)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>PROD (B)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>PROD (C)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right', fontWeight: 'bold' }}>PROD (TOTAL)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>SALE (1ST)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>RFM</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>CLOSING (1ST)</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>CLOSING (2ND)</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#e2ebf0' }}>TOTAL STOCK</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan="15" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No data available.</td></tr>}
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', color: '#888' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', fontWeight: 'bold' }}>{item.size || '-'}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee' }}>{item.material || ''} {item.box_type && item.box_type !== item.material ? `/ ${item.box_type}` : ''}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee' }}>{item.brand || '-'}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.prev_closing_first ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.prev_closing_second ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.month_prod_first ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.month_prod_second ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.month_prod_rejected ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>{item.month_prod_total ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.month_sale_first ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.rfm_stock ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>{item.closing_first ?? 0}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #eee', textAlign: 'right' }}>{item.closing_second ?? 0}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#eef3f6', color: (item.total_stock || 0) < 0 ? '#c00' : '#2a5f8a' }}>{item.total_stock ?? 0}</td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: '#e2ebf0', borderTop: '2px solid #ccc', fontWeight: 'bold' }}>
                    <td colSpan="4" style={{ padding: '8px', borderRight: '1px solid #ccc' }}>TOTALS ({items.length} items)</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.prev_closing_first ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.prev_closing_second ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.month_prod_first ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.month_prod_second ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.month_prod_total ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.month_sale_first ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.rfm_stock ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.closing_first ?? 0}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{totals.closing_second ?? 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{totals.total_stock ?? 0}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

