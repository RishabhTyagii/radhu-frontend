'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ─── Color Tokens & Strict Clean Styling (No Icons) ───────────────────────────
const C = {
  bg: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
  text: '#0f172a',
  textMuted: '#334155',
  textLight: '#64748b',
  textSubtle: '#94a3b8',
  primary: '#1d4ed8',
  primaryDark: '#1e40af',
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
  padding: '9px 12px',
  borderRadius: '6px',
  border: `1.5px solid ${C.border}`,
  fontSize: '0.85rem',
  color: C.text,
  background: C.white,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: C.textLight,
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const cardStyle = {
  background: C.white,
  borderRadius: '8px',
  border: `1px solid ${C.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const thStyle = {
  padding: '11px 14px',
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
  padding: '10px 14px',
  fontSize: '0.84rem',
  color: C.textMuted,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
};

const chipStyle = (bg, clr) => ({
  display: 'inline-block',
  padding: '3px 9px',
  borderRadius: '12px',
  background: bg,
  color: clr,
  fontSize: '0.68rem',
  fontWeight: 800,
  letterSpacing: '0.03em',
});

const TABS = [
  { id: 'ledger', label: 'Stock Ledger' },
  { id: 'forecast', label: 'Run-Out Forecast' },
  { id: 'bulk', label: 'Bulk Shift Entry' },
  { id: 'passbook', label: 'Material Passbook' },
  { id: 'stock', label: 'Current Stock' },
  { id: 'entry', label: 'Single Entry' },
  { id: 'setup', label: 'Master Setup' },
];

export default function RawMaterialTallyPage() {
  const [tab, setTab] = useState('ledger');
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [entries, setEntries] = useState([]);
  const [currentStockData, setCurrentStockData] = useState({ groups: [], total_valuation: 0 });
  const [forecastData, setForecastData] = useState({ forecast: [], kpis: {} });
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [toast, setToast] = useState(null);

  // Ledger Filter State
  const [filterMat, setFilterMat] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Bulk Shift Entry State
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10));
  const [bulkGroupFilter, setBulkGroupFilter] = useState('');
  const [bulkRows, setBulkRows] = useState([]);
  const [savingBulk, setSavingBulk] = useState(false);

  // Passbook State
  const [selectedPassbookMatId, setSelectedPassbookMatId] = useState('');
  const [passbookData, setPassbookData] = useState(null);
  const [loadingPassbook, setLoadingPassbook] = useState(false);
  const [passbookFrom, setPassbookFrom] = useState('');
  const [passbookTo, setPassbookTo] = useState('');

  // Single Entry Form
  const [entryForm, setEntryForm] = useState({
    material_id: '',
    date: new Date().toISOString().slice(0, 10),
    received_quantity: '',
    used_quantity: '',
    rate_per_unit: '',
    supplier_name: '',
    bill_challan_no: '',
    vehicle_no: '',
    received_by: '',
    notes: '',
  });
  const [savingEntry, setSavingEntry] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState(null);

  // Master Setup Form
  const [groupName, setGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [matForm, setMatForm] = useState({
    name: '',
    group_id: '',
    unit: 'Kg',
    minimum_stock: '',
    standard_rate: '',
    hsn_code: '',
  });
  const [savingMat, setSavingMat] = useState(false);
  const [searchMaterial, setSearchMaterial] = useState('');

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch Initial Master Data ────────────────────────────────────────────────
  const fetchBaseData = useCallback(async () => {
    setLoadingBase(true);
    try {
      const [g, m, cs, fc] = await Promise.all([
        apiGet('/rawmaterial/groups/'),
        apiGet('/rawmaterial/materials/'),
        apiGet('/rawmaterial/current-stock/'),
        apiGet('/rawmaterial/forecast/'),
      ]);
      if (Array.isArray(g)) setGroups(g);
      if (Array.isArray(m)) {
        setMaterials(m);
        if (!selectedPassbookMatId && m.length > 0) {
          setSelectedPassbookMatId(String(m[0].id));
        }
      }
      if (cs && cs.groups) setCurrentStockData(cs);
      if (fc && fc.forecast) setForecastData(fc);
    } catch (e) {
      console.error('Error fetching base data:', e);
    } finally {
      setLoadingBase(false);
    }
  }, [selectedPassbookMatId]);

  // ── Fetch Ledger ─────────────────────────────────────────────────────────────
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

  // ── Fetch Forecast Analytics ─────────────────────────────────────────────────
  const fetchForecast = useCallback(async () => {
    setLoadingForecast(true);
    try {
      const fc = await apiGet('/rawmaterial/forecast/');
      if (fc && fc.forecast) setForecastData(fc);
    } catch (e) {
      console.error('Error fetching forecast:', e);
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  // ── Fetch Material Passbook ──────────────────────────────────────────────────
  const fetchPassbook = useCallback(async (matId) => {
    if (!matId) return;
    setLoadingPassbook(true);
    try {
      let url = `/rawmaterial/materials/${matId}/passbook/?`;
      if (passbookFrom) url += `from_date=${passbookFrom}&`;
      if (passbookTo) url += `to_date=${passbookTo}&`;
      const res = await apiGet(url);
      if (res && res.material) setPassbookData(res);
    } catch (e) {
      console.error('Error fetching passbook:', e);
    } finally {
      setLoadingPassbook(false);
    }
  }, [passbookFrom, passbookTo]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  useEffect(() => {
    if (tab === 'ledger') fetchLedger();
    if (tab === 'forecast') fetchForecast();
    if (tab === 'passbook' && selectedPassbookMatId) fetchPassbook(selectedPassbookMatId);
  }, [tab, fetchLedger, fetchForecast, fetchPassbook, selectedPassbookMatId]);

  // ── Initialize Bulk Shift Table ──────────────────────────────────────────────
  useEffect(() => {
    if (materials.length > 0) {
      const rows = materials
        .filter((m) => !bulkGroupFilter || String(m.group_id) === String(bulkGroupFilter))
        .map((m) => {
          let opening = 0;
          currentStockData.groups.forEach((g) => {
            const found = g.materials?.find((mm) => mm.material_id === m.id);
            if (found) opening = found.closing_stock;
          });
          return {
            material_id: m.id,
            name: m.name,
            group_name: m.group_name,
            unit: m.unit,
            rate_per_unit: m.standard_rate || 0,
            opening: opening,
            received_quantity: '',
            supplier_name: '',
            bill_challan_no: '',
            vehicle_no: '',
            used_quantity: '',
            notes: '',
          };
        });
      setBulkRows(rows);
    }
  }, [materials, bulkGroupFilter, currentStockData]);

  // Update single entry preview info
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
    currentStockData.groups.forEach((g) => {
      const found = g.materials?.find((mm) => mm.material_id === mat.id);
      if (found) closingStock = found.closing_stock;
    });

    setSelectedMaterialInfo({
      id: mat.id,
      name: mat.name,
      group: mat.group_name,
      unit: mat.unit,
      standard_rate: mat.standard_rate,
      currentClosing: closingStock,
    });

    if (!entryForm.rate_per_unit && mat.standard_rate) {
      setEntryForm((p) => ({ ...p, rate_per_unit: mat.standard_rate }));
    }
  }, [entryForm.material_id, materials, currentStockData, entryForm.rate_per_unit]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // 1. Bulk Shift Save
  async function handleBulkShiftSubmit(e) {
    e.preventDefault();
    setSavingBulk(true);
    const activeEntries = bulkRows
      .filter((r) => parseFloat(r.received_quantity) > 0 || parseFloat(r.used_quantity) > 0)
      .map((r) => ({
        material_id: r.material_id,
        received_quantity: parseFloat(r.received_quantity) || 0,
        used_quantity: parseFloat(r.used_quantity) || 0,
        rate_per_unit: parseFloat(r.rate_per_unit) || 0,
        supplier_name: r.supplier_name || '',
        bill_challan_no: r.bill_challan_no || '',
        vehicle_no: r.vehicle_no || '',
        notes: r.notes || '',
      }));

    if (activeEntries.length === 0) {
      showToast('error', 'Please enter Received or Used quantities for at least one material.');
      setSavingBulk(false);
      return;
    }

    const res = await apiPost('/rawmaterial/stock-entries/bulk/', {
      date: bulkDate,
      entries: activeEntries,
    });
    setSavingBulk(false);

    if (res && res.ok) {
      showToast('success', `Shift saved! ${res.data?.saved_count || activeEntries.length} items updated for ${bulkDate}`);
      fetchBaseData();
      fetchLedger();
    } else {
      showToast('error', res?.data?.error || 'Failed to save bulk entries');
    }
  }

  // 2. Single Entry Submit
  async function handleSingleEntrySubmit(e) {
    e.preventDefault();
    if (!entryForm.material_id || !entryForm.date) {
      showToast('error', 'Material and Date are required');
      return;
    }
    setSavingEntry(true);
    const payload = {
      material_id: entryForm.material_id,
      date: entryForm.date,
      received_quantity: entryForm.received_quantity || 0,
      used_quantity: entryForm.used_quantity || 0,
      rate_per_unit: entryForm.rate_per_unit || 0,
      supplier_name: entryForm.supplier_name || '',
      bill_challan_no: entryForm.bill_challan_no || '',
      vehicle_no: entryForm.vehicle_no || '',
      received_by: entryForm.received_by || '',
      notes: entryForm.notes || '',
    };
    const res = await apiPost('/rawmaterial/stock-entries/', payload);
    setSavingEntry(false);

    if (res && res.ok) {
      showToast('success', `Entry recorded! Closing: ${res.data?.closing} ${res.data?.unit || ''}`);
      setEntryForm((p) => ({
        ...p,
        received_quantity: '',
        used_quantity: '',
        bill_challan_no: '',
        vehicle_no: '',
        notes: '',
      }));
      fetchBaseData();
      fetchLedger();
    } else {
      showToast('error', res?.data?.error || res?.data?.detail || 'Failed to save entry');
    }
  }

  // 3. Add Group
  async function handleAddGroup(e) {
    e.preventDefault();
    if (!groupName.trim()) return showToast('error', 'Group name required');
    setSavingGroup(true);
    const res = await apiPost('/rawmaterial/groups/', { name: groupName.trim() });
    setSavingGroup(false);
    if (res && res.ok) {
      showToast('success', `Category "${res.data?.name || groupName}" created!`);
      setGroupName('');
      fetchBaseData();
    } else {
      showToast('error', res?.data?.error || 'Failed to add group');
    }
  }

  // 4. Add Material
  async function handleAddMaterial(e) {
    e.preventDefault();
    if (!matForm.name.trim() || !matForm.group_id) {
      showToast('error', 'Name and Group are required');
      return;
    }
    setSavingMat(true);
    const res = await apiPost('/rawmaterial/materials/', {
      name: matForm.name.trim(),
      group_id: matForm.group_id,
      unit: matForm.unit || 'Kg',
      minimum_stock: matForm.minimum_stock || 0,
      standard_rate: matForm.standard_rate || 0,
      hsn_code: matForm.hsn_code || '',
    });
    setSavingMat(false);
    if (res && res.ok) {
      showToast('success', `Material "${res.data?.name}" registered!`);
      setMatForm((p) => ({ ...p, name: '', minimum_stock: '', standard_rate: '', hsn_code: '' }));
      fetchBaseData();
    } else {
      showToast('error', res?.data?.error || 'Failed to add material');
    }
  }

  // 5. Delete Entry
  async function handleDeleteEntry(id) {
    if (!confirm('Are you sure you want to delete this stock entry?')) return;
    const res = await apiDelete(`/rawmaterial/stock-entries/${id}/`);
    if (res && res.ok) {
      showToast('success', 'Entry deleted');
      fetchLedger();
      fetchBaseData();
    } else {
      showToast('error', 'Failed to delete');
    }
  }

  // 6. Delete Material
  async function handleDeleteMaterial(id, name) {
    if (!confirm(`Delete material "${name}"?`)) return;
    const res = await apiDelete(`/rawmaterial/materials/${id}/`);
    if (res && res.ok) {
      showToast('success', 'Material deleted');
      fetchBaseData();
    }
  }

  // 7. Delete Group
  async function handleDeleteGroup(id, name) {
    if (!confirm(`Delete category "${name}" and all materials inside?`)) return;
    const res = await apiDelete(`/rawmaterial/groups/${id}/`);
    if (res && res.ok) {
      showToast('success', 'Category deleted');
      fetchBaseData();
    }
  }

  // Quick jump to passbook from other tabs
  function openPassbookFor(materialId) {
    setSelectedPassbookMatId(String(materialId));
    setTab('passbook');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalValuationFormatted = useMemo(() => {
    const val = currentStockData.total_valuation || 0;
    if (val >= 10000000) return `Rs ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `Rs ${(val / 100000).toFixed(2)} Lakhs`;
    return `Rs ${val.toLocaleString()}`;
  }, [currentStockData]);

  return (
    <>
      <Navbar />

      {/* Edge-to-Edge Container (Strict UI rule: Full width, zero maxWidth pinch) */}
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
        {/* Floating Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '24px',
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
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

        {/* Page Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '18px',
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
              Raw Material Inventory & Tally Cards
            </h1>
            <p style={{ color: C.textLight, margin: '3px 0 0', fontSize: '0.85rem' }}>
              Inward Costing • Run-Out Forecast • Daily Bulk Shift Entry • Material Passbook
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                fetchBaseData();
                if (tab === 'ledger') fetchLedger();
                if (tab === 'forecast') fetchForecast();
                if (tab === 'passbook') fetchPassbook(selectedPassbookMatId);
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

        {/* KPI Banner (Live Valuation + Run-out alerts) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            marginBottom: '18px',
          }}
        >
          <div style={{ ...cardStyle, padding: '16px 20px', borderLeft: `4px solid ${C.green}` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>
              Plant Stock Valuation
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: C.green, marginTop: '2px' }}>
              {totalValuationFormatted}
            </div>
            <div style={{ fontSize: '0.7rem', color: C.textSubtle, marginTop: '2px' }}>
              Closing balance × unit rate
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '16px 20px', borderLeft: `4px solid ${C.red}` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>
              Critical Run-Out Items
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: C.red, marginTop: '2px' }}>
              {forecastData.kpis?.critical_count || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: C.textSubtle, marginTop: '2px' }}>
              Under 7 days stock or below min
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '16px 20px', borderLeft: `4px solid ${C.amber}` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>
              Low Buffer Items
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: C.amber, marginTop: '2px' }}>
              {forecastData.kpis?.low_count || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: C.textSubtle, marginTop: '2px' }}>
              Between 7 to 15 days supply
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '16px 20px', borderLeft: `4px solid ${C.primary}` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>
              Tracked Materials
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: C.primary, marginTop: '2px' }}>
              {materials.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: C.textSubtle, marginTop: '2px' }}>
              Across {groups.length} categories
            </div>
          </div>
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
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 18px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Filter Bar */}
            <div style={{ ...cardStyle, padding: '14px 18px' }}>
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

                <div style={{ minWidth: '150px' }}>
                  <label style={labelStyle}>From Date</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                  />
                </div>

                <div style={{ minWidth: '150px' }}>
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
                      padding: '9px 18px',
                      background: C.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setFilterMat('');
                      setFilterFrom('');
                      setFilterTo('');
                    }}
                    style={{
                      padding: '9px 14px',
                      background: '#f1f5f9',
                      color: C.textMuted,
                      border: `1px solid ${C.border}`,
                      borderRadius: '6px',
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

            {/* Ledger Table */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 18px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: C.text }}>
                  Tally Transaction Ledger
                </div>
                <span style={chipStyle('#f1f5f9', C.textLight)}>{entries.length} records</span>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Material</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Opening</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Received (+)</th>
                      <th style={thStyle}>Supplier / Challan</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Rate (Rs)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Cost (Rs)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Used (-)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Closing Balance</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Passbook</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLedger ? (
                      <tr>
                        <td colSpan={12} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: C.textSubtle }}>
                          Loading transaction records...
                        </td>
                      </tr>
                    ) : entries.length === 0 ? (
                      <tr>
                        <td colSpan={12} style={{ ...tdStyle, textAlign: 'center', padding: '48px', color: C.textSubtle }}>
                          No entries found for selected filter criteria.
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
                                <span style={{ ...chipStyle(C.purpleSoft, C.purple), marginLeft: '6px', fontSize: '0.6rem' }}>
                                  TODAY
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '0.75rem', color: C.textLight }}>
                              {e.group_name}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>
                              {e.material_name}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.primary }}>
                              {Number(e.opening).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.green }}>
                              {Number(e.received_quantity) > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '0.00'}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '0.78rem' }}>
                              {e.supplier_name ? (
                                <div>
                                  <div style={{ fontWeight: 700, color: C.text }}>{e.supplier_name}</div>
                                  {e.bill_challan_no && (
                                    <div style={{ color: C.textSubtle, fontSize: '0.7rem' }}>Challan: {e.bill_challan_no}</div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: C.textSubtle }}>—</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: C.textLight }}>
                              {e.rate_per_unit > 0 ? Number(e.rate_per_unit).toFixed(2) : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.green }}>
                              {e.total_cost > 0 ? `Rs ${Number(e.total_cost).toLocaleString()}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.red }}>
                              {Number(e.used_quantity) > 0 ? `-${Number(e.used_quantity).toFixed(2)}` : '0.00'}
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                textAlign: 'right',
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                color: Number(e.closing) < 0 ? C.red : C.text,
                              }}
                            >
                              {Number(e.closing).toFixed(2)} {e.unit}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(e.material_id)}
                                style={{
                                  padding: '3px 8px',
                                  background: C.primarySoft,
                                  color: C.primary,
                                  border: `1px solid #bfdbfe`,
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                View
                              </button>
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
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Del
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
        {/* TAB 2: RUN-OUT FORECAST & DAYS OF INVENTORY                          */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'forecast' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>
                    Stock Depletion & Days-of-Inventory Forecaster
                  </div>
                  <div style={{ fontSize: '0.75rem', color: C.textLight }}>
                    Calculated from actual 30-day factory consumption velocity (used per day)
                  </div>
                </div>
                <button
                  onClick={fetchForecast}
                  style={{
                    padding: '6px 14px',
                    background: C.white,
                    border: `1px solid ${C.border}`,
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Recalculate
                </button>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1050px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Material Name</th>
                      <th style={thStyle}>Category</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Current Stock</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>30d Usage</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Burn Rate (Qty/Day)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Days Left</th>
                      <th style={thStyle}>Est. Run-Out Date</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Health Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Suggested Reorder</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Inventory Value</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingForecast ? (
                      <tr>
                        <td colSpan={11} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: C.textSubtle }}>
                          Calculating predictive analytics...
                        </td>
                      </tr>
                    ) : forecastData.forecast?.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: C.textSubtle }}>
                          No materials available for forecasting.
                        </td>
                      </tr>
                    ) : (
                      forecastData.forecast.map((f, idx) => {
                        const statusChip = chipStyle(
                          f.status === 'OUT OF STOCK' || f.status === 'CRITICAL'
                            ? C.redSoft
                            : f.status === 'LOW BUFFER'
                            ? C.amberSoft
                            : f.status === 'OVERSTOCKED'
                            ? C.primarySoft
                            : C.greenSoft,
                          f.status_color
                        );

                        return (
                          <tr key={f.material_id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{f.material_name}</td>
                            <td style={{ ...tdStyle, fontSize: '0.78rem', color: C.textLight }}>{f.group_name}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.text }}>
                              {Number(f.closing_stock).toFixed(2)} {f.unit}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: C.textMuted }}>
                              {Number(f.consumption_30d).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.red }}>
                              {f.daily_velocity} {f.unit}/day
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                textAlign: 'right',
                                fontWeight: 900,
                                fontSize: '0.95rem',
                                color: f.days_left !== null && f.days_left <= 7 ? C.red : f.days_left <= 15 ? C.amber : C.green,
                              }}
                            >
                              {f.days_left !== null ? `${f.days_left} Days` : '365+ Days'}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: C.textMuted, fontSize: '0.8rem' }}>
                              {f.run_out_date}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span style={statusChip}>{f.status}</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: f.recommended_reorder > 0 ? C.red : C.textSubtle }}>
                              {f.recommended_reorder > 0 ? `+${f.recommended_reorder.toLocaleString()} ${f.unit}` : 'Adequate'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.green }}>
                              Rs {Number(f.valuation).toLocaleString()}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(f.material_id)}
                                style={{
                                  padding: '3px 8px',
                                  background: C.white,
                                  border: `1px solid ${C.borderDark}`,
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Passbook
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
        {/* TAB 3: BULK SHIFT ENTRY (Spreadsheet Grid View)                     */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'bulk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header Settings Bar */}
            <div style={{ ...cardStyle, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: '180px' }}>
                    <label style={labelStyle}>Shift Entry Date *</label>
                    <input
                      type="date"
                      style={inputStyle}
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                    />
                  </div>

                  <div style={{ minWidth: '220px' }}>
                    <label style={labelStyle}>Filter Category</label>
                    <select
                      style={inputStyle}
                      value={bulkGroupFilter}
                      onChange={(e) => setBulkGroupFilter(e.target.value)}
                    >
                      <option value="">All Categories ({materials.length} items)</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleBulkShiftSubmit}
                  disabled={savingBulk}
                  style={{
                    padding: '11px 24px',
                    background: savingBulk ? C.textSubtle : C.green,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: savingBulk ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingBulk ? 'Saving Entire Shift...' : 'Save Entire Shift Entries'}
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '220px' }}>Material Name</th>
                      <th style={thStyle}>Category</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Opening</th>
                      <th style={{ ...thStyle, background: '#166534', textAlign: 'center' }}>Inward Qty (+)</th>
                      <th style={{ ...thStyle, background: '#166534' }}>Inward Rate (Rs)</th>
                      <th style={{ ...thStyle, background: '#166534' }}>Supplier / Challan</th>
                      <th style={{ ...thStyle, background: '#991b1b', textAlign: 'center' }}>Used Qty (-)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Closing Preview</th>
                      <th style={thStyle}>Shift Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: C.textSubtle }}>
                          No materials found.
                        </td>
                      </tr>
                    ) : (
                      bulkRows.map((r, idx) => {
                        const inQ = parseFloat(r.received_quantity) || 0;
                        const outQ = parseFloat(r.used_quantity) || 0;
                        const previewClosing = r.opening + inQ - outQ;

                        return (
                          <tr key={r.material_id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>
                              {r.name}
                              <span style={{ fontSize: '0.7rem', color: C.textSubtle, marginLeft: '6px' }}>
                                ({r.unit})
                              </span>
                            </td>
                            <td style={{ ...tdStyle, fontSize: '0.75rem', color: C.textLight }}>
                              {r.group_name}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.primary }}>
                              {Number(r.opening).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, width: '110px' }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0"
                                style={{
                                  ...inputStyle,
                                  padding: '6px 8px',
                                  fontWeight: 700,
                                  color: C.green,
                                  borderColor: inQ > 0 ? '#86efac' : C.border,
                                  textAlign: 'right',
                                }}
                                value={r.received_quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkRows((prev) =>
                                    prev.map((row) => (row.material_id === r.material_id ? { ...row, received_quantity: val } : row))
                                  );
                                }}
                              />
                            </td>
                            <td style={{ ...tdStyle, width: '100px' }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={String(r.rate_per_unit || '0')}
                                style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem', textAlign: 'right' }}
                                value={r.rate_per_unit || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkRows((prev) =>
                                    prev.map((row) => (row.material_id === r.material_id ? { ...row, rate_per_unit: val } : row))
                                  );
                                }}
                              />
                            </td>
                            <td style={{ ...tdStyle, width: '180px' }}>
                              <input
                                type="text"
                                placeholder="Supplier name / Bill no"
                                style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.78rem' }}
                                value={r.supplier_name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkRows((prev) =>
                                    prev.map((row) => (row.material_id === r.material_id ? { ...row, supplier_name: val } : row))
                                  );
                                }}
                              />
                            </td>
                            <td style={{ ...tdStyle, width: '110px' }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0"
                                style={{
                                  ...inputStyle,
                                  padding: '6px 8px',
                                  fontWeight: 700,
                                  color: C.red,
                                  borderColor: outQ > 0 ? '#fca5a5' : C.border,
                                  textAlign: 'right',
                                }}
                                value={r.used_quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkRows((prev) =>
                                    prev.map((row) => (row.material_id === r.material_id ? { ...row, used_quantity: val } : row))
                                  );
                                }}
                              />
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                textAlign: 'right',
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                color: previewClosing < 0 ? C.red : C.text,
                              }}
                            >
                              {previewClosing.toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, width: '160px' }}>
                              <input
                                type="text"
                                placeholder="Remarks..."
                                style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.75rem' }}
                                value={r.notes}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkRows((prev) =>
                                    prev.map((row) => (row.material_id === r.material_id ? { ...row, notes: val } : row))
                                  );
                                }}
                              />
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
        {/* TAB 4: MATERIAL PASSBOOK (Bank-Statement Style Ledger)               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'passbook' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top Passbook Selector Bar */}
            <div style={{ ...cardStyle, padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '300px', flex: 1 }}>
                  <label style={labelStyle}>Select Raw Material</label>
                  <select
                    style={inputStyle}
                    value={selectedPassbookMatId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedPassbookMatId(id);
                      fetchPassbook(id);
                    }}
                  >
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

                <div style={{ minWidth: '150px' }}>
                  <label style={labelStyle}>From Date</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={passbookFrom}
                    onChange={(e) => setPassbookFrom(e.target.value)}
                  />
                </div>

                <div style={{ minWidth: '150px' }}>
                  <label style={labelStyle}>To Date</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={passbookTo}
                    onChange={(e) => setPassbookTo(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => fetchPassbook(selectedPassbookMatId)}
                    style={{
                      padding: '9px 18px',
                      background: C.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    View Statement
                  </button>
                  {selectedPassbookMatId && (
                    <a
                      href={`https://api.radhuerp.site/api/rawmaterial/materials/${selectedPassbookMatId}/passbook/export-excel/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '9px 18px',
                        background: C.green,
                        color: '#ffffff',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'inline-block',
                      }}
                    >
                      Export Passbook Excel
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Material Summary Header Card */}
            {passbookData?.material && (
              <div
                style={{
                  ...cardStyle,
                  padding: '16px 20px',
                  background: C.slateDark,
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {passbookData.material.group_name}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                    {passbookData.material.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px' }}>
                    Unit: {passbookData.material.unit} • Standard Rate: Rs {passbookData.material.standard_rate} • Min Buffer: {passbookData.material.minimum_stock} {passbookData.material.unit}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Inward</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#86efac' }}>
                      +{passbookData.totals?.total_inward} {passbookData.material.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Consumption</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fca5a5' }}>
                      -{passbookData.totals?.total_outward} {passbookData.material.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', paddingLeft: '16px', borderLeft: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Closing Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>
                      {passbookData.material.current_stock} {passbookData.material.unit}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Passbook Statement Table */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Transaction Description / Particulars</th>
                      <th style={thStyle}>Supplier Details</th>
                      <th style={thStyle}>Challan / Bill</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Inward Qty (+)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Unit Rate</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Inward Cost</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Outward Qty (-)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPassbook ? (
                      <tr>
                        <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: C.textSubtle }}>
                          Loading material passbook ledger...
                        </td>
                      </tr>
                    ) : !passbookData || passbookData.transactions?.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: C.textSubtle }}>
                          No transaction history found for this raw material.
                        </td>
                      </tr>
                    ) : (
                      passbookData.transactions.map((t, idx) => (
                        <tr key={t.id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{t.date}</td>
                          <td style={{ ...tdStyle, color: C.textMuted }}>{t.particulars}</td>
                          <td style={{ ...tdStyle, fontSize: '0.78rem' }}>{t.supplier_name || '—'}</td>
                          <td style={{ ...tdStyle, fontSize: '0.78rem', color: C.textLight }}>{t.bill_challan_no || '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.green }}>
                            {t.received > 0 ? `+${Number(t.received).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: C.textLight }}>
                            {t.rate > 0 ? `Rs ${Number(t.rate).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: C.green, fontWeight: 600 }}>
                            {t.cost > 0 ? `Rs ${Number(t.cost).toLocaleString()}` : '—'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.red }}>
                            {t.used > 0 ? `-${Number(t.used).toFixed(2)}` : '—'}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              textAlign: 'right',
                              fontWeight: 900,
                              fontSize: '0.95rem',
                              color: t.closing < 0 ? C.red : C.text,
                            }}
                          >
                            {Number(t.closing).toFixed(2)} {passbookData.material.unit}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: CURRENT STOCK (Grouped Cards & Valuation)                     */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentStockData.groups?.map((grp) => (
              <div key={grp.group_id} style={{ ...cardStyle, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 18px',
                    background: C.slateDark,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem' }}>{grp.group_name}</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Category Valuation: Rs {Number(grp.group_valuation || 0).toLocaleString()} • {grp.materials?.length || 0} items
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, background: '#1e293b' }}>Material Name</th>
                        <th style={{ ...thStyle, background: '#1e293b' }}>Unit</th>
                        <th style={{ ...thStyle, background: '#1e293b', textAlign: 'right' }}>Closing Stock</th>
                        <th style={{ ...thStyle, background: '#1e293b', textAlign: 'right' }}>Effective Rate</th>
                        <th style={{ ...thStyle, background: '#1e293b', textAlign: 'right' }}>Inventory Value</th>
                        <th style={{ ...thStyle, background: '#1e293b', textAlign: 'right' }}>Min Threshold</th>
                        <th style={{ ...thStyle, background: '#1e293b' }}>Last Transaction</th>
                        <th style={{ ...thStyle, background: '#1e293b', textAlign: 'center' }}>Status</th>
                        <th style={{ ...thStyle, background: '#1e293b', textAlign: 'center' }}>Passbook</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grp.materials?.map((m, idx) => {
                        const isOut = m.closing_stock <= 0;
                        const isLow = !isOut && m.is_low;
                        const statusChip = isOut
                          ? chipStyle(C.redSoft, C.red)
                          : isLow
                          ? chipStyle(C.amberSoft, C.amber)
                          : chipStyle(C.greenSoft, C.green);

                        return (
                          <tr key={m.material_id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{m.material_name}</td>
                            <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.75rem' }}>{m.unit}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: isOut ? C.red : isLow ? C.amber : C.text }}>
                              {Number(m.closing_stock).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: C.textLight }}>
                              Rs {Number(m.effective_rate || 0).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.green }}>
                              Rs {Number(m.valuation || 0).toLocaleString()}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: C.textLight }}>
                              {m.minimum_stock > 0 ? Number(m.minimum_stock).toFixed(2) : '—'}
                            </td>
                            <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.78rem' }}>
                              {m.last_entry_date || 'No entries'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span style={statusChip}>{isOut ? 'OUT' : isLow ? 'LOW' : 'OK'}</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(m.material_id)}
                                style={{
                                  padding: '3px 8px',
                                  background: C.primarySoft,
                                  color: C.primary,
                                  border: `1px solid #bfdbfe`,
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: SINGLE ENTRY FORM                                             */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'entry' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 460px) 1fr', gap: '20px', alignItems: 'start' }}>
            <div style={cardStyle}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>
                  Record Single Stock Entry
                </div>
                <div style={{ fontSize: '0.75rem', color: C.textLight }}>
                  Opening balance auto-fetched from previous closing
                </div>
              </div>

              <form onSubmit={handleSingleEntrySubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ ...labelStyle, color: C.green }}>Inward Qty (+)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{ ...inputStyle, fontWeight: 700, color: C.green }}
                      value={entryForm.received_quantity}
                      onChange={(e) => setEntryForm((p) => ({ ...p, received_quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: C.red }}>Consumption / Used (-)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{ ...inputStyle, fontWeight: 700, color: C.red }}
                      value={entryForm.used_quantity}
                      onChange={(e) => setEntryForm((p) => ({ ...p, used_quantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Purchase Rate (Rs)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={inputStyle}
                      value={entryForm.rate_per_unit}
                      onChange={(e) => setEntryForm((p) => ({ ...p, rate_per_unit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Supplier Name</label>
                    <input
                      type="text"
                      placeholder="Supplier / Mill"
                      style={inputStyle}
                      value={entryForm.supplier_name}
                      onChange={(e) => setEntryForm((p) => ({ ...p, supplier_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Bill / Challan No</label>
                    <input
                      type="text"
                      placeholder="CH-XXXX"
                      style={inputStyle}
                      value={entryForm.bill_challan_no}
                      onChange={(e) => setEntryForm((p) => ({ ...p, bill_challan_no: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Vehicle No</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-01-XX"
                      style={inputStyle}
                      value={entryForm.vehicle_no}
                      onChange={(e) => setEntryForm((p) => ({ ...p, vehicle_no: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Remarks</label>
                  <input
                    type="text"
                    placeholder="Shift / Batch note..."
                    style={inputStyle}
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingEntry}
                  style={{
                    padding: '11px',
                    background: savingEntry ? C.textSubtle : C.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: savingEntry ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {savingEntry ? 'Saving...' : 'Save Stock Entry'}
                </button>
              </form>
            </div>

            {/* Today's Transactions */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: C.text }}>Transactions Today ({todayStr})</div>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Material</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Inward</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Used</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Closing</th>
                      <th style={thStyle}>Supplier / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const list = entries.filter((e) => e.date === todayStr);
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '36px', color: C.textSubtle }}>
                              No transactions recorded for today yet.
                            </td>
                          </tr>
                        );
                      }
                      return list.map((e, idx) => (
                        <tr key={e.id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{e.material_name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.green }}>
                            {e.received_quantity > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '0.00'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: C.red }}>
                            {e.used_quantity > 0 ? `-${Number(e.used_quantity).toFixed(2)}` : '0.00'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: C.text }}>
                            {Number(e.closing).toFixed(2)}
                          </td>
                          <td style={{ ...tdStyle, fontSize: '0.75rem', color: C.textLight }}>
                            {e.supplier_name || e.notes || '—'}
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
        {/* TAB 7: MASTER SETUP                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'setup' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '18px', alignItems: 'start' }}>
            {/* Category / Group Management */}
            <div style={cardStyle}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: C.text }}>Material Categories</div>
                <div style={{ fontSize: '0.72rem', color: C.textLight }}>Rubber, Chemicals, Carbon Black, etc.</div>
              </div>
              <div style={{ padding: '16px' }}>
                <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Category name..."
                    style={{ ...inputStyle, flex: 1 }}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={savingGroup}
                    style={{
                      padding: '9px 16px',
                      background: C.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '450px', overflowY: 'auto' }}>
                  {groups.map((g) => {
                    const count = materials.filter((m) => m.group_id === g.id).length;
                    return (
                      <div
                        key={g.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: C.slateLight,
                          borderRadius: '6px',
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: C.text, fontSize: '0.82rem' }}>{g.name}</span>
                          <span style={{ ...chipStyle(C.primarySoft, C.primary), marginLeft: '8px' }}>
                            {count} items
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGroup(g.id, g.name)}
                          style={{
                            padding: '3px 8px',
                            background: C.redSoft,
                            color: C.red,
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Materials Master Register */}
            <div style={cardStyle}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: C.text }}>Raw Materials Directory</div>
                  <div style={{ fontSize: '0.72rem', color: C.textLight }}>Configure standard purchase rate, HSN & min stock</div>
                </div>
                <div style={{ width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search material..."
                    style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.78rem' }}
                    value={searchMaterial}
                    onChange={(e) => setSearchMaterial(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <form
                  onSubmit={handleAddMaterial}
                  style={{
                    background: '#f8fafc',
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={labelStyle}>Material Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. RSS-4 Rubber"
                        style={inputStyle}
                        value={matForm.name}
                        onChange={(e) => setMatForm((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Category *</label>
                      <select
                        style={inputStyle}
                        value={matForm.group_id}
                        onChange={(e) => setMatForm((p) => ({ ...p, group_id: e.target.value }))}
                        required
                      >
                        <option value="">-- Select --</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
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
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Std Rate (Rs)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        style={inputStyle}
                        value={matForm.standard_rate}
                        onChange={(e) => setMatForm((p) => ({ ...p, standard_rate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Min Stock</label>
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
                    <div>
                      <label style={labelStyle}>HSN Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 4001"
                        style={inputStyle}
                        value={matForm.hsn_code}
                        onChange={(e) => setMatForm((p) => ({ ...p, hsn_code: e.target.value }))}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingMat}
                      style={{
                        padding: '9px 18px',
                        background: C.green,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        height: '38px',
                      }}
                    >
                      {savingMat ? '...' : 'Register'}
                    </button>
                  </div>
                </form>

                <div style={{ overflowX: 'auto', maxHeight: '460px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Material Name</th>
                        <th style={thStyle}>Category</th>
                        <th style={thStyle}>Unit</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Std Rate (Rs)</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Min Threshold</th>
                        <th style={thStyle}>HSN</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Passbook</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials
                        .filter(
                          (m) =>
                            !searchMaterial ||
                            m.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
                            m.group_name.toLowerCase().includes(searchMaterial.toLowerCase())
                        )
                        .map((m, idx) => (
                          <tr key={m.id} style={{ background: idx % 2 === 0 ? C.white : C.slateLight }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{m.name}</td>
                            <td style={{ ...tdStyle, color: C.textLight }}>{m.group_name}</td>
                            <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.75rem' }}>{m.unit}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: C.green }}>
                              {m.standard_rate > 0 ? `Rs ${Number(m.standard_rate).toFixed(2)}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: C.textMuted }}>
                              {m.minimum_stock > 0 ? `${Number(m.minimum_stock).toFixed(2)} ${m.unit}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, color: C.textSubtle, fontSize: '0.75rem' }}>{m.hsn_code || '—'}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(m.id)}
                                style={{
                                  padding: '3px 8px',
                                  background: C.primarySoft,
                                  color: C.primary,
                                  border: `1px solid #bfdbfe`,
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                View
                              </button>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteMaterial(m.id, m.name)}
                                style={{
                                  padding: '3px 8px',
                                  background: C.redSoft,
                                  color: C.red,
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
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
