'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthStr, setMonthStr] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const res = await apiGet(`/hrms/employees/${params.id}/?month=${monthStr}`);
      if (res) setData(res);
      setLoading(false);
    }
    if (params.id) fetchDetail();
  }, [params.id, monthStr]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
          Loading employee details...
        </div>
      </>
    );
  }

  if (!data || !data.employee) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Employee Not Found</h2>
          <Link href="/hrms/employees" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Directory</Link>
        </div>
      </>
    );
  }

  const {
    employee: emp,
    attendance_stats: attStats = {},
    leave_balance: lb = {},
    attendance_list: attList = [],
    production_stats: prodStats = {},
    production_list: prodList = [],
    adjustments = {},
    current_salary: curSal,
    salary_history: salHist = [],
  } = data;

  return (
    <>
      <Navbar />
      <div className="container">
        {/* Top Header & Actions */}
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '16px', background: '#1e293b',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 800
              }}>
                {emp.name.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {emp.name} <span style={{ fontSize: '0.85rem', background: '#e2e8f0', padding: '2px 10px', borderRadius: '6px', color: '#475569' }}>{emp.employee_code}</span>
                </h1>
                <p style={{ color: '#64748b', margin: '4px 0 8px', fontSize: '0.9rem' }}>
                  <i className="fas fa-building mr-1"></i> {emp.department_name || 'No Dept'} |{' '}
                  <i className="fas fa-briefcase mr-1"></i> {emp.designation} |{' '}
                  <i className="fas fa-phone mr-1"></i> {emp.mobile}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge blue">{emp.employee_type} {emp.contractor_name ? `(${emp.contractor_name})` : ''}</span>
                  <span className={`badge ${emp.status === 'Active' ? 'green' : 'red'}`}>{emp.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Month:</label>
                <input
                  type="month"
                  className="form-input"
                  value={monthStr}
                  onChange={(e) => setMonthStr(e.target.value)}
                  style={{ width: '160px' }}
                />
              </div>
              <Link href="/hrms/employees" className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
                ← Back to Directory
              </Link>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          {/* Leave Balance */}
          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <span className="stat-label">Leave Balance</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <div>
                <span className="stat-number" style={{ fontSize: '1.5rem', color: '#10b981' }}>{lb.cl_balance ?? 7}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>CL Available</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="stat-number" style={{ fontSize: '1.5rem', color: '#2563eb' }}>{lb.el_balance ?? 13}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>EL Available</span>
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
            <span className="stat-label">Attendance ({monthStr})</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <div>
                <span className="stat-number" style={{ fontSize: '1.5rem', color: '#2563eb' }}>{attStats.present_days || 0}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Days Present</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="stat-number" style={{ fontSize: '1.5rem', color: '#ef4444' }}>{attStats.absent_days || 0}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Days Absent</span>
              </div>
            </div>
          </div>

          {/* Piece Production */}
          <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <span className="stat-label">Production ({monthStr})</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <div>
                <span className="stat-number" style={{ fontSize: '1.5rem', color: '#8b5cf6' }}>{prodStats.total_qty || 0}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Pcs</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="stat-number" style={{ fontSize: '1.5rem', color: '#16a34a' }}>₹{prodStats.total_amount || 0}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Earnings</span>
              </div>
            </div>
          </div>

          {/* Current Month Net Pay */}
          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className="stat-label">Monthly Salary</span>
            <div style={{ marginTop: '8px' }}>
              <span className="stat-number" style={{ fontSize: '1.5rem', color: '#2563eb' }}>
                ₹{curSal ? Number(curSal.net_salary).toLocaleString('en-IN') : '0.00'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                {curSal ? `Calculated on ${curSal.generated_on}` : 'Not generated yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Comprehensive Employee Info Tabs / Grid */}
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.1rem', color: '#1e293b' }}>
            <i className="fas fa-id-card mr-2" style={{ color: '#2563eb' }}></i> Comprehensive Profile & Statutory Details
          </h2>
          <div className="grid-3" style={{ gap: '20px' }}>
            {/* Personal Details */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', margin: '0 0 12px' }}>Personal Info</h3>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Father's Name:</strong> {emp.father_name || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Alt Mobile:</strong> {emp.alternate_mobile || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Email:</strong> {emp.email || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Date of Birth:</strong> {emp.dob || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Joining Date:</strong> {emp.joining_date || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Address:</strong> {emp.address || '-'}</p>
            </div>

            {/* Compensation & Rates */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', margin: '0 0 12px' }}>Salary & Rates</h3>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Basic Monthly Salary:</strong> ₹{Number(emp.basic_salary).toLocaleString('en-IN')}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Hourly Rate:</strong> ₹{emp.hourly_rate}/hr</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Overtime Rate:</strong> ₹{emp.overtime_rate}/hr</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>PF Deduction %:</strong> {emp.pf_percent}%</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>ESI Deduction %:</strong> {emp.esi_percent}%</p>
            </div>

            {/* Bank & Statutory */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', margin: '0 0 12px' }}>Bank & Statutory</h3>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Aadhaar No:</strong> {emp.aadhaar || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>PAN No:</strong> {emp.pan || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Bank Name:</strong> {emp.bank_name || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>Account No:</strong> {emp.account_number || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>IFSC Code:</strong> {emp.ifsc || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>UAN No:</strong> {emp.uan || '-'}</p>
              <p style={{ margin: '4px 0', fontSize: '0.875rem' }}><strong>ESI No:</strong> {emp.esi_number || '-'}</p>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Day-by-Day Attendance & Production */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          {/* Day-by-Day Attendance Log */}
          <div className="card">
            <h2><i className="fas fa-calendar-alt text-blue-600 mr-2"></i> Attendance Log ({monthStr})</h2>
            <div className="table-container" style={{ marginTop: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Work/OT</th>
                    <th>Leave</th>
                  </tr>
                </thead>
                <tbody>
                  {attList.map((a) => (
                    <tr key={a.id}>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{a.date}</td>
                      <td>
                        <span className={`badge ${a.status === 'Present' ? 'green' : a.status === 'Half Day' ? 'yellow' : 'red'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {a.working_hours}h {a.overtime_hours > 0 ? <span style={{ color: '#8b5cf6', fontWeight: 600 }}>(+{a.overtime_hours}h OT)</span> : ''}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.leave_type || '-'}</td>
                    </tr>
                  ))}
                  {!attList.length && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                        No attendance entries recorded for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Production Breakdown Log */}
          <div className="card">
            <h2><i className="fas fa-cogs text-purple-600 mr-2"></i> Production Log ({monthStr})</h2>
            <div className="table-container" style={{ marginTop: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Process / Item</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {prodList.map((p) => (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{p.date}</td>
                      <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{p.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{p.rate}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>₹{p.total_amount}</td>
                    </tr>
                  ))}
                  {!prodList.length && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                        No piece-rate production entries for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Salary History Table */}
        <div className="card">
          <h2><i className="fas fa-history text-indigo-600 mr-2"></i> Salary Payout History</h2>
          <div className="table-container" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th>MONTH / YEAR</th>
                  <th style={{ textAlign: 'right' }}>BASIC</th>
                  <th style={{ textAlign: 'right' }}>OVERTIME</th>
                  <th style={{ textAlign: 'right' }}>PRODUCTION</th>
                  <th style={{ textAlign: 'right' }}>BONUS</th>
                  <th style={{ textAlign: 'right' }}>DEDUCTIONS</th>
                  <th style={{ textAlign: 'right' }}>NET PAYABLE</th>
                  <th style={{ textAlign: 'center' }}>PAYSLIP</th>
                </tr>
              </thead>
              <tbody>
                {salHist.map((sal) => (
                  <tr key={sal.id}>
                    <td style={{ fontWeight: 700 }}>{sal.month}/{sal.year}</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(sal.basic_salary).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(sal.overtime_amount).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{Number(sal.production_amount).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(sal.bonus).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{(Number(sal.advance) + Number(sal.deduction) + Number(sal.pf_amount) + Number(sal.esi_amount)).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#2563eb', fontSize: '1.05rem' }}>₹{Number(sal.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Link href="/hrms/salary" className="btn" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b' }}>
                        View Slip
                      </Link>
                    </td>
                  </tr>
                ))}
                {!salHist.length && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                      No past salary history generated yet.
                    </td>
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
