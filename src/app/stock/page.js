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
      if (item.is_export_row) {
        acc.export_sale = (acc.export_sale || 0) + (item.month_sale_first || 0);
        acc.export_closing = (acc.export_closing || 0) + (item.closing_first || 0);
      } else {
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
      backgroundColor: '#f8f8f8',
      color: '#333',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Helvetica, Arial, sans-serif',
    }}>
      <style>{`footer { display: none !important; }`}</style>
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '18px', zIndex: 9999, cursor: 'pointer'
      }} onMouseEnter={() => setShowNavbar(true)} />
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9998,
        transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.2s',
        boxShadow: showNavbar ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
      }} onMouseLeave={() => setShowNavbar(false)}>
        <Navbar />
      </div>

      <div style={{ flex: 1, padding: '20px' }}>
        {/* DJANGO ADMIN HEADER */}
        <div style={{ backgroundColor: '#417690', padding: '10px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal' }}>Auto Tyre Dashboard</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>Total Closing: <strong>{(stats.total_closing || 0).toLocaleString()}</strong></span>
            <button onClick={handleExportCSV} style={{ backgroundColor: '#79aec8', border: 'none', color: '#fff', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Export CSV</button>
          </div>
        </div>

        {/* BREADCRUMB */}
        <div style={{ padding: '8px 20px', backgroundColor: '#79aec8', color: '#fff', fontSize: '12px' }}>
          Home &rsaquo; Stock &rsaquo; Auto Tyre Dashboard
        </div>

        {/* TOOLBAR */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Search:</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '4px', border: '1px solid #ccc', fontSize: '12px', width: '200px' }} />
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

        {/* SUMMARY STATS (Rough table) */}
        <div style={{ marginTop: '20px', border: '1px solid #ccc', backgroundColor: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#efefef', borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Today Production</th>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Today Dispatch</th>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Month Production</th>
                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Month Sale</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Total RFM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc' }}>{(stats.today_production || 0).toLocaleString()}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc' }}>{(stats.today_dispatch || 0).toLocaleString()}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc' }}>{(stats.month_prod_total || 0).toLocaleString()}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #ccc' }}>{(filteredTotals.month_sale_first + filteredTotals.month_sale_second + filteredTotals.month_sale_third || 0).toLocaleString()}</td>
                <td style={{ padding: '8px' }}>{(filteredTotals.rfm_ok_tyre || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MAIN DATA TABLE */}
        <div style={{ marginTop: '20px', border: '1px solid #ccc', backgroundColor: '#fff', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>Loading data...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', minWidth: '1200px' }}>
              <thead>
                <tr style={{ backgroundColor: '#efefef', borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }} rowSpan="2">#</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }} rowSpan="2">TYRE</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }} rowSpan="2">PATTERN</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }} rowSpan="2">TYPE</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', textAlign: 'center' }} colSpan="3">LAST CLOSING</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', textAlign: 'center' }} colSpan="4">PRODUCTION</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', textAlign: 'center' }} colSpan="3">SALE / DISPATCH</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', textAlign: 'center' }} rowSpan="2">RFM</th>
                  <th style={{ padding: '6px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', textAlign: 'center' }} colSpan="3">CLOSING STOCK</th>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ccc', textAlign: 'center' }} rowSpan="2">TOTAL</th>
                </tr>
                <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>1ST</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>2ND</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>3RD</th>
                  
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>1ST</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>2ND</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>3RD</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right', fontWeight: 'bold' }}>TOT</th>

                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>1ST</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>2ND</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>3RD</th>
                  
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>1ST</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>2ND</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc', textAlign: 'right' }}>3RD</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const isExp = item.is_export_row;
                  const rowBg = isExp ? '#f5f5f5' : (idx % 2 === 0 ? '#fff' : '#fcfcfc');
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: rowBg }}>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee' }}>{isExp ? '↳' : idx + 1}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', fontWeight: 'bold' }}>{item.tyre}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee' }}>{item.pattern}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee' }}>{item.type}</td>
                      
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.prev_closing_first}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.prev_closing_second}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.prev_closing_third}</td>
                      
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.month_prod_first}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.month_prod_second}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.month_prod_third}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>{isExp ? '-' : item.month_prod_total}</td>
                      
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? item.month_sale_first : item.month_sale_first}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.month_sale_second}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.month_sale_third}</td>
                      
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.rfm_ok_tyre}</td>
                      
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>{item.closing_first}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.closing_second}</td>
                      <td style={{ padding: '6px', borderRight: '1px solid #eee', textAlign: 'right' }}>{isExp ? '-' : item.closing_third}</td>
                      
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#eef3f6' }}>{item.total_closing}</td>
                    </tr>
                  )
                })}
                {!items.length && <tr><td colSpan="19" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No data available.</td></tr>}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: '#e2ebf0', borderTop: '2px solid #ccc', fontWeight: 'bold' }}>
                    <td colSpan="4" style={{ padding: '8px', borderRight: '1px solid #ccc' }}>TOTALS</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.prev_closing_first}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.prev_closing_second}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.prev_closing_third}</td>
                    
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.month_prod_first}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.month_prod_second}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.month_prod_third}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.month_prod_total}</td>
                    
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.month_sale_first}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.month_sale_second}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.month_sale_third}</td>
                    
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.rfm_ok_tyre}</td>
                    
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.closing_first}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.closing_second}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.closing_third}</td>
                    
                    <td style={{ padding: '8px', textAlign: 'right' }}>{filteredTotals.total_closing}</td>
                  </tr>
                  {(filteredTotals.export_closing > 0 || filteredTotals.export_sale > 0) && (
                    <tr style={{ backgroundColor: '#f5f5f5', borderTop: '1px solid #ccc', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ padding: '8px', borderRight: '1px solid #ccc', color: '#555' }}>EXPORT ON HOLD</td>
                      <td colSpan="3" style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'center' }}>-</td>
                      <td colSpan="4" style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.export_sale || 0}</td>
                      <td colSpan="2" style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'right' }}>{filteredTotals.export_closing || 0}</td>
                      <td colSpan="2" style={{ padding: '8px', borderRight: '1px solid #ccc', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{filteredTotals.export_closing || 0}</td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}