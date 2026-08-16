'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function TallySyncLogs() {
  const [data, setData] = useState(null);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [selectedItemMap, setSelectedItemMap] = useState({});

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const [logsRes, itemsRes] = await Promise.all([
      apiGet('/tallysync/logs/'),
      apiGet('/tallysync/stock-items/'),
    ]);
    if (logsRes) setData(logsRes);
    if (itemsRes) setStockItems(itemsRes);
    setLoading(false);
  }

  const handleRetryAll = async () => {
    setMessage(null);
    const res = await apiPost('/tallysync/retry-pending/', {});
    if (res && res.ok) {
      setMessage({ type: 'success', text: res.message });
      fetchLogs();
    } else {
      setMessage({ type: 'error', text: 'Failed to retry pending items' });
    }
  };

  const handleInlineResolve = async (pendingId, mappingType) => {
    const itemChoice = selectedItemMap[pendingId];
    if (!itemChoice) {
      alert('Pehle dropdown se ek item select karo!');
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
      setMessage({ type: 'success', text: res.message });
      fetchLogs();
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to resolve item' });
    }
  };

  const pending = data?.pending || [];
  const logs = data?.logs || [];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📋 Tally Sync Logs & Pending Items</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Real-time webhook activity logs and unmapped/insufficient stock items manager
            </p>
          </div>
          <div>
            <button onClick={handleRetryAll} className="btn btn-primary" style={{ background: '#2563eb' }}>
              <i className="fas fa-sync-alt mr-1"></i> Retry All Pending Now
            </button>
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '24px' }}>{message.text}</div>}

        {/* Section 1: Pending Items Requiring Action */}
        <div className="card" style={{ marginBottom: '28px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2><i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', marginRight: '8px' }}></i> Pending Items ({data?.pending_total || 0})</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Stock deduction pending due to unmapped item or low stock</span>
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
                    <th style={{ minWidth: '320px' }}>INLINE MAP & RESOLVE</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((p) => (
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
                            style={{ fontSize: '0.8rem', padding: '4px 8px', flex: 1 }}
                            value={selectedItemMap[p.id] || ''}
                            onChange={(e) => setSelectedItemMap({ ...selectedItemMap, [p.id]: e.target.value })}
                          >
                            <option value="">-- Select Matching Item --</option>
                            {stockItems?.items?.map((it) => (
                              <option key={`${it.module}:${it.id}`} value={`${it.module}:${it.id}`}>
                                [{it.module.toUpperCase()}] {it.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleInlineResolve(p.id, 'permanent')}
                            disabled={resolvingId === p.id}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#2563eb', whiteSpace: 'nowrap' }}
                            title="Save permanent mapping & deduct stock"
                          >
                            Permanent Map
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
                  {!pending.length && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#16a34a', padding: '24px', background: '#f0fdf4' }}>
                        <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i> All Tally sales vouchers are 100% stock synced!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section 2: Recent Sync Activity Logs */}
        <div className="card">
          <h2><i className="fas fa-stream" style={{ color: '#64748b', marginRight: '8px' }}></i> Recent Webhook Activity Logs</h2>
          <div className="table-container" style={{ marginTop: '16px' }}>
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
        </div>
      </div>
    </>
  );
}
