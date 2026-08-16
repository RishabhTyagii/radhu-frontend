'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete, apiFetch } from '@/lib/api';

export default function TallySyncLogs() {
  const [data, setData] = useState(null);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tyre'); // 'tyre', 'cycletyre', 'tube', 'other'
  const [message, setMessage] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  
  // Real-time search state per item row
  const [rowSearchMap, setRowSearchMap] = useState({});
  const [selectedItemMap, setSelectedItemMap] = useState({});

  // Delete modal state
  const [deleteModalItem, setDeleteModalItem] = useState(null);

  // Pagination for logs
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
      setMessage({ type: 'success', text: `✓ ${res.message}` });

      // INSTANT IN-MEMORY REMOVAL: Remove only this resolved item without reloading or tab reset!
      if (data && data.pending) {
        const updatedPending = data.pending.filter((p) => p.id !== pendingId);
        setData({
          ...data,
          pending: updatedPending,
          pending_total: Math.max(0, (data.pending_total || 1) - 1),
        });
      }
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to resolve item' });
    }
  };

  const confirmDeletePending = async (mode) => {
    if (!deleteModalItem) return;
    const { id, name } = deleteModalItem;
    setDeleteModalItem(null);

    const res = await apiFetch(`/tallysync/pending/${id}/delete/`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });

    if (res && res.ok) {
      const respData = await res.json();
      setMessage({
        type: 'success',
        text: `✓ ${respData.message}`,
      });

      // INSTANT IN-MEMORY REMOVAL: Remove from pending array
      if (data && data.pending) {
        const updatedPending = data.pending.filter((p) => p.id !== id);
        setData({
          ...data,
          pending: updatedPending,
          pending_total: Math.max(0, (data.pending_total || 1) - 1),
        });
      }
    } else {
      alert('Failed to delete pending entry');
    }
  };

  const allPending = data?.pending || [];
  const logs = data?.logs || [];

  // Helper keyword matcher to categorize unmapped items into 4 tabs
  function getItemCategory(item) {
    const name = (item.tally_item_name || '').toLowerCase();
    if (name.includes('tube') || name.includes('tb') || name.includes('mld') || name.includes('jt')) return 'tube';
    if (name.includes('cycle') && name.includes('tyre')) return 'cycletyre';
    if (name.includes('tyre') || name.includes('yodha') || name.includes('kamakazi') || name.includes('panther')) return 'tyre';
    return 'other';
  }

  // Filter pending items for active tab
  const tyrePending = allPending.filter((p) => getItemCategory(p) === 'tyre');
  const cycleTyrePending = allPending.filter((p) => getItemCategory(p) === 'cycletyre');
  const tubePending = allPending.filter((p) => getItemCategory(p) === 'tube');
  const otherPending = allPending.filter((p) => getItemCategory(p) === 'other');

  let currentTabPending = [];
  if (activeTab === 'tyre') currentTabPending = tyrePending;
  else if (activeTab === 'cycletyre') currentTabPending = cycleTyrePending;
  else if (activeTab === 'tube') currentTabPending = tubePending;
  else if (activeTab === 'other') currentTabPending = otherPending;

  // Get items for selection dropdown based on active tab
  function getTabItems(modKey) {
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
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📋 Tally Sync Logs & Pending Items</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Categorized pending vouchers manager, real-time searchable items, and paginated logs
            </p>
          </div>
          <div>
            <button onClick={handleRetryAll} className="btn btn-primary" style={{ background: '#2563eb' }}>
              <i className="fas fa-sync-alt mr-1"></i> Retry All Pending Now
            </button>
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '24px' }}>{message.text}</div>}

        {/* Section 1: Pending Items with 4 Navigation Tabs */}
        <div className="card" style={{ marginBottom: '28px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2>
              <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', marginRight: '8px' }}></i> 
              Pending Unmapped Items ({data?.pending_total || 0})
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Select target item & resolve instantly without full page refresh</span>
          </div>

          {/* 4 Tabs Navigation */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('tyre')}
              className="btn"
              style={{
                background: activeTab === 'tyre' ? '#2563eb' : '#f1f5f9',
                color: activeTab === 'tyre' ? 'white' : '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              🏎️ Auto Tyre ({tyrePending.length})
            </button>

            <button
              onClick={() => setActiveTab('cycletyre')}
              className="btn"
              style={{
                background: activeTab === 'cycletyre' ? '#059669' : '#f1f5f9',
                color: activeTab === 'cycletyre' ? 'white' : '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              🚴 Cycle Tyre ({cycleTyrePending.length})
            </button>

            <button
              onClick={() => setActiveTab('tube')}
              className="btn"
              style={{
                background: activeTab === 'tube' ? '#d97706' : '#f1f5f9',
                color: activeTab === 'tube' ? 'white' : '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              🚲 Cycle Tube ({tubePending.length})
            </button>

            <button
              onClick={() => setActiveTab('other')}
              className="btn"
              style={{
                background: activeTab === 'other' ? '#64748b' : '#f1f5f9',
                color: activeTab === 'other' ? 'white' : '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              📦 Other / Unmapped ({otherPending.length})
            </button>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Loading pending items...</div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: '#fffbeb' }}>
                    <th>VOUCHER</th>
                    <th>DATE</th>
                    <th>PARTY</th>
                    <th>TALLY ITEM NAME</th>
                    <th>QTY</th>
                    <th style={{ minWidth: '380px' }}>SEARCH & TARGET ITEM ({activeTab.toUpperCase()})</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTabPending.map((p) => {
                    const rowSearch = rowSearchMap[p.id] || '';
                    const rawItems = getTabItems(activeTab);
                    const filteredItems = rawItems.filter(it => 
                      !rowSearch || it.label.toLowerCase().includes(rowSearch.toLowerCase())
                    );

                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.voucher_number}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.voucher_date}</td>
                        <td>{p.party_name || '-'}</td>
                        <td style={{ fontWeight: 700, color: '#92400e' }}>{p.tally_item_name}</td>
                        <td style={{ fontWeight: 'bold' }}>{p.qty}</td>
                        <td>
                          {/* Searchable Real-Time Item Dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ position: 'relative' }}>
                              <i className="fas fa-search" style={{ position: 'absolute', left: '8px', top: '8px', fontSize: '0.75rem', color: '#94a3b8' }}></i>
                              <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '26px', fontSize: '0.75rem', height: '28px', borderRadius: '4px' }}
                                placeholder={`Type to search ${activeTab.toUpperCase()} items...`}
                                value={rowSearch}
                                onChange={(e) => setRowSearchMap({ ...rowSearchMap, [p.id]: e.target.value })}
                              />
                            </div>

                            <select
                              className="form-select"
                              style={{ fontSize: '0.78rem', padding: '4px 6px' }}
                              value={selectedItemMap[p.id] || ''}
                              onChange={(e) => setSelectedItemMap({ ...selectedItemMap, [p.id]: e.target.value })}
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
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleInlineResolve(p.id, 'permanent')}
                              disabled={resolvingId === p.id}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#2563eb' }}
                              title="Save permanent mapping & deduct stock"
                            >
                              Map & Sync
                            </button>

                            <button
                              onClick={() => handleInlineResolve(p.id, 'one_time')}
                              disabled={resolvingId === p.id}
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#d97706', color: 'white' }}
                              title="Deduct stock this time only"
                            >
                              1-Time Sync
                            </button>

                            <button
                              onClick={() => setDeleteModalItem({ id: p.id, name: p.tally_item_name })}
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444' }}
                              title="Delete Item / Entry"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!currentTabPending.length && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#16a34a', padding: '24px', background: '#f0fdf4' }}>
                        <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i> No pending items in this category tab!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section 2: Recent Sync Activity Logs (With Pagination) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2><i className="fas fa-stream" style={{ color: '#64748b', marginRight: '8px' }}></i> Sync Activity Logs</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Logs: {logsPagination.total_logs}</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Level</th>
                  <th>Voucher</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${log.level === 'info' ? 'green' : log.level === 'warning' ? 'yellow' : 'red'}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.invoice_number || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.message}</td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                      No logs recorded yet. Run TallySync GUI app to sync.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {logsPagination.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
                disabled={logsPage <= 1}
                className="btn"
                style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.85rem' }}
              >
                ← Previous
              </button>

              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                Page {logsPage} of {logsPagination.total_pages}
              </span>

              <button
                onClick={() => setLogsPage((prev) => Math.min(logsPagination.total_pages, prev + 1))}
                disabled={logsPage >= logsPagination.total_pages}
                className="btn"
                style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.85rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal with 2 Options */}
      {deleteModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '90%', padding: '24px' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-exclamation-triangle"></i> Delete Entry Confirmation
            </h3>
            <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#334155' }}>
              Aap <strong>"{deleteModalItem.name}"</strong> entry ko delete kar rahe hain. Kaunsa delete option apply karna chahte hain?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => confirmDeletePending('mapping_only')}
                className="btn"
                style={{
                  background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155',
                  textAlign: 'left', padding: '10px 14px', borderRadius: '6px',
                }}
              >
                <strong>⚠️ Option 1: Remove Sync Entry Only</strong>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Sirf pending list se remove hoga. Invoice totals, GST, aur Stock intact rahenge.
                </div>
              </button>

              <button
                onClick={() => confirmDeletePending('full')}
                className="btn"
                style={{
                  background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
                  textAlign: 'left', padding: '10px 14px', borderRadius: '6px',
                }}
              >
                <strong>🗑️ Option 2: Full Delete (Deduct Bill & Revert Stock)</strong>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                  Pura remove hoga — Stock revert hoga aur Invoice total / GST se amount minus ho jayegi.
                </div>
              </button>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setDeleteModalItem(null)} className="btn" style={{ background: '#e2e8f0', color: '#475569' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
