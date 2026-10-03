'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

const STYLES = `
  * { box-sizing: border-box; }
  .emp-page { background: #f8fafc; min-height: 100vh; padding: 28px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .emp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .emp-title h1 { font-size: 2rem; font-weight: 900; color: #0f172a; margin: 0 0 6px; letter-spacing: -0.5px; }
  .emp-title p { color: #64748b; font-size: 0.9rem; font-weight: 500; margin: 0; }
  .btn-primary { background: #1e40af; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 0.9rem; cursor: pointer; letter-spacing: 0.3px; transition: background .15s; }
  .btn-primary:hover { background: #1d3a8a; }
  .btn-ghost { background: #f1f5f9; color: #475569; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: background .15s; }
  .btn-ghost:hover { background: #e2e8f0; }
  .btn-danger { background: #fee2e2; color: #991b1b; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; }

  .stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #fff; border-radius: 14px; padding: 18px 22px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
  .stat-card .val { font-size: 2rem; font-weight: 900; color: #0f172a; line-height: 1; }
  .stat-card .lbl { font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
  .stat-card.blue .val { color: #1e40af; }
  .stat-card.green .val { color: #166534; }
  .stat-card.red .val { color: #991b1b; }

  .toolbar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
  .search-box { flex: 1; position: relative; }
  .search-box input { width: 100%; padding: 11px 16px 11px 42px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem; font-weight: 500; outline: none; background: #fff; color: #0f172a; }
  .search-box input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1rem; }
  .filter-select { padding: 11px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.88rem; font-weight: 600; color: #334155; background: #fff; outline: none; min-width: 200px; cursor: pointer; }
  .filter-select:focus { border-color: #3b82f6; }

  .table-wrap { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.05); }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #1e293b; }
  thead th { padding: 14px 18px; font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: left; white-space: nowrap; }
  tbody tr { border-bottom: 1px solid #f1f5f9; transition: background .1s; }
  tbody tr:hover { background: #f8fafc; }
  tbody tr:last-child { border-bottom: none; }
  td { padding: 14px 18px; font-size: 0.875rem; color: #334155; vertical-align: middle; }
  .emp-name { font-weight: 800; color: #0f172a; font-size: 0.9rem; }
  .emp-desig { font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-top: 2px; }
  .emp-code { font-weight: 700; color: #1e40af; font-size: 0.85rem; }
  .chip { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; }
  .chip-company { background: #eff6ff; color: #1d4ed8; }
  .chip-contractor { background: #fff7ed; color: #c2410c; }
  .chip-active { background: #dcfce7; color: #166534; }
  .chip-inactive { background: #fee2e2; color: #991b1b; }
  .actions { display: flex; gap: 8px; align-items: center; }
  .btn-view { background: #eff6ff; color: #1d4ed8; border: none; padding: 7px 14px; border-radius: 7px; font-weight: 700; font-size: 0.78rem; cursor: pointer; text-decoration: none; display: inline-block; }
  .btn-edit { background: #f0fdf4; color: #166534; border: none; padding: 7px 14px; border-radius: 7px; font-weight: 700; font-size: 0.78rem; cursor: pointer; }

  /* MODAL */
  .overlay { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; }
  .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 760px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .modal-head { padding: 24px 28px 0; border-bottom: 1px solid #f1f5f9; }
  .modal-head h2 { font-size: 1.3rem; font-weight: 900; color: #0f172a; margin: 0 0 16px; }
  .modal-body { padding: 24px 28px; }
  .modal-foot { padding: 16px 28px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #f1f5f9; }
  .section-title { font-size: 0.72rem; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 14px; padding-bottom: 6px; border-bottom: 2px solid #eff6ff; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; margin-bottom: 24px; }
  .form-grid.three { grid-template-columns: 1fr 1fr 1fr; }
  .form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .form-group input, .form-group select { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #0f172a; outline: none; background: #fff; }
  .form-group input:focus, .form-group select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
  .msg-ok { background: #dcfce7; color: #166534; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; margin-bottom: 16px; }
  .msg-err { background: #fee2e2; color: #991b1b; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; margin-bottom: 16px; }
`;

const EMPTY_FORM = {
  employee_code: '', name: '', father_name: '', mobile: '', alternate_mobile: '',
  email: '', dob: '', joining_date: new Date().toISOString().split('T')[0],
  department: '', designation: '', employee_type: 'Company', contractor_name: '',
  address: '', aadhaar: '', pan: '', bank_name: '', account_number: '',
  ifsc: '', uan: '', esi_number: '',
  basic_salary: '0', hourly_rate: '0', overtime_rate: '0', pf_percent: '0', esi_percent: '0',
  status: 'Active',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [emps, depts] = await Promise.all([apiGet('/hrms/employees/'), apiGet('/hrms/departments/')]);
    if (emps) setEmployees(emps);
    if (depts) setDepartments(depts);
    setLoading(false);
  }

  function openAdd() {
    setFormData(EMPTY_FORM);
    setEditId(null);
    setMsg(null);
    setModal('add');
  }

  function openEdit(emp) {
    setFormData({
      employee_code: emp.employee_code || '',
      name: emp.name || '',
      father_name: emp.father_name || '',
      mobile: emp.mobile || '',
      alternate_mobile: emp.alternate_mobile || '',
      email: emp.email || '',
      dob: emp.dob || '',
      joining_date: emp.joining_date || '',
      department: emp.department || '',
      designation: emp.designation || '',
      employee_type: emp.employee_type || 'Company',
      contractor_name: emp.contractor_name || '',
      address: emp.address || '',
      aadhaar: emp.aadhaar || '',
      pan: emp.pan || '',
      bank_name: emp.bank_name || '',
      account_number: emp.account_number || '',
      ifsc: emp.ifsc || '',
      uan: emp.uan || '',
      esi_number: emp.esi_number || '',
      basic_salary: emp.basic_salary || '0',
      hourly_rate: emp.hourly_rate || '0',
      overtime_rate: emp.overtime_rate || '0',
      pf_percent: emp.pf_percent || '0',
      esi_percent: emp.esi_percent || '0',
      status: emp.status || 'Active',
    });
    setEditId(emp.id);
    setMsg(null);
    setModal('edit');
  }

  function setField(k, v) { setFormData(p => ({ ...p, [k]: v })); }

  async function handleSave() {
    setSaving(true); setMsg(null);
    const res = modal === 'edit'
      ? await apiPatch(`/hrms/employees/${editId}/`, formData)
      : await apiPost('/hrms/employees/', formData);
    setSaving(false);
    if (res && !res.error && !res.detail) {
      setMsg({ ok: true, text: modal === 'edit' ? 'Employee updated!' : 'Employee added!' });
      fetchAll();
      setTimeout(() => { setModal(null); setMsg(null); }, 1500);
    } else {
      const errText = res?.detail || JSON.stringify(res) || 'Failed to save.';
      setMsg({ ok: false, text: errText });
    }
  }

  const filtered = (employees || []).filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.employee_code?.toLowerCase().includes(q);
    const matchDept = !deptFilter || String(e.department) === deptFilter;
    return matchSearch && matchDept;
  });

  const totalActive = employees.filter(e => e.status === 'Active').length;
  const totalInactive = employees.filter(e => e.status !== 'Active').length;

  function inp(key, label, type = 'text', opts = {}) {
    return (
      <div className="form-group" key={key}>
        <label>{label}</label>
        <input type={type} value={formData[key] || ''} onChange={e => setField(key, e.target.value)} {...opts} />
      </div>
    );
  }

  function sel(key, label, options) {
    return (
      <div className="form-group" key={key}>
        <label>{label}</label>
        <select value={formData[key] || ''} onChange={e => setField(key, e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <Navbar />
      <div className="emp-page">
        {/* Header */}
        <div className="emp-header">
          <div className="emp-title">
            <h1>Employee Directory</h1>
            <p>Comprehensive employee profiles, bank details and statutory records ({totalActive} active)</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>+ Add New Employee</button>
        </div>

        {/* Stats */}
        <div className="stat-row">
          <div className="stat-card"><div className="val">{employees.length}</div><div className="lbl">Total Employees</div></div>
          <div className="stat-card green"><div className="val">{totalActive}</div><div className="lbl">Active</div></div>
          <div className="stat-card red"><div className="val">{totalInactive}</div><div className="lbl">Inactive</div></div>
          <div className="stat-card blue"><div className="val">{departments.length}</div><div className="lbl">Departments</div></div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Loading employees...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Basic</th>
                  <th style={{ textAlign: 'right' }}>OT Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600 }}>No employees found.</td></tr>
                ) : filtered.map(emp => (
                  <tr key={emp.id}>
                    <td><span className="emp-code">{emp.employee_code}</span></td>
                    <td>
                      <div className="emp-name">{emp.name}</div>
                      <div className="emp-desig">{emp.designation}</div>
                    </td>
                    <td style={{ color: '#475569', fontWeight: 600 }}>{emp.department_name || '-'}</td>
                    <td><span className={`chip ${emp.employee_type === 'Company' ? 'chip-company' : 'chip-contractor'}`}>{emp.employee_type}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{Number(emp.basic_salary || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#475569' }}>₹{Number(emp.overtime_rate || 0).toFixed(2)}/hr</td>
                    <td><span className={`chip ${emp.status === 'Active' ? 'chip-active' : 'chip-inactive'}`}>{emp.status}</span></td>
                    <td>
                      <div className="actions">
                        <a href={`/hrms/employees/${emp.id}`} className="btn-view">View</a>
                        <button className="btn-edit" onClick={() => openEdit(emp)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-head">
              <h2>{modal === 'edit' ? `Edit Employee — ${formData.name}` : 'Add New Employee'}</h2>
            </div>
            <div className="modal-body">
              {msg && <div className={msg.ok ? 'msg-ok' : 'msg-err'}>{msg.text}</div>}

              <p className="section-title">1. Basic & Personal Info</p>
              <div className="form-grid">
                {inp('employee_code', 'Employee Code *')}
                {inp('name', 'Full Name *')}
                {inp('father_name', "Father's Name")}
                {inp('mobile', 'Mobile *', 'tel')}
                {inp('alternate_mobile', 'Alternate Mobile', 'tel')}
                {sel('status', 'Status', [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }])}
              </div>

              <p className="section-title">2. Department & Employment Role</p>
              <div className="form-grid">
                {sel('department', 'Department *', [{ value: '', label: '-- Select --' }, ...departments.map(d => ({ value: d.id, label: d.name }))])}
                {inp('designation', 'Designation *')}
                {sel('employee_type', 'Employee Type', [{ value: 'Company', label: 'Company' }, { value: 'Contractor', label: 'Contractor' }])}
                {inp('contractor_name', 'Contractor Name (if applicable)')}
                {inp('joining_date', 'Joining Date', 'date')}
                {inp('dob', 'Date of Birth', 'date')}
              </div>

              <p className="section-title">3. Salary & Rates</p>
              <div className="form-grid three">
                {inp('basic_salary', 'Basic Monthly Salary (₹)', 'number')}
                {inp('hourly_rate', 'Hourly Rate (₹/hr)', 'number')}
                {inp('overtime_rate', 'Overtime Rate (₹/hr)', 'number')}
                {inp('pf_percent', 'PF Deduction %', 'number')}
                {inp('esi_percent', 'ESI Deduction %', 'number')}
              </div>

              <p className="section-title">4. Bank & Statutory Info</p>
              <div className="form-grid">
                {inp('aadhaar', 'Aadhaar Number')}
                {inp('pan', 'PAN Number')}
                {inp('bank_name', 'Bank Name')}
                {inp('account_number', 'Account Number')}
                {inp('ifsc', 'IFSC Code')}
                {inp('uan', 'UAN Number')}
                {inp('esi_number', 'ESI Number')}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : modal === 'edit' ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
