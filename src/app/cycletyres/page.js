'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTyresDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
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
    fetchDashboard(selectedMonth);
  }, [selectedMonth]);

  async function fetchDashboard(month = 'all') {
    setLoading(true);
    const result = await apiGet(`/cycletyres/dashboard/?month=${month}`);
    if (result) setData(result);
    setLoading(false);
  }

  const handleExportExcel = () => {
    if (!items || !items.length) return;

    const filename = `Cycle_Tyre_Dashboard_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.csv`;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SIZE,BOX TYPE,MATERIAL,BRAND,PRODUCTION,SALE,1ST GRADE STOCK,2ND GRADE STOCK,R.F.M. STOCK,TOTAL STOCK (1ST + RFM)\n";

    items.forEach(item => {
      const row = [
        `"${item.size || ''}"`,
        `"${item.box_type || ''}"`,
        `"${item.material || ''}"`,
        `"${item.brand || ''}"`,
        item.month_production || 0,
        item.month_sale || 0,
        item.stock || 0,
        item.second_stock || 0,
        item.rfm_stock || 0,
        (item.stock || 0) + (item.rfm_stock || 0)
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

  const stats = data?.stats || {};
  const totals = data?.totals || {};
  const availableMonths = data?.available_months || [
    { label: 'All Time / Overall', value: 'all' },
    { label: 'April 2026', value: '2026-04' },
    { label: 'May 2026', value: '2026-05' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'August 2026', value: '2026-08' },
  ];

  const isMobile = windowWidth < 768;

  // Theme styles
  const theme = {
    bg: darkMode ? '#0f172a' : '#f1f5f9',
    bg2: darkMode ? '#1e293b' : '#ffffff',
    bg3: darkMode ? '#334155' : '#f8fafc',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    border2: darkMode ? '#475569' : '#cbd5e1',
    shadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
    shadowHover: darkMode ? '0 8px 32px rgba(59,130,246,0.25)' : '0 8px 32px rgba(59,130,246,0.15)',
    cardHover: darkMode ? '#334155' : '#eff6ff',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
  };

  // Mobile card view
  const renderMobileCard = (item) => {
    const combinedStock = (item.stock || 0) + (item.rfm_stock || 0);
    const isNegative = combinedStock < 0;

    return (
      <div
        key={item.id}
        style={{
          backgroundColor: theme.bg2,
          borderBottom: `1px solid ${theme.border}`,
          padding: '12px 14px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          borderRadius: '8px',
          margin: '4px 6px',
          borderLeft: `4px solid transparent`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.cardHover;
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = theme.shadowHover;
          e.currentTarget.style.borderLeftColor = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.bg2;
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderLeftColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: theme.text }}>
              {item.size || '-'}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {item.box_type && (
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  backgroundColor: darkMode ? 'rgba(16,185,129,0.2)' : '#dcfce7',
                  color: darkMode ? '#34d399' : '#166534',
                }}>{item.box_type}</span>
              )}
              {item.material && (
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  backgroundColor: darkMode ? 'rgba(99,102,241,0.2)' : '#e0e7ff',
                  color: darkMode ? '#818cf8' : '#3730a3',
                }}>{item.material}</span>
              )}
              {item.brand && (
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  backgroundColor: darkMode ? 'rgba(236,72,153,0.2)' : '#fce7f3',
                  color: darkMode ? '#f472b6' : '#831843',
                }}>{item.brand}</span>
              )}
            </div>
          </div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: isNegative ? '#ef4444' : '#3b82f6',
          }}>
            {combinedStock}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          marginTop: '8px',
          fontSize: '0.7rem',
        }}>
          {[
            { label: 'Prod', value: item.month_production ?? 0, color: '#10b981' },
            { label: 'Sale', value: item.month_sale ?? 0, color: '#ef4444' },
            { label: '1st', value: item.stock ?? 0, color: '#3b82f6' },
            { label: '2nd', value: item.second_stock ?? 0, color: '#f59e0b' },
            { label: 'RFM', value: item.rfm_stock ?? 0, color: '#8b5cf6' },
            { label: 'Total', value: combinedStock, color: isNegative ? '#ef4444' : '#3b82f6' },
          ].map((stat, idx) => (
            <div key={idx} style={{
              textAlign: 'center',
              padding: '4px',
              backgroundColor: darkMode ? 'rgba(51,65,85,0.5)' : '#f8fafc',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '0.5rem', color: theme.text2 }}>{stat.label}</div>
              <div style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
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
          transition: 'all 0.3s ease',
        }}>

          {/* Toolbar */}
          <div style={{
            borderBottom: `2px solid ${theme.border}`,
            padding: isMobile ? '8px 12px' : '10px 20px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '8px' : '12px',
            flexWrap: 'wrap',
            backgroundColor: theme.bg2,
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: isMobile ? '1rem' : '1.4rem',
                fontWeight: 800,
                color: theme.text,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                🚴 Cycle Tyre
              </span>
              {!isMobile && (
                <span style={{ color: theme.text2, fontSize: '0.75rem' }}>
                  {selectedMonth === 'all' ? '📊 Overall' : selectedMonth}
                </span>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '50px',
                  border: `2px solid ${theme.border}`,
                  backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                  color: theme.text,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = theme.shadowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
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
              <select
                style={{
                  padding: '5px 10px',
                  border: `2px solid ${theme.border}`,
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: theme.bg2,
                  color: theme.text,
                  height: '34px',
                  minWidth: isMobile ? '80px' : '120px',
                  flex: isMobile ? '1' : '0 1 auto',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isMobile ? m.label.substring(0, 10) : m.label}
                  </option>
                ))}
              </select>

              <div style={{
                position: 'relative',
                flex: isMobile ? '1' : '0 1 140px',
                minWidth: isMobile ? '80px' : '120px',
              }}>
                <i className="fas fa-search" style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme.text2,
                  fontSize: '0.7rem',
                }}></i>
                <input
                  type="text"
                  style={{
                    padding: '5px 10px 5px 30px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    width: '100%',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    height: '34px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  placeholder="🔍 Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                onClick={() => fetchDashboard(selectedMonth)}
                style={{
                  padding: '5px 12px',
                  backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                  color: theme.text,
                  border: `2px solid ${theme.border}`,
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: isMobile ? '1' : '0 1 auto',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#e2e8f0';
                  e.currentTarget.style.color = theme.text;
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
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
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: isMobile ? '1' : '0 1 auto',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <i className="fas fa-file-excel"></i>
                {!isMobile && 'Export'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: '1px',
            backgroundColor: theme.border,
            transition: 'all 0.3s ease',
          }}>
            {[
              { label: '📈 Today Production', value: stats.today_production ?? 0, color: '#10b981' },
              { label: '📉 Today Sale', value: stats.today_sale ?? 0, color: '#ef4444' },
              { label: '📊 Total Production', value: stats.month_production ?? 0, color: '#3b82f6' },
              { label: '📊 Total Sale', value: stats.month_sale ?? 0, color: '#8b5cf6' },
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: theme.bg2,
                  padding: isMobile ? '8px 10px' : '12px 16px',
                  textAlign: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  borderBottom: `3px solid ${stat.color}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.cardHover;
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = theme.shadowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.bg2;
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: isMobile ? '0.5rem' : '0.7rem',
                  color: theme.text2,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: isMobile ? '1.1rem' : '1.6rem',
                  fontWeight: 800,
                  color: stat.color,
                  marginTop: '2px',
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* TOTALS ROW - STICKY */}
          {items.length > 0 && (
            <div style={{
              backgroundColor: darkMode ? '#1e293b' : '#eff6ff',
              borderTop: `3px solid #3b82f6`,
              borderBottom: `3px solid #3b82f6`,
              padding: isMobile ? '6px 10px' : '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '12px',
              flexWrap: 'wrap',
              boxShadow: '0 2px 12px rgba(59,130,246,0.15)',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                fontWeight: 800,
                fontSize: isMobile ? '0.7rem' : '0.9rem',
                color: '#1e40af',
                minWidth: isMobile ? '40px' : '70px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{ fontSize: '1.1rem' }}>📊</span>
                <span style={{ display: isMobile ? 'none' : 'inline' }}>TOTALS</span>
              </div>
              <div style={{
                display: 'flex',
                gap: isMobile ? '6px' : '16px',
                flexWrap: 'wrap',
                flex: 1,
                justifyContent: isMobile ? 'space-around' : 'flex-start',
              }}>
                {[
                  { label: 'PROD', value: totals.total_month_production ?? 0, color: '#10b981' },
                  { label: 'SALE', value: totals.total_month_sale ?? 0, color: '#ef4444' },
                  { label: '1ST', value: totals.total_stock ?? 0, color: '#3b82f6' },
                  { label: '2ND', value: totals.total_second_stock ?? 0, color: '#f59e0b' },
                  { label: 'RFM', value: totals.total_rfm_stock ?? 0, color: '#8b5cf6' },
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    textAlign: 'center',
                    backgroundColor: darkMode ? 'rgba(51,65,85,0.5)' : 'rgba(255,255,255,0.6)',
                    padding: isMobile ? '2px 8px' : '2px 14px',
                    borderRadius: '6px',
                    minWidth: isMobile ? '30px' : '50px',
                  }}>
                    <div style={{
                      fontSize: isMobile ? '0.4rem' : '0.55rem',
                      color: darkMode ? '#94a3b8' : '#475569',
                      fontWeight: 700,
                    }}>{stat.label}</div>
                    <div style={{
                      fontWeight: 800,
                      fontSize: isMobile ? '0.65rem' : '0.85rem',
                      color: stat.color,
                    }}>{stat.value}</div>
                  </div>
                ))}
                <div style={{
                  textAlign: 'center',
                  backgroundColor: '#3b82f6',
                  padding: isMobile ? '2px 12px' : '2px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.4rem' : '0.55rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 700,
                  }}>TOTAL</div>
                  <div style={{
                    fontWeight: 900,
                    fontSize: isMobile ? '0.75rem' : '1rem',
                    color: 'white',
                  }}>{totals.total_combined_stock ?? 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: theme.bg2,
          transition: 'all 0.3s ease',
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
                <p style={{ color: theme.text2, fontWeight: 500 }}>Loading data...</p>
              </div>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '4px',
                }}>
                  {items.length > 0 ? (
                    items.map(item => renderMobileCard(item))
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <i className="fas fa-inbox" style={{
                          fontSize: '3rem',
                          color: theme.text2,
                          opacity: 0.3,
                          display: 'block',
                          marginBottom: '12px',
                        }}></i>
                        <p style={{ color: theme.text2 }}>No items found</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                    tableLayout: 'fixed',
                  }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      backgroundColor: theme.bg3,
                    }}>
                      <tr style={{
                        borderBottom: `3px solid #3b82f6`,
                      }}>
                        {['SIZE', 'BOX', 'MATERIAL', 'BRAND', 'PROD', 'SALE', '1ST', '2ND', 'RFM', 'TOTAL'].map((header, idx) => (
                          <th key={idx} style={{
                            padding: '10px 14px',
                            textAlign: idx >= 4 ? 'right' : 'left',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: idx === 9 ? 'white' : theme.text,
                            backgroundColor: idx === 9 ? '#3b82f6' : 'transparent',
                            width: idx === 9 ? '12%' : idx >= 4 ? '9.78%' : '12%',
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const combinedStock = (item.stock || 0) + (item.rfm_stock || 0);
                        const isNegative = combinedStock < 0;
                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: `1px solid ${theme.border}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              backgroundColor: theme.bg2,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.cardHover;
                              e.currentTarget.style.transform = 'scale(1.003)';
                              e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.12)';
                              e.currentTarget.style.borderRadius = '6px';
                              e.currentTarget.style.borderLeft = '4px solid #3b82f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = theme.bg2;
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderRadius = '0';
                              e.currentTarget.style.borderLeft = '4px solid transparent';
                            }}
                          >
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: theme.text }}>
                              {item.size || '-'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {item.box_type && (
                                <span style={{
                                  padding: '2px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  backgroundColor: darkMode ? 'rgba(16,185,129,0.2)' : '#dcfce7',
                                  color: darkMode ? '#34d399' : '#166534',
                                  display: 'inline-block',
                                }}>{item.box_type}</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', color: theme.text2 }}>
                              {item.material || '-'}
                            </td>
                            <td style={{ padding: '10px 14px', color: theme.text2 }}>
                              {item.brand || '-'}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                              {item.month_production ?? 0}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>
                              {item.month_sale ?? 0}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#3b82f6', fontWeight: 700 }}>
                              {item.stock ?? 0}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>
                              {item.second_stock ?? 0}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#8b5cf6', fontWeight: 700 }}>
                              {item.rfm_stock ?? 0}
                            </td>
                            <td style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: isNegative ? '#ef4444' : '#3b82f6',
                              backgroundColor: isNegative ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                              borderRadius: '4px',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isNegative ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isNegative ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}>
                              {combinedStock}
                            </td>
                          </tr>
                        );
                      })}
                      {!items.length && (
                        <tr>
                          <td colSpan="10" style={{
                            textAlign: 'center',
                            padding: '50px 20px',
                            color: theme.text2,
                          }}>
                            <i className="fas fa-inbox" style={{
                              fontSize: '2.5rem',
                              display: 'block',
                              marginBottom: '12px',
                              opacity: 0.3,
                            }}></i>
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {/* Footer TOTALS */}
                    {items.length > 0 && (
                      <tfoot style={{
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 10,
                      }}>
                        <tr style={{
                          backgroundColor: darkMode ? '#1e293b' : '#eff6ff',
                          borderTop: `3px solid #3b82f6`,
                          borderBottom: `3px solid #3b82f6`,
                          fontWeight: 800,
                        }}>
                          <td colSpan="4" style={{
                            padding: '10px 14px',
                            color: '#1e40af',
                            fontSize: '0.85rem',
                          }}>
                            📊 GRAND TOTALS
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#10b981', fontSize: '0.9rem' }}>
                            {totals.total_month_production ?? 0}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#ef4444', fontSize: '0.9rem' }}>
                            {totals.total_month_sale ?? 0}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#3b82f6', fontSize: '0.9rem' }}>
                            {totals.total_stock ?? 0}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f59e0b', fontSize: '0.9rem' }}>
                            {totals.total_second_stock ?? 0}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#8b5cf6', fontSize: '0.9rem' }}>
                            {totals.total_rfm_stock ?? 0}
                          </td>
                          <td style={{
                            padding: '10px 14px',
                            textAlign: 'right',
                            color: 'white',
                            backgroundColor: '#3b82f6',
                            fontSize: '1rem',
                            fontWeight: 900,
                          }}>
                            {totals.total_combined_stock ?? 0}
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