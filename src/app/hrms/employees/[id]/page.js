'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

const STYLES = `
  * { box-sizing: border-box; }
  .dp { background: #f8fafc; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .dp-inner { padding: 24px 32px; max-width: 100%; }

  /* Header */
  .dp-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .dp-hdr-left { display: flex; align-items: center; gap: 16px; }
  .btn-back { background: #fff; border: 1px solid #e2e8f0; padding: 9px 18px; border-radius: 9px; cursor: pointer; font-weight: 700; color: #475569; font-size: 0.85rem; }
  .dp-name h1 { font-size: 1.9rem; font-weight: 900; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.5px; }
  .badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; }
  .badge-blue { background: #eff6ff; color: #1d4ed8; }
  .badge-slate { background: #f1f5f9; color: #475569; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .month-picker { display: flex; align-items: center; gap: 10px; background: #fff; padding: 8px 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.06); border: 1px solid #e2e8f0; }
  .month-picker label { font-weight: 700; color: #64748b; font-size: 0.82rem; white-space: nowrap; }
  .month-picker input { padding: 7px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: 700; outline: none; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 24px; }
  .sc { background: #fff; border-radius: 14px; padding: 16px 18px; border: 1px solid #e2e8f0; border-bottom: 4px solid; box-shadow: 0 2px 8px rgba(0,0,0,.03); }
  .sc .v { font-size: 1.8rem; font-weight: 900; color: #0f172a; line-height: 1; }
  .sc .l { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
  .sc .sub { font-size: 0.72rem; color: #94a3b8; font-weight: 600; margin-top: 4px; }

  /* Layout */
  .dp-body { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }

  /* Sidebar cards */
  .side-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.03); }
  .side-card h3 { font-size: 0.7rem; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2px solid #eff6ff; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; }
  .info-row:last-child { border-bottom: none; }
  .info-row .ik { font-size: 0.78rem; color: #64748b; font-weight: 600; }
  .info-row .iv { font-size: 0.85rem; color: #0f172a; font-weight: 800; text-align: right; max-width: 180px; word-break: break-word; }

  /* Leave balance card */
  .leave-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.03); }
  .leave-card h3 { font-size: 0.7rem; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2px solid #eff6ff; }
  .leave-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #f1f5f9; }
  .leave-row:last-child { border-bottom: none; }
  .leave-type { font-size: 0.8rem; font-weight: 800; color: #334155; }
  .leave-sub { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
  .leave-bal { display: flex; align-items: center; gap: 8px; }
  .leave-num { font-size: 1.5rem; font-weight: 900; color: #1e40af; min-width: 36px; text-align: center; }
  .leave-edit-inp { width: 56px; padding: 5px 8px; border: 2px solid #3b82f6; border-radius: 6px; font-size: 1rem; font-weight: 800; text-align: center; outline: none; }
  .btn-save-sm { background: #1e40af; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; cursor: pointer; }
  .btn-cancel-sm { background: #f1f5f9; color: #475569; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; cursor: pointer; }
  .leave-used { font-size: 0.7rem; color: #dc2626; font-weight: 700; margin-top: 2px; }

  /* Main area */
  .main-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.03); overflow: hidden; }

  /* Tabs */
  .tabs { display: flex; border-bottom: 2px solid #f1f5f9; padding: 0 20px; background: #fff; }
  .tab-btn { padding: 14px 20px; border: none; background: none; cursor: pointer; font-weight: 700; font-size: 0.85rem; color: #94a3b8; border-bottom: 3px solid transparent; margin-bottom: -2px; white-space: nowrap; }
  .tab-btn.active { color: #1e40af; border-bottom-color: #1e40af; }
  .tab-content { padding: 0; }

  /* Tables */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table thead tr { background: #f8fafc; }
  .data-table thead th { padding: 12px 16px; font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; text-align: left; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  .data-table tbody tr { border-bottom: 1px solid #f8fafc; }
  .data-table tbody tr:hover { background: #f8fafc; }
  .data-table tbody td { padding: 11px 16px; font-size: 0.85rem; color: #334155; }
  .data-table tfoot td { padding: 12px 16px; font-size: 0.85rem; font-weight: 800; background: #f1f5f9; border-top: 2px solid #e2e8f0; color: #0f172a; }
  .att-chip { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; }
  .att-p { background: #dcfce7; color: #166534; }
  .att-a { background: #fee2e2; color: #991b1b; }
  .att-h { background: #fef3c7; color: #92400e; }
  .att-hd { background: #dbeafe; color: #1e40af; }
  .att-wo { background: #f1f5f9; color: #475569; }
  .leave-chip { display: inline-block; padding: 2px 8px; border-radius: 5px; font-size: 0.68rem; font-weight: 800; }
  .lc-cl { background: #ede9fe; color: #6d28d9; }
  .lc-el { background: #fef3c7; color: #92400e; }
  .lc-lop { background: #fee2e2; color: #991b1b; }

  /* Rates tab */
  .rate-search { padding: 16px; border-bottom: 1px solid #f1f5f9; }
  .rate-search input { width: 100%; max-width: 360px; padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none; font-weight: 500; }
  .rate-inp { width: 80px; padding: 5px 8px; border: 2px solid #3b82f6; border-radius: 6px; font-size: 0.85rem; font-weight: 700; text-align: right; outline: none; }
  .btn-edit-sm { background: #eff6ff; color: #1d4ed8; border: none; padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; }

  /* Edit modal */
  .overlay { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; }
  .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 760px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .modal-head { padding: 24px 28px 0; }
  .modal-head h2 { font-size: 1.25rem; font-weight: 900; color: #0f172a; margin: 0 0 16px; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; }
  .modal-body { padding: 20px 28px; max-height: 70vh; overflow-y: auto; }
  .modal-foot { padding: 16px 28px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #f1f5f9; }
  .section-hdr { font-size: 0.7rem; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 2px solid #eff6ff; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; margin-bottom: 20px; }
  .form-grid.three { grid-template-columns: 1fr 1fr 1fr; }
  .fg label { display: block; font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 5px; }
  .fg input, .fg select { width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #0f172a; outline: none; }
  .fg input:focus, .fg select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
  .btn-primary { background: #1e40af; color: #fff; border: none; padding: 11px 22px; border-radius: 9px; font-weight: 800; font-size: 0.875rem; cursor: pointer; }
  .btn-ghost { background: #f1f5f9; color: #475569; border: none; padding: 11px 22px; border-radius: 9px; font-weight: 700; font-size: 0.875rem; cursor: pointer; }
  .msg-ok { background: #dcfce7; color: #166534; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; margin-bottom: 14px; }
  .msg-err { background: #fee2e2; color: #991b1b; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; margin-bottom: 14px; }

  .empty-state { padding: 48px; text-align: center; color: #94a3b8; font-weight: 600; font-size: 0.9rem; }
`;

function attClass(status) {
  if (status === 'Present') return 'att-p';
  if (status === 'Absent') return 'att-a';
  if (status === 'Half Day') return 'att-h';
  if (status === 'Holiday') return 'att-hd';
  return 'att-wo';
}
function leaveChipClass(lt) {
  if (lt === 'CL') return 'lc-cl';
  if (lt === 'EL') return 'lc-el';
  if (lt === 'LOP') return 'lc-lop';
  return '';
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthStr, setMonthStr] = useState(new Date().toISOString().slice(0, 7));
  const [tab, setTab] = useState('attendance');

  const [departments, setDepartments] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  // Leave balance inline edit
  const [editingLeave, setEditingLeave] = useState(null); // 'cl' | 'el' | null
  const [leaveCL, setLeaveCL] = useState('');
  const [leaveEL, setLeaveEL] = useState('');
  const [leaveSaving, setLeaveSaving] = useState(false);

  // Item rates
  const [itemRates, setItemRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [rateSearch, setRateSearch] = useState('');
  const [editingRateId, setEditingRateId] = useState(null);
  const [editingRateVal, setEditingRateVal] = useState('');
  const [rateSaving, setRateSaving] = useState(false);

  useEffect(() => { if (params.id) { loadData(); loadDepts(); } }, [params.id, monthStr]);
  useEffect(() => { if (tab === 'rates' && params.id) loadRates(); }, [tab, params.id]);

  async function loadData() {
    setLoading(true);
    const res = await apiGet(`/hrms/employees/${params.id}/?month=${monthStr}`);
    if (res && res.employee) {
      setData(res);
      const lb = res.leave_balance || {};
      setLeaveCL(String(lb.cl_balance ?? 7));
      setLeaveEL(String(lb.el_balance ?? 13));
    }
    setLoading(false);
  }

  async function loadDepts() {
    const d = await apiGet('/hrms/departments/');
    if (d) setDepartments(d);
  }

  async function loadRates() {
    setRatesLoading(true);
    const r = await apiGet(`/hrms/item-rates/?employee_id=${params.id}`);
    if (Array.isArray(r)) setItemRates(r);
    setRatesLoading(false);
  }

  async function saveLeave() {
    setLeaveSaving(true);
    const year = parseInt(monthStr.split('-')[0]);
    await apiPatch(`/hrms/employees/${params.id}/leave-balance/?year=${year}`, {
      cl_balance: parseInt(leaveCL),
      el_balance: parseInt(leaveEL),
    });
    setLeaveSaving(false);
    setEditingLeave(null);
    loadData();
  }

  async function saveRate(id) {
    setRateSaving(true);
    await apiPatch(`/hrms/item-rates/${id}/`, { rate: editingRateVal });
    setRateSaving(false);
    setEditingRateId(null);
    loadRates();
  }

  function openEditModal() {
    const emp = data.employee;
    setEditForm({
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
    setEditMsg(null);
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    setSaving(true); setEditMsg(null);
    const res = await apiPatch(`/hrms/employees/${params.id}/`, editForm);
    setSaving(false);
    if (res && !res.error && !res.detail) {
      setEditMsg({ ok: true, text: 'Employee updated successfully!' });
      loadData();
      setTimeout(() => { setShowEditModal(false); setEditMsg(null); }, 1500);
    } else {
      setEditMsg({ ok: false, text: res?.detail || JSON.stringify(res) || 'Failed to save.' });
    }
  }

  if (loading) return <><style>{STYLES}</style><Navbar /><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748b', fontSize: '1.1rem', fontWeight: 700 }}>Loading...</div></>;
  if (!data || !data.employee) return <><style>{STYLES}</style><Navbar /><div style={{ textAlign: 'center', padding: '60px', color: '#dc2626', fontWeight: 700 }}>Error loading employee.</div></>;

  const emp = data.employee;
  const aStats = data.attendance_stats || {};
  const pStats = data.production_stats || {};
  const attList = data.attendance_list || [];
  const prodList = data.production_list || [];
  const lb = data.leave_balance || {};
  const advances = data.adjustments?.advances || [];
  const bonuses = data.adjustments?.bonuses || [];
  const deductions = data.adjustments?.deductions || [];

  const attDates = attList.filter(a => ['Present', 'Holiday', 'Half Day'].includes(a.status)).map(a => a.date);
  const prodDates = prodList.map(p => p.date);
  const totalActiveDays = new Set([...attDates, ...prodDates]).size;

  const salaryHistory = data.salary_history || [];
  const netSalary = salaryHistory[0]?.net_salary || 0;

  // Group production by item
  const prodByItem = {};
  prodList.forEach(p => {
    if (!prodByItem[p.product_name]) prodByItem[p.product_name] = { qty: 0, amount: 0, rate: Number(p.rate) };
    prodByItem[p.product_name].qty += Number(p.quantity);
    prodByItem[p.product_name].amount += Number(p.total_amount);
  });

  const filteredRates = itemRates.filter(r => r.product_name?.toLowerCase().includes(rateSearch.toLowerCase()));

  function fg(key, label, type = 'text') {
    return (
      <div className="fg" key={key}>
        <label>{label}</label>
        <input type={type} value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
      </div>
    );
  }
  function fgSel(key, label, opts) {
    return (
      <div className="fg" key={key}>
        <label>{label}</label>
        <select value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}>
          {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <Navbar />
      <div className="dp">
        <div className="dp-inner">
          {/* Header */}
          <div className="dp-hdr">
            <div className="dp-hdr-left">
              <button className="btn-back" onClick={() => router.push('/hrms/employees')}>← Back</button>
              <div className="dp-name">
                <h1>{emp.name} <span style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: 700 }}>({emp.employee_code})</span></h1>
                <div className="badge-row">
                  <span className="badge badge-blue">{emp.department_name || 'No Dept'}</span>
                  <span className="badge badge-slate">{emp.designation}</span>
                  <span className={`badge ${emp.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{emp.status}</span>
                  <span className="badge badge-slate">{emp.employee_type}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="month-picker">
                <label>Month:</label>
                <input type="month" value={monthStr} onChange={e => setMonthStr(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={openEditModal}>Edit Profile</button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="stat-grid">
            <div className="sc" style={{ borderBottomColor: '#3b82f6' }}>
              <div className="v">{totalActiveDays}</div>
              <div className="l">Active Days</div>
              <div className="sub">Present + Production</div>
            </div>
            <div className="sc" style={{ borderBottomColor: '#22c55e' }}>
              <div className="v">{aStats.present_days || 0}</div>
              <div className="l">Present Days</div>
              <div className="sub">Half: {aStats.half_days || 0} | Absent: {aStats.absent_days || 0}</div>
            </div>
            <div className="sc" style={{ borderBottomColor: '#8b5cf6' }}>
              <div className="v">{aStats.cl_used || 0}</div>
              <div className="l">CL Used</div>
              <div className="sub">EL Used: {aStats.el_used || 0}</div>
            </div>
            <div className="sc" style={{ borderBottomColor: '#0ea5e9' }}>
              <div className="v">{pStats.production_days || 0}</div>
              <div className="l">Prod. Days</div>
              <div className="sub">{Number(pStats.total_qty || 0).toLocaleString()} pcs</div>
            </div>
            <div className="sc" style={{ borderBottomColor: '#10b981' }}>
              <div className="v">₹{Number(pStats.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="l">Prod. Amount</div>
              <div className="sub">This month</div>
            </div>
            <div className="sc" style={{ borderBottomColor: '#f59e0b' }}>
              <div className="v">CL {lb.cl_balance ?? 7}</div>
              <div className="l">Leave Balance</div>
              <div className="sub">EL: {lb.el_balance ?? 13} days left</div>
            </div>
          </div>

          {/* Body */}
          <div className="dp-body">
            {/* Sidebar */}
            <div>
              {/* Employee Info */}
              <div className="side-card">
                <h3>Employee Info</h3>
                {[
                  ['Mobile', emp.mobile],
                  ['Alt Mobile', emp.alternate_mobile],
                  ['Email', emp.email],
                  ['Joining Date', emp.joining_date],
                  ['Date of Birth', emp.dob],
                  ['Address', emp.address],
                ].map(([k, v]) => v ? <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div> : null)}
              </div>

              {/* Leave Balance */}
              <div className="leave-card">
                <h3>Leave Balance — {monthStr.split('-')[0]}</h3>
                <div style={{ marginBottom: '10px', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  8 hrs leave = 1 Paid Day (CL/EL counted as Present)
                </div>
                {/* CL */}
                <div className="leave-row">
                  <div>
                    <div className="leave-type">Casual Leave (CL)</div>
                    <div className="leave-sub">7 days per year</div>
                    {aStats.cl_used > 0 && <div className="leave-used">Used: {aStats.cl_used} this month</div>}
                  </div>
                  <div className="leave-bal">
                    {editingLeave === 'cl' ? (
                      <>
                        <input className="leave-edit-inp" type="number" value={leaveCL} onChange={e => setLeaveCL(e.target.value)} />
                        <button className="btn-save-sm" onClick={saveLeave} disabled={leaveSaving}>Save</button>
                        <button className="btn-cancel-sm" onClick={() => setEditingLeave(null)}>X</button>
                      </>
                    ) : (
                      <>
                        <span className="leave-num">{lb.cl_balance ?? 7}</span>
                        <button className="btn-edit-sm" onClick={() => { setLeaveCL(String(lb.cl_balance ?? 7)); setEditingLeave('cl'); }}>Edit</button>
                      </>
                    )}
                  </div>
                </div>
                {/* EL */}
                <div className="leave-row">
                  <div>
                    <div className="leave-type">Earned Leave (EL)</div>
                    <div className="leave-sub">13 days per year</div>
                    {aStats.el_used > 0 && <div className="leave-used">Used: {aStats.el_used} this month</div>}
                  </div>
                  <div className="leave-bal">
                    {editingLeave === 'el' ? (
                      <>
                        <input className="leave-edit-inp" type="number" value={leaveEL} onChange={e => setLeaveEL(e.target.value)} />
                        <button className="btn-save-sm" onClick={saveLeave} disabled={leaveSaving}>Save</button>
                        <button className="btn-cancel-sm" onClick={() => setEditingLeave(null)}>X</button>
                      </>
                    ) : (
                      <>
                        <span className="leave-num">{lb.el_balance ?? 13}</span>
                        <button className="btn-edit-sm" onClick={() => { setLeaveEL(String(lb.el_balance ?? 13)); setEditingLeave('el'); }}>Edit</button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary & Rates */}
              <div className="side-card">
                <h3>Salary & Rates</h3>
                {[
                  ['Basic Monthly', `₹${Number(emp.basic_salary || 0).toLocaleString('en-IN')}`],
                  ['Hourly Rate', `₹${Number(emp.hourly_rate || 0).toFixed(2)}/hr`],
                  ['OT Rate', `₹${Number(emp.overtime_rate || 0).toFixed(2)}/hr`],
                  ['PF %', `${emp.pf_percent || 0}%`],
                  ['ESI %', `${emp.esi_percent || 0}%`],
                ].map(([k, v]) => <div key={k} className="info-row"><span className="ik">{k}</span><span className="iv">{v}</span></div>)}
              </div>
            </div>

            {/* Main Area */}
            <div className="main-card">
              <div className="tabs">
                {[['attendance', 'Attendance'], ['production', 'Production'], ['rates', 'Item Rates'], ['adjustments', 'Advances / Deductions']].map(([t, l]) => (
                  <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>
                ))}
              </div>

              {/* ATTENDANCE TAB */}
              {tab === 'attendance' && (
                <div className="tab-content">
                  {attList.length === 0 ? (
                    <div className="empty-state">No attendance records for this month.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th><th>Day</th><th>Status</th><th>Leave</th>
                          <th style={{ textAlign: 'right' }}>Work Hrs</th>
                          <th style={{ textAlign: 'right' }}>OT Hrs</th>
                          <th style={{ textAlign: 'right' }}>OT Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attList.map(a => {
                          const day = DAYS[new Date(a.date + 'T00:00:00').getDay()];
                          const otAmt = (Number(a.overtime_hours) * Number(emp.overtime_rate || 0)).toFixed(2);
                          return (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 700 }}>{a.date}</td>
                              <td style={{ color: '#94a3b8', fontWeight: 600 }}>{day}</td>
                              <td><span className={`att-chip ${attClass(a.status)}`}>{a.status}</span></td>
                              <td>{a.leave_type ? <span className={`leave-chip ${leaveChipClass(a.leave_type)}`}>{a.leave_type}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{a.working_hours}h</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>{Number(a.overtime_hours) > 0 ? `+${a.overtime_hours}h` : '—'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>{Number(otAmt) > 0 ? `₹${otAmt}` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4">Total: P {aStats.present_days || 0} | Half {aStats.half_days || 0} | Hol {aStats.holiday_days || 0} | Abs {aStats.absent_days || 0}</td>
                          <td style={{ textAlign: 'right' }}>{aStats.total_work_hrs || 0}h</td>
                          <td style={{ textAlign: 'right' }}>{aStats.total_ot_hrs || 0}h</td>
                          <td style={{ textAlign: 'right' }}>₹{((aStats.total_ot_hrs || 0) * Number(emp.overtime_rate || 0)).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}

              {/* PRODUCTION TAB */}
              {tab === 'production' && (
                <div className="tab-content">
                  {Object.keys(prodByItem).length > 0 && (
                    <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 800, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Summary by Item</div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {Object.entries(prodByItem).map(([name, d]) => (
                          <div key={name} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', minWidth: '180px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', marginBottom: '4px' }}>{name}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{d.qty.toLocaleString()} pcs</div>
                            <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>₹{d.amount.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {prodList.length === 0 ? (
                    <div className="empty-state">No production entries for this month.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th><th>Item / Tyre</th>
                          <th style={{ textAlign: 'right' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Rate/pc</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodList.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700 }}>{p.date}</td>
                            <td><span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>{p.product_name}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 800 }}>{Number(p.quantity).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>₹{Number(p.rate).toFixed(4)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#166534' }}>₹{Number(p.total_amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2">Grand Total</td>
                          <td style={{ textAlign: 'right' }}>{Number(pStats.total_qty || 0).toLocaleString()} pcs</td>
                          <td></td>
                          <td style={{ textAlign: 'right', color: '#166534' }}>₹{Number(pStats.total_amount || 0).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}

              {/* ITEM RATES TAB */}
              {tab === 'rates' && (
                <div className="tab-content">
                  <div className="rate-search">
                    <input placeholder="Search item..." value={rateSearch} onChange={e => setRateSearch(e.target.value)} />
                  </div>
                  {ratesLoading ? (
                    <div className="empty-state">Loading rates...</div>
                  ) : filteredRates.length === 0 ? (
                    <div className="empty-state">No item rates found. Rates are saved automatically when production is entered.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Item / Product Name</th>
                          <th style={{ textAlign: 'right' }}>Rate (₹/pc)</th>
                          <th>Last Updated</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRates.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>{r.product_name}</td>
                            <td style={{ textAlign: 'right' }}>
                              {editingRateId === r.id ? (
                                <input className="rate-inp" type="number" step="0.0001" value={editingRateVal}
                                  onChange={e => setEditingRateVal(e.target.value)} autoFocus />
                              ) : (
                                <span style={{ fontWeight: 800, color: '#7c3aed' }}>₹{Number(r.rate).toFixed(4)}</span>
                              )}
                            </td>
                            <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{r.updated_at?.split('T')[0] || '-'}</td>
                            <td>
                              {editingRateId === r.id ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn-save-sm" onClick={() => saveRate(r.id)} disabled={rateSaving}>Save</button>
                                  <button className="btn-cancel-sm" onClick={() => setEditingRateId(null)}>Cancel</button>
                                </div>
                              ) : (
                                <button className="btn-edit-sm" onClick={() => { setEditingRateId(r.id); setEditingRateVal(r.rate); }}>Edit</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ADJUSTMENTS TAB */}
              {tab === 'adjustments' && (
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  {[
                    { title: 'Advances', data: advances, color: '#dc2626', field: 'amount' },
                    { title: 'Bonuses', data: bonuses, color: '#166534', field: 'amount' },
                    { title: 'Deductions', data: deductions, color: '#92400e', field: 'amount' },
                  ].map(({ title, data: d, color }) => (
                    <div key={title}>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{title}</div>
                      {d.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, padding: '12px 0' }}>None this month</div>
                      ) : d.map((item, i) => (
                        <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 14px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{item.date}</span>
                            <span style={{ fontWeight: 900, color, fontSize: '0.9rem' }}>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                          </div>
                          {item.remarks && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>{item.remarks}</div>}
                        </div>
                      ))}
                      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '8px', fontWeight: 900, color, fontSize: '0.9rem' }}>
                        Total: ₹{d.reduce((s, i) => s + Number(i.amount), 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="modal">
            <div className="modal-head">
              <h2>Edit Employee Profile — {emp.name} ({emp.employee_code})</h2>
            </div>
            <div className="modal-body">
              {editMsg && <div className={editMsg.ok ? 'msg-ok' : 'msg-err'}>{editMsg.text}</div>}
              <p className="section-hdr">1. Basic & Personal Info</p>
              <div className="form-grid">
                {fg('employee_code', 'Employee Code *')}
                {fg('name', 'Full Name *')}
                {fg('father_name', "Father's Name")}
                {fg('mobile', 'Mobile *', 'tel')}
                {fg('alternate_mobile', 'Alternate Mobile', 'tel')}
                {fgSel('status', 'Status', [{ v: 'Active', l: 'Active' }, { v: 'Inactive', l: 'Inactive' }])}
              </div>
              <p className="section-hdr">2. Department & Role</p>
              <div className="form-grid">
                {fgSel('department', 'Department', [{ v: '', l: '-- Select --' }, ...departments.map(d => ({ v: d.id, l: d.name }))])}
                {fg('designation', 'Designation')}
                {fgSel('employee_type', 'Employee Type', [{ v: 'Company', l: 'Company' }, { v: 'Contractor', l: 'Contractor' }])}
                {fg('contractor_name', 'Contractor Name')}
                {fg('joining_date', 'Joining Date', 'date')}
                {fg('dob', 'Date of Birth', 'date')}
              </div>
              <p className="section-hdr">3. Salary & Rates</p>
              <div className="form-grid three">
                {fg('basic_salary', 'Basic Monthly (₹)', 'number')}
                {fg('hourly_rate', 'Hourly Rate (₹/hr)', 'number')}
                {fg('overtime_rate', 'OT Rate (₹/hr)', 'number')}
                {fg('pf_percent', 'PF %', 'number')}
                {fg('esi_percent', 'ESI %', 'number')}
              </div>
              <p className="section-hdr">4. Bank & Statutory</p>
              <div className="form-grid">
                {fg('aadhaar', 'Aadhaar')}
                {fg('pan', 'PAN')}
                {fg('bank_name', 'Bank Name')}
                {fg('account_number', 'Account Number')}
                {fg('ifsc', 'IFSC')}
                {fg('uan', 'UAN')}
                {fg('esi_number', 'ESI Number')}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
