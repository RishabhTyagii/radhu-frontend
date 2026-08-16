'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export default function HRMSDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    setLoading(true);
    const res = await apiGet('/hrms/departments/');
    if (res) setDepartments(res);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMessage(null);

    const res = await apiPost('/hrms/departments/', { name: name.trim() });
    setSaving(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: `Department "${name}" added!` });
      setName('');
      fetchDepartments();
    } else {
      setMessage({ type: 'error', text: res?.data?.name?.[0] || 'Failed to add department' });
    }
  };

  const handleDelete = async (id, depName) => {
    if (!confirm(`Delete department "${depName}"?`)) return;
    const res = await apiDelete(`/hrms/departments/${id}/`);
    if (res && res.ok) {
      fetchDepartments();
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🏢 Department Management</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Create & manage company departments for worker allocation
            </p>
          </div>
        </div>

        <div className="grid-2">
          {/* Form */}
          <div className="card">
            <h2>Add New Department</h2>
            {message && <div className={`message ${message.type}`} style={{ marginTop: '12px' }}>{message.text}</div>}

            <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mixing, Curing, Packing, Maintenance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#8b5cf6' }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Department'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="card">
            <h2>Existing Departments ({departments.length})</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading departments...</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Employees Count</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td><span className="badge blue">{d.employee_count} employees</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            className="btn"
                            style={{ background: 'transparent', color: '#ef4444', padding: '4px' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!departments.length && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                          No departments created yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
