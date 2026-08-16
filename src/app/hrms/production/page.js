'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export default function HRMSProduction() {
  const [employees, setEmployees] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    product_name: '',
    quantity: '',
    rate: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [empRes, prodRes] = await Promise.all([
      apiGet('/hrms/employees/?status=Active'),
      apiGet('/hrms/production/'),
    ]);

    if (empRes) {
      setEmployees(empRes);
      if (empRes.length > 0 && !formData.employee) {
        setFormData((prev) => ({ ...prev, employee: empRes[0].id }));
      }
    }
    if (prodRes) setProductions(prodRes);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await apiPost('/hrms/production/', formData);
    setSaving(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: 'Worker piece-rate production entry saved!' });
      setFormData((prev) => ({ ...prev, product_name: '', quantity: '', rate: '', remarks: '' }));
      fetchData();
    } else {
      setMessage({ type: 'error', text: 'Failed to save production entry' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this production entry?')) return;
    const res = await apiDelete(`/hrms/production/${id}/`);
    if (res && res.ok) {
      fetchData();
    }
  };

  const qty = Number(formData.quantity) || 0;
  const rate = Number(formData.rate) || 0;
  const calculatedTotal = (qty * rate).toFixed(2);

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>⚙️ Worker Piece-Rate Production Entry</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Record piece-rate production output for factory workers
            </p>
          </div>
        </div>

        <div className="grid-2">
          {/* Form */}
          <div className="card">
            {message && <div className={`message ${message.type}`}>{message.text}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Worker / Employee *</label>
                <select
                  className="form-select"
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  required
                >
                  <option value="">-- Select Worker --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.employee_code} - {e.name} ({e.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Item / Process Name * (e.g. Curing 28x1.5, Tube Valve Fit)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tyre Curing 28x1.5"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity (Pcs) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 200"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate per Pc (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="e.g. 5.50"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>
                  Total Earning: ₹{calculatedTotal}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#10b981' }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Production Entry'}
              </button>
            </form>
          </div>

          {/* Recent Entries */}
          <div className="card">
            <h2>Recent Production Entries ({productions.length})</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading entries...</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Worker</th>
                      <th>Process / Item</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productions.map((p) => (
                      <tr key={p.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.date}</td>
                        <td style={{ fontWeight: 600 }}>{p.employee_name}</td>
                        <td>{p.product_name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{p.quantity}</td>
                        <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>₹{Number(p.total_amount).toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn"
                            style={{ background: 'transparent', color: '#ef4444', padding: '4px' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!productions.length && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                          No production entries recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
