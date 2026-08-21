'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTubeDashboard() {
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
    const result = await apiGet(`/cycletube/dashboard/${query}`);
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
      (item.type && item.type.toLowerCase().includes(term)) ||
      (item.brand && item.brand.toLowerCase().includes(term))
    );
  });

  const stats = data?.stats || {};
  const totals = data?.totals || {};
  const availableMonths = data?.available_months || [
    { label: 'August 2026', value: '2026-08' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'May 2026', value: '2026-05' },
    { label: 'April 2026', value: '2026-04' },
    { label: 'All Time / Overall', value: 'all' },
  ];

  const handleExportCSV = () => {
    if (!items || !items.length) return;

    const filename = `Cycle_Tube_Dashboard_${selectedMonth || 'current'}_${new Date().toISOString().slice(0, 10)}.csv`;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SIZE,TYPE,BRAND,PREV CLOSING,THIS MONTH PROD,THIS MONTH SALE,CLOSING STOCK,RFM STOCK,TOTAL STOCK\n";

    items.forEach(item => {
      const row = [
        `"${item.size || ''}"`,
        `"${item.type || ''}"`,
        `"${item.brand || ''}"`,
        item.prev_closing ?? 0,
        item.month_production ?? 0,
        item.month_sale ?? 0,
        item.closing_stock ?? 0,
        item.rfm_stock ?? 0,
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
    }}>
      <Navbar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
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
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                🚲 Cycle Tube Dashboard
              </span>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '16px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: darkMode ? '#334155' : '#f1f5f9',
                  color: theme.text,
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {darkMode ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              flex: isMobile ? '1' : '0 1 auto',
            }}>
              {/* Month Selector */}
              <select
                style={{
                  padding: '5px 10px',
                  border: `2px solid ${!isCustomRange ? theme.primary : theme.border}`,
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: !isCustomRange && !darkMode ? '#eff6ff' : theme.bg2,
                  color: theme.text,
                  height: '34px',
                  minWidth: '115px',
                  outline: 'none',
                }}
                value={isCustomRange ? 'custom' : selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    📅 {m.label}
                  </option>
                ))}
                {isCustomRange && <option value="custom">📅 Custom Range</option>}
              </select>

              {/* Custom Date Range Filter */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: isCustomRange ? (darkMode ? '#1e3a8a33' : '#eff6ff') : 'transparent',
                padding: '2px 4px',
                borderRadius: '8px',
                border: `1px solid ${isCustomRange ? '#3b82f6' : theme.border}`,
              }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '4px 6px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    height: '28px',
                    outline: 'none',
                  }}
                  title="Start Date"
                />
                <span style={{ fontSize: '0.7rem', color: theme.text2 }}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '4px 6px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    height: '28px',
                    outline: 'none',
                  }}
                  title="End Date"
                />
                <button
                  onClick={handleApplyDateRange}
                  disabled={!startDate || !endDate}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: (!startDate || !endDate) ? 'not-allowed' : 'pointer',
                    height: '28px',
                    opacity: (!startDate || !endDate) ? 0.6 : 1,
                  }}
                >
                  Apply
                </button>
                {isCustomRange && (
                  <button
                    onClick={handleResetFilters}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: 'none',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                    title="Reset to Month View"
                  >
                    ✖
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div style={{
                position: 'relative',
                flex: isMobile ? '1' : '0 1 130px',
                minWidth: '100px',
              }}>
                <input
                  type="text"
                  style={{
                    padding: '5px 8px 5px 10px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    width: '100%',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    height: '34px',
                    outline: 'none',
                  }}
                  placeholder="🔍 Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => isCustomRange ? fetchDashboard({ start: startDate, end: endDate }) : fetchDashboard({ month: selectedMonth })}
                style={{
                  padding: '5px 10px',
                  backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                {!isMobile && 'Refresh'}
              </button>

              <button
                onClick={handleExportCSV}
                style={{
                  padding: '5px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <i className="fas fa-file-excel"></i>
                Export
              </button>
            </div>
          </div>

          {/* TOP SUMMARY KPI CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: '8px',
            padding: isMobile ? '8px 10px' : '10px 18px',
            backgroundColor: darkMode ? '#0f172a' : '#f1f5f9',
            borderBottom: `1px solid ${theme.border}`,
          }}>
            {/* Last Month Closing */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              borderLeft: '4px solid #64748b',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>
                ⏮️ Last Month Closing
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: theme.text, marginTop: '2px' }}>
                {(totals.prev_closing || 0).toLocaleString()}
              </div>
            </div>

            {/* This Month Production */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              borderLeft: '4px solid #2563eb',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>
                ⚙️ This Month Prod
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
                {(totals.month_production || 0).toLocaleString()}
              </div>
            </div>

            {/* This Month Sale */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              borderLeft: '4px solid #ef4444',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>
                🏷️ This Month Sale
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
                {(totals.month_sale || 0).toLocaleString()}
              </div>
            </div>

            {/* Closing Stock */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              borderLeft: '4px solid #10b981',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>
                📦 Closing Stock
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                {(totals.closing_stock || 0).toLocaleString()}
              </div>
            </div>

            {/* Grand Total Stock */}
            <div style={{
              backgroundColor: darkMode ? '#1e3a8a33' : '#eff6ff',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid #3b82f6',
              gridColumn: isMobile ? 'span 2' : 'auto',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                🌟 Total Stock (+ RFM: {(totals.rfm_stock || 0).toLocaleString()})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1d4ed8', marginTop: '2px' }}>
                {(totals.total_stock || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.text2 }}>PCS</span>
              </div>
            </div>
          </div>

          {/* QUICK TOTALS SUMMARY STRIP */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 18px',
            backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
            borderBottom: `1px solid ${theme.border}`,
            fontSize: '0.75rem',
            fontWeight: 700,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            gap: '16px',
          }}>
            <span>Showing <strong style={{ color: theme.primary }}>{items.length}</strong> Tube Items</span>
            <div style={{ display: 'flex', gap: '16px', color: theme.text2 }}>
              <span>Prev Cl: <strong style={{ color: theme.text }}>{(totals.prev_closing || 0).toLocaleString()}</strong></span>
              <span>Prod: <strong style={{ color: '#2563eb' }}>+{(totals.month_production || 0).toLocaleString()}</strong></span>
              <span>Sale: <strong style={{ color: '#ef4444' }}>-{(totals.month_sale || 0).toLocaleString()}</strong></span>
              <span>Closing: <strong style={{ color: '#10b981' }}>{(totals.closing_stock || 0).toLocaleString()}</strong></span>
              <span>RFM: <strong style={{ color: '#8b5cf6' }}>{(totals.rfm_stock || 0).toLocaleString()}</strong></span>
              <span>Total: <strong style={{ color: '#2563eb' }}>{(totals.total_stock || 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '8px' : '12px 18px',
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: theme.text2,
              gap: '12px',
            }}>
              <i className="fas fa-spinner fa-spin fa-2x" style={{ color: theme.primary }}></i>
              <span>Calculating stock metrics...</span>
            </div>
          ) : isMobile ? (
            /* MOBILE CARD VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: theme.bg2,
                    borderRadius: '10px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.shadow,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: theme.text }}>{item.size}</div>
                      <div style={{ fontSize: '0.72rem', color: theme.text2 }}>{item.type} | {item.brand}</div>
                    </div>
                    <span style={{
                      backgroundColor: '#2563eb15',
                      color: '#2563eb',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}>
                      {(item.total_stock || 0).toLocaleString()} PCS
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                    fontSize: '0.72rem',
                    backgroundColor: darkMode ? '#0f172a55' : '#f8fafc',
                    padding: '8px',
                    borderRadius: '6px',
                  }}>
                    <div>
                      <span style={{ color: theme.text2, display: 'block' }}>Prev Cl:</span>
                      <strong>{(item.prev_closing || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#2563eb', display: 'block' }}>Prod:</span>
                      <strong style={{ color: '#2563eb' }}>+{(item.month_production || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#ef4444', display: 'block' }}>Sale:</span>
                      <strong style={{ color: '#ef4444' }}>-{(item.month_sale || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#10b981', display: 'block' }}>Closing:</span>
                      <strong style={{ color: '#10b981' }}>{(item.closing_stock || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#8b5cf6', display: 'block' }}>RFM:</span>
                      <strong style={{ color: '#8b5cf6' }}>{(item.rfm_stock || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#2563eb', display: 'block' }}>Total:</span>
                      <strong style={{ color: '#2563eb' }}>{(item.total_stock || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
              {!items.length && (
                <div style={{ textAlign: 'center', padding: '40px', color: theme.text2 }}>No tube items match your filter.</div>
              )}
            </div>
          ) : (
            /* DESKTOP HIGH DENSITY TABLE */
            <div style={{
              backgroundColor: theme.bg2,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              boxShadow: theme.shadow,
              overflow: 'hidden',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.78rem',
                textAlign: 'left',
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                    borderBottom: `2px solid ${theme.border}`,
                    color: theme.text2,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                  }}>
                    <th style={{ padding: '10px 14px' }}>#</th>
                    <th style={{ padding: '10px 14px' }}>SIZE</th>
                    <th style={{ padding: '10px 14px' }}>TYPE</th>
                    <th style={{ padding: '10px 14px' }}>BRAND</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: theme.text }}>LAST MONTH CLOSING</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#2563eb' }}>THIS MONTH PROD</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#ef4444' }}>THIS MONTH SALE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981' }}>CLOSING STOCK</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#8b5cf6' }}>R.F.M. STOCK</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#2563eb', fontWeight: 900, backgroundColor: darkMode ? '#1e3a8a22' : '#eff6ff' }}>TOTAL STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '8px 14px', color: theme.text2, fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 14px', fontWeight: 800, color: theme.text }}>{item.size}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                          color: theme.text,
                        }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', color: theme.text2, fontWeight: 600 }}>{item.brand}</td>
                      
                      {/* Last Month Closing */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: theme.text }}>
                        {(item.prev_closing || 0).toLocaleString()}
                      </td>

                      {/* Production */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                        {(item.month_production || 0).toLocaleString()}
                      </td>

                      {/* Sale */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                        {(item.month_sale || 0).toLocaleString()}
                      </td>

                      {/* Closing Stock */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                        {(item.closing_stock || 0).toLocaleString()}
                      </td>

                      {/* RFM Stock */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#8b5cf6' }}>
                        {(item.rfm_stock || 0).toLocaleString()}
                      </td>

                      {/* Total Stock */}
                      <td style={{
                        padding: '8px 14px',
                        textAlign: 'right',
                        fontWeight: 900,
                        color: '#1d4ed8',
                        backgroundColor: darkMode ? '#1e3a8a15' : '#eff6ff',
                        fontSize: '0.82rem',
                      }}>
                        {(item.total_stock || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: theme.text2 }}>
                        No cycle tube items found.
                      </td>
                    </tr>
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr style={{
                      backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                      borderTop: `2px solid ${theme.border}`,
                      fontWeight: 900,
                      fontSize: '0.8rem',
                    }}>
                      <td colSpan="4" style={{ padding: '12px 14px', color: theme.text }}>
                        TOTALS ({items.length} Items)
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: theme.text }}>
                        {(totals.prev_closing || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#2563eb' }}>
                        {(totals.month_production || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444' }}>
                        {(totals.month_sale || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#10b981' }}>
                        {(totals.closing_stock || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#8b5cf6' }}>
                        {(totals.rfm_stock || 0).toLocaleString()}
                      </td>
                      <td style={{
                        padding: '12px 14px',
                        textAlign: 'right',
                        color: '#1d4ed8',
                        backgroundColor: darkMode ? '#1e3a8a33' : '#dbeafe',
                        fontSize: '0.88rem',
                      }}>
                        {(totals.total_stock || 0).toLocaleString()}
                      </td>
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
