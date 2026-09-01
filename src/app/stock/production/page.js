'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiUpload } from '@/lib/api';

export default function AutoTyreProduction() {
  const [tyres, setTyres] = useState([]);
  const [recent, setRecent] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Active View Mode: 'single' | 'sheet' | 'excel'
  const [activeViewMode, setActiveViewMode] = useState('single');

  // Single Entry Form state
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
    remark: '',
  });

  // Searchable Tyre Combobox State (Single Entry)
  const [tyreSearchQuery, setTyreSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sheet Entry State (Bulk Production Sheet)
  const [sheetDate, setSheetDate] = useState(today);
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const [sheetEntries, setSheetEntries] = useState({});
  const [savingSheet, setSavingSheet] = useState(false);

  // Excel Upload states
  const [excelFile, setExcelFile] = useState(null);
  const [clearExisting, setClearExisting] = useState(true);
  const [importDate, setImportDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTyres();
    fetchRecent();
  }, []);

  // Initialize sheet entries when tyres load
  useEffect(() => {
    if (tyres.length > 0) {
      const initialSheet = {};
      tyres.forEach((t) => {
        initialSheet[t.id] = {
          all_curing: '',
          production_tyre: '0',
          repair: '0',
          second_grade: '0',
          third_grade: '0',
          lose_tyre: '0',
          actual_weight: '',
          remark: '',
        };
      });
      setSheetEntries(initialSheet);
    }
  }, [tyres]);

  async function fetchTyres() {
    const data = await apiGet('/stock/tyres/');
    if (data) {
      setTyres(data);
      if (data.length > 0 && !form.tyre_item) {
        setForm((prev) => ({ ...prev, tyre_item: data[0].id }));
      }
    }
  }

  async function fetchRecent() {
    const data = await apiGet('/stock/production/recent/');
    if (data) setRecent(data);
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Filtered Tyres for Single Entry Searchable Combobox
  const filteredTyresForDropdown = useMemo(() => {
    if (!tyreSearchQuery.trim()) return tyres;
    const q = tyreSearchQuery.toLowerCase();
    return tyres.filter((t) => {
      const name = `${t.tyre || ''} ${t.pattern || ''} ${t.type || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [tyres, tyreSearchQuery]);

  const selectedTyreObject = useMemo(() => {
    return tyres.find((t) => String(t.id) === String(form.tyre_item));
  }, [tyres, form.tyre_item]);

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
    if (!form.tyre_item) {
      setMsg({ type: 'error', text: 'Please select a tyre first.' });
      return;
    }
    setMsg(null);
    setLoading(true);
    const res = await apiPost('/stock/production/', form);
    setLoading(false);

    if (res && res.ok) {
      setMsg({ type: 'success', text: '✅ Auto Tyre production entry added successfully' });
      setForm({ ...form, all_curing: '', actual_weight: '', remark: '' });
      fetchTyres();
      fetchRecent();
    } else {
      const errText = typeof res?.data === 'object' ? JSON.stringify(res.data) : (res?.data?.error || 'Failed to add entry');
      setMsg({ type: 'error', text: `❌ ${errText}` });
    }
  };

  // Sheet Entry Helpers
  const handleSheetFieldChange = (tyreId, field, value) => {
    setSheetEntries((prev) => ({
      ...prev,
      [tyreId]: {
        ...(prev[tyreId] || {}),
        [field]: value,
      },
    }));
  };

  const calculateRowPacking = (row) => {
    if (!row) return 0;
    const all = parseInt(row.all_curing || 0);
    const rep = parseInt(row.repair || 0);
    const prod = parseInt(row.production_tyre || 0);
    const sec = parseInt(row.second_grade || 0);
    const third = parseInt(row.third_grade || 0);
    const lose = parseInt(row.lose_tyre || 0);
    return (all + rep + prod) - (sec + third + lose);
  };

  // Filtered Tyres for Sheet View Table
  const filteredTyresForSheet = useMemo(() => {
    if (!sheetSearchQuery.trim()) return tyres;
    const q = sheetSearchQuery.toLowerCase();
    return tyres.filter((t) => {
      const name = `${t.tyre || ''} ${t.pattern || ''} ${t.type || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [tyres, sheetSearchQuery]);

  // Dynamic Sheet KPI Totals
  const sheetStats = useMemo(() => {
    let totalCuring = 0;
    let totalProd = 0;
    let totalRepair = 0;
    let totalSecond = 0;
    let totalThird = 0;
    let totalLose = 0;
    let totalPacking = 0;
    let filledCount = 0;

    Object.entries(sheetEntries).forEach(([tyreId, row]) => {
      const curing = parseInt(row.all_curing || 0);
      if (curing > 0) {
        filledCount++;
        totalCuring += curing;
        totalProd += parseInt(row.production_tyre || 0);
        totalRepair += parseInt(row.repair || 0);
        totalSecond += parseInt(row.second_grade || 0);
        totalThird += parseInt(row.third_grade || 0);
        totalLose += parseInt(row.lose_tyre || 0);
        totalPacking += calculateRowPacking(row);
      }
    });

    return {
      totalCuring,
      totalProd,
      totalRepair,
      totalSecond,
      totalThird,
      totalLose,
      totalPacking,
      filledCount,
    };
  }, [sheetEntries]);

  // Bulk Save Sheet
  const handleSaveSheet = async () => {
    const entriesToSave = [];
    Object.entries(sheetEntries).forEach(([tyreId, row]) => {
      const curing = parseInt(row.all_curing || 0);
      if (curing > 0) {
        entriesToSave.push({
          tyre_item: Number(tyreId),
          date: sheetDate,
          all_curing: curing,
          production_tyre: parseInt(row.production_tyre || 0),
          repair: parseInt(row.repair || 0),
          second_grade: parseInt(row.second_grade || 0),
          third_grade: parseInt(row.third_grade || 0),
          lose_tyre: parseInt(row.lose_tyre || 0),
          actual_weight: row.actual_weight || null,
          remark: row.remark || '',
        });
      }
    });

    if (entriesToSave.length === 0) {
      alert('⚠️ Kisi bhi tyre me All Curing (> 0) nahi bhari hai! Pehle sheet me curing quantity daalein.');
      return;
    }

    setSavingSheet(true);
    setMsg(null);

    const res = await apiPost('/stock/production/bulk-sheet/', {
      date: sheetDate,
      entries: entriesToSave,
    });

    setSavingSheet(false);

    if (res && res.ok) {
      setMsg({
        type: 'success',
        text: `✅ ${res.data.message} (Total Curing: ${res.data.total_curing} pcs | 1st Grade Packing: +${res.data.total_packing} pcs)`,
      });
      // Reset sheet inputs to 0
      const resetSheet = {};
      tyres.forEach((t) => {
        resetSheet[t.id] = {
          all_curing: '',
          production_tyre: '0',
          repair: '0',
          second_grade: '0',
          third_grade: '0',
          lose_tyre: '0',
          actual_weight: '',
          remark: '',
        };
      });
      setSheetEntries(resetSheet);
      fetchTyres();
      fetchRecent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const errText = res?.data?.error || (res?.data ? JSON.stringify(res.data) : 'Failed to save production sheet');
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
    bg: darkMode ? '#0a0f1d' : '#f1f5f9',
    bg2: darkMode ? '#121b2f' : '#ffffff',
    bg3: darkMode ? '#1e293b' : '#f8fafc',
    text: darkMode ? '#f8fafc' : '#0f172a',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#1e2c4a' : '#e2e8f0',
    cardBorder: darkMode ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
    inputBg: darkMode ? '#0b1220' : '#ffffff',
    inputBorder: darkMode ? '#273552' : '#cbd5e1',
    shadow: darkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.06)',
    activeRowBg: darkMode ? 'rgba(13, 148, 136, 0.15)' : '#f0fdf4',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'all 0.3s ease' }}>
      <Navbar />

      <div style={{
        maxWidth: activeViewMode === 'sheet' ? '100%' : '1440px',
        margin: '0 auto',
        padding: activeViewMode === 'sheet' ? '0' : (isMobile ? '12px' : '24px'),
      }}>
        
        {/* Header with Mode Switcher */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: activeViewMode === 'sheet' ? '0' : '24px',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          paddingTop: activeViewMode === 'sheet' ? '12px' : '0',
          paddingLeft: activeViewMode === 'sheet' ? '16px' : '0',
          paddingRight: activeViewMode === 'sheet' ? '16px' : '0',
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: activeViewMode === 'sheet' ? theme.bg2 : 'transparent',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                fontSize: isMobile ? '1.35rem' : '1.85rem',
                fontWeight: 800,
                margin: 0,
                background: 'linear-gradient(135deg, #0d9488, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                🚗 Auto Tyre Production
              </h1>
              <span style={{
                background: activeViewMode === 'sheet' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: activeViewMode === 'sheet' ? '#10b981' : '#2563eb',
                border: `1px solid ${activeViewMode === 'sheet' ? '#10b981' : '#2563eb'}`,
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 8px',
                textTransform: 'uppercase',
              }}>
                {activeViewMode === 'sheet' ? '⚡ Sheet Entry Mode' : activeViewMode === 'excel' ? '📁 Excel Import' : '➕ Single Entry'}
              </span>
            </div>
            <p style={{ color: theme.text2, fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
              Add single entry with search, bulk entry on full auto tyre sheet, or import from Excel
            </p>
          </div>

          {/* Action Toolbar & Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Entry on Sheet Button (Highlight) */}
            <button
              onClick={() => setActiveViewMode(activeViewMode === 'sheet' ? 'single' : 'sheet')}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: activeViewMode === 'sheet' ? '#10b981' : (darkMode ? '#1e293b' : '#ffffff'),
                color: activeViewMode === 'sheet' ? '#ffffff' : (darkMode ? '#34d399' : '#059669'),
                border: `2px solid ${activeViewMode === 'sheet' ? '#10b981' : '#10b981'}`,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeViewMode === 'sheet' ? '0 4px 16px rgba(16, 185, 129, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>📝 Entry on Sheet</span>
              <span style={{
                background: activeViewMode === 'sheet' ? 'rgba(255,255,255,0.3)' : 'rgba(16, 185, 129, 0.15)',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.7rem',
              }}>All Auto Tyres</span>
            </button>

            {/* Single Entry Tab */}
            <button
              onClick={() => setActiveViewMode('single')}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: activeViewMode === 'single' ? '#2563eb' : (darkMode ? '#1e293b' : '#ffffff'),
                color: activeViewMode === 'single' ? '#ffffff' : theme.text2,
                border: `1px solid ${activeViewMode === 'single' ? '#2563eb' : theme.border}`,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              ➕ Single Entry
            </button>

            {/* Excel Import Tab */}
            <button
              onClick={() => setActiveViewMode('excel')}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: activeViewMode === 'excel' ? '#0d9488' : (darkMode ? '#1e293b' : '#ffffff'),
                color: activeViewMode === 'excel' ? '#ffffff' : theme.text2,
                border: `1px solid ${activeViewMode === 'excel' ? '#0d9488' : theme.border}`,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              📁 Excel Import
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '8px 14px',
                borderRadius: '50px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bg2,
                color: theme.text,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        {/* Global Alert Message */}
        {msg && (
          <div style={{
            marginBottom: activeViewMode === 'sheet' ? '0' : '20px',
            padding: '14px 20px',
            borderRadius: activeViewMode === 'sheet' ? '0' : '12px',
            backgroundColor: msg.type === 'success' ? (darkMode ? 'rgba(16,185,129,0.15)' : '#f0fdf4') : (darkMode ? 'rgba(239,68,68,0.15)' : '#fef2f2'),
            color: msg.type === 'success' ? (darkMode ? '#34d399' : '#166534') : (darkMode ? '#f87171' : '#991b1b'),
            border: `2px solid ${msg.type === 'success' ? '#34d399' : '#f87171'}`,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 1: FULL SPREADSHEET SHEET ENTRY MODE */}
        {/* ============================================================ */}
        {activeViewMode === 'sheet' && (
          <div style={{ marginBottom: '0' }}>
            
            {/* Sheet Control Bar & Live Stats */}
            <div style={{
              backgroundColor: theme.bg2,
              borderRadius: '0',
              border: 'none',
              borderBottom: `2px solid ${darkMode ? 'rgba(16, 185, 129, 0.4)' : '#10b981'}`,
              boxShadow: theme.shadow,
              padding: '14px 16px',
              marginBottom: '0',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: theme.text2, textTransform: 'uppercase', marginBottom: '4px' }}>
                      📅 Production Date (Applies to All Entries)
                    </label>
                    <input
                      type="date"
                      value={sheetDate}
                      onChange={(e) => setSheetDate(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.inputBorder}`,
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: theme.text2, textTransform: 'uppercase', marginBottom: '4px' }}>
                      🔍 Filter Tyres in Sheet
                    </label>
                    <input
                      type="text"
                      placeholder="Type tyre size/pattern (e.g. 90/90, Legend)..."
                      value={sheetSearchQuery}
                      onChange={(e) => setSheetSearchQuery(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        width: isMobile ? '100%' : '280px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.inputBorder}`,
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Save Sheet Action Button (Sticky Top) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSaveSheet}
                    disabled={savingSheet}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: savingSheet ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {savingSheet ? '⏳ Saving Sheet...' : `💾 Save Sheet (${sheetStats.filledCount} Items)`}
                  </button>
                </div>
              </div>

              {/* Dynamic KPI Live Calculation Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                paddingTop: '16px',
                borderTop: `1px solid ${theme.border}`,
              }}>
                <div style={{ background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>🏭 Total Curing</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>{sheetStats.totalCuring.toLocaleString('en-IN')} pcs</div>
                </div>
                <div style={{ background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>📦 1st Grade Packing</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>+{sheetStats.totalPacking.toLocaleString('en-IN')} pcs</div>
                </div>
                <div style={{ background: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>⚠️ 2nd Grade</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706' }}>{sheetStats.totalSecond.toLocaleString('en-IN')} pcs</div>
                </div>
                <div style={{ background: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>❌ 3rd / Lose</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{(sheetStats.totalThird + sheetStats.totalLose).toLocaleString('en-IN')} pcs</div>
                </div>
                <div style={{ background: darkMode ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase' }}>📝 Active Rows</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7' }}>{sheetStats.filledCount} / {tyres.length}</div>
                </div>
              </div>
            </div>

            {/* Interactive Sheet Table */}
            <div style={{
              backgroundColor: theme.bg2,
              borderRadius: '0',
              border: 'none',
              boxShadow: 'none',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: darkMode ? '#0f172a' : '#0f172a', color: '#ffffff' }}>
                    <tr>
                      <th style={{ padding: '12px 14px', width: '40px' }}>#</th>
                      <th style={{ padding: '12px 14px', minWidth: '220px' }}>Auto Tyre Item & Pattern</th>
                      <th style={{ padding: '12px 14px', width: '120px', backgroundColor: '#1e3a8a' }}>All Curing *</th>
                      <th style={{ padding: '12px 14px', width: '90px' }}>Prod (+)</th>
                      <th style={{ padding: '12px 14px', width: '90px' }}>Repair (+)</th>
                      <th style={{ padding: '12px 14px', width: '90px' }}>2nd (-)</th>
                      <th style={{ padding: '12px 14px', width: '90px' }}>3rd (-)</th>
                      <th style={{ padding: '12px 14px', width: '90px' }}>Lose (-)</th>
                      <th style={{ padding: '12px 14px', width: '130px', textAlign: 'center', backgroundColor: '#065f46' }}>Net Packing</th>
                      <th style={{ padding: '12px 14px', width: '100px' }}>Weight (kg)</th>
                      <th style={{ padding: '12px 14px', minWidth: '150px' }}>Remark / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTyresForSheet.map((t, idx) => {
                      const row = sheetEntries[t.id] || {};
                      const rowCuring = parseInt(row.all_curing || 0);
                      const rowPacking = calculateRowPacking(row);
                      const isFilled = rowCuring > 0;

                      return (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: `1px solid ${theme.border}`,
                            backgroundColor: isFilled ? theme.activeRowBg : (idx % 2 === 0 ? theme.bg2 : theme.bg3),
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: theme.text2 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 800, color: theme.text, fontSize: '0.9rem' }}>
                              {t.tyre} <span style={{ color: '#2563eb' }}>{t.pattern}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: theme.text2, display: 'flex', gap: '8px', marginTop: '2px' }}>
                              <span>Type: <strong>{t.type}</strong></span>
                              <span>•</span>
                              <span>Curr Stock: <strong style={{ color: '#10b981' }}>{t.stock} pcs</strong></span>
                            </div>
                          </td>

                          {/* All Curing Input */}
                          <td style={{ padding: '6px 10px', backgroundColor: isFilled ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}>
                            <input
                              type="number"
                              placeholder="0"
                              value={row.all_curing || ''}
                              onChange={(e) => handleSheetFieldChange(t.id, 'all_curing', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: `2px solid ${isFilled ? '#2563eb' : theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: theme.text,
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* Production Tyre (+) */}
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              value={row.production_tyre || '0'}
                              onChange={(e) => handleSheetFieldChange(t.id, 'production_tyre', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: theme.text,
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* Repair (+) */}
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              value={row.repair || '0'}
                              onChange={(e) => handleSheetFieldChange(t.id, 'repair', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: theme.text,
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* 2nd Grade (-) */}
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              value={row.second_grade || '0'}
                              onChange={(e) => handleSheetFieldChange(t.id, 'second_grade', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: '#d97706',
                                fontWeight: 700,
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* 3rd Grade (-) */}
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              value={row.third_grade || '0'}
                              onChange={(e) => handleSheetFieldChange(t.id, 'third_grade', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: '#ef4444',
                                fontWeight: 700,
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* Lose Tyre (-) */}
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              value={row.lose_tyre || '0'}
                              onChange={(e) => handleSheetFieldChange(t.id, 'lose_tyre', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: '#ef4444',
                                fontWeight: 700,
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* Net Packing Calculated Stock */}
                          <td style={{ padding: '10px 14px', textAlign: 'center', backgroundColor: isFilled ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: rowPacking > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                              color: rowPacking > 0 ? '#10b981' : theme.text2,
                              fontWeight: 800,
                              fontSize: '0.95rem',
                            }}>
                              {rowPacking > 0 ? `+${rowPacking}` : rowPacking} pcs
                            </span>
                          </td>

                          {/* Actual Weight */}
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              placeholder="kg"
                              value={row.actual_weight || ''}
                              onChange={(e) => handleSheetFieldChange(t.id, 'actual_weight', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: theme.text,
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* Remark */}
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              placeholder="Shift / Remarks..."
                              value={row.remark || ''}
                              onChange={(e) => handleSheetFieldChange(t.id, 'remark', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.inputBorder}`,
                                backgroundColor: theme.inputBg,
                                color: theme.text,
                                outline: 'none',
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {!filteredTyresForSheet.length && (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: theme.text2 }}>
                          No tyres matched your search "{sheetSearchQuery}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div style={{
                position: 'sticky',
                bottom: 0,
                zIndex: 20,
                padding: '12px 20px',
                backgroundColor: theme.bg2,
                borderTop: `2px solid ${darkMode ? 'rgba(16, 185, 129, 0.4)' : '#10b981'}`,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ fontSize: '0.85rem', color: theme.text2 }}>
                  Showing <strong>{filteredTyresForSheet.length}</strong> tyres | Filled: <strong style={{ color: '#10b981' }}>{sheetStats.filledCount}</strong> entries
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      if (confirm('Kya aap saari sheet clear karna chahte hain?')) {
                        const reset = {};
                        tyres.forEach((t) => {
                          reset[t.id] = { all_curing: '', production_tyre: '0', repair: '0', second_grade: '0', third_grade: '0', lose_tyre: '0', actual_weight: '', remark: '' };
                        });
                        setSheetEntries(reset);
                      }
                    }}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: darkMode ? '#1e293b' : '#e2e8f0',
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🧹 Clear Sheet
                  </button>

                  <button
                    onClick={handleSaveSheet}
                    disabled={savingSheet}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: savingSheet ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {savingSheet ? '⏳ Saving...' : `💾 Save Sheet (${sheetStats.filledCount} Entries)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: EXCEL IMPORT CARD */}
        {/* ============================================================ */}
        {activeViewMode === 'excel' && (
          <div style={{
            backgroundColor: theme.bg2,
            borderRadius: '16px',
            boxShadow: theme.shadow,
            border: `2px solid ${theme.border}`,
            padding: isMobile ? '16px' : '24px',
            marginBottom: '24px',
            borderLeft: `6px solid #0d9488`,
          }}>
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
        )}

        {/* ============================================================ */}
        {/* VIEW 3: SINGLE PRODUCTION ENTRY (WITH SEARCHABLE COMBOBOX) */}
        {/* ============================================================ */}
        {activeViewMode === 'single' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
            
            {/* Form Box */}
            <div style={{
              backgroundColor: theme.bg2,
              borderRadius: '16px',
              boxShadow: theme.shadow,
              border: `2px solid ${theme.border}`,
              padding: isMobile ? '16px' : '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: theme.text, fontSize: '1.2rem', fontWeight: 700 }}>
                  ➕ Single Production Entry
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveViewMode('sheet')}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Switch to Sheet Mode →
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                
                {/* Searchable Tyre Dropdown Combobox */}
                <div style={{ marginBottom: '16px', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: theme.text, marginBottom: '6px' }}>
                    🚗 Select Auto Tyre (Active Search) *
                  </label>

                  {/* Active Selected Card / Search Trigger */}
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `2px solid ${isDropdownOpen ? '#2563eb' : theme.inputBorder}`,
                      borderRadius: '10px',
                      backgroundColor: theme.inputBg,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {selectedTyreObject ? (
                      <div>
                        <div style={{ fontWeight: 800, color: theme.text, fontSize: '0.95rem' }}>
                          {selectedTyreObject.tyre} <span style={{ color: '#2563eb' }}>{selectedTyreObject.pattern}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: theme.text2 }}>
                          Type: {selectedTyreObject.type} | Stock: <strong style={{ color: '#10b981' }}>{selectedTyreObject.stock} pcs</strong>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: theme.text2, fontSize: '0.9rem' }}>-- Click to Search / Select Tyre --</span>
                    )}

                    <span style={{ color: theme.text2, fontSize: '0.8rem' }}>{isDropdownOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Searchable Dropdown Menu Popover */}
                  {isDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      marginTop: '6px',
                      backgroundColor: theme.bg2,
                      border: `2px solid #2563eb`,
                      borderRadius: '12px',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                      overflow: 'hidden',
                    }}>
                      {/* Search Input */}
                      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bg3 }}>
                        <input
                          type="text"
                          placeholder="Type tyre name, size, pattern (e.g. 90/90, Legend)..."
                          value={tyreSearchQuery}
                          onChange={(e) => setTyreSearchQuery(e.target.value)}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.inputBorder}`,
                            backgroundColor: theme.inputBg,
                            color: theme.text,
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Filtered Options List */}
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {filteredTyresForDropdown.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setForm({ ...form, tyre_item: t.id });
                              setIsDropdownOpen(false);
                              setTyreSearchQuery('');
                            }}
                            style={{
                              padding: '10px 14px',
                              borderBottom: `1px solid ${theme.border}`,
                              cursor: 'pointer',
                              backgroundColor: String(form.tyre_item) === String(t.id) ? (darkMode ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff') : 'transparent',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: theme.text, fontSize: '0.875rem' }}>
                                {t.tyre} <span style={{ color: '#2563eb' }}>{t.pattern}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: theme.text2 }}>
                                Type: {t.type}
                              </div>
                            </div>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#f0fdf4',
                              color: '#10b981',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}>
                              Stock: {t.stock}
                            </span>
                          </div>
                        ))}

                        {!filteredTyresForDropdown.length && (
                          <div style={{ padding: '16px', textAlign: 'center', color: theme.text2, fontSize: '0.85rem' }}>
                            No tyres found matching "{tyreSearchQuery}".
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>📅 Date *</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required style={{ width: '100%', padding: '10px 14px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>🏭 All Curing *</label>
                    <input type="number" name="all_curing" value={form.all_curing} onChange={handleChange} required placeholder="e.g. 100" style={{ width: '100%', padding: '10px 14px', border: `2px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem', fontWeight: 700 }} />
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
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: theme.text }}>Weight (kg)</label>
                    <input type="text" name="actual_weight" placeholder="e.g. 7.5" value={form.actual_weight} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.bg, color: theme.text }} />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>Remark / Notes</label>
                  <input type="text" name="remark" placeholder="Shift or batch notes..." value={form.remark} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.bg, color: theme.text, fontSize: '0.85rem' }} />
                </div>

                <div style={{ backgroundColor: darkMode ? 'rgba(13,148,136,0.1)' : '#ccfbf1', padding: '12px 16px', borderRadius: '10px', border: `2px solid #0d9488`, marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0d9488', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Calculated 1st Grade Packing:</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>+{calculatePacking()} pcs</span>
                  </span>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Saving...' : '💾 Save Single Entry'}
                </button>
              </form>
            </div>

            {/* Recent Entries Table */}
            <div style={{
              backgroundColor: theme.bg2,
              borderRadius: '16px',
              boxShadow: theme.shadow,
              border: `2px solid ${theme.border}`,
              padding: isMobile ? '16px' : '24px',
            }}>
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
        )}

      </div>
    </div>
  );
}
