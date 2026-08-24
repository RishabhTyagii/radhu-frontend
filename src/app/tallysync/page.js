'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function TallySalesSummary() {
  const [data, setData] = useState(null);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'tyre', 'cycletyre', 'tube'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    party: '',
    month: '',
    from_date: '',
    to_date: '',
  });

  // Transfer modal state
  const [transferModalInvoice, setTransferModalInvoice] = useState(null);
  const [transferModule, setTransferModule] = useState('tyre');
  const [transferItemId, setTransferItemId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  async function fetchSummary() {
    setLoading(true);
    let query = '?';
    if (filters.party) query += `party=${encodeURIComponent(filters.party)}&`;
    if (filters.from_date || filters.to_date) {
      if (filters.from_date) query += `from_date=${filters.from_date}&`;
      if (filters.to_date) query += `to_date=${filters.to_date}&`;
    } else if (filters.month) {
      query += `month=${filters.month}&`;
    }

    const [salesRes, itemsRes] = await Promise.all([
      apiGet(`/tallysync/sales/${query}`),
      apiGet('/tallysync/stock-items/'),
    ]);

    if (salesRes) setData(salesRes);
    if (itemsRes) setStockItems(itemsRes);
    setLoading(false);
  }

  const handleReset = () => {
    setFilters({ party: '', month: '', from_date: '', to_date: '' });
    setSearchTerm('');
  };

  const handleExecuteTransfer = async () => {
    if (!transferModalInvoice || !transferModule || !transferItemId) {
      alert('Pehle module aur matching item select karo!');
      return;
    }

    setTransferring(true);
    setMessage(null);

    const pendingItem = transferModalInvoice.pending_items?.[0] || {};
    const tallyItemName = pendingItem.tally_item_name || 'Voucher Item';

    const res = await apiPost('/tallysync/add-mapping/', {
      tally_item_name: tallyItemName,
      module: transferModule,
      item_id: transferItemId,
    });

    setTransferring(false);
    setTransferModalInvoice(null);

    if (res && res.ok) {
      setMessage({
        type: 'success',
        text: `✓ Item transferred & mapped to ${transferModule.toUpperCase()} successfully!`,
      });
      fetchSummary();
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to transfer item' });
    }
  };

  const invoices = data?.invoices || [];
  const totals = data?.totals || {};

  function getInvoiceCategory(inv) {
    const raw = (inv.raw_payload || '').toLowerCase();
    const party = (inv.party_name || '').toLowerCase();
    if (raw.includes('tube') || raw.includes('tb') || raw.includes('mld') || raw.includes('jt')) return 'tube';
    if (raw.includes('cycle') && raw.includes('tyre')) return 'cycletyre';
    if (raw.includes('tyre') || party.includes('tyre')) return 'tyre';
    return 'all';
  }

  const counts = useMemo(() => {
    let t = 0, ct = 0, tu = 0;
    invoices.forEach((inv) => {
      const cat = getInvoiceCategory(inv);
      if (cat === 'tyre') t++;
      else if (cat === 'cycletyre') ct++;
      else if (cat === 'tube') tu++;
    });
    return { all: invoices.length, tyre: t, cycletyre: ct, tube: tu };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab !== 'all') {
        const cat = getInvoiceCategory(inv);
        if (cat !== activeTab) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const party = (inv.party_name || '').toLowerCase();
        const vno = (inv.voucher_number || '').toLowerCase();
        const gstin = (inv.party_gstin || '').toLowerCase();
        const state = (inv.state_name || '').toLowerCase();
        if (!party.includes(q) && !vno.includes(q) && !gstin.includes(q) && !state.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, activeTab, searchTerm]);

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc' }}>
      <Navbar />

      <main style={{ padding: '24px 32px 60px', maxWidth: '100%', margin: '0 auto' }}>
        
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Tally Prime Vouchers & GST Hub
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                Live Connected
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              Real-time synchronization for Sales Vouchers, Party GSTIN, Taxable Base, and Inventory Stock Ledger
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/tallysync/mapping"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-link"></i> Item Mappings
            </Link>

            <Link
              href="/tallysync/logs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fas fa-history"></i> Sync Logs
              {Boolean(data?.unmapped_count) && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  marginLeft: '4px'
                }}>
                  {data.unmapped_count}
                </span>
              )}
            </Link>

            <button
              onClick={fetchSummary}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
              title="Refresh Data"
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
            {message.text}
          </div>
        )}

        {/* Pending Sync Alert */}
        {Boolean(data?.unmapped_count) && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '16px 24px',
            borderRadius: '14px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                fontSize: '1.1rem'
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>
                  {data.unmapped_count} Voucher(s) Require Stock Item Mapping
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  Line items exist that could not be automatically deducted from ERP stock buckets.
                </div>
              </div>
            </div>
            <Link
              href="/tallysync/logs"
              style={{
                background: '#f59e0b',
                color: '#000000',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Resolve Items <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        )}

        {/* Top KPI Summary Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Total Sales */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoiced Sales</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-wallet"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              ₹{Number(totals.total_sale || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Across {data?.invoice_count || 0} sync vouchers
            </div>
          </div>

          {/* Taxable Base */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #a855f7, #c084fc)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taxable Base Amount</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              ₹{Number(totals.total_taxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Goods value before GST
            </div>
          </div>

          {/* Total GST */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total GST Collected</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-percentage"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              ₹{Number(totals.total_gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>C: ₹{Number(totals.total_cgst || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span>•</span>
              <span>S: ₹{Number(totals.total_sgst || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span>•</span>
              <span>I: ₹{Number(totals.total_igst || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Total Invoices / Sync Status */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Sync Health</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-boxes"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {((invoices.length - (data?.unmapped_count || 0)) / (invoices.length || 1) * 100).toFixed(0)}% Synced
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {invoices.length - (data?.unmapped_count || 0)} of {invoices.length} fully updated
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '28px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                <i className="fas fa-search mr-1"></i> Search Party / Voucher / GST
              </label>
              <input
                type="text"
                placeholder="Type party name or voucher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                <i className="fas fa-calendar-alt mr-1"></i> Month Preset
              </label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value, from_date: '', to_date: '' })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value, month: '' })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => setFilters({ ...filters, to_date: e.target.value, month: '' })}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  height: '42px',
                  whiteSpace: 'nowrap',
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Transfer Modal if needed */}
        {transferModalInvoice && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              width: '500px',
              maxWidth: '90%',
              padding: '28px',
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              color: '#f8fafc',
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>🔄 Transfer & Map Tally Item</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '18px' }}>
                Voucher: <strong style={{ color: '#60a5fa' }}>{transferModalInvoice.voucher_number}</strong> ({transferModalInvoice.party_name})
              </p>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Tally Item Name:</div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                  {transferModalInvoice.pending_items?.[0]?.tally_item_name || 'Voucher Item'}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Select Target Module</label>
                <select
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  value={transferModule}
                  onChange={(e) => {
                    setTransferModule(e.target.value);
                    setTransferItemId('');
                  }}
                >
                  <option value="tyre">🏎️ Auto Tyre</option>
                  <option value="cycletyre">🚲 Cycle Tyre</option>
                  <option value="tube">⭕ Cycle Tube</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Select Corresponding ERP Stock Item</label>
                <select
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  value={transferItemId}
                  onChange={(e) => setTransferItemId(e.target.value)}
                >
                  <option value="">-- Choose Item --</option>
                  {transferModule === 'tyre' && stockItems?.tyre_items?.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                  {transferModule === 'cycletyre' && stockItems?.cycletyre_items?.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.label}</option>
                  ))}
                  {transferModule === 'tube' && stockItems?.tube_items?.map(tb => (
                    <option key={tb.id} value={tb.id}>{tb.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setTransferModalInvoice(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  disabled={transferring}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteTransfer}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  }}
                  disabled={transferring || !transferItemId}
                >
                  {transferring ? 'Mapping...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
