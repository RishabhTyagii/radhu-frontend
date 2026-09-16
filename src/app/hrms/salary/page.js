'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function HRMSSalary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedSlip, setSelectedSlip] = useState(null);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  
  // Print options
  const [printWages, setPrintWages] = useState(true);

  useEffect(() => {
    fetchSalaries();
    fetchDepartments();
  }, [selectedMonth]);

  async function fetchDepartments() {
    const res = await apiGet('/hrms/departments/');
    if (res) setDepartments(res);
  }

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

  // Apply filters
  const filteredSalaries = useMemo(() => {
    return salaries.filter(sal => {
      const matchSearch = (sal.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (sal.employee_code || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDepartment ? String(sal.department_name) === selectedDepartment : true;
      return matchSearch && matchDept;
    });
  }, [salaries, searchQuery, selectedDepartment]);

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
          }
          /* A4 styling */
          @page {
            size: A4;
            margin: 15mm;
          }
          
          .print-header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; text-align: center; }
          .print-header h2 { margin: 0; font-size: 24px; font-weight: bold; }
          .print-header p { margin: 5px 0 0; font-size: 14px; }
          
          .emp-details { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
          .emp-details div { width: 48%; }
          .emp-details p { margin: 4px 0; }
          
          .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          .salary-table th, .salary-table td { border: 1px solid #000; padding: 8px; text-align: left; }
          .salary-table th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          
          .net-pay { display: flex; justify-content: flex-end; font-size: 16px; font-weight: bold; margin-bottom: 30px; }
          
          .wages-section { margin-top: 30px; page-break-before: auto; }
          .wages-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
          .wages-table th, .wages-table td { border: 1px solid #000; padding: 6px; text-align: center; }
          .wages-table th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; font-weight: bold; font-size: 14px; }
        }
        
        .filter-bar { display: flex; gap: 15px; align-items: center; background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .filter-input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; flex: 1; }
        .filter-select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; min-width: 200px; }
      `}</style>
      
      <div className="no-print">
        <Navbar />
      </div>

      <div className="container">
        <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>💵 Monthly Salary & Payroll</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Generate, filter, and print professional salary slips and wages records.
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
              {generating ? 'Calculating...' : '⚡ Generate / Recalculate'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar no-print">
          <input 
            type="text" 
            placeholder="Search by Employee Code or Name..." 
            className="filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="filter-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Modal / View for Salary Slip */}
        {selectedSlip && (
          <div className="card print-area" style={{ marginBottom: '30px', padding: '32px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => setSelectedSlip(null)} className="btn" style={{ background: '#f1f5f9' }}>← Back</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input type="checkbox" checked={printWages} onChange={(e) => setPrintWages(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  Include Wages Record (Attendance/Production)
                </label>
              </div>
              <button onClick={handlePrintSlip} className="btn btn-primary" style={{ background: '#dc2626' }}>
                <i className="fas fa-print mr-2"></i> Print Formal Payslip
              </button>
            </div>

            <div className="print-header">
              <h2>RADHU INDUSTRIES</h2>
              <p>SALARY SLIP FOR THE MONTH OF <strong>{selectedSlip.salary.month}/{selectedSlip.salary.year}</strong></p>
            </div>

            <div className="emp-details">
              <div>
                <p><strong>Employee Code:</strong> {selectedSlip.employee.employee_code}</p>
                <p><strong>Employee Name:</strong> {selectedSlip.employee.name}</p>
                <p><strong>Designation:</strong> {selectedSlip.employee.designation}</p>
                <p><strong>Department:</strong> {selectedSlip.employee.department_name || '-'}</p>
              </div>
              <div>
                <p><strong>Total Month Days:</strong> {selectedSlip.attendance_summary.days_in_month}</p>
                <p><strong>Worked Days:</strong> {selectedSlip.attendance_summary.total_worked_days}</p>
                <p><strong>Absent Days:</strong> {selectedSlip.attendance_summary.absent_days}</p>
                <p><strong>Total OT Hours:</strong> {selectedSlip.attendance_summary.total_overtime_hours}</p>
              </div>
            </div>

            <table className="salary-table">
              <thead>
                <tr>
                  <th>EARNINGS</th>
                  <th style={{ textAlign: 'right' }}>AMOUNT (Rs)</th>
                  <th>DEDUCTIONS</th>
                  <th style={{ textAlign: 'right' }}>AMOUNT (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Earned Basic Salary</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.basic_salary).toFixed(2)}</td>
                  <td>PF Contribution</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.pf_amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Overtime Earnings</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.overtime_amount).toFixed(2)}</td>
                  <td>ESI Contribution</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.esi_amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Piece-Rate Production</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.production_amount).toFixed(2)}</td>
                  <td>Salary Advance</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.advance).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Bonus</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.bonus).toFixed(2)}</td>
                  <td>Other Deductions</td>
                  <td style={{ textAlign: 'right' }}>{Number(selectedSlip.salary.deduction).toFixed(2)}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                  <td>TOTAL EARNINGS</td>
                  <td style={{ textAlign: 'right' }}>
                    {(Number(selectedSlip.salary.basic_salary) + Number(selectedSlip.salary.overtime_amount) + Number(selectedSlip.salary.production_amount) + Number(selectedSlip.salary.bonus)).toFixed(2)}
                  </td>
                  <td>TOTAL DEDUCTIONS</td>
                  <td style={{ textAlign: 'right' }}>
                    {(Number(selectedSlip.salary.pf_amount) + Number(selectedSlip.salary.esi_amount) + Number(selectedSlip.salary.advance) + Number(selectedSlip.salary.deduction)).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="net-pay">
              NET PAYABLE SALARY: Rs {Number(selectedSlip.salary.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            
            <div className="signatures">
              <div>Employer Signature</div>
              <div>Employee Signature</div>
            </div>
            
            {/* Wages Record Section */}
            {printWages && (selectedSlip.attendance_detail?.length > 0 || selectedSlip.production_detail?.length > 0) && (
              <div className="wages-section">
                <hr style={{ border: 'none', borderTop: '2px dashed #000', margin: '40px 0' }} />
                
                <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>DETAILED WAGES RECORD (ATTENDANCE & PRODUCTION)</h3>
                
                {selectedSlip.attendance_detail?.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: '8px' }}>Daily Attendance</h4>
                    <table className="wages-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Status</th>
                          <th>Working Hrs</th>
                          <th>OT Hrs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSlip.attendance_detail.map((att, idx) => (
                          <tr key={idx}>
                            <td>{att.date}</td>
                            <td>{att.weekday}</td>
                            <td>{att.status}</td>
                            <td>{att.working_hours}</td>
                            <td>{att.overtime_hours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {selectedSlip.production_detail?.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: '8px', marginTop: '20px' }}>Piece-Rate Production Record</h4>
                    <table className="wages-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Rate</th>
                          <th>Total Amount (Rs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSlip.production_detail.map((prod, idx) => (
                          <tr key={idx}>
                            <td>{prod.date}</td>
                            <td>{prod.product_name}</td>
                            <td>{prod.quantity}</td>
                            <td>{prod.rate}</td>
                            <td>{prod.total_amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                
                 <div className="signatures">
                  <div>Verified By</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid-4 no-print" style={{ marginBottom: '24px', display: selectedSlip ? 'none' : 'grid' }}>
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
        <div className="card no-print" style={{ display: selectedSlip ? 'none' : 'block' }}>
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
                    <th style={{ textAlign: 'right' }}>DEDUCTION</th>
                    <th style={{ textAlign: 'right' }}>NET SALARY</th>
                    <th style={{ textAlign: 'center' }}>PAYSLIP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaries.map((sal) => (
                    <tr key={sal.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{sal.employee_code}</td>
                      <td style={{ fontWeight: 600 }}>{sal.employee_name}</td>
                      <td>{sal.department_name || '-'}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(sal.basic_salary).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(sal.overtime_amount).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{Number(sal.production_amount).toFixed(2)}</td>
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
                  {!filteredSalaries.length && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No salary records found. Try generating salaries or adjusting your filters.
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
