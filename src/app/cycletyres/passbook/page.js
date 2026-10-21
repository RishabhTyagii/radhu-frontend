'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTyresPassbook() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [bucket, setBucket] = useState('stock'); // default 1st grade / A-grade
  const [itemSearch, setItemSearch] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const itemDropdownRef = useRef(null);

  // Dates
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [tableSearch, setTableSearch] = useState('');

  // Handle clicking outside item dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setIsItemDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial items
  useEffect(() => {
    async function loadItems() {
      const res = await apiGet('/cycletyres/dashboard/');
      if (res && res.items) {
        setItems(res.items);
      }
    }
    loadItems();
  }, []);

  // Fetch Passbook ledger data
  const fetchPassbook = async () => {
    setLoading(true);
    let url = `/cycletyres/passbook/?from_date=${fromDate}&to_date=${toDate}&bucket=${bucket}`;
    if (selectedItemId) {
      url += `&tyre_item=${selectedItemId}`;
    }
    if (tableSearch) {
      url += `&search=${encodeURIComponent(tableSearch)}`;
    }

    const res = await apiGet(url);
    if (res) {
      setData(res);
      if (res.items && items.length === 0) {
        setItems(res.items);
      }
      if (!selectedItemId && res.selected_item) {
        setSelectedItemId(String(res.selected_item.id));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPassbook();
  }, [selectedItemId, bucket, fromDate, toDate]);

  // Quick Date presets
  const handleQuickDate = (type) => {
    const cur = new Date();
    if (type === 'this_month') {
      const start = new Date(cur.getFullYear(), cur.getMonth(), 1).toISOString().split('T')[0];
      setFromDate(start);
      setToDate(todayStr);
    } else if (type === 'last_month') {
      const start = new Date(cur.getFullYear(), cur.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(cur.getFullYear(), cur.getMonth(), 0).toISOString().split('T')[0];
      setFromDate(start);
      setToDate(end);
    } else if (type === 'last_30_days') {
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFromDate(start);
      setToDate(todayStr);
    } else if (type === 'all_time') {
      setFromDate('2026-01-01');
      setToDate(todayStr);
    }
  };

  // Filter items for search
  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(
      (it) =>
        it.size?.toLowerCase().includes(q) ||
        it.brand?.toLowerCase().includes(q) ||
        it.box_type?.toLowerCase().includes(q)
    );
  }, [items, itemSearch]);

  const selectedItemObj = useMemo(() => {
    return items.find((it) => String(it.id) === String(selectedItemId)) || data?.selected_item;
  }, [items, selectedItemId, data]);

  // Filter transactions locally by table search
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    if (!tableSearch.trim()) return data.transactions;
    const q = tableSearch.toLowerCase();
    return data.transactions.filter(
      (t) =>
        t.narration?.toLowerCase().includes(q) ||
        t.party_name?.toLowerCase().includes(q) ||
        t.bill_number?.toLowerCase().includes(q) ||
        t.date?.toLowerCase().includes(q) ||
        t.remark?.toLowerCase().includes(q)
    );
  }, [data?.transactions, tableSearch]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!data?.transactions?.length) {
      alert('Export karne ke liye koi transaction nahi hai.');
      return;
    }
    let csv = 'Date,Time,Type,Grade,Particulars,Party Name,Bill No,In (+),Out (-),Running Balance\n';
    // Add Opening Balance line
    csv += `${fromDate},-,Opening Balance,${bucket},Balance as on ${fromDate},-,-,-,-,${data.opening_balance}\n`;

    filteredTransactions.forEach((t) => {
      const cleanNarration = `"${(t.narration || '').replace(/"/g, '""')}"`;
      const cleanParty = `"${(t.party_name || '').replace(/"/g, '""')}"`;
      csv += `${t.date},${t.created_at || '-'},${t.entry_type},${t.bucket},${cleanNarration},${cleanParty},${t.bill_number},${t.in_qty || 0},${t.out_qty || 0},${t.balance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PASSBOOK_${selectedItemObj ? selectedItemObj.brand + '_' + selectedItemObj.size : 'CYCLE_TYRES'}_${fromDate}_TO_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
        {/* PAGE HEADER */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '24px',
            background: '#ffffff',
            padding: '20px 24px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#ffffff',
                  fontSize: '20px',
                }}
              >
                <i className="fas fa-book"></i>
              </span>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Cycle Tyre Passbook <span style={{ fontSize: '16px', fontWeight: '500', color: '#64748b' }}>(बैंक पासबुक / स्टॉक लेजर)</span>
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Item-wise real-time statement: Inflow (+), Outflow (-), Party Bill details aur running balance
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-print"></i> Print Statement
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(16,185,129,0.2)',
              }}
            >
              <i className="fas fa-file-excel"></i> Export Excel/CSV
            </button>
          </div>
        </div>

        {/* FILTERS & SELECTION CARD */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* Tyre Item Dropdown */}
            <div style={{ position: 'relative' }} ref={itemDropdownRef}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                <i className="fas fa-bullseye" style={{ marginRight: '6px', color: '#4f46e5' }}></i>
                SELECT TYRE ITEM
              </label>
              <button
                type="button"
                onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: selectedItemObj ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedItemObj ? `${selectedItemObj.brand || ''} ${selectedItemObj.size || ''}` : '-- Select Tyre --'}
                </span>
                <i className="fas fa-chevron-down" style={{ fontSize: '12px', color: '#94a3b8' }}></i>
              </button>

              {isItemDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '105%',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    maxHeight: '320px',
                    overflowY: 'auto',
                    padding: '8px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search size / brand..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '8px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {filteredItems.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => {
                        setSelectedItemId(String(it.id));
                        setIsItemDropdownOpen(false);
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: String(it.id) === String(selectedItemId) ? '#eff6ff' : 'transparent',
                        color: String(it.id) === String(selectedItemId) ? '#1d4ed8' : '#334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = String(it.id) === String(selectedItemId) ? '#eff6ff' : 'transparent')
                      }
                    >
                      <span>
                        <strong>{it.brand}</strong> {it.size} {it.box_type ? `(${it.box_type})` : ''}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: it.stock > 0 ? '#dcfce7' : '#fee2e2',
                          color: it.stock > 0 ? '#166534' : '#991b1b',
                          fontWeight: '700',
                        }}
                      >
                        Stock: {it.stock || 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bucket / Grade Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                <i className="fas fa-layer-group" style={{ marginRight: '6px', color: '#4f46e5' }}></i>
                GRADE / BUCKET
              </label>
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                <option value="stock">⭐ 1st Grade / Stock (A-Grade)</option>
                <option value="second_stock">🏷️ 2nd Grade Stock</option>
                <option value="rejected_stock">❌ Rejected / C-Grade</option>
                <option value="all">🌐 All Grades / Combined</option>
              </select>
            </div>

            {/* Date Range Controls */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                <i className="fas fa-calendar-alt" style={{ marginRight: '6px', color: '#4f46e5' }}></i>
                STATEMENT PERIOD
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>TO</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick presets & search */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '4px' }}>Quick Range:</span>
              <button
                type="button"
                onClick={() => handleQuickDate('this_month')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('last_month')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('last_30_days')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('all_time')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                All Time (2026)
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: '260px' }}>
              <i
                className="fas fa-search"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}
              ></i>
              <input
                type="text"
                placeholder="Search party, bill, remark..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* PASSBOOK SUMMARY STATS (BANK STATEMENT SUMMARY CARD) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Opening Balance */}
          <div
            style={{
              background: '#ffffff',
              padding: '18px 20px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                🏦 Opening Balance
              </span>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                <i className="fas fa-history"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '10px' }}>
              {loading ? '...' : (data?.opening_balance || 0).toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              As on {fromDate}
            </div>
          </div>

          {/* Total Inward (+) */}
          <div
            style={{
              background: '#ffffff',
              padding: '18px 20px',
              borderRadius: '16px',
              border: '1px solid #dcfce7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase' }}>
                🟢 Total Inward (+ In)
              </span>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                <i className="fas fa-arrow-down"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a', marginTop: '10px' }}>
              {loading ? '...' : `+${(data?.total_in || 0).toLocaleString()}`} <span style={{ fontSize: '13px', fontWeight: '500', color: '#15803d' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
              Production / Receipts
            </div>
          </div>

          {/* Total Outward (-) */}
          <div
            style={{
              background: '#ffffff',
              padding: '18px 20px',
              borderRadius: '16px',
              border: '1px solid #fee2e2',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase' }}>
                🔴 Total Outward (- Out)
              </span>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                <i className="fas fa-arrow-up"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginTop: '10px' }}>
              {loading ? '...' : `-${(data?.total_out || 0).toLocaleString()}`} <span style={{ fontSize: '13px', fontWeight: '500', color: '#b91c1c' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
              Sales / Dispatches
            </div>
          </div>

          {/* Closing / Current Balance */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              padding: '18px 20px',
              borderRadius: '16px',
              border: '1px solid #334155',
              color: '#ffffff',
              boxShadow: '0 4px 6px rgba(15,23,42,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                💰 Net Running Balance
              </span>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                <i className="fas fa-wallet"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#38bdf8', marginTop: '10px' }}>
              {loading ? '...' : (data?.closing_balance || 0).toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Balance after all entries
            </div>
          </div>
        </div>

        {/* PASSBOOK STATEMENT TABLE */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Passbook Statement Header Banner */}
          <div
            style={{
              background: '#f8fafc',
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                Passbook Statement
              </span>
              {selectedItemObj && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#e0e7ff',
                    color: '#3730a3',
                    padding: '3px 10px',
                    borderRadius: '8px',
                  }}
                >
                  {selectedItemObj.brand} — {selectedItemObj.size}
                </span>
              )}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '3px 10px',
                  borderRadius: '8px',
                }}
              >
                Bucket: {bucket.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Showing <strong>{filteredTransactions.length}</strong> transactions
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '700', width: '110px' }}>DATE</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', width: '120px' }}>TYPE</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700' }}>PARTICULARS / NARRATION</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', width: '130px' }}>BILL / REF NO</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right', width: '110px', color: '#16a34a' }}>
                    IN (+)
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right', width: '110px', color: '#dc2626' }}>
                    OUT (-)
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right', width: '120px', color: '#1d4ed8' }}>
                    BALANCE
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* OPENING BALANCE ROW */}
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '700' }}>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{fromDate}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: '#e2e8f0',
                        color: '#475569',
                      }}
                    >
                      B/F
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    <strong>OPENING STOCK BALANCE</strong> (Brought Forward)
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>-</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#1e293b', fontSize: '14px', fontWeight: '800' }}>
                    {(data?.opening_balance || 0).toLocaleString()}
                  </td>
                </tr>

                {/* LOADING SKELETON */}
                {loading && (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#6366f1' }}></i>
                      <div style={{ marginTop: '10px', fontWeight: '600' }}>Loading passbook transactions...</div>
                    </td>
                  </tr>
                )}

                {/* EMPTY STATE */}
                {!loading && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>Is period me koi transaction nahi mili.</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                        Date range badal ke dekhein ya koi aur Tyre Item select karein.
                      </div>
                    </td>
                  </tr>
                )}

                {/* TRANSACTION ROWS */}
                {!loading &&
                  filteredTransactions.map((t, idx) => {
                    const isProd = t.entry_type === 'production';
                    const isSale = t.entry_type === 'sale';
                    const isAdj = t.entry_type === 'adjustment';

                    return (
                      <tr
                        key={t.id || idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa')}
                      >
                        {/* Date */}
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                          <div>{t.date}</div>
                          {t.created_at && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>{t.created_at}</div>
                          )}
                        </td>

                        {/* Type */}
                        <td style={{ padding: '12px 16px' }}>
                          {isProd && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              <i className="fas fa-plus-circle"></i> Production
                            </span>
                          )}
                          {isSale && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#fee2e2',
                                color: '#b91c1c',
                              }}
                            >
                              <i className="fas fa-truck"></i> Sale / Party
                            </span>
                          )}
                          {isAdj && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#ede9fe',
                                color: '#6d28d9',
                              }}
                            >
                              <i className="fas fa-sliders-h"></i> Adjustment
                            </span>
                          )}
                        </td>

                        {/* Particulars / Narration */}
                        <td style={{ padding: '12px 16px' }}>
                          {t.party_name && t.party_name !== '-' && (
                            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                              🏢 Party: <span style={{ color: '#1d4ed8' }}>{t.party_name}</span>
                            </div>
                          )}
                          <div style={{ color: '#475569', fontSize: '12px' }}>{t.narration}</div>
                          {t.employee_name && (
                            <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '2px' }}>
                              👤 Press Worker: <strong>{t.employee_name}</strong>
                            </div>
                          )}
                        </td>

                        {/* Bill / Ref No */}
                        <td style={{ padding: '12px 16px' }}>
                          {t.bill_number && t.bill_number !== '-' ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#f1f5f9',
                                color: '#0f172a',
                                fontWeight: '700',
                                fontSize: '12px',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              {t.bill_number}
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>-</span>
                          )}
                        </td>

                        {/* In (+) */}
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontWeight: '700',
                            fontSize: '14px',
                            color: t.in_qty > 0 ? '#16a34a' : '#cbd5e1',
                          }}
                        >
                          {t.in_qty > 0 ? `+${t.in_qty.toLocaleString()}` : '-'}
                        </td>

                        {/* Out (-) */}
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontWeight: '700',
                            fontSize: '14px',
                            color: t.out_qty > 0 ? '#dc2626' : '#cbd5e1',
                          }}
                        >
                          {t.out_qty > 0 ? `-${t.out_qty.toLocaleString()}` : '-'}
                        </td>

                        {/* Balance */}
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontWeight: '800',
                            fontSize: '14px',
                            color: '#0f172a',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                            }}
                          >
                            {(t.balance || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {/* CLOSING BALANCE ROW */}
                {!loading && filteredTransactions.length > 0 && (
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: '800' }}>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{toDate}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#1e293b',
                          color: '#ffffff',
                        }}
                      >
                        CLOSING
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0f172a' }}>
                      <strong>NET CLOSING BALANCE</strong> (Period End)
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>-</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#16a34a', fontSize: '14px' }}>
                      +{(data?.total_in || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#dc2626', fontSize: '14px' }}>
                      -{(data?.total_out || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#0f172a', fontSize: '16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: '#1d4ed8',
                          color: '#ffffff',
                        }}
                      >
                        {(data?.closing_balance || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
