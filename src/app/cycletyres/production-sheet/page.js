'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTyreProductionSheet() {
  const [viewMode, setViewMode] = useState('month');
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, [viewMode, date, month]);

  async function fetchData() {
    setLoading(true);
    let url = '/cycletyres/production-sheet/?';
    if (viewMode === 'date') {
      url += `date=${date}`;
    } else {
      url += `month=${month}`;
    }
    const result = await apiGet(url);
    if (result) setData(result);
    setLoading(false);
  }

  const changeDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const changeMonth = (months) => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + months);
    setMonth(d.toISOString().slice(0, 7));
  };

  const items = data?.data || [];
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
    shadowHover: darkMode ? '0 8px 32px rgba(59,130,246,0.25)' : '0 8px 32px rgba(59,130,246,0.12)',
    cardHover: darkMode ? '#334155' : '#eff6ff',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
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
            padding: isMobile ? '10px 14px' : '14px 24px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '10px' : '14px',
            flexWrap: 'wrap',
            backgroundColor: theme.bg2,
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <span style={{
                  fontSize: isMobile ? '1.1rem' : '1.5rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  🚴 Production Sheet
                </span>
                <span style={{
                  marginLeft: '8px',
                  fontSize: '0.7rem',
                  color: theme.text2,
                  fontWeight: 500,
                  background: darkMode ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  WebkitTextFillColor: darkMode ? '#93c5fd' : '#1e40af',
                }}>
                  {viewMode === 'date' ? '📅 Daily' : '📊 Monthly'}
                </span>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '50px',
                  border: `2px solid ${theme.border}`,
                  backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                  color: theme.text,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
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
                {darkMode ? '🌙' : '☀️'}
                <span style={{ fontSize: '0.7rem' }}>{darkMode ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              flex: isMobile ? '1' : '0 1 auto',
            }}>
              <select
                style={{
                  padding: '6px 12px',
                  border: `2px solid ${theme.border}`,
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: theme.bg2,
                  color: theme.text,
                  height: '38px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                }}
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="date">📅 Daily View</option>
                <option value="month">📊 Monthly View</option>
              </select>
              
              {viewMode === 'date' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => changeDate(-1)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.bg3,
                      border: `2px solid ${theme.border}`,
                      borderRadius: '8px',
                      color: theme.text,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.bg3;
                      e.currentTarget.style.color = theme.text;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <input
                    type="date"
                    style={{
                      padding: '6px 12px',
                      border: `2px solid ${theme.border}`,
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      backgroundColor: theme.bg2,
                      color: theme.text,
                      height: '38px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                    }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={() => changeDate(1)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.bg3,
                      border: `2px solid ${theme.border}`,
                      borderRadius: '8px',
                      color: theme.text,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.bg3;
                      e.currentTarget.style.color = theme.text;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => changeMonth(-1)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.bg3,
                      border: `2px solid ${theme.border}`,
                      borderRadius: '8px',
                      color: theme.text,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.bg3;
                      e.currentTarget.style.color = theme.text;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <input
                    type="month"
                    style={{
                      padding: '6px 12px',
                      border: `2px solid ${theme.border}`,
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      backgroundColor: theme.bg2,
                      color: theme.text,
                      height: '38px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                    }}
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={() => changeMonth(1)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.bg3,
                      border: `2px solid ${theme.border}`,
                      borderRadius: '8px',
                      color: theme.text,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.8rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.bg3;
                      e.currentTarget.style.color = theme.text;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          {data?.totals && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: '1px',
              backgroundColor: theme.border,
              padding: 0,
              transition: 'all 0.3s ease',
            }}>
              {[
                { label: '🏭 All Curing', value: data.totals.all_curing?.toLocaleString(), color: '#6366f1' },
                { label: '✅ 1st Grade', value: data.totals.first_grade?.toLocaleString(), color: '#10b981' },
                { label: '🟡 2nd Grade', value: data.totals.second_grade?.toLocaleString(), color: '#f59e0b' },
                { label: '❌ Rejected', value: data.totals.rejected_grade?.toLocaleString(), color: '#ef4444' },
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: theme.bg2,
                    padding: isMobile ? '10px 12px' : '14px 20px',
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    borderBottom: `4px solid ${stat.color}`,
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
                    fontSize: isMobile ? '0.6rem' : '0.75rem',
                    color: theme.text2,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '1.2rem' : '1.8rem',
                    fontWeight: 800,
                    color: stat.color,
                    marginTop: '2px',
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
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
          <div style={{
            padding: '10px 20px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.bg2,
            flexShrink: 0,
          }}>
            <span style={{
              fontWeight: 600,
              color: theme.text,
              fontSize: '0.85rem',
            }}>
              <i className="fas fa-table" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
              {viewMode === 'date' ? `📅 ${date}` : `📊 ${month}`} — 
              <span style={{ color: '#3b82f6', fontWeight: 700, marginLeft: '4px' }}>
                {data?.count || 0} items
              </span>
            </span>
            <button
              onClick={fetchData}
              style={{
                padding: '4px 12px',
                backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#e2e8f0';
                e.currentTarget.style.color = theme.text;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'calc(100% - 50px)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-spinner fa-spin" style={{
                  fontSize: '2.5rem',
                  color: '#3b82f6',
                  display: 'block',
                  marginBottom: '12px',
                }}></i>
                <p style={{ color: theme.text2, fontWeight: 500 }}>Loading production data...</p>
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1,
              overflow: 'auto',
              height: 'calc(100% - 50px)',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                minWidth: '700px',
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
                    {['#', 'Tyre Item', 'Size', 'Material', 'Brand', 'All Curing', '1st Grade', '2nd Grade', 'Rejected'].map((header, idx) => {
                      const colors = ['', '', '', '', '', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];
                      return (
                        <th key={idx} style={{
                          padding: isMobile ? '8px 10px' : '12px 16px',
                          textAlign: idx >= 5 ? 'right' : 'left',
                          fontWeight: 700,
                          fontSize: isMobile ? '0.65rem' : '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: idx >= 5 ? colors[idx] : theme.text,
                          borderBottom: idx >= 5 ? `2px solid ${colors[idx]}` : 'none',
                          width: idx === 0 ? '5%' : idx === 1 ? '20%' : 'auto',
                        }}>
                          {header}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        backgroundColor: theme.bg2,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.cardHover;
                        e.currentTarget.style.transform = 'scale(1.002)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.08)';
                        e.currentTarget.style.borderRadius = '6px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.bg2;
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderRadius = '0';
                      }}
                    >
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', color: theme.text2, fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', fontWeight: 700, color: theme.text }}>
                        {item.tyre_name}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', color: theme.text2 }}>{item.size}</td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', color: theme.text2 }}>{item.material}</td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', color: theme.text2 }}>{item.brand}</td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', fontWeight: 700, color: '#6366f1' }}>
                        {item.all_curing?.toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                        {item.first_grade?.toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                        {item.second_grade?.toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                        {item.rejected_grade?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={9} style={{
                        textAlign: 'center',
                        padding: '50px 20px',
                        color: theme.text2,
                      }}>
                        <i className="fas fa-box-open" style={{
                          fontSize: '2.5rem',
                          display: 'block',
                          marginBottom: '12px',
                          opacity: 0.3,
                        }}></i>
                        No production entries found for this period
                      </td>
                    </tr>
                  )}
                </tbody>
                {data?.totals && items.length > 0 && (
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
                      <td colSpan={5} style={{
                        padding: isMobile ? '8px 10px' : '12px 16px',
                        color: '#1e40af',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                      }}>
                        📊 GRAND TOTALS
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', color: '#6366f1', fontSize: isMobile ? '0.85rem' : '1rem' }}>
                        {data.totals.all_curing?.toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', color: '#10b981', fontSize: isMobile ? '0.85rem' : '1rem' }}>
                        {data.totals.first_grade?.toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', color: '#f59e0b', fontSize: isMobile ? '0.85rem' : '1rem' }}>
                        {data.totals.second_grade?.toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '8px 10px' : '12px 16px', textAlign: 'right', color: '#ef4444', fontSize: isMobile ? '0.85rem' : '1rem' }}>
                        {data.totals.rejected_grade?.toLocaleString()}
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