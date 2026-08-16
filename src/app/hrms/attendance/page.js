'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function HRMSAttendance() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [date]);

  async function fetchData() {
    setLoading(true);
    const [empRes, attRes, deptRes] = await Promise.all([
      apiGet('/hrms/employees/?status=Active'),
      apiGet(`/hrms/attendance/?date=${date}`),
      apiGet('/hrms/departments/'),
    ]);

    if (empRes) setEmployees(empRes);
    if (deptRes) setDepartments(deptRes);

    const savedMap = {};
    if (attRes && attRes.attendance) {
      attRes.attendance.forEach((a) => {
        savedMap[a.employee] = {
          status: a.status,
          working_hours: a.working_hours,
          overtime_hours: a.overtime_hours,
          remarks: a.remarks || '',
        };
      });
    }

    const map = {};
    if (empRes) {
      empRes.forEach((e) => {
        if (savedMap[e.id]) {
          map[e.id] = savedMap[e.id];
        } else {
          // Default to ABSENT if not saved yet for this date
          map[e.id] = { status: 'Absent', working_hours: '0', overtime_hours: '0', remarks: '' };
        }
      });
    }

    setAttendanceMap(map);
    setLoading(false);
  }

  const handleFieldChange = (empId, field, val) => {
    let updatedVal = val;
    let autoWorkHours = attendanceMap[empId]?.working_hours || '0';

    if (field === 'status') {
      if (val === 'Present') autoWorkHours = '8';
      else if (val === 'Half Day') autoWorkHours = '4';
      else if (val === 'Absent') autoWorkHours = '0';
      else if (val === 'Holiday' || val === 'Week Off') autoWorkHours = '0';
    }

    setAttendanceMap((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: updatedVal,
        working_hours: field === 'status' ? autoWorkHours : prev[empId]?.working_hours,
      },
    }));
  };

  const handleSaveBulk = async () => {
    setSaving(true);
    setMessage(null);

    const entries = employees.map((e) => ({
      employee_id: e.id,
      status: attendanceMap[e.id]?.status || 'Absent',
      working_hours: attendanceMap[e.id]?.working_hours || '0',
      overtime_hours: attendanceMap[e.id]?.overtime_hours || '0',
      remarks: attendanceMap[e.id]?.remarks || '',
    }));

    const res = await apiPost('/hrms/attendance/bulk/', {
      date,
      entries,
    });
    setSaving(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: `Attendance saved for ${date} (${res.count} employees)!` });
      fetchData();
    } else {
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    }
  };

  const markAllPresent = () => {
    const nextMap = { ...attendanceMap };
    filteredEmployees.forEach((e) => {
      nextMap[e.id] = { ...(nextMap[e.id] || {}), status: 'Present', working_hours: '8' };
    });
    setAttendanceMap(nextMap);
  };

  const markAllAbsent = () => {
    const nextMap = { ...attendanceMap };
    filteredEmployees.forEach((e) => {
      nextMap[e.id] = { ...(nextMap[e.id] || {}), status: 'Absent', working_hours: '0', overtime_hours: '0' };
    });
    setAttendanceMap(nextMap);
  };

  const filteredEmployees = employees.filter((emp) => {
    if (deptFilter && String(emp.department) !== String(deptFilter)) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        (emp.name && emp.name.toLowerCase().includes(term)) ||
        (emp.employee_code && emp.employee_code.toLowerCase().includes(term)) ||
        (emp.designation && emp.designation.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📅 Daily Attendance Sheet</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Default: <strong>Absent</strong> (Select Present/Half Day & Overtime hours for active workers)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '160px' }}
            />
            <button onClick={markAllPresent} className="btn" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
              Mark Filtered Present
            </button>
            <button onClick={markAllAbsent} className="btn" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>
              Mark Filtered Absent
            </button>
            <button onClick={handleSaveBulk} className="btn btn-success" disabled={saving}>
              {saving ? 'Saving...' : 'Save Attendance Sheet'}
            </button>
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        {/* Filter Card */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div className="grid-2" style={{ gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search by worker name or employee code..."
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
                <option value="">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Sheet Table */}
        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading attendance sheet...</div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th>CODE</th>
                    <th>NAME</th>
                    <th>TYPE</th>
                    <th>DEPARTMENT</th>
                    <th>ATTENDANCE STATUS</th>
                    <th>WORK HOURS</th>
                    <th>OT HOURS</th>
                    <th>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => {
                    const att = attendanceMap[emp.id] || { status: 'Absent', working_hours: '0', overtime_hours: '0', remarks: '' };
                    return (
                      <tr key={emp.id} style={{ background: att.status === 'Absent' ? '#fff1f2' : att.status === 'Present' ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ fontWeight: 700, color: '#2563eb' }}>{emp.employee_code}</td>
                        <td style={{ fontWeight: 600 }}>{emp.name}</td>
                        <td>
                          {emp.employee_type === 'Company' ? (
                            <span className="badge" style={{ background: '#8b5cf6', color: 'white', fontWeight: 800 }}>
                              CO (Company)
                            </span>
                          ) : (
                            <span className="badge" style={{ background: '#f59e0b', color: 'white', fontWeight: 600 }}>
                              Contractor {emp.contractor_name ? `(${emp.contractor_name})` : ''}
                            </span>
                          )}
                        </td>
                        <td>{emp.department_name || '-'}</td>
                        <td>
                          <select
                            className="form-select"
                            style={{
                              fontSize: '0.85rem',
                              padding: '4px 8px',
                              width: '130px',
                              fontWeight: 700,
                              color: att.status === 'Present' ? '#16a34a' : att.status === 'Absent' ? '#dc2626' : '#d97706',
                            }}
                            value={att.status}
                            onChange={(e) => handleFieldChange(emp.id, 'status', e.target.value)}
                          >
                            <option value="Absent" style={{ color: '#dc2626', fontWeight: 700 }}>Absent</option>
                            <option value="Present" style={{ color: '#16a34a', fontWeight: 700 }}>Present</option>
                            <option value="Half Day" style={{ color: '#d97706', fontWeight: 700 }}>Half Day</option>
                            <option value="Holiday">Holiday</option>
                            <option value="Week Off">Week Off</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            style={{ width: '80px', padding: '4px 8px' }}
                            value={att.working_hours}
                            onChange={(e) => handleFieldChange(emp.id, 'working_hours', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            style={{ width: '80px', padding: '4px 8px' }}
                            value={att.overtime_hours}
                            onChange={(e) => handleFieldChange(emp.id, 'overtime_hours', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px' }}
                            placeholder="Optional remark"
                            value={att.remarks}
                            onChange={(e) => handleFieldChange(emp.id, 'remarks', e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredEmployees.length && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No active employees matching search/filter.
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
