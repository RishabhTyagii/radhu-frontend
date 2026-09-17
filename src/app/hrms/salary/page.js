'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

const SlipRenderer = ({ selectedSlip, printWages, onClose, onPrint, isBulk = false }) => {
  if (!selectedSlip) return null;

  const daysArray = Array.from({ length: selectedSlip.attendance_summary.days_in_month }, (_, i) => i + 1);

  // Group production
  const prodGroups = {};
  (selectedSlip.production_detail || []).forEach(p => {
    if (!prodGroups[p.product_name]) prodGroups[p.product_name] = {};
    prodGroups[p.product_name][parseInt(p.day, 10)] = p;
  });

  // Map attendance
  const attMap = {};
  (selectedSlip.attendance_detail || []).forEach(a => {
    attMap[parseInt(a.day, 10)] = a;
  });

  return (
    <div className={`card ${isBulk ? '' : 'print-area'}`} style={{ 
      marginBottom: isBulk ? '0' : '30px', 
      padding: isBulk ? '0' : '32px', 
      background: 'white', 
      border: isBulk ? 'none' : '1px solid #e2e8f0', 
      boxShadow: isBulk ? 'none' : '0 10px 25px rgba(0,0,0,0.1)',
      pageBreakAfter: isBulk ? 'always' : 'auto',
      minHeight: isBulk ? '270mm' : 'auto' // ensure full A4 page space for bulk
    }}>
      
      {!isBulk && (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={onClose} className="btn" style={{ background: '#f1f5f9' }}>← Back</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" checked={printWages.value} onChange={(e) => printWages.setter(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              Include Wages Record
            </label>
          </div>
          <button onClick={onPrint} className="btn btn-primary" style={{ background: '#dc2626' }}>
            <i className="fas fa-print mr-2"></i> Print Formal Payslip
          </button>
        </div>
      )}

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
          <tr style={{ fontWeight: '900', backgroundColor: '#f1f5f9', fontSize: '14px', borderTop: '2px solid #94a3b8' }}>
            <td style={{ color: '#0f172a', padding: '15px' }}>TOTAL EARNINGS</td>
            <td style={{ textAlign: 'right', color: '#16a34a', fontSize: '15px', padding: '15px' }}>
              {(Number(selectedSlip.salary.basic_salary) + Number(selectedSlip.salary.overtime_amount) + Number(selectedSlip.salary.production_amount) + Number(selectedSlip.salary.bonus)).toFixed(2)}
            </td>
            <td style={{ color: '#0f172a', padding: '15px' }}>TOTAL DEDUCTIONS</td>
            <td style={{ textAlign: 'right', color: '#dc2626', fontSize: '15px', padding: '15px' }}>
              {(Number(selectedSlip.salary.pf_amount) + Number(selectedSlip.salary.esi_amount) + Number(selectedSlip.salary.advance) + Number(selectedSlip.salary.deduction)).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="net-pay">
        <span style={{ fontSize: '14px', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Payable Salary</span>
        <span style={{ fontSize: '24px' }}>Rs {Number(selectedSlip.salary.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      
      <div className="signatures">
        <div>Employer Signature</div>
        <div>Employee Signature</div>
      </div>
      
      {/* Wages Record Section - HORIZONTAL LAYOUT */}
      {(isBulk ? true : printWages.value) && (selectedSlip.attendance_detail?.length > 0 || selectedSlip.production_detail?.length > 0) && (
        <div className="wages-section" style={{ marginTop: '30px' }}>
          <hr style={{ border: 'none', borderTop: '2px dashed #000', margin: '15px 0' }} />
          <h3 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '13px' }}>WAGES RECORD (ATTENDANCE & PRODUCTION)</h3>
          
          <table className="wages-horizontal-table">
            <thead>
              <tr>
                <th style={{ width: '130px', textAlign: 'left', paddingLeft: '5px' }}>Date ➔</th>
                {daysArray.map(d => <th key={d}>{d}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Attendance Row */}
              <tr>
                <td style={{ fontWeight: 'bold', textAlign: 'left', paddingLeft: '5px' }}>Attendance</td>
                {daysArray.map(d => {
                  const a = attMap[d];
                  let statusStr = '';
                  if (a) {
                    if (a.status === 'Present') statusStr = 'P';
                    else if (a.status === 'Absent') statusStr = 'A';
                    else if (a.status === 'Half Day') statusStr = 'H';
                  }
                  return <td key={d} style={{ color: statusStr === 'A' ? '#ef4444' : (statusStr === 'P' ? '#16a34a' : '#000') }}>{statusStr}</td>;
                })}
                <td style={{ fontWeight: 'bold' }}>{selectedSlip.attendance_summary.total_worked_days}</td>
              </tr>
              
              {/* Overtime Row */}
              <tr>
                <td style={{ fontWeight: 'bold', textAlign: 'left', paddingLeft: '5px' }}>OT Hours</td>
                {daysArray.map(d => {
                  const a = attMap[d];
                  return <td key={d}>{a && a.overtime_hours > 0 ? a.overtime_hours : ''}</td>;
                })}
                <td style={{ fontWeight: 'bold' }}>{selectedSlip.attendance_summary.total_overtime_hours}</td>
              </tr>

              {/* Production Rows */}
              {Object.keys(prodGroups).map(prodName => (
                <tr key={prodName}>
                  <td style={{ fontSize: '9px', textAlign: 'left', paddingLeft: '5px' }}>{prodName}</td>
                  {daysArray.map(d => {
                    const p = prodGroups[prodName][d];
                    return <td key={d}>{p ? p.quantity : ''}</td>;
                  })}
                  <td style={{ fontWeight: 'bold' }}>
                    {Object.values(prodGroups[prodName]).reduce((sum, p) => sum + p.quantity, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

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
  
  // Bulk Print
  const [bulkSlips, setBulkSlips] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

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
    if (res) {
      setSelectedSlip(res);
      setBulkSlips([]); // Clear bulk
    }
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

  const handleBulkPrint = async () => {
    if (filteredSalaries.length === 0) {
      alert("No employees found in the current filter.");
      return;
    }
    if (!confirm(`Are you sure you want to fetch and print ${filteredSalaries.length} salary slips?`)) return;

    setIsBulkLoading(true);
    setSelectedSlip(null); // Close single slip if open

    const slips = await Promise.all(
      filteredSalaries.map(sal => apiGet(`/hrms/salary/${sal.id}/slip/`))
    );
    
    setBulkSlips(slips);
    setIsBulkLoading(false);
    
    // Give DOM time to render the big list
    setTimeout(() => {
      window.print();
    }, 1000);
  };

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
            padding: 10px;
            box-sizing: border-box;
          }
          .bulk-container-wrapper, .bulk-container-wrapper * {
            visibility: visible;
          }
          .bulk-container-wrapper {
            display: block !important;
            width: 100%;
          }
          
          /* A4 styling */
          @page {
            size: A4;
            margin: 15mm;
          }
          
          .print-header { border-bottom: 3px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
          .print-header h2 { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
          .print-header p { margin: 8px 0 0; font-size: 14px; font-weight: 600; color: #475569; }
          
          .emp-details { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 13px; background: #f8fafc !important; -webkit-print-color-adjust: exact; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .emp-details div { width: 48%; }
          .emp-details p { margin: 6px 0; color: #334155; font-weight: 500; }
          .emp-details strong { color: #0f172a; font-weight: 800; width: 130px; display: inline-block; }
          
          .salary-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
          .salary-table th, .salary-table td { border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; }
          .salary-table th:last-child, .salary-table td:last-child { border-right: none; }
          .salary-table tbody tr:last-child td { border-bottom: none; }
          .salary-table th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          .salary-table td { color: #1e293b; font-weight: 500; }
          
          .net-pay { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 900; margin-bottom: 30px; padding: 15px 20px; background: #f0fdf4 !important; border: 2px solid #22c55e; border-radius: 8px; color: #166534; -webkit-print-color-adjust: exact; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; font-weight: 700; font-size: 13px; color: #475569; }
          .signatures div { border-top: 1px solid #cbd5e1; padding-top: 10px; width: 200px; text-align: center; }
        }
        
        @media screen {
          .bulk-container-wrapper {
            display: none !important;
          }
        }
        
        .wages-horizontal-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .wages-horizontal-table th, .wages-horizontal-table td { border: 1px solid #000; padding: 4px 2px; text-align: center; }
        .wages-horizontal-table th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
        
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
          
          <button 
            onClick={handleBulkPrint} 
            className="btn btn-primary" 
            style={{ background: '#dc2626', minWidth: '150px' }}
            disabled={isBulkLoading || filteredSalaries.length === 0}
          >
            {isBulkLoading ? 'Loading Slips...' : <><i className="fas fa-print mr-2"></i> Bulk Print All</>}
          </button>
        </div>

        {/* SINGLE Slip View */}
        {!isBulkLoading && selectedSlip && (
          <SlipRenderer 
            selectedSlip={selectedSlip} 
            printWages={{ value: printWages, setter: setPrintWages }} 
            onClose={() => setSelectedSlip(null)} 
            onPrint={handlePrintSlip} 
          />
        )}
        
        {/* BULK Slip Hidden View */}
        {bulkSlips.length > 0 && (
          <div className="bulk-container-wrapper">
            {bulkSlips.map((slip, idx) => (
              <SlipRenderer 
                key={idx}
                selectedSlip={slip}
                printWages={{ value: true }}
                isBulk={true}
              />
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid-4 no-print" style={{ marginBottom: '24px', display: (selectedSlip || isBulkLoading) ? 'none' : 'grid' }}>
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
        <div className="card no-print" style={{ display: (selectedSlip || isBulkLoading) ? 'none' : 'block' }}>
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
