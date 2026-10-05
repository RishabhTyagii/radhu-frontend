'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiUpload } from '@/lib/api';

export default function CycleTyresProduction() {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState([]);
  const [cpEmployees, setCpEmployees] = useState([]);
  const [formData, setFormData] = useState({
    tyre_item: '',
    all_curing: '',
    second_grade: '0',
    rejected_grade: '0',
    date: new Date().toISOString().split('T')[0],
    remark: '',
    employee_id: '',
    rate: '',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rateFetchedFromDB, setRateFetchedFromDB] = useState(false);
  const [rateManuallyChanged, setRateManuallyChanged] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    fetchCpEmployees();
  }, []);

  async function fetchCpEmployees() {
    const res = await apiGet('/hrms/employees/?status=Active');
    if (res) {
      setCpEmployees(res); // Show ALL active employees
    }
  }

  useEffect(() => {
    if (!formData.employee_id || !formData.tyre_item) {
      setRateFetchedFromDB(false);
      return;
    }
    setRateFetchedFromDB(false);
    setRateManuallyChanged(false);
    
    const selectedItem = items.find(it => String(it.id) === String(formData.tyre_item));
    if (!selectedItem) return;
    
    const wVal = Number(selectedItem.weight);
    const w_str = wVal > 0 ? ` [${selectedItem.weight}kg]` : "";
    const itemName = `${selectedItem.size} ${selectedItem.box_type} ${selectedItem.material} ${selectedItem.brand}${w_str}`.replace(/\s+/g, " ").trim();
    
    apiGet(`/hrms/production/last-rate/?employee_id=${formData.employee_id}&product_name=${encodeURIComponent(itemName)}`)
      .then(res => {
        if (res && Number(res.rate) > 0) {
          setFormData(prev => ({ ...prev, rate: res.rate }));
          setRateFetchedFromDB(true);
          setRateManuallyChanged(false);
        }
      });
  }, [formData.employee_id, formData.tyre_item, items]);

  async function fetchInitialData() {
    const data = await apiGet('/cycletyres/production/');
    if (data) {
      setItems(data.items || []);
      setRecent(data.recent_entries || []);
      if (data.items?.length > 0 && !formData.tyre_item) {
        setFormData(prev => ({ ...prev, tyre_item: data.items[0].id }));
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await apiPost('/cycletyres/production/', formData);
    setLoading(false);
    if (res && res.ok) {
      setMessage({ type: 'success', text: `Production saved! 1st Grade: +${res.data.first_grade}, 2nd Grade: +${res.data.second_grade}` });
      setFormData(prev => ({ ...prev, all_curing: '', second_grade: '0', rejected_grade: '0', remark: '' }));
      fetchInitialData();
    } else {
      const errText = res?.data?.error || 'Failed to add entry';
      setMessage({ type: 'error', text: errText });
    }
  };

  const updateEmployee = async (entryId, empId) => {
    const rate = ''; 
    const res = await apiPost(`/cycletyres/production/${entryId}/employee/`, { employee_id: empId, rate });
    if (res && res.ok) {
      alert("Employee updated successfully");
      fetchInitialData();
    } else {
      alert("Failed to update employee: " + (res?.data?.error || "Unknown error"));
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setMessage({ type: 'error', text: 'Please select an Excel (.xlsx) file first.' });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', excelFile);
      const res = await apiUpload('/cycletyres/import-excel/', fd);
      setUploading(false);
      if (res && res.ok) {
        setMessage({ type: 'success', text: `Import successful! Imported ${res.data?.imported_count || 0} entries.` });
        setExcelFile(null);
        document.getElementById('excelFileInput').value = '';
        fetchInitialData();
      } else {
        setMessage({ type: 'error', text: res?.data?.error || 'Failed to import Excel file.' });
      }
    } catch (err) {
      setUploading(false);
      setMessage({ type: 'error', text: 'Network error while uploading file.' });
    }
  };

  const firstGradeCalc = (Number(formData.all_curing) || 0) - (Number(formData.second_grade) || 0) - (Number(formData.rejected_grade) || 0);

  return (
    <>
      <Navbar />
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Cycle Tyres Production</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Record daily production and curing yields.</p>
          </div>
          
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc' }}>
            <input 
              type="file" 
              id="excelFileInput"
              accept=".xlsx, .xls"
              className="form-input"
              style={{ width: '220px', padding: '6px' }}
              onChange={(e) => setExcelFile(e.target.files[0])}
            />
            <button onClick={handleExcelImport} disabled={uploading || !excelFile} className="btn" style={{ background: '#3b82f6', color: 'white' }}>
              {uploading ? 'Uploading...' : 'Import Data'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type === 'success' ? 'ok' : 'err'}`} style={{ marginBottom: '24px', padding: '16px', borderRadius: '8px', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', fontWeight: 600 }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '24px' }}>
          
          {/* Form */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>Single Entry</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Cycle Tyre *</label>
                <select className="form-select" value={formData.tyre_item} onChange={e => setFormData(p => ({ ...p, tyre_item: e.target.value }))} required>
                  <option value="">-- Select Tyre --</option>
                  {items.map(it => (
                    <option key={it.id} value={it.id}>{it.size} - {it.box_type} {it.brand} (1st: {it.stock}, 2nd: {it.second_stock})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">All Curing (Total Pcs) *</label>
                <input type="number" min="1" className="form-input" value={formData.all_curing} onChange={e => setFormData(p => ({ ...p, all_curing: e.target.value }))} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">2nd Grade</label>
                  <input type="number" min="0" className="form-input" value={formData.second_grade} onChange={e => setFormData(p => ({ ...p, second_grade: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rejected</label>
                  <input type="number" min="0" className="form-input" value={formData.rejected_grade} onChange={e => setFormData(p => ({ ...p, rejected_grade: e.target.value }))} />
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontWeight: 600, color: '#166534', fontSize: '0.875rem' }}>Auto-calculated 1st Grade:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: firstGradeCalc < 0 ? '#ef4444' : '#15803d' }}>
                  {firstGradeCalc} pcs
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Remark (Optional)</label>
                <input type="text" className="form-input" placeholder="Optional remark" value={formData.remark} onChange={e => setFormData(p => ({ ...p, remark: e.target.value }))} />
              </div>

              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Link Worker (Optional) - HRMS Wages</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Worker (Cycle Press)</label>
                    <select className="form-select" value={formData.employee_id} onChange={e => setFormData(p => ({ ...p, employee_id: e.target.value }))}>
                      <option value="">-- Select --</option>
                      {cpEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Rate/Pc (Rs)</label>
                    <input type="number" step="0.0001" className="form-input" placeholder="e.g. 1.78" value={formData.rate} onChange={e => { setFormData(p => ({ ...p, rate: e.target.value })); setRateManuallyChanged(true); }} />
                  </div>
                </div>
                {rateFetchedFromDB && !rateManuallyChanged && (
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '6px', fontWeight: 500 }}>Auto-filled from saved rates.</div>
                )}
                {rateManuallyChanged && formData.rate && (
                  <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '6px', fontWeight: 500 }}>Rate changed. Will update saved rates.</div>
                )}
              </div>

              <button type="submit" disabled={loading || firstGradeCalc < 0} className="btn" style={{ width: '100%', background: '#10b981', color: 'white', padding: '12px', fontSize: '1rem' }}>
                {loading ? 'Saving...' : 'Add Production'}
              </button>
            </form>
          </div>

          {/* Recent List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Recent Entries</h2>
              <span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>{recent.length} entries</span>
            </div>
            
            <div className="table-container" style={{ border: 'none', borderRadius: 0, flex: 1, maxHeight: '650px' }}>
              <table className="table">
                <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 10 }}>
                  <tr>
                    <th>Date</th>
                    <th>Worker</th>
                    <th>Tyre</th>
                    <th style={{ textAlign: 'right' }}>Curing</th>
                    <th style={{ textAlign: 'right', color: '#10b981' }}>1st</th>
                    <th style={{ textAlign: 'right', color: '#f59e0b' }}>2nd</th>
                    <th style={{ textAlign: 'right', color: '#ef4444' }}>Rej</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
                      <td>
                        <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', minWidth: '100px' }} value={e.linked_employee_id || ''} onChange={(evt) => updateEmployee(e.id, evt.target.value)}>
                          <option value="">- None -</option>
                          {cpEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>{e.tyre_item_detail ? `${e.tyre_item_detail.size} ${e.tyre_item_detail.box_type}` : '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{e.all_curing}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>+{e.first_grade}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>{e.second_grade}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>{e.rejected_grade}</td>
                    </tr>
                  ))}
                  {!recent.length && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        No recent entries found.
                      </td>
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
