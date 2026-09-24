'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';

export default function MonthlyRegister() {
  const [departments, setDepartments] = useState([]);
  const [deptId, setDeptId] = useState('');
  
  // Default to current month YYYY-MM
  const d = new Date();
  const defMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defMonth);
  
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Generate days based on month
  const [days, setDays] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (deptId && month) {
      fetchMonthlyData();
    }
  }, [deptId, month]);

  async function fetchDepartments() {
    const res = await apiGet('/hrms/departments/');
    if (res) {
      setDepartments(res);
      if (res.length > 0) setDeptId(res[0].id);
    }
  }

  async function fetchMonthlyData() {
    setLoading(true);
    const y = parseInt(month.split('-')[0]);
    const m = parseInt(month.split('-')[1]);
    const daysInMonth = new Date(y, m, 0).getDate();
    const tempDays = [];
    for(let i=1; i<=daysInMonth; i++) {
      tempDays.push(String(i).padStart(2, '0'));
    }
    setDays(tempDays);

    const res = await apiGet(`/hrms/attendance/monthly/?month=${month}&department_id=${deptId}`);
    if (res && res.employees) {
      setEmployees(res.employees);
      
      const map = {};
      res.employees.forEach(e => {
        map[e.id] = {};
        tempDays.forEach(d => {
           map[e.id][d] = { status: '', ot: '' };
        });
      });

      if (res.attendance) {
        res.attendance.forEach(a => {
          const empId = a.employee_id ?? a.employee; // serializer returns 'employee' field
          const dStr = String(a.date.split('-')[2]).padStart(2, '0');
          if (map[empId] && map[empId][dStr] !== undefined) {
            map[empId][dStr] = {
              status: a.status === 'Present' ? 'P' : a.status === 'Absent' ? 'A' : a.status === 'Half Day' ? 'HD' : a.status === 'Holiday' ? 'H' : a.status === 'Week Off' ? 'W' : '',
              ot: a.overtime_hours > 0 ? String(parseFloat(a.overtime_hours)) : ''
            };
          }
        });
      }
      setAttendanceData(map);
    }
    setLoading(false);
  }

  const handleCellChange = (empId, day, field, val) => {
    setAttendanceData(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [day]: {
          ...prev[empId][day],
          [field]: val.toUpperCase()
        }
      }
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage(null);
    const entries = [];
    
    employees.forEach(emp => {
      days.forEach(d => {
        const cell = attendanceData[emp.id][d];
        if (cell.status || cell.ot) {
          const fullDate = `${month}-${d}`;
          let st = 'Absent';
          let wh = 0;
          if (cell.status === 'P') { st = 'Present'; wh = 8; }
          else if (cell.status === 'A') { st = 'Absent'; wh = 0; }
          else if (cell.status === 'HD') { st = 'Half Day'; wh = 4; }
          else if (cell.status === 'H') { st = 'Holiday'; wh = 0; }
          else if (cell.status === 'W') { st = 'Week Off'; wh = 0; }
          
          entries.push({
            employee_id: emp.id,
            date: fullDate,
            status: st,
            working_hours: wh,
            overtime_hours: parseFloat(cell.ot) || 0
          });
        }
      });
    });

    const res = await apiPost('/hrms/attendance/bulk-any/', { entries });
    setSaving(false);
    if (res && res.ok) {
      setMessage({ type: 'success', text: `Saved ${res.data?.count ?? entries.length} records successfully!` });
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to save attendance.' });
    }
  };

  return (
    <>
      <Navbar />
      <style>{`
        .reg-table th, .reg-table td { padding: 2px !important; border: 1px solid #cbd5e1; text-align: center; }
        .reg-table th { background: #1e293b; color: white; font-size: 0.8rem; position: sticky; top: 0; z-index: 10; }
        .cell-input { width: 28px; height: 24px; border: none; text-align: center; font-size: 0.75rem; font-weight: bold; background: transparent; }
        .cell-input:focus { outline: 1px solid #3b82f6; background: #eff6ff; }
        .status-P { color: #16a34a; }
        .status-A { color: #dc2626; }
        .status-HD { color: #d97706; }
        .ot-input { width: 22px; height: 24px; border: none; border-left: 1px solid #e2e8f0; text-align: center; font-size: 0.75rem; background: #fffbeb; color: #92400e; }
        .ot-input:focus { outline: 1px solid #f59e0b; }
        .flex-cell { display: flex; align-items: center; justify-content: center; width: 50px; }
      `}</style>
      
      <div className="container" style={{ maxWidth: '98%' }}>
        <div className="page-header" style={{ marginBottom: '15px' }}>
          <div>
            <h1>📅 Monthly Attendance Register</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              P: Present (8h) | A: Absent (0h) | HD: Half Day (4h) | H: Holiday | W: Week Off. Enter OT hours in the yellow box.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/hrms/employees" className="btn btn-outline" target="_blank">
              <i className="fas fa-users"></i> Add/Edit Employees
            </Link>
            <input type="month" className="form-input" value={month} onChange={e => setMonth(e.target.value)} />
            <select className="form-select" value={deptId} onChange={e => setDeptId(e.target.value)}>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button onClick={saveAll} className="btn btn-success" disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save Register'}
            </button>
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '10px', padding: '10px' }}>{message.text}</div>}

        <div className="card" style={{ padding: '0', overflowX: 'auto', maxHeight: '75vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading Register...</div>
          ) : (
            <table className="reg-table" style={{ width: 'max-content', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '70px', left: 0, position: 'sticky', zIndex: 12 }}>Code</th>
                  <th style={{ minWidth: '150px', left: '70px', position: 'sticky', zIndex: 12 }}>Name</th>
                  {days.map(d => (
                    <th key={d} style={{ width: '50px' }}>{parseInt(d)}<br/><span style={{fontSize:'0.6rem'}}>St|OT</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ background: '#f8fafc', fontWeight: 'bold', fontSize: '0.8rem', left: 0, position: 'sticky', zIndex: 11 }}>{emp.employee_code}</td>
                    <td style={{ background: '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'left', paddingLeft: '8px !important', left: '70px', position: 'sticky', zIndex: 11 }}>{emp.name}</td>
                    {days.map(d => {
                      const cell = attendanceData[emp.id]?.[d] || { status: '', ot: '' };
                      return (
                        <td key={d} style={{ padding: 0 }}>
                          <div className="flex-cell">
                            <input
                              type="text"
                              maxLength="2"
                              className={`cell-input status-${cell.status}`}
                              value={cell.status}
                              onChange={e => handleCellChange(emp.id, d, 'status', e.target.value)}
                              title="Status (P, A, HD, H, W)"
                            />
                            <input
                              type="text"
                              maxLength="4"
                              className="ot-input"
                              value={cell.ot}
                              onChange={e => handleCellChange(emp.id, d, 'ot', e.target.value)}
                              title="OT Hours"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={days.length + 2} style={{ padding: '30px' }}>No employees in this department.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
