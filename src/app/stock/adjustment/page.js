'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function Adjustment() {
  const [tyres, setTyres] = useState([]);
  const [msg, setMsg] = useState(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  const [form, setForm] = useState({
    tyre_item: '',
    bucket: 'stock',
    action: 'add',
    date: today,
    quantity: '',
    remark: ''
  });

  useEffect(() => {
    fetchTyres();
  }, []);

  async function fetchTyres() {
    const data = await apiGet('/stock/tyres/');
    if (data) setTyres(data);
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const res = await apiPost('/stock/adjustment/', form);
    if (res && res.ok) {
      setMsg({ type: 'success', text: 'Adjustment saved successfully' });
      setForm({ ...form, quantity: '', remark: '' });
    } else {
      const errText = typeof res?.data === 'object' ? JSON.stringify(res.data) : (res?.data?.error || 'Failed to save adjustment');
      setMsg({ type: 'error', text: errText });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Stock Adjustment</h1>
        </div>

        {msg && <div className={`message ${msg.type}`}>{msg.text}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Tyre</label>
                <select className="form-select" name="tyre_item" value={form.tyre_item} onChange={handleChange} required>
                  <option value="">Select Tyre...</option>
                  {tyres.map(t => (
                    <option key={t.id} value={t.id}>{t.tyre} {t.pattern} ({t.type})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bucket</label>
                <select className="form-select" name="bucket" value={form.bucket} onChange={handleChange}>
                  <option value="stock">STOCK</option>
                  <option value="repair_tyre_stock">Repair Tyre Stock</option>
                  <option value="rfm_ok_tyre">RFM OK Tyre</option>
                  <option value="old_tyres_2025">2025 Old Tyres</option>
                  <option value="on_hold_export">On hold for Export / OR</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Action</label>
                <select className="form-select" name="action" value={form.action} onChange={handleChange}>
                  <option value="add">Add (+)</option>
                  <option value="subtract">Subtract (-)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-input" name="quantity" value={form.quantity} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Remark</label>
                <input type="text" className="form-input" name="remark" value={form.remark} onChange={handleChange} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', border: 'none' }}>
              <i className="fas fa-sliders-h"></i> Save Adjustment
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
