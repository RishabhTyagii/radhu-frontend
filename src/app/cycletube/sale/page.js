'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function CycleTubeSale() {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState([]);
  const [formData, setFormData] = useState({
    tube_item: '',
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
    const data = await apiGet('/cycletube/sale/');
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

    const res = await apiPost('/cycletube/sale/', formData);
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
          <h1>🚲 Cycle Tube Sale / Dispatch Entry</h1>
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
                <label className="form-label">Sale From Bucket *</label>
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
                <label className="form-label">Sale Quantity (Pcs) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g. 200"
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
                  placeholder="e.g. INV-1023"
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
                    <th>Tube</th>
                    <th>Bucket</th>
                    <th>Qty</th>
                    <th>Bill No</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.tube_item_detail ? `${e.tube_item_detail.size} ${e.tube_item_detail.type} ${e.tube_item_detail.brand}` : '-'}</td>
                      <td><span className="badge red">{e.bucket}</span></td>
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
