'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function CycleTyresDailySummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState(getToday());
  const [manualForm, setManualForm] = useState({
    date: getToday(),
    parchi_kg: '',
    mixing_actual_compound: '',
    chakka: '',
    calander_bias_cutt: '',
    packing_wastage: '',
    tar: '',
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const res = await apiGet(`/cycletyres/daily-summary/?${params.toString()}`);
      if (res) {
        setData(res);
      } else {
        setData({ summary: [], totals: {} });
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setData({ summary: [], totals: {} });
    }
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      date: manualForm.date,
      parchi_kg: manualForm.parchi_kg || '0.00',
      mixing_actual_compound: manualForm.mixing_actual_compound || '0.00',
      chakka: manualForm.chakka || '0.00',
      calander_bias_cutt: manualForm.calander_bias_cutt || '0.00',
      packing_wastage: manualForm.packing_wastage || '0.00',
      tar: manualForm.tar || '0.00',
    };

    try {
      const res = await apiPost('/cycletyres/daily-summary/', payload);
      if (res && res.ok) {
        setMessage({ type: 'success', text: `✅ Manual entry saved for ${formatDate(manualForm.date)}` });
        await fetchSummary();
      } else {
        const errText = res?.data?.error || res?.data?.detail || 'Failed to save manual entry.';
        setMessage({ type: 'error', text: `❌ ${errText}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Network error. Please check if the server is running.' });
    }
    setSaving(false);
  };

  const handleManualDateChange = (newDate) => {
    setManualForm(prev => ({ ...prev, date: newDate }));
    if (data?.summary) {
      const existing = data.summary.find(r => r.date === newDate);
      if (existing) {
        setManualForm(prev => ({
          ...prev,
          date: newDate,
          parchi_kg: existing.parchi_kg || '',
          mixing_actual_compound: existing.mixing_actual_compound || '',
          chakka: existing.chakka || '',
          calander_bias_cutt: existing.calander_bias_cutt || '',
          packing_wastage: existing.packing_wastage || '',
          tar: existing.tar || '',
        }));
      }
    }
  };

  const rows = data?.summary || [];
  const totals = data?.totals || {};

  const numVal = (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const fmtNum = (v) => {
    const n = numVal(v);
    return n % 1 === 0 ? n.toLocaleString('en-IN') : n.toFixed(2);
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🚴 Cycle Tyre — Daily Production Summary</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Auto-calculated from production entries + ground-truth manual data
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>From:</label>
              <input
                type="date"
                className="form-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ minWidth: '150px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>To:</label>
              <input
                type="date"
                className="form-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ minWidth: '150px' }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={fetchSummary}
              style={{ padding: '8px 16px' }}
            >
              🔍 Refresh
            </button>
          </div>
        </div>

        {/* Manual Entry Form Panel */}
        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '4px' }}>
            ✏️ Daily Ground-Truth Manual Entry
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Enter actual values from the factory floor — Packing Parchi, Mixing Compound, Chakka, Calander, Packing Wastage, Tar
          </p>

          {message && (
            <div
              className={`message ${message.type}`}
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: message.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                fontWeight: 500,
              }}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleManualSubmit}>
            <div className="grid-4">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={manualForm.date}
                  onChange={(e) => handleManualDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Packing Parchi (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.parchi_kg}
                  onChange={(e) => setManualForm({ ...manualForm, parchi_kg: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mixing Actual Compound (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.mixing_actual_compound}
                  onChange={(e) => setManualForm({ ...manualForm, mixing_actual_compound: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Chakka (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.chakka}
                  onChange={(e) => setManualForm({ ...manualForm, chakka: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Calander Bias Cutt (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.calander_bias_cutt}
                  onChange={(e) => setManualForm({ ...manualForm, calander_bias_cutt: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Packing Wastage (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.packing_wastage}
                  onChange={(e) => setManualForm({ ...manualForm, packing_wastage: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tar (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.tar}
                  onChange={(e) => setManualForm({ ...manualForm, tar: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Save Manual Entry'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Summary Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              📊 Daily Summary Table
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '12px' }}>
                {data?.start_date && data?.end_date
                  ? `${formatDate(data.start_date)} → ${formatDate(data.end_date)}`
                  : ''}
              </span>
            </h3>
            <span style={{
              background: rows.length > 0 ? '#dbeafe' : '#fef3c7',
              color: rows.length > 0 ? '#1e40af' : '#92400e',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              {rows.length} {rows.length === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
                Loading daily summary...
              </div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: 'var(--nav-bg)', color: 'white' }}>
                    <th>DATE</th>
                    <th style={{ textAlign: 'right' }}>PROD PCS</th>
                    <th style={{ textAlign: 'right' }}>PACKING PCS</th>
                    <th style={{ textAlign: 'right' }}>THEO KG</th>
                    <th style={{ textAlign: 'right' }}>PARCHI KG</th>
                    <th style={{ textAlign: 'right' }}>DIFFERENCE</th>
                    <th style={{ textAlign: 'right' }}>THEO COMPOUND</th>
                    <th style={{ textAlign: 'right' }}>MIXING ACTUAL</th>
                    <th style={{ textAlign: 'right' }}>VARIANCE</th>
                    <th style={{ textAlign: 'right' }}>CHAKKA</th>
                    <th style={{ textAlign: 'right' }}>CALANDER</th>
                    <th style={{ textAlign: 'right' }}>PACK WASTAGE</th>
                    <th style={{ textAlign: 'right' }}>TAR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.date || i} style={{ background: i % 2 === 0 ? 'transparent' : '#f8fafc' }}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmtNum(r.production_pcs)}</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmtNum(r.packing_pcs)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.theoretical_kg)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.parchi_kg)}</td>
                      <td style={{
                        textAlign: 'right',
                        color: numVal(r.difference) < 0 ? '#ef4444' : numVal(r.difference) > 0 ? '#10b981' : '#64748b',
                        fontWeight: 600,
                      }}>
                        {fmtNum(r.difference)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.theoretical_total_compound)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.mixing_actual_compound)}</td>
                      <td style={{
                        textAlign: 'right',
                        color: numVal(r.variance) < 0 ? '#ef4444' : numVal(r.variance) > 0 ? '#10b981' : '#64748b',
                        fontWeight: 600,
                      }}>
                        {fmtNum(r.variance)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.chakka)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.calander_bias_cutt)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.packing_wastage)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.tar)}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan="13" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📭</div>
                        No production or manual entries found for this date range.
                        <br />
                        <span style={{ fontSize: '0.8rem' }}>
                          Go to <strong>Production Entry</strong> to add curing data, or fill the manual entry form above.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#fef3c7', fontWeight: 'bold', borderTop: '2px solid #f59e0b' }}>
                      <td style={{ fontWeight: 800 }}>TOTALS</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.production_pcs)}</td>
                      <td style={{ textAlign: 'right', color: '#10b981' }}>{fmtNum(totals.packing_pcs)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.theoretical_kg)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.parchi_kg)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.difference)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.theoretical_total_compound)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.mixing_actual_compound)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.variance)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.chakka)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.calander_bias_cutt)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.packing_wastage)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(totals.tar)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '14px 18px',
            background: '#f1f5f9',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#475569',
          }}>
            <strong>📐 Formulas:</strong>
            <span style={{ marginLeft: '16px' }}>Theo KG = Curing Pcs × Item Weight</span>
            <span style={{ marginLeft: '16px' }}>|</span>
            <span style={{ marginLeft: '16px' }}>Theo Compound = Theo KG × 0.825</span>
            <span style={{ marginLeft: '16px' }}>|</span>
            <span style={{ marginLeft: '16px' }}>Difference = Parchi KG − Theo KG</span>
            <span style={{ marginLeft: '16px' }}>|</span>
            <span style={{ marginLeft: '16px' }}>Variance = Mixing Actual − Theo Compound</span>
          </div>
        </div>
      </div>
    </>
  );
}
