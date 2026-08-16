'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function CycleTubeProduction() {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState([]);
  const [formData, setFormData] = useState({
    tube_item: '',
    bucket: 'stock',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    tube_quality: 'normal',
    remark: '',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const data = await apiGet('/cycletube/production/');
    if (data) {
      setItems(data.items || []);
      setRecent(data.recent_entries || []);
      if (data.items?.length > 0 && !formData.tube_item) {
        setFormData((prev) => ({ ...prev, tube_item: data.items[0].id }));
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiPost('/cycletube/production/', formData);
    setLoading(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: 'Production entry added successfully!' });
      setFormData((prev) => ({ ...prev, quantity: '', remark: '' }));
      fetchInitialData();
    } else {
      const errText = res?.data?.error || (res?.data ? JSON.stringify(res.data) : 'Failed to add entry');
      setMessage({ type: 'error', text: errText });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>🚲 Cycle Tube Production Entry</h1>
        </div>

        <div className="grid-2">
          <div className="card">
            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Cycle Tube *</label>
                <select
                  className="form-select"
                  value={formData.tube_item}
                  onChange={(e) => setFormData({ ...formData, tube_item: e.target.value })}
                  required
                >
                  <option value="">-- Select Tube --</option>
                  {items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.size} {t.type} {t.brand} (Stock: {t.stock}, RFM: {t.rfm_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Bucket *</label>
                <select
                  className="form-select"
                  value={formData.bucket}
                  onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                  required
                >
                  <option value="stock">STOCK</option>
                  <option value="rfm_stock">R.F.M. Stock</option>
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
                <label className="form-label">Production Quantity (Pcs) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tube Quality</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  {['normal', 'molded', 'second'].map((q) => (
                    <label key={q} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tube_quality"
                        value={q}
                        checked={formData.tube_quality === q}
                        onChange={(e) => setFormData({ ...formData, tube_quality: e.target.value })}
                      />
                      <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{q}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remark (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="Optional remark"
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Saving...' : 'Add Production'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Recent Production Entries</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tube</th>
                    <th>Qty</th>
                    <th>Quality</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.tube_item_detail ? `${e.tube_item_detail.size} ${e.tube_item_detail.type} ${e.tube_item_detail.brand}` : '-'}</td>
                      <td style={{ color: '#10b981', fontWeight: 'bold' }}>+{e.quantity}</td>
                      <td><span className="badge green">{e.tube_quality}</span></td>
                      <td>{e.user_username || '-'}</td>
                    </tr>
                  ))}
                  {!recent.length && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No entries found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
