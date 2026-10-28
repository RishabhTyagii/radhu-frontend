'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ─── Design Tokens ───
const theme = {
  bg: '#f5f5f5',
  canvas: '#ffffff',
  border: '#e0e0e0',
  borderDark: '#bdbdbd',
  borderLight: '#f5f5f5',
  text: '#212121',
  textMuted: '#424242',
  textSub: '#757575',
  textFaint: '#9e9e9e',
  primary: '#1976d2',
  primaryDark: '#1565c0',
  primarySoft: '#e3f2fd',
  green: '#2e7d32',
  greenDark: '#1b5e20',
  greenSoft: '#e8f5e9',
  red: '#c62828',
  redDark: '#b71c1c',
  redSoft: '#ffebee',
  amber: '#f57f17',
  amberDark: '#e65100',
  amberSoft: '#fff8e1',
  purple: '#6a1b9a',
  purpleSoft: '#f3e5f5',
  navy: '#263238',
  cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
  cardShadowHover: '0 2px 6px rgba(0,0,0,0.1)',
};

const inputBase = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: '4px',
  border: `1px solid ${theme.border}`,
  fontSize: '13px',
  color: theme.text,
  background: theme.canvas,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: theme.textSub,
  marginBottom: '4px',
};

const thStyle = {
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: theme.textSub,
  background: '#fafafa',
  whiteSpace: 'nowrap',
  borderBottom: `1px solid ${theme.border}`,
  textAlign: 'left',
};

const tdStyle = {
  padding: '8px 12px',
  fontSize: '13px',
  color: theme.text,
  borderBottom: `1px solid ${theme.borderLight}`,
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};


const sheetThStyle = {
  padding: '6px 8px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#757575',
  background: '#fafafa',
  whiteSpace: 'nowrap',
};

const sheetTdStyle = {
  padding: '5px 8px',
  fontSize: '13px',
  color: '#212121',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const sheetInputBase = {
  width: '100%',
  padding: '4px 6px',
  borderRadius: '3px',
  border: '1px solid #bdbdbd',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  textAlign: 'right',
};

const TABS = [
  { id: 'bulk', label: 'Daily Sheet' },
  { id: 'datewise', label: 'Date-wise View' },
  { id: 'forecast', label: 'Run-Out Forecast' },
  { id: 'ledger', label: 'Stock Ledger' },
  { id: 'passbook', label: 'Material Passbook' },
  { id: 'stock', label: 'Current Inventory' },
  { id: 'entry', label: 'Single Entry' },
  { id: 'setup', label: 'Master Setup' },
];


function highlightMatch(text, query) {
  if (!query || !query.trim() || typeof text !== 'string') return text;
  const q = query.trim();
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.substring(0, index)}
      <span style={{ background: '#fff9c4', color: '#212121', padding: '1px 2px', borderRadius: '2px', fontWeight: 700 }}>
        {text.substring(index, index + q.length)}
      </span>
      {text.substring(index + q.length)}
    </>
  );
}

export default function RawMaterialTallyPage() {
  const [tab, setTab] = useState('bulk');
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [entries, setEntries] = useState([]);
  const [currentStockData, setCurrentStockData] = useState({ groups: [], total_valuation: 0 });
  const [forecastData, setForecastData] = useState({ forecast: [], kpis: {} });
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [toast, setToast] = useState(null);

  // Forecast Tab Controls
  const [forecastFilter, setForecastFilter] = useState('ALL'); // ALL, CRITICAL, LOW, HEALTHY
  const [forecastViewMode, setForecastViewMode] = useState('CARDS'); // CARDS, TABLE
  const [forecastSearch, setForecastSearch] = useState('');

  // Ledger Filter
  const [filterMat, setFilterMat] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Daily Stock Sheet State (Dual-Column Factory Matrix)
  const [sheetDate, setSheetDate] = useState('2026-10-22');
  const [sheetData, setSheetData] = useState(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [savingSheet, setSavingSheet] = useState(false);
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetCategoryFilter, setSheetCategoryFilter] = useState('ALL');
  const [sheetStatusFilter, setSheetStatusFilter] = useState('ALL'); // ALL, IN_STOCK, MODIFIED, ZERO
  const [modifiedItems, setModifiedItems] = useState({});

  const totalMatchesCount = useMemo(() => {
    if (!sheetData) return 0;
    const allSections = [...(sheetData.left_sections || []), ...(sheetData.right_sections || [])];
    let count = 0;
    allSections.forEach((sec) => {
      if (sheetCategoryFilter !== 'ALL' && sec.group_name !== sheetCategoryFilter) return;
      sec.items.forEach((it) => {
        const mod = modifiedItems[it.material_id];
        const isMod = Boolean(mod?.is_modified);
        const closeQ = mod ? (mod.closing ?? it.closing) : it.closing;

        if (sheetStatusFilter === 'IN_STOCK' && closeQ <= 0) return;
        if (sheetStatusFilter === 'ZERO' && closeQ > 0) return;
        if (sheetStatusFilter === 'MODIFIED' && !isMod) return;

        if (sheetSearch && sheetSearch.trim()) {
          const q = sheetSearch.trim().toLowerCase();
          const matchName = it.material_name.toLowerCase().includes(q);
          const matchUnit = it.unit.toLowerCase().includes(q);
          const matchGrp = sec.group_name.toLowerCase().includes(q);
          if (!matchName && !matchUnit && !matchGrp) return;
        }
        count++;
      });
    });
    return count;
  }, [sheetData, sheetCategoryFilter, sheetStatusFilter, sheetSearch, modifiedItems]);

  const fetchDailySheet = useCallback(async (targetDate) => {
    setLoadingSheet(true);
    try {
      const res = await apiGet(`/rawmaterial/daily-sheet/?date=${targetDate}`);
      if (res && res.date) {
        setSheetData(res);
        setSheetDate(res.date);
        setModifiedItems({});
      }
    } catch (e) {
      console.error('Error fetching daily sheet:', e);
      showToast('error', 'Failed to load daily stock sheet.');
    } finally {
      setLoadingSheet(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'bulk') {
      fetchDailySheet(sheetDate);
    }
  }, [tab, sheetDate, fetchDailySheet]);

  const handleClosingChange = (matId, opening, newCloseVal) => {
    const cVal = parseFloat(newCloseVal);
    if (isNaN(cVal)) {
      setModifiedItems((prev) => {
        const copy = { ...prev };
        delete copy[matId];
        return copy;
      });
      return;
    }
    let inQ = 0;
    let outQ = 0;
    if (cVal < opening) {
      outQ = Number((opening - cVal).toFixed(2));
      inQ = 0;
    } else if (cVal > opening) {
      inQ = Number((cVal - opening).toFixed(2));
      outQ = 0;
    }
    setModifiedItems((prev) => ({
      ...prev,
      [matId]: {
        ...prev[matId],
        closing: cVal,
        received_quantity: inQ,
        used_quantity: outQ,
        is_modified: true,
      },
    }));
  };

  const handleInwardChange = (matId, opening, currentUsed, newInwardVal) => {
    const inVal = parseFloat(newInwardVal) || 0;
    const outVal = parseFloat(currentUsed) || 0;
    const newClose = Number((opening + inVal - outVal).toFixed(2));
    setModifiedItems((prev) => ({
      ...prev,
      [matId]: {
        ...prev[matId],
        received_quantity: inVal,
        used_quantity: outVal,
        closing: newClose,
        is_modified: true,
      },
    }));
  };

  const handleUsedChange = (matId, opening, currentInward, newUsedVal) => {
    const outVal = parseFloat(newUsedVal) || 0;
    const inVal = parseFloat(currentInward) || 0;
    const newClose = Number((opening + inVal - outVal).toFixed(2));
    setModifiedItems((prev) => ({
      ...prev,
      [matId]: {
        ...prev[matId],
        received_quantity: inVal,
        used_quantity: outVal,
        closing: newClose,
        is_modified: true,
      },
    }));
  };

  const handleSaveDailySheet = async () => {
    if (!sheetData) return;
    setSavingSheet(true);

    const allSections = [...(sheetData.left_sections || []), ...(sheetData.right_sections || [])];
    const itemsToSave = [];

    allSections.forEach((sec) => {
      sec.items.forEach((it) => {
        const mod = modifiedItems[it.material_id];
        const opening = it.opening;
        const recv = mod ? (mod.received_quantity ?? it.received_quantity) : it.received_quantity;
        const used = mod ? (mod.used_quantity ?? it.used_quantity) : it.used_quantity;
        const closing = mod ? (mod.closing ?? it.closing) : it.closing;
        const rate = mod ? (mod.rate_per_unit ?? it.rate_per_unit) : it.rate_per_unit;

        itemsToSave.push({
          material_id: it.material_id,
          opening: opening,
          received_quantity: recv,
          used_quantity: used,
          closing: closing,
          rate_per_unit: rate,
          supplier_name: it.supplier_name || '',
          bill_challan_no: it.bill_challan_no || '',
          notes: it.notes || '',
        });
      });
    });

    const res = await apiPost('/rawmaterial/daily-sheet/', {
      date: sheetDate,
      items: itemsToSave,
    });
    setSavingSheet(false);

    if (res && res.ok) {
      showToast('success', `Daily stock sheet for ${sheetDate} saved! (${res.data?.saved_count || itemsToSave.length} items recorded)`);
      setModifiedItems({});
      fetchDailySheet(sheetDate);
      fetchBaseData();
    } else {
      showToast('error', res?.data?.error || 'Failed to save daily sheet.');
    }
  };

  const renderSheetSection = (sec) => {
    if (sheetCategoryFilter !== 'ALL' && sec.group_name !== sheetCategoryFilter) {
      return null;
    }

    const filteredItems = sec.items.filter((it) => {
      const mod = modifiedItems[it.material_id];
      const isMod = Boolean(mod?.is_modified);
      const closeQ = mod ? (mod.closing ?? it.closing) : it.closing;

      if (sheetStatusFilter === 'IN_STOCK' && closeQ <= 0) return false;
      if (sheetStatusFilter === 'ZERO' && closeQ > 0) return false;
      if (sheetStatusFilter === 'MODIFIED' && !isMod) return false;

      if (sheetSearch && sheetSearch.trim()) {
        const q = sheetSearch.trim().toLowerCase();
        const matchName = it.material_name.toLowerCase().includes(q);
        const matchUnit = it.unit.toLowerCase().includes(q);
        const matchGrp = sec.group_name.toLowerCase().includes(q);
        if (!matchName && !matchUnit && !matchGrp) return false;
      }
      return true;
    });

    if (filteredItems.length === 0 && (sheetSearch || sheetStatusFilter !== 'ALL' || sheetCategoryFilter !== 'ALL')) {
      return null;
    }

    let secTotalQty = 0;
    let secTotalKg = 0;
    filteredItems.forEach((it) => {
      const mod = modifiedItems[it.material_id];
      const closeQ = mod ? (mod.closing ?? it.closing) : it.closing;
      const pb = it.per_bag || 0;
      const kgVal = pb > 0 ? closeQ * pb : (it.unit.toLowerCase() === 'kg' ? closeQ : 0);
      secTotalQty += closeQ;
      secTotalKg += kgVal;
    });

    return (
      <div
        key={sec.group_name}
        style={{
          background: theme.canvas,
          borderRadius: '10px',
          border: `1px solid ${theme.border}`,
          overflow: 'hidden',
          boxShadow: theme.cardShadow,
        }}
      >
        <div
          style={{
            background: '#1e293b',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {highlightMatch(sec.group_name, sheetSearch)}
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '12px',
                fontSize: '0.68rem',
                fontWeight: 800,
                background: '#334155',
                color: '#cbd5e1',
              }}
            >
              {filteredItems.length} items
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
            Total: <span style={{ color: '#ffffff' }}>{Number(secTotalQty).toLocaleString('en-IN')}</span> Qty
            {secTotalKg > 0 && (
              <> | <span style={{ color: '#67e8f9' }}>{Number(secTotalKg).toLocaleString('en-IN')} Kg</span></>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `1.5px solid ${theme.border}` }}>
                <th style={{ ...sheetThStyle, width: '36px', textAlign: 'center' }}>#</th>
                <th style={{ ...sheetThStyle, textAlign: 'left' }}>Particulars</th>
                <th style={{ ...sheetThStyle, textAlign: 'right', width: '65px' }}>Open</th>
                <th style={{ ...sheetThStyle, textAlign: 'right', width: '70px', color: '#15803d' }}>Inward (+)</th>
                <th style={{ ...sheetThStyle, textAlign: 'right', width: '70px', color: '#b91c1c' }}>Used (-)</th>
                <th style={{ ...sheetThStyle, textAlign: 'right', width: '80px', color: '#1d4ed8' }}>Closing Qty</th>
                <th style={{ ...sheetThStyle, textAlign: 'center', width: '45px' }}>Unit</th>
                <th style={{ ...sheetThStyle, textAlign: 'right', width: '55px' }}>Per Bag</th>
                <th style={{ ...sheetThStyle, textAlign: 'right', width: '80px' }}>Total Kg</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const mod = modifiedItems[it.material_id];
                const openQ = it.opening;
                const inQ = mod ? (mod.received_quantity ?? it.received_quantity) : it.received_quantity;
                const outQ = mod ? (mod.used_quantity ?? it.used_quantity) : it.used_quantity;
                const closeQ = mod ? (mod.closing ?? it.closing) : it.closing;
                const pb = it.per_bag || 0;
                const kgVal = pb > 0 ? Number((closeQ * pb).toFixed(2)) : (it.unit.toLowerCase() === 'kg' ? closeQ : 0);
                const isModified = Boolean(mod?.is_modified);

                return (
                  <tr
                    key={it.material_id}
                    style={{
                      background: isModified ? '#eff6ff' : (idx % 2 === 0 ? theme.canvas : '#fafbfc'),
                      borderBottom: `1px solid ${theme.borderLight}`,
                      borderLeft: isModified ? '3.5px solid #2563eb' : 'none',
                    }}
                  >
                    <td style={{ ...sheetTdStyle, textAlign: 'center', color: theme.textFaint, fontWeight: 700 }}>
                      {it.sno}
                    </td>
                    <td style={{ ...sheetTdStyle, fontWeight: 700, color: theme.navy }}>
                      {highlightMatch(it.material_name, sheetSearch)}
                      {isModified && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '0.64rem',
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 800,
                          }}
                        >
                          EDITED
                        </span>
                      )}
                    </td>
                    <td style={{ ...sheetTdStyle, textAlign: 'right', color: theme.textSub, fontWeight: 600 }}>
                      {Number(openQ).toFixed(0)}
                    </td>
                    <td style={{ ...sheetTdStyle, padding: '3px 4px' }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={inQ === 0 ? '' : inQ}
                        placeholder="0"
                        onChange={(e) => handleInwardChange(it.material_id, openQ, outQ, e.target.value)}
                        style={{
                          ...sheetInputBase,
                          color: inQ > 0 ? '#15803d' : theme.text,
                          fontWeight: inQ > 0 ? 800 : 500,
                          background: inQ > 0 ? '#f0fdf4' : '#ffffff',
                          borderColor: inQ > 0 ? '#86efac' : theme.border,
                        }}
                      />
                    </td>
                    <td style={{ ...sheetTdStyle, padding: '3px 4px' }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={outQ === 0 ? '' : outQ}
                        placeholder="0"
                        onChange={(e) => handleUsedChange(it.material_id, openQ, inQ, e.target.value)}
                        style={{
                          ...sheetInputBase,
                          color: outQ > 0 ? '#b91c1c' : theme.text,
                          fontWeight: outQ > 0 ? 800 : 500,
                          background: outQ > 0 ? '#fef2f2' : '#ffffff',
                          borderColor: outQ > 0 ? '#fca5a5' : theme.border,
                        }}
                      />
                    </td>
                    <td style={{ ...sheetTdStyle, padding: '3px 4px' }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={closeQ === 0 && openQ === 0 && inQ === 0 ? '' : closeQ}
                        placeholder="0"
                        onChange={(e) => handleClosingChange(it.material_id, openQ, e.target.value)}
                        style={{
                          ...sheetInputBase,
                          fontWeight: 900,
                          color: isModified ? '#1d4ed8' : theme.navy,
                          background: isModified ? '#dbeafe' : '#f8fafc',
                          borderColor: isModified ? '#60a5fa' : theme.border,
                        }}
                      />
                    </td>
                    <td style={{ ...sheetTdStyle, textAlign: 'center', fontSize: '0.72rem', color: theme.textSub, fontWeight: 600 }}>
                      {it.unit}
                    </td>
                    <td style={{ ...sheetTdStyle, textAlign: 'right', color: theme.textFaint, fontSize: '0.74rem' }}>
                      {pb > 0 ? pb : '-'}
                    </td>
                    <td style={{ ...sheetTdStyle, textAlign: 'right', fontWeight: 800, color: '#475569' }}>
                      {kgVal > 0 ? Number(kgVal).toLocaleString('en-IN') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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

  // Date-wise View State
  const [datewiseDate, setDatewiseDate] = useState('2026-10-22');
  const [datewiseData, setDatewiseData] = useState(null);
  const [loadingDatewise, setLoadingDatewise] = useState(false);
  const [datewiseSearch, setDatewiseSearch] = useState('');

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

  // Master Setup
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

  // ── Fetching Data ───────────────────────────────────────────────────────────
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

  const fetchDatewiseSheet = useCallback(async (targetDate) => {
    setLoadingDatewise(true);
    try {
      const res = await apiGet(`/rawmaterial/daily-sheet/?date=${targetDate}`);
      if (res && res.date) {
        setDatewiseData(res);
        setDatewiseDate(res.date);
      }
    } catch (e) {
      showToast('error', 'Failed to load date-wise sheet.');
    } finally {
      setLoadingDatewise(false);
    }
  }, []);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  useEffect(() => {
    if (tab === 'ledger') fetchLedger();
    if (tab === 'forecast') fetchForecast();
    if (tab === 'passbook' && selectedPassbookMatId) fetchPassbook(selectedPassbookMatId);
    if (tab === 'datewise') fetchDatewiseSheet(datewiseDate);
  }, [tab, fetchLedger, fetchForecast, fetchPassbook, selectedPassbookMatId, fetchDatewiseSheet, datewiseDate]);

  // Bulk shift row init
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

  // Single entry opening preview
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

  // Handlers
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

  async function handleDeleteEntry(id) {
    if (!confirm('Are you sure you want to delete this stock entry?')) return;
    const res = await apiDelete(`/rawmaterial/stock-entries/${id}/`);
    if (res && res.ok) {
      showToast('success', 'Entry deleted');
      fetchLedger();
      fetchBaseData();
    }
  }

  async function handleDeleteMaterial(id, name) {
    if (!confirm(`Delete material "${name}"?`)) return;
    const res = await apiDelete(`/rawmaterial/materials/${id}/`);
    if (res && res.ok) {
      showToast('success', 'Material deleted');
      fetchBaseData();
    }
  }

  async function handleDeleteGroup(id, name) {
    if (!confirm(`Delete category "${name}" and all materials inside?`)) return;
    const res = await apiDelete(`/rawmaterial/groups/${id}/`);
    if (res && res.ok) {
      showToast('success', 'Category deleted');
      fetchBaseData();
    }
  }

  function openPassbookFor(materialId) {
    const mId = String(materialId);
    setSelectedPassbookMatId(mId);
    setTab('passbook');
    fetchPassbook(mId);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // Formatted valuation
  const totalValuationFormatted = useMemo(() => {
    const val = currentStockData.total_valuation || 0;
    if (val >= 10000000) return `Rs ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `Rs ${(val / 100000).toFixed(2)} L`;
    return `Rs ${val.toLocaleString()}`;
  }, [currentStockData]);

  // Total daily factory burn
  const totalDailyBurn = useMemo(() => {
    return forecastData.forecast.reduce((acc, f) => acc + (f.daily_velocity || 0), 0);
  }, [forecastData]);

  // Filtered forecast items
  const filteredForecast = useMemo(() => {
    return forecastData.forecast.filter((f) => {
      const matchesSearch =
        !forecastSearch ||
        f.material_name.toLowerCase().includes(forecastSearch.toLowerCase()) ||
        f.group_name.toLowerCase().includes(forecastSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (forecastFilter === 'CRITICAL') {
        return f.status === 'OUT OF STOCK' || f.status === 'CRITICAL';
      }
      if (forecastFilter === 'LOW') {
        return f.status === 'LOW BUFFER';
      }
      if (forecastFilter === 'HEALTHY') {
        return f.status === 'HEALTHY' || f.status === 'OVERSTOCKED';
      }
      return true;
    });
  }, [forecastData, forecastFilter, forecastSearch]);

  const criticalCount = forecastData.kpis?.critical_count || 0;
  const lowCount = forecastData.kpis?.low_count || 0;
  const healthyCount = forecastData.forecast.length - criticalCount - lowCount;

  return (
    <>
      <Navbar />

      {/* Edge-to-Edge Container (Zero lateral pinch, 100% full screen width) */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          minHeight: '100vh',
          background: theme.bg,
          padding: '16px 24px',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* Toast Alert */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '28px',
              zIndex: 9999,
              padding: '14px 22px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.86rem',
              background: toast.type === 'success' ? theme.greenSoft : theme.redSoft,
              color: toast.type === 'success' ? theme.greenDark : theme.redDark,
              border: `1.5px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              maxWidth: '440px',
            }}
          >
            {toast.text}
          </div>
        )}

        {/* ── Page Header & Quick Controls ─────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: theme.text,
                  margin: 0,
                  letterSpacing: '-0.025em',
                }}
              >
                Raw Material Management
              </h1>

            </div>
            <p style={{ color: theme.textSub, margin: '4px 0 0', fontSize: '0.86rem' }}>
              Daily stock entry, passbook, inventory &amp; forecasting
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => {
                fetchBaseData();
                if (tab === 'ledger') fetchLedger();
                if (tab === 'forecast') fetchForecast();
                if (tab === 'passbook') fetchPassbook(selectedPassbookMatId);
                if (tab === 'datewise') fetchDatewiseSheet(datewiseDate);
                showToast('success', 'Data refreshed');
              }}
              style={{
                padding: '9px 18px',
                background: theme.canvas,
                color: theme.textMuted,
                border: `1.5px solid ${theme.border}`,
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Executive Telemetry Cards (Full Width 4-Col Grid) ─────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Card 1: Valuation */}
          <div
            style={{
              background: theme.canvas,
              borderRadius: '6px',
              padding: '14px 16px',
              border: `1px solid ${theme.border}`,
              boxShadow: theme.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub }}>
                Inventory Valuation
              </span>

            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: theme.text, marginTop: '4px' }}>
              {totalValuationFormatted}
            </div>
            <div style={{ fontSize: '12px', color: theme.textSub, marginTop: '2px' }}>
              {materials.length} raw materials
            </div>
          </div>

          {/* Card 2: Line Stoppage Risk */}
          <div
            style={{
              background: theme.canvas,
              borderRadius: '6px',
              padding: '14px 16px',
              border: `1px solid ${theme.border}`,
              boxShadow: theme.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub }}>
                Low Stock Items
              </span>

            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: criticalCount > 0 ? theme.red : theme.text, marginTop: '4px' }}>
              {criticalCount} <span style={{ fontSize: '13px', fontWeight: 500, color: theme.textSub }}>critical</span>
            </div>
            <div style={{ fontSize: '12px', color: theme.textSub, marginTop: '2px' }}>
              {lowCount} items low stock
            </div>
          </div>

          {/* Card 3: Daily Burn Rate */}
          <div
            style={{
              background: theme.canvas,
              borderRadius: '6px',
              padding: '14px 16px',
              border: `1px solid ${theme.border}`,
              boxShadow: theme.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub }}>
                Daily Usage
              </span>

            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: theme.text, marginTop: '4px' }}>
              {totalDailyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span style={{ fontSize: '13px', fontWeight: 500, color: theme.textSub }}>Kg/Day</span>
            </div>
            <div style={{ fontSize: '12px', color: theme.textSub, marginTop: '2px' }}>
              Avg. daily consumption (30 days)
            </div>
          </div>

          {/* Card 4: Earliest Run-Out Alert */}
          <div
            style={{
              background: theme.canvas,
              borderRadius: '6px',
              padding: '14px 16px',
              border: `1px solid ${theme.border}`,
              boxShadow: theme.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: theme.textSub }}>
                Next Reorder
              </span>

            </div>
            {forecastData.forecast[0] ? (
              <>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: theme.text, marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {forecastData.forecast[0].material_name}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: theme.red, marginTop: '4px' }}>
                  {forecastData.forecast[0].days_left !== null ? `${forecastData.forecast[0].days_left} Days Left` : 'Exhausted'} • {forecastData.forecast[0].run_out_date}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '1rem', color: theme.textFaint, marginTop: '8px' }}>No forecast data</div>
            )}
          </div>
        </div>

        {/* ── Tab Navigation ─── */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '24px',
            overflowX: 'auto',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid #2563eb' : '2px solid transparent',
                fontWeight: tab === t.id ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: 'transparent',
                color: tab === t.id ? '#2563eb' : '#64748b',
                whiteSpace: 'nowrap',
                marginBottom: '-2px',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: RUN-OUT FORECASTER (10/10 Interactive Visual Dashboard)       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'forecast' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Filter Control Bar */}
            <div
              style={{
                background: theme.canvas,
                borderRadius: '10px',
                border: `1px solid ${theme.border}`,
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: theme.cardShadow,
              }}
            >
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'All Raw Materials', count: forecastData.forecast.length, color: theme.text },
                  { id: 'CRITICAL', label: 'Critical Risk (< 7d)', count: criticalCount, color: theme.redDark, bg: theme.redSoft },
                  { id: 'LOW', label: 'Low Buffer (7-15d)', count: lowCount, color: theme.amberDark, bg: theme.amberSoft },
                  { id: 'HEALTHY', label: 'Healthy Supply (> 15d)', count: healthyCount, color: theme.greenDark, bg: theme.greenSoft },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setForecastFilter(f.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: forecastFilter === f.id ? `2px solid ${f.color}` : `1px solid ${theme.border}`,
                      background: forecastFilter === f.id ? (f.bg || '#f1f5f9') : theme.canvas,
                      color: forecastFilter === f.id ? f.color : theme.textSub,
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{f.label}</span>
                    <span
                      style={{
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: '#00000010',
                        fontSize: '0.7rem',
                      }}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search + View Toggle */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '240px' }}>
                  <input
                    type="text"
                    placeholder="Search material or group..."
                    style={{ ...inputBase, padding: '7px 12px', fontSize: '0.8rem' }}
                    value={forecastSearch}
                    onChange={(e) => setForecastSearch(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                    padding: '3px',
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <button
                    onClick={() => setForecastViewMode('CARDS')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: forecastViewMode === 'CARDS' ? theme.canvas : 'transparent',
                      color: forecastViewMode === 'CARDS' ? theme.text : theme.textSub,
                      boxShadow: forecastViewMode === 'CARDS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Card Grid
                  </button>
                  <button
                    onClick={() => setForecastViewMode('TABLE')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: forecastViewMode === 'TABLE' ? theme.canvas : 'transparent',
                      color: forecastViewMode === 'TABLE' ? theme.text : theme.textSub,
                      boxShadow: forecastViewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Dense Table
                  </button>
                </div>
              </div>
            </div>

            {/* ── View 1: Visual Interactive Cards (10/10 Design) ─────────── */}
            {forecastViewMode === 'CARDS' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '16px',
                }}
              >
                {loadingForecast ? (
                  <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: theme.textFaint }}>
                    Calculating 30-day velocity telemetry...
                  </div>
                ) : filteredForecast.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: theme.textFaint, background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                    No materials matched the selected urgency filter.
                  </div>
                ) : (
                  filteredForecast.map((item) => {
                    const isCritical = item.status === 'OUT OF STOCK' || item.status === 'CRITICAL';
                    const isLow = item.status === 'LOW BUFFER';
                    const isOver = item.status === 'OVERSTOCKED';

                    // Progress bar calculation (% of minimum safety buffer)
                    const bufferRatio = item.minimum_stock > 0
                      ? Math.min(100, Math.max(5, (item.closing_stock / item.minimum_stock) * 50))
                      : Math.min(100, (item.closing_stock / 1000) * 50);

                    const cardBorderColor = isCritical
                      ? '#fca5a5'
                      : isLow
                      ? '#fcd34d'
                      : theme.border;

                    const barColor = isCritical
                      ? '#ef4444'
                      : isLow
                      ? '#f59e0b'
                      : isOver
                      ? '#3b82f6'
                      : '#10b981';

                    return (
                      <div
                        key={item.material_id}
                        style={{
                          background: theme.canvas,
                          borderRadius: '12px',
                          border: `1.5px solid ${cardBorderColor}`,
                          padding: '18px 20px',
                          boxShadow: isCritical ? '0 4px 16px rgba(239, 68, 68, 0.08)' : theme.cardShadow,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '14px',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Top Accent Strip */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: barColor,
                          }}
                        />

                        {/* Top: Category + Status Badge */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.textSub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {item.group_name}
                            </span>
                            <span
                              style={{
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: isCritical ? theme.redSoft : isLow ? theme.amberSoft : isOver ? theme.primarySoft : theme.greenSoft,
                                color: item.status_color,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                              }}
                            >
                              {item.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: theme.text, lineHeight: 1.3 }}>
                            {item.material_name}
                          </div>
                        </div>

                        {/* Middle: Big Stock Numbers & Countdown */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 1fr',
                            gap: '12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            border: `1px solid ${theme.border}`,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.textSub, textTransform: 'uppercase' }}>
                              Closing Stock
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: isCritical ? theme.red : theme.text, marginTop: '2px' }}>
                              {Number(item.closing_stock).toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.textSub }}>{item.unit}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: theme.textFaint, marginTop: '2px' }}>
                              Valuation: Rs {Number(item.valuation).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '12px' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.textSub, textTransform: 'uppercase' }}>
                              Days Remaining
                            </div>
                            <div
                              style={{
                                fontSize: '1.35rem',
                                fontWeight: 900,
                                color: isCritical ? theme.red : isLow ? theme.amber : theme.green,
                                marginTop: '2px',
                              }}
                            >
                              {item.days_left !== null ? `${item.days_left}d` : '365d+'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: theme.textFaint, marginTop: '2px' }}>
                              Exhaust: {item.run_out_date}
                            </div>
                          </div>
                        </div>

                        {/* Visual Depletion Progress Meter */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '5px' }}>
                            <span style={{ color: theme.textSub }}>Burn Velocity: {item.daily_velocity} {item.unit}/day</span>
                            <span style={{ color: barColor }}>Min Buffer: {item.minimum_stock} {item.unit}</span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '7px',
                              borderRadius: '4px',
                              background: '#e2e8f0',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${bufferRatio}%`,
                                height: '100%',
                                background: barColor,
                                borderRadius: '4px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>

                        {/* Bottom: Reorder Recommendation + Action Buttons */}
                        <div
                          style={{
                            paddingTop: '10px',
                            borderTop: `1px solid ${theme.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.68rem', color: theme.textFaint, fontWeight: 700, textTransform: 'uppercase' }}>
                              Recommended PO Qty
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: item.recommended_reorder > 0 ? theme.red : theme.greenDark }}>
                              {item.recommended_reorder > 0 ? `+${item.recommended_reorder.toLocaleString()} ${item.unit}` : 'Stock Sufficient'}
                            </div>
                          </div>

                          <button
                            onClick={() => openPassbookFor(item.material_id)}
                            style={{
                              padding: '7px 14px',
                              background: theme.canvas,
                              color: theme.primaryDark,
                              border: `1.5px solid #bfdbfe`,
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(37,99,235,0.06)',
                            }}
                          >
                            Passbook
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── View 2: High-Density Dense Table View ───────────────────── */}
            {forecastViewMode === 'TABLE' && (
              <div style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.cardShadow }}>
                <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1050px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Material Name</th>
                        <th style={thStyle}>Category</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Closing Stock</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Burn Rate (Day)</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Days Left</th>
                        <th style={{ ...thStyle, width: '150px' }}>Depletion Meter</th>
                        <th style={thStyle}>Run-Out Date</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Health</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Suggested PO</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Valuation</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Statement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForecast.map((f, idx) => {
                        const isCrit = f.status === 'OUT OF STOCK' || f.status === 'CRITICAL';
                        const isLow = f.status === 'LOW BUFFER';
                        const barColor = isCrit ? '#ef4444' : isLow ? '#f59e0b' : '#10b981';
                        const ratio = f.minimum_stock > 0
                          ? Math.min(100, Math.max(5, (f.closing_stock / f.minimum_stock) * 50))
                          : 50;

                        return (
                          <tr key={f.material_id} style={{ background: idx % 2 === 0 ? theme.canvas : '#fafbfc' }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{f.material_name}</td>
                            <td style={{ ...tdStyle, color: theme.textSub, fontSize: '0.78rem' }}>{f.group_name}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: isCrit ? theme.red : theme.text }}>
                              {Number(f.closing_stock).toFixed(1)} {f.unit}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.red }}>
                              {f.daily_velocity} {f.unit}
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                textAlign: 'right',
                                fontWeight: 900,
                                fontSize: '0.92rem',
                                color: f.days_left !== null && f.days_left <= 7 ? theme.red : f.days_left <= 15 ? theme.amber : theme.green,
                              }}
                            >
                              {f.days_left !== null ? `${f.days_left}d` : '365d+'}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{ width: `${ratio}%`, height: '100%', background: barColor }} />
                              </div>
                            </td>
                            <td style={{ ...tdStyle, fontSize: '0.8rem', color: theme.textSub }}>{f.run_out_date}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: isCrit ? theme.redSoft : isLow ? theme.amberSoft : theme.greenSoft,
                                  color: f.status_color,
                                }}
                              >
                                {f.status}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: f.recommended_reorder > 0 ? theme.red : theme.textFaint }}>
                              {f.recommended_reorder > 0 ? `+${f.recommended_reorder.toLocaleString()} ${f.unit}` : 'OK'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.greenDark }}>
                              Rs {Number(f.valuation).toLocaleString()}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(f.material_id)}
                                style={{
                                  padding: '4px 10px',
                                  background: theme.canvas,
                                  border: `1px solid ${theme.borderDark}`,
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Passbook
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: STOCK LEDGER                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'ledger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Filter Bar */}
            <div style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, padding: '16px 20px', boxShadow: theme.cardShadow }}>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ minWidth: '260px', flex: 1 }}>
                  <label style={labelStyle}>Material Filter</label>
                  <select
                    style={inputBase}
                    value={filterMat}
                    onChange={(e) => setFilterMat(e.target.value)}
                  >
                    <option value="">All Materials ({materials.length})</option>
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
                    style={inputBase}
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                  />
                </div>

                <div style={{ minWidth: '160px' }}>
                  <label style={labelStyle}>To Date</label>
                  <input
                    type="date"
                    style={inputBase}
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={fetchLedger}
                    style={{
                      padding: '10px 20px',
                      background: theme.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Filter Ledger
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
                      color: theme.textMuted,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.cardShadow }}>
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: `1px solid ${theme.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: theme.text }}>
                  Transaction History & Inward Challans
                </div>
                <span style={{ fontSize: '0.78rem', color: theme.textSub, fontWeight: 700 }}>
                  Showing {entries.length} entries
                </span>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Material</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Opening</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Inward (+)</th>
                      <th style={thStyle}>Supplier / Challan Reference</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Purchase Rate</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Total Inward Cost</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Used (-)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Closing Stock</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Passbook</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLedger ? (
                      <tr>
                        <td colSpan={12} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: theme.textFaint }}>
                          Loading stock records...
                        </td>
                      </tr>
                    ) : entries.length === 0 ? (
                      <tr>
                        <td colSpan={12} style={{ ...tdStyle, textAlign: 'center', padding: '48px', color: theme.textFaint }}>
                          No entries found for selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      entries.map((e, idx) => {
                        const isToday = e.date === todayStr;
                        const rowBg = isToday ? '#faf5ff' : idx % 2 === 0 ? theme.canvas : '#fafbfc';
                        const borderLeft = isToday ? `4px solid ${theme.purple}` : `4px solid transparent`;

                        return (
                          <tr key={e.id} style={{ background: rowBg, borderLeft }}>
                            <td style={{ ...tdStyle, fontWeight: isToday ? 800 : 600, color: isToday ? theme.purple : theme.textMuted }}>
                              {e.date}
                              {isToday && (
                                <span style={{ padding: '2px 6px', borderRadius: '8px', background: theme.purpleSoft, color: theme.purple, marginLeft: '6px', fontSize: '0.62rem', fontWeight: 800 }}>
                                  TODAY
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '0.78rem', color: theme.textSub }}>{e.group_name}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{e.material_name}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: theme.primary }}>
                              {Number(e.opening).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.green }}>
                              {Number(e.received_quantity) > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '0.00'}
                            </td>
                            <td style={{ ...tdStyle, fontSize: '0.78rem' }}>
                              {e.supplier_name ? (
                                <div>
                                  <div style={{ fontWeight: 700, color: theme.text }}>{e.supplier_name}</div>
                                  {e.bill_challan_no && (
                                    <div style={{ color: theme.textSub, fontSize: '0.7rem' }}>Challan #{e.bill_challan_no}</div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: theme.textFaint }}>—</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: theme.textSub }}>
                              {e.rate_per_unit > 0 ? `Rs ${Number(e.rate_per_unit).toFixed(2)}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.greenDark }}>
                              {e.total_cost > 0 ? `Rs ${Number(e.total_cost).toLocaleString()}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.red }}>
                              {Number(e.used_quantity) > 0 ? `-${Number(e.used_quantity).toFixed(2)}` : '0.00'}
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                textAlign: 'right',
                                fontWeight: 900,
                                fontSize: '0.92rem',
                                color: Number(e.closing) < 0 ? theme.red : theme.text,
                              }}
                            >
                              {Number(e.closing).toFixed(2)} {e.unit}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(e.material_id)}
                                style={{
                                  padding: '4px 10px',
                                  background: theme.primarySoft,
                                  color: theme.primaryDark,
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
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
                                  padding: '4px 8px',
                                  background: theme.redSoft,
                                  color: theme.red,
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
        {/* TAB 3: BULK SHIFT ENTRY (High-Speed Daily Grid)                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'bulk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Toolbar */}
            <div style={{ background: theme.canvas, borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '18px 22px', boxShadow: theme.cardShadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                
                {/* Left: Title & Date Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.08rem', fontWeight: 900, color: theme.navy, letterSpacing: '-0.01em' }}>
                        Raw Materials Stock Position Sheet
                      </span>
                      {sheetData?.is_saved ? (
                        <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          ✓ Saved Sheet
                        </span>
                      ) : (
                        <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                          ⚡ New Sheet
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: theme.textSub, marginTop: '2px' }}>
                      Exact factory closing sheet: Rubbers, Carbon & Oils (Left) | Fillers, Fabrics, Valves & Engineering (Right)
                    </div>
                  </div>

                  {/* Date Navigation Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 6px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <button
                      type="button"
                      disabled={!sheetData?.previous_date || loadingSheet}
                      onClick={() => sheetData?.previous_date && setSheetDate(sheetData.previous_date)}
                      style={{
                        padding: '6px 10px',
                        background: sheetData?.previous_date ? '#ffffff' : '#f8fafc',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: sheetData?.previous_date ? 'pointer' : 'not-allowed',
                        color: sheetData?.previous_date ? theme.text : theme.textFaint,
                      }}
                      title="Previous day sheet"
                    >
                      ◀ Prev
                    </button>

                    <input
                      type="date"
                      value={sheetDate}
                      onChange={(e) => setSheetDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${theme.border}`,
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: theme.navy,
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    />

                    <button
                      type="button"
                      disabled={!sheetData?.next_date || loadingSheet}
                      onClick={() => sheetData?.next_date && setSheetDate(sheetData.next_date)}
                      style={{
                        padding: '6px 10px',
                        background: sheetData?.next_date ? '#ffffff' : '#f8fafc',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: sheetData?.next_date ? 'pointer' : 'not-allowed',
                        color: sheetData?.next_date ? theme.text : theme.textFaint,
                      }}
                      title="Next day sheet"
                    >
                      Next ▶
                    </button>

                    <select
                      value={sheetDate}
                      onChange={(e) => setSheetDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${theme.border}`,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: theme.text,
                        background: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={sheetDate}>Jump: {sheetDate}</option>
                      {sheetData?.available_dates?.map((d) => (
                        <option key={d} value={d}>
                          {d} (Saved)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Export & Save Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href={`https://api.radhuerp.site/api/rawmaterial/daily-sheet/export-excel/?date=${sheetDate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 16px',
                      background: '#ffffff',
                      color: '#047857',
                      border: '1.5px solid #10b981',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      boxShadow: '0 1px 3px rgba(16,185,129,0.1)',
                    }}
                  >
                    📥 Export Excel
                  </a>

                  <button
                    onClick={handleSaveDailySheet}
                    disabled={savingSheet}
                    style={{
                      padding: '10px 22px',
                      background: savingSheet ? theme.textFaint : '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: savingSheet ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(21,128,61,0.25)',
                    }}
                  >
                    {savingSheet ? 'Saving Sheet...' : `Save Day Sheet (${Object.keys(modifiedItems).length} modified)`}
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              {sheetData?.kpis && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${theme.borderLight}` }}>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: theme.textSub, textTransform: 'uppercase' }}>Materials</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: theme.navy }}>{sheetData.kpis.total_materials} Items</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: theme.textSub, textTransform: 'uppercase' }}>Opening Qty</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: theme.primary }}>{Number(sheetData.kpis.total_opening).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Day Inward (+)</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d' }}>+{Number(sheetData.kpis.total_received).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Day Used (-)</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#b91c1c' }}>-{Number(sheetData.kpis.total_used).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: theme.textSub, textTransform: 'uppercase' }}>Closing Qty</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: theme.navy }}>{Number(sheetData.kpis.total_closing).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: theme.textSub, textTransform: 'uppercase' }}>Total Weight (Kg)</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#7c3aed' }}>{Number(sheetData.kpis.total_kg).toLocaleString('en-IN')} Kg</div>
                  </div>
                </div>
              )}

              {/* 🔍 ACTIVE SEARCH & FILTER CONTROL BAR */}
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${theme.borderLight}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  
                  {/* Active Search Input */}
                  <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                    <input
                      type="text"
                      placeholder="Type to actively search material name or unit (e.g. RSS, Clay, Diesel, Wax, NTC, Resin)..."
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      style={{
                        ...inputBase,
                        padding: '10px 38px 10px 14px',
                        fontSize: '0.86rem',
                        borderRadius: '8px',
                        borderColor: sheetSearch ? theme.primary : theme.border,
                        boxShadow: sheetSearch ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                      }}
                    />
                    {sheetSearch && (
                      <button
                        type="button"
                        onClick={() => setSheetSearch('')}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: theme.textSub,
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          padding: '4px',
                        }}
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Active Matches Counter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: sheetSearch || sheetStatusFilter !== 'ALL' || sheetCategoryFilter !== 'ALL' ? '#eff6ff' : '#f1f5f9',
                        color: sheetSearch || sheetStatusFilter !== 'ALL' || sheetCategoryFilter !== 'ALL' ? theme.primaryDark : theme.textSub,
                        border: `1px solid ${sheetSearch || sheetStatusFilter !== 'ALL' || sheetCategoryFilter !== 'ALL' ? '#bfdbfe' : theme.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Showing: <strong>{totalMatchesCount}</strong> of 96 items
                    </span>

                    {(sheetSearch || sheetStatusFilter !== 'ALL' || sheetCategoryFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSheetSearch('');
                          setSheetCategoryFilter('ALL');
                          setSheetStatusFilter('ALL');
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: '#ffffff',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          cursor: 'pointer',
                        }}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Pills: Sections & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  
                  {/* Category Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.textSub, textTransform: 'uppercase', marginRight: '4px' }}>
                      Section:
                    </span>
                    {['ALL', 'Rubbers', 'Chemical & Carbon', 'Processing Oils', 'Fillers', 'Other Main', 'Tube Valve', 'Boiler', 'Engineering', 'Miscellaneous'].map((cat) => {
                      const isActive = sheetCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSheetCategoryFilter(cat)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: isActive ? 800 : 600,
                            background: isActive ? '#0f172a' : '#f1f5f9',
                            color: isActive ? '#ffffff' : theme.textSub,
                            border: `1px solid ${isActive ? '#0f172a' : theme.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {cat === 'ALL' ? 'All Sections (9)' : cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Filters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.textSub, textTransform: 'uppercase', marginRight: '4px' }}>
                      Status:
                    </span>
                    {[
                      { id: 'ALL', label: 'All Stock' },
                      { id: 'IN_STOCK', label: 'With Stock (> 0)' },
                      { id: 'MODIFIED', label: `Modified (${Object.keys(modifiedItems).length})` },
                      { id: 'ZERO', label: 'Zero Stock (= 0)' },
                    ].map((st) => {
                      const isActive = sheetStatusFilter === st.id;
                      const isModTag = st.id === 'MODIFIED' && Object.keys(modifiedItems).length > 0;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSheetStatusFilter(st.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: isActive ? 800 : 600,
                            background: isActive ? (isModTag ? '#1d4ed8' : '#0f172a') : (isModTag ? '#dbeafe' : '#f1f5f9'),
                            color: isActive ? '#ffffff' : (isModTag ? '#1e40af' : theme.textSub),
                            border: `1px solid ${isActive ? (isModTag ? '#1d4ed8' : '#0f172a') : (isModTag ? '#93c5fd' : theme.border)}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>

            {/* DUAL-COLUMN FACTORY SHEET */}
            {loadingSheet ? (
              <div style={{ padding: '60px', textAlign: 'center', color: theme.textSub, fontWeight: 700 }}>
                Loading Daily Stock Sheet for {sheetDate}...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))', gap: '16px', alignItems: 'start' }}>
                
                {/* LEFT COLUMN: RUBBERS, CHEMICAL & CARBON, PROCESSING OILS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sheetData?.left_sections?.map((sec) => renderSheetSection(sec))}
                </div>

                {/* RIGHT COLUMN: FILLERS, OTHER MAIN, TUBE VALVE, BOILER, ENGINEERING, MISCELLANEOUS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sheetData?.right_sections?.map((sec) => renderSheetSection(sec))}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ══════ DATE-WISE SHEET VIEW ══════ */}
        {tab === 'datewise' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Controls */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>Date</label>
                  <input type="date" value={datewiseDate} onChange={(e) => { setDatewiseDate(e.target.value); fetchDatewiseSheet(e.target.value); }}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: 1, maxWidth: '300px' }}>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>Search</label>
                  <input type="text" placeholder="Search material..." value={datewiseSearch} onChange={(e) => setDatewiseSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.84rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => fetchDatewiseSheet(datewiseDate)}
                  style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  Load
                </button>
              </div>
            </div>

            {/* Nav + status */}
            {datewiseData && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{datewiseDate}</span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: datewiseData.is_saved ? '#dcfce7' : '#fef3c7', color: datewiseData.is_saved ? '#15803d' : '#b45309' }}>
                  {datewiseData.is_saved ? 'Saved' : 'Auto'}
                </span>
                {datewiseData.prev_date && (
                  <button onClick={() => fetchDatewiseSheet(datewiseData.prev_date)}
                    style={{ padding: '4px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#334155' }}>
                    ◀ {datewiseData.prev_date}
                  </button>
                )}
                {datewiseData.next_date && (
                  <button onClick={() => fetchDatewiseSheet(datewiseData.next_date)}
                    style={{ padding: '4px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#334155' }}>
                    {datewiseData.next_date} ▶
                  </button>
                )}
              </div>
            )}

            {loadingDatewise && <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>}

            {!loadingDatewise && datewiseData && (() => {
              const allSections = [...(datewiseData.left_sections || []), ...(datewiseData.right_sections || [])];
              let serial = 0;
              const enteredItems = [];
              allSections.forEach((sec) => {
                sec.items.forEach((it) => {
                  if (!(it.received_quantity > 0 || it.used_quantity > 0 || it.closing > 0)) return;
                  const q = datewiseSearch.trim().toLowerCase();
                  if (q && !it.material_name.toLowerCase().includes(q) && !sec.group_name.toLowerCase().includes(q)) return;
                  serial++;
                  enteredItems.push({ ...it, group_name: sec.group_name, serial });
                });
              });

              if (enteredItems.length === 0) {
                return <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                  {datewiseSearch ? 'No matching items with entries.' : 'No entries for this date.'}
                </div>;
              }

              const thSt = { padding: '10px 14px', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0', textAlign: 'left' };
              return (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0f172a' }}>{enteredItems.length} items with entries</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Inward: <strong style={{ color: '#16a34a' }}>+{enteredItems.reduce((s, it) => s + Number(it.received_quantity || 0), 0).toFixed(2)}</strong></span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Used: <strong style={{ color: '#dc2626' }}>-{enteredItems.reduce((s, it) => s + Number(it.used_quantity || 0), 0).toFixed(2)}</strong></span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: '#f1f5f9' }}>
                        <th style={thSt}>S.No</th><th style={thSt}>Category</th><th style={thSt}>Material</th>
                        <th style={{ ...thSt, textAlign: 'right' }}>Opening</th><th style={{ ...thSt, textAlign: 'right' }}>Inward (+)</th>
                        <th style={{ ...thSt, textAlign: 'right' }}>Used (-)</th><th style={{ ...thSt, textAlign: 'right' }}>Closing</th><th style={thSt}>Unit</th>
                      </tr></thead>
                      <tbody>
                        {enteredItems.map((it, idx) => (
                          <tr key={it.material_id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfd', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '9px 14px', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>{it.serial}</td>
                            <td style={{ padding: '9px 14px', fontSize: '0.75rem' }}><span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, color: '#64748b' }}>{it.group_name}</span></td>
                            <td style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{highlightMatch(it.material_name, datewiseSearch)}</td>
                            <td style={{ padding: '9px 14px', fontSize: '0.84rem', textAlign: 'right', color: '#334155' }}>{Number(it.opening || 0).toFixed(2)}</td>
                            <td style={{ padding: '9px 14px', fontSize: '0.84rem', textAlign: 'right', fontWeight: 700, color: Number(it.received_quantity) > 0 ? '#16a34a' : '#cbd5e1' }}>{Number(it.received_quantity) > 0 ? '+' + Number(it.received_quantity).toFixed(2) : '—'}</td>
                            <td style={{ padding: '9px 14px', fontSize: '0.84rem', textAlign: 'right', fontWeight: 700, color: Number(it.used_quantity) > 0 ? '#dc2626' : '#cbd5e1' }}>{Number(it.used_quantity) > 0 ? '-' + Number(it.used_quantity).toFixed(2) : '—'}</td>
                            <td style={{ padding: '9px 14px', fontSize: '0.88rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{Number(it.closing || 0).toFixed(2)}</td>
                            <td style={{ padding: '9px 14px', fontSize: '0.78rem', color: '#64748b' }}>{it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════ MATERIAL PASSBOOK ══════ */}
        {tab === 'passbook' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Selector */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>Material</label>
                  <select value={selectedPassbookMatId} onChange={(e) => { const id = e.target.value; setSelectedPassbookMatId(id); if (id) fetchPassbook(id); }}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }}>
                    <option value="">— Select Material —</option>
                    {groups.map((g) => (
                      <optgroup key={g.id} label={g.name}>
                        {materials.filter((m) => m.group_id === g.id).map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>From</label>
                  <input type="date" value={passbookFrom} onChange={(e) => setPassbookFrom(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>To</label>
                  <input type="date" value={passbookTo} onChange={(e) => setPassbookTo(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => fetchPassbook(selectedPassbookMatId)}
                    style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                    View
                  </button>
                  {selectedPassbookMatId && (
                    <a href={`https://api.radhuerp.site/api/rawmaterial/materials/${selectedPassbookMatId}/passbook/export-excel/`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ padding: '8px 16px', background: '#15803d', color: '#fff', textDecoration: 'none', borderRadius: '7px', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                      Excel
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Material Info */}
            {passbookData?.material && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{passbookData.material.group_name}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{passbookData.material.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Unit: {passbookData.material.unit}</div>
                </div>
                <div style={{ height: '44px', width: '1px', background: '#e2e8f0' }} />
                {[
                  { label: 'Opening', val: Number(passbookData.summary?.opening_balance || 0).toFixed(2), c: '#0f172a' },
                  { label: 'Inward', val: '+' + Number(passbookData.summary?.total_inward || 0).toFixed(2), c: '#16a34a' },
                  { label: 'Used', val: '-' + Number(passbookData.summary?.total_used || 0).toFixed(2), c: '#dc2626' },
                  { label: 'Closing', val: Number(passbookData.summary?.closing_balance || 0).toFixed(2), c: '#2563eb' },
                ].map((kpi) => (
                  <div key={kpi.label}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{kpi.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: kpi.c, marginTop: '1px' }}>{kpi.val}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Transaction Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>Transactions</span>
                {passbookData?.transactions && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{passbookData.transactions.length} records</span>}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}>
                    {['Date', 'Particulars', 'Supplier', 'Bill/Challan'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                    {['Inward (+)', 'Rate', 'Cost', 'Used (-)', 'Balance'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '0.73rem', fontWeight: 600, color: '#64748b', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loadingPassbook ? (
                      <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                    ) : !passbookData || passbookData.transactions?.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                        {selectedPassbookMatId ? 'No transactions found.' : 'Select a material to view passbook.'}
                      </td></tr>
                    ) : (
                      passbookData.transactions.map((t, idx) => (
                        <tr key={t.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfd', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '9px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{t.date}</td>
                          <td style={{ padding: '9px 14px', fontSize: '0.82rem', color: '#334155' }}>{t.particulars}</td>
                          <td style={{ padding: '9px 14px', fontSize: '0.78rem', color: '#64748b' }}>{t.supplier_name || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '0.78rem', color: '#64748b' }}>{t.bill_challan_no || '—'}</td>
                          <td style={{ padding: '9px 14px', fontSize: '0.84rem', textAlign: 'right', fontWeight: 600, color: t.received > 0 ? '#16a34a' : '#cbd5e1' }}>
                            {t.received > 0 ? '+' + Number(t.received).toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: '0.82rem', textAlign: 'right', color: '#64748b' }}>
                            {t.rate > 0 ? Number(t.rate).toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: '0.82rem', textAlign: 'right', color: '#15803d' }}>
                            {t.cost > 0 ? Number(t.cost).toLocaleString('en-IN') : '—'}
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: '0.84rem', textAlign: 'right', fontWeight: 600, color: t.used > 0 ? '#dc2626' : '#cbd5e1' }}>
                            {t.used > 0 ? '-' + Number(t.used).toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: '0.86rem', textAlign: 'right', fontWeight: 700, color: t.closing < 0 ? '#dc2626' : '#0f172a' }}>
                            {Number(t.closing || 0).toFixed(2)} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{passbookData?.material?.unit || ''}</span>
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
        {/* TAB 5: CURRENT INVENTORY                                             */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentStockData.groups?.map((grp) => (
              <div key={grp.group_id} style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.cardShadow }}>
                <div
                  style={{
                    padding: '12px 20px',
                    background: theme.navy,
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

                        return (
                          <tr key={m.material_id} style={{ background: idx % 2 === 0 ? theme.canvas : '#fafbfc' }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{m.material_name}</td>
                            <td style={{ ...tdStyle, color: theme.textFaint, fontSize: '0.75rem' }}>{m.unit}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: isOut ? theme.red : isLow ? theme.amber : theme.text }}>
                              {Number(m.closing_stock).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: theme.textSub }}>
                              Rs {Number(m.effective_rate || 0).toFixed(2)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.greenDark }}>
                              Rs {Number(m.valuation || 0).toLocaleString()}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: theme.textSub }}>
                              {m.minimum_stock > 0 ? Number(m.minimum_stock).toFixed(2) : '—'}
                            </td>
                            <td style={{ ...tdStyle, color: theme.textFaint, fontSize: '0.78rem' }}>
                              {m.last_entry_date || 'No entries'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: isOut ? theme.redSoft : isLow ? theme.amberSoft : theme.greenSoft,
                                  color: isOut ? theme.red : isLow ? theme.amber : theme.greenDark,
                                }}
                              >
                                {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(m.material_id)}
                                style={{
                                  padding: '3px 8px',
                                  background: theme.primarySoft,
                                  color: theme.primaryDark,
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
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
        {/* TAB 6: SINGLE TRANSACTION ENTRY                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'entry' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 480px) 1fr', gap: '20px', alignItems: 'start' }}>
            <div style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, boxShadow: theme.cardShadow, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, background: '#fafafa' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: theme.text }}>
                  Record Individual Inward / Outward
                </div>
                <div style={{ fontSize: '0.75rem', color: theme.textSub }}>
                  Auto-fetches opening balance from previous closing
                </div>
              </div>

              <form onSubmit={handleSingleEntrySubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Material *</label>
                  <select
                    style={inputBase}
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
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    style={inputBase}
                    value={entryForm.date}
                    onChange={(e) => setEntryForm((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ ...labelStyle, color: theme.greenDark }}>Inward Qty (+)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{ ...inputBase, fontWeight: 700, color: theme.greenDark }}
                      value={entryForm.received_quantity}
                      onChange={(e) => setEntryForm((p) => ({ ...p, received_quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: theme.red }}>Consumption / Used (-)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{ ...inputBase, fontWeight: 700, color: theme.red }}
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
                      style={inputBase}
                      value={entryForm.rate_per_unit}
                      onChange={(e) => setEntryForm((p) => ({ ...p, rate_per_unit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Supplier Name</label>
                    <input
                      type="text"
                      placeholder="Supplier / Mill"
                      style={inputBase}
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
                      style={inputBase}
                      value={entryForm.bill_challan_no}
                      onChange={(e) => setEntryForm((p) => ({ ...p, bill_challan_no: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Vehicle No</label>
                    <input
                      type="text"
                      placeholder="DL-01-XX"
                      style={inputBase}
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
                    style={inputBase}
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingEntry}
                  style={{
                    padding: '12px',
                    background: savingEntry ? theme.textFaint : theme.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
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
            <div style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, boxShadow: theme.cardShadow, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, background: '#fafafa' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: theme.text }}>Transactions Recorded Today ({todayStr})</div>
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
                            <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '36px', color: theme.textFaint }}>
                              No transactions recorded for today yet.
                            </td>
                          </tr>
                        );
                      }
                      return list.map((e, idx) => (
                        <tr key={e.id} style={{ background: idx % 2 === 0 ? theme.canvas : '#fafbfc' }}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{e.material_name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.green }}>
                            {e.received_quantity > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '0.00'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: theme.red }}>
                            {e.used_quantity > 0 ? `-${Number(e.used_quantity).toFixed(2)}` : '0.00'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: theme.text }}>
                            {Number(e.closing).toFixed(2)}
                          </td>
                          <td style={{ ...tdStyle, fontSize: '0.78rem', color: theme.textSub }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Category / Group Management */}
            <div style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, boxShadow: theme.cardShadow, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, background: '#fafafa' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: theme.text }}>Material Categories</div>
                <div style={{ fontSize: '0.74rem', color: theme.textSub }}>Rubber, Chemicals, Carbon Black, etc.</div>
              </div>
              <div style={{ padding: '18px' }}>
                <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Category name..."
                    style={{ ...inputBase, flex: 1 }}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={savingGroup}
                    style={{
                      padding: '10px 18px',
                      background: theme.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '460px', overflowY: 'auto' }}>
                  {groups.map((g) => {
                    const count = materials.filter((m) => m.group_id === g.id).length;
                    return (
                      <div
                        key={g.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '9px 12px',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: theme.text, fontSize: '0.85rem' }}>{g.name}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: theme.primarySoft, color: theme.primary, marginLeft: '8px', fontSize: '0.68rem', fontWeight: 800 }}>
                            {count} items
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGroup(g.id, g.name)}
                          style={{
                            padding: '3px 8px',
                            background: theme.redSoft,
                            color: theme.red,
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
            <div style={{ background: theme.canvas, borderRadius: '10px', border: `1px solid ${theme.border}`, boxShadow: theme.cardShadow, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: theme.text }}>Raw Materials Directory</div>
                  <div style={{ fontSize: '0.74rem', color: theme.textSub }}>Set standard purchase rate, HSN & min stock</div>
                </div>
                <div style={{ width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search material..."
                    style={{ ...inputBase, padding: '7px 12px', fontSize: '0.8rem' }}
                    value={searchMaterial}
                    onChange={(e) => setSearchMaterial(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: '18px' }}>
                <form
                  onSubmit={handleAddMaterial}
                  style={{
                    background: '#f8fafc',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={labelStyle}>Material Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. RSS-4 Rubber"
                        style={inputBase}
                        value={matForm.name}
                        onChange={(e) => setMatForm((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Category *</label>
                      <select
                        style={inputBase}
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
                        style={inputBase}
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
                        style={inputBase}
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
                        style={inputBase}
                        value={matForm.minimum_stock}
                        onChange={(e) => setMatForm((p) => ({ ...p, minimum_stock: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>HSN Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 4001"
                        style={inputBase}
                        value={matForm.hsn_code}
                        onChange={(e) => setMatForm((p) => ({ ...p, hsn_code: e.target.value }))}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingMat}
                      style={{
                        padding: '10px 18px',
                        background: theme.greenDark,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        height: '40px',
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
                          <tr key={m.id} style={{ background: idx % 2 === 0 ? theme.canvas : '#fafbfc' }}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{m.name}</td>
                            <td style={{ ...tdStyle, color: theme.textSub }}>{m.group_name}</td>
                            <td style={{ ...tdStyle, color: theme.textFaint, fontSize: '0.75rem' }}>{m.unit}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: theme.greenDark }}>
                              {m.standard_rate > 0 ? `Rs ${Number(m.standard_rate).toFixed(2)}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: theme.textMuted }}>
                              {m.minimum_stock > 0 ? `${Number(m.minimum_stock).toFixed(2)} ${m.unit}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, color: theme.textFaint, fontSize: '0.75rem' }}>{m.hsn_code || '—'}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => openPassbookFor(m.id)}
                                style={{
                                  padding: '3px 8px',
                                  background: theme.primarySoft,
                                  color: theme.primary,
                                  border: '1px solid #bfdbfe',
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
                                  background: theme.redSoft,
                                  color: theme.red,
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
