'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function Adjustment() {
  const [tyres, setTyres] = useState([]);
  const [msg, setMsg] = useState(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tyreSearchQuery, setTyreSearchQuery] = useState('');

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

  const filteredTyresForDropdown = useMemo(() => {
    if (!tyreSearchQuery.trim()) return tyres;
    const q = tyreSearchQuery.toLowerCase();
    return tyres.filter((t) => {
      const name = `${t.tyre || ''} ${t.pattern || ''} ${t.type || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [tyres, tyreSearchQuery]);

  const selectedTyreObject = useMemo(() => {
    if (!form.tyre_item) return null;
    return tyres.find((t) => String(t.id) === String(form.tyre_item));
  }, [form.tyre_item, tyres]);

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
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Tyre</label>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${isDropdownOpen ? '#2563eb' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '38px'
                  }}
                >
                  {selectedTyreObject ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                        {selectedTyreObject.tyre} <span style={{ color: '#2563eb' }}>{selectedTyreObject.pattern}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Type: {selectedTyreObject.type} | Stock: <strong style={{ color: '#10b981' }}>{selectedTyreObject.stock} pcs</strong>
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Select Tyre...</span>
                  )}
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{isDropdownOpen ? '▲' : '▼'}</span>
                </div>

                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    marginTop: '4px',
                    backgroundColor: '#fff',
                    border: `1px solid #cbd5e1`,
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '8px', borderBottom: `1px solid #e2e8f0`, backgroundColor: '#f8fafc' }}>
                      <input
                        type="text"
                        placeholder="Type to search..."
                        value={tyreSearchQuery}
                        onChange={(e) => setTyreSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: `1px solid #cbd5e1`,
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredTyresForDropdown.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setForm({ ...form, tyre_item: t.id });
                            setIsDropdownOpen(false);
                            setTyreSearchQuery('');
                          }}
                          style={{
                            padding: '8px 12px',
                            borderBottom: `1px solid #f1f5f9`,
                            cursor: 'pointer',
                            backgroundColor: String(form.tyre_item) === String(t.id) ? '#eff6ff' : 'transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                              {t.tyre} <span style={{ color: '#2563eb' }}>{t.pattern}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Type: {t.type}</div>
                          </div>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f0fdf4', color: '#10b981', fontSize: '0.7rem', fontWeight: 600 }}>
                            Stock: {t.stock}
                          </span>
                        </div>
                      ))}
                      {!filteredTyresForDropdown.length && (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No tyres found
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
