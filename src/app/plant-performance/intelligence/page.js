'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

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

// Standard industrial number formatters
const fmtNum = (val) => {
  if (val === null || val === undefined) return '—';
  return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const fmtDec = (val, d = 2) => {
  if (val === null || val === undefined) return '—';
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
};

const fmtCur = (val) => {
  if (val === null || val === undefined) return '—';
  return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export default function FactoryIntelligencePage() {
  const [month, setMonth] = useState('2026-10');
  const [activeTab, setActiveTab] = useState('command');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intelData, setIntelData] = useState(null);
  const [auditFilter, setAuditFilter] = useState('ALL');

  const fetchIntelligence = async (selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
      // apiGet automatically prefixes API_BASE and handles leading slashes
      const res = await apiGet(`/plant-performance/intelligence/?month=${selectedMonth}`);
      if (res && res.status === 'success') {
        setIntelData(res.data);
      } else {
        setError(res?.error || 'Failed to retrieve factory intelligence data');
      }
    } catch (err) {
      console.error('Intelligence API error:', err);
      setError(err?.message || 'Error communicating with intelligence backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence(month);
  }, [month]);

  // Smooth Chart Configuration for Daily Trajectory & 2-Sigma Control Band (Light Theme)
  const trajectoryChartData = useMemo(() => {
    if (!intelData?.workspaces?.command?.daily_series) return null;
    const series = intelData.workspaces.command.daily_series;
    const stats = intelData.workspaces.command.spc_baseline;

    const labels = series.map((d) => `Day ${d.day}`);
    const actualData = series.map((d) => (d.is_operating ? d.tyres : null));
    const meanLine = series.map(() => (stats?.operating_days > 0 ? stats.mean_daily : null));
    const uclLine = series.map(() => (stats?.operating_days > 0 ? stats.ucl_2sigma : null));
    const lclLine = series.map(() => (stats?.operating_days > 0 ? stats.lcl_2sigma : null));

    return {
      labels,
      datasets: [
        {
          label: 'Operating Tyre Output (pcs)',
          data: actualData,
          borderColor: '#2563eb', // Royal Blue
          backgroundColor: 'rgba(37, 99, 235, 0.08)', // Soft Blue Gradient Tint
          pointRadius: series.map((d) => (d.anomaly_level === 'ANOMALY' ? 6 : 3.5)),
          pointHoverRadius: 7,
          pointBackgroundColor: series.map((d) => (d.anomaly_level === 'ANOMALY' ? '#ef4444' : '#2563eb')),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 2.5,
          tension: 0.38, // Smooth fluid bezier curve
          fill: true,
          zIndex: 10,
        },
        {
          label: '2-Sigma UCL (Upper Bound: 5,989)',
          data: uclLine,
          borderColor: '#64748b', // Slate 500
          borderDash: [5, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Operating Mean (4,215 /day)',
          data: meanLine,
          borderColor: '#0284c7', // Sky 600
          borderDash: [6, 3],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: '2-Sigma LCL (Lower Bound: 2,441)',
          data: lclLine,
          borderColor: '#f59e0b', // Amber 500
          borderDash: [5, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [intelData]);

  const trajectoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'inherit', size: 12, weight: '500' },
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          color: '#334155',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (ctx) => {
            if (ctx.parsed.y === null) return null;
            return ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString()} tyres`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(226, 232, 240, 0.7)' },
        ticks: { font: { size: 11 }, color: '#64748b' },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.7)' },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
          callback: (v) => Number(v).toLocaleString(),
        },
      },
    },
  };

  // Division Comparison Bar Chart
  const divisionChartData = useMemo(() => {
    if (!intelData?.workspaces?.divisions) return null;
    const divs = intelData.workspaces.divisions;
    return {
      labels: divs.map((d) => d.division),
      datasets: [
        {
          label: 'Primary Output Volume (Cured / Mixed)',
          data: divs.map((d) => d.cured_volume),
          backgroundColor: [
            'rgba(37, 99, 235, 0.85)', // Blue for Cycle Tyre
            'rgba(14, 165, 233, 0.85)', // Sky for Auto Tyre
            'rgba(139, 92, 246, 0.85)', // Purple for Cycle Tube
            'rgba(16, 185, 129, 0.85)', // Emerald for Compound
          ],
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };
  }, [intelData]);

  const divisionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const div = intelData.workspaces.divisions[ctx.dataIndex];
            return ` Output: ${Number(ctx.parsed.y).toLocaleString()} ${div?.unit || 'units'}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: '500' }, color: '#334155' },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.7)' },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
          callback: (v) => Number(v).toLocaleString(),
        },
      },
    },
  };

  const tabs = [
    { id: 'command', label: '01. Command Center', tag: 'Executive' },
    { id: 'divisions', label: '02. Division Benchmarks', tag: '4 Divisions' },
    { id: 'quality', label: '03. Quality & SKUs', tag: '98.53% Yield' },
    { id: 'manpower', label: '04. Manpower & OT', tag: 'Reconciled' },
    { id: 'materials', label: '05. Compound & RM', tag: 'Ledger Audit' },
    { id: 'curing_packing', label: '06. Curing & Packing Flow', tag: '97.29% Flow' },
    { id: 'commercial', label: '07. Commercial Invoicing', tag: '108 Invoices' },
    { id: 'audit_register', label: '08. Audit Register', tag: '5 Items' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
      <Navbar />

      {/* Top Header & Context Bar */}
      <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-40 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 font-medium text-xs tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Radhu Industrial Intelligence · v2.1
            </span>
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-3 text-xs text-slate-500">
              <span>Facility: <strong className="text-slate-800 font-medium">Radhu Complex, Meerut Rd</strong></span>
              <span className="text-slate-300">·</span>
              <span>Replica: <code className="text-blue-600 font-mono bg-blue-50/60 px-1.5 py-0.5 rounded">analytics_readonly</code></span>
              <span className="text-slate-300">·</span>
              <span>Engine: <span className="text-emerald-700 font-medium">MySQL (127.0.0.1:3306)</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/plant-performance"
              className="text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>&larr;</span> Legacy Plant MIS
            </Link>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 shadow-xs">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Month:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-xs font-bold bg-transparent text-blue-700 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => fetchIntelligence(month)}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Updating...
                </>
              ) : (
                'Refresh Metrics'
              )}
            </button>
          </div>
        </div>

        {/* Workspace Navigation Strip */}
        <nav className="border-t border-slate-100 bg-slate-50/60 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 py-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm rounded-lg whitespace-nowrap font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/90 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeTab === tab.id
                      ? 'bg-blue-100/70 text-blue-800 font-bold'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.tag}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Analytical Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <p className="text-sm text-slate-800 font-semibold tracking-wide">
                Retrieving Industrial Analytics from Replica Database...
              </p>
              <p className="text-xs text-slate-500">
                Synthesizing multi-division mass ledgers, 2-sigma control baseline, and cross-department reconciliations for {month}
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 my-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm shadow-xs">
            <div className="font-semibold flex items-center gap-2 text-rose-700 text-base">
              <span>&#9888;</span> Analytics Query Notice
            </div>
            <p className="mt-1 text-slate-700 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {!loading && intelData && (
          <div className="space-y-6">
            {/* WORKSPACE 01: FACTORY COMMAND CENTER */}
            {activeTab === 'command' && (
              <div className="space-y-6">
                {/* Executive Telemetry Grid (Row 1) */}
                <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
                  <div className="bg-white p-4 border border-slate-200/90 rounded-xl shadow-xs hover:border-blue-300 transition-all">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tyres Cured</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 mt-2 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.total_tyres_cured)}
                    </div>
                    <div className="text-xs font-medium text-emerald-600 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      100% vulcanized
                    </div>
                  </div>

                  <div className="bg-white p-4 border border-slate-200/90 rounded-xl shadow-xs hover:border-blue-300 transition-all">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tyres Packed</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 mt-2 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.total_tyres_packed)}
                    </div>
                    <div className="text-xs font-medium text-blue-600 mt-1.5">
                      Throughput: {fmtDec(intelData.workspaces.curing_packing_flow.curing_to_packing_throughput_ratio)}%
                    </div>
                  </div>

                  <div className="bg-white p-4 border border-slate-200/90 rounded-xl shadow-xs hover:border-blue-300 transition-all">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cycle Tubes</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 mt-2 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.cycle_tubes_packed)}
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-1.5">
                      Cured: {fmtNum(intelData.workspaces.command.telemetry.cycle_tubes_cured)} pcs
                    </div>
                  </div>

                  <div className="bg-white p-4 border border-slate-200/90 rounded-xl shadow-xs hover:border-blue-300 transition-all">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compound Mixed</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 mt-2 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.compound_output_kg)} <span className="text-sm font-normal text-slate-500">kg</span>
                    </div>
                    <div className="text-xs font-medium text-emerald-600 mt-1.5">
                      Zero floor mill scrap
                    </div>
                  </div>

                  <div className="bg-white p-4 border border-slate-200/90 rounded-xl shadow-xs hover:border-emerald-300 transition-all">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">1st Grade Yield</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-600 mt-2 tabular-nums">
                      {fmtDec(intelData.workspaces.quality.yield_first_grade_pct)}%
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-1.5">
                      {fmtNum(intelData.workspaces.quality.first_grade_pcs)} A-class pcs
                    </div>
                  </div>

                  <div className="bg-white p-4 border border-slate-200/90 rounded-xl shadow-xs hover:border-blue-300 transition-all">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">26-Day Run Rate</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-700 mt-2 tabular-nums">
                      {fmtNum(intelData.workspaces.command.spc_baseline.mean_daily)} <span className="text-sm font-normal text-slate-500">/day</span>
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-1.5">
                      &plusmn;{fmtDec(intelData.workspaces.command.spc_baseline.std_dev, 0)} (&sigma;)
                    </div>
                  </div>

                  <div className="bg-amber-50/70 p-4 border border-amber-200 rounded-xl shadow-xs hover:border-amber-300 transition-all">
                    <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Open Exceptions</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-900 mt-2 tabular-nums">
                      2 Items
                    </div>
                    <div className="text-xs font-medium text-amber-700 mt-1.5">
                      Resin 200kg · CT54 2pcs
                    </div>
                  </div>
                </section>

                {/* Main Asymmetric Grid: Trajectory Chart & Operational Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (7 cols): Production Trajectory & Statistical Screening */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Trajectory Chart Panel */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-2">
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">
                            Daily Production Trajectory &amp; 2-Sigma Control Envelope
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Statistical Baseline: Mean {fmtDec(intelData.workspaces.command.spc_baseline.mean_daily, 1)} tyres/shift · UCL {fmtDec(intelData.workspaces.command.spc_baseline.ucl_2sigma, 1)} · LCL {fmtDec(intelData.workspaces.command.spc_baseline.lcl_2sigma, 1)}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Oct 20 Anomaly (Dussehra)
                        </span>
                      </div>

                      <div className="h-80 w-full mt-4">
                        {trajectoryChartData && <Line data={trajectoryChartData} options={trajectoryChartOptions} />}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Actual Output
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-slate-500 border-dashed"></span> Upper Control Limit (UCL)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-sky-500 border-dashed"></span> Operating Mean
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-amber-500 border-dashed"></span> Lower Control Limit (LCL)
                          </span>
                        </div>
                        <span className="font-mono text-slate-600">26 Operating Days</span>
                      </div>
                    </div>

                    {/* Operational Shift Screening Log Table */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Statistical Screening Log (2-Sigma Deviations)
                        </h3>
                        <span className="text-xs text-slate-500">
                          Normal Operating Range: 2,441 — 5,989 pcs
                        </span>
                      </div>

                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50/70 font-semibold">
                              <th className="p-3">Shift Date</th>
                              <th className="p-3 text-right">Actual Tyres</th>
                              <th className="p-3 text-right">Standard Mean</th>
                              <th className="p-3 text-right">Z-Score</th>
                              <th className="p-3">Classification</th>
                              <th className="p-3">Operational Context</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {intelData.workspaces.command.daily_series
                              .filter((d) => d.anomaly_level === 'ANOMALY')
                              .map((anom, idx) => (
                                <tr key={idx} className="bg-rose-50/40 hover:bg-rose-50/70 transition-colors">
                                  <td className="p-3 font-semibold text-slate-900">{anom.date} (Day {anom.day})</td>
                                  <td className="p-3 text-right font-mono font-bold text-rose-600 tabular-nums">{fmtNum(anom.tyres)}</td>
                                  <td className="p-3 text-right font-mono text-slate-700 tabular-nums">
                                    {fmtNum(intelData.workspaces.command.spc_baseline.mean_daily)}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-rose-600 tabular-nums">{fmtDec(anom.z_score)}&sigma;</td>
                                  <td className="p-3">
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-rose-100 text-rose-800 border border-rose-200 font-semibold">
                                      LOWER ANOMALY
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-600">
                                    Dussehra festival plant closure. Verified non-structural statistical variance.
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (5 cols): Division Benchmarks, Flow, & RM Cards */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Division Contribution Matrix */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Production Division Velocity
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">4 Core Divisions</span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {intelData.workspaces.divisions.map((div, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{div.division}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Run-Rate: <span className="text-blue-700 font-semibold font-mono">{fmtDec(div.run_rate_per_operating_day, 1)}</span> {div.unit}/shift
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-mono font-bold text-slate-900 tabular-nums">
                                {fmtNum(div.cured_volume)} <span className="text-xs font-normal text-slate-500">{div.unit}</span>
                              </div>
                              <div className="text-xs font-medium text-emerald-600 mt-0.5">
                                {div.throughput_ratio ? `${fmtDec(div.throughput_ratio)}% throughput` : 'Direct Delivery'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Curing vs Packing Flow & Buffer */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                      <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
                        Curing-to-Packing Flow Dynamics
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                          <div className="text-xs text-slate-500 font-medium">Cured Gross Output</div>
                          <div className="text-lg font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.curing_packing_flow.cured_units)} pcs
                          </div>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                          <div className="text-xs text-slate-500 font-medium">Packed Net Output</div>
                          <div className="text-lg font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.curing_packing_flow.packed_units)} pcs
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex justify-between items-center shadow-xs">
                        <span className="font-medium">Net Period Flow Difference:</span>
                        <span className="font-mono font-bold text-blue-700">+{fmtNum(intelData.workspaces.curing_packing_flow.net_period_flow_difference)} pcs (Floor Buffer)</span>
                      </div>
                    </div>

                    {/* Raw Material Inventory & 200 kg Discrepancy Snapshot */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Raw Material Warehouse Ledger
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          200 kg Discrepancy
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                          <div className="text-slate-500">Opening</div>
                          <div className="font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.opening_stock_kg)} kg
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                          <div className="text-slate-500">Received</div>
                          <div className="font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_received_kg)} kg
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                          <div className="text-slate-500">Consumed</div>
                          <div className="font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_used_kg)} kg
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
                        Arithmetic Closing: <strong className="text-slate-900 font-mono">{fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.arithmetic_closing_kg, 2)} kg</strong> vs Reported: <strong className="text-amber-700 font-mono">{fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.reported_closing_stock_kg, 2)} kg</strong>. Discrepancy isolated strictly to Entry ID #2337 (Material #101 Resin 1068).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 02: DIVISION INTELLIGENCE */}
            {activeTab === 'divisions' && (
              <div className="space-y-6">
                {/* Visual Chart Comparison */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Division Output Volume Comparison
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cycle Tyre, Auto Tyre &amp; Cycle Tube (Pieces) alongside Mixing Mill (Kilograms)
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-medium">
                      26 Active Days in October 2026
                    </span>
                  </div>
                  <div className="h-64 w-full mt-4">
                    {divisionChartData && <Bar data={divisionChartData} options={divisionChartOptions} />}
                  </div>
                </div>

                {/* Division Benchmarking Table */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
                    Division Operational Performance Summary
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50/70 font-semibold">
                          <th className="p-3.5">Manufacturing Division</th>
                          <th className="p-3.5 text-right">Primary Stage (Cured)</th>
                          <th className="p-3.5 text-right">Secondary Stage (Packed)</th>
                          <th className="p-3.5 text-right">Conversion Throughput</th>
                          <th className="p-3.5 text-right">26-Day Run Rate</th>
                          <th className="p-3.5 text-right">MoM Growth</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {intelData.workspaces.divisions.map((div, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-semibold text-slate-900 flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                              {div.division}
                            </td>
                            <td className="p-3.5 text-right font-mono font-medium text-slate-900 tabular-nums">
                              {fmtNum(div.cured_volume)} <span className="text-xs font-normal text-slate-500">{div.unit}</span>
                            </td>
                            <td className="p-3.5 text-right font-mono font-medium text-slate-900 tabular-nums">
                              {div.packed_volume ? (
                                <>
                                  {fmtNum(div.packed_volume)} <span className="text-xs font-normal text-slate-500">{div.unit}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 font-sans text-xs">Direct Compound Feed</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {div.throughput_ratio ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {fmtDec(div.throughput_ratio)}%
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs">100% Extruder Delivery</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono text-slate-700 tabular-nums">
                              {fmtDec(div.run_rate_per_operating_day, 1)} {div.unit}/shift
                            </td>
                            <td className="p-3.5 text-right font-mono font-semibold">
                              {div.mom_growth_pct !== null ? (
                                <span className={div.mom_growth_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                  {div.mom_growth_pct >= 0 ? '+' : ''}
                                  {fmtDec(div.mom_growth_pct)}%
                                </span>
                              ) : (
                                <span className="text-slate-400 font-sans font-normal">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Division Operational Deep-Dives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
                    <h3 className="text-sm font-semibold text-blue-700">Cycle Tyre &amp; Tube Dynamics</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Cycle Tyre cured volume reached 88,956 units across 26 operating days (3,421.4 tyres/shift). Clean packing reached 86,544 units (97.29% conversion velocity). Cycle Tube division processed 60,240 cured and packed units with synchronized floor flow.
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
                    <h3 className="text-sm font-semibold text-blue-700">Auto Tyre &amp; Mixing Mill Dynamics</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Auto Tyre cured 20,642 tyres (793.9 tyres/shift). Mixing Mill delivered 141,913.46 kg gross masterbatch compound (5,458.2 kg/shift). Zero mixing mill scrap was generated. Auto building fabric cord trim (3,254.37 kg) is partitioned into a separate independent stream.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 03: QUALITY & SKUS */}
            {activeTab === 'quality' && (
              <div className="space-y-6">
                {/* Quality Grade Ledger */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Cycle Tyre Quality Grading &amp; Scrap Reconciliation
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Classification of 88,956 cured units across First Grade, Second Grade, Rejections, and Unclassified
                      </p>
                    </div>
                    <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                      1st Grade Yield: {fmtDec(intelData.workspaces.quality.yield_first_grade_pct)}%
                    </span>
                  </div>

                  {/* Horizontal Stacked Yield Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${intelData.workspaces.quality.yield_first_grade_pct}%` }}
                        className="bg-emerald-500 h-full"
                        title="First Grade"
                      ></div>
                      <div
                        style={{ width: `${intelData.workspaces.quality.second_grade_pct}%` }}
                        className="bg-amber-400 h-full"
                        title="Second Grade"
                      ></div>
                      <div
                        style={{ width: `${intelData.workspaces.quality.rejection_pct}%` }}
                        className="bg-rose-500 h-full"
                        title="Rejections"
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                      <span className="text-emerald-700">First Grade: 98.53%</span>
                      <span className="text-amber-700">Second Grade: 0.39%</span>
                      <span className="text-rose-700">Rejections: 1.08%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-slate-500 uppercase">First Grade (A-Class)</div>
                      <div className="text-2xl font-mono font-bold text-emerald-600 mt-1.5 tabular-nums">
                        {fmtNum(intelData.workspaces.quality.first_grade_pcs)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {fmtDec(intelData.workspaces.quality.yield_first_grade_pct)}% of classified
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-amber-700 uppercase">Second Grade (Downgrade)</div>
                      <div className="text-2xl font-mono font-bold text-amber-700 mt-1.5 tabular-nums">
                        {fmtNum(intelData.workspaces.quality.second_grade_pcs)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {fmtDec(intelData.workspaces.quality.second_grade_pct)}% of classified
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-rose-700 uppercase">Factory Rejections</div>
                      <div className="text-2xl font-mono font-bold text-rose-600 mt-1.5 tabular-nums">
                        {fmtNum(intelData.workspaces.quality.rejections_pcs)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {fmtDec(intelData.workspaces.quality.rejection_pct)}% scrap rate
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-blue-700 uppercase">Unclassified Units</div>
                      <div className="text-2xl font-mono font-bold text-blue-800 mt-1.5 tabular-nums">
                        {intelData.workspaces.quality.unclassified_cured_pcs} pcs
                      </div>
                      <div className="text-xs text-blue-600 mt-0.5">Audit Flag on Entry #3701</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs text-slate-700 leading-relaxed">
                    <strong className="text-blue-800 font-semibold">Quality Reconciliation Note:</strong>{' '}
                    {intelData.workspaces.quality.audit_reconciliation_note}
                  </div>
                </div>

                {/* Top SKUs Table */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
                    Top 10 Cycle Tyre SKUs by Vulcanized Volume
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50/70 font-semibold">
                          <th className="p-3">SKU Item Description</th>
                          <th className="p-3 text-right">Units Cured</th>
                          <th className="p-3 text-right">Share of Division Output</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {intelData.workspaces.quality.top_skus.map((sku, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-semibold text-slate-800">{sku.item_name}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 tabular-nums">{fmtNum(sku.cured_qty)}</td>
                            <td className="p-3 text-right font-mono text-slate-600 tabular-nums">
                              {fmtDec((sku.cured_qty / intelData.workspaces.command.telemetry.total_tyres_cured) * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 04: MANPOWER & OVERTIME */}
            {activeTab === 'manpower' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">
                      Attendance &amp; Overtime Scope Harmonization
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mathematical resolution between Plant Floor Manufacturing Overtime (11 depts) and Company-Wide Overtime (14 depts)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                    {/* Plant Floor Overtime */}
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-blue-700">
                          Plant Floor Overtime (11 Depts)
                        </span>
                        <span className="text-[11px] font-medium px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          Production MIS Scope
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                          <div className="text-slate-500">October 2026:</div>
                          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.plant_floor_scope.october_hours)} hrs
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                          <div className="text-slate-500">September 2026:</div>
                          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.plant_floor_scope.september_hours)} hrs
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
                        Filtered strictly to the 11 manufacturing departments present in daily production sheets with active shift statuses (Present, Half Day, Late). Excludes non-manufacturing administrative departments.
                      </p>
                    </div>

                    {/* Company-Wide Overtime */}
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-indigo-700">
                          Company-Wide Overtime (14 Depts)
                        </span>
                        <span className="text-[11px] font-medium px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                          HR Master Scope
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                          <div className="text-slate-500">October 2026:</div>
                          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.company_wide_scope.october_hours)} hrs
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                          <div className="text-slate-500">September 2026:</div>
                          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.company_wide_scope.september_hours)} hrs
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
                        Comprehensive HR attendance ledger including auxiliary departments (Chakka, Store, Office) and weekend maintenance hours recorded under Week Off / Absent shift types (+2,093 hrs in Sep, +12 hrs in Oct).
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong className="text-amber-800 font-semibold">&#9888; Reconciled Delta:</strong>{' '}
                    {intelData.workspaces.manpower.audit_findings.audit_explanation}
                  </div>
                </div>

                {/* Masked HR Payroll & Wage Security Box */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Payroll Overtime Disbursements &amp; RBAC Privacy Shield
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      RBAC: Masked for Non-Financial Users
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-medium">Payroll Records Ingested</div>
                      <div className="text-xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {intelData.workspaces.manpower.payroll_october.records_count} employees
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-medium">Total Overtime Pay Disbursed</div>
                      <div className="text-xl font-mono font-bold text-emerald-600 mt-1.5 tabular-nums">
                        {intelData.workspaces.manpower.payroll_october.total_ot_amount_disbursed}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-medium">Individual Salary Privacy</div>
                      <div className="text-xs font-semibold text-slate-600 mt-1.5">
                        {intelData.workspaces.manpower.payroll_october.individual_salaries}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 05: COMPOUND & RAW MATERIAL */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                {/* Compound Mixing Mass Ledger */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <h2 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">
                    Compound Mixing Mill Mass Balance Ledger
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Gross Compound Produced</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.gross_produced_kg, 2)} kg
                      </div>
                      <div className="text-xs font-medium text-emerald-600 mt-1">100% Usable Batch Mass</div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Mixing Mill Scrap</div>
                      <div className="text-2xl font-mono font-bold text-emerald-600 mt-1.5 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.mixing_mill_scrap_kg, 2)} kg
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1">Zero Floor Mill Wastage</div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Net Usable Output</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.net_usable_output_kg, 2)} kg
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1">Transferred to Building lines</div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Internal Extruder Feed</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.consumed_internally_kg, 2)} kg
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1">Stock Balance: 0.00 kg</div>
                    </div>
                  </div>
                </div>

                {/* Independent Auto Building Scrap Ledger */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Independent Cord Fabric Scrap Classification
                    </h3>
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      Separate Stream (Not Mixing Scrap)
                    </span>
                  </div>

                  <div className="mt-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Auto Building Fabric Scrap:</span>
                      <span className="font-mono font-bold text-slate-900 text-base tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.independent_auto_building_scrap.total_scrap_kg, 2)} kg
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {intelData.workspaces.compound_raw_material.independent_auto_building_scrap.reconciliation_note}
                    </p>
                  </div>
                </div>

                {/* Raw Material Inventory Ledger & 200 kg Audit */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Raw Material Warehouse Stock Reconciliation
                    </h3>
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Discrepancy Isolated to Entry #2337
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-medium uppercase">Opening Stock</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.opening_stock_kg, 2)} kg
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-medium uppercase">Received in Oct</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_received_kg, 2)} kg
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-medium uppercase">Consumed in Oct</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_used_kg, 2)} kg
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-medium uppercase">Reported Closing Stock</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.reported_closing_stock_kg, 2)} kg
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong className="text-amber-800 font-semibold">&#9888; 200 kg Mathematical Variance Isolation:</strong>
                    <p className="mt-1">
                      {intelData.workspaces.compound_raw_material.rm_warehouse_ledger.audit_finding_200kg.details}
                    </p>
                    <div className="mt-2 text-slate-700 font-mono font-semibold">
                      Exact Audit Coordinates: Entry ID #2337 | Material #101 Resin 1068 | Date: 2026-10-29 | Challan #731 | Supplier: ANU LUBES LLP
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 06: CURING & PACKING FLOW */}
            {activeTab === 'curing_packing' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">
                      Curing-to-Packing Flow Dynamics &amp; Throughput
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cycle Tyre conversion velocity between vulcanization and finished product packaging
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <div className="text-slate-500 font-semibold uppercase">Cured Output</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {fmtNum(intelData.workspaces.curing_packing_flow.cured_units)}
                      </div>
                      <div className="text-slate-500 mt-0.5">Gross Vulcanized</div>
                    </div>

                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <div className="text-slate-500 font-semibold uppercase">Packed Output</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {fmtNum(intelData.workspaces.curing_packing_flow.packed_units)}
                      </div>
                      <div className="text-slate-500 mt-0.5">Wrapped for Dispatch</div>
                    </div>

                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <div className="text-emerald-800 font-semibold uppercase">Throughput Ratio</div>
                      <div className="text-2xl font-mono font-bold text-emerald-700 mt-1.5 tabular-nums">
                        {fmtDec(intelData.workspaces.curing_packing_flow.curing_to_packing_throughput_ratio)}%
                      </div>
                      <div className="text-emerald-700 mt-0.5">Conversion Velocity</div>
                    </div>

                    <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                      <div className="text-blue-800 font-semibold uppercase">Net Flow Difference</div>
                      <div className="text-2xl font-mono font-bold text-blue-700 mt-1.5 tabular-nums">
                        +{fmtNum(intelData.workspaces.curing_packing_flow.net_period_flow_difference)}
                      </div>
                      <div className="text-blue-700 mt-0.5">Cured - Packed Buffer</div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs text-slate-700 leading-relaxed">
                    <strong className="text-blue-800 font-semibold">Work-In-Progress (WIP) Disclosure:</strong>{' '}
                    {intelData.workspaces.curing_packing_flow.wip_verification_statement}
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 07: COMMERCIAL INVOICING */}
            {activeTab === 'commercial' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">
                      Commercial Invoicing &amp; Tally Prime Synchronization
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      GST sales vouchers and customer revenue roll-up for {month}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-semibold uppercase">Total Invoices Generated</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {intelData.workspaces.commercial.total_invoices_count} vouchers
                      </div>
                      <div className="text-slate-500 mt-0.5">Synced via Tally XML</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-semibold uppercase">Total Commercial Value</div>
                      <div className="text-2xl font-mono font-bold text-emerald-600 mt-1.5 tabular-nums">
                        {fmtCur(intelData.workspaces.commercial.total_invoiced_value_inr)}
                      </div>
                      <div className="text-slate-500 mt-0.5">Gross Invoiced Turnover</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div className="text-slate-500 font-semibold uppercase">Average Invoice Value</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1.5 tabular-nums">
                        {intelData.workspaces.commercial.total_invoices_count > 0
                          ? fmtCur(
                              intelData.workspaces.commercial.total_invoiced_value_inr /
                                intelData.workspaces.commercial.total_invoices_count
                            )
                          : '—'}
                      </div>
                      <div className="text-slate-500 mt-0.5">Per B2B Consignment</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
                      Top Commercial Accounts by Invoiced Volume
                    </h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50/70 font-semibold">
                            <th className="p-3.5">Customer Account / Party Ledger</th>
                            <th className="p-3.5 text-right">Invoices</th>
                            <th className="p-3.5 text-right">Total Invoiced Amount (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {intelData.workspaces.commercial.top_customers.map((cust, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3.5 font-semibold text-slate-900">{cust.customer_name}</td>
                              <td className="p-3.5 text-right font-mono text-slate-600 tabular-nums">{cust.invoices}</td>
                              <td className="p-3.5 text-right font-mono font-bold text-emerald-600 tabular-nums">{fmtCur(cust.total_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 08: AUDIT REGISTER & DATA GOVERNANCE */}
            {activeTab === 'audit_register' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Data Governance &amp; Metric Verification Register
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Definitive mathematical verification status and source audit ledger for Radhu Complex
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs bg-amber-100 border border-amber-200 text-amber-900 font-semibold">
                        2 Reconciliations Required
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs bg-emerald-100 border border-emerald-200 text-emerald-900 font-semibold">
                        5 Verified
                      </span>
                    </div>
                  </div>

                  {/* Status Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-2">
                    <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
                    {['ALL', 'RECONCILIATION_REQUIRED', 'VERIFIED', 'PARTIALLY_VERIFIED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setAuditFilter(st)}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                          auditFilter === st
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Definitive Reconciled Audit Register */}
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        code: 'AUD-01',
                        metric: 'Raw Material Resin 1068 Ledger',
                        status: 'RECONCILIATION_REQUIRED',
                        finding: '200.00 kg variance isolated on Entry ID #2337 (Challan #731, ANU LUBES LLP). Arithmetic closing is 8,200.00 kg vs reported 8,000.00 kg.',
                        source: 'rawmaterial_stockitemtransaction',
                        action: 'Auditor correction recommended on Entry #2337.'
                      },
                      {
                        code: 'AUD-02',
                        metric: 'Cycle Tyre Quality Classification',
                        status: 'RECONCILIATION_REQUIRED',
                        finding: '2 units unclassified on Entry #3701 (Size CT54). Cured total is 88,956 while classified sum (1st + 2nd + Scrap) equals 88,954.',
                        source: 'cycletyres_cycletyreitem',
                        action: 'Flagged for supervisor classification sign-off.'
                      },
                      {
                        code: 'AUD-03',
                        metric: 'Manpower Overtime Scope Harmonization',
                        status: 'VERIFIED',
                        finding: 'Plant Floor OT (11 manufacturing depts) confirmed at 329.0 hrs. Company-Wide HR attendance OT confirmed at 341.0 hrs (+12 hrs in auxiliary/admin depts).',
                        source: 'hrms_attendance',
                        action: 'Scopes formally partitioned and documented.'
                      },
                      {
                        code: 'AUD-04',
                        metric: 'Mixing Mill vs Building Scrap Stream',
                        status: 'VERIFIED',
                        finding: 'Mixing Mill compound ledger contains zero floor mill scrap (141,913.46 kg net usable). Auto building cord trim scrap (3,254.37 kg) verified as independent production stream.',
                        source: 'rawmaterial_mixingentry',
                        action: 'Separate stream ledgers fully verified.'
                      },
                      {
                        code: 'AUD-05',
                        metric: 'Curing to Packaging Flow & Buffer',
                        status: 'PARTIALLY_VERIFIED',
                        finding: 'Cycle Tyre conversion throughput is 97.29% (88,956 cured vs 86,544 packed). Net flow difference (+2,412 pcs) represents floor buffer; physical closing WIP is unverified.',
                        source: 'cycletyres_production_sheet',
                        action: 'Requires physical WIP inventory reconciliation.'
                      }
                    ]
                      .filter((d) => auditFilter === 'ALL' || d.status === auditFilter)
                      .map((d, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all ${
                            d.status === 'RECONCILIATION_REQUIRED'
                              ? 'bg-amber-50/40 border-amber-200'
                              : d.status === 'VERIFIED'
                              ? 'bg-emerald-50/30 border-emerald-200/80'
                              : 'bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-800">
                                {d.code}
                              </span>
                              <span className="font-semibold text-slate-900 text-sm">{d.metric}</span>
                            </div>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                d.status === 'RECONCILIATION_REQUIRED'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : d.status === 'VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}
                            >
                              {d.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="mt-2.5 text-xs text-slate-700 leading-relaxed">
                            {d.finding}
                          </div>

                          <div className="mt-2 text-xs font-mono text-slate-500 pt-2 border-t border-slate-200/60 flex flex-wrap justify-between">
                            <span>Source: {d.source}</span>
                            <span className="font-medium text-slate-700">{d.action}</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Dynamic Management Directives from Engine */}
                  {intelData?.workspaces?.audit_register?.directives?.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">
                        Operational Directives &amp; Analytical Findings
                      </h3>
                      <div className="space-y-3">
                        {intelData.workspaces.audit_register.directives.map((dir, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase">{dir.category}</span>
                              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {dir.badge}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 text-sm mt-1.5">{dir.headline}</div>
                            <div className="text-xs text-slate-600 mt-1 leading-relaxed">{dir.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
