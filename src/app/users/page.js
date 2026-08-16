'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiDelete } from '@/lib/api';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await apiGet('/accounts/users/');
    if (res) setUsers(res);
    setLoading(false);
  }

  const handleDelete = async (id, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    const res = await apiDelete(`/accounts/users/${id}/`);
    if (res && res.ok) {
      setMessage({ type: 'success', text: `User "${username}" deleted!` });
      fetchUsers();
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to delete user' });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      String(u.id).includes(term) ||
      (u.is_superuser ? 'superuser' : 'user').includes(term)
    );
  });

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#475569'
            }}>
              <i className="fas fa-users-cog"></i>
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Manage Users</h1>
              <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '0.875rem' }}>
                View & manage system users, role levels, and granular page access permissions
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search username, ID, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/users/create" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '10px 22px' }}>
              <i className="fas fa-user-plus mr-1"></i> Create User
            </Link>
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading users...</div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>USER</th>
                    <th>ROLE</th>
                    <th>PAGE ACCESS PERMISSIONS</th>
                    <th style={{ textAlign: 'center', width: '160px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: '#64748b' }}>#{u.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563eb, #8b5cf6)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem'
                          }}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{u.username}</span>
                        </div>
                      </td>
                      <td>
                        {u.is_superuser ? (
                          <span className="badge" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', fontWeight: 700 }}>
                            <i className="fas fa-crown mr-1"></i> Superuser (Full Access)
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                            <i className="fas fa-user mr-1"></i> Standard User
                          </span>
                        )}
                      </td>
                      <td>
                        {u.is_superuser ? (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>All Modules & Pages</span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {u.allowed_pages?.length ? `${u.allowed_pages.length} Pages Allowed` : 'No Custom Access'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link href={`/users/${u.id}/edit`} className="btn" style={{ background: '#2563eb', color: 'white', padding: '6px 14px', fontSize: '0.8rem' }}>
                            <i className="fas fa-pen mr-1"></i> Edit
                          </Link>
                          {!u.is_superuser && (
                            <button
                              onClick={() => handleDelete(u.id, u.username)}
                              className="btn"
                              style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 10px', fontSize: '0.8rem' }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        No users found.
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
