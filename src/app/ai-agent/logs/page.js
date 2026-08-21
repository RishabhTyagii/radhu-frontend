'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

const STATUS_COLORS = {
  executed: '#059669',
  failed: '#dc2626',
  rejected: '#64748b',
  proposed: '#d97706',
  confirmed: '#2563eb',
  expired: '#94a3b8',
};

export default function AIAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (nextStatus) => {
    setLoading(true);
    const q = nextStatus ? `?status=${encodeURIComponent(nextStatus)}` : '';
    const data = await apiGet(`/ai/logs/${q}`);
    setLogs(data?.logs || []);
    setLoading(false);
  };

  useEffect(() => {
    load(status);
  }, [status]);

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>RADHU AI Audit Log</h1>
            <p style={{ color: '#64748b', marginTop: 4 }}>
              Har AI add / delete / import / entry yahan record hoti hai — kisne propose kiya, kisne confirm kiya.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['', 'executed', 'failed', 'proposed', 'rejected'].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              className="btn"
              onClick={() => setStatus(s)}
              style={{
                background: status === s ? '#0f172a' : '#f1f5f9',
                color: status === s ? '#fff' : '#334155',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Approved by</th>
                <th>Action</th>
                <th>Module</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Result / Error</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8}>Loading...</td></tr>
              )}
              {!loading && !logs.length && (
                <tr><td colSpan={8}>Abhi koi AI change nahi hai.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}</td>
                  <td>{log.user || '—'}</td>
                  <td>{log.approved_by || '—'}</td>
                  <td>{log.action}</td>
                  <td>{log.module}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${STATUS_COLORS[log.status] || '#64748b'}22`,
                        color: STATUS_COLORS[log.status] || '#334155',
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td>{log.summary}</td>
                  <td style={{ maxWidth: 280, fontSize: '0.8rem' }}>
                    {log.error_message || (log.result ? JSON.stringify(log.result) : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
