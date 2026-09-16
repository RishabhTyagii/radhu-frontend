'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

const CHAKKA_ITEMS = ['RICK TYRE CTC', 'CYCLE TYRE CTC', 'RICK TYRE NYL', 'CYCLE TYRE NYL'];

export default function HRMSProduction() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tyreItems, setTyreItems] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [deptFilter, setDeptFilter] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDrop, setShowEmpDrop] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDrop, setShowItemDrop] = useState(false);
  const [isOtherItem, setIsOtherItem] = useState(false);

  const [form, setForm] = useState({
    employee: '',
    date: new Date().toISOString().slice(0, 10),
    product_name: '',
    quantity: '',
    rate: '',
    remarks: '',
  });

  const empRef = useRef(null);
  const itemRef = useRef(null);

  useEffect(() => {
    fetchAll();
    const handler = (e) => {
      if (empRef.current && !empRef.current.contains(e.target)) setShowEmpDrop(false);
      if (itemRef.current && !itemRef.current.contains(e.target)) setShowItemDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [empRes, deptRes, prodRes, tyreRes] = await Promise.all([
      apiGet('/hrms/employees/?status=Active'),
      apiGet('/hrms/departments/'),
      apiGet('/hrms/production/'),
      apiGet('/hrms/production/items/'),
    ]);
    if (empRes) setEmployees(empRes);
    if (deptRes) setDepartments(deptRes);
    if (prodRes) setProductions(prodRes);
    if (tyreRes) {
      setTyreItems(Array.isArray(tyreRes) ? tyreRes : []);
    }
    setLoading(false);
  }

  // Auto-fill last saved rate when employee + product changes
  useEffect(() => {
    if (!form.employee || !form.product_name) return;
    apiGet('/hrms/production/last-rate/?employee_id=' + form.employee + '&product_name=' + encodeURIComponent(form.product_name))
      .then((res) => {
        if (res && Number(res.rate) > 0) setForm((p) => ({ ...p, rate: res.rate }));
      });
  }, [form.employee, form.product_name]);

  const selectedEmp = employees.find((e) => e.id === Number(form.employee));
  const selectedDeptObj = departments.find((d) => d.id === Number(deptFilter));
  const isChakka =
    (selectedEmp && selectedEmp.department_name && selectedEmp.department_name.toLowerCase().includes('chakka')) ||
    (selectedDeptObj && selectedDeptObj.name && selectedDeptObj.name.toLowerCase().includes('chakka'));

  const filteredEmps = employees.filter((e) => {
    if (deptFilter && String(e.department) !== String(deptFilter)) return false;
    if (empSearch) {
      const t = empSearch.toLowerCase();
      return e.name.toLowerCase().includes(t) || e.employee_code.toLowerCase().includes(t);
    }
    return true;
  });

  const filteredItems = tyreItems.filter((t) => t.toLowerCase().includes(itemSearch.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.product_name || !form.quantity || !form.rate) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }
    setSaving(true); setMessage(null);
    const res = await apiPost('/hrms/production/', form);
    setSaving(false);
    if (res && !res.error && !res.detail) {
      setMessage({ type: 'success', text: 'Production entry saved!' });
      setForm((p) => ({ ...p, product_name: '', quantity: '', rate: '', remarks: '' }));
      setItemSearch(''); setIsOtherItem(false);
      fetchAll();
    } else {
      setMessage({ type: 'error', text: 'Failed to save entry.' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    const res = await apiDelete('/hrms/production/' + id + '/');
    if (res && res.ok) fetchAll();
  };

  const total = ((Number(form.quantity) || 0) * (Number(form.rate) || 0)).toFixed(2);

  // Style helpers
  const inp = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' };
  const lbl = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' };
  const card = { background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' };
  const th = { padding: '12px 14px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
  const td = { padding: '11px 14px', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' };
  const dropBox = { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', maxHeight: '220px', overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' };
  const dropItem = { padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' };

  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg,#f0f4ff,#f8fafc)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1500px', margin: '0 auto' }}>

          {/* Page Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>🏭 Worker Piece-Rate Production</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.9rem' }}>Record daily piece-rate output for factory workers</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', alignItems: 'start' }}>

            {/* ===== ENTRY FORM ===== */}
            <div style={card}>
              {message && (
                <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '0.875rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* 1. Department Filter */}
                <div>
                  <label style={lbl}>Filter by Department</label>
                  <select style={inp} value={deptFilter}
                    onChange={(e) => { setDeptFilter(e.target.value); setForm((p) => ({ ...p, employee: '' })); setEmpSearch(''); }}>
                    <option value="">-- All Departments --</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* 2. Employee Autocomplete */}
                <div style={{ position: 'relative' }} ref={empRef}>
                  <label style={lbl}>Worker / Employee *</label>
                  <input type="text" placeholder="Search by name or code..."
                    style={{ ...inp, border: form.employee ? '2px solid #3b82f6' : '2px solid #cbd5e1' }}
                    value={empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); setForm((p) => ({ ...p, employee: '' })); setShowEmpDrop(true); }}
                    onFocus={() => setShowEmpDrop(true)} />
                  {showEmpDrop && (
                    <div style={dropBox}>
                      {filteredEmps.length === 0 && <div style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.85rem' }}>No employees found.</div>}
                      {filteredEmps.map((e) => (
                        <div key={e.id}
                          style={{ ...dropItem, background: form.employee === e.id ? '#eff6ff' : '#fff' }}
                          onClick={() => { setForm((p) => ({ ...p, employee: e.id })); setEmpSearch(e.employee_code + ' - ' + e.name); setShowEmpDrop(false); }}>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{e.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{e.employee_code} | {e.department_name || 'No Dept'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.employee && (
                    <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>
                      ✓ {selectedEmp && selectedEmp.name}
                    </div>
                  )}
                </div>

                {/* 3. Date */}
                <div>
                  <label style={lbl}>Date *</label>
                  <input type="date" style={inp} value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
                </div>

                {/* 4. Item Selection — Chakka or Tyre Autocomplete */}
                {isChakka ? (
                  <div>
                    <label style={lbl}>Chakka Item *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {CHAKKA_ITEMS.map((opt) => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: form.product_name === opt ? '#eff6ff' : '#f8fafc', border: '2px solid ' + (form.product_name === opt ? '#3b82f6' : '#e2e8f0'), borderRadius: '8px', cursor: 'pointer' }}>
                          <input type="radio" name="chakka_item" value={opt} checked={form.product_name === opt}
                            onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))}
                            style={{ accentColor: '#3b82f6', width: '16px', height: '16px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }} ref={itemRef}>
                    <label style={lbl}>Item / Tyre *</label>
                    {isOtherItem ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" placeholder="Enter custom item..." autoFocus
                          style={{ ...inp, flex: 1 }}
                          value={form.product_name}
                          onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))} required />
                        <button type="button" style={{ padding: '0 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
                          onClick={() => { setIsOtherItem(false); setItemSearch(''); setForm((p) => ({ ...p, product_name: '' })); }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <input type="text" placeholder="Search tyre or item..."
                          style={{ ...inp, border: form.product_name ? '2px solid #3b82f6' : '2px solid #cbd5e1' }}
                          value={itemSearch}
                          onChange={(e) => { setItemSearch(e.target.value); setForm((p) => ({ ...p, product_name: '' })); setShowItemDrop(true); }}
                          onFocus={() => setShowItemDrop(true)} />
                        {showItemDrop && (
                          <div style={dropBox}>
                            {filteredItems.length === 0 && <div style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.85rem' }}>No items found.</div>}
                            {filteredItems.map((t) => (
                              <div key={t}
                                style={{ ...dropItem, fontWeight: 600, color: '#1e293b', fontSize: '0.85rem', background: form.product_name === t ? '#eff6ff' : '#fff' }}
                                onClick={() => { setForm((p) => ({ ...p, product_name: t })); setItemSearch(t); setShowItemDrop(false); }}>
                                {t}
                              </div>
                            ))}
                            <div style={{ padding: '10px 14px', cursor: 'pointer', background: '#f8fafc', color: '#7c3aed', fontWeight: 700, textAlign: 'center', borderTop: '2px solid #e2e8f0', fontSize: '0.85rem' }}
                              onClick={() => { setIsOtherItem(true); setShowItemDrop(false); }}>
                              + Other (Enter manually)
                            </div>
                          </div>
                        )}
                        {form.product_name && (
                          <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>✓ {form.product_name}</div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 5. Qty + Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>Quantity (Pcs) *</label>
                    <input type="number" min="1" style={{ ...inp, fontWeight: 800 }} placeholder="200"
                      value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={lbl}>Rate per Pc (Rs) *</label>
                    <input type="number" step="any" min="0" style={{ ...inp, fontWeight: 800, color: '#2563eb' }} placeholder="5.50"
                      value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))} required />
                  </div>
                </div>

                {/* Total */}
                <div style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', padding: '14px 18px', borderRadius: '10px', border: '2px solid #4ade80', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#166534' }}>Total Earning</span>
                  <span style={{ fontWeight: 900, color: '#15803d', fontSize: '1.4rem' }}>Rs {total}</span>
                </div>

                {/* Remarks */}
                <div>
                  <label style={lbl}>Remarks (Optional)</label>
                  <input type="text" style={inp} placeholder="Shift notes..."
                    value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
                </div>

                <button type="submit" disabled={saving}
                  style={{ width: '100%', padding: '14px', background: saving ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                  {saving ? 'Saving...' : '✔ Save Production Entry'}
                </button>
              </form>
            </div>

            {/* ===== ENTRIES TABLE ===== */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Production Entries</h2>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>
                  {productions.length} entries
                </span>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={th}>Date</th>
                      <th style={th}>Worker</th>
                      <th style={th}>Dept</th>
                      <th style={th}>Item / Process</th>
                      <th style={{ ...th, textAlign: 'right' }}>Qty</th>
                      <th style={{ ...th, textAlign: 'right' }}>Rate</th>
                      <th style={{ ...th, textAlign: 'right' }}>Total</th>
                      <th style={{ ...th, textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</td></tr>
                    ) : productions.length === 0 ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No production entries yet.</td></tr>
                    ) : productions.map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ ...td, color: '#475569', whiteSpace: 'nowrap' }}>{p.date}</td>
                        <td style={{ ...td, fontWeight: 700, color: '#0f172a' }}>{p.employee_name}</td>
                        <td style={{ ...td, fontSize: '0.78rem', color: '#64748b' }}>{p.department_name || '-'}</td>
                        <td style={td}>
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>{p.product_name}</span>
                        </td>
                        <td style={{ ...td, fontWeight: 800, textAlign: 'right' }}>{p.quantity}</td>
                        <td style={{ ...td, fontWeight: 600, textAlign: 'right', color: '#2563eb' }}>Rs{Number(p.rate).toFixed(2)}</td>
                        <td style={{ ...td, fontWeight: 900, textAlign: 'right', color: '#16a34a' }}>Rs{Number(p.total_amount).toFixed(2)}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <button onClick={() => handleDelete(p.id)}
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
