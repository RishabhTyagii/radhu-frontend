'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Disciplined, executive industrial header color scheme (Anti-slop: No candy pastels)
const DEPT_SUPER_HEADERS = [
  { label: 'WORK SHOP', span: 3, bg: '#1e293b', color: '#f8fafc' },
  { label: 'BOILER / OFFICE / SWEEPER', span: 3, bg: '#334155', color: '#f8fafc' },
  { label: 'MIXING MILL', span: 6, bg: '#0369a1', color: '#ffffff' },
  { label: 'PATTI & DAGHA CALENDER', span: 6, bg: '#b45309', color: '#ffffff' },
  { label: 'CYCLE TYRE BUILDING', span: 5, bg: '#047857', color: '#ffffff' },
  { label: 'CYCLE TYRE CURING / PRESS', span: 12, bg: '#1d4ed8', color: '#ffffff' },
  { label: 'CYCLE TYRE PACKING', span: 7, bg: '#6d28d9', color: '#ffffff' },
  { label: 'AUTO TYRE BUILDING', span: 5, bg: '#b91c1c', color: '#ffffff' },
  { label: 'AUTO TYRE CURING & PACKING', span: 12, bg: '#c2410c', color: '#ffffff' },
  { label: 'CYCLE TUBE CURING', span: 5, bg: '#15803d', color: '#ffffff' },
  { label: 'CYCLE TUBE PACKING', span: 7, bg: '#0e7490', color: '#ffffff' },
  { label: 'PLANT TOTALS', span: 3, bg: '#0f172a', color: '#38bdf8' },
];

export default function PlantPerformancePage() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'daily' | 'monthly'
  const [month, setMonth] = useState('2026-10');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [chartMetric, setChartMetric] = useState('all'); // 'all' | 'cycle_tyre' | 'auto_tyre' | 'tube' | 'mixing'
  
  // Manual edit modal state
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
    fetchAllData();
  }, [month]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [resDaily, resSummary, resAnalytics] = await Promise.all([
        apiGet(`/plant-performance/daily/?month=${month}`),
        apiGet(`/plant-performance/summary/?month=${month}`),
        apiGet(`/plant-performance/analytics/?month=${month}`),
      ]);
      if (resDaily && resDaily.rows) {
        setData(resDaily);
      }
      if (resSummary && resSummary.departments) {
        setSummaryData(resSummary);
      }
      if (resAnalytics && resAnalytics.status === 'success') {
        setAnalyticsData(resAnalytics);
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
        setSaveSuccessMsg('Log saved successfully!');
        setTimeout(() => {
          setEditModalOpen(false);
          fetchAllData();
        }, 500);
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
  const mom = analyticsData?.mom_comparison || {};
  const plantSum = analyticsData?.plant_summaries || {};
  const trends = analyticsData?.daily_trends || [];
  const anomalies = analyticsData?.anomalies || [];
  const bottlenecks = analyticsData?.bottlenecks || [];
  const recommendations = analyticsData?.recommendations || [];

  // Chart Data Preparation
  const chartData = useMemo(() => {
    if (!trends.length) return null;
    const labels = trends.map((t) => t.date.slice(8, 10)); // Just day numbers for cleaner X axis

    if (chartMetric === 'cycle_tyre') {
      return {
        labels,
        datasets: [
          {
            label: 'Cycle Tyre Curing (Pcs)',
            data: trends.map((t) => t.cycle_tyre),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            fill: true,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 2,
          },
        ],
      };
    }

    if (chartMetric === 'auto_tyre') {
      return {
        labels,
        datasets: [
          {
            label: 'Auto Tyre Curing (Pcs)',
            data: trends.map((t) => t.auto_tyre),
            borderColor: '#ea580c',
            backgroundColor: 'rgba(234, 88, 12, 0.08)',
            fill: true,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 2,
          },
        ],
      };
    }

    if (chartMetric === 'tube') {
      return {
        labels,
        datasets: [
          {
            label: 'Cycle Tube Curing (Pcs)',
            data: trends.map((t) => t.tube),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.08)',
            fill: true,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 2,
          },
        ],
      };
    }

    if (chartMetric === 'mixing') {
      return {
        labels,
        datasets: [
          {
            label: 'Mixing Final Compound (Kg)',
            data: trends.map((t) => t.mixing_kg),
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            fill: true,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 2,
          },
        ],
      };
    }

    // Default 'all': Stacked/Multi-line
    return {
      labels,
      datasets: [
        {
          label: 'Cycle Tyre Curing',
          data: trends.map((t) => t.cycle_tyre),
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
        },
        {
          label: 'Auto Tyre Curing',
          data: trends.map((t) => t.auto_tyre),
          borderColor: '#ea580c',
          backgroundColor: '#ea580c',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
        },
        {
          label: 'Cycle Tube Curing',
          data: trends.map((t) => t.tube),
          borderColor: '#16a34a',
          backgroundColor: '#16a34a',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
        },
        {
          label: '7-Day Rolling Avg (Total Tyres)',
          data: trends.map((t) => t.rolling_7d_avg),
          borderColor: '#0f172a',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    };
  }, [trends, chartMetric]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { family: "'Segoe UI', -apple-system, sans-serif", size: 11, weight: '600' },
          color: '#334155',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: '700' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10, weight: '600' }, color: '#64748b' },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10, weight: '600' }, color: '#64748b' },
      },
    },
  };

  const thStyle = {
    padding: '7px 8px',
    borderRight: '1px solid #e2e8f0',
    textAlign: 'right',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#475569',
    background: '#f8fafc',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <Navbar />
      <div style={{ background: '#f8fafc', minHeight: '100dvh', padding: '24px 32px', color: '#0f172a', fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
        
        {/* =========================================================================
            TOP CONTROL BAR & METADATA
            ========================================================================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#0f172a', color: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                PLANT MIS
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Manufacturing Intelligence System
              </h1>
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Multi-plant production trajectory, material yield, manpower velocity, and bottleneck tracking
            </p>
          </div>

          {/* Month selector & Action tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Month Filter */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginRight: '8px' }}>MONTH:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ border: 'none', outline: 'none', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', background: 'transparent' }}
              />
            </div>

            {/* Segment Tab Controls */}
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '6px', padding: '3px' }}>
              <button
                onClick={() => setActiveTab('analytics')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'analytics' ? '#fff' : 'transparent',
                  color: activeTab === 'analytics' ? '#0f172a' : '#475569',
                  boxShadow: activeTab === 'analytics' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Executive Analytics
              </button>
              <button
                onClick={() => setActiveTab('daily')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'daily' ? '#fff' : 'transparent',
                  color: activeTab === 'daily' ? '#0f172a' : '#475569',
                  boxShadow: activeTab === 'daily' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Daily Master Sheet (78 Cols)
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'monthly' ? '#fff' : 'transparent',
                  color: activeTab === 'monthly' ? '#0f172a' : '#475569',
                  boxShadow: activeTab === 'monthly' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Department Rollup
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchAllData}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                padding: '7px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>↻</span> Refresh
            </button>
          </div>
        </div>

        {/* =========================================================================
            MAIN CONTENT AREA
            ========================================================================= */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '100px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>Retrieving Live Plant Data...</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Calculating 78 manufacturing telemetry channels across Mixing, Tyre & Tube units</div>
          </div>
        ) : activeTab === 'analytics' ? (
          /* =========================================================================
             TAB 1: ADVANCED FACTORY ANALYTICS & EXECUTIVE INTELLIGENCE
             ========================================================================= */
          <div>
            {/* KPI TELEMETRY STRIP (Clean borders, tabular numerals, MoM indicators) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* Card 1: Cycle Tyre */}
              <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #2563eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>CYCLE TYRE CURING</div>
                  {mom?.cycle_tyre_curing && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: mom.cycle_tyre_curing.diff >= 0 ? '#ecfdf5' : '#fef2f2', color: mom.cycle_tyre_curing.diff >= 0 ? '#059669' : '#dc2626' }}>
                      {mom.cycle_tyre_curing.diff >= 0 ? '↑' : '↓'} {Math.abs(mom.cycle_tyre_curing.pct)}% MoM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {(totals?.ct_cur_prod_num || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pcs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span>Packed: {(totals?.ct_pck_prod_num || 0).toLocaleString()} pcs</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>Eff: {plantSum?.cycle_tyre?.packing_efficiency_pct || 0}%</span>
                </div>
              </div>

              {/* Card 2: Auto Tyre */}
              <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #ea580c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>AUTO TYRE CURING</div>
                  {mom?.auto_tyre_curing && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: mom.auto_tyre_curing.diff >= 0 ? '#ecfdf5' : '#fef2f2', color: mom.auto_tyre_curing.diff >= 0 ? '#059669' : '#dc2626' }}>
                      {mom.auto_tyre_curing.diff >= 0 ? '↑' : '↓'} {Math.abs(mom.auto_tyre_curing.pct)}% MoM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {(totals?.at_cur_prod_num || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pcs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span>Built: {(totals?.at_bld_prod_num || 0).toLocaleString()} pcs</span>
                  <span style={{ fontWeight: 700, color: totals?.at_cur_prod_num >= totals?.at_bld_prod_num ? '#059669' : '#d97706' }}>
                    Diff: {((totals?.at_cur_prod_num || 0) - (totals?.at_bld_prod_num || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card 3: Cycle Tube */}
              <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #16a34a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>CYCLE TUBE CURING</div>
                  {mom?.tube_curing && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: mom.tube_curing.diff >= 0 ? '#ecfdf5' : '#fef2f2', color: mom.tube_curing.diff >= 0 ? '#059669' : '#dc2626' }}>
                      {mom.tube_curing.diff >= 0 ? '↑' : '↓'} {Math.abs(mom.tube_curing.pct)}% MoM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {(totals?.tb_cur_prod_num || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pcs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span>Packed: {(totals?.tb_pck_pack_prod || 0).toLocaleString()} pcs</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>Scrap: {totals?.tb_pck_scrap || 0} kg</span>
                </div>
              </div>

              {/* Card 4: Mixing Compound */}
              <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>MIXING COMPOUND</div>
                  {mom?.mixing_output_kg && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: mom.mixing_output_kg.diff >= 0 ? '#ecfdf5' : '#fef2f2', color: mom.mixing_output_kg.diff >= 0 ? '#059669' : '#dc2626' }}>
                      {mom.mixing_output_kg.diff >= 0 ? '↑' : '↓'} {Math.abs(mom.mixing_output_kg.pct)}% MoM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {(totals?.mix_final || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span>Actual: {(totals?.mix_actual || 0).toLocaleString()} kg</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>Var: {(totals?.mix_variation || 0).toLocaleString()} kg</span>
                </div>
              </div>

              {/* Card 5: Recorded Scrap & Wastage */}
              <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>TOTAL PLANT SCRAP</div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                    {plantSum?.mixing?.scrap_rate_pct || 0}% of Mix
                  </span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {(plantSum?.mixing?.total_scrap_kg || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span>Fab: {((totals?.cal_fab_scrap || 0) + (totals?.at_bld_fab_scrap || 0)).toLocaleString()} kg</span>
                  <span>Com: {(totals?.cal_com_scrap || 0).toLocaleString()} kg</span>
                </div>
              </div>

            </div>

            {/* OPERATIONAL TRAJECTORY CHART & CONTROLS */}
            <div style={{ background: '#fff', padding: '22px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Operational Production Trajectory — {analyticsData?.month_name} {analyticsData?.year}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Daily curing output across all active production lines with 7-day smoothing trend
                  </div>
                </div>

                {/* Filter buttons */}
                <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                  {[
                    { id: 'all', label: 'Multi-Plant View' },
                    { id: 'cycle_tyre', label: 'Cycle Tyre' },
                    { id: 'auto_tyre', label: 'Auto Tyre' },
                    { id: 'tube', label: 'Tube' },
                    { id: 'mixing', label: 'Mixing (Kg)' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setChartMetric(btn.id)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: chartMetric === btn.id ? '#fff' : 'transparent',
                        color: chartMetric === btn.id ? '#0f172a' : '#64748b',
                        boxShadow: chartMetric === btn.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: '320px', width: '100%' }}>
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
            </div>

            {/* TWO-COLUMN INTELLIGENCE PANELS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              {/* Panel A: Compound Material Balance */}
              <div style={{ background: '#fff', padding: '20px 22px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  Compound Yield & Material Balance
                </h4>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '0.82rem' }}>
                    <span style={{ color: '#475569' }}>Total Mixing Final Compound Produced</span>
                    <strong style={{ color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{(plantSum?.mixing?.final_compound_kg || 0).toLocaleString()} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '0.82rem' }}>
                    <span style={{ color: '#475569' }}>Cycle Tyre Theoretical Demand</span>
                    <span style={{ color: '#1e40af', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{(totals?.ct_cur_theo_con || 0).toLocaleString()} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '0.82rem' }}>
                    <span style={{ color: '#475569' }}>Auto Tyre Theoretical Demand</span>
                    <span style={{ color: '#c2410c', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{(totals?.at_cur_theo_con || 0).toLocaleString()} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '0.82rem' }}>
                    <span style={{ color: '#475569' }}>Total Theoretical Demand (Curing Plants)</span>
                    <strong style={{ color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{(plantSum?.mixing?.theoretical_demand_kg || 0).toLocaleString()} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #e2e8f0', marginTop: '6px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>Net Compound Balance Generated</span>
                    <strong style={{ color: (plantSum?.mixing?.buffer_generated_kg || 0) >= 0 ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                      {(plantSum?.mixing?.buffer_generated_kg || 0) >= 0 ? '+' : ''}{(plantSum?.mixing?.buffer_generated_kg || 0).toLocaleString()} kg
                    </strong>
                  </div>
                </div>
              </div>

              {/* Panel B: Bottleneck & Anomaly Radar */}
              <div style={{ background: '#fff', padding: '20px 22px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  Operational Bottleneck & Anomaly Detection
                </h4>
                
                {bottlenecks.length === 0 && anomalies.length === 0 ? (
                  <div style={{ padding: '36px 12px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.88rem' }}>✓ All Operational Channels Stable</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>No statistical outliers (&gt;2σ) or WIP buildup detected for this period.</div>
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {bottlenecks.map((b, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', borderRadius: '6px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309' }}>BOTTLENECK: {b.area.toUpperCase()}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>{b.severity}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#78350f', marginTop: '3px' }}>{b.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '2px' }}>{b.observation}</div>
                      </div>
                    ))}
                    {anomalies.map((a, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>ANOMALY: {a.date}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px' }}>{a.type}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{a.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{a.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* EXECUTIVE MANAGEMENT DIRECTIVES (Traceable to actual data) */}
            <div style={{ background: '#fff', padding: '22px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#0f172a', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                  MANAGEMENT REPORT
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Factory Intelligence Takeaways & Directives
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{ padding: '16px 18px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>{rec.category.toUpperCase()}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: rec.badge_color === 'emerald' ? '#ecfdf5' : (rec.badge_color === 'amber' ? '#fffbeb' : '#eff6ff'), color: rec.badge_color === 'emerald' ? '#059669' : (rec.badge_color === 'amber' ? '#b45309' : '#1d4ed8') }}>
                        {rec.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                      {rec.headline}
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
                      {rec.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : activeTab === 'monthly' ? (
          /* =========================================================================
             TAB 2: MONTHLY ROLLUP SUMMARY (Sheet1)
             ========================================================================= */
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Department Monthly Rollup Summary — {data?.month_name} {data?.year}
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Consolidated departmental manpower, overtime hours, and throughput efficiency
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569' }}>DEPARTMENT</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>TOTAL MANPOWER</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>TOTAL OVERTIME (HRS)</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>AVE. ATTENDANCE</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>TOTAL PRODUCTION</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>AVG OUTPUT / WORKER</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData?.departments?.map((dept, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0f172a' }}>{dept.name}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>{dept.manpower_total}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600, color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>{dept.ot_total}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600, color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>{dept.ave_att}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{dept.prod_units}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{dept.avg_per_manpower}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1', fontWeight: 900 }}>
                    <td style={{ padding: '14px 18px', color: '#0f172a' }}>TOTAL PLANT</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{summaryData?.total_manpower}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>{summaryData?.total_ot}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>{summaryData?.total_ave_att}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#059669' }}>-</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#7c3aed' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* =========================================================================
             TAB 3: COMPLETE 78-COLUMN DAILY TRACKING SHEET (Refined Industrial Chrome)
             ========================================================================= */
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                  Daily Manufacturing Tracking Sheet — {data?.month_name} {data?.year}
                </span>
                <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  {rows.length} Working Days
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Click <span style={{ color: '#2563eb', fontWeight: 700 }}>Edit</span> in any row to log manual scrap, building count, or mixing variation
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                {/* TIER 1 HEADER: Department Groups */}
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 12 }}>
                    <th style={{ position: 'sticky', left: 0, zIndex: 20, background: '#0f172a', color: '#fff', padding: '9px 12px', borderRight: '2px solid #334155', fontWeight: 900, minWidth: '90px' }}>
                      DATE
                    </th>
                    <th style={{ position: 'sticky', left: '90px', zIndex: 20, background: '#0f172a', color: '#fff', padding: '9px 10px', borderRight: '2px solid #334155', fontWeight: 900, minWidth: '45px' }}>
                      DAY
                    </th>
                    <th style={{ background: '#1e293b', color: '#fff', padding: '9px 10px', fontWeight: 800, minWidth: '55px', textAlign: 'center' }}>
                      EDIT
                    </th>

                    {/* Department Super Headers */}
                    {DEPT_SUPER_HEADERS.map((dh, i) => (
                      <th
                        key={i}
                        colSpan={dh.span}
                        style={{
                          background: dh.bg,
                          color: dh.color,
                          padding: '9px 10px',
                          textAlign: 'center',
                          fontWeight: 800,
                          fontSize: '0.72rem',
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
                  <tr style={{ position: 'sticky', top: '35px', zIndex: 11, background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ position: 'sticky', left: 0, zIndex: 20, background: '#f1f5f9', padding: '7px 8px', borderRight: '2px solid #cbd5e1' }}></th>
                    <th style={{ position: 'sticky', left: '90px', zIndex: 20, background: '#f1f5f9', padding: '7px 8px', borderRight: '2px solid #cbd5e1' }}></th>
                    <th style={{ background: '#f1f5f9', padding: '7px 8px', borderRight: '1px solid #e2e8f0' }}></th>

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
                    <th style={{ ...thStyle, background: '#f0f9ff' }}>ACTUAL</th>
                    <th style={{ ...thStyle, background: '#f0f9ff', fontWeight: 800 }}>FINAL</th>
                    <th style={{ ...thStyle, background: '#f0f9ff', borderRight: '2px solid #cbd5e1' }}>VARIATION</th>

                    {/* CALENDER */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#fefce8' }}>PROD KG</th>
                    <th style={{ ...thStyle, background: '#fefce8' }}>FAB SCRAP</th>
                    <th style={{ ...thStyle, background: '#fefce8', borderRight: '2px solid #cbd5e1' }}>COM SCRAP</th>

                    {/* CT BUILDING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#f0fdf4' }}>PROD KG</th>
                    <th style={{ ...thStyle, background: '#f0fdf4', borderRight: '2px solid #cbd5e1' }}>FAB SCRAP</th>

                    {/* CT CURING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#eff6ff', fontWeight: 900, color: '#1e40af' }}>PROD NUM</th>
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
                    <th style={{ ...thStyle, background: '#faf5ff', fontWeight: 900, color: '#6d28d9' }}>PROD NUM</th>
                    <th style={thStyle}>PROD KG</th>
                    <th style={thStyle}>AVG PROD</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVG KG</th>

                    {/* AT BUILDING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#fef2f2', fontWeight: 900, color: '#991b1b' }}>PROD NUM</th>
                    <th style={{ ...thStyle, background: '#fef2f2', borderRight: '2px solid #cbd5e1' }}>FAB SCRAP</th>

                    {/* AT CURING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#fff7ed', fontWeight: 900, color: '#c2410c' }}>CURING PROD</th>
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
                    <th style={{ ...thStyle, background: '#f0fdf4', fontWeight: 900, color: '#15803d' }}>PROD NUM</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVG PROD</th>

                    {/* TUBE PACKING */}
                    <th style={thStyle}>MP</th>
                    <th style={thStyle}>OT</th>
                    <th style={thStyle}>AVE. ATT.</th>
                    <th style={{ ...thStyle, background: '#ecfeff', fontWeight: 900, color: '#0e7490' }}>PACK PROD</th>
                    <th style={thStyle}>PACK KG</th>
                    <th style={thStyle}>SCRAP</th>
                    <th style={thStyle}>AVG PROD</th>
                    <th style={{ ...thStyle, borderRight: '2px solid #cbd5e1' }}>AVG KG</th>

                    {/* TOTAL PLANT */}
                    <th style={{ ...thStyle, background: '#0f172a', color: '#fff', fontWeight: 800 }}>TOTAL MP</th>
                    <th style={{ ...thStyle, background: '#0f172a', color: '#fff', fontWeight: 800 }}>TOTAL OT</th>
                    <th style={{ ...thStyle, background: '#0f172a', color: '#38bdf8', fontWeight: 900 }}>TOTAL AVE</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fcfcfd';
                    const isSunday = r.day === 'Sun';
                    return (
                      <tr
                        key={r.date}
                        style={{
                          backgroundColor: isSunday ? '#f1f5f9' : rowBg,
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSunday ? '#f1f5f9' : rowBg; }}
                      >
                        {/* Sticky Date */}
                        <td style={{ position: 'sticky', left: 0, zIndex: 10, background: isSunday ? '#e2e8f0' : (idx % 2 === 0 ? '#ffffff' : '#fcfcfd'), padding: '6px 10px', borderRight: '2px solid #cbd5e1', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                          {r.date}
                        </td>
                        <td style={{ position: 'sticky', left: '90px', zIndex: 10, background: isSunday ? '#e2e8f0' : (idx % 2 === 0 ? '#ffffff' : '#fcfcfd'), padding: '6px 8px', borderRight: '2px solid #cbd5e1', fontWeight: 800, color: isSunday ? '#dc2626' : '#475569' }}>
                          {r.day}
                        </td>
                        <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#2563eb',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                        </td>

                        {/* WORK SHOP */}
                        <td style={tdStyle(r.ws_mp)}>{r.ws_mp || '-'}</td>
                        <td style={tdStyle(r.ws_ot)}>{r.ws_ot || '-'}</td>
                        <td style={{ ...tdStyle(r.ws_ave), borderRight: '2px solid #cbd5e1' }}>{r.ws_ave || '-'}</td>

                        {/* BOILER */}
                        <td style={tdStyle(r.bo_mp)}>{r.bo_mp || '-'}</td>
                        <td style={tdStyle(r.bo_ot)}>{r.bo_ot || '-'}</td>
                        <td style={{ ...tdStyle(r.bo_ave), borderRight: '2px solid #cbd5e1' }}>{r.bo_ave || '-'}</td>

                        {/* MIXING */}
                        <td style={tdStyle(r.mix_mp)}>{r.mix_mp || '-'}</td>
                        <td style={tdStyle(r.mix_ot)}>{r.mix_ot || '-'}</td>
                        <td style={tdStyle(r.mix_ave)}>{r.mix_ave || '-'}</td>
                        <td style={tdStyle(r.mix_actual)}>{fmtNum(r.mix_actual)}</td>
                        <td style={{ ...tdStyle(r.mix_final), fontWeight: 700, color: '#0369a1' }}>{fmtNum(r.mix_final)}</td>
                        <td style={{ ...tdStyle(r.mix_variation), borderRight: '2px solid #cbd5e1' }}>{fmtNum(r.mix_variation)}</td>

                        {/* CALENDER */}
                        <td style={tdStyle(r.cal_mp)}>{r.cal_mp || '-'}</td>
                        <td style={tdStyle(r.cal_ot)}>{r.cal_ot || '-'}</td>
                        <td style={tdStyle(r.cal_ave)}>{r.cal_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.cal_prod_kg), fontWeight: 700 }}>{fmtNum(r.cal_prod_kg)}</td>
                        <td style={tdStyle(r.cal_fab_scrap)}>{fmtNum(r.cal_fab_scrap)}</td>
                        <td style={{ ...tdStyle(r.cal_com_scrap), borderRight: '2px solid #cbd5e1' }}>{fmtNum(r.cal_com_scrap)}</td>

                        {/* CT BUILDING */}
                        <td style={tdStyle(r.ct_bld_mp)}>{r.ct_bld_mp || '-'}</td>
                        <td style={tdStyle(r.ct_bld_ot)}>{r.ct_bld_ot || '-'}</td>
                        <td style={tdStyle(r.ct_bld_ave)}>{r.ct_bld_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.ct_bld_prod_kg), fontWeight: 700 }}>{fmtNum(r.ct_bld_prod_kg)}</td>
                        <td style={{ ...tdStyle(r.ct_bld_fab_scrap), borderRight: '2px solid #cbd5e1' }}>{fmtNum(r.ct_bld_fab_scrap)}</td>

                        {/* CT CURING */}
                        <td style={tdStyle(r.ct_cur_mp)}>{r.ct_cur_mp || '-'}</td>
                        <td style={tdStyle(r.ct_cur_ot)}>{r.ct_cur_ot || '-'}</td>
                        <td style={tdStyle(r.ct_cur_ave)}>{r.ct_cur_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.ct_cur_prod_num), fontWeight: 800, color: '#1e40af' }}>{fmtInt(r.ct_cur_prod_num)}</td>
                        <td style={tdStyle(r.ct_cur_pack_num)}>{fmtInt(r.ct_cur_pack_num)}</td>
                        <td style={tdStyle(r.ct_cur_theo_con)}>{fmtNum(r.ct_cur_theo_con)}</td>
                        <td style={tdStyle(r.ct_cur_pack_kg)}>{fmtNum(r.ct_cur_pack_kg)}</td>
                        <td style={tdStyle(r.ct_cur_variation)}>{fmtNum(r.ct_cur_variation)}</td>
                        <td style={tdStyle(r.ct_cur_tot_rej)}>{r.ct_cur_tot_rej || '-'}</td>
                        <td style={tdStyle(r.ct_cur_avg_prod)}>{r.ct_cur_avg_prod || '-'}</td>
                        <td style={tdStyle(r.ct_cur_avg_theo)}>{r.ct_cur_avg_theo || '-'}</td>
                        <td style={{ ...tdStyle(r.ct_cur_avg_pack), borderRight: '2px solid #cbd5e1' }}>{r.ct_cur_avg_pack || '-'}</td>

                        {/* CT PACKING */}
                        <td style={tdStyle(r.ct_pck_mp)}>{r.ct_pck_mp || '-'}</td>
                        <td style={tdStyle(r.ct_pck_ot)}>{r.ct_pck_ot || '-'}</td>
                        <td style={tdStyle(r.ct_pck_ave)}>{r.ct_pck_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.ct_pck_prod_num), fontWeight: 800, color: '#6d28d9' }}>{fmtInt(r.ct_pck_prod_num)}</td>
                        <td style={tdStyle(r.ct_pck_prod_kg)}>{fmtNum(r.ct_pck_prod_kg)}</td>
                        <td style={tdStyle(r.ct_pck_avg_prod)}>{r.ct_pck_avg_prod || '-'}</td>
                        <td style={{ ...tdStyle(r.ct_pck_avg_kg), borderRight: '2px solid #cbd5e1' }}>{r.ct_pck_avg_kg || '-'}</td>

                        {/* AT BUILDING */}
                        <td style={tdStyle(r.at_bld_mp)}>{r.at_bld_mp || '-'}</td>
                        <td style={tdStyle(r.at_bld_ot)}>{r.at_bld_ot || '-'}</td>
                        <td style={tdStyle(r.at_bld_ave)}>{r.at_bld_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.at_bld_prod_num), fontWeight: 800, color: '#991b1b' }}>{fmtInt(r.at_bld_prod_num)}</td>
                        <td style={{ ...tdStyle(r.at_bld_fab_scrap), borderRight: '2px solid #cbd5e1' }}>{fmtNum(r.at_bld_fab_scrap)}</td>

                        {/* AT CURING */}
                        <td style={tdStyle(r.at_cur_mp)}>{r.at_cur_mp || '-'}</td>
                        <td style={tdStyle(r.at_cur_ot)}>{r.at_cur_ot || '-'}</td>
                        <td style={tdStyle(r.at_cur_ave)}>{r.at_cur_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.at_cur_prod_num), fontWeight: 800, color: '#c2410c' }}>{fmtInt(r.at_cur_prod_num)}</td>
                        <td style={tdStyle(r.at_cur_pack_num)}>{fmtInt(r.at_cur_pack_num)}</td>
                        <td style={tdStyle(r.at_cur_theo_con)}>{fmtNum(r.at_cur_theo_con)}</td>
                        <td style={tdStyle(r.at_cur_pack_kg)}>{fmtNum(r.at_cur_pack_kg)}</td>
                        <td style={tdStyle(r.at_cur_variation)}>{fmtNum(r.at_cur_variation)}</td>
                        <td style={tdStyle(r.at_cur_tot_rej)}>{r.at_cur_tot_rej || '-'}</td>
                        <td style={tdStyle(r.at_cur_avg_prod)}>{r.at_cur_avg_prod || '-'}</td>
                        <td style={tdStyle(r.at_cur_avg_theo)}>{r.at_cur_avg_theo || '-'}</td>
                        <td style={{ ...tdStyle(r.at_cur_avg_pack), borderRight: '2px solid #cbd5e1' }}>{r.at_cur_avg_pack || '-'}</td>

                        {/* TUBE CURING */}
                        <td style={tdStyle(r.tb_cur_mp)}>{r.tb_cur_mp || '-'}</td>
                        <td style={tdStyle(r.tb_cur_ot)}>{r.tb_cur_ot || '-'}</td>
                        <td style={tdStyle(r.tb_cur_ave)}>{r.tb_cur_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.tb_cur_prod_num), fontWeight: 800, color: '#15803d' }}>{fmtInt(r.tb_cur_prod_num)}</td>
                        <td style={{ ...tdStyle(r.tb_cur_avg_prod), borderRight: '2px solid #cbd5e1' }}>{r.tb_cur_avg_prod || '-'}</td>

                        {/* TUBE PACKING */}
                        <td style={tdStyle(r.tb_pck_mp)}>{r.tb_pck_mp || '-'}</td>
                        <td style={tdStyle(r.tb_pck_ot)}>{r.tb_pck_ot || '-'}</td>
                        <td style={tdStyle(r.tb_pck_ave)}>{r.tb_pck_ave || '-'}</td>
                        <td style={{ ...tdStyle(r.tb_pck_pack_prod), fontWeight: 800, color: '#0e7490' }}>{fmtInt(r.tb_pck_pack_prod)}</td>
                        <td style={tdStyle(r.tb_pck_pack_kg)}>{fmtNum(r.tb_pck_pack_kg)}</td>
                        <td style={tdStyle(r.tb_pck_scrap)}>{fmtNum(r.tb_pck_scrap)}</td>
                        <td style={tdStyle(r.tb_pck_avg_prod)}>{r.tb_pck_avg_prod || '-'}</td>
                        <td style={{ ...tdStyle(r.tb_pck_avg_kg), borderRight: '2px solid #cbd5e1' }}>{r.tb_pck_avg_kg || '-'}</td>

                        {/* TOTAL PLANT */}
                        <td style={{ ...tdStyle(r.total_mp), fontWeight: 700 }}>{r.total_mp || '-'}</td>
                        <td style={{ ...tdStyle(r.total_ot), fontWeight: 600, color: '#d97706' }}>{r.total_ot || '-'}</td>
                        <td style={{ ...tdStyle(r.total_ave), fontWeight: 800, color: '#0369a1' }}>{r.total_ave || '-'}</td>
                      </tr>
                    );
                  })}

                  {/* TOTALS FOOTER ROW */}
                  <tr style={{ position: 'sticky', bottom: 0, zIndex: 12, background: '#0f172a', color: '#fff', borderTop: '2px solid #334155', fontWeight: 800 }}>
                    <td colSpan="3" style={{ position: 'sticky', left: 0, zIndex: 20, background: '#0f172a', padding: '10px 14px', borderRight: '2px solid #334155', color: '#38bdf8', letterSpacing: '0.04em' }}>
                      MONTH TOTAL
                    </td>

                    {/* WORK SHOP */}
                    <td style={tfStyle(totals.ws_mp)}>{totals.ws_mp || '-'}</td>
                    <td style={tfStyle(totals.ws_ot)}>{totals.ws_ot || '-'}</td>
                    <td style={{ ...tfStyle(totals.ws_ave), borderRight: '2px solid #334155' }}>{totals.ws_ave || '-'}</td>

                    {/* BOILER */}
                    <td style={tfStyle(totals.bo_mp)}>{totals.bo_mp || '-'}</td>
                    <td style={tfStyle(totals.bo_ot)}>{totals.bo_ot || '-'}</td>
                    <td style={{ ...tfStyle(totals.bo_ave), borderRight: '2px solid #334155' }}>{totals.bo_ave || '-'}</td>

                    {/* MIXING */}
                    <td style={tfStyle(totals.mix_mp)}>{totals.mix_mp || '-'}</td>
                    <td style={tfStyle(totals.mix_ot)}>{totals.mix_ot || '-'}</td>
                    <td style={tfStyle(totals.mix_ave)}>{totals.mix_ave || '-'}</td>
                    <td style={tfStyle(totals.mix_actual)}>{fmtNum(totals.mix_actual)}</td>
                    <td style={{ ...tfStyle(totals.mix_final), color: '#38bdf8' }}>{fmtNum(totals.mix_final)}</td>
                    <td style={{ ...tfStyle(totals.mix_variation), borderRight: '2px solid #334155' }}>{fmtNum(totals.mix_variation)}</td>

                    {/* CALENDER */}
                    <td style={tfStyle(totals.cal_mp)}>{totals.cal_mp || '-'}</td>
                    <td style={tfStyle(totals.cal_ot)}>{totals.cal_ot || '-'}</td>
                    <td style={tfStyle(totals.cal_ave)}>{totals.cal_ave || '-'}</td>
                    <td style={tfStyle(totals.cal_prod_kg)}>{fmtNum(totals.cal_prod_kg)}</td>
                    <td style={tfStyle(totals.cal_fab_scrap)}>{fmtNum(totals.cal_fab_scrap)}</td>
                    <td style={{ ...tfStyle(totals.cal_com_scrap), borderRight: '2px solid #334155' }}>{fmtNum(totals.cal_com_scrap)}</td>

                    {/* CT BUILDING */}
                    <td style={tfStyle(totals.ct_bld_mp)}>{totals.ct_bld_mp || '-'}</td>
                    <td style={tfStyle(totals.ct_bld_ot)}>{totals.ct_bld_ot || '-'}</td>
                    <td style={tfStyle(totals.ct_bld_ave)}>{totals.ct_bld_ave || '-'}</td>
                    <td style={tfStyle(totals.ct_bld_prod_kg)}>{fmtNum(totals.ct_bld_prod_kg)}</td>
                    <td style={{ ...tfStyle(totals.ct_bld_fab_scrap), borderRight: '2px solid #334155' }}>{fmtNum(totals.ct_bld_fab_scrap)}</td>

                    {/* CT CURING */}
                    <td style={tfStyle(totals.ct_cur_mp)}>{totals.ct_cur_mp || '-'}</td>
                    <td style={tfStyle(totals.ct_cur_ot)}>{totals.ct_cur_ot || '-'}</td>
                    <td style={tfStyle(totals.ct_cur_ave)}>{totals.ct_cur_ave || '-'}</td>
                    <td style={{ ...tfStyle(totals.ct_cur_prod_num), color: '#38bdf8' }}>{fmtInt(totals.ct_cur_prod_num)}</td>
                    <td style={tfStyle(totals.ct_cur_pack_num)}>{fmtInt(totals.ct_cur_pack_num)}</td>
                    <td style={tfStyle(totals.ct_cur_theo_con)}>{fmtNum(totals.ct_cur_theo_con)}</td>
                    <td style={tfStyle(totals.ct_cur_pack_kg)}>{fmtNum(totals.ct_cur_pack_kg)}</td>
                    <td style={tfStyle(totals.ct_cur_variation)}>{fmtNum(totals.ct_cur_variation)}</td>
                    <td style={tfStyle(totals.ct_cur_tot_rej)}>{totals.ct_cur_tot_rej || '-'}</td>
                    <td style={tfStyle(totals.ct_cur_avg_prod)}>{totals.ct_cur_avg_prod || '-'}</td>
                    <td style={tfStyle(totals.ct_cur_avg_theo)}>{totals.ct_cur_avg_theo || '-'}</td>
                    <td style={{ ...tfStyle(totals.ct_cur_avg_pack), borderRight: '2px solid #334155' }}>{totals.ct_cur_avg_pack || '-'}</td>

                    {/* CT PACKING */}
                    <td style={tfStyle(totals.ct_pck_mp)}>{totals.ct_pck_mp || '-'}</td>
                    <td style={tfStyle(totals.ct_pck_ot)}>{totals.ct_pck_ot || '-'}</td>
                    <td style={tfStyle(totals.ct_pck_ave)}>{totals.ct_pck_ave || '-'}</td>
                    <td style={{ ...tfStyle(totals.ct_pck_prod_num), color: '#38bdf8' }}>{fmtInt(totals.ct_pck_prod_num)}</td>
                    <td style={tfStyle(totals.ct_pck_prod_kg)}>{fmtNum(totals.ct_pck_prod_kg)}</td>
                    <td style={tfStyle(totals.ct_pck_avg_prod)}>{totals.ct_pck_avg_prod || '-'}</td>
                    <td style={{ ...tfStyle(totals.ct_pck_avg_kg), borderRight: '2px solid #334155' }}>{totals.ct_pck_avg_kg || '-'}</td>

                    {/* AT BUILDING */}
                    <td style={tfStyle(totals.at_bld_mp)}>{totals.at_bld_mp || '-'}</td>
                    <td style={tfStyle(totals.at_bld_ot)}>{totals.at_bld_ot || '-'}</td>
                    <td style={tfStyle(totals.at_bld_ave)}>{totals.at_bld_ave || '-'}</td>
                    <td style={{ ...tfStyle(totals.at_bld_prod_num), color: '#38bdf8' }}>{fmtInt(totals.at_bld_prod_num)}</td>
                    <td style={{ ...tfStyle(totals.at_bld_fab_scrap), borderRight: '2px solid #334155' }}>{fmtNum(totals.at_bld_fab_scrap)}</td>

                    {/* AT CURING */}
                    <td style={tfStyle(totals.at_cur_mp)}>{totals.at_cur_mp || '-'}</td>
                    <td style={tfStyle(totals.at_cur_ot)}>{totals.at_cur_ot || '-'}</td>
                    <td style={tfStyle(totals.at_cur_ave)}>{totals.at_cur_ave || '-'}</td>
                    <td style={{ ...tfStyle(totals.at_cur_prod_num), color: '#38bdf8' }}>{fmtInt(totals.at_cur_prod_num)}</td>
                    <td style={tfStyle(totals.at_cur_pack_num)}>{fmtInt(totals.at_cur_pack_num)}</td>
                    <td style={tfStyle(totals.at_cur_theo_con)}>{fmtNum(totals.at_cur_theo_con)}</td>
                    <td style={tfStyle(totals.at_cur_pack_kg)}>{fmtNum(totals.at_cur_pack_kg)}</td>
                    <td style={tfStyle(totals.at_cur_variation)}>{fmtNum(totals.at_cur_variation)}</td>
                    <td style={tfStyle(totals.at_cur_tot_rej)}>{totals.at_cur_tot_rej || '-'}</td>
                    <td style={tfStyle(totals.at_cur_avg_prod)}>{totals.at_cur_avg_prod || '-'}</td>
                    <td style={tfStyle(totals.at_cur_avg_theo)}>{totals.at_cur_avg_theo || '-'}</td>
                    <td style={{ ...tfStyle(totals.at_cur_avg_pack), borderRight: '2px solid #334155' }}>{totals.at_cur_avg_pack || '-'}</td>

                    {/* TUBE CURING */}
                    <td style={tfStyle(totals.tb_cur_mp)}>{totals.tb_cur_mp || '-'}</td>
                    <td style={tfStyle(totals.tb_cur_ot)}>{totals.tb_cur_ot || '-'}</td>
                    <td style={tfStyle(totals.tb_cur_ave)}>{totals.tb_cur_ave || '-'}</td>
                    <td style={{ ...tfStyle(totals.tb_cur_prod_num), color: '#38bdf8' }}>{fmtInt(totals.tb_cur_prod_num)}</td>
                    <td style={{ ...tfStyle(totals.tb_cur_avg_prod), borderRight: '2px solid #334155' }}>{totals.tb_cur_avg_prod || '-'}</td>

                    {/* TUBE PACKING */}
                    <td style={tfStyle(totals.tb_pck_mp)}>{totals.tb_pck_mp || '-'}</td>
                    <td style={tfStyle(totals.tb_pck_ot)}>{totals.tb_pck_ot || '-'}</td>
                    <td style={tfStyle(totals.tb_pck_ave)}>{totals.tb_pck_ave || '-'}</td>
                    <td style={{ ...tfStyle(totals.tb_pck_pack_prod), color: '#38bdf8' }}>{fmtInt(totals.tb_pck_pack_prod)}</td>
                    <td style={tfStyle(totals.tb_pck_pack_kg)}>{fmtNum(totals.tb_pck_pack_kg)}</td>
                    <td style={tfStyle(totals.tb_pck_scrap)}>{fmtNum(totals.tb_pck_scrap)}</td>
                    <td style={tfStyle(totals.tb_pck_avg_prod)}>{totals.tb_pck_avg_prod || '-'}</td>
                    <td style={{ ...tfStyle(totals.tb_pck_avg_kg), borderRight: '2px solid #334155' }}>{totals.tb_pck_avg_kg || '-'}</td>

                    {/* TOTAL PLANT */}
                    <td style={{ ...tfStyle(totals.total_mp), color: '#38bdf8' }}>{totals.total_mp || '-'}</td>
                    <td style={{ ...tfStyle(totals.total_ot), color: '#fbbf24' }}>{totals.total_ot || '-'}</td>
                    <td style={{ ...tfStyle(totals.total_ave), color: '#38bdf8' }}>{totals.total_ave || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            MANUAL ENTRY MODAL
            ========================================================================= */}
        {editModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '8px', maxWidth: '520px', width: '100%', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                  Log Manual Manufacturing Entry — {manualForm.date}
                </h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveManual} style={{ padding: '20px' }}>
                {saveSuccessMsg && (
                  <div style={{ padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '14px' }}>
                    {saveSuccessMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Mixing Variation (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.mixing_variation}
                      onChange={(e) => setManualForm({ ...manualForm, mixing_variation: e.target.value })}
                      style={modalInputStyle}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Calender Prod (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.calender_prod_kg}
                      onChange={(e) => setManualForm({ ...manualForm, calender_prod_kg: e.target.value })}
                      style={modalInputStyle}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Calender Fabric Scrap (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.calender_fab_scrap}
                      onChange={(e) => setManualForm({ ...manualForm, calender_fab_scrap: e.target.value })}
                      style={modalInputStyle}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Calender Compound Scrap (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.calender_com_scrap}
                      onChange={(e) => setManualForm({ ...manualForm, calender_com_scrap: e.target.value })}
                      style={modalInputStyle}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Auto Tyre Building (Pcs)
                    </label>
                    <input
                      type="number"
                      value={manualForm.auto_building_prod_num}
                      onChange={(e) => setManualForm({ ...manualForm, auto_building_prod_num: e.target.value })}
                      style={modalInputStyle}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Auto Building Fabric Scrap (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.auto_building_fab_scrap}
                      onChange={(e) => setManualForm({ ...manualForm, auto_building_fab_scrap: e.target.value })}
                      style={modalInputStyle}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingManual}
                    style={{ padding: '7px 18px', borderRadius: '4px', border: 'none', background: '#0f172a', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}
                  >
                    {savingManual ? 'Saving...' : 'Save Record'}
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

// Helpers
function fmtNum(v) {
  if (!v || v === 0) return '-';
  const n = parseFloat(v);
  return isNaN(n) ? '-' : n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function fmtInt(v) {
  if (!v || v === 0) return '-';
  const n = parseInt(v, 10);
  return isNaN(n) ? '-' : n.toLocaleString();
}

function tdStyle(v) {
  return {
    padding: '6px 8px',
    borderRight: '1px solid #f1f5f9',
    textAlign: 'right',
    color: (!v || v === 0) ? '#94a3b8' : '#1e293b',
    fontVariantNumeric: 'tabular-nums',
  };
}

function tfStyle(v) {
  return {
    padding: '10px 8px',
    borderRight: '1px solid #334155',
    textAlign: 'right',
    color: (!v || v === 0) ? '#64748b' : '#f8fafc',
    fontVariantNumeric: 'tabular-nums',
  };
}

const modalInputStyle = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
};
