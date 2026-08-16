'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function HRMSDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      const res = await apiGet('/hrms/dashboard/');
      if (res) setData(res);
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  const stats = data?.stats || {};
  const recentAtt = data?.recent_attendance || [];
  const recentEmp = data?.recent_employees || [];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1>👥 HRMS & Payroll Management</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Employee directory, attendance, piece-rate production & automated salary engine
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/hrms/attendance" className="btn btn-primary" style={{ background: '#10b981' }}>
              <i className="fas fa-calendar-check mr-1"></i> Mark Attendance
            </Link>
            <Link href="/hrms/salary" className="btn btn-primary" style={{ background: '#2563eb' }}>
              <i className="fas fa-calculator mr-1"></i> Salary Engine
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Employees</span>
            <span className="stat-number" style={{ color: '#2563eb' }}>{stats.total_employees ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Present Today</span>
            <span className="stat-number" style={{ color: '#10b981' }}>{stats.today_present ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Absent Today</span>
            <span className="stat-number" style={{ color: '#ef4444' }}>{stats.today_absent ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Departments</span>
            <span className="stat-number" style={{ color: '#8b5cf6' }}>{stats.total_departments ?? 0}</span>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <Link href="/hrms/employees" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', height: '100%' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>👨‍💼</div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Employee Directory</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Add, edit & view active employee profiles</p>
            </div>
          </Link>
          <Link href="/hrms/attendance" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', height: '100%' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>📅</div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Daily Attendance</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Mark present/absent & overtime hours in bulk</p>
            </div>
          </Link>
          <Link href="/hrms/production" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', height: '100%' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>⚙️</div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Piece-Rate Production</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Record worker piece-rate production & earnings</p>
            </div>
          </Link>
          <Link href="/hrms/salary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', height: '100%' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>💵</div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Salary & Slips</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Auto-calculate monthly payroll & print payslips</p>
            </div>
          </Link>
        </div>

        <div className="grid-2">
          {/* Today's Attendance Overview */}
          <div className="card">
            <h2>Today's Attendance ({recentAtt.length})</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading attendance...</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Dept</th>
                      <th>Status</th>
                      <th>OT Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAtt.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.employee_code}</td>
                        <td>{a.employee_name}</td>
                        <td>{a.department_name || '-'}</td>
                        <td>
                          <span className={`badge ${a.status === 'Present' ? 'green' : a.status === 'Half Day' ? 'yellow' : 'red'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>{a.overtime_hours > 0 ? `+${a.overtime_hours} hrs` : '-'}</td>
                      </tr>
                    ))}
                    {!recentAtt.length && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                          No attendance recorded for today yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Employees */}
          <div className="card">
            <h2>Recent Employees</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmp.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.employee_code}</td>
                      <td>{e.name}</td>
                      <td>{e.designation}</td>
                      <td><span className="badge blue">{e.employee_type}</span></td>
                    </tr>
                  ))}
                  {!recentEmp.length && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                        No employees added yet.
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
