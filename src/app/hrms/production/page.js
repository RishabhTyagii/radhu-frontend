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

  // Filter + search state
  const [deptFilter, setDeptFilter] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDrop, setShowEmpDrop] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDrop, setShowItemDrop] = useState(false);
  const [isOtherItem, setIsOtherItem] = useState(false);

  const [rateSavedFromDB, setRateSavedFromDB] = useState(false);
  const [rateManuallyChanged, setRateManuallyChanged] = useState(false);

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
      apiGet('/stock/tyres/'),
    ]);
    if (empRes) setEmployees(empRes);
    if (deptRes) setDepartments(deptRes);
    if (prodRes) setProductions(prodRes);
    if (tyreRes) {
      const seen = new Set();
      const list = [];
      tyreRes.forEach((t) => {
        const w_str = t.weight ? ` [${t.weight}kg]` : '';
        const name = `${t.size} ${t.box_type} ${t.material} ${t.brand}${w_str}`.replace(/\s+/g, ' ').trim();
        if (!seen.has(name)) { seen.add(name); list.push(name); }
      });
      setTyreItems(list);
    }
    setLoading(false);
  }

  // Auto-fill last rate when employee + product changes
  useEffect(() => {
    if (!form.employee || !form.product_name) {
      setRateSavedFromDB(false);
      return;
    }
    setRateSavedFromDB(false);
    setRateManuallyChanged(false);
    apiGet(`/hrms/production/last-rate/?employee_id=${form.employee}&product_name=${encodeURIComponent(form.product_name)}`)
      .then((res) => {
        if (res && Number(res.rate) > 0) {
          setForm((p) => ({ ...p, rate: res.rate }));
          setRateSavedFromDB(true);
          setRateManuallyChanged(false);
        }
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
    setSaving(true);
    setMessage(null);
    const res = await apiPost('/hrms/production/', form);
    setSaving(false);
    if (res && !res.error && !res.detail) {
      setMessage({ type: 'success', text: 'Production entry saved!' });
      setForm((p) => ({ ...p, product_name: '', quantity: '', rate: '', remarks: '' }));
      setItemSearch('');
      setIsOtherItem(false);
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

  return (
    <>
      <Navbar />
      <div className="container">

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Worker Piece-Rate Production</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Record daily piece-rate output for factory workers.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.8fr)', gap: '24px' }}>

          {/* ===== FORM ===== */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>New Entry</h2>
            
            {message && (
              <div className={`message ${message.type === 'success' ? 'ok' : 'err'}`} style={{ marginBottom: '24px', padding: '16px', borderRadius: '8px', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', fontWeight: 600 }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Filter by Department</label>
                <select className="form-select" value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setForm((p) => ({ ...p, employee: '' })); setEmpSearch(''); }}>
                  <option value="">-- All Departments --</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ position: 'relative' }} ref={empRef}>
                <label className="form-label">Worker / Employee *</label>
                <input type="text" placeholder="Search by name or code..."
                  className="form-input"
                  style={{ borderColor: form.employee ? '#3b82f6' : '' }}
                  value={empSearch}
                  onChange={(e) => { setEmpSearch(e.target.value); setForm((p) => ({ ...p, employee: '' })); setShowEmpDrop(true); }}
                  onFocus={() => setShowEmpDrop(true)} />
                {showEmpDrop && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    {filteredEmps.length === 0 && <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.875rem' }}>No employees found.</div>}
                    {filteredEmps.map((e) => (
                      <div key={e.id}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: form.employee === e.id ? '#eff6ff' : '#fff' }}
                        onClick={() => { setForm((p) => ({ ...p, employee: e.id })); setEmpSearch(e.employee_code + ' - ' + e.name); setShowEmpDrop(false); }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{e.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{e.employee_code} | {e.department_name || 'No Dept'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
              </div>

              {/* Item Selection */}
              {isChakka ? (
                <div className="form-group">
                  <label className="form-label">Chakka Item *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {CHAKKA_ITEMS.map((opt) => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: form.product_name === opt ? '#eff6ff' : '#f8fafc', border: '1px solid ' + (form.product_name === opt ? '#3b82f6' : '#e2e8f0'), borderRadius: '6px', cursor: 'pointer' }}>
                        <input type="radio" name="chakka_item" value={opt} checked={form.product_name === opt}
                          onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))}
                          style={{ accentColor: '#3b82f6' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ position: 'relative' }} ref={itemRef}>
                  <label className="form-label">Item / Tyre *</label>
                  {isOtherItem ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Enter item name..." autoFocus
                        className="form-input"
                        value={form.product_name}
                        onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))} required
                        style={{ flex: 1 }} />
                      <button type="button" onClick={() => { setIsOtherItem(false); setItemSearch(''); setForm((p) => ({ ...p, product_name: '' })); }}
                        className="btn btn-secondary">
                        X
                      </button>
                    </div>
                  ) : (
                    <>
                      <input type="text" placeholder="Search item or tyre..."
                        className="form-input"
                        style={{ borderColor: form.product_name ? '#3b82f6' : '' }}
                        value={itemSearch}
                        onChange={(e) => { setItemSearch(e.target.value); setForm((p) => ({ ...p, product_name: '' })); setShowItemDrop(true); }}
                        onFocus={() => setShowItemDrop(true)} />
                      {showItemDrop && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                          {filteredItems.length === 0 && <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.875rem' }}>No items found.</div>}
                          {filteredItems.map((label) => (
                            <div key={label}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: form.product_name === label ? '#eff6ff' : '#fff' }}
                              onClick={() => { setForm((p) => ({ ...p, product_name: label })); setItemSearch(label); setShowItemDrop(false); }}>
                              <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>{label}</div>
                            </div>
                          ))}
                          <div onClick={() => { setIsOtherItem(true); setShowItemDrop(false); }}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '1px solid #e2e8f0', fontWeight: 600, color: '#7c3aed', fontSize: '0.875rem', textAlign: 'center', background: '#faf5ff' }}>
                            + Other (Enter manually)
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Quantity (Pcs) *</label>
                  <input type="number" min="1" placeholder="e.g. 200" className="form-input"
                    value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate per Pc (Rs) *</label>
                  <input type="number" step="any" min="0" placeholder="e.g. 5.50"
                    className="form-input"
                    value={form.rate}
                    onChange={(e) => { setForm((p) => ({ ...p, rate: e.target.value })); setRateManuallyChanged(true); setRateSavedFromDB(false); }}
                    required />
                  {rateSavedFromDB && !rateManuallyChanged && (
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>Auto-filled from history</div>
                  )}
                  {rateManuallyChanged && form.rate && (
                    <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '4px' }}>Will save new rate</div>
                  )}
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 600, color: '#166534', fontSize: '0.875rem' }}>Total Earning:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803d' }}>
                  ₹{total}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks (Optional)</label>
                <input type="text" placeholder="Shift notes..." className="form-input"
                  value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
              </div>

              <button type="submit" className="btn" disabled={saving} style={{ width: '100%', background: '#2563eb', color: 'white', padding: '10px' }}>
                {saving ? 'Saving...' : 'Save Production Entry'}
              </button>
            </form>
          </div>

          {/* ===== ENTRIES TABLE ===== */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Recent Production</h2>
              <span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>{productions.length} entries</span>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, flex: 1, maxHeight: '650px' }}>
              <table className="table">
                <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 10 }}>
                  <tr>
                    <th>Date</th>
                    <th>Worker</th>
                    <th>Item</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</td></tr>
                  ) : productions.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No entries found.</td></tr>
                  ) : productions.map((p) => (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{p.date}</td>
                      <td style={{ fontWeight: 500, color: '#0f172a' }}>
                        <div>{p.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.department_name || '-'}</div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{p.product_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.quantity}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb' }}>₹{Number(p.rate).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>₹{Number(p.total_amount).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => handleDelete(p.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
