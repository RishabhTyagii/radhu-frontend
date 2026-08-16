'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function Dispatch() {
  const [tyres, setTyres] = useState([]);
  const [recent, setRecent] = useState([]);
  const [msg, setMsg] = useState(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  const [form, setForm] = useState({
    tyre_item: '',
    bucket: 'stock',
    date: today,
    quantity: '',
    bill_number: '',
    remark: ''
  });

  useEffect(() => {
    fetchTyres();
    fetchRecent();
  }, []);

  async function fetchTyres() {
    const data = await apiGet('/stock/tyres/');
    if (data) setTyres(data);
  }

  async function fetchRecent() {
    const data = await apiGet('/stock/dispatch/recent/');
    if (data) setRecent(data);
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const res = await apiPost('/stock/dispatch/', form);
    if (res && res.ok) {
      setMsg({ type: 'success', text: 'Dispatch entry added successfully' });
      setForm({ ...form, quantity: '', bill_number: '', remark: '' });
      fetchRecent();
    } else {
      const errText = typeof res?.data === 'object' ? JSON.stringify(res.data) : (res?.data?.error || 'Failed to add entry');
      setMsg({ type: 'error', text: errText });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Dispatch Entry</h1>
        </div>

        {msg && <div className={`message ${msg.type}`}>{msg.text}</div>}

        <div className="card" style={{ marginBottom: '24px' }}>
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
                <label className="form-label">Dispatch From / Bucket</label>
                <select className="form-select" name="bucket" value={form.bucket} onChange={handleChange}>
                  <option value="stock">STOCK</option>
                  <option value="repair_tyre_stock">Repair Tyre Stock</option>
                  <option value="rfm_ok_tyre">RFM OK Tyre</option>
                  <option value="old_tyres_2025">2025 Old Tyres</option>
                  <option value="on_hold_export">On hold for Export / OR</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Dispatch Quantity</label>
                <input type="number" className="form-input" name="quantity" value={form.quantity} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Bill Number</label>
                <input type="text" className="form-input" name="bill_number" value={form.bill_number} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Remark</label>
                <input type="text" className="form-input" name="remark" value={form.remark} onChange={handleChange} />
              </div>
            </div>
            <button type="submit" className="btn btn-danger" style={{ marginTop: '16px' }}>
              <i className="fas fa-truck-loading"></i> Save Dispatch
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Recent Dispatch Entries</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tyre</th>
                  <th>Bucket</th>
                  <th>Qty</th>
                  <th>Bill No</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.tyre_item ? `${item.tyre_item.tyre} ${item.tyre_item.pattern}` : '-'}</td>
                    <td>{item.bucket_display || item.bucket}</td>
                    <td><span className="badge red">{item.quantity}</span></td>
                    <td>{item.bill_number}</td>
                    <td>{item.user_display || '-'}</td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No recent entries</td>
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
