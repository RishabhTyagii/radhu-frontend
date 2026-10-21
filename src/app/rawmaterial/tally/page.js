'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ─── Color Palette & Clean Styles (Strictly No Icons) ─────────────────────────
const C = {
  bg: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  borderDark: '#cbd5e1',
  text: '#0f172a',
  textMuted: '#334155',
  textLight: '#64748b',
  textSubtle: '#94a3b8',
  primary: '#1d4ed8',
  primaryHover: '#1e40af',
  primarySoft: '#eff6ff',
  green: '#15803d',
  greenSoft: '#dcfce7',
  red: '#b91c1c',
  redSoft: '#fee2e2',
  amber: '#b45309',
  amberSoft: '#fef3c7',
  purple: '#6d28d9',
  purpleSoft: '#f5f3ff',
  slateDark: '#0f172a',
  slateLight: '#f8fafc',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: `1.5px solid ${C.border}`,
  fontSize: '0.875rem',
  color: C.text,
  background: C.white,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: C.textLight,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const cardStyle = {
  background: C.white,
  borderRadius: '10px',
  border: `1px solid ${C.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const thStyle = {
  padding: '12px 16px',
  fontSize: '0.72rem',
  fontWeight: 800,
  color: '#f8fafc',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: C.slateDark,
  whiteSpace: 'nowrap',
  textAlign: 'left',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.85rem',
  color: C.textMuted,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
};

const chipStyle = (bg, clr) => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: '14px',
  background: bg,
  color: clr,
  fontSize: '0.7rem',
  fontWeight: 800,
  letterSpacing: '0.03em',
});

const TABS = [
  { id: 'ledger', label: 'Stock Ledger' },
  { id: 'stock', label: 'Current Stock' },
  { id: 'entry', label: 'New Stock Entry' },
  { id: 'setup', label: 'Master Setup' },
];

export default function RawMaterialTallyPage() {
  const [tab, setTab] = useState('ledger');
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [entries, setEntries] = useState([]);
  const [currentStock, setCurrentStock] = useState([]);
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters for ledger
  const [filterMat, setFilterMat] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // New Entry form
  const [entryForm, setEntryForm] = useState({
    material_id: '',
    date: new Date().toISOString().slice(0, 10),
    received_quantity: '',
    used_quantity: '',
    received_by: '',
  });
  const [savingEntry, setSavingEntry] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState(null);

  // Setup forms
  const [groupName, setGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [matForm, setMatForm] = useState({
    name: '',
    group_id: '',
    unit: 'Kg',
    minimum_stock: '',
  });
  const [savingMat, setSavingMat] = useState(false);
  const [searchMaterial, setSearchMaterial] = useState('');

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch Initial Data ───────────────────────────────────────────────────────
  const fetchBaseData = useCallback(async () => {
    setLoadingBase(true);
    try {
      const [g, m, cs] = await Promise.all([
        apiGet('/rawmaterial/groups/'),
        apiGet('/rawmaterial/materials/'),
        apiGet('/rawmaterial/current-stock/'),
      ]);
      if (Array.isArray(g)) setGroups(g);
      if (Array.isArray(m)) setMaterials(m);
      if (Array.isArray(cs)) setCurrentStock(cs);
    } catch (e) {
      console.error('Error fetching base data:', e);
    } finally {
      setLoadingBase(false);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    setLoadingLedger(true);
    try {
      let url = '/rawmaterial/stock-entries/?';
      if (filterMat) url += `material_id=${filterMat}&`;
      if (filterFrom) url += `from_date=${filterFrom}&`;
      if (filterTo) url += `to_date=${filterTo}&`;
      const res = await apiGet(url);
      if (Array.isArray(res)) setEntries(res);
    } catch (e) {
      console.error('Error fetching ledger:', e);
    } finally {
      setLoadingLedger(false);
    }
  }, [filterMat, filterFrom, filterTo]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  useEffect(() => {
    if (tab === 'ledger' || tab === 'entry') {
      fetchLedger();
    }
  }, [tab, fetchLedger]);

  // Update opening preview on material selection
  useEffect(() => {
    if (!entryForm.material_id) {
      setSelectedMaterialInfo(null);
      return;
    }
    const mat = materials.find((m) => String(m.id) === String(entryForm.material_id));
    if (!mat) {
      setSelectedMaterialInfo(null);
      return;
    }

    let closingStock = 0;
    currentStock.forEach((g) => {
      const found = g.materials?.find((mm) => mm.material_id === mat.id);
      if (found) closingStock = found.closing_stock;
    });

    setSelectedMaterialInfo({
      id: mat.id,
      name: mat.name,
      group: mat.group_name,
      unit: mat.unit,
      currentClosing: closingStock,
    });
  }, [entryForm.material_id, materials, currentStock]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // 1. Add Group
  async function handleAddGroup(e) {
    e.preventDefault();
    const cleanName = groupName.trim();
    if (!cleanName) {
      showToast('error', 'Group name cannot be empty');
      return;
    }
    setSavingGroup(true);
    const res = await apiPost('/rawmaterial/groups/', { name: cleanName });
    setSavingGroup(false);

    if (res && res.ok) {
      showToast('success', `Group "${res.data?.name || cleanName}" added successfully`);
      setGroupName('');
      fetchBaseData();
    } else {
      const errMsg = res?.data?.error || res?.data?.detail || 'Failed to add group';
      showToast('error', errMsg);
    }
  }

  // 2. Delete Group
  async function handleDeleteGroup(id, name) {
    if (!confirm(`Are you sure you want to delete group "${name}"? All raw materials inside will be deleted.`)) {
      return;
    }
    const res = await apiDelete(`/rawmaterial/groups/${id}/`);
    if (res && res.ok) {
      showToast('success', `Group "${name}" deleted`);
      fetchBaseData();
    } else {
      showToast('error', res?.data?.error || 'Failed to delete group');
    }
  }

  // 3. Add Material
  async function handleAddMaterial(e) {
    e.preventDefault();
    const cleanName = matForm.name.trim();
    if (!cleanName) {
      showToast('error', 'Material name is required');
      return;
    }
    if (!matForm.group_id) {
      showToast('error', 'Please select a material group');
      return;
    }

    setSavingMat(true);
    const res = await apiPost('/rawmaterial/materials/', {
      name: cleanName,
      group_id: matForm.group_id,
      unit: matForm.unit || 'Kg',
      minimum_stock: matForm.minimum_stock || 0,
    });
    setSavingMat(false);

    if (res && res.ok) {
      showToast('success', `Material "${res.data?.name || cleanName}" added successfully`);
      setMatForm((p) => ({ ...p, name: '', minimum_stock: '' }));
      fetchBaseData();
    } else {
      showToast('error', res?.data?.error || res?.data?.detail || 'Failed to add material');
    }
  }

  // 4. Delete Material
  async function handleDeleteMaterial(id, name) {
    if (!confirm(`Are you sure you want to delete material "${name}"?`)) return;
    const res = await apiDelete(`/rawmaterial/materials/${id}/`);
    if (res && res.ok) {
      showToast('success', `Material "${name}" deleted`);
      fetchBaseData();
    } else {
      showToast('error', res?.data?.error || 'Failed to delete material');
    }
  }

  // 5. Submit Stock Entry
  async function handleEntrySubmit(e) {
    e.preventDefault();
    if (!entryForm.material_id) {
      showToast('error', 'Please select a material');
      return;
    }
    if (!entryForm.date) {
      showToast('error', 'Please select date');
      return;
    }

    setSavingEntry(true);
    const payload = {
      material_id: entryForm.material_id,
      date: entryForm.date,
      received_quantity: entryForm.received_quantity || 0,
      used_quantity: entryForm.used_quantity || 0,
      received_by: entryForm.received_by || '',
    };

    const res = await apiPost('/rawmaterial/stock-entries/', payload);
    setSavingEntry(false);

    if (res && res.ok) {
      showToast('success', `Stock entry recorded. Closing balance: ${res.data?.closing} ${res.data?.unit || ''}`);
      setEntryForm((p) => ({
        ...p,
        received_quantity: '',
        used_quantity: '',
        received_by: '',
      }));
      fetchBaseData();
      fetchLedger();
    } else {
      showToast('error', res?.data?.error || res?.data?.detail || 'Failed to save entry');
    }
  }

  // 6. Delete Stock Entry
  async function handleDeleteEntry(id) {
    if (!confirm('Are you sure you want to delete this stock entry?')) return;
    const res = await apiDelete(`/rawmaterial/stock-entries/${id}/`);
    if (res && res.ok) {
      showToast('success', 'Stock entry deleted');
      fetchLedger();
      fetchBaseData();
    } else {
      showToast('error', res?.data?.error || 'Failed to delete entry');
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const recvVal = parseFloat(entryForm.received_quantity) || 0;
  const usedVal = parseFloat(entryForm.used_quantity) || 0;
  const openingVal = selectedMaterialInfo ? selectedMaterialInfo.currentClosing : 0;
  const calculatedClosing = openingVal + recvVal - usedVal;

  // Stats calculation
  let lowStockCount = 0;
  let outOfStockCount = 0;
  currentStock.forEach((g) => {
    g.materials?.forEach((m) => {
      if (m.closing_stock <= 0) outOfStockCount++;
      else if (m.is_low) lowStockCount++;
    });
  });

  return (
    <>
      <Navbar />

      {/* Edge-to-Edge Full Screen Layout */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          minHeight: '100vh',
          background: C.bg,
          padding: '20px 24px',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      >
        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '24px',
              zIndex: 9999,
              padding: '14px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              background: toast.type === 'success' ? C.greenSoft : C.redSoft,
              color: toast.type === 'success' ? C.green : C.red,
              border: `1.5px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              maxWidth: '420px',
            }}
          >
            {toast.text}
          </div>
        )}

        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                color: C.text,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Raw Material Tally Cards
            </h1>
            <p style={{ color: C.textLight, margin: '4px 0 0', fontSize: '0.85rem' }}>
              Full Stock Ledger with Opening, Inward, Consumption and Closing Balances
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => {
                fetchBaseData();
                if (tab === 'ledger') fetchLedger();
                showToast('success', 'Data refreshed');
              }}
              style={{
                padding: '8px 16px',
                background: C.white,
                color: C.textMuted,
                border: `1.5px solid ${C.border}`,
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Bar (Full Width) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          {[
            { label: 'Material Groups', value: groups.length, color: C.primary, note: 'Categories configured' },
            { label: 'Total Raw Materials', value: materials.length, color: C.purple, note: 'Tracked inventory items' },
            { label: 'Low Stock Items', value: lowStockCount, color: C.amber, note: 'Below threshold' },
            { label: 'Out of Stock Items', value: outOfStockCount, color: C.red, note: 'Immediate replenishment' },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                ...cardStyle,
                padding: '16px 20px',
                borderLeft: `4px solid ${k.color}`,
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>
                {k.label}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: k.color, marginTop: '2px' }}>
                {k.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: C.textSubtle, marginTop: '3px' }}>{k.note}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: C.white,
            padding: '4px',
            borderRadius: '8px',
            border: `1px solid ${C.border}`,
            width: 'fit-content',
            marginBottom: '18px',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: tab === t.id ? C.slateDark : 'transparent',
                color: tab === t.id ? '#ffffff' : C.textLight,
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: STOCK LEDGER                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'ledger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Filter Bar */}
            <div style={{ ...cardStyle, padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ minWidth: '240px', flex: 1 }}>
                  <label style={labelStyle}>Filter by Material</label>
                  <select
                    style={inputStyle}
                    value={filterMat}
                    onChange={(e) => setFilterMat(e.target.value)}
                  >
                    <option value="">All Materials</option>
                    {groups.map((g) => (
                      <optgroup key={g.id} label={g.name}>
                        {materials
                          .filter((m) => m.group_id === g.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.unit})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '160px' }}>
                  <label style={labelStyle}>From Date</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                  />
                </div>

                <div style={{ minWidth: '160px' }}>
                  <label style={labelStyle}>To Date</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={fetchLedger}
                    style={{
                      padding: '10px 20px',
                      background: C.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      setFilterMat('');
                      setFilterFrom('');
                      setFilterTo('');
                    }}
                    style={{
                      padding: '10px 16px',
                      background: '#f1f5f9',
                      color: C.textMuted,
                      border: `1px solid ${C.border}`,
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Table Card (Full Edge to Edge) */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>
                  Transaction Entries
                </div>
                <span style={chipStyle('#f1f5f9', C.textLight)}>{entries.length} records</span>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Group</th>
                      <th style={thStyle}>Material</th>
                      <th style={thStyle}>Unit</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Opening</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Received (+)</th>
                      <th style={thStyle}>Received By</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Used (-)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Closing</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLedger ? (
                      <tr>
                        <td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: '48px', color: C.textSubtle }}>
                          Loading stock records...
                        </td>
                      </tr>
                    ) : entries.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: '56px', color: C.textSubtle }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: C.textLight, marginBottom: '4px' }}>
                            No entries found
                          </div>
                          <div style={{ fontSize: '0.8rem' }}>
                            Use the &quot;New Stock Entry&quot; tab to record inward or consumption.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      entries.map((e, idx) => {
                        const isToday = e.date === todayStr;
                        const rowBg = isToday ? '#faf5ff' : idx % 2 === 0 ? C.white : C.slateLight;
                        const borderLeft = isToday ? `4px solid ${C.purple}` : `4px solid transparent`;

                        return (
                          <tr key={e.id} style={{ background: rowBg, borderLeft }}>
                            <td style={{ ...tdStyle, fontWeight: isToday ? 800 : 600, color: isToday ? C.purple : C.textMuted }}>
                              {e.date}
                              {isToday && (
                                <span style={{ ...chipStyle(C.purpleSoft, C.purple), marginLeft: '8px', fontSize: '0.62rem' }}>
                                  TODAY
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, color: C.textLight, fontSize: '0.78rem' }}>
                              {e.group_name}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>
                              {e.material_name}
                            </td>
                            <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.75rem' }}>
                              {e.unit}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.primary }}>
                              {Number(e.opening).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.green }}>
                              {Number(e.received_quantity) > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '0.00'}
                            </td>
                            <td style={{ ...tdStyle, color: C.textLight, fontSize: '0.8rem' }}>
                              {e.received_by || '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.red }}>
                              {Number(e.used_quantity) > 0 ? `-${Number(e.used_quantity).toFixed(2)}` : '0.00'}
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                textAlign: 'right',
                                fontWeight: 900,
                                fontSize: '0.92rem',
                                color: Number(e.closing) < 0 ? C.red : C.text,
                              }}
                            >
                              {Number(e.closing).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteEntry(e.id)}
                                style={{
                                  padding: '4px 10px',
                                  background: C.redSoft,
                                  color: C.red,
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: CURRENT STOCK                                                 */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {loadingBase ? (
              <div style={{ ...cardStyle, padding: '48px', textAlign: 'center', color: C.textSubtle }}>
                Loading current inventory levels...
              </div>
            ) : currentStock.length === 0 ? (
              <div style={{ ...cardStyle, padding: '56px', textAlign: 'center', color: C.textSubtle }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: C.textLight }}>No materials configured</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Go to Master Setup tab to create material categories and materials.
                </div>
              </div>
            ) : (
              currentStock.map((grp) => (
                <div key={grp.group_id} style={{ ...cardStyle, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '12px 20px',
                      background: C.slateDark,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                      {grp.group_name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {grp.materials?.length || 0} items
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, background: '#1e293b' }}>Material Name</th>
                          <th style={{ ...thStyle, background: '#1e293b' }}>Unit</th>
                          <th style={{ ...thStyle, background: '#1e293b', textAlign: 'right' }}>Closing Stock</th>
                          <th style={{ ...thStyle, background: '#1e293b', textAlign: 'right' }}>Min Threshold</th>
                          <th style={{ ...thStyle, background: '#1e293b' }}>Last Transaction</th>
                          <th style={{ ...thStyle, background: '#1e293b', textAlign: 'center' }}>Stock Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!grp.materials || grp.materials.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '24px', color: C.textSubtle }}>
                              No items registered under {grp.group_name}
                            </td>
                          </tr>
                        ) : (
                          grp.materials.map((m, idx) => {
                            const isOut = m.closing_stock <= 0;
                            const isLow = !isOut && m.is_low;
                            const statusChip = isOut
                              ? chipStyle(C.redSoft, C.red)
                              : isLow
                              ? chipStyle(C.amberSoft, C.amber)
                              : chipStyle(C.greenSoft, C.green);
                            const statusText = isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY';
                            const stockColor = isOut ? C.red : isLow ? C.amber : C.green;

                            return (
                              <tr key={m.material_id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                                <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>
                                  {m.material_name}
                                </td>
                                <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.75rem' }}>
                                  {m.unit}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: stockColor }}>
                                  {Number(m.closing_stock).toFixed(2)}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right', color: C.textLight }}>
                                  {m.minimum_stock > 0 ? Number(m.minimum_stock).toFixed(2) : '—'}
                                </td>
                                <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.78rem' }}>
                                  {m.last_entry_date || 'No entries'}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  <span style={statusChip}>{statusText}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: NEW STOCK ENTRY                                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'entry' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(380px, 460px) 1fr',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Entry Form */}
            <div style={cardStyle}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${C.border}`,
                  background: '#fafafa',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>
                  Record Stock Entry
                </div>
                <div style={{ fontSize: '0.75rem', color: C.textLight, marginTop: '2px' }}>
                  Opening balance is automatically loaded from preceding closing balance
                </div>
              </div>

              <form onSubmit={handleEntrySubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Material *</label>
                  <select
                    style={inputStyle}
                    value={entryForm.material_id}
                    onChange={(e) => setEntryForm((p) => ({ ...p, material_id: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Material --</option>
                    {groups.map((g) => (
                      <optgroup key={g.id} label={g.name}>
                        {materials
                          .filter((m) => m.group_id === g.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.unit})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {selectedMaterialInfo && (
                  <div
                    style={{
                      background: C.primarySoft,
                      border: `1px solid #bfdbfe`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.primary }}>
                      Current Closing (Opening Base)
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: C.primary }}>
                      {Number(selectedMaterialInfo.currentClosing).toFixed(2)} {selectedMaterialInfo.unit}
                    </span>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Entry Date *</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={entryForm.date}
                    onChange={(e) => setEntryForm((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ ...labelStyle, color: C.green }}>Received / Inward</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{ ...inputStyle, fontWeight: 700, color: C.green, borderColor: '#86efac' }}
                      value={entryForm.received_quantity}
                      onChange={(e) => setEntryForm((p) => ({ ...p, received_quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: C.red }}>Used / Consumption</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{ ...inputStyle, fontWeight: 700, color: C.red, borderColor: '#fca5a5' }}
                      value={entryForm.used_quantity}
                      onChange={(e) => setEntryForm((p) => ({ ...p, used_quantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Received By / Dispatch Note</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Name of receiver or challan reference"
                    value={entryForm.received_by}
                    onChange={(e) => setEntryForm((p) => ({ ...p, received_by: e.target.value }))}
                  />
                </div>

                {/* Live Math Reconciliation Box */}
                {selectedMaterialInfo && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: `1.5px solid ${C.border}`,
                      borderRadius: '8px',
                      padding: '14px',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', marginBottom: '8px' }}>
                      Reconciliation Calculation
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                      <div style={{ background: C.white, padding: '8px 4px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '0.62rem', color: C.textSubtle, fontWeight: 700 }}>OPENING</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: C.primary, marginTop: '2px' }}>
                          {Number(openingVal).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ background: C.white, padding: '8px 4px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '0.62rem', color: C.green, fontWeight: 700 }}>+ RECV</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: C.green, marginTop: '2px' }}>
                          {Number(recvVal).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ background: C.white, padding: '8px 4px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '0.62rem', color: C.red, fontWeight: 700 }}>- USED</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: C.red, marginTop: '2px' }}>
                          {Number(usedVal).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ background: C.white, padding: '8px 4px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: '0.62rem', color: C.text, fontWeight: 700 }}>= CLOSING</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: calculatedClosing < 0 ? C.red : C.text, marginTop: '2px' }}>
                          {Number(calculatedClosing).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingEntry}
                  style={{
                    padding: '12px',
                    background: savingEntry ? C.textSubtle : C.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: savingEntry ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {savingEntry ? 'Saving Entry...' : 'Save Stock Entry'}
                </button>
              </form>
            </div>

            {/* Right Column: Today's Registered Entries */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${C.border}`,
                  background: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>
                    Entries for Today
                  </div>
                  <div style={{ fontSize: '0.75rem', color: C.textLight }}>{todayStr}</div>
                </div>
                <button
                  onClick={fetchLedger}
                  style={{
                    padding: '5px 12px',
                    background: C.white,
                    border: `1px solid ${C.border}`,
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reload
                </button>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Material</th>
                      <th style={thStyle}>Group</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Opening</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Received</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Used</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Closing</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const todayList = entries.filter((e) => e.date === todayStr);
                      if (todayList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: C.textSubtle }}>
                              No transactions recorded for today yet.
                            </td>
                          </tr>
                        );
                      }
                      return todayList.map((e, idx) => (
                        <tr key={e.id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{e.material_name}</td>
                          <td style={{ ...tdStyle, color: C.textLight, fontSize: '0.78rem' }}>{e.group_name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: C.primary }}>{Number(e.opening).toFixed(2)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: C.green, fontWeight: 700 }}>
                            {Number(e.received_quantity) > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '0.00'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: C.red, fontWeight: 700 }}>
                            {Number(e.used_quantity) > 0 ? `-${Number(e.used_quantity).toFixed(2)}` : '0.00'}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              textAlign: 'right',
                              fontWeight: 900,
                              color: Number(e.closing) < 0 ? C.red : C.text,
                            }}
                          >
                            {Number(e.closing).toFixed(2)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteEntry(e.id)}
                              style={{
                                padding: '3px 8px',
                                background: C.redSoft,
                                color: C.red,
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: MASTER SETUP                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'setup' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 420px) 1fr',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Material Groups Management */}
            <div style={cardStyle}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${C.border}`,
                  background: '#fafafa',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>
                  Material Categories / Groups
                </div>
                <div style={{ fontSize: '0.75rem', color: C.textLight, marginTop: '2px' }}>
                  E.g. Rubber, Compounds, Chemicals, Carbon Black
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Enter group name..."
                    style={{ ...inputStyle, flex: 1 }}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={savingGroup}
                    style={{
                      padding: '10px 18px',
                      background: savingGroup ? C.textSubtle : C.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: savingGroup ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {savingGroup ? 'Adding...' : 'Add Group'}
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {groups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px', color: C.textSubtle, fontSize: '0.85rem' }}>
                      No categories found. Add your first group above.
                    </div>
                  ) : (
                    groups.map((g) => {
                      const count = materials.filter((m) => m.group_id === g.id).length;
                      return (
                        <div
                          key={g.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            background: C.slateLight,
                            borderRadius: '8px',
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: C.text, fontSize: '0.875rem' }}>
                              {g.name}
                            </span>
                            <span style={{ ...chipStyle(C.primarySoft, C.primary), marginLeft: '10px' }}>
                              {count} {count === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteGroup(g.id, g.name)}
                            style={{
                              padding: '4px 10px',
                              background: C.redSoft,
                              color: C.red,
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Materials Master */}
            <div style={cardStyle}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${C.border}`,
                  background: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>
                    Raw Materials Master Directory
                  </div>
                  <div style={{ fontSize: '0.75rem', color: C.textLight, marginTop: '2px' }}>
                    Configure specific materials and set minimum stock trigger levels
                  </div>
                </div>
                <div style={{ width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search material..."
                    style={{ ...inputStyle, padding: '7px 12px', fontSize: '0.8rem' }}
                    value={searchMaterial}
                    onChange={(e) => setSearchMaterial(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Add Material Inline Form */}
                <form
                  onSubmit={handleAddMaterial}
                  style={{
                    background: '#f8fafc',
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>
                    Add New Material
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={labelStyle}>Material Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. RSS-4 Natural Rubber"
                        style={inputStyle}
                        value={matForm.name}
                        onChange={(e) => setMatForm((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Category / Group *</label>
                      <select
                        style={inputStyle}
                        value={matForm.group_id}
                        onChange={(e) => setMatForm((p) => ({ ...p, group_id: e.target.value }))}
                        required
                      >
                        <option value="">-- Select Group --</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Unit</label>
                      <select
                        style={inputStyle}
                        value={matForm.unit}
                        onChange={(e) => setMatForm((p) => ({ ...p, unit: e.target.value }))}
                      >
                        {['Kg', 'Gram', 'Litre', 'Pcs', 'Bundle', 'Bag', 'Drum', 'Meter', 'Ton'].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Min Threshold</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        style={inputStyle}
                        value={matForm.minimum_stock}
                        onChange={(e) => setMatForm((p) => ({ ...p, minimum_stock: e.target.value }))}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingMat}
                      style={{
                        padding: '10px 20px',
                        background: savingMat ? C.textSubtle : C.green,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: savingMat ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        height: '40px',
                      }}
                    >
                      {savingMat ? 'Adding...' : 'Add Material'}
                    </button>
                  </div>
                </form>

                {/* Material Listing Grouped */}
                <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Material Name</th>
                        <th style={thStyle}>Category</th>
                        <th style={thStyle}>Unit</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Min Threshold</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = materials.filter(
                          (m) =>
                            !searchMaterial ||
                            m.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
                            m.group_name.toLowerCase().includes(searchMaterial.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '36px', color: C.textSubtle }}>
                                {materials.length === 0
                                  ? 'No materials registered yet.'
                                  : 'No materials match the search term.'}
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((m, idx) => (
                          <tr key={m.id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{m.name}</td>
                            <td style={{ ...tdStyle, color: C.textLight }}>
                              <span style={chipStyle(C.slateLight, C.textMuted)}>{m.group_name}</span>
                            </td>
                            <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.78rem' }}>{m.unit}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.textMuted }}>
                              {m.minimum_stock > 0 ? `${Number(m.minimum_stock).toFixed(2)} ${m.unit}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteMaterial(m.id, m.name)}
                                style={{
                                  padding: '4px 10px',
                                  background: C.redSoft,
                                  color: C.red,
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
