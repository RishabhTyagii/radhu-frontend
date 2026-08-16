'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function CycleTubeProductionSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    valve_body_issued: '0.00',
    actual_wt_gross: '0.00',
    actual_mixing_compound: '0.00',
    jali: '0.00',
    die_wastage: '0.00',
    tube_cutting: '0.00',
    total_tube_waste: '0.00',
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate]);

  async function fetchSummary() {
    setLoading(true);
    let query = '?';
    if (startDate) query += `start_date=${startDate}&`;
    if (endDate) query += `end_date=${endDate}&`;

    const res = await apiGet(`/cycletube/production-summary/${query}`);
    if (res) setData(res);
    setLoading(false);
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const res = await apiPost('/cycletube/production-summary/', manualForm);
    if (res && res.ok) {
      setMessage({ type: 'success', text: `Manual entry saved for ${manualForm.date}` });
      fetchSummary();
    } else {
      setMessage({ type: 'error', text: 'Failed to save manual entry' });
    }
  };

  const rows = data?.summary || [];
  const totals = data?.totals || {};

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🚲 Cycle Tube — Production Summary</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Daily summary with auto-calculated formulas + ground-truth manual entry</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Manual Entry Form Panel */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3><i className="fas fa-edit" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>Daily Ground-Truth Manual Entry</h3>
          {message && <div className={`message ${message.type}`} style={{ marginTop: '12px' }}>{message.text}</div>}
          
          <form onSubmit={handleManualSubmit} style={{ marginTop: '16px' }}>
            <div className="grid-4">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Valve Body Issued</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.valve_body_issued}
                  onChange={(e) => setManualForm({ ...manualForm, valve_body_issued: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Actual Wt Gross (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.actual_wt_gross}
                  onChange={(e) => setManualForm({ ...manualForm, actual_wt_gross: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Actual Mixing Compound (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.actual_mixing_compound}
                  onChange={(e) => setManualForm({ ...manualForm, actual_mixing_compound: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jali Wastage (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.jali}
                  onChange={(e) => setManualForm({ ...manualForm, jali: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Die Wastage (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.die_wastage}
                  onChange={(e) => setManualForm({ ...manualForm, die_wastage: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tube Cutting (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.tube_cutting}
                  onChange={(e) => setManualForm({ ...manualForm, tube_cutting: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Tube Waste (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={manualForm.total_tube_waste}
                  onChange={(e) => setManualForm({ ...manualForm, total_tube_waste: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Save Manual Entry
            </button>
          </form>
        </div>

        {/* Summary Table */}
        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading production summary...</div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: 'var(--nav-bg)', color: 'white' }}>
                    <th>DATE</th>
                    <th style={{ textAlign: 'right' }}>PROD PCS</th>
                    <th style={{ textAlign: 'right' }}>VALVE BODY</th>
                    <th style={{ textAlign: 'right' }}>TARGET WT (KG)</th>
                    <th style={{ textAlign: 'right' }}>ACTUAL WT GROSS</th>
                    <th style={{ textAlign: 'right' }}>ACTUAL WT NET</th>
                    <th style={{ textAlign: 'right' }}>VARIANCE WT</th>
                    <th style={{ textAlign: 'right' }}>TARGET CONSUMPT</th>
                    <th style={{ textAlign: 'right' }}>ACTUAL COMP NET</th>
                    <th style={{ textAlign: 'right' }}>VARIANCE COMP</th>
                    <th style={{ textAlign: 'right' }}>ACTUAL MIXING</th>
                    <th style={{ textAlign: 'right' }}>TOTAL WASTE</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{r.pcs}</td>
                      <td style={{ textAlign: 'right' }}>{r.valve_body_issued}</td>
                      <td style={{ textAlign: 'right', color: '#0f766e', fontWeight: 600 }}>{r.target_wt}</td>
                      <td style={{ textAlign: 'right' }}>{r.actual_wt_gross}</td>
                      <td style={{ textAlign: 'right' }}>{r.actual_wt_net}</td>
                      <td style={{ textAlign: 'right', color: r.variance_wt < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                        {r.variance_wt}
                      </td>
                      <td style={{ textAlign: 'right' }}>{r.target_consmpt}</td>
                      <td style={{ textAlign: 'right' }}>{r.actual_comp_net}</td>
                      <td style={{ textAlign: 'right', color: r.variance_comp < 0 ? '#ef4444' : '#10b981' }}>{r.variance_comp}</td>
                      <td style={{ textAlign: 'right' }}>{r.actual_mixing_compound}</td>
                      <td style={{ textAlign: 'right', color: '#b45309', fontWeight: 600 }}>{r.total_tube_waste}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan="12" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No production summary data found.
                      </td>
                    </tr>
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#fef3c7', fontWeight: 'bold' }}>
                      <td>TOTALS</td>
                      <td style={{ textAlign: 'right' }}>{totals.pcs || 0}</td>
                      <td style={{ textAlign: 'right' }}>{totals.valve_body_issued || '0.00'}</td>
                      <td style={{ textAlign: 'right', color: '#0f766e' }}>{totals.target_wt || '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{totals.actual_wt_gross || '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{totals.actual_wt_net || '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{totals.variance_wt || '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{totals.target_consmpt || '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{totals.actual_comp_net || '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{totals.variance_comp || '0.00'}</td>
                      <td style={{ textAlign: 'right' }}>{totals.actual_mixing_compound || '0.00'}</td>
                      <td style={{ textAlign: 'right', color: '#b45309' }}>{totals.total_tube_waste || '0.00'}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
