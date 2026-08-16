'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function CreateUserPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [pagesMap, setPagesMap] = useState({});
  const [selectedPages, setSelectedPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function fetchPagesMap() {
      setLoading(true);
      const res = await apiGet('/accounts/pages-map/');
      if (res) setPagesMap(res);
      setLoading(false);
    }
    fetchPagesMap();
  }, []);

  const handleCheckboxChange = (urlName) => {
    if (selectedPages.includes(urlName)) {
      setSelectedPages(selectedPages.filter((p) => p !== urlName));
    } else {
      setSelectedPages([...selectedPages, urlName]);
    }
  };

  const handleSelectModule = (modulePages) => {
    const pageKeys = modulePages.map((p) => p[0]);
    const allSelected = pageKeys.every((k) => selectedPages.includes(k));
    if (allSelected) {
      setSelectedPages(selectedPages.filter((k) => !pageKeys.includes(k)));
    } else {
      setSelectedPages(Array.from(new Set([...selectedPages, ...pageKeys])));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setMessage({ type: 'error', text: 'Username and password are required!' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await apiPost('/accounts/users/', {
      username: username.trim(),
      password,
      is_superuser: isSuperuser,
      allowed_pages: selectedPages,
    });
    setSaving(false);

    if (res && res.ok) {
      alert(`User "${username}" created successfully!`);
      router.push('/users');
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to create user' });
    }
  };

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
              <i className="fas fa-user-plus"></i>
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Create New User</h1>
              <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '0.875rem' }}>
                Add a new system user with specific module & page access permissions
              </p>
            </div>
          </div>
          <Link href="/users" className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
            <i className="fas fa-arrow-left mr-1"></i> Cancel
          </Link>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: '28px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Section 1: User Credentials */}
            <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '16px' }}>User Account Credentials & Role</h2>
              <div className="grid-3" style={{ gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-user mr-1" style={{ color: '#64748b' }}></i> Username *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. operator1, sales_rajesh"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-lock mr-1" style={{ color: '#64748b' }}></i> Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-crown mr-1" style={{ color: '#d97706' }}></i> User Role Level *</label>
                  <select
                    className="form-select"
                    value={isSuperuser ? 'superuser' : 'standard'}
                    onChange={(e) => setIsSuperuser(e.target.value === 'superuser')}
                  >
                    <option value="standard">Standard User (Restricted to Selected Pages)</option>
                    <option value="superuser">Superuser (Full Admin System Access)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Page Access Permissions Grid */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>
                  <i className="fas fa-shield-alt text-blue-600 mr-2"></i> Page Access Permissions
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
                  {selectedPages.length} Pages Selected
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading permissions map...</div>
              ) : (
                <div className="grid-3" style={{ gap: '16px' }}>
                  {Object.keys(pagesMap).map((moduleName) => {
                    const pages = pagesMap[moduleName] || [];
                    const allSelected = pages.every((p) => selectedPages.includes(p[0]));

                    return (
                      <div key={moduleName} style={{
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                            <i className="fas fa-folder text-slate-400 mr-2"></i> {moduleName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectModule(pages)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {pages.map(([urlName, title]) => {
                          const isChecked = selectedPages.includes(urlName);
                          return (
                            <label key={urlName} style={{
                              display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0',
                              fontSize: '0.85rem', color: isChecked ? '#1e293b' : '#64748b', fontWeight: isChecked ? 600 : 'normal',
                              cursor: 'pointer'
                            }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxChange(urlName)}
                                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                              />
                              <span>{title}</span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: '#16a34a', padding: '12px 32px', fontSize: '0.95rem' }}
                disabled={saving}
              >
                <i className="fas fa-save mr-2"></i> {saving ? 'Creating User...' : 'Create User Account'}
              </button>
              <Link href="/users" className="btn" style={{ background: '#f1f5f9', color: '#475569', padding: '12px 24px' }}>
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
