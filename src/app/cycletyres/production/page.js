'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiUpload } from '@/lib/api';

export default function CycleTyresProduction() {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState([]);
  const [formData, setFormData] = useState({
    tyre_item: '',
    all_curing: '',
    second_grade: '0',
    rejected_grade: '0',
    date: new Date().toISOString().split('T')[0],
    remark: '',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Excel Upload states
  const [excelFile, setExcelFile] = useState(null);
  const [clearExisting, setClearExisting] = useState(true);
  const [importDate, setImportDate] = useState('');
  const [importMonth, setImportMonth] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const data = await apiGet('/cycletyres/production/');
    if (data) {
      setItems(data.items || []);
      setRecent(data.recent_entries || []);
      if (data.items?.length > 0 && !formData.tyre_item) {
        setFormData((prev) => ({ ...prev, tyre_item: data.items[0].id }));
      }
    }
  }

  const curing = Number(formData.all_curing) || 0;
  const second = Number(formData.second_grade) || 0;
  const rejected = Number(formData.rejected_grade) || 0;
  const firstGradeCalc = curing - (second + rejected);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiPost('/cycletyres/production/', formData);
    setLoading(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: `✅ Production saved! 1st Grade: +${res.data.first_grade}, 2nd Grade: +${res.data.second_grade}` });
      setFormData((prev) => ({ ...prev, all_curing: '', second_grade: '0', rejected_grade: '0', remark: '' }));
      fetchInitialData();
    } else {
      const errText = res?.data?.error || (res?.data ? JSON.stringify(res.data) : 'Failed to add entry');
      setMessage({ type: 'error', text: `❌ ${errText}` });
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setMessage({ type: 'error', text: 'Please select an Excel (.xlsx) file first.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setImportResult(null);

    try {
      const body = new FormData();
      body.append('file', excelFile);
      body.append('clear_existing', clearExisting ? 'true' : 'false');
      if (importDate) body.append('import_date', importDate);
      if (importMonth) body.append('import_month', importMonth);

      const res = await apiUpload('/cycletyres/import-excel/', body);
      setUploading(false);

      if (res && res.ok) {
        setMessage({ type: 'success', text: `✅ ${res.data.message}` });
        setImportResult(res.data);
        setExcelFile(null);
        const fileInput = document.getElementById('excelFileInput');
        if (fileInput) fileInput.value = '';
        fetchInitialData();
      } else {
        const errText = res?.data?.error || res?.data?.detail || 'Failed to import Excel file.';
        setMessage({ type: 'error', text: `❌ ${errText}` });
      }
    } catch (err) {
      setUploading(false);
      setMessage({ type: 'error', text: '❌ Network error while uploading file.' });
    }
  };

  const isMobile = windowWidth < 768;

  // Theme styles
  const theme = {
    bg: darkMode ? '#0f172a' : '#f1f5f9',
    bg2: darkMode ? '#1e293b' : '#ffffff',
    bg3: darkMode ? '#334155' : '#f8fafc',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    text2: darkMode ? '#94a3b8' : '#64748b',
    text3: darkMode ? '#cbd5e1' : '#475569',
    border: darkMode ? '#334155' : '#e2e8f0',
    border2: darkMode ? '#475569' : '#cbd5e1',
    shadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
    shadowHover: darkMode ? '0 8px 32px rgba(59,130,246,0.25)' : '0 8px 32px rgba(59,130,246,0.12)',
    cardHover: darkMode ? '#334155' : '#eff6ff',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.bg,
      margin: 0,
      padding: 0,
      overflow: 'auto',
      transition: 'all 0.3s ease',
    }}>
      <Navbar />

      <div style={{
        flex: 1,
        padding: isMobile ? '12px' : '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
      }}>

        {/* Header with Dark Mode Toggle */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.3rem' : '1.8rem',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              🚴 Production Entry
            </h1>
            <p style={{
              color: theme.text2,
              fontSize: '0.85rem',
              marginTop: '4px',
            }}>
              Add manual daily production or bulk import from Excel (.xlsx)
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '8px 18px',
              borderRadius: '50px',
              border: `2px solid ${theme.border}`,
              backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
              color: theme.text,
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
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
            {darkMode ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* Global Alert Message */}
        {message && (
          <div style={{
            marginBottom: '20px',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: message.type === 'success' ? darkMode ? 'rgba(16,185,129,0.15)' : '#f0fdf4' : darkMode ? 'rgba(239,68,68,0.15)' : '#fef2f2',
            color: message.type === 'success' ? darkMode ? '#34d399' : '#166534' : darkMode ? '#f87171' : '#991b1b',
            border: `2px solid ${message.type === 'success' ? darkMode ? '#34d399' : '#bbf7d0' : darkMode ? '#f87171' : '#fecaca'}`,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '1.2rem' }}>{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        {/* Bulk Excel Upload Card */}
        <div style={{
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '16px',
          boxShadow: theme.shadow,
          border: `2px solid ${theme.border}`,
          padding: isMobile ? '16px' : '24px',
          marginBottom: '24px',
          borderLeft: `6px solid #3b82f6`,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h3 style={{
                color: '#3b82f6',
                margin: 0,
                fontSize: isMobile ? '1rem' : '1.2rem',
                fontWeight: 700,
              }}>
                📊 Bulk Excel Import
              </h3>
              <p style={{
                color: theme.text2,
                fontSize: '0.8rem',
                marginTop: '4px',
              }}>
                Upload cycle tyre stock.xlsx to import April-July production
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>📁</span>
          </div>

          <form onSubmit={handleExcelImport} style={{ marginTop: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: '14px',
              marginBottom: '14px',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: '4px',
                }}>📄 Excel File (.xlsx)</label>
                <input
                  id="excelFileInput"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: '4px',
                }}>📅 Entry Date (Optional)</label>
                <input
                  type="date"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: '4px',
                }}>📊 Month Filter</label>
                <select
                  value={importMonth}
                  onChange={(e) => setImportMonth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Months (Apr-Jul)</option>
                  <option value="april">April Only</option>
                  <option value="may">May Only</option>
                  <option value="june">June Only</option>
                  <option value="july">July Only</option>
                </select>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '14px',
              alignItems: isMobile ? 'stretch' : 'center',
              flexWrap: 'wrap',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: theme.text,
              }}>
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6',
                  }}
                />
                Reset Old Stock & Replace Data
              </label>
              <button
                type="submit"
                disabled={uploading || !excelFile}
                style={{
                  padding: '10px 28px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: uploading || !excelFile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: uploading || !excelFile ? 0.6 : 1,
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!uploading && excelFile) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {uploading ? '⏳ Importing...' : '🚀 Import Data'}
              </button>
            </div>
          </form>

          {/* Import Result Breakdown */}
          {importResult && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
              borderRadius: '12px',
              border: `2px solid #3b82f6`,
              transition: 'all 0.3s ease',
            }}>
              <h4 style={{
                margin: '0 0 16px 0',
                color: '#3b82f6',
                fontWeight: 700,
              }}>📋 Import Report</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '16px',
              }}>
                {[
                  { label: 'Total Entries', value: importResult.created_entries, color: '#3b82f6' },
                  { label: '1st Grade Stock', value: importResult.total_stock?.toLocaleString('en-IN'), color: '#10b981' },
                  { label: '2nd Grade Stock', value: importResult.total_second_stock?.toLocaleString('en-IN'), color: '#f59e0b' },
                  { label: 'RFM Stock', value: importResult.total_rfm_stock || 0, color: '#ef4444' },
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    backgroundColor: darkMode ? '#1e293b' : 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    borderLeft: `4px solid ${stat.color}`,
                  }}>
                    <div style={{ fontSize: '0.7rem', color: theme.text2, fontWeight: 600 }}>{stat.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {importResult.month_summary && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                    minWidth: '500px',
                  }}>
                    <thead>
                      <tr style={{
                        backgroundColor: darkMode ? '#334155' : '#f1f5f9',
                        borderBottom: `2px solid ${theme.border}`,
                      }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: theme.text }}>Month</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: theme.text }}>Entries</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: theme.text }}>Curing</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>1st</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>2nd</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>Rejected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.month_summary.map((m, idx) => (
                        <tr key={idx} style={{
                          borderBottom: `1px solid ${theme.border}`,
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.cardHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: theme.text }}>{m.month}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: theme.text2 }}>{m.count}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: theme.text }}>{m.curing?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>+{m.first_grade?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>+{m.second_grade?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>{m.rejected?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '24px',
        }}>

          {/* Single Production Form */}
          <div style={{
            backgroundColor: theme.bg2,
            borderRadius: '16px',
            boxShadow: theme.shadow,
            border: `2px solid ${theme.border}`,
            padding: isMobile ? '16px' : '24px',
            transition: 'all 0.3s ease',
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: theme.text,
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>➕</span> Single Entry
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: '4px',
                }}>🔄 Cycle Tyre *</label>
                <select
                  value={formData.tyre_item}
                  onChange={(e) => setFormData({ ...formData, tyre_item: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  required
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">-- Select Tyre --</option>
                  {items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.size} {t.box_type} {t.material} {t.brand} (1st: {t.stock}, 2nd: {t.second_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: '4px',
                }}>📅 Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  required
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

              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: '4px',
                }}>🏭 All Curing (Total Pcs) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.all_curing}
                  onChange={(e) => setFormData({ ...formData, all_curing: e.target.value })}
                  placeholder="e.g. 500"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  required
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

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '14px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: theme.text,
                    marginBottom: '4px',
                  }}>🟡 2nd Grade</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.second_grade}
                    onChange={(e) => setFormData({ ...formData, second_grade: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `2px solid ${theme.border}`,
                      borderRadius: '10px',
                      backgroundColor: theme.bg2,
                      color: theme.text,
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: theme.text,
                    marginBottom: '4px',
                  }}>🔴 Rejected</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rejected_grade}
                    onChange={(e) => setFormData({ ...formData, rejected_grade: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `2px solid ${theme.border}`,
                      borderRadius: '10px',
                      backgroundColor: theme.bg2,
                      color: theme.text,
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#ef4444';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Auto-calculated 1st Grade */}
              <div style={{
                backgroundColor: darkMode ? 'rgba(16,185,129,0.1)' : '#f0fdf4',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `2px solid ${darkMode ? '#34d399' : '#bbf7d0'}`,
                marginBottom: '14px',
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: darkMode ? '#34d399' : '#166534',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>✅ Auto-calculated 1st Grade:</span>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: firstGradeCalc >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    {firstGradeCalc >= 0 ? firstGradeCalc : 'Invalid (Negative)'} pcs
                  </span>
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: '4px',
                }}>📝 Remark (Optional)</label>
                <input
                  type="text"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="Optional remark"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: theme.bg2,
                    color: theme.text,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
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
                type="submit"
                disabled={loading || firstGradeCalc < 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: loading || firstGradeCalc < 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: loading || firstGradeCalc < 0 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!loading && firstGradeCalc >= 0) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {loading ? '⏳ Saving...' : '💾 Add Production'}
              </button>
            </form>
          </div>

          {/* Recent Entries */}
          <div style={{
            backgroundColor: theme.bg2,
            borderRadius: '16px',
            boxShadow: theme.shadow,
            border: `2px solid ${theme.border}`,
            padding: isMobile ? '16px' : '24px',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <h3 style={{
                margin: 0,
                color: theme.text,
                fontSize: isMobile ? '1rem' : '1.2rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>📋</span> Recent Entries
              </h3>
              <span style={{
                fontSize: '0.7rem',
                color: theme.text2,
                fontWeight: 600,
                backgroundColor: darkMode ? '#334155' : '#f1f5f9',
                padding: '4px 12px',
                borderRadius: '12px',
              }}>
                {recent.length} entries
              </span>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              maxHeight: '400px',
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
                  backgroundColor: theme.bg2,
                }}>
                  <tr style={{
                    borderBottom: `2px solid ${theme.border}`,
                  }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: theme.text }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: theme.text }}>Tyre</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: theme.text }}>Curing</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>1st</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>2nd</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>Rej</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr
                      key={e.id}
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.cardHover;
                        e.currentTarget.style.transform = 'scale(1.002)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td style={{ padding: '8px 10px', color: theme.text, fontWeight: 600 }}>{e.date}</td>
                      <td style={{ padding: '8px 10px', color: theme.text2, fontSize: '0.75rem' }}>
                        {e.tyre_item_detail ? `${e.tyre_item_detail.size} ${e.tyre_item_detail.box_type}` : '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: theme.text }}>
                        {e.all_curing}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                        +{e.first_grade}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                        +{e.second_grade}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                        {e.rejected_grade}
                      </td>
                    </tr>
                  ))}
                  {!recent.length && (
                    <tr>
                      <td colSpan="6" style={{
                        textAlign: 'center',
                        padding: '30px 20px',
                        color: theme.text2,
                      }}>
                        <i className="fas fa-box-open" style={{
                          fontSize: '1.5rem',
                          display: 'block',
                          marginBottom: '8px',
                          opacity: 0.3,
                        }}></i>
                        No entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}