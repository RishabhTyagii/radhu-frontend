'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function CycleTyresSale() {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState([]);
  const [formData, setFormData] = useState({
    tyre_item: '',
    bucket: 'stock',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    bill_number: '',
    remark: '',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const data = await apiGet('/cycletyres/sale/');
    if (data) {
      setItems(data.items || []);
      setRecent(data.recent_entries || []);
      if (data.items?.length > 0 && !formData.tyre_item) {
        setFormData((prev) => ({ ...prev, tyre_item: data.items[0].id }));
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiPost('/cycletyres/sale/', formData);
    setLoading(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: 'Sale entry added successfully!' });
      setFormData((prev) => ({ ...prev, quantity: '', bill_number: '', remark: '' }));
      fetchInitialData();
    } else {
      const errText = res?.data?.error || (res?.data ? JSON.stringify(res.data) : 'Failed to process sale');
      setMessage({ type: 'error', text: errText });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>🚴 Cycle Tyre Sale / Dispatch Entry</h1>
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
                <label className="form-label">Cycle Tyre *</label>
                <select
                  className="form-select"
                  value={formData.tyre_item}
                  onChange={(e) => setFormData({ ...formData, tyre_item: e.target.value })}
                  required
                >
                  <option value="">-- Select Tyre --</option>
                  {items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.size} {t.box_type} {t.material} {t.brand} (1st: {t.stock}, 2nd: {t.second_stock}, RFM: {t.rfm_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sale From Bucket *</label>
                <select
                  className="form-select"
                  value={formData.bucket}
                  onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                  required
                >
                  <option value="stock">STOCK (1st Grade / Black)</option>
                  <option value="second_stock">2nd Grade Stock</option>
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
                <label className="form-label">Sale Quantity (Pcs) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g. 100"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bill Number * (Must be unique)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.bill_number}
                  onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                  placeholder="e.g. INV-5021"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Remark (Party name, notes)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="Party name waghera"
                />
              </div>

              <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Processing...' : 'Process Sale'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Recent Sale Entries</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tyre</th>
                    <th>Bucket</th>
                    <th>Qty</th>
                    <th>Bill No</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.tyre_item_detail ? `${e.tyre_item_detail.size} ${e.tyre_item_detail.box_type}` : '-'}</td>
                      <td><span className="badge red">{e.bucket_display || e.bucket}</span></td>
                      <td style={{ color: '#ef4444', fontWeight: 'bold' }}>-{e.quantity}</td>
                      <td>{e.bill_number || '-'}</td>
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
