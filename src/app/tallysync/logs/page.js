'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function TallySyncLogs() {
  const [data, setData] = useState(null);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tyre');
  const [message, setMessage] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  
  const [rowSearchMap, setRowSearchMap] = useState({});
  const [selectedItemMap, setSelectedItemMap] = useState({});
  const [rowCategoryOverride, setRowCategoryOverride] = useState({});
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPagination, setLogsPagination] = useState({ total_pages: 1, total_logs: 0 });

  useEffect(() => {
    fetchLogs(logsPage);
  }, [logsPage]);

  async function fetchLogs(page = 1) {
    setLoading(true);
    const [logsRes, itemsRes] = await Promise.all([
      apiGet(`/tallysync/logs/?page=${page}&page_size=15`),
      apiGet('/tallysync/stock-items/'),
    ]);

    if (logsRes) {
      setData(logsRes);
      setLogsPagination({
        total_pages: logsRes.total_pages || 1,
        total_logs: logsRes.total_logs || 0,
      });
    }
    if (itemsRes) setStockItems(itemsRes);
    setLoading(false);
  }

  const handleRetryAll = async () => {
    setMessage(null);
    const res = await apiPost('/tallysync/retry-pending/', {});
    if (res && res.ok) {
      setMessage({ type: 'success', text: res.message });
      fetchLogs(logsPage);
    } else {
      setMessage({ type: 'error', text: 'Failed to retry pending items' });
    }
  };

  const handleInlineResolve = async (pendingId, mappingType) => {
    const itemChoice = selectedItemMap[pendingId];
    if (!itemChoice) {
      alert('Pehle dropdown se matching item select karo!');
      return;
    }

    setResolvingId(pendingId);
    setMessage(null);

    const [module, item_id] = itemChoice.split(':');
    const res = await apiPost(`/tallysync/pending/${pendingId}/map/`, {
      module,
      item_id,
      mapping_type: mappingType,
    });

    setResolvingId(null);

    if (res && res.ok) {
      const successMsg = res.data?.message || res.message || 'Item resolved successfully';
      setMessage({ type: 'success', text: `✓ ${successMsg}` });
      if (data && data.pending) {
        const updatedPending = data.pending.filter((p) => p.id !== pendingId);
        setData({
          ...data,
          pending: updatedPending,
          pending_total: Math.max(0, (data.pending_total || 1) - 1),
        });
      }
    } else {
      const errorMsg = res?.data?.error || res?.data?.detail || 'Failed to resolve item';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const confirmDeletePending = async (mode) => {
    if (!deleteModalItem) return;
    const { id, name } = deleteModalItem;
    setDeleteModalItem(null);

    const res = await apiPost(`/tallysync/pending/${id}/delete/`, { mode });

    if (res && res.ok) {
      const successMsg = res.data?.message || res.message || 'Pending item deleted successfully';
      setMessage({
        type: 'success',
        text: `✓ ${successMsg}`,
      });
      if (data && data.pending) {
        const updatedPending = data.pending.filter((p) => p.id !== id);
        setData({
          ...data,
          pending: updatedPending,
          pending_total: Math.max(0, (data.pending_total || 1) - 1),
        });
      }
    } else {
      const errorMsg = res?.data?.error || res?.data?.detail || 'Failed to delete pending entry';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const allPending = data?.pending || [];
  const logs = data?.logs || [];

  function getItemCategory(item) {
    if (rowCategoryOverride[item.id]) return rowCategoryOverride[item.id];
    const name = (item.tally_item_name || '').toLowerCase();
    if (name.includes('tube') || name.includes('tb') || name.includes('mld') || name.includes('jt')) return 'tube';
    if (name.includes('cycle') && name.includes('tyre')) return 'cycletyre';
    if (name.includes('tyre') || name.includes('yodha') || name.includes('kamakazi') || name.includes('panther')) return 'tyre';
    return 'other';
  }

  const tyrePending = allPending.filter((p) => getItemCategory(p) === 'tyre');
  const cycleTyrePending = allPending.filter((p) => getItemCategory(p) === 'cycletyre');
  const tubePending = allPending.filter((p) => getItemCategory(p) === 'tube');
  const otherPending = allPending.filter((p) => getItemCategory(p) === 'other');

  let currentTabPending = [];
  if (activeTab === 'tyre') currentTabPending = tyrePending;
  else if (activeTab === 'cycletyre') currentTabPending = cycleTyrePending;
  else if (activeTab === 'tube') currentTabPending = tubePending;
  else if (activeTab === 'other') currentTabPending = otherPending;

  function getModuleItems(modKey) {
    if (modKey === 'tyre') return stockItems?.tyre_items?.map(i => ({ ...i, module: 'tyre' })) || [];
    if (modKey === 'cycletyre') return stockItems?.cycletyre_items?.map(i => ({ ...i, module: 'cycletyre' })) || [];
    if (modKey === 'tube') return stockItems?.tube_items?.map(i => ({ ...i, module: 'tube' })) || [];
    return [
      ...(stockItems?.tyre_items?.map(i => ({ ...i, module: 'tyre' })) || []),
      ...(stockItems?.cycletyre_items?.map(i => ({ ...i, module: 'cycletyre' })) || []),
      ...(stockItems?.tube_items?.map(i => ({ ...i, module: 'tube' })) || []),
    ];
  }

  return (
    <>
      <Navbar />
      {/* Full width container - edge to edge */}
      <div style={{ 
        minHeight: '100vh', 
        background: '#f0f4f9',
        padding: '0',
        margin: 0
      }}>
        {/* Hero Header - Edge to Edge */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          padding: '32px 40px',
          borderBottom: '3px solid #3b82f6',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <h1 style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.5px',
              }}>
                📋 Tally Sync Dashboard
              </h1>
              <p style={{
                color: '#94a3b8',
                fontSize: '14px',
                margin: '6px 0 0 0',
                letterSpacing: '0.2px',
              }}>
                Manage pending vouchers, map items & track sync activity
              </p>
            </div>
            <button
              onClick={handleRetryAll}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 24px rgba(59,130,246,0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(59,130,246,0.4)';
              }}
            >
              <span>🔄</span> Retry All Pending
            </button>
          </div>
        </div>

        {/* Main Content - Edge to Edge with padding */}
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 40px' }}>
          {message && (
            <div style={{
              padding: '16px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              borderLeft: `4px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span>{message.type === 'success' ? '✅' : '❌'}</span>
              {message.text}
            </div>
          )}

          {/* Pending Items Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            marginBottom: '32px',
            border: '1px solid #e9edf4',
          }}>
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #fafcff 0%, #f8fafc 100%)',
              borderBottom: '1px solid #e9edf4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: '#fef3c7',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#92400e',
                }}>
                  {data?.pending_total || 0}
                </span>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: 0,
                }}>
                  Pending Items
                </h2>
              </div>
              <span style={{
                fontSize: '13px',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '6px 14px',
                borderRadius: '20px',
              }}>
                Select target item & resolve instantly
              </span>
            </div>

            {/* Tabs - Modern Design */}
            <div style={{
              padding: '16px 24px 0 24px',
              display: 'flex',
              gap: '4px',
              borderBottom: '1px solid #e9edf4',
              backgroundColor: '#fafcff',
            }}>
              {[
                { key: 'tyre', label: '🏎️ Auto Tyre', count: tyrePending.length, color: '#3b82f6' },
                { key: 'cycletyre', label: '🚴 Cycle Tyre', count: cycleTyrePending.length, color: '#059669' },
                { key: 'tube', label: '🚲 Cycle Tube', count: tubePending.length, color: '#d97706' },
                { key: 'other', label: '📦 Other', count: otherPending.length, color: '#64748b' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: activeTab === tab.key ? 'white' : 'transparent',
                    color: activeTab === tab.key ? tab.color : '#64748b',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    borderRadius: '10px 10px 0 0',
                    borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.key) {
                      e.target.style.backgroundColor = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.key) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {tab.label}
                  <span style={{
                    background: activeTab === tab.key ? tab.color : '#e2e8f0',
                    color: activeTab === tab.key ? 'white' : '#64748b',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ padding: '24px', overflowX: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}></div>
                  <p style={{ color: '#64748b', marginTop: '16px' }}>Loading pending items...</p>
                </div>
              ) : (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                }}>
                  <thead>
                    <tr style={{
                      background: '#f8fafc',
                      borderBottom: '2px solid #e2e8f0',
                    }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voucher</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Party</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tally Item</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '320px' }}>🔍 Search & Select Item</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTabPending.map((p) => {
                      const rowSearch = rowSearchMap[p.id] || '';
                      const targetCategory = getItemCategory(p);
                      const rawItems = getModuleItems(targetCategory);
                      const filteredItems = rawItems.filter(it => 
                        !rowSearch || it.label.toLowerCase().includes(rowSearch.toLowerCase())
                      );

                      return (
                        <tr key={p.id} style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafcff'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{p.voucher_number}</td>
                          <td style={{ padding: '14px 16px', color: '#475569', whiteSpace: 'nowrap' }}>{p.voucher_date}</td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>{p.party_name || '-'}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#92400e', background: '#fffbeb', borderRadius: '6px' }}>{p.tally_item_name}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{p.qty}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <select
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                fontSize: '13px',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                              }}
                              value={targetCategory}
                              onChange={(e) => setRowCategoryOverride({ ...rowCategoryOverride, [p.id]: e.target.value })}
                              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            >
                              <option value="tyre">🏎️ Auto Tyre</option>
                              <option value="cycletyre">🚴 Cycle Tyre</option>
                              <option value="tube">🚲 Cycle Tube</option>
                              <option value="other">📦 Other</option>
                            </select>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 36px',
                                    borderRadius: '10px',
                                    border: '2px solid #e2e8f0',
                                    fontSize: '13px',
                                    background: 'white',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box',
                                  }}
                                  placeholder={`🔍 Search ${targetCategory.toUpperCase()} items...`}
                                  value={rowSearch}
                                  onChange={(e) => setRowSearchMap({ ...rowSearchMap, [p.id]: e.target.value })}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                />
                                <span style={{
                                  position: 'absolute',
                                  left: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#94a3b8',
                                  fontSize: '14px',
                                }}>🔍</span>
                              </div>
                              <select
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                  border: '2px solid #e2e8f0',
                                  background: 'white',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  transition: 'all 0.2s ease',
                                  boxSizing: 'border-box',
                                }}
                                value={selectedItemMap[p.id] || ''}
                                onChange={(e) => setSelectedItemMap({ ...selectedItemMap, [p.id]: e.target.value })}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#3b82f6';
                                  e.target.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e2e8f0';
                                  e.target.style.boxShadow = 'none';
                                }}
                              >
                                <option value="">-- Select Target Item ({filteredItems.length}) --</option>
                                {filteredItems.map((it) => (
                                  <option key={`${it.module}:${it.id}`} value={`${it.module}:${it.id}`}>
                                    [{it.module.toUpperCase()}] {it.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleInlineResolve(p.id, 'permanent')}
                                disabled={resolvingId === p.id}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                                  opacity: resolvingId === p.id ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)';
                                }}
                              >
                                Map & Sync
                              </button>
                              <button
                                onClick={() => handleInlineResolve(p.id, 'one_time')}
                                disabled={resolvingId === p.id}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                                  opacity: resolvingId === p.id ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(245,158,11,0.4)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(245,158,11,0.3)';
                                }}
                              >
                                1-Time Sync
                              </button>
                              <button
                                onClick={() => setDeleteModalItem({ id: p.id, name: p.tally_item_name })}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #fecaca',
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#fee2e2';
                                  e.target.style.borderColor = '#fca5a5';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#fef2f2';
                                  e.target.style.borderColor = '#fecaca';
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!currentTabPending.length && (
                      <tr>
                        <td colSpan="8" style={{
                          textAlign: 'center',
                          padding: '48px 20px',
                          color: '#16a34a',
                          background: '#f0fdf4',
                          fontSize: '16px',
                          fontWeight: 500,
                        }}>
                          ✅ No pending items in this category!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Logs Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            border: '1px solid #e9edf4',
          }}>
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #fafcff 0%, #f8fafc 100%)',
              borderBottom: '1px solid #e9edf4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#0f172a',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span>📊</span> Sync Activity Logs
              </h2>
              <span style={{
                fontSize: '13px',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '6px 14px',
                borderRadius: '20px',
              }}>
                Total: {logsPagination.total_logs} logs
              </span>
            </div>

            <div style={{ padding: '24px', overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}>
                <thead>
                  <tr style={{
                    background: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                  }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Level</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voucher</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafcff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', color: '#475569', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 14px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: log.level === 'info' ? '#dcfce7' : log.level === 'warning' ? '#fef3c7' : '#fee2e2',
                          color: log.level === 'info' ? '#166534' : log.level === 'warning' ? '#92400e' : '#991b1b',
                        }}>
                          {log.level}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{log.invoice_number || '-'}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#334155' }}>{log.message}</td>
                    </tr>
                  ))}
                  {!logs.length && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                        No logs recorded yet. Run TallySync to sync.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsPagination.total_pages > 1 && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e9edf4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                background: '#fafcff',
              }}>
                <button
                  onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
                  disabled={logsPage <= 1}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: logsPage <= 1 ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = '#f8fafc';
                      e.target.style.borderColor = '#94a3b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  ← Previous
                </button>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}>
                  Page {logsPage} of {logsPagination.total_pages}
                </span>
                <button
                  onClick={() => setLogsPage((prev) => Math.min(logsPagination.total_pages, prev + 1))}
                  disabled={logsPage >= logsPagination.total_pages}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: logsPage >= logsPagination.total_pages ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = '#f8fafc';
                      e.target.style.borderColor = '#94a3b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        {deleteModalItem && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.25s ease-out',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <span style={{
                  fontSize: '28px',
                }}>⚠️</span>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                }}>
                  Delete Entry
                </h3>
              </div>
              <p style={{
                fontSize: '15px',
                color: '#334155',
                marginBottom: '24px',
                lineHeight: 1.6,
              }}>
                Aap <strong style={{ color: '#dc2626' }}>"{deleteModalItem.name}"</strong> entry ko delete kar rahe hain. Kaunsa option apply karna chahte hain?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => confirmDeletePending('mapping_only')}
                  style={{
                    textAlign: 'left',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>⚠️ Remove Sync Entry Only</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Sirf pending list se remove hoga. Invoice totals, GST, aur Stock intact rahenge.
                  </div>
                </button>

                <button
                  onClick={() => confirmDeletePending('full')}
                  style={{
                    textAlign: 'left',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '2px solid #fca5a5',
                    background: '#fef2f2',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f87171';
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#fca5a5';
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>🗑️ Full Delete (Deduct Bill & Revert Stock)</div>
                  <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                    Pura remove hoga — Stock revert hoga aur Invoice total / GST se amount minus ho jayegi.
                  </div>
                </button>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => setDeleteModalItem(null)}
                  style={{
                    padding: '10px 28px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global CSS for animations */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes scaleIn {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}