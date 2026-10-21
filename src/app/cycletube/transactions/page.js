'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTubeTransactions() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [bucket, setBucket] = useState('stock');
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

  // Close item dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setIsItemDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Cycle Tube master list
  useEffect(() => {
    async function loadItems() {
      const res = await apiGet('/cycletube/dashboard/');
      if (res && res.items) {
        setItems(res.items);
      }
    }
    loadItems();
  }, []);

  // Fetch Transactions ledger data
  const fetchTransactions = async () => {
    setLoading(true);
    let url = `/cycletube/transactions/?from_date=${fromDate}&to_date=${toDate}&bucket=${bucket}`;
    if (selectedItemId) {
      url += `&tube_item=${selectedItemId}`;
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
    fetchTransactions();
  }, [selectedItemId, bucket, fromDate, toDate]);

  // Quick Date presets
  const handleQuickDate = (type) => {
    const cur = new Date();
    if (type === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (type === 'this_month') {
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

  // Filter items for dropdown search
  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(
      (it) =>
        it.size?.toLowerCase().includes(q) ||
        it.type?.toLowerCase().includes(q) ||
        it.brand?.toLowerCase().includes(q) ||
        it.name?.toLowerCase().includes(q)
    );
  }, [items, itemSearch]);

  const selectedItemObj = useMemo(() => {
    return items.find((it) => String(it.id) === String(selectedItemId)) || data?.selected_item;
  }, [items, selectedItemId, data]);

  // Local table search filter
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
      alert('No transactions available to export.');
      return;
    }
    let csv = 'Date,Time,Type,Bucket,Particulars,Party Name,Bill No,In (+),Out (-),Running Balance\n';
    csv += `${fromDate},-,Opening Balance,${bucket},Opening Stock Balance Brought Forward,-,-,-,-,${data.opening_balance}\n`;

    filteredTransactions.forEach((t) => {
      const cleanNarration = `"${(t.narration || '').replace(/"/g, '""')}"`;
      const cleanParty = `"${(t.party_name || '').replace(/"/g, '""')}"`;
      csv += `${t.date},${t.created_at || '-'},${t.entry_type},${t.bucket},${cleanNarration},${cleanParty},${t.bill_number},${t.in_qty || 0},${t.out_qty || 0},${t.balance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TUBE_TRANSACTIONS_${selectedItemObj ? selectedItemObj.brand + '_' + selectedItemObj.size : 'ALL'}_${fromDate}_TO_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />

      {/* FULL SCREEN FLUID CONTAINER */}
      <div style={{ width: '100%', maxWidth: '100%', padding: '24px 28px', boxSizing: 'border-box' }}>
        {/* HEADER BAR */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            background: '#ffffff',
            padding: '18px 24px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 10px rgba(13,148,136,0.2)',
              }}
            >
              <i className="fas fa-life-ring"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Cycle Tube Transactions
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: '#ccfbf1',
                    color: '#0f766e',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    border: '1px solid #99f6e4',
                  }}
                >
                  Live Ledger
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Bank statement style transaction ledger: chronological Inward (+), Sale (-), and real-time running balance
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              <i className="fas fa-print" style={{ color: '#64748b' }}></i> Print Statement
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#047857')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#059669')}
            >
              <i className="fas fa-file-excel"></i> Export CSV
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTER TOOLBAR */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px 22px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {/* Item Dropdown */}
            <div style={{ position: 'relative' }} ref={itemDropdownRef}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Select Cycle Tube
              </label>
              <button
                type="button"
                onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
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
                  {selectedItemObj ? `${selectedItemObj.brand || ''} ${selectedItemObj.size || ''} ${selectedItemObj.type || ''}` : 'Select Tube'}
                </span>
                <i className="fas fa-chevron-down" style={{ fontSize: '12px', color: '#64748b' }}></i>
              </button>

              {isItemDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                    zIndex: 60,
                    maxHeight: '340px',
                    overflowY: 'auto',
                    padding: '8px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search size, brand..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '8px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
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
                        borderRadius: '6px',
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
                        <strong style={{ color: '#0f172a' }}>{it.brand}</strong> {it.size} {it.type ? `(${it.type})` : ''}
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

            {/* Grade / Bucket Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Stock Grade / Bucket
              </label>
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                <option value="stock">Stock (Normal)</option>
                <option value="rfm_stock">R.F.M. Stock</option>
                <option value="all">All Grades (Combined)</option>
              </select>
            </div>

            {/* Statement Period Date Pickers */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Statement Period
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800' }}>TO</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick presets & Search Toolbar */}
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
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginRight: '4px' }}>Range:</span>
              <button
                type="button"
                onClick={() => handleQuickDate('today')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: fromDate === todayStr && toDate === todayStr ? '#0d9488' : '#f8fafc',
                  color: fromDate === todayStr && toDate === todayStr ? '#ffffff' : '#475569',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('this_month')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
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
                  borderRadius: '6px',
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
                  borderRadius: '6px',
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
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                All (2026)
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: '280px' }}>
              <i
                className="fas fa-search"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}
              ></i>
              <input
                type="text"
                placeholder="Search party, bill number..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* 4 SUMMARY STAT CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Card 1: Opening Balance */}
          <div
            style={{
              background: '#ffffff',
              padding: '18px 22px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Opening Balance
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
                  fontSize: '13px',
                }}
              >
                <i className="fas fa-history"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '8px', letterSpacing: '-0.02em' }}>
              {loading ? '...' : (data?.opening_balance || 0).toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              As of {fromDate} (B/F)
            </div>
          </div>

          {/* Card 2: Total Inward (+) */}
          <div
            style={{
              background: '#ffffff',
              padding: '18px 22px',
              borderRadius: '14px',
              border: '1px solid #dcfce7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Inward (+)
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
                  fontSize: '13px',
                }}
              >
                <i className="fas fa-arrow-down"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a', marginTop: '8px', letterSpacing: '-0.02em' }}>
              {loading ? '...' : `+${(data?.total_in || 0).toLocaleString()}`} <span style={{ fontSize: '13px', fontWeight: '500', color: '#15803d' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
              Production Tube Inflow
            </div>
          </div>

          {/* Card 3: Total Outward (-) */}
          <div
            style={{
              background: '#ffffff',
              padding: '18px 22px',
              borderRadius: '14px',
              border: '1px solid #fee2e2',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Outward (-)
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
                  fontSize: '13px',
                }}
              >
                <i className="fas fa-arrow-up"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginTop: '8px', letterSpacing: '-0.02em' }}>
              {loading ? '...' : `-${(data?.total_out || 0).toLocaleString()}`} <span style={{ fontSize: '13px', fontWeight: '500', color: '#b91c1c' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
              Sales & Dispatches Outflow
            </div>
          </div>

          {/* Card 4: Net Running Balance */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              padding: '18px 22px',
              borderRadius: '14px',
              border: '1px solid #334155',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(15,23,42,0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Closing Running Balance
              </span>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#2dd4bf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                }}
              >
                <i className="fas fa-coins"></i>
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#2dd4bf', marginTop: '8px', letterSpacing: '-0.02em' }}>
              {loading ? '...' : (data?.closing_balance || 0).toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Current Available Stock
            </div>
          </div>
        </div>

        {/* TRANSACTIONS STATEMENT TABLE */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          {/* Statement Subheader */}
          <div
            style={{
              background: '#f8fafc',
              padding: '14px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
                Transaction History
              </span>
              {selectedItemObj && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#ccfbf1',
                    color: '#0f766e',
                    padding: '3px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {selectedItemObj.brand} — {selectedItemObj.size}
                </span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '3px 9px',
                  borderRadius: '6px',
                }}
              >
                Grade: {bucket.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              Total Records: <strong>{filteredTransactions.length}</strong>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>
                    DATE
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '130px' }}>
                    TYPE
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PARTICULARS / NARRATION
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '160px' }}>
                    BILL / REF NO
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '120px', color: '#16a34a' }}>
                    INWARD (+)
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '120px', color: '#dc2626' }}>
                    OUTWARD (-)
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '140px', color: '#0d9488' }}>
                    BALANCE
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* OPENING BALANCE ROW */}
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '700' }}>
                  <td style={{ padding: '13px 18px', color: '#64748b' }}>{fromDate}</td>
                  <td style={{ padding: '13px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        background: '#e2e8f0',
                        color: '#475569',
                      }}
                    >
                      B/F
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', color: '#1e293b' }}>
                    <strong>OPENING STOCK BALANCE</strong>
                  </td>
                  <td style={{ padding: '13px 18px', color: '#94a3b8' }}>-</td>
                  <td style={{ padding: '13px 18px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                  <td style={{ padding: '13px 18px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                  <td style={{ padding: '13px 18px', textAlign: 'right', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>
                    {(data?.opening_balance || 0).toLocaleString()}
                  </td>
                </tr>

                {/* LOADING SKELETON */}
                {loading && (
                  <tr>
                    <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#0d9488' }}></i>
                      <div style={{ marginTop: '12px', fontWeight: '600' }}>Loading ledger transactions...</div>
                    </td>
                  </tr>
                )}

                {/* EMPTY STATE */}
                {!loading && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      <i className="fas fa-inbox fa-2x" style={{ color: '#cbd5e1', marginBottom: '8px' }}></i>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>No transactions recorded in this period.</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                        Try selecting another date range or Tube Item.
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
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa')}
                      >
                        {/* Date */}
                        <td style={{ padding: '13px 18px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap' }}>
                          <div>{t.date}</div>
                          {t.created_at && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>{t.created_at}</div>
                          )}
                        </td>

                        {/* Type */}
                        <td style={{ padding: '13px 18px' }}>
                          {isProd && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 9px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              <i className="fas fa-plus"></i> Production
                            </span>
                          )}
                          {isSale && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 9px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#fee2e2',
                                color: '#b91c1c',
                              }}
                            >
                              <i className="fas fa-truck"></i> Sale
                            </span>
                          )}
                          {isAdj && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 9px',
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
                        <td style={{ padding: '13px 18px' }}>
                          {t.party_name && t.party_name !== '-' && (
                            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                              <span style={{ color: '#0d9488' }}>{t.party_name}</span>
                            </div>
                          )}
                          <div style={{ color: '#475569', fontSize: '13px' }}>{t.narration}</div>
                        </td>

                        {/* Bill / Ref No */}
                        <td style={{ padding: '13px 18px' }}>
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
                                fontFamily: 'monospace',
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
                            padding: '13px 18px',
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
                            padding: '13px 18px',
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
                            padding: '13px 18px',
                            textAlign: 'right',
                            fontWeight: '800',
                            fontSize: '14px',
                            color: '#0f172a',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              background: '#f0fdfa',
                              color: '#0f766e',
                              border: '1px solid #99f6e4',
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
                    <td style={{ padding: '14px 18px', color: '#64748b' }}>{toDate}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: '#0f172a',
                          color: '#ffffff',
                        }}
                      >
                        CLOSING
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#0f172a' }}>
                      <strong>NET CLOSING BALANCE</strong>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#94a3b8' }}>-</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#16a34a', fontSize: '14px' }}>
                      +{(data?.total_in || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#dc2626', fontSize: '14px' }}>
                      -{(data?.total_out || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#0f172a', fontSize: '16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          background: '#0d9488',
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
