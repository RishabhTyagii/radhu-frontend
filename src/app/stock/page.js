'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function AutoTyreDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRange, setCustomRange] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async (month, sd, ed) => {
    setLoading(true);
    let url = '/stock/dashboard/?';
    if (sd && ed) {
      url += `start_date=${sd}&end_date=${ed}`;
    } else if (month) {
      url += `month=${month}`;
    }
    const result = await apiGet(url);
    if (result) {
      setData(result);
      if (!month && result.selected_month) {
        setSelectedMonth(result.selected_month);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData('', '', '');
  }, []);

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    setCustomRange(false);
    setStartDate('');
    setEndDate('');
    fetchData(val, '', '');
  };

  const handleApplyRange = () => {
    if (startDate && endDate) {
      setCustomRange(true);
      fetchData('', startDate, endDate);
    }
  };

  const handleResetRange = () => {
    setCustomRange(false);
    setStartDate('');
    setEndDate('');
    fetchData(selectedMonth, '', '');
  };

  const items = data?.items || [];
  const totals = data?.totals || {};
  const stats = data?.stats || {};
  const availableMonths = data?.available_months || [];

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      (item.tyre || '').toLowerCase().includes(q) ||
      (item.pattern || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const filteredTotals = useMemo(() => {
    if (!search.trim()) return totals;
    return filteredItems.reduce((acc, item) => {
      acc.prev_closing_first += item.prev_closing_first || 0;
      acc.prev_closing_second += item.prev_closing_second || 0;
      acc.prev_closing_third += item.prev_closing_third || 0;
      acc.month_prod_total += item.month_prod_total || 0;
      acc.month_prod_first += item.month_prod_first || 0;
      acc.month_prod_second += item.month_prod_second || 0;
      acc.month_prod_third += item.month_prod_third || 0;
      acc.month_sale_first += item.month_sale_first || 0;
      acc.month_sale_second += item.month_sale_second || 0;
      acc.month_sale_third += item.month_sale_third || 0;
      acc.rfm_ok_tyre += item.rfm_ok_tyre || 0;
      acc.closing_first += item.closing_first || 0;
      acc.closing_second += item.closing_second || 0;
      acc.closing_third += item.closing_third || 0;
      acc.total_closing += item.total_closing || 0;
      return acc;
    }, {
      prev_closing_first: 0, prev_closing_second: 0, prev_closing_third: 0,
      month_prod_total: 0, month_prod_first: 0, month_prod_second: 0, month_prod_third: 0,
      month_sale_first: 0, month_sale_second: 0, month_sale_third: 0,
      rfm_ok_tyre: 0,
      closing_first: 0, closing_second: 0, closing_third: 0, total_closing: 0,
    });
  }, [filteredItems, search, totals]);

  const exportCSV = () => {
    const headers = ['TYRE', 'PATTERN', 'TYPE', 'LAST CL (1ST)', 'LAST CL (2ND)', 'LAST CL (3RD)', 'PROD (TOTAL)', 'PROD (1ST)', 'PROD (2ND)', 'PROD (3RD)', 'SALE (1ST)', 'SALE (2ND)', 'SALE (3RD)', 'RFM', 'CLOSING (1ST)', 'CLOSING (2ND)', 'CLOSING (3RD)', 'TOTAL STOCK'];
    const rows = filteredItems.map(item => [
      item.tyre, item.pattern, item.type,
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
    a.href = url; a.download = 'auto_tyre_stock.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const isMobile = windowWidth < 768;

  const theme = {
    bg: darkMode ? '#0f172a' : '#f1f5f9',
    bg2: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    shadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
    hdr: darkMode ? '#0f172a' : '#f8fafc',
    rowHover: darkMode ? '#1e293b' : '#f8fafc',
  };

  const KpiCard = ({ label, value, icon, color }) => (
    <div style={{
      backgroundColor: theme.bg2, borderRadius: '14px', padding: isMobile ? '12px' : '18px',
      boxShadow: theme.shadow, border: `2px solid ${theme.border}`,
      borderLeft: `6px solid ${color}`, minWidth: 0,
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: theme.text2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{icon} {label}</div>
      <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 800, color, marginTop: '4px' }}>{value ?? '-'}</div>
    </div>
  );

  const thStyle = {
    padding: '8px 10px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.3px', whiteSpace: 'nowrap', position: 'sticky', top: 0,
    backgroundColor: theme.hdr, color: theme.text2, borderBottom: `2px solid ${theme.border}`,
    textAlign: 'center',
  };
  const tdStyle = {
    padding: '7px 10px', fontSize: '0.8rem', color: theme.text, textAlign: 'center',
    borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'all 0.3s ease' }}>
      <Navbar />

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: isMobile ? '10px' : '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #0d9488, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🚗 Auto Tyre Stock Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={exportCSV} style={{ padding: '7px 16px', borderRadius: '50px', border: `2px solid #10b981`, backgroundColor: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              📥 CSV
            </button>
            <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '7px 16px', borderRadius: '50px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: theme.bg2, borderRadius: '14px', padding: isMobile ? '12px' : '16px',
          boxShadow: theme.shadow, border: `2px solid ${theme.border}`, marginBottom: '16px',
          display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end',
        }}>
          {/* Month */}
          <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>📅 MONTH</label>
            <select
              value={customRange ? '' : selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="">-- Select --</option>
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>📆 START DATE</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.8rem' }} />
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>📆 END DATE</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.8rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleApplyRange} disabled={!startDate || !endDate}
              style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: (!startDate || !endDate) ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 700, opacity: (!startDate || !endDate) ? 0.5 : 1 }}>
              ✅ Apply
            </button>
            <button onClick={handleResetRange}
              style={{ padding: '8px 18px', borderRadius: '10px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              🔄 Reset
            </button>
          </div>

          {/* Search */}
          <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.text2, marginBottom: '4px' }}>🔍 SEARCH</label>
            <input type="text" placeholder="Search tyre, pattern, type..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }} />
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <KpiCard label="Today Production" value={stats.today_production} icon="🏭" color="#0d9488" />
          <KpiCard label="Today Dispatch" value={stats.today_dispatch} icon="🚛" color="#f59e0b" />
          <KpiCard label="Month Production" value={stats.month_prod_total} icon="📦" color="#2563eb" />
          <KpiCard label="Total Closing" value={stats.total_closing} icon="📊" color="#7c3aed" />
          <KpiCard label="Total RFM" value={filteredTotals.rfm_ok_tyre} icon="🔧" color="#ec4899" />
        </div>

        {/* Stock Table */}
        <div style={{
          backgroundColor: theme.bg2, borderRadius: '14px', boxShadow: theme.shadow,
          border: `2px solid ${theme.border}`, overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: theme.text2, fontSize: '1rem' }}>⏳ Loading stock data...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, zIndex: 2, backgroundColor: theme.hdr }} rowSpan={2}>TYRE</th>
                    <th style={{ ...thStyle, textAlign: 'left' }} rowSpan={2}>PATTERN</th>
                    <th style={{ ...thStyle }} rowSpan={2}>TYPE</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#eff6ff', borderBottom: `1px solid ${theme.border}` }} colSpan={3}>LAST CLOSING</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#0f2922' : '#ecfdf5', borderBottom: `1px solid ${theme.border}` }} colSpan={4}>PRODUCTION</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#2d1a1a' : '#fef2f2', borderBottom: `1px solid ${theme.border}` }} colSpan={3}>SALE / DISPATCH</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#2d1f3d' : '#faf5ff' }} rowSpan={2}>RFM</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#f0f9ff', borderBottom: `1px solid ${theme.border}` }} colSpan={3}>CLOSING STOCK</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1e293b' : '#f1f5f9' }} rowSpan={2}>TOTAL</th>
                  </tr>
                  <tr>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#eff6ff', fontSize: '0.6rem' }}>1st</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#eff6ff', fontSize: '0.6rem' }}>2nd</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#eff6ff', fontSize: '0.6rem' }}>3rd</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#0f2922' : '#ecfdf5', fontSize: '0.6rem' }}>Total</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#0f2922' : '#ecfdf5', fontSize: '0.6rem' }}>1st</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#0f2922' : '#ecfdf5', fontSize: '0.6rem' }}>2nd</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#0f2922' : '#ecfdf5', fontSize: '0.6rem' }}>3rd</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#2d1a1a' : '#fef2f2', fontSize: '0.6rem' }}>1st</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#2d1a1a' : '#fef2f2', fontSize: '0.6rem' }}>2nd</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#2d1a1a' : '#fef2f2', fontSize: '0.6rem' }}>3rd</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#f0f9ff', fontSize: '0.6rem' }}>1st</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#f0f9ff', fontSize: '0.6rem' }}>2nd</th>
                    <th style={{ ...thStyle, backgroundColor: darkMode ? '#1a2744' : '#f0f9ff', fontSize: '0.6rem' }}>3rd</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') }}>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 700, position: 'sticky', left: 0, backgroundColor: idx % 2 === 0 ? theme.bg2 : (darkMode ? '#1a2333' : '#fafbfc'), zIndex: 1 }}>{item.tyre}</td>
                      <td style={{ ...tdStyle, textAlign: 'left', fontSize: '0.75rem' }}>{item.pattern}</td>
                      <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: '50px', backgroundColor: item.type === 'TL' ? (darkMode ? 'rgba(37,99,235,0.2)' : '#dbeafe') : (darkMode ? 'rgba(249,115,22,0.2)' : '#ffedd5'), color: item.type === 'TL' ? '#2563eb' : '#ea580c', fontSize: '0.7rem', fontWeight: 700 }}>{item.type}</span></td>
                      {/* Last Closing */}
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(37,99,235,0.05)' : '#f7faff' }}>{item.prev_closing_first}</td>
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(37,99,235,0.05)' : '#f7faff' }}>{item.prev_closing_second}</td>
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(37,99,235,0.05)' : '#f7faff' }}>{item.prev_closing_third}</td>
                      {/* Production */}
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#10b981', backgroundColor: darkMode ? 'rgba(16,185,129,0.05)' : '#f0fdf4' }}>{item.month_prod_total}</td>
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(16,185,129,0.05)' : '#f0fdf4' }}>{item.month_prod_first}</td>
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(16,185,129,0.05)' : '#f0fdf4' }}>{item.month_prod_second}</td>
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(16,185,129,0.05)' : '#f0fdf4' }}>{item.month_prod_third}</td>
                      {/* Sales */}
                      <td style={{ ...tdStyle, color: '#ef4444', fontWeight: 600, backgroundColor: darkMode ? 'rgba(239,68,68,0.05)' : '#fef7f7' }}>{item.month_sale_first}</td>
                      <td style={{ ...tdStyle, color: '#ef4444', backgroundColor: darkMode ? 'rgba(239,68,68,0.05)' : '#fef7f7' }}>{item.month_sale_second}</td>
                      <td style={{ ...tdStyle, color: '#ef4444', backgroundColor: darkMode ? 'rgba(239,68,68,0.05)' : '#fef7f7' }}>{item.month_sale_third}</td>
                      {/* RFM */}
                      <td style={{ ...tdStyle, color: '#7c3aed', fontWeight: 600, backgroundColor: darkMode ? 'rgba(124,58,237,0.05)' : '#faf5ff' }}>{item.rfm_ok_tyre}</td>
                      {/* Closing */}
                      <td style={{ ...tdStyle, fontWeight: 700, backgroundColor: darkMode ? 'rgba(37,99,235,0.05)' : '#f0f9ff' }}>{item.closing_first}</td>
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(37,99,235,0.05)' : '#f0f9ff' }}>{item.closing_second}</td>
                      <td style={{ ...tdStyle, backgroundColor: darkMode ? 'rgba(37,99,235,0.05)' : '#f0f9ff' }}>{item.closing_third}</td>
                      {/* Total */}
                      <td style={{ ...tdStyle, fontWeight: 800, fontSize: '0.9rem', color: '#2563eb' }}>{item.total_closing}</td>
                    </tr>
                  ))}
                  {!filteredItems.length && (
                    <tr>
                      <td colSpan="18" style={{ textAlign: 'center', color: theme.text2, padding: '40px', fontSize: '0.9rem' }}>
                        {loading ? '⏳ Loading...' : search ? '🔍 No matching tyres found' : 'No tyres found. Add tyres first.'}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', fontWeight: 800, fontSize: '0.8rem' }}>
                      <td style={{ ...tdStyle, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', zIndex: 1 }} colSpan={3}>TOTALS</td>
                      <td style={{ ...tdStyle, color: '#2563eb' }}>{filteredTotals.prev_closing_first}</td>
                      <td style={tdStyle}>{filteredTotals.prev_closing_second}</td>
                      <td style={tdStyle}>{filteredTotals.prev_closing_third}</td>
                      <td style={{ ...tdStyle, color: '#10b981' }}>{filteredTotals.month_prod_total}</td>
                      <td style={tdStyle}>{filteredTotals.month_prod_first}</td>
                      <td style={tdStyle}>{filteredTotals.month_prod_second}</td>
                      <td style={tdStyle}>{filteredTotals.month_prod_third}</td>
                      <td style={{ ...tdStyle, color: '#ef4444' }}>{filteredTotals.month_sale_first}</td>
                      <td style={tdStyle}>{filteredTotals.month_sale_second}</td>
                      <td style={tdStyle}>{filteredTotals.month_sale_third}</td>
                      <td style={{ ...tdStyle, color: '#7c3aed' }}>{filteredTotals.rfm_ok_tyre}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{filteredTotals.closing_first}</td>
                      <td style={tdStyle}>{filteredTotals.closing_second}</td>
                      <td style={tdStyle}>{filteredTotals.closing_third}</td>
                      <td style={{ ...tdStyle, fontSize: '0.95rem', color: '#2563eb' }}>{filteredTotals.total_closing}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '14px', color: theme.text2, fontSize: '0.7rem' }}>
          Showing {filteredItems.length} of {items.length} items
          {customRange && startDate && endDate ? ` • Custom Range: ${startDate} to ${endDate}` : selectedMonth ? ` • ${availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth}` : ''}
        </div>
      </div>
    </div>
  );
}


  