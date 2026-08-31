'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

const ITEMS_PER_PAGE = 50;

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
    ledger: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Theme state: 'dark' or 'light'
  const [theme, setTheme] = useState('dark');

  // Load saved theme preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('radhu_tally_theme');
    if (saved) setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('radhu_tally_theme', next);
  };

  // Transfer modal state
  const [transferModalInvoice, setTransferModalInvoice] = useState(null);
  const [transferModule, setTransferModule] = useState('tyre');
  const [transferItemId, setTransferItemId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  // Reset page to 1 whenever search, tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, filters]);

  async function fetchSummary() {
    setLoading(true);
    let query = '?all_months=true&';
    if (filters.party) query += `party=${encodeURIComponent(filters.party)}&`;
    if (filters.ledger) query += `ledger=${encodeURIComponent(filters.ledger)}&`;
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
    setFilters({ party: '', month: '', from_date: '', to_date: '', ledger: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleExecuteTransfer = async () => {
    if (!transferModalInvoice || !transferModule || !transferItemId) {
      alert('Pehle module aur matching item select karo!');
      return;
    }

    setTransferring(true);
    setMessage(null);

    const res = await apiPost('/tallysync/transfer-item/', {
      voucher_number: transferModalInvoice.voucher_number,
      target_module: transferModule,
      target_item_id: Number(transferItemId),
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

  function getInvoiceCategory(inv) {
    if (inv.category && inv.category !== 'all') return inv.category;
    const text = ((inv.items_summary || '') + ' ' + (inv.party_name || '') + ' ' + (inv.raw_payload || '')).toLowerCase();
    if (text.includes('tube') || text.includes('tb') || text.includes('mld') || text.includes('jt')) return 'tube';
    if (text.includes('cycle') && text.includes('tyre')) return 'cycletyre';
    if (text.includes('tyre') || text.includes('tl') || text.includes('radial') || text.includes('nylon')) return 'tyre';
    return 'tyre';
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

  // Active Global Search across ALL invoices in state
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab !== 'all') {
        const cat = getInvoiceCategory(inv);
        if (cat !== activeTab) return false;
      }
      if (filters.ledger) {
        const lq = filters.ledger.toLowerCase();
        const sledger = (inv.sales_ledger || '').toLowerCase();
        const isummary = (inv.items_summary || '').toLowerCase();
        if (!sledger.includes(lq) && !isummary.includes(lq)) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const party = (inv.party_name || '').toLowerCase();
        const vno = (inv.voucher_number || '').toLowerCase();
        const gstin = (inv.party_gstin || '').toLowerCase();
        const state = (inv.state_name || '').toLowerCase();
        const isummary = (inv.items_summary || '').toLowerCase();
        const sledger = (inv.sales_ledger || '').toLowerCase();
        if (!party.includes(q) && !vno.includes(q) && !gstin.includes(q) && !state.includes(q) && !isummary.includes(q) && !sledger.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, activeTab, searchTerm, filters.ledger]);

  // Dynamic real-time totals calculated directly over filtered invoices
  const dynamicTotals = useMemo(() => {
    let total_sale = 0;
    let total_taxable = 0;
    let total_gst = 0;
    let total_pcs = 0;
    let total_cgst = 0;
    let total_sgst = 0;
    let total_igst = 0;

    filteredInvoices.forEach((inv) => {
      total_sale += Number(inv.total_value || 0);
      total_taxable += Number(inv.taxable_value || 0);
      total_gst += Number(inv.gst_total || 0);
      total_pcs += Number(inv.total_pcs || 0);
      total_cgst += Number(inv.cgst || 0);
      total_sgst += Number(inv.sgst || 0);
      total_igst += Number(inv.igst || 0);
    });

    return {
      total_sale,
      total_taxable,
      total_gst,
      total_pcs,
      total_cgst,
      total_sgst,
      total_igst,
    };
  }, [filteredInvoices]);

  // Pagination calculation (50 invoices per page)
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const isDark = theme === 'dark';

  // Dynamic Theme Palette
  const colors = {
    bgMain: isDark ? '#0b1120' : '#f1f5f9',
    cardBg: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1',
    textTitle: isDark ? '#ffffff' : '#0f172a',
    textMain: isDark ? '#f8fafc' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    inputBg: isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
    tableHeaderBg: isDark ? 'rgba(30, 41, 59, 0.9)' : '#f8fafc',
    tableHeaderColor: isDark ? '#94a3b8' : '#475569',
    trHover: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
    badgeText: isDark ? '#cbd5e1' : '#475569',
    kpiBg: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)' : '#ffffff',
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgMain, color: colors.textMain, transition: 'all 0.25s ease' }}>
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
          borderBottom: `1px solid ${colors.cardBorder}`
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: 0,
                color: colors.textTitle,
              }}>
                Tally Prime Vouchers & GST Hub
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
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
            <p style={{ color: colors.textMuted, fontSize: '0.9rem', margin: 0 }}>
              Real-time synchronization for Sales Vouchers, Party GSTIN, Taxable Base, and Inventory Stock Ledger
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                border: `1px solid ${colors.cardBorder}`,
                color: colors.textMain,
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '9px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
              }}
              title="Switch Dark / Light Theme"
            >
              {isDark ? (
                <>
                  <span style={{ color: '#fbbf24', fontSize: '1rem' }}>☀️</span>
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#6366f1', fontSize: '1rem' }}>🌙</span>
                  <span>Dark Mode</span>
                </>
              )}
            </button>

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
                background: colors.inputBg,
                border: `1px solid ${colors.cardBorder}`,
                color: colors.textMain,
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
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
                background: colors.inputBg,
                border: `1px solid ${colors.cardBorder}`,
                color: colors.textMuted,
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
            color: message.type === 'success' ? '#10b981' : '#ef4444',
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
            background: isDark ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)' : '#fffbeb',
            border: '1px solid rgba(245, 158, 11, 0.4)',
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
                color: '#d97706',
                fontSize: '1.1rem'
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: isDark ? '#fbbf24' : '#b45309', fontSize: '0.95rem' }}>
                  {data.unmapped_count} Voucher(s) Require Stock Item Mapping
                </div>
                <div style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Total Sales */}
          <div style={{
            background: colors.kpiBg,
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : '#cbd5e1'}`,
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoiced Sales</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-wallet"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: colors.textTitle, letterSpacing: '-0.02em', marginBottom: '4px' }}>
              ₹{Number(dynamicTotals.total_sale || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>
              Across {filteredInvoices.length} filtered vouchers
            </div>
          </div>

          {/* Total Pieces (Pcs) - NEW KPI CARD */}
          <div style={{
            background: colors.kpiBg,
            border: `1px solid ${isDark ? 'rgba(6, 182, 212, 0.3)' : '#cbd5e1'}`,
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #06b6d4, #22d3ee)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#06b6d4', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <i className="fas fa-cubes mr-1"></i> Total Pieces (Pcs)
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-layer-group"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#06b6d4', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {Number(dynamicTotals.total_pcs || 0).toLocaleString('en-IN')} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textMuted }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>
              Total quantity in selected range
            </div>
          </div>

          {/* Taxable Base */}
          <div style={{
            background: colors.kpiBg,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1'}`,
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #a855f7, #c084fc)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taxable Base Amount</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: colors.textTitle, letterSpacing: '-0.02em', marginBottom: '4px' }}>
              ₹{Number(dynamicTotals.total_taxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>
              Goods value before GST
            </div>
          </div>

          {/* Total GST */}
          <div style={{
            background: colors.kpiBg,
            border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#cbd5e1'}`,
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total GST Collected</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-percentage"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              ₹{Number(dynamicTotals.total_gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: colors.textMuted }}>
              <span>C: ₹{Number(dynamicTotals.total_cgst || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span>•</span>
              <span>S: ₹{Number(dynamicTotals.total_sgst || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span>•</span>
              <span>I: ₹{Number(dynamicTotals.total_igst || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Total Invoices / Sync Status */}
          <div style={{
            background: colors.kpiBg,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1'}`,
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Sync Health</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-boxes"></i>
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: colors.textTitle, letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {((filteredInvoices.length - (data?.unmapped_count || 0)) / (filteredInvoices.length || 1) * 100).toFixed(0)}% Synced
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>
              {filteredInvoices.length - (data?.unmapped_count || 0)} of {filteredInvoices.length} fully updated
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div style={{
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '28px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                <i className="fas fa-search mr-1"></i> Global Search
              </label>
              <input
                type="text"
                placeholder="Party, bill #, GSTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  color: colors.textMain,
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                <i className="fas fa-calendar-alt mr-1"></i> Month Preset
              </label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value, from_date: '', to_date: '' })}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  color: colors.textMain,
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value, month: '' })}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  color: colors.textMain,
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                To Date
              </label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value, month: '' })}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  color: colors.textMain,
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Sales Ledger Filter Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                <i className="fas fa-book mr-1"></i> Sales / GST Ledger
              </label>
              <select
                value={filters.ledger || ''}
                onChange={(e) => setFilters({ ...filters, ledger: e.target.value })}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  color: colors.textMain,
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Sales Ledgers</option>
                {data?.available_ledgers?.map((ledger, idx) => (
                  <option key={idx} value={ledger}>
                    {ledger}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.textMain,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  height: '42px',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className="fas fa-undo mr-1"></i> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? '#2563eb' : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff'),
                color: activeTab === 'all' ? '#ffffff' : colors.textMuted,
                border: `1px solid ${activeTab === 'all' ? '#2563eb' : colors.cardBorder}`,
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🌟 All Invoices</span>
              <span style={{
                background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
              }}>{counts.all}</span>
            </button>

            <button
              onClick={() => setActiveTab('tyre')}
              style={{
                background: activeTab === 'tyre' ? '#2563eb' : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff'),
                color: activeTab === 'tyre' ? '#ffffff' : colors.textMuted,
                border: `1px solid ${activeTab === 'tyre' ? '#2563eb' : colors.cardBorder}`,
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🏎️ Auto Tyre</span>
              <span style={{
                background: activeTab === 'tyre' ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
              }}>{counts.tyre}</span>
            </button>

            <button
              onClick={() => setActiveTab('cycletyre')}
              style={{
                background: activeTab === 'cycletyre' ? '#2563eb' : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff'),
                color: activeTab === 'cycletyre' ? '#ffffff' : colors.textMuted,
                border: `1px solid ${activeTab === 'cycletyre' ? '#2563eb' : colors.cardBorder}`,
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🚴 Cycle Tyre</span>
              <span style={{
                background: activeTab === 'cycletyre' ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
              }}>{counts.cycletyre}</span>
            </button>

            <button
              onClick={() => setActiveTab('tube')}
              style={{
                background: activeTab === 'tube' ? '#2563eb' : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff'),
                color: activeTab === 'tube' ? '#ffffff' : colors.textMuted,
                border: `1px solid ${activeTab === 'tube' ? '#2563eb' : colors.cardBorder}`,
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>⭕ Cycle Tube</span>
              <span style={{
                background: activeTab === 'tube' ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
              }}>{counts.tube}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: colors.textMuted }}>
            Found <strong>{filteredInvoices.length}</strong> matching vouchers (showing 50 per page)
          </div>
        </div>

        {/* Full Edge-to-Edge Vouchers Data Table Card */}
        <div style={{
          background: colors.cardBg,
          backdropFilter: isDark ? 'blur(16px)' : 'none',
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }} className="fa-spin">
                <i className="fas fa-circle-notch"></i>
              </div>
              <div>Fetching Tally Sync Invoices...</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: colors.tableHeaderBg, color: colors.tableHeaderColor, borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>DATE</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>VOUCHER NO.</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>PARTY NAME</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700 }}>GSTIN</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>TAXABLE (₹)</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>GST (₹)</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>TOTAL VALUE (₹)</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'center' }}>TOTAL PCS</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'center' }}>STOCK SYNC</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: `1px solid ${colors.cardBorder}`,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.trHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', color: colors.textMuted, whiteSpace: 'nowrap' }}>
                        {inv.voucher_date}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#2563eb' }}>
                        {inv.voucher_number}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: colors.textMain }}>
                        <div>{inv.party_name || '—'}</div>
                        {inv.items_summary && (
                          <div style={{ color: colors.textMuted, fontSize: '0.75rem', fontWeight: 400, marginTop: '2px' }}>
                            {inv.items_summary}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', color: colors.textMuted, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {inv.party_gstin || '—'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: colors.textMain }}>
                        ₹{Number(inv.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                        ₹{Number(inv.gst_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: colors.textTitle }}>
                        ₹{Number(inv.total_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>
                        {inv.total_pcs > 0 ? `${Number(inv.total_pcs).toLocaleString('en-IN')} pcs` : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {inv.stock_synced ? (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}>
                            ✓ Synced
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link
                            href={`/tallysync/invoice/${inv.id}`}
                            style={{
                              background: 'rgba(37, 99, 235, 0.12)',
                              border: '1px solid rgba(37, 99, 235, 0.3)',
                              color: '#2563eb',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            View Invoice
                          </Link>
                          <button
                            onClick={() => {
                              setTransferModalInvoice(inv);
                              setTransferModule('tyre');
                              setTransferItemId('');
                            }}
                            style={{
                              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                              border: `1px solid ${colors.cardBorder}`,
                              color: colors.textMain,
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Transfer / Remap Item"
                          >
                            Transfer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!filteredInvoices.length && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '50px 20px', color: colors.textMuted }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.textTitle }}>No synced invoices found</div>
                        <div style={{ fontSize: '0.85rem', color: colors.textMuted, marginTop: '4px' }}>
                          Try clearing your search term or month filter.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginator Bar (50 Invoices Per Page) */}
          {filteredInvoices.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderTop: `1px solid ${colors.cardBorder}`,
              background: colors.tableHeaderBg,
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: 500 }}>
                Showing <strong>{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredInvoices.length)}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}</strong> of <strong>{filteredInvoices.length}</strong> invoices
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      background: currentPage === 1 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.08)' : '#ffffff'),
                      border: `1px solid ${colors.cardBorder}`,
                      color: currentPage === 1 ? colors.textMuted : colors.textMain,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      style={{
                        background: currentPage === pg ? '#2563eb' : (isDark ? 'rgba(255,255,255,0.08)' : '#ffffff'),
                        border: `1px solid ${currentPage === pg ? '#2563eb' : colors.cardBorder}`,
                        color: currentPage === pg ? '#ffffff' : colors.textMain,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      background: currentPage === totalPages ? 'transparent' : (isDark ? 'rgba(255,255,255,0.08)' : '#ffffff'),
                      border: `1px solid ${colors.cardBorder}`,
                      color: currentPage === totalPages ? colors.textMuted : colors.textMain,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
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
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              color: colors.textMain,
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700, color: colors.textTitle }}>🔄 Transfer & Map Tally Item</h3>
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '18px' }}>
                Voucher: <strong style={{ color: '#2563eb' }}>{transferModalInvoice.voucher_number}</strong> ({transferModalInvoice.party_name})
              </p>

              <div style={{ background: colors.tableHeaderBg, padding: '14px', borderRadius: '10px', marginBottom: '18px', border: `1px solid ${colors.cardBorder}` }}>
                <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Tally Item Name:</div>
                <div style={{ fontWeight: 700, color: colors.textTitle, fontSize: '0.95rem' }}>
                  {transferModalInvoice.pending_items?.[0]?.tally_item_name || 'Voucher Item'}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted, marginBottom: '6px' }}>Select Target Module</label>
                <select
                  style={{
                    width: '100%',
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '10px',
                    color: colors.textMain,
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted, marginBottom: '6px' }}>Select Corresponding ERP Stock Item</label>
                <select
                  style={{
                    width: '100%',
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '10px',
                    color: colors.textMain,
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
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textMain,
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


