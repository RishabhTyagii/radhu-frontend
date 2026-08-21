'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiUpload } from '@/lib/api';

export default function AutoTyreProduction() {
  const [tyres, setTyres] = useState([]);
  const [recent, setRecent] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Excel Upload states
  const [excelFile, setExcelFile] = useState(null);
  const [clearExisting, setClearExisting] = useState(true);
  const [importDate, setImportDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    tyre_item: '',
    date: today,
    all_curing: '',
    production_tyre: '0',
    repair: '0',
    second_grade: '0',
    third_grade: '0',
    lose_tyre: '0',
    actual_weight: '',
    remark: ''
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTyres();
    fetchRecent();
  }, []);

  async function fetchTyres() {
    const data = await apiGet('/stock/tyres/');
    if (data) setTyres(data);
  }

  async function fetchRecent() {
    const data = await apiGet('/stock/production/recent/');
    if (data) setRecent(data);
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calculatePacking = () => {
    const all = parseInt(form.all_curing || 0);
    const rep = parseInt(form.repair || 0);
    const prod = parseInt(form.production_tyre || 0);
    const sec = parseInt(form.second_grade || 0);
    const third = parseInt(form.third_grade || 0);
    const lose = parseInt(form.lose_tyre || 0);
    return (all + rep + prod) - (sec + third + lose);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await apiPost('/stock/production/', form);
    setLoading(false);

    if (res && res.ok) {
      setMsg({ type: 'success', text: '✅ Auto Tyre production entry added successfully' });
      setForm({ ...form, all_curing: '', actual_weight: '', remark: '' });
      fetchRecent();
    } else {
      const errText = typeof res?.data === 'object' ? JSON.stringify(res.data) : (res?.data?.error || 'Failed to add entry');
      setMsg({ type: 'error', text: `❌ ${errText}` });
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setMsg({ type: 'error', text: 'Please select an Excel file first.' });
      return;
    }

    setUploading(true);
    setMsg(null);
    setImportResult(null);

    try {
      const body = new FormData();
      body.append('file', excelFile);
      body.append('clear_existing', clearExisting ? 'true' : 'false');
      if (importDate) body.append('import_date', importDate);

      const res = await apiUpload('/stock/import-excel/', body);
      setUploading(false);

      if (res && res.ok) {
        setMsg({ type: 'success', text: `✅ ${res.data.message}` });
        setImportResult(res.data);
        setExcelFile(null);
        const fileInput = document.getElementById('autoTyreExcelInput');
        if (fileInput) fileInput.value = '';
        fetchTyres();
        fetchRecent();
      } else {
        const errText = res?.data?.error || res?.data?.detail || 'Failed to import Excel file.';
        setMsg({ type: 'error', text: `❌ ${errText}` });
      }
    } catch (err) {
      setUploading(false);
      setMsg({ type: 'error', text: '❌ Network error while uploading file.' });
    }
  };

  const isMobile = windowWidth < 768;

  const theme = {
    bg: darkMode ? '#0f172a' : '#f1f5f9',
    bg2: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    shadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
    shadowHover: darkMode ? '0 8px 32px rgba(59,130,246,0.25)' : '0 8px 32px rgba(59,130,246,0.12)',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'all 0.3s ease' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '12px' : '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #0d9488, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🚗 Auto Tyre Production Entry
            </h1>
            <p style={{ color: theme.text2, fontSize: '0.85rem', marginTop: '4px' }}>
              Add manual daily production or bulk import from Excel sheet
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ padding: '8px 18px', borderRadius: '50px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            {darkMode ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* Global Alert Message */}
        {msg && (
          <div style={{ marginBottom: '20px', padding: '14px 20px', borderRadius: '12px', backgroundColor: msg.type === 'success' ? (darkMode ? 'rgba(16,185,129,0.15)' : '#f0fdf4') : (darkMode ? 'rgba(239,68,68,0.15)' : '#fef2f2'), color: msg.type === 'success' ? (darkMode ? '#34d399' : '#166534') : (darkMode ? '#f87171' : '#991b1b'), border: `2px solid ${msg.type === 'success' ? '#34d399' : '#f87171'}`, fontWeight: 600 }}>
            {msg.text}
          </div>
        )}

        {/* Excel Import Card */}
        <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', boxShadow: theme.shadow, border: `2px solid ${theme.border}`, padding: isMobile ? '16px' : '24px', marginBottom: '24px', borderLeft: `6px solid #0d9488` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#0d9488', margin: 0, fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 700 }}>
                📊 Bulk Excel Import (Auto Production)
              </h3>
              <p style={{ color: theme.text2, fontSize: '0.8rem', marginTop: '4px' }}>
                Upload Auto Production Excel file (.xls / .xlsx) to bulk import production entries
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>📁</span>
          </div>

          <form onSubmit={handleExcelImport} style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>📄 Excel File (.xlsx / .xls)</label>
                <input
                  id="autoTyreExcelInput"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  style={{ width: '100%', padding: '8px 12px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>📅 Entry Date (Optional)</label>
                <input
                  type="date"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: theme.text }}>
                <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0d9488' }} />
                Reset Old Production Entries
              </label>
              <button
                type="submit"
                disabled={uploading || !excelFile}
                style={{ padding: '10px 28px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, cursor: uploading || !excelFile ? 'not-allowed' : 'pointer', opacity: uploading || !excelFile ? 0.6 : 1 }}
              >
                {uploading ? '⏳ Importing...' : '🚀 Import Data'}
              </button>
            </div>
          </form>

          {importResult && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: '2px solid #0d9488' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0d9488' }}>📋 Import Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ backgroundColor: theme.bg2, padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: theme.text2 }}>Entries Imported</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0d9488' }}>{importResult.created_entries}</div>
                </div>
                <div style={{ backgroundColor: theme.bg2, padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: theme.text2 }}>Total Curing Pcs</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>{importResult.total_curing}</div>
                </div>
                <div style={{ backgroundColor: theme.bg2, padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: theme.text2 }}>Total Packing Stock</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{importResult.total_packing}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Single Entry Form & Recent Table */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', boxShadow: theme.shadow, border: `2px solid ${theme.border}`, padding: isMobile ? '16px' : '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: theme.text, fontSize: '1.2rem', fontWeight: 700 }}>
              ➕ Single Production Entry
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>🚗 Tyre *</label>
                <select name="tyre_item" value={form.tyre_item} onChange={handleChange} required style={{ width: '100%', padding: '10px 14px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }}>
                  <option value="">-- Select Tyre --</option>
                  {tyres.map(t => (
                    <option key={t.id} value={t.id}>{t.tyre} {t.pattern} ({t.type}) - Stock: {t.stock}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>📅 Date *</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required style={{ width: '100%', padding: '10px 14px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>🏭 All Curing *</label>
                  <input type="number" name="all_curing" value={form.all_curing} onChange={handleChange} required placeholder="e.g. 100" style={{ width: '100%', padding: '10px 14px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: theme.text }}>Production (+)</label>
                  <input type="number" name="production_tyre" value={form.production_tyre} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.bg, color: theme.text }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: theme.text }}>Repair (+)</label>
                  <input type="number" name="repair" value={form.repair} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.bg, color: theme.text }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: theme.text }}>2nd Grade (-)</label>
                  <input type="number" name="second_grade" value={form.second_grade} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.bg, color: theme.text }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>3rd Grade (-)</label>
                  <input type="number" name="third_grade" value={form.third_grade} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.bg, color: theme.text }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>Lose Tyre (-)</label>
                  <input type="number" name="lose_tyre" value={form.lose_tyre} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.bg, color: theme.text }} />
                </div>
              </div>

              <div style={{ backgroundColor: darkMode ? 'rgba(13,148,136,0.1)' : '#ccfbf1', padding: '12px 16px', borderRadius: '10px', border: `2px solid #0d9488`, marginBottom: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0d9488', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Calculated Packing Stock:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{calculatePacking()} pcs</span>
                </span>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving...' : '💾 Save Production Entry'}
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', boxShadow: theme.shadow, border: `2px solid ${theme.border}`, padding: isMobile ? '16px' : '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: theme.text, fontSize: '1.2rem', fontWeight: 700 }}>
              📋 Recent Production Entries
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}`, textAlign: 'left', color: theme.text2 }}>
                    <th style={{ padding: '8px 12px' }}>Date</th>
                    <th style={{ padding: '8px 12px' }}>Tyre</th>
                    <th style={{ padding: '8px 12px' }}>Curing</th>
                    <th style={{ padding: '8px 12px' }}>Packing</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '8px 12px', color: theme.text }}>{item.date}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: theme.text }}>{item.tyre_item ? `${item.tyre_item.tyre} ${item.tyre_item.pattern}` : '-'}</td>
                      <td style={{ padding: '8px 12px', color: theme.text }}>{item.all_curing}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: '#10b981' }}>+{item.quantity}</td>
                    </tr>
                  ))}
                  {!recent.length && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: theme.text2, padding: '24px' }}>No recent entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
