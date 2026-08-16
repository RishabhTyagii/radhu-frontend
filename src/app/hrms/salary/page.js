'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function HRMSSalary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth]);

  async function fetchSalaries() {
    setLoading(true);
    const [year, month] = selectedMonth.split('-');
    const res = await apiGet(`/hrms/salary/?year=${year}&month=${month}`);
    if (res) setData(res);
    setLoading(false);
  }

  const handleGenerate = async () => {
    setGenerating(true);
    const [year, month] = selectedMonth.split('-');
    const res = await apiPost('/hrms/salary/', { year, month });
    setGenerating(false);

    if (res && res.ok) {
      alert(`Salary generated/updated for ${month}/${year}!`);
      fetchSalaries();
    } else {
      alert('Failed to generate salary');
    }
  };

  const fetchSlip = async (id) => {
    const res = await apiGet(`/hrms/salary/${id}/slip/`);
    if (res) setSelectedSlip(res);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const salaries = data?.salaries || [];
  const totals = data?.totals || {};

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <div className="container">
        <div className="page-header no-print">
          <div>
            <h1>💵 Monthly Salary & Payroll Engine</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Auto-calculate basic salary, attendance days, overtime & piece-rate production
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '180px' }}
            />
            <button onClick={handleGenerate} className="btn btn-primary" style={{ background: '#2563eb' }} disabled={generating}>
              {generating ? 'Calculating...' : '⚡ Generate / Recalculate Salary'}
            </button>
          </div>
        </div>

        {/* Modal / View for Salary Slip */}
        {selectedSlip && (
          <div className="card" style={{ marginBottom: '30px', padding: '32px', background: 'white', border: '2px solid #2563eb' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button onClick={() => setSelectedSlip(null)} className="btn" style={{ background: '#f1f5f9' }}>Close Slip</button>
              <button onClick={handlePrintSlip} className="btn btn-primary" style={{ background: '#dc2626' }}>Print Payslip</button>
            </div>

            <div style={{ borderBottom: '2px solid #1e293b', paddingBottom: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>RADHU INDUSTRIES</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>SALARY SLIP FOR THE MONTH OF {selectedSlip.salary.month}/{selectedSlip.salary.year}</p>
            </div>

            <div className="grid-2" style={{ marginBottom: '20px', gap: '20px' }}>
              <div>
                <p style={{ margin: '4px 0' }}><strong>Employee Code:</strong> {selectedSlip.employee.employee_code}</p>
                <p style={{ margin: '4px 0' }}><strong>Employee Name:</strong> {selectedSlip.employee.name}</p>
                <p style={{ margin: '4px 0' }}><strong>Designation:</strong> {selectedSlip.employee.designation}</p>
                <p style={{ margin: '4px 0' }}><strong>Department:</strong> {selectedSlip.employee.department_name || '-'}</p>
              </div>
              <div>
                <p style={{ margin: '4px 0' }}><strong>Total Month Days:</strong> {selectedSlip.attendance_summary.days_in_month}</p>
                <p style={{ margin: '4px 0' }}><strong>Worked Days:</strong> {selectedSlip.attendance_summary.total_worked_days}</p>
                <p style={{ margin: '4px 0' }}><strong>Absent Days:</strong> {selectedSlip.attendance_summary.absent_days}</p>
                <p style={{ margin: '4px 0' }}><strong>Generated Date:</strong> {selectedSlip.salary.generated_on}</p>
              </div>
            </div>

            <div className="table-container" style={{ marginBottom: '20px' }}>
              <table>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th>EARNINGS</th>
                    <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                    <th>DEDUCTIONS</th>
                    <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Earned Basic Salary</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(selectedSlip.salary.basic_salary).toFixed(2)}</td>
                    <td>PF Contribution</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{Number(selectedSlip.salary.pf_amount).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Overtime Earnings</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(selectedSlip.salary.overtime_amount).toFixed(2)}</td>
                    <td>ESI Contribution</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{Number(selectedSlip.salary.esi_amount).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Piece-Rate Production</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(selectedSlip.salary.production_amount).toFixed(2)}</td>
                    <td>Salary Advance</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{Number(selectedSlip.salary.advance).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Bonus</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(selectedSlip.salary.bonus).toFixed(2)}</td>
                    <td>Other Deductions</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{Number(selectedSlip.salary.deduction).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', background: '#f0fdf4', padding: '16px 24px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 600 }}>NET PAYABLE SALARY</span>
                <h2 style={{ margin: '4px 0 0', color: '#15803d', fontSize: '1.75rem', fontWeight: 800 }}>
                  ₹{Number(selectedSlip.salary.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid-4 no-print" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Salary Payout</span>
            <span className="stat-number" style={{ color: '#2563eb' }}>₹{Number(totals.total_payout || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Earned Basic</span>
            <span className="stat-number">₹{Number(totals.total_basic || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Piece Production</span>
            <span className="stat-number" style={{ color: '#16a34a' }}>₹{Number(totals.total_production || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Overtime Amount</span>
            <span className="stat-number" style={{ color: '#8b5cf6' }}>₹{Number(totals.total_overtime || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Salaries Table */}
        <div className="card no-print">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading salary records...</div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th>CODE</th>
                    <th>EMPLOYEE</th>
                    <th>DEPT</th>
                    <th style={{ textAlign: 'right' }}>BASIC</th>
                    <th style={{ textAlign: 'right' }}>OVERTIME</th>
                    <th style={{ textAlign: 'right' }}>PRODUCTION</th>
                    <th style={{ textAlign: 'right' }}>BONUS</th>
                    <th style={{ textAlign: 'right' }}>DEDUCTION</th>
                    <th style={{ textAlign: 'right' }}>NET SALARY</th>
                    <th style={{ textAlign: 'center' }}>PAYSLIP</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((sal) => (
                    <tr key={sal.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{sal.employee_code}</td>
                      <td style={{ fontWeight: 600 }}>{sal.employee_name}</td>
                      <td>{sal.department_name || '-'}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(sal.basic_salary).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(sal.overtime_amount).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{Number(sal.production_amount).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(sal.bonus).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{(Number(sal.advance) + Number(sal.deduction) + Number(sal.pf_amount) + Number(sal.esi_amount)).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#2563eb', fontSize: '1.05rem' }}>₹{Number(sal.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => fetchSlip(sal.id)}
                          className="btn"
                          style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b' }}
                        >
                          <i className="fas fa-file-invoice-dollar mr-1"></i> Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!salaries.length && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No salary records generated for this month. Click "Generate / Recalculate Salary" above.
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
