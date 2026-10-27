'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

const DEPT_HEADERS = [
  { label: 'WORK SHOP', span: 3, bg: '#f1f5f9', color: '#334155' },
  { label: 'BOILER / OFFICE / SWEEPER', span: 3, bg: '#f8fafc', color: '#475569' },
  { label: 'MIXING', span: 6, bg: '#e0f2fe', color: '#0369a1' },
  { label: 'PATTI & DAGHA CALENDER', span: 6, bg: '#fef3c7', color: '#92400e' },
  { label: 'CYCLE TYRE BUILDING', span: 5, bg: '#ecfdf5', color: '#065f46' },
  { label: 'CYCLE TYRE CURING / PRESS', span: 12, bg: '#eff6ff', color: '#1e40af' },
  { label: 'CYCLE TYRE PACKING', span: 7, bg: '#fae8ff', color: '#86198f' },
  { label: 'AUTO TYRE BUILDING & BEAD', span: 5, bg: '#fef2f2', color: '#991b1b' },
  { label: 'AUTO TYRE CURING & PACKING', span: 12, bg: '#fff7ed', color: '#9a3412' },
  { label: 'CYCLE TUBE CURING', span: 5, bg: '#f0fdf4', color: '#166534' },
  { label: 'CYCLE TUBE PACKING', span: 7, bg: '#ecfeff', color: '#155e75' },
  { label: 'PLANT TOTALS', span: 3, bg: '#ede9fe', color: '#5b21b6' },
];

export default function PlantPerformancePage() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'monthly'
  const [month, setMonth] = useState('2026-10');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [savingManual, setSavingManual] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Manual form fields
  const [manualForm, setManualForm] = useState({
    date: '',
    mixing_variation: '',
    calender_prod_kg: '',
    calender_fab_scrap: '',
    calender_com_scrap: '',
    auto_building_prod_num: '',
    auto_building_fab_scrap: '',
    notes: '',
  });

  useEffect(() => {
    fetchDailyData();
  }, [month]);

  async function fetchDailyData() {
    setLoading(true);
    try {
      const [resDaily, resSummary] = await Promise.all([
        apiGet(`/plant-performance/daily/?month=${month}`),
        apiGet(`/plant-performance/summary/?month=${month}`),
      ]);
      if (resDaily && resDaily.rows) {
        setData(resDaily);
      }
      if (resSummary && resSummary.departments) {
        setSummaryData(resSummary);
      }
    } catch (err) {
      console.error('Error fetching plant performance data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEdit(r) {
    setEditRow(r);
    setManualForm({
      date: r.date,
      mixing_variation: r.mix_variation || '',
      calender_prod_kg: r.cal_prod_kg || '',
      calender_fab_scrap: r.cal_fab_scrap || '',
      calender_com_scrap: r.cal_com_scrap || '',
      auto_building_prod_num: r.at_bld_prod_num || '',
      auto_building_fab_scrap: r.at_bld_fab_scrap || '',
      notes: '',
    });
    setSaveSuccessMsg('');
    setEditModalOpen(true);
  }

  async function handleSaveManual(e) {
    e.preventDefault();
    setSavingManual(true);
    setSaveSuccessMsg('');
    try {
      const res = await apiPost('/plant-performance/daily-log/', manualForm);
      if (res && res.id) {
        setSaveSuccessMsg('Entry saved successfully!');
        setTimeout(() => {
          setEditModalOpen(false);
          fetchDailyData();
        }, 600);
      } else {
        alert('Failed to save manual log.');
      }
    } catch (err) {
      alert('Error saving log: ' + err.message);
    } finally {
      setSavingManual(false);
    }
  }

  const rows = data?.rows || [];
  const totals = data?.totals || {};

  return (
    <>
      <Navbar />
      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 28px', color: '#0f172a' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>
                MIS PORTAL
              </span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Plant Performance Tracking
              </h1>
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Automated daily manufacturing tracking across all plant departments
            </p>
          </div>

          {/* Month selector & Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '4px 8px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '8px' }}>MONTH:</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ border: 'none', outline: 'none', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', background: 'transparent' }}
              />
            </div>

            {/* Tab switchers */}
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '10px', padding: '3px' }}>
              <button
                onClick={() => setActiveTab('daily')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === 'daily' ? '#fff' : 'transparent',
                  color: activeTab === 'daily' ? '#1e293b' : '#64748b',
                  boxShadow: activeTab === 'daily' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Daily Performance (78 Cols)
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === 'monthly' ? '#fff' : 'transparent',
                  color: activeTab === 'monthly' ? '#1e293b' : '#64748b',
                  boxShadow: activeTab === 'monthly' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Monthly Summary Rollup
              </button>
            </div>

            <button
              onClick={fetchDailyData}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-sync-alt" style={{ marginRight: '6px' }}></i> Refresh
            </button>
          </div>
        </div>

        {/* Top KPI Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Cycle Tyre Curing</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1e40af', marginTop: '4px' }}>
              {(totals?.ct_cur_prod_num || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
              Avg Output: {totals?.ct_cur_avg_prod || 0} / worker
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Auto Tyre Curing</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#c2410c', marginTop: '4px' }}>
              {(totals?.at_cur_prod_num || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
              Avg Output: {totals?.at_cur_avg_prod || 0} / worker
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Cycle Tube Curing</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {(totals?.tb_cur_prod_num || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pcs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
              Avg Output: {totals?.tb_cur_avg_prod || 0} / worker
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Mixing Compound</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0369a1', marginTop: '4px' }}>
              {(totals?.mix_final || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              Actual: {(totals?.mix_actual || 0).toLocaleString()} kg
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Plant Manpower</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#5b21b6', marginTop: '4px' }}>
              {totals?.total_mp || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>present</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 700, marginTop: '2px' }}>
              OT: {totals?.total_ot || 0} hrs | Ave: {totals?.total_ave || 0}
            </div>
          </div>
        </div>

        {/* Content based on Active Tab */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '80px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#3b82f6', marginBottom: '14px', display: 'block' }}></i>
            <div style={{ fontWeight: 700, color: '#475569' }}>Loading Plant Performance Data...</div>
          </div>
        ) : activeTab === 'monthly' ? (
          /* =========================================================================
             TAB 2: MONTHLY ROLLUP SUMMARY (Sheet1)
             ========================================================================= */
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Department Monthly Performance Rollup — {data?.month_name} {data?.year}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Aggregate summary of all manufacturing units and manpower efficiency
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>DEPARTMENT</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>TOTAL MANPOWER</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>TOTAL OVERTIME (HRS)</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>AVE. ATTENDANCE</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>TOTAL PRODUCTION</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>AVG OUTPUT / MANPOWER</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData?.departments?.map((dept, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 800, color: '#1e293b' }}>{dept.name}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>{dept.manpower_total}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: '#d97706' }}>{dept.ot_total}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{dept.ave_att}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>{dept.prod_units}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 900, color: '#7c3aed' }}>{dept.avg_per_manpower}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1', fontWeight: 900 }}>
                    <td style={{ padding: '16px 20px', color: '#0f172a' }}>TOTAL PLANT</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#0f172a' }}>{summaryData?.total_manpower}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#d97706' }}>{summaryData?.total_ot}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#2563eb' }}>{summaryData?.total_ave_att}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#059669' }}>-</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#7c3aed' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* =========================================================================
             TAB 1: COMPLETE 78-COLUMN DAILY TRACKING SHEET
             ========================================================================= */
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>
                  Daily Tracking Sheet — {data?.month_name} {data?.year}
                </span>
                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
                  {rows.length} Working Days
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Tip: Click on <span style={{ color: '#2563eb', fontWeight: 700 }}>Edit</span> in any row to enter manual scrap, variation, or building counts
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                {/* TIER 1 HEADER: Department Groups */}
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 12 }}>
                    {/* Fixed sticky column */}
                    <th style={{ position: 'sticky', left: 0, zIndex: 20, background: '#1e293b', color: '#fff', padding: '10px 14px', borderRight: '2px solid #0f172a', fontWeight: 900, minWidth: '100px' }}>
                      DATE
                    </th>
                    <th style={{ position: 'sticky', left: '100px', zIndex: 20, background: '#1e293b', color: '#fff', padding: '10px 10px', borderRight: '2px solid #0f172a', fontWeight: 900, minWidth: '50px' }}>
                      DAY
                    </th>
                    <th style={{ background: '#334155', color: '#fff', padding: '10px 10px', fontWeight: 800, minWidth: '60px', textAlign: 'center' }}>
                      ACTION
                    </th>

                    {/* Department Super Headers */}
                    {DEPT_HEADERS.map((dh, i) => (
                      <th
                        key={i}
                        colSpan={dh.span}
                        style={{
                          background: dh.bg,
                          color: dh.color,
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                          letterSpacing: '0.04em',
                          borderRight: '2px solid #cbd5e1',
                          borderBottom: '1px solid #cbd5e1',
                        }}
                      >
                        {dh.label}
                      </th>
                    ))}
                  </tr>

                  {/* TIER 2 HEADER: Column Names */}
                  <tr style={{ position: 'sticky', top: '37px', zIndex: 11, background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    {/* Fixed date placeholder */}
                    <th style={{ position: 'sticky', left: 0, zIndex: 20, background: '#f1f5f9', padding: '8px 10px', borderRight: '2px solid #cbd5e1' }}></th>
                    <th style={{ position: 'sticky', left: '100px', zIndex: 20, background: '#f1f5f9', padding: '8px 8px', borderRight: '2px solid #cbd5e1' }}></th>
                    <th style={{ background: '#f1f5f9', padding: '8px 8px', borderRight: '1px solid #e2e8f0' }}></th>

                    {/* WORK SHOP */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVE. ATT.</th>

                    {/* BOILER */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVE. ATT.</th>

                    {/* MIXING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#e0f2fe' }}>ACTUAL</th>
                    <th style={{ ...thStyle, background: '#e0f2fe' }}>FINAL</th>
                    <th style={{ ...thStyle, background: '#e0f2fe', borderRight: '2px solid #cbd5e1' }}>VARIATION</th>

                    {/* CALENDER */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#fef3c7' }}>PROD KG</th>
                    <th style={{ ...thStyle, background: '#fef3c7' }}>FAB SCRAP</th>
                    <th style={{ ...thStyle, background: '#fef3c7', borderRight: '2px solid #cbd5e1' }}>COM SCRAP</th>

                    {/* CT BUILDING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#ecfdf5' }}>PROD KG</th>
                    <th style={{ ...thStyle, background: '#ecfdf5', borderRight: '2px solid #cbd5e1' }}>FAB SCRAP</th>

                    {/* CT CURING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#eff6ff', fontWeight: 900 }}>PROD NUM</th>
                    <th style={thStyle}>PACK NUM</th>
                    <th style={thStyle}>THEO KG</th>
                    <th style={thStyle}>PACKING KG</th>
                    <th style={thStyle}>VARIATION</th>
                    <th style={thStyle}>REJECTION</th>
                    <th style={thStyle}>AVG PROD</th>
                    <th style={thStyle}>AVG THEO</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVG PACK</th>

                    {/* CT PACKING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#fae8ff', fontWeight: 900 }}>PROD NUM</th>
                    <th style={thStyle}>PROD KG</th>
                    <th style={thStyle}>AVG PROD</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVG KG</th>

                    {/* AT BUILDING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#fef2f2', fontWeight: 900 }}>PROD NUM</th>
                    <th style={{ ...thStyle, background: '#fef2f2', borderRight: '2px solid #cbd5e1' }}>FAB SCRAP</th>

                    {/* AT CURING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#fff7ed', fontWeight: 900 }}>CURING PROD</th>
                    <th style={thStyle}>PACKING NUM</th>
                    <th style={thStyle}>THEO KG</th>
                    <th style={thStyle}>PACKING KG</th>
                    <th style={thStyle}>VARIATION</th>
                    <th style={thStyle}>REJECTION</th>
                    <th style={thStyle}>AVG PROD</th>
                    <th style={thStyle}>AVG THEO</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVG PACK</th>

                    {/* TUBE CURING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#f0fdf4', fontWeight: 900 }}>PROD NUM</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>WASTAGE</th>

                    {/* TUBE PACKING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#ecfeff', fontWeight: 900 }}>PACK PROD</th>
                    <th style={thStyle}>PACKING KG</th>
                    <th style={thStyle}>AVG PROD</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVG KG</th>

                    {/* PLANT TOTAL */}
                    <th style={{ ...thStyle, background: '#ede9fe', fontWeight: 900 }}>TOTAL MP</th>
                    <th style={{ ...thStyle, background: '#ede9fe', fontWeight: 900 }}>TOTAL OT</th>
                    <th style={{ ...thStyle, background: '#ede9fe', fontWeight: 900 }}>TOTAL AVE</th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>
                  {rows.map((r, i) => {
                    const isSun = r.day === 'Sun';
                    const rowBg = isSun ? '#fef2f2' : i % 2 === 0 ? '#fff' : '#f8fafc';
                    return (
                      <tr key={r.date} style={{ background: rowBg }}>
                        {/* Sticky Date */}
                        <td style={{ position: 'sticky', left: 0, zIndex: 10, background: rowBg, padding: '7px 10px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#1e293b' }}>
                          {r.date}
                        </td>
                        {/* Sticky Day */}
                        <td style={{ position: 'sticky', left: '100px', zIndex: 10, background: rowBg, padding: '7px 8px', borderRight: '2px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: isSun ? '#dc2626' : '#64748b' }}>
                          {r.day}
                        </td>
                        {/* Edit Button */}
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            style={{
                              background: r.has_manual ? '#dbeafe' : '#f1f5f9',
                              color: r.has_manual ? '#1d4ed8' : '#475569',
                              border: '1px solid #cbd5e1',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {r.has_manual ? 'Edit *' : 'Edit'}
                          </button>
                        </td>

                        {/* WORK SHOP */}
                        <td style={tdNum}>{r.ws_mp || '-'}</td>
                        <td style={tdNum}>{r.ws_ot || '-'}</td>
                        <td style={{ ...tdNum, borderRight: '2px solid #cbd5e1', fontWeight: 700 }}>{r.ws_ave || '-'}</td>

                        {/* BOILER */}
                        <td style={tdNum}>{r.bo_mp || '-'}</td>
                        <td style={tdNum}>{r.bo_ot || '-'}</td>
                        <td style={{ ...tdNum, borderRight: '2px solid #cbd5e1', fontWeight: 700 }}>{r.bo_ave || '-'}</td>

                        {/* MIXING */}
                        <td style={tdNum}>{r.mix_mp || '-'}</td>
                        <td style={tdNum}>{r.mix_ot || '-'}</td>
                        <td style={tdNum}>{r.mix_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#f0f9ff' }}>{r.mix_actual ? r.mix_actual.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, background: '#f0f9ff', fontWeight: 800, color: '#0369a1' }}>{r.mix_final ? r.mix_final.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, background: '#f0f9ff', borderRight: '2px solid #cbd5e1', color: r.mix_variation ? '#b45309' : '#94a3b8' }}>{r.mix_variation || '-'}</td>

                        {/* CALENDER */}
                        <td style={tdNum}>{r.cal_mp || '-'}</td>
                        <td style={tdNum}>{r.cal_ot || '-'}</td>
                        <td style={tdNum}>{r.cal_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#fffbeb', fontWeight: 700 }}>{r.cal_prod_kg ? r.cal_prod_kg.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, background: '#fffbeb' }}>{r.cal_fab_scrap || '-'}</td>
                        <td style={{ ...tdNum, background: '#fffbeb', borderRight: '2px solid #cbd5e1' }}>{r.cal_com_scrap || '-'}</td>

                        {/* CT BUILDING */}
                        <td style={tdNum}>{r.ct_bld_mp || '-'}</td>
                        <td style={tdNum}>{r.ct_bld_ot || '-'}</td>
                        <td style={tdNum}>{r.ct_bld_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#f0fdf4', fontWeight: 700 }}>{r.ct_bld_prod_kg ? r.ct_bld_prod_kg.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, background: '#f0fdf4', borderRight: '2px solid #cbd5e1' }}>{r.ct_bld_fab_scrap || '-'}</td>

                        {/* CT CURING */}
                        <td style={tdNum}>{r.ct_cur_mp || '-'}</td>
                        <td style={tdNum}>{r.ct_cur_ot || '-'}</td>
                        <td style={tdNum}>{r.ct_cur_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#eff6ff', fontWeight: 900, color: '#1d4ed8' }}>{r.ct_cur_prod_num ? r.ct_cur_prod_num.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.ct_cur_pack_num ? r.ct_cur_pack_num.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.ct_cur_theo_kg ? r.ct_cur_theo_kg.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.ct_cur_pack_kg ? r.ct_cur_pack_kg.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, color: r.ct_cur_variation < 0 ? '#dc2626' : '#16a34a' }}>{r.ct_cur_variation || '-'}</td>
                        <td style={tdNum}>{r.ct_cur_rejection || '-'}</td>
                        <td style={{ ...tdNum, fontWeight: 700 }}>{r.ct_cur_avg_prod || '-'}</td>
                        <td style={tdNum}>{r.ct_cur_avg_theo || '-'}</td>
                        <td style={{ ...tdNum, borderRight: '2px solid #cbd5e1' }}>{r.ct_cur_avg_pack_kg || '-'}</td>

                        {/* CT PACKING */}
                        <td style={tdNum}>{r.ct_pck_mp || '-'}</td>
                        <td style={tdNum}>{r.ct_pck_ot || '-'}</td>
                        <td style={tdNum}>{r.ct_pck_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#fae8ff', fontWeight: 900, color: '#86198f' }}>{r.ct_pck_prod_num ? r.ct_pck_prod_num.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.ct_pck_prod_kg ? r.ct_pck_prod_kg.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, fontWeight: 700 }}>{r.ct_pck_avg_prod || '-'}</td>
                        <td style={{ ...tdNum, borderRight: '2px solid #cbd5e1' }}>{r.ct_pck_avg_kg || '-'}</td>

                        {/* AT BUILDING */}
                        <td style={tdNum}>{r.at_bld_mp || '-'}</td>
                        <td style={tdNum}>{r.at_bld_ot || '-'}</td>
                        <td style={tdNum}>{r.at_bld_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#fef2f2', fontWeight: 900, color: '#b91c1c' }}>{r.at_bld_prod_num ? r.at_bld_prod_num.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, background: '#fef2f2', borderRight: '2px solid #cbd5e1' }}>{r.at_bld_fab_scrap || '-'}</td>

                        {/* AT CURING */}
                        <td style={tdNum}>{r.at_cur_mp || '-'}</td>
                        <td style={tdNum}>{r.at_cur_ot || '-'}</td>
                        <td style={tdNum}>{r.at_cur_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#fff7ed', fontWeight: 900, color: '#c2410c' }}>{r.at_cur_prod_num ? r.at_cur_prod_num.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.at_cur_pack_num ? r.at_cur_pack_num.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.at_cur_theo_kg ? r.at_cur_theo_kg.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.at_cur_pack_kg ? r.at_cur_pack_kg.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, color: r.at_cur_variation < 0 ? '#dc2626' : '#16a34a' }}>{r.at_cur_variation || '-'}</td>
                        <td style={tdNum}>{r.at_cur_rejection || '-'}</td>
                        <td style={{ ...tdNum, fontWeight: 700 }}>{r.at_cur_avg_prod || '-'}</td>
                        <td style={tdNum}>{r.at_cur_avg_theo || '-'}</td>
                        <td style={{ ...tdNum, borderRight: '2px solid #cbd5e1' }}>{r.at_cur_avg_pack_kg || '-'}</td>

                        {/* TUBE CURING */}
                        <td style={tdNum}>{r.tb_cur_mp || '-'}</td>
                        <td style={tdNum}>{r.tb_cur_ot || '-'}</td>
                        <td style={tdNum}>{r.tb_cur_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#f0fdf4', fontWeight: 900, color: '#15803d' }}>{r.tb_cur_prod_num ? r.tb_cur_prod_num.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, borderRight: '2px solid #cbd5e1' }}>{r.tb_cur_wastage || '-'}</td>

                        {/* TUBE PACKING */}
                        <td style={tdNum}>{r.tb_pck_mp || '-'}</td>
                        <td style={tdNum}>{r.tb_pck_ot || '-'}</td>
                        <td style={tdNum}>{r.tb_pck_ave || '-'}</td>
                        <td style={{ ...tdNum, background: '#ecfeff', fontWeight: 900, color: '#0e7490' }}>{r.tb_pck_pack_prod ? r.tb_pck_pack_prod.toLocaleString() : '-'}</td>
                        <td style={tdNum}>{r.tb_pck_pack_kg ? r.tb_pck_pack_kg.toLocaleString() : '-'}</td>
                        <td style={{ ...tdNum, fontWeight: 700 }}>{r.tb_pck_avg_prod || '-'}</td>
                        <td style={{ ...tdNum, borderRight: '2px solid #cbd5e1' }}>{r.tb_pck_avg_kg || '-'}</td>

                        {/* TOTALS */}
                        <td style={{ ...tdNum, background: '#f5f3ff', fontWeight: 800 }}>{r.total_mp || '-'}</td>
                        <td style={{ ...tdNum, background: '#f5f3ff', fontWeight: 800 }}>{r.total_ot || '-'}</td>
                        <td style={{ ...tdNum, background: '#f5f3ff', fontWeight: 900, color: '#5b21b6' }}>{r.total_ave || '-'}</td>
                      </tr>
                    );
                  })}

                  {/* BOTTOM TOTAL / SUMMARY ROW */}
                  <tr style={{ position: 'sticky', bottom: 0, zIndex: 15, background: '#1e293b', color: '#fff', fontWeight: 900 }}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 25, background: '#1e293b', color: '#fff', padding: '12px 10px', borderRight: '1px solid #334155' }}>
                      TOTAL
                    </td>
                    <td style={{ position: 'sticky', left: '100px', zIndex: 25, background: '#1e293b', color: '#fff', padding: '12px 8px', borderRight: '2px solid #334155' }}>
                      -
                    </td>
                    <td style={{ background: '#1e293b', borderRight: '1px solid #334155' }}></td>

                    {/* WORK SHOP */}
                    <td style={tdTot}>{totals.ws_mp}</td>
                    <td style={tdTot}>{totals.ws_ot}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.ws_ave}</td>

                    {/* BOILER */}
                    <td style={tdTot}>{totals.bo_mp}</td>
                    <td style={tdTot}>{totals.bo_ot}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.bo_ave}</td>

                    {/* MIXING */}
                    <td style={tdTot}>{totals.mix_mp}</td>
                    <td style={tdTot}>{totals.mix_ot}</td>
                    <td style={tdTot}>{totals.mix_ave}</td>
                    <td style={tdTot}>{(totals.mix_actual || 0).toLocaleString()}</td>
                    <td style={{ ...tdTot, color: '#38bdf8' }}>{(totals.mix_final || 0).toLocaleString()}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{(totals.mix_variation || 0).toLocaleString()}</td>

                    {/* CALENDER */}
                    <td style={tdTot}>{totals.cal_mp}</td>
                    <td style={tdTot}>{totals.cal_ot}</td>
                    <td style={tdTot}>{totals.cal_ave}</td>
                    <td style={tdTot}>{(totals.cal_prod_kg || 0).toLocaleString()}</td>
                    <td style={tdTot}>{totals.cal_fab_scrap}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.cal_com_scrap}</td>

                    {/* CT BUILDING */}
                    <td style={tdTot}>{totals.ct_bld_mp}</td>
                    <td style={tdTot}>{totals.ct_bld_ot}</td>
                    <td style={tdTot}>{totals.ct_bld_ave}</td>
                    <td style={tdTot}>{(totals.ct_bld_prod_kg || 0).toLocaleString()}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.ct_bld_fab_scrap}</td>

                    {/* CT CURING */}
                    <td style={tdTot}>{totals.ct_cur_mp}</td>
                    <td style={tdTot}>{totals.ct_cur_ot}</td>
                    <td style={tdTot}>{totals.ct_cur_ave}</td>
                    <td style={{ ...tdTot, color: '#60a5fa' }}>{(totals.ct_cur_prod_num || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.ct_cur_pack_num || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.ct_cur_theo_kg || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.ct_cur_pack_kg || 0).toLocaleString()}</td>
                    <td style={tdTot}>{totals.ct_cur_variation}</td>
                    <td style={tdTot}>{totals.ct_cur_rejection}</td>
                    <td style={tdTot}>{totals.ct_cur_avg_prod}</td>
                    <td style={tdTot}>{totals.ct_cur_avg_theo}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.ct_cur_avg_pack_kg}</td>

                    {/* CT PACKING */}
                    <td style={tdTot}>{totals.ct_pck_mp}</td>
                    <td style={tdTot}>{totals.ct_pck_ot}</td>
                    <td style={tdTot}>{totals.ct_pck_ave}</td>
                    <td style={{ ...tdTot, color: '#e879f9' }}>{(totals.ct_pck_prod_num || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.ct_pck_prod_kg || 0).toLocaleString()}</td>
                    <td style={tdTot}>{totals.ct_pck_avg_prod}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.ct_pck_avg_kg}</td>

                    {/* AT BUILDING */}
                    <td style={tdTot}>{totals.at_bld_mp}</td>
                    <td style={tdTot}>{totals.at_bld_ot}</td>
                    <td style={tdTot}>{totals.at_bld_ave}</td>
                    <td style={{ ...tdTot, color: '#f87171' }}>{(totals.at_bld_prod_num || 0).toLocaleString()}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.at_bld_fab_scrap}</td>

                    {/* AT CURING */}
                    <td style={tdTot}>{totals.at_cur_mp}</td>
                    <td style={tdTot}>{totals.at_cur_ot}</td>
                    <td style={tdTot}>{totals.at_cur_ave}</td>
                    <td style={{ ...tdTot, color: '#fb923c' }}>{(totals.at_cur_prod_num || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.at_cur_pack_num || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.at_cur_theo_kg || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.at_cur_pack_kg || 0).toLocaleString()}</td>
                    <td style={tdTot}>{totals.at_cur_variation}</td>
                    <td style={tdTot}>{totals.at_cur_rejection}</td>
                    <td style={tdTot}>{totals.at_cur_avg_prod}</td>
                    <td style={tdTot}>{totals.at_cur_avg_theo}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.at_cur_avg_pack_kg}</td>

                    {/* TUBE CURING */}
                    <td style={tdTot}>{totals.tb_cur_mp}</td>
                    <td style={tdTot}>{totals.tb_cur_ot}</td>
                    <td style={tdTot}>{totals.tb_cur_ave}</td>
                    <td style={{ ...tdTot, color: '#4ade80' }}>{(totals.tb_cur_prod_num || 0).toLocaleString()}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.tb_cur_wastage}</td>

                    {/* TUBE PACKING */}
                    <td style={tdTot}>{totals.tb_pck_mp}</td>
                    <td style={tdTot}>{totals.tb_pck_ot}</td>
                    <td style={tdTot}>{totals.tb_pck_ave}</td>
                    <td style={{ ...tdTot, color: '#22d3ee' }}>{(totals.tb_pck_pack_prod || 0).toLocaleString()}</td>
                    <td style={tdTot}>{(totals.tb_pck_pack_kg || 0).toLocaleString()}</td>
                    <td style={tdTot}>{totals.tb_pck_avg_prod}</td>
                    <td style={{ ...tdTot, borderRight: '2px solid #64748b' }}>{totals.tb_pck_avg_kg}</td>

                    {/* PLANT TOTALS */}
                    <td style={tdTot}>{totals.total_mp}</td>
                    <td style={tdTot}>{totals.total_ot}</td>
                    <td style={{ ...tdTot, color: '#a78bfa' }}>{totals.total_ave}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            DAILY MANUAL OVERRIDE MODAL
            ========================================================================= */}
        {editModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '560px',
                padding: '24px 28px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Daily Manual Entry — {manualForm.date}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Update manual scrap, variation, or green tyre counts for this date
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800, color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {saveSuccessMsg && (
                <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', fontWeight: 700, marginBottom: '16px' }}>
                  {saveSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveManual} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Mixing Variation */}
                  <div>
                    <label style={modalLbl}>Mixing Variation (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 960 (Multiples of 240)"
                      value={manualForm.mixing_variation}
                      onChange={(e) => setManualForm({ ...manualForm, mixing_variation: e.target.value })}
                      style={modalInp}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Reclaim/masterbatch addition</span>
                  </div>

                  {/* Auto Tyre Building Prod */}
                  <div>
                    <label style={modalLbl}>Auto Tyre Green Built (Pcs)</label>
                    <input
                      type="number"
                      placeholder="e.g. 780"
                      value={manualForm.auto_building_prod_num}
                      onChange={(e) => setManualForm({ ...manualForm, auto_building_prod_num: e.target.value })}
                      style={modalInp}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Green tyres built today</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Auto Tyre Building Fab Scrap */}
                  <div>
                    <label style={modalLbl}>Auto Building Fab Scrap (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={manualForm.auto_building_fab_scrap}
                      onChange={(e) => setManualForm({ ...manualForm, auto_building_fab_scrap: e.target.value })}
                      style={modalInp}
                    />
                  </div>

                  {/* Calender Prod Kg */}
                  <div>
                    <label style={modalLbl}>Calender Prod (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Patti & Dagha rolls weight"
                      value={manualForm.calender_prod_kg}
                      onChange={(e) => setManualForm({ ...manualForm, calender_prod_kg: e.target.value })}
                      style={modalInp}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Calender Fab Scrap */}
                  <div>
                    <label style={modalLbl}>Calender Fab Scrap (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={manualForm.calender_fab_scrap}
                      onChange={(e) => setManualForm({ ...manualForm, calender_fab_scrap: e.target.value })}
                      style={modalInp}
                    />
                  </div>

                  {/* Calender Com Scrap */}
                  <div>
                    <label style={modalLbl}>Calender Compound Scrap (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={manualForm.calender_com_scrap}
                      onChange={(e) => setManualForm({ ...manualForm, calender_com_scrap: e.target.value })}
                      style={modalInp}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={modalLbl}>Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="Optional remarks for shift or variance..."
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    style={modalInp}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingManual}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2563eb',
                      fontWeight: 800,
                      color: '#fff',
                      cursor: savingManual ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingManual ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const thStyle = {
  padding: '8px 10px',
  textAlign: 'right',
  fontWeight: 800,
  fontSize: '0.7rem',
  color: '#475569',
  borderRight: '1px solid #e2e8f0',
  letterSpacing: '0.02em',
};

const tdNum = {
  padding: '7px 10px',
  textAlign: 'right',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  fontWeight: 600,
  color: '#334155',
};

const tdTot = {
  padding: '12px 10px',
  textAlign: 'right',
  borderRight: '1px solid #334155',
  fontWeight: 800,
};

const modalLbl = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 800,
  color: '#334155',
  marginBottom: '5px',
};

const modalInp = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
};
