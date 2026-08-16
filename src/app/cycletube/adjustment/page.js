'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function CycleTubeAdjustment() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    tube_item: '',
    bucket: 'stock',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    remark: '',
  });
  const [actionType, setActionType] = useState('add');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const data = await apiGet('/cycletube/adjustment/');
    if (data) {
      setItems(data.items || []);
      if (data.items?.length > 0 && !formData.tube_item) {
        setFormData((prev) => ({ ...prev, tube_item: data.items[0].id }));
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const qtyVal = actionType === 'subtract' ? -Math.abs(Number(formData.quantity)) : Math.abs(Number(formData.quantity));
    const payload = {
      ...formData,
      quantity: qtyVal,
    };

    const res = await apiPost('/cycletube/adjustment/', payload);
    setLoading(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: 'Stock adjustment saved successfully!' });
      setFormData((prev) => ({ ...prev, quantity: '', remark: '' }));
      fetchItems();
    } else {
      const errText = res?.data?.error || (res?.data ? JSON.stringify(res.data) : 'Failed to process adjustment');
      setMessage({ type: 'error', text: errText });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="page-header">
          <h1>🚲 Cycle Tube Stock Adjustment</h1>
        </div>

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
              <label className="form-label">Action *</label>
              <select
                className="form-select"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                required
              >
                <option value="add">Add (+)</option>
                <option value="subtract">Subtract (-)</option>
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
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g. 50"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason / Remark</label>
              <input
                type="text"
                className="form-input"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="e.g. Reconciliation, market return"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#8b5cf6' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Adjustment'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
