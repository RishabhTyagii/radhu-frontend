'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

const CHAKKA_ITEMS = ['RICK TYRE CTC', 'CYCLE TYRE CTC', 'RICK TYRE NYL', 'CYCLE TYRE NYL'];

const S = `
* { box-sizing: border-box; }
.pp { background: #f8fafc; min-height: 100vh; padding: 24px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.pp-hdr { margin-bottom: 24px; }
.pp-hdr h1 { font-size: 1.9rem; font-weight: 900; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.5px; }
.pp-hdr p { color: #64748b; font-size: 0.88rem; font-weight: 500; margin: 0; }
.pp-grid { display: grid; grid-template-columns: 400px 1fr; gap: 24px; align-items: start; }

/* Form card */
.form-card { background: #fff; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,.06); padding: 24px; }
.fg { margin-bottom: 14px; }
.fg label { display: block; font-size: 0.72rem; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.fg input, .fg select { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.9rem; font-weight: 600; color: #0f172a; outline: none; background: #fff; transition: border-color .15s; }
.fg input:focus, .fg select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
.fg input.selected { border-color: #3b82f6; }

/* Dropdowns */
.drop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px; max-height: 230px; overflow-y: auto; z-index: 100; box-shadow: 0 12px 36px rgba(0,0,0,.12); }
.drop-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f8fafc; font-weight: 600; font-size: 0.875rem; color: #0f172a; }
.drop-item:hover { background: #f0f9ff; }
.drop-item.active { background: #eff6ff; }
.drop-other { padding: 10px 14px; cursor: pointer; border-top: 2px solid #e2e8f0; font-weight: 800; color: #7c3aed; font-size: 0.85rem; text-align: center; background: #faf5ff; }

/* Total box */
.total-box { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 2px solid #34d399; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.total-box .tl { font-weight: 800; color: #065f46; font-size: 0.88rem; }
.total-box .tv { font-size: 1.6rem; font-weight: 900; color: #047857; }

/* Rate hint */
.rate-hint { font-size: 0.72rem; color: #64748b; font-weight: 600; margin-top: 4px; }
.rate-hint.saved { color: #059669; }
.rate-hint.manual { color: #d97706; }

/* Submit btn */
.sub-btn { width: 100%; padding: 13px; background: #1e40af; color: #fff; border: none; border-radius: 10px; font-weight: 900; font-size: 1rem; cursor: pointer; letter-spacing: 0.3px; transition: background .15s; }
.sub-btn:hover:not(:disabled) { background: #1d3a8a; }
.sub-btn:disabled { background: #94a3b8; cursor: not-allowed; }

/* Msg */
.msg { padding: 11px 16px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; margin-bottom: 14px; }
.msg.ok { background: #dcfce7; color: #166534; }
.msg.err { background: #fee2e2; color: #991b1b; }

/* Chakka radio */
.chakka-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.chakka-opt { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 9px; border: 2px solid #e2e8f0; cursor: pointer; transition: border-color .15s, background .15s; }
.chakka-opt.selected { border-color: #3b82f6; background: #eff6ff; }
.chakka-opt input { accent-color: #3b82f6; width: 15px; height: 15px; flex-shrink: 0; }
.chakka-opt span { font-size: 0.78rem; font-weight: 800; color: #1e293b; line-height: 1.3; }

/* Table card */
.table-card { background: #fff; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,.06); overflow: hidden; }
.table-hdr { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; }
.table-hdr h2 { font-size: 1.1rem; font-weight: 900; color: #0f172a; margin: 0; }
.entry-count { background: #f1f5f9; color: #475569; padding: 4px 14px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: #1e293b; }
thead th { padding: 12px 16px; font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: left; white-space: nowrap; }
tbody tr { border-bottom: 1px solid #f8fafc; transition: background .1s; }
tbody tr:hover { background: #f8fafc; }
tbody td { padding: 11px 16px; font-size: 0.855rem; color: #334155; }
.item-chip { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 3px 10px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
.del-btn { background: #fee2e2; color: #dc2626; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.75rem; }
`;

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
  const [rateSavedFromDB, setRateSavedFromDB] = useState(false);
  const [rateManuallyChanged, setRateManuallyChanged] = useState(false);

  const [form, setForm] = useState({
    employee: '', date: new Date().toISOString().slice(0, 10),
    product_name: '', quantity: '', rate: '', remarks: '',
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

  // When employee changes, load their dept-specific items
  useEffect(() => {
    if (!form.employee) return;
    apiGet('/hrms/production/items/?employee_id=' + form.employee).then(res => {
      if (res) setTyreItems(Array.isArray(res) ? res : []);
    });
  }, [form.employee]);

  // Auto-fill saved rate when employee + product selected
  useEffect(() => {
    if (!form.employee || !form.product_name) {
      setRateSavedFromDB(false);
      return;
    }
    setRateSavedFromDB(false);
    setRateManuallyChanged(false);
    apiGet(`/hrms/production/last-rate/?employee_id=${form.employee}&product_name=${encodeURIComponent(form.product_name)}`)
      .then(res => {
        if (res && Number(res.rate) > 0) {
          setForm(p => ({ ...p, rate: res.rate }));
          setRateSavedFromDB(true);
          setRateManuallyChanged(false);
        }
      });
  }, [form.employee, form.product_name]);

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
    if (tyreRes) setTyreItems(Array.isArray(tyreRes) ? tyreRes : []);
    setLoading(false);
  }

  const selectedEmp = employees.find(e => e.id === Number(form.employee));
  const selectedDeptObj = departments.find(d => d.id === Number(deptFilter));
  const isChakka =
    (selectedEmp?.department_name?.toLowerCase().includes('chakka')) ||
    (selectedDeptObj?.name?.toLowerCase().includes('chakka'));

  const filteredEmps = employees.filter(e => {
    if (deptFilter && String(e.department) !== String(deptFilter)) return false;
    if (empSearch) {
      const t = empSearch.toLowerCase();
      return e.name.toLowerCase().includes(t) || e.employee_code.toLowerCase().includes(t);
    }
    return true;
  });

  const filteredItems = tyreItems.filter(t =>
    typeof t === 'string' ? t.toLowerCase().includes(itemSearch.toLowerCase())
      : (t.name || '').toLowerCase().includes(itemSearch.toLowerCase())
  );

  function itemLabel(t) { return typeof t === 'string' ? t : t.name; }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.employee || !form.product_name || !form.quantity || !form.rate) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }
    setSaving(true); setMessage(null);
    const res = await apiPost('/hrms/production/', form);
    setSaving(false);
    if (res && !res.error && !res.detail) {
      setMessage({ type: 'success', text: 'Production entry saved! Rate auto-updated.' });
      setForm(p => ({ ...p, product_name: '', quantity: '', rate: '', remarks: '' }));
      setItemSearch(''); setIsOtherItem(false); setRateSavedFromDB(false); setRateManuallyChanged(false);
      fetchAll();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res?.detail || 'Failed to save entry.' });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return;
    const res = await apiDelete('/hrms/production/' + id + '/');
    if (res && res.ok) fetchAll();
  }

  const total = ((Number(form.quantity) || 0) * (Number(form.rate) || 0)).toFixed(2);

  return (
    <>
      <style>{S}</style>
      <Navbar />
      <div className="pp">
        <div className="pp-hdr">
          <h1>Worker Piece-Rate Production</h1>
          <p>Record daily piece-rate output for factory workers — rates auto-saved per employee per item</p>
        </div>

        <div className="pp-grid">
          {/* ===== FORM ===== */}
          <div className="form-card">
            {message && <div className={`msg ${message.type === 'success' ? 'ok' : 'err'}`}>{message.text}</div>}

            <form onSubmit={handleSubmit}>
              {/* Dept Filter */}
              <div className="fg">
                <label>Filter by Department</label>
                <select value={deptFilter}
                  onChange={e => { setDeptFilter(e.target.value); setForm(p => ({ ...p, employee: '' })); setEmpSearch(''); }}>
                  <option value="">-- All Departments --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Employee Autocomplete */}
              <div className="fg" style={{ position: 'relative' }} ref={empRef}>
                <label>Worker / Employee *</label>
                <input type="text" placeholder="Search by name or code..."
                  className={form.employee ? 'selected' : ''}
                  value={empSearch}
                  onChange={e => { setEmpSearch(e.target.value); setForm(p => ({ ...p, employee: '' })); setShowEmpDrop(true); }}
                  onFocus={() => setShowEmpDrop(true)} />
                {showEmpDrop && (
                  <div className="drop">
                    {filteredEmps.length === 0 && <div className="drop-item" style={{ color: '#94a3b8' }}>No employees found.</div>}
                    {filteredEmps.map(e => (
                      <div key={e.id}
                        className={`drop-item ${form.employee === e.id ? 'active' : ''}`}
                        onClick={() => { setForm(p => ({ ...p, employee: e.id })); setEmpSearch(`${e.employee_code} - ${e.name}`); setShowEmpDrop(false); }}>
                        <div style={{ fontWeight: 800 }}>{e.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{e.employee_code} | {e.department_name || 'No Dept'}</div>
                      </div>
                    ))}
                  </div>
                )}
                {form.employee && selectedEmp && (
                  <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#2563eb', fontWeight: 800 }}>
                    Selected: {selectedEmp.name} ({selectedEmp.department_name})
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="fg">
                <label>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>

              {/* Item Selection */}
              {isChakka ? (
                <div className="fg">
                  <label>Chakka Item *</label>
                  <div className="chakka-grid">
                    {CHAKKA_ITEMS.map(opt => (
                      <label key={opt} className={`chakka-opt ${form.product_name === opt ? 'selected' : ''}`}>
                        <input type="radio" name="chakka_item" value={opt} checked={form.product_name === opt}
                          onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="fg" style={{ position: 'relative' }} ref={itemRef}>
                  <label>Item / Tyre *</label>
                  {isOtherItem ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Enter item name..." autoFocus
                        value={form.product_name}
                        onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} required
                        style={{ flex: 1 }} />
                      <button type="button" onClick={() => { setIsOtherItem(false); setItemSearch(''); setForm(p => ({ ...p, product_name: '' })); }}
                        style={{ padding: '0 14px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '9px', cursor: 'pointer', fontWeight: 800, color: '#64748b' }}>
                        X
                      </button>
                    </div>
                  ) : (
                    <>
                      <input type="text" placeholder="Search item or tyre..."
                        className={form.product_name ? 'selected' : ''}
                        value={itemSearch}
                        onChange={e => { setItemSearch(e.target.value); setForm(p => ({ ...p, product_name: '' })); setShowItemDrop(true); }}
                        onFocus={() => setShowItemDrop(true)} />
                      {showItemDrop && (
                        <div className="drop">
                          {filteredItems.length === 0 && <div className="drop-item" style={{ color: '#94a3b8' }}>No items found.</div>}
                          {filteredItems.map(t => {
                            const label = itemLabel(t);
                            return (
                              <div key={label}
                                className={`drop-item ${form.product_name === label ? 'active' : ''}`}
                                onClick={() => { setForm(p => ({ ...p, product_name: label })); setItemSearch(label); setShowItemDrop(false); }}>
                                {label}
                              </div>
                            );
                          })}
                          <div className="drop-other" onClick={() => { setIsOtherItem(true); setShowItemDrop(false); }}>
                            + Other (Enter manually)
                          </div>
                        </div>
                      )}
                      {form.product_name && (
                        <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#2563eb', fontWeight: 800 }}>
                          Selected: {form.product_name}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Qty + Rate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="fg">
                  <label>Quantity (Pcs) *</label>
                  <input type="number" min="1" placeholder="e.g. 200" style={{ fontWeight: 800 }}
                    value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
                </div>
                <div className="fg">
                  <label>Rate per Pc (Rs) *</label>
                  <input type="number" step="any" min="0" placeholder="e.g. 5.50"
                    style={{ fontWeight: 900, color: '#1e40af' }}
                    value={form.rate}
                    onChange={e => { setForm(p => ({ ...p, rate: e.target.value })); setRateManuallyChanged(true); setRateSavedFromDB(false); }}
                    required />
                  {rateSavedFromDB && !rateManuallyChanged && (
                    <div className="rate-hint saved">Rate auto-filled from saved history</div>
                  )}
                  {rateManuallyChanged && (
                    <div className="rate-hint manual">Rate changed — new rate will be saved on submit</div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="total-box">
                <span className="tl">Total Earning</span>
                <span className="tv">Rs {total}</span>
              </div>

              {/* Remarks */}
              <div className="fg">
                <label>Remarks (Optional)</label>
                <input type="text" placeholder="Shift notes..."
                  value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
              </div>

              <button type="submit" className="sub-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Production Entry'}
              </button>
            </form>
          </div>

          {/* ===== ENTRIES TABLE ===== */}
          <div className="table-card">
            <div className="table-hdr">
              <h2>Recent Production Entries</h2>
              <span className="entry-count">{productions.length} entries</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Worker</th>
                    <th>Dept</th>
                    <th>Item / Process</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600 }}>Loading...</td></tr>
                  ) : productions.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600 }}>No production entries yet.</td></tr>
                  ) : productions.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{p.date}</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{p.employee_name}</td>
                      <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.department_name || '-'}</td>
                      <td><span className="item-chip">{p.product_name}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{p.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>Rs{Number(p.rate).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: '#166534' }}>Rs{Number(p.total_amount).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="del-btn" onClick={() => handleDelete(p.id)}>Delete</button>
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
