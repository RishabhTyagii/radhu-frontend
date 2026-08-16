'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function TallySyncLogs() {
  const [data, setData] = useState(null);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tyre'); // 'tyre', 'cycletyre', 'tube', 'other'
  const [message, setMessage] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [selectedItemMap, setSelectedItemMap] = useState({});

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
      alert('Pehle dropdown se ek matching item select karo!');
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

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📋 Tally Sync Logs & Pending Items</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Categorized pending vouchers manager and paginated webhook activity logs
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
                    <th>REASON</th>
                    <th style={{ minWidth: '340px' }}>TRANSFER & INLINE MAP</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTabPending.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.voucher_number}</td>
                      <td>{p.voucher_date}</td>
                      <td>{p.party_name || '-'}</td>
                      <td style={{ fontWeight: 700, color: '#92400e' }}>{p.tally_item_name}</td>
                      <td style={{ fontWeight: 'bold' }}>{p.qty}</td>
                      <td><span className="badge red">{p.reason_display}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <select
                            className="form-select"
                            style={{ fontSize: '0.78rem', padding: '4px 6px', flex: 1 }}
                            value={selectedItemMap[p.id] || ''}
                            onChange={(e) => setSelectedItemMap({ ...selectedItemMap, [p.id]: e.target.value })}
                          >
                            <option value="">-- Select Target Item --</option>
                            
                            {stockItems?.tyre_items?.length > 0 && (
                              <optgroup label="🏎️ Auto Tyre">
                                {stockItems.tyre_items.map((it) => (
                                  <option key={`tyre:${it.id}`} value={`tyre:${it.id}`}>
                                    Auto Tyre: {it.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {stockItems?.cycletyre_items?.length > 0 && (
                              <optgroup label="🚴 Cycle Tyre">
                                {stockItems.cycletyre_items.map((it) => (
                                  <option key={`cycletyre:${it.id}`} value={`cycletyre:${it.id}`}>
                                    Cycle Tyre: {it.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {stockItems?.tube_items?.length > 0 && (
                              <optgroup label="🚲 Cycle Tube">
                                {stockItems.tube_items.map((it) => (
                                  <option key={`tube:${it.id}`} value={`tube:${it.id}`}>
                                    Cycle Tube: {it.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>

                          <button
                            onClick={() => handleInlineResolve(p.id, 'permanent')}
                            disabled={resolvingId === p.id}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#2563eb', whiteSpace: 'nowrap' }}
                            title="Save permanent mapping & deduct stock"
                          >
                            Map & Sync
                          </button>

                          <button
                            onClick={() => handleInlineResolve(p.id, 'one_time')}
                            disabled={resolvingId === p.id}
                            className="btn"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#f59e0b', color: 'white', whiteSpace: 'nowrap' }}
                            title="Deduct stock this time only without saving permanent mapping"
                          >
                            1-Time Sync
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </>
  );
}
