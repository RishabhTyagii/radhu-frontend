'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function HRMEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    father_name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    dob: '',
    joining_date: new Date().toISOString().split('T')[0],
    department: '',
    designation: '',
    employee_type: 'Company',
    contractor_name: '',
    address: '',
    aadhaar: '',
    pan: '',
    bank_name: '',
    account_number: '',
    ifsc: '',
    uan: '',
    esi_number: '',
    basic_salary: '18000',
    hourly_rate: '0',
    overtime_rate: '100',
    pf_percent: '0',
    esi_percent: '0',
    status: 'Active',
  });

  useEffect(() => {
    fetchData();
  }, [deptFilter]);

  async function fetchData() {
    setLoading(true);
    let query = '?status=Active&';
    if (deptFilter) query += `department=${deptFilter}&`;

    const [empRes, deptRes] = await Promise.all([
      apiGet(`/hrms/employees/${query}`),
      apiGet('/hrms/departments/'),
    ]);

    if (empRes) setEmployees(empRes);
    if (deptRes) setDepartments(deptRes);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await apiPost('/hrms/employees/', formData);
    setSaving(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: `Employee "${res.data.name}" (${res.data.employee_code}) added successfully!` });
      setShowAddForm(false);
      setFormData({
        employee_code: '',
        name: '',
        father_name: '',
        mobile: '',
        alternate_mobile: '',
        email: '',
        dob: '',
        joining_date: new Date().toISOString().split('T')[0],
        department: '',
        designation: '',
        employee_type: 'Company',
        contractor_name: '',
        address: '',
        aadhaar: '',
        pan: '',
        bank_name: '',
        account_number: '',
        ifsc: '',
        uan: '',
        esi_number: '',
        basic_salary: '18000',
        hourly_rate: '0',
        overtime_rate: '100',
        pf_percent: '0',
        esi_percent: '0',
        status: 'Active',
      });
      fetchData();
    } else {
      setMessage({ type: 'error', text: res?.data ? JSON.stringify(res.data) : 'Failed to add employee' });
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(term)) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(term)) ||
      (emp.designation && emp.designation.toLowerCase().includes(term)) ||
      (emp.mobile && emp.mobile.includes(term))
    );
  });

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>👨‍💼 Employee Directory</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Comprehensive employee profiles, bank details & statutory records ({employees.length} active)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
              style={{ background: '#2563eb' }}
            >
              {showAddForm ? 'Close Form' : '+ Add New Employee'}
            </button>
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        {/* Full Comprehensive Add Employee Form Drawer */}
        {showAddForm && (
          <div className="card" style={{ marginBottom: '28px', borderLeft: '4px solid #2563eb', padding: '28px' }}>
            <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>
              <i className="fas fa-user-plus mr-2" style={{ color: '#2563eb' }}></i> New Employee Full Registration
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Section 1: Personal & Basic */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>
                  1. Personal & Basic Details
                </h3>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Employee Code * (e.g. EMP-002)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father's Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Mobile</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.alternate_mobile}
                      onChange={(e) => setFormData({ ...formData, alternate_mobile: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Joining</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full residential address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 2: Department & Job Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#8b5cf6', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>
                  2. Department & Job Details
                </h3>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Machine Operator"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee Type</label>
                    <select
                      className="form-select"
                      value={formData.employee_type}
                      onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
                    >
                      <option value="Company">Company</option>
                      <option value="Contractor">Contractor</option>
                    </select>
                  </div>
                  {formData.employee_type === 'Contractor' && (
                    <div className="form-group">
                      <label className="form-label">Contractor Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contractor agency name"
                        value={formData.contractor_name}
                        onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Salary & Rates */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#16a34a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>
                  3. Salary, Rates & Deductions
                </h3>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Basic Monthly Salary (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hourly Rate (₹ / Hr)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Overtime Rate (₹ / Hr)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PF Deduction %</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.pf_percent}
                      onChange={(e) => setFormData({ ...formData, pf_percent: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ESI Deduction %</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.esi_percent}
                      onChange={(e) => setFormData({ ...formData, esi_percent: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Bank & Statutory Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#f59e0b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>
                  4. Bank & Statutory Info (Aadhaar, PAN, Bank)
                </h3>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Aadhaar Number (12 digit)</label>
                    <input
                      type="text"
                      className="form-input"
                      maxLength="12"
                      value={formData.aadhaar}
                      onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number (10 char)</label>
                    <input
                      type="text"
                      className="form-input"
                      maxLength="10"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SBI, HDFC"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SBIN0001234"
                      value={formData.ifsc}
                      onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">UAN Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.uan}
                      onChange={(e) => setFormData({ ...formData, uan: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ESI Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.esi_number}
                      onChange={(e) => setFormData({ ...formData, esi_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563eb', padding: '10px 28px' }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Complete Employee Profile'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn" style={{ background: '#f1f5f9' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Directory List Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search Employee / Code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                className="form-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Loading employee directory...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Basic Salary</th>
                    <th style={{ textAlign: 'right' }}>OT Rate</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{emp.employee_code}</td>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.mobile}</td>
                      <td>{emp.department_name || '-'}</td>
                      <td>{emp.designation}</td>
                      <td><span className="badge blue">{emp.employee_type}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(emp.basic_salary).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{emp.overtime_rate}/hr</td>
                      <td><span className="badge green">{emp.status}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <Link href={`/hrms/employees/${emp.id}`} className="btn" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b' }}>
                          <i className="fas fa-eye mr-1"></i> View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!filteredEmployees.length && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No employees found matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
