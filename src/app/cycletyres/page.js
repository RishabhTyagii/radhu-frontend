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
    csvContent += "SIZE,BOX TYPE,MATERIAL,BRAND,PREV CLOSING (1ST),PREV CLOSING (2ND),MONTH PROD (TOTAL),MONTH PROD (1ST),MONTH PROD (2ND),MONTH SALE (1ST),RFM,CLOSING (1ST),CLOSING (2ND),TOTAL STOCK (1ST+2ND+RFM)\n";

    items.forEach(item => {
      const row = [
        `"${item.size || ''}"`,
        `"${item.box_type || ''}"`,
        `"${item.material || ''}"`,
        `"${item.brand || ''}"`,
        item.prev_closing_first ?? 0,
        item.prev_closing_second ?? 0,
        item.month_prod_total ?? 0,
        item.month_prod_first ?? 0,
        item.month_prod_second ?? 0,
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
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.bg,
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
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
                🚴 Cycle Tyre Dashboard
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
                onClick={handleExportExcel}
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
            gap: '1px',
            backgroundColor: theme.border,
          }}>
            {/* Card 1: Last Month Closing */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: isMobile ? '8px 10px' : '10px 14px',
              textAlign: 'center',
              borderBottom: '3px solid #3b82f6',
            }}>
              <div style={{ fontSize: '0.65rem', color: theme.text2, fontWeight: 700, textTransform: 'uppercase' }}>
                ⏮️ Last Month Closing
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6', marginTop: '2px' }}>
                {(totals.prev_closing_first ?? 0) + (totals.prev_closing_second ?? 0)}
              </div>
              <div style={{ fontSize: '0.65rem', color: theme.text2, marginTop: '2px', fontWeight: 600 }}>
                1st: <b style={{ color: '#2563eb' }}>{totals.prev_closing_first ?? 0}</b> | 2nd: <b style={{ color: '#d97706' }}>{totals.prev_closing_second ?? 0}</b>
              </div>
            </div>

            {/* Card 2: This Month Production */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: isMobile ? '8px 10px' : '10px 14px',
              textAlign: 'center',
              borderBottom: '3px solid #10b981',
            }}>
              <div style={{ fontSize: '0.65rem', color: theme.text2, fontWeight: 700, textTransform: 'uppercase' }}>
                ⚙️ Month Production
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                {totals.month_prod_total ?? 0}
              </div>
              <div style={{ fontSize: '0.65rem', color: theme.text2, marginTop: '2px', fontWeight: 600 }}>
                1st: <b style={{ color: '#059669' }}>{totals.month_prod_first ?? 0}</b> | 2nd: <b style={{ color: '#d97706' }}>{totals.month_prod_second ?? 0}</b>
              </div>
            </div>

            {/* Card 3: This Month Sales (1st only) */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: isMobile ? '8px 10px' : '10px 14px',
              textAlign: 'center',
              borderBottom: '3px solid #ef4444',
            }}>
              <div style={{ fontSize: '0.65rem', color: theme.text2, fontWeight: 700, textTransform: 'uppercase' }}>
                🏷️ Sales (1st Grade)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
                {totals.month_sale_first ?? 0}
              </div>
              <div style={{ fontSize: '0.65rem', color: theme.text2, marginTop: '2px', fontWeight: 600 }}>
                RFM: <b style={{ color: '#8b5cf6' }}>{totals.rfm_stock ?? 0}</b>
              </div>
            </div>

            {/* Card 4: Current Closing (1st & 2nd) */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: isMobile ? '8px 10px' : '10px 14px',
              textAlign: 'center',
              borderBottom: '3px solid #8b5cf6',
            }}>
              <div style={{ fontSize: '0.65rem', color: theme.text2, fontWeight: 700, textTransform: 'uppercase' }}>
                📦 Closing Stock
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#8b5cf6', marginTop: '2px' }}>
                {(totals.closing_first ?? 0) + (totals.closing_second ?? 0)}
              </div>
              <div style={{ fontSize: '0.65rem', color: theme.text2, marginTop: '2px', fontWeight: 600 }}>
                1st: <b style={{ color: '#2563eb' }}>{totals.closing_first ?? 0}</b> | 2nd: <b style={{ color: '#d97706' }}>{totals.closing_second ?? 0}</b>
              </div>
            </div>

            {/* Card 5: Grand Total Stock (1st + 2nd + RFM) */}
            <div style={{
              backgroundColor: theme.bg2,
              padding: isMobile ? '8px 10px' : '10px 14px',
              textAlign: 'center',
              borderBottom: '3px solid #2563eb',
              gridColumn: isMobile ? 'span 2' : 'auto',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase' }}>
                🌟 Total Stock (1st + 2nd + RFM)
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
                {totals.total_stock ?? 0}
              </div>
              <div style={{ fontSize: '0.65rem', color: theme.text2, marginTop: '2px', fontWeight: 600 }}>
                Closing + RFM Live
              </div>
            </div>
          </div>

          {/* STICKY TOTALS BAR */}
          {items.length > 0 && !isMobile && (
            <div style={{
              backgroundColor: darkMode ? '#1e293b' : '#f0fdf4',
              borderTop: `2px solid ${theme.border}`,
              borderBottom: `2px solid #3b82f6`,
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#166534', minWidth: '100px' }}>
                📊 SUMMARY ROW:
              </div>
              <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap', fontSize: '0.75rem' }}>
                <div>Last Cl (1st): <b style={{ color: '#2563eb' }}>{totals.prev_closing_first ?? 0}</b></div>
                <div>Last Cl (2nd): <b style={{ color: '#d97706' }}>{totals.prev_closing_second ?? 0}</b></div>
                <div>Prod Total: <b style={{ color: '#10b981' }}>{totals.month_prod_total ?? 0}</b></div>
                <div>Prod 1st: <b style={{ color: '#059669' }}>{totals.month_prod_first ?? 0}</b></div>
                <div>Prod 2nd: <b style={{ color: '#d97706' }}>{totals.month_prod_second ?? 0}</b></div>
                <div>Sale 1st: <b style={{ color: '#ef4444' }}>{totals.month_sale_first ?? 0}</b></div>
                <div>RFM: <b style={{ color: '#8b5cf6' }}>{totals.rfm_stock ?? 0}</b></div>
                <div>Closing 1st: <b style={{ color: '#2563eb' }}>{totals.closing_first ?? 0}</b></div>
                <div>Closing 2nd: <b style={{ color: '#d97706' }}>{totals.closing_second ?? 0}</b></div>
                <div style={{ marginLeft: 'auto', fontWeight: 900, color: '#2563eb', fontSize: '0.85rem' }}>
                  TOTAL STOCK: {totals.total_stock ?? 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table / List Section */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: theme.bg2,
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-spinner fa-spin" style={{
                  fontSize: '2.5rem',
                  color: '#3b82f6',
                  display: 'block',
                  marginBottom: '12px',
                }}></i>
                <p style={{ color: theme.text2, fontWeight: 600 }}>Calculating live stocks & closing...</p>
              </div>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '6px',
                  height: '100%',
                }}>
                  {items.length > 0 ? (
                    items.map(item => renderMobileCard(item))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.text2 }}>
                      No items found
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  height: '100%',
                  overflow: 'auto',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                  }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      backgroundColor: theme.bg3,
                    }}>
                      <tr style={{
                        borderBottom: `2px solid ${theme.border}`,
                      }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800 }}>ITEM / SIZE / BRAND</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>LAST CL (1ST)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#d97706' }}>LAST CL (2ND)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>PROD (TOTAL)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>PROD (1ST)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#d97706' }}>PROD (2ND)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>SALE (1ST)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#8b5cf6' }}>RFM</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#1d4ed8', backgroundColor: darkMode ? '#1e3a8a33' : '#eff6ff' }}>CLOSING (1ST)</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#b45309', backgroundColor: darkMode ? '#78350f33' : '#fefce8' }}>CLOSING (2ND)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: 'white', backgroundColor: '#2563eb' }}>TOTAL STOCK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const isNegative = (item.total_stock || 0) < 0;
                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: `1px solid ${theme.border}`,
                              backgroundColor: theme.bg2,
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.cardHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = theme.bg2;
                            }}
                          >
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 800, color: theme.text }}>{item.size || '-'}</div>
                              <div style={{ display: 'flex', gap: '4px', marginTop: '2px', fontSize: '0.65rem' }}>
                                {item.box_type && <span style={{ color: '#059669', fontWeight: 700 }}>{item.box_type}</span>}
                                {item.material && <span style={{ color: theme.text2 }}>• {item.material}</span>}
                                {item.brand && <span style={{ color: '#7c3aed', fontWeight: 600 }}>• {item.brand}</span>}
                              </div>
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                              {item.prev_closing_first ?? 0}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                              {item.prev_closing_second ?? 0}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                              {item.month_prod_total ?? 0}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                              {item.month_prod_first ?? 0}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                              {item.month_prod_second ?? 0}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                              {item.month_sale_first ?? 0}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#8b5cf6' }}>
                              {item.rfm_stock ?? 0}
                            </td>
                            <td style={{
                              padding: '8px 8px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: '#1e40af',
                              backgroundColor: darkMode ? '#1e3a8a22' : '#eff6ff',
                            }}>
                              {item.closing_first ?? 0}
                            </td>
                            <td style={{
                              padding: '8px 8px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: '#92400e',
                              backgroundColor: darkMode ? '#78350f22' : '#fefce8',
                            }}>
                              {item.closing_second ?? 0}
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'right',
                              fontWeight: 900,
                              fontSize: '0.9rem',
                              color: isNegative ? '#ef4444' : '#2563eb',
                              backgroundColor: isNegative ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.08)',
                            }}>
                              {item.total_stock ?? 0}
                            </td>
                          </tr>
                        );
                      })}
                      {!items.length && (
                        <tr>
                          <td colSpan="11" style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: theme.text2,
                          }}>
                            No matching items found
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Table Footer */}
                    {items.length > 0 && (
                      <tfoot style={{
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 10,
                      }}>
                        <tr style={{
                          backgroundColor: darkMode ? '#1e293b' : '#eff6ff',
                          borderTop: `2px solid #3b82f6`,
                          borderBottom: `2px solid #3b82f6`,
                          fontWeight: 900,
                        }}>
                          <td style={{ padding: '10px 12px', color: '#1e40af' }}>
                            📊 TOTALS
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2563eb' }}>
                            {totals.prev_closing_first ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#d97706' }}>
                            {totals.prev_closing_second ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#10b981' }}>
                            {totals.month_prod_total ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#059669' }}>
                            {totals.month_prod_first ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#d97706' }}>
                            {totals.month_prod_second ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ef4444' }}>
                            {totals.month_sale_first ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#8b5cf6' }}>
                            {totals.rfm_stock ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1e40af', backgroundColor: darkMode ? '#1e3a8a33' : '#dbeafe' }}>
                            {totals.closing_first ?? 0}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#92400e', backgroundColor: darkMode ? '#78350f33' : '#fef3c7' }}>
                            {totals.closing_second ?? 0}
                          </td>
                          <td style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            color: 'white',
                            backgroundColor: '#2563eb',
                            fontSize: '1rem',
                            fontWeight: 900,
                          }}>
                            {totals.total_stock ?? 0}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}