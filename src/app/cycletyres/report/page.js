'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTyreCategoryDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [costPerKg, setCostPerKg] = useState(135);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'rickshaw_nylon', 'rickshaw_ctc', 'cycle_nylon', 'cycle_ctc'
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReport(selectedMonth, costPerKg);
  }, [selectedMonth]);

  const handleCostBlur = () => {
    fetchReport(selectedMonth, costPerKg);
  };

  async function fetchReport(monthVal, costVal) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/cycletyres/category-report/?month=${monthVal}&cost_per_kg=${costVal}`);
      if (res && res.status === 'success') {
        setData(res);
      } else {
        setError('Failed to fetch data from backend');
      }
    } catch (err) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  const grand = data?.grand_totals || {};
  const categories = data?.categories || {};

  // Formatter helpers
  const fNum = (n) => (n ?? 0).toLocaleString('en-IN');
  const fCurr = (n) => '₹' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fRate = (n) => '₹' + (n ?? 0).toFixed(2);
  const fPct = (n) => (n ?? 0).toFixed(1) + '%';

  // Category Tab info
  const catKeys = ['rickshaw_nylon', 'rickshaw_ctc', 'cycle_nylon', 'cycle_ctc'];
  const catColors = {
    rickshaw_nylon: { bg: '#EFF6FF', text: '#1D4ED8', border: '#3B82F6', badge: '#DBEAFE' },
    rickshaw_ctc:   { bg: '#ECFDF5', text: '#047857', border: '#10B981', badge: '#D1FAE5' },
    cycle_nylon:    { bg: '#F5F3FF', text: '#6D28D9', border: '#8B5CF6', badge: '#EDE9FE' },
    cycle_ctc:      { bg: '#FFFBEB', text: '#B45309', border: '#F59E0B', badge: '#FEF3C7' },
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', color: '#0F172A' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '24px 28px', maxWidth: '100%', margin: 0 }}>
        {/* ── HEADER & TOOLBAR ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}>
                🚲
              </div>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0F172A' }}>
                  Cycle & Rickshaw Tyre Category Performance
                </h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                  Managed via Django Admin &bull; 0 Hardcoding &bull; 4 Strategic Segments
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Interactive Cost per Kg input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Cost / Kg:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>₹</span>
              <input
                type="number"
                value={costPerKg}
                onChange={(e) => setCostPerKg(e.target.value)}
                onBlur={handleCostBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleCostBlur()}
                style={{ width: '60px', border: 'none', fontWeight: 700, color: '#0F172A', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>

            {/* Month dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {(data?.available_months || [{ value: '2026-10', label: 'October 2026' }]).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: '90px', background: '#E2E8F0', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: '24px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', color: '#B91C1C', marginBottom: '24px' }}>
            <strong>Error:</strong> {error} &mdash; <button onClick={() => fetchReport(selectedMonth, costPerKg)} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 700 }}>Retry</button>
          </div>
        ) : (
          <>
            {/* ── KPI EXECUTIVE CARDS (6 CARDS) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Production</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>{fNum(grand.production)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>pcs</span></div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>{fNum(grand.first_grade)} (1st) &bull; {fNum(grand.second_grade)} (2nd)</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Dispatches / Sales</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{fNum(grand.sales_pcs)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>pcs</span></div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>Avg Wt: {fNum(grand.sales_wt)} kg</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Sales Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{fCurr(grand.sales_amount)}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>Avg {fRate(grand.avg_rate)}/pc &bull; {fRate(grand.realization_per_kg)}/kg</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated EBITDA</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7C3AED', marginTop: '4px' }}>{fCurr(grand.ebitda)}</div>
                <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 700, marginTop: '2px' }}>EBITDA Margin: {fPct(grand.ebitda_pct)}</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Factory Parchi Weight</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{fNum(data?.factory_actual_parchi_kg)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>kg</span></div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>Theo: {fNum(grand.theo_wt)} kg</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active SKUs in Month</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{grand.active_skus} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>items</span></div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>Across 4 Segments</div>
              </div>
            </div>

            {/* ── EXECUTIVE SUMMARY TABLE (4 CATEGORIES) ── */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '28px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                  📊 Strategic Category Summary &mdash; October 2026 (Live Tally & Plant Data)
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                  Click category tab below to inspect SKU details
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#0F172A', color: '#FFFFFF', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '10px 14px' }}>Category</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Active SKUs</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Production (Pcs)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Theo Wt (Kg)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Est Parchi (Kg)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Sales (Pcs)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Gross Revenue (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Avg Rate (₹/Pc)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Realization (₹/Kg)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>EBITDA (₹)</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catKeys.map((k, idx) => {
                      const cat = categories[k] || {};
                      const t = cat.totals || {};
                      const styleInfo = catColors[k] || {};
                      return (
                        <tr key={k} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: styleInfo.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: styleInfo.border }} />
                            {cat.title}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 600 }}>{t.active_skus}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700 }}>{fNum(t.prod_total)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fNum(t.theo_wt)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fNum(t.est_packing_wt)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700 }}>{fNum(t.sales_pcs)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fCurr(t.sales_amount)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600 }}>{fRate(t.avg_rate)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600 }}>{fRate(t.realization_per_kg)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#7C3AED' }}>{fCurr(t.ebitda)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: (t.ebitda_pct >= 25 ? '#059669' : (t.ebitda_pct >= 15 ? '#D97706' : '#DC2626')) }}>
                            {fPct(t.ebitda_pct)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#E0E7FF', fontWeight: 800, color: '#1E3A8A', borderTop: '2px solid #94A3B8' }}>
                      <td style={{ padding: '12px 14px' }}>GRAND TOTAL</td>
                      <td style={{ padding: '12px 12px', textAlign: 'center' }}>{grand.active_skus}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fNum(grand.production)}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fNum(grand.theo_wt)}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fNum(grand.est_packing_wt)}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fNum(grand.sales_pcs)}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', color: '#047857' }}>{fCurr(grand.sales_amount)}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fRate(grand.avg_rate)}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>{fRate(grand.realization_per_kg)}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', color: '#6D28D9' }}>{fCurr(grand.ebitda)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>{fPct(grand.ebitda_pct)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ── SEGMENT TABS & SKU DETAIL TABLES ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              {/* Category selector pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: activeTab === 'all' ? '#2563EB' : '#CBD5E1',
                    background: activeTab === 'all' ? '#2563EB' : '#FFFFFF',
                    color: activeTab === 'all' ? '#FFFFFF' : '#475569',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  All 4 Tables ({grand.active_skus} Active)
                </button>

                {catKeys.map((k) => {
                  const cat = categories[k] || {};
                  const isSel = activeTab === k;
                  const cInfo = catColors[k];
                  return (
                    <button
                      key={k}
                      onClick={() => setActiveTab(k)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSel ? cInfo.border : '#E2E8F0',
                        background: isSel ? cInfo.bg : '#FFFFFF',
                        color: isSel ? cInfo.text : '#475569',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      {cat.title} ({cat.totals?.active_skus || 0})
                    </button>
                  );
                })}
              </div>

              {/* Search filter */}
              <input
                type="text"
                placeholder="Search SKU / Size / Brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  width: '240px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
            </div>

            {/* RENDER CATEGORY TABLES */}
            {catKeys
              .filter((k) => activeTab === 'all' || activeTab === k)
              .map((catKey) => {
                const cat = categories[catKey];
                if (!cat) return null;
                const cInfo = catColors[catKey] || {};
                const t = cat.totals || {};

                // Filter items by search
                const filteredItems = (cat.items || []).filter((it) => {
                  if (!search) return true;
                  const s = search.toLowerCase();
                  return (
                    (it.sku && it.sku.toLowerCase().includes(s)) ||
                    (it.size && it.size.toLowerCase().includes(s)) ||
                    (it.brand && it.brand.toLowerCase().includes(s)) ||
                    (it.box_type && it.box_type.toLowerCase().includes(s))
                  );
                });

                return (
                  <div key={catKey} style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', background: cInfo.bg, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cInfo.border }} />
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: cInfo.text }}>
                          {cat.title}
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FFFFFF', color: cInfo.text, border: `1px solid ${cInfo.border}` }}>
                          {t.active_skus} Active / {t.sku_count} Total SKUs
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 700, color: cInfo.text }}>
                        <span>Prod: {fNum(t.prod_total)} pcs</span>
                        <span>Sales: {fNum(t.sales_pcs)} pcs</span>
                        <span>Revenue: {fCurr(t.sales_amount)}</span>
                        <span>EBITDA: {fCurr(t.ebitda)} ({fPct(t.ebitda_pct)})</span>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            <th style={{ padding: '8px 12px' }}>#</th>
                            <th style={{ padding: '8px 12px' }}>SKU</th>
                            <th style={{ padding: '8px 12px' }}>Size</th>
                            <th style={{ padding: '8px 12px' }}>Box/Ply</th>
                            <th style={{ padding: '8px 12px' }}>Brand</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Std Wt (kg)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Prod Total</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>1st Grade</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>2nd Grade</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rej</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Theo Wt</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Sales Pcs</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Sales Rev (₹)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Avg Rate</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Realiz/kg</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>EBITDA (₹)</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Margin %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((it, iIdx) => {
                            const isZero = (it.prod_total === 0 && it.sales_pcs === 0);
                            return (
                              <tr
                                key={it.id}
                                style={{
                                  borderBottom: '1px solid #F1F5F9',
                                  backgroundColor: isZero ? '#FAFAFA' : (it.prod_total > 0 ? '#F0F9FF' : (iIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC')),
                                  color: isZero ? '#94A3B8' : '#0F172A',
                                }}
                              >
                                <td style={{ padding: '8px 12px' }}>{iIdx + 1}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{it.sku || '-'}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{it.size}</td>
                                <td style={{ padding: '8px 12px' }}>{it.box_type}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{it.brand}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{it.unit_wt.toFixed(2)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: it.prod_total > 0 ? 800 : 400 }}>{fNum(it.prod_total)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fNum(it.first_grade)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fNum(it.second_grade)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: it.rejected_grade > 0 ? '#DC2626' : 'inherit' }}>{fNum(it.rejected_grade)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fNum(it.theo_wt)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: it.sales_pcs > 0 ? 800 : 400 }}>{fNum(it.sales_pcs)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: it.sales_amount > 0 ? '#059669' : 'inherit' }}>{fCurr(it.sales_amount)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fRate(it.avg_rate)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fRate(it.realization_per_kg)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: it.ebitda > 0 ? '#7C3AED' : (it.ebitda < 0 ? '#DC2626' : 'inherit') }}>{fCurr(it.ebitda)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: (it.ebitda_pct >= 25 ? '#059669' : (it.ebitda_pct >= 15 ? '#D97706' : '#DC2626')) }}>
                                  {it.sales_amount > 0 ? fPct(it.ebitda_pct) : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#F8FAFC', fontWeight: 800, color: '#0F172A', borderTop: '2px solid #CBD5E1' }}>
                            <td colSpan={6} style={{ padding: '10px 12px' }}>Total {cat.title}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#2563EB' }}>{fNum(t.prod_total)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fNum(t.first_grade)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fNum(t.second_grade)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#DC2626' }}>{fNum(t.rejected_grade)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fNum(t.theo_wt)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#0F172A' }}>{fNum(t.sales_pcs)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669' }}>{fCurr(t.sales_amount)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fRate(t.avg_rate)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fRate(t.realization_per_kg)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7C3AED' }}>{fCurr(t.ebitda)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: (t.ebitda_pct >= 25 ? '#059669' : '#D97706') }}>{fPct(t.ebitda_pct)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </main>
    </div>
  );
}
