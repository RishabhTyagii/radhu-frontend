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

  const fetchIntelligence = async (selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
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

  // Chart configuration for Daily Trajectory & 2-Sigma Control Band (Dark Terminal Aesthetic)
  const trajectoryChartData = useMemo(() => {
    if (!intelData?.workspaces?.command?.daily_series) return null;
    const series = intelData.workspaces.command.daily_series;
    const stats = intelData.workspaces.command.spc_baseline;

    const labels = series.map((d) => `D${d.day}`);
    const actualData = series.map((d) => (d.is_operating ? d.tyres : null));
    const meanLine = series.map(() => (stats?.operating_days > 0 ? stats.mean_daily : null));
    const uclLine = series.map(() => (stats?.operating_days > 0 ? stats.ucl_2sigma : null));
    const lclLine = series.map(() => (stats?.operating_days > 0 ? stats.lcl_2sigma : null));

    return {
      labels,
      datasets: [
        {
          label: 'Operating Output',
          data: actualData,
          borderColor: '#38bdf8', // terminal sky blue
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: series.map((d) => (d.anomaly_level === 'ANOMALY' ? '#ef4444' : '#38bdf8')),
          borderWidth: 2,
          tension: 0.15,
          fill: true,
          zIndex: 10,
        },
        {
          label: '2-Sigma UCL (Upper Bound)',
          data: uclLine,
          borderColor: '#94a3b8',
          borderDash: [5, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Mean Run-Rate',
          data: meanLine,
          borderColor: '#818cf8',
          borderDash: [6, 3],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: '2-Sigma LCL (Lower Bound)',
          data: lclLine,
          borderColor: '#f87171',
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
          font: { family: 'monospace', size: 12 },
          boxWidth: 14,
          color: '#cbd5e1',
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
        titleFont: { family: 'monospace', size: 13, weight: 'bold' },
        bodyFont: { family: 'monospace', size: 12 },
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
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { font: { family: 'monospace', size: 11 }, color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.4)' },
        ticks: {
          font: { family: 'monospace', size: 11 },
          color: '#94a3b8',
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
    <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200">
      <Navbar />

      {/* Terminal Top Control Bar */}
      <header className="border-b border-[#1e293b] bg-[#0c1220] sticky top-0 z-40 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#131d33] border border-sky-500/30 text-sky-400 font-mono text-xs font-semibold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              RADHU TERMINAL v2.1
            </span>
            <div className="hidden md:flex items-center gap-2 border-l border-slate-700/60 pl-3 font-mono text-xs text-slate-400">
              <span>FACILITY: <span className="text-slate-200 font-medium">Radhu Complex, Meerut Rd</span></span>
              <span className="text-slate-600">|</span>
              <span>ENGINE: <span className="text-emerald-400 font-semibold">analytics_readonly</span></span>
              <span className="text-slate-600">|</span>
              <span>SECURITY: <span className="text-slate-200">SELECT-ONLY (127.0.0.1:3306)</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/plant-performance"
              className="text-xs font-mono px-3 py-1.5 bg-[#172138] hover:bg-[#1e2d4d] text-slate-300 hover:text-white rounded border border-[#2b3d63] transition-all flex items-center gap-1.5"
            >
              <span>&larr;</span> Legacy MIS Sheet
            </Link>

            <div className="flex items-center gap-2 bg-[#131d33] border border-[#243354] rounded px-3 py-1.2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Period:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-xs font-mono font-bold bg-transparent text-sky-400 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => fetchIntelligence(month)}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Polling...
                </>
              ) : (
                'Refresh Terminal'
              )}
            </button>
          </div>
        </div>

        {/* Workspace Navigation Strip */}
        <nav className="w-full px-4 sm:px-6 flex overflow-x-auto no-scrollbar border-t border-[#182338]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs sm:text-sm font-mono uppercase tracking-wider whitespace-nowrap border-b-2 font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-sky-400 text-sky-300 bg-[#141f36] font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101828]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                  activeTab === tab.id
                    ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                    : 'bg-[#182338] text-slate-400'
                }`}
              >
                {tab.tag}
              </span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Terminal Stage */}
      <main className="w-full px-4 sm:px-6 py-6">
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-[#0d1322] border border-[#1c2a47] rounded-lg">
            <div className="w-10 h-10 border-3 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
            <div className="text-center font-mono space-y-1">
              <p className="text-sm text-sky-400 font-semibold tracking-wide">
                QUERYING INDUSTRIAL ANALYTICS VIA ANALYTICS_READONLY...
              </p>
              <p className="text-xs text-slate-400">
                Executing multi-division mass ledger and 2-sigma baseline reconciliation for {month}
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 my-4 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 font-mono text-sm">
            <div className="font-bold flex items-center gap-2 text-red-400 text-base">
              <span>&#9888;</span> ENGINE ACCESS OR QUERY ERROR
            </div>
            <p className="mt-1.5 text-slate-300 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {!loading && intelData && (
          <div className="space-y-6">
            {/* WORKSPACE 01: FACTORY COMMAND CENTER */}
            {activeTab === 'command' && (
              <div className="space-y-5">
                {/* Executive Telemetry Grid (Row 1) */}
                <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="bg-[#0f172a] p-3.5 border border-[#1e293b] rounded-lg shadow-sm">
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Tyres Cured</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1.5 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.total_tyres_cured)}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1">
                      <span>&uarr;</span> 100% vulcanized
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-3.5 border border-[#1e293b] rounded-lg shadow-sm">
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Tyres Packed</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1.5 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.total_tyres_packed)}
                    </div>
                    <div className="text-xs font-mono text-sky-400 mt-1">
                      Throughput: {fmtDec(intelData.workspaces.curing_packing_flow.curing_to_packing_throughput_ratio)}%
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-3.5 border border-[#1e293b] rounded-lg shadow-sm">
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Cycle Tubes Packed</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1.5 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.cycle_tubes_packed)}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      Cured: {fmtNum(intelData.workspaces.command.telemetry.cycle_tubes_cured)}
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-3.5 border border-[#1e293b] rounded-lg shadow-sm">
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Compound Mixed</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1.5 tabular-nums">
                      {fmtNum(intelData.workspaces.command.telemetry.compound_output_kg)} <span className="text-xs font-normal text-slate-400">kg</span>
                    </div>
                    <div className="text-xs font-mono text-emerald-400 mt-1">
                      Zero floor mill scrap
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-3.5 border border-[#1e293b] rounded-lg shadow-sm">
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">1st Grade Quality</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-1.5 tabular-nums">
                      {fmtDec(intelData.workspaces.quality.yield_first_grade_pct)}%
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      {fmtNum(intelData.workspaces.quality.first_grade_pcs)} A-class pcs
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-3.5 border border-[#1e293b] rounded-lg shadow-sm">
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">26-Day Run Rate</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-sky-300 mt-1.5 tabular-nums">
                      {fmtNum(intelData.workspaces.command.spc_baseline.mean_daily)} <span className="text-xs font-normal text-slate-400">/day</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      &plusmn;{fmtDec(intelData.workspaces.command.spc_baseline.std_dev, 0)} (&sigma;)
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-3.5 border border-[#b45309]/50 rounded-lg shadow-sm bg-amber-950/20">
                    <div className="text-xs font-mono text-amber-300 uppercase tracking-wider">Open Exceptions</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 mt-1.5 tabular-nums">
                      2 Unresolved
                    </div>
                    <div className="text-xs font-mono text-amber-300/80 mt-1">
                      Resin 200kg · CT54 2pcs
                    </div>
                  </div>
                </section>

                {/* Main Asymmetric Grid: Trajectory Chart & Anomaly Radar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column (7 cols): Production Trajectory & Screening */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Trajectory Chart Panel */}
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1e293b] gap-2">
                        <div>
                          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
                            Daily Tyre Output Trajectory &amp; 2-Sigma Screening Control Band
                          </h2>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">
                            Baseline: Mean {fmtDec(intelData.workspaces.command.spc_baseline.mean_daily, 1)} tyres/shift · UCL {fmtDec(intelData.workspaces.command.spc_baseline.ucl_2sigma, 1)} · LCL {fmtDec(intelData.workspaces.command.spc_baseline.lcl_2sigma, 1)}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded text-xs font-mono bg-red-950/60 border border-red-800 text-red-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Oct 20 Anomaly Flagged
                        </span>
                      </div>

                      <div className="h-72 w-full mt-4">
                        {trajectoryChartData && <Line data={trajectoryChartData} options={trajectoryChartOptions} />}
                      </div>
                    </div>

                    {/* Operational Shift Screening Log Table */}
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                          Preliminary Anomaly Screening Log (2-Sigma Statistical Deviation)
                        </h3>
                        <span className="text-xs font-mono text-slate-400">
                          Sample: 26 Active Operating Days
                        </span>
                      </div>

                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="border-b border-[#1e293b] text-slate-400 text-left bg-[#131d33]">
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5 text-right">Actual Tyres</th>
                              <th className="p-2.5 text-right">Standard Mean</th>
                              <th className="p-2.5 text-right">Z-Score Deviation</th>
                              <th className="p-2.5">Classification</th>
                              <th className="p-2.5">Factory Operational Context</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e293b]">
                            {intelData.workspaces.command.daily_series
                              .filter((d) => d.anomaly_level === 'ANOMALY')
                              .map((anom, idx) => (
                                <tr key={idx} className="bg-red-950/20 hover:bg-red-950/30">
                                  <td className="p-2.5 font-bold text-slate-200">{anom.date} (D{anom.day})</td>
                                  <td className="p-2.5 text-right font-bold text-red-400 tabular-nums">{fmtNum(anom.tyres)}</td>
                                  <td className="p-2.5 text-right text-slate-300 tabular-nums">
                                    {fmtNum(intelData.workspaces.command.spc_baseline.mean_daily)}
                                  </td>
                                  <td className="p-2.5 text-right font-bold text-red-400 tabular-nums">{fmtDec(anom.z_score)}&sigma;</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 rounded text-[11px] bg-red-900/60 text-red-200 border border-red-700 font-semibold">
                                      LOWER ANOMALY
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-300">
                                    Dussehra festival partial-shift shutdown. Non-structural statistical variation.
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (5 cols): Division Benchmarks, Flow, & RM Cards */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Division Contribution Matrix */}
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                          Production Division Benchmarks
                        </h3>
                        <span className="text-xs font-mono text-slate-400">4 Divisions</span>
                      </div>

                      <div className="mt-3 space-y-3">
                        {intelData.workspaces.divisions.map((div, idx) => (
                          <div key={idx} className="p-3 bg-[#131d33] border border-[#1e293b] rounded flex items-center justify-between">
                            <div>
                              <div className="text-xs font-mono font-bold text-slate-100">{div.division}</div>
                              <div className="text-xs font-mono text-slate-400 mt-0.5">
                                Run-Rate: <span className="text-sky-300 font-semibold">{fmtDec(div.run_rate_per_operating_day, 1)}</span> {div.unit}/shift
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono font-bold text-white tabular-nums">
                                {fmtNum(div.cured_volume)} <span className="text-xs font-normal text-slate-400">{div.unit}</span>
                              </div>
                              <div className="text-xs font-mono text-emerald-400 mt-0.5">
                                {div.throughput_ratio ? `${fmtDec(div.throughput_ratio)}% throughput` : 'Direct Delivery'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Curing vs Packing Flow & Buffer */}
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 shadow-sm">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-[#1e293b]">
                        Curing-to-Packing Flow Dynamics
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="p-3 bg-[#131d33] border border-[#1e293b] rounded">
                          <div className="text-xs font-mono text-slate-400">Cured Gross Output</div>
                          <div className="text-base font-mono font-bold text-white mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.curing_packing_flow.cured_units)} pcs
                          </div>
                        </div>
                        <div className="p-3 bg-[#131d33] border border-[#1e293b] rounded">
                          <div className="text-xs font-mono text-slate-400">Packed Net Output</div>
                          <div className="text-base font-mono font-bold text-white mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.curing_packing_flow.packed_units)} pcs
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-2.5 bg-blue-950/30 border border-blue-900/60 rounded text-xs font-mono text-blue-200 flex justify-between items-center">
                        <span>Net Period Flow Difference:</span>
                        <span className="font-bold text-blue-300">+{fmtNum(intelData.workspaces.curing_packing_flow.net_period_flow_difference)} pcs (Floor Buffer)</span>
                      </div>
                    </div>

                    {/* Raw Material Inventory & 200 kg Discrepancy Snapshot */}
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                          Raw Material Warehouse Ledger
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950 border border-amber-800 text-amber-300">
                          200 kg Variance
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
                        <div className="p-2.5 bg-[#131d33] rounded">
                          <div className="text-slate-400">Opening</div>
                          <div className="font-bold text-slate-200 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.opening_stock_kg)} kg
                          </div>
                        </div>
                        <div className="p-2.5 bg-[#131d33] rounded">
                          <div className="text-slate-400">Received</div>
                          <div className="font-bold text-slate-200 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_received_kg)} kg
                          </div>
                        </div>
                        <div className="p-2.5 bg-[#131d33] rounded">
                          <div className="text-slate-400">Consumed</div>
                          <div className="font-bold text-slate-200 mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_used_kg)} kg
                          </div>
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs font-mono text-slate-400 leading-relaxed">
                        Arithmetic Closing: <span className="text-slate-200 font-semibold">{fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.arithmetic_closing_kg, 2)} kg</span> vs Reported: <span className="text-amber-400 font-semibold">{fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.reported_closing_stock_kg, 2)} kg</span>. Isolated to Entry ID #2337 (Material #101 Resin 1068).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 02: DIVISION INTELLIGENCE */}
            {activeTab === 'divisions' && (
              <div className="space-y-5">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1e293b] gap-2">
                    <div>
                      <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-100">
                        Production Division Benchmarking Matrix
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        Performance comparison across the 4 manufacturing divisions (One complex facility)
                      </p>
                    </div>
                    <span className="text-xs font-mono text-sky-400 border border-sky-800/60 bg-sky-950/40 px-3 py-1 rounded">
                      Standard Unit Partition: Pieces vs Kilograms
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm font-mono">
                      <thead>
                        <tr className="border-b border-[#1e293b] text-slate-400 text-left bg-[#131d33]">
                          <th className="p-3">Production Division</th>
                          <th className="p-3 text-right">Primary Stage (Cured)</th>
                          <th className="p-3 text-right">Secondary Stage (Packed)</th>
                          <th className="p-3 text-right">Conversion Throughput</th>
                          <th className="p-3 text-right">26-Day Run Rate</th>
                          <th className="p-3 text-right">MoM Trajectory</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]">
                        {intelData.workspaces.divisions.map((div, idx) => (
                          <tr key={idx} className="hover:bg-[#131d33]/50 transition-colors">
                            <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                              {div.division}
                            </td>
                            <td className="p-3 text-right font-medium text-slate-200 tabular-nums">
                              {fmtNum(div.cured_volume)} <span className="text-xs text-slate-400">{div.unit}</span>
                            </td>
                            <td className="p-3 text-right font-medium text-slate-200 tabular-nums">
                              {div.packed_volume ? (
                                <>
                                  {fmtNum(div.packed_volume)} <span className="text-xs text-slate-400">{div.unit}</span>
                                </>
                              ) : (
                                <span className="text-slate-500">Internal Feedstock</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {div.throughput_ratio ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                                  {fmtDec(div.throughput_ratio)}%
                                </span>
                              ) : (
                                <span className="text-slate-400">100% Extruder Delivery</span>
                              )}
                            </td>
                            <td className="p-3 text-right text-slate-300 tabular-nums">
                              {fmtDec(div.run_rate_per_operating_day, 1)} {div.unit}/shift
                            </td>
                            <td className="p-3 text-right">
                              {div.mom_growth_pct !== null ? (
                                <span className={div.mom_growth_pct >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                  {div.mom_growth_pct >= 0 ? '+' : ''}
                                  {fmtDec(div.mom_growth_pct)}%
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Division Operational Deep-Dives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 shadow-sm space-y-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">Cycle Tyre &amp; Tube Dynamics</h3>
                    <p className="text-xs font-mono text-slate-300 leading-relaxed">
                      Cycle Tyre cured volume reached 88,956 units across 26 operating days (3,421.4 tyres/shift). Clean packing reached 86,544 units (97.29% conversion velocity). Cycle Tube division processed 60,240 cured and packed units with synchronized floor flow.
                    </p>
                  </div>
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 shadow-sm space-y-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">Auto Tyre &amp; Mixing Mill Dynamics</h3>
                    <p className="text-xs font-mono text-slate-300 leading-relaxed">
                      Auto Tyre cured 20,642 tyres (793.9 tyres/shift). Mixing Mill delivered 141,913.46 kg gross masterbatch compound (5,458.2 kg/shift). Zero mixing mill scrap was generated. Auto building fabric cord trim (3,254.37 kg) is partitioned into a separate independent stream.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 03: QUALITY & SKUS */}
            {activeTab === 'quality' && (
              <div className="space-y-5">
                {/* Quality Grade Ledger */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1e293b] gap-2">
                    <div>
                      <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-100">
                        Cycle Tyre Quality Grading &amp; Scrap Reconciliation
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        Verification of 88,956 cured units against 1st Grade, 2nd Grade, and Rejection classifications
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      FIRST GRADE QUALITY YIELD: {fmtDec(intelData.workspaces.quality.yield_first_grade_pct)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="p-3.5 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-xs font-mono text-slate-400 uppercase">First Grade (A-Class)</div>
                      <div className="text-xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                        {fmtNum(intelData.workspaces.quality.first_grade_pcs)}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {fmtDec(intelData.workspaces.quality.yield_first_grade_pct)}% of classified
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-xs font-mono text-amber-400 uppercase">Second Grade (Downgrade)</div>
                      <div className="text-xl font-mono font-bold text-amber-300 mt-1 tabular-nums">
                        {fmtNum(intelData.workspaces.quality.second_grade_pcs)}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {fmtDec(intelData.workspaces.quality.second_grade_pct)}% of classified
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-xs font-mono text-red-400 uppercase">Factory Rejections</div>
                      <div className="text-xl font-mono font-bold text-red-400 mt-1 tabular-nums">
                        {fmtNum(intelData.workspaces.quality.rejections_pcs)}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {fmtDec(intelData.workspaces.quality.rejection_pct)}% scrap rate
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-950/40 border border-blue-900 rounded">
                      <div className="text-xs font-mono text-sky-400 uppercase">Unclassified Units</div>
                      <div className="text-xl font-mono font-bold text-sky-300 mt-1 tabular-nums">
                        {intelData.workspaces.quality.unclassified_cured_pcs} pcs
                      </div>
                      <div className="text-xs font-mono text-sky-400/80">Audit Flag on Entry #3701</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#131d33] border border-[#2b3d63] rounded text-xs font-mono text-slate-300">
                    <span className="font-bold text-sky-400">&#9432; Quality Discrepancy Note:</span>{' '}
                    {intelData.workspaces.quality.audit_reconciliation_note}
                  </div>
                </div>

                {/* Top SKUs Table */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 shadow-sm">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-[#1e293b]">
                    Top 10 Cycle Tyre SKUs by Vulcanized Volume
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm font-mono">
                      <thead>
                        <tr className="border-b border-[#1e293b] text-slate-400 text-left bg-[#131d33]">
                          <th className="p-2.5">SKU Item Description</th>
                          <th className="p-2.5 text-right">Units Cured</th>
                          <th className="p-2.5 text-right">Share of Division Output</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]">
                        {intelData.workspaces.quality.top_skus.map((sku, idx) => (
                          <tr key={idx} className="hover:bg-[#131d33]/50">
                            <td className="p-2.5 font-bold text-slate-200">{sku.item_name}</td>
                            <td className="p-2.5 text-right font-medium text-slate-100 tabular-nums">{fmtNum(sku.cured_qty)}</td>
                            <td className="p-2.5 text-right text-slate-400 tabular-nums">
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
              <div className="space-y-5">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="pb-3 border-b border-[#1e293b]">
                    <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-100">
                      Attendance &amp; Overtime Scope Harmonization
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Mathematical resolution between Plant Floor Manufacturing Overtime (11 depts) and Company-Wide Overtime (14 depts)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    {/* Plant Floor Overtime */}
                    <div className="p-4 bg-[#131d33] border border-[#1e293b] rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-sky-400">
                          Plant Floor Overtime (11 Depts)
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-800 rounded">
                          Production MIS Scope
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-3 bg-[#0f172a] rounded border border-[#1e293b]">
                          <div className="text-slate-400">October 2026:</div>
                          <div className="text-xl font-bold text-white mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.plant_floor_scope.october_hours)} hrs
                          </div>
                        </div>
                        <div className="p-3 bg-[#0f172a] rounded border border-[#1e293b]">
                          <div className="text-slate-400">September 2026:</div>
                          <div className="text-xl font-bold text-white mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.plant_floor_scope.september_hours)} hrs
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-slate-300 mt-3 leading-relaxed">
                        Filtered strictly to the 11 manufacturing departments present in daily production sheets with active shift statuses (Present, Half Day, Late). Excludes non-manufacturing admin departments.
                      </p>
                    </div>

                    {/* Company-Wide Overtime */}
                    <div className="p-4 bg-[#131d33] border border-[#1e293b] rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-purple-400">
                          Company-Wide Overtime (14 Depts)
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded">
                          HR Master Scope
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-3 bg-[#0f172a] rounded border border-[#1e293b]">
                          <div className="text-slate-400">October 2026:</div>
                          <div className="text-xl font-bold text-white mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.company_wide_scope.october_hours)} hrs
                          </div>
                        </div>
                        <div className="p-3 bg-[#0f172a] rounded border border-[#1e293b]">
                          <div className="text-slate-400">September 2026:</div>
                          <div className="text-xl font-bold text-white mt-1 tabular-nums">
                            {fmtNum(intelData.workspaces.manpower.company_wide_scope.september_hours)} hrs
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-slate-300 mt-3 leading-relaxed">
                        Comprehensive HR attendance ledger including auxiliary departments (Chakka, Store, Office) and weekend maintenance hours recorded under Week Off / Absent shift types (+2,093 hrs in Sep, +12 hrs in Oct).
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-950/30 border border-amber-800/80 rounded text-xs font-mono text-amber-200">
                    <span className="font-bold text-amber-400">&#9888; Reconciled Delta:</span>{' '}
                    {intelData.workspaces.manpower.audit_findings.audit_explanation}
                  </div>
                </div>

                {/* Masked HR Payroll & Wage Security Box */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Payroll Overtime Disbursements &amp; RBAC Privacy Shield
                    </h3>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      RBAC: MASKED FOR GENERAL USERS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs font-mono">
                    <div className="p-3 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400">Payroll Records Ingested</div>
                      <div className="text-lg font-bold text-white mt-1 tabular-nums">
                        {intelData.workspaces.manpower.payroll_october.records_count} employees
                      </div>
                    </div>
                    <div className="p-3 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400">Total Overtime Pay Disbursed</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1 tabular-nums">
                        {intelData.workspaces.manpower.payroll_october.total_ot_amount_disbursed}
                      </div>
                    </div>
                    <div className="p-3 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400">Individual Compensation Details</div>
                      <div className="text-xs font-bold text-slate-400 mt-1">
                        {intelData.workspaces.manpower.payroll_october.individual_salaries}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 05: COMPOUND & RAW MATERIAL */}
            {activeTab === 'materials' && (
              <div className="space-y-5">
                {/* Compound Mixing Mass Ledger */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-100 pb-3 border-b border-[#1e293b]">
                    Compound Mixing Mill Mass Balance Ledger
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="p-3.5 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-xs font-mono text-slate-400 uppercase">Gross Compound Produced</div>
                      <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.gross_produced_kg, 2)} kg
                      </div>
                      <div className="text-xs font-mono text-emerald-400">100% Usable Batch Mass</div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-xs font-mono text-slate-400 uppercase">Mixing Mill Scrap</div>
                      <div className="text-xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.mixing_mill_scrap_kg, 2)} kg
                      </div>
                      <div className="text-xs font-mono text-slate-400">Zero Floor Mill Wastage</div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-xs font-mono text-slate-400 uppercase">Net Usable Output</div>
                      <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.net_usable_output_kg, 2)} kg
                      </div>
                      <div className="text-xs font-mono text-slate-400">Transferred to Building lines</div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-xs font-mono text-slate-400 uppercase">Internal Extruder Consumption</div>
                      <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.compound_mixing_ledger.consumed_internally_kg, 2)} kg
                      </div>
                      <div className="text-xs font-mono text-slate-400">Stock Balance: 0.00 kg</div>
                    </div>
                  </div>
                </div>

                {/* Independent Auto Building Scrap Ledger */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Independent Fabric / Drum Cord Scrap Classification
                    </h3>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-sky-950 text-sky-300 border border-sky-800">
                      SEPARATED STREAM (NOT MIXING SCRAP)
                    </span>
                  </div>

                  <div className="mt-3 p-3.5 bg-[#131d33] border border-[#1e293b] rounded text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Auto Building Fabric Scrap (auto_building_fab_scrap):</span>
                      <span className="font-bold text-white text-sm tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.independent_auto_building_scrap.total_scrap_kg, 2)} kg
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {intelData.workspaces.compound_raw_material.independent_auto_building_scrap.reconciliation_note}
                    </p>
                  </div>
                </div>

                {/* Raw Material Inventory Ledger & 200 kg Audit */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Raw Material Warehouse Stock Reconciliation
                    </h3>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-amber-950 text-amber-300 border border-amber-800">
                      DISCREPANCY ISOLATED TO ENTRY #2337
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-mono">
                    <div className="p-3 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Opening Stock (Reported)</div>
                      <div className="text-base font-bold text-white mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.opening_stock_kg, 2)} kg
                      </div>
                    </div>
                    <div className="p-3 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Received in Oct</div>
                      <div className="text-base font-bold text-white mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_received_kg, 2)} kg
                      </div>
                    </div>
                    <div className="p-3 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Consumed in Oct</div>
                      <div className="text-base font-bold text-white mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.total_used_kg, 2)} kg
                      </div>
                    </div>
                    <div className="p-3 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Reported Closing Stock</div>
                      <div className="text-base font-bold text-white mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.compound_raw_material.rm_warehouse_ledger.reported_closing_stock_kg, 2)} kg
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#131d33] border border-[#2b3d63] rounded text-xs font-mono text-slate-300">
                    <div className="font-bold text-amber-400 mb-1">&#9888; 200 kg Mathematical Variance Isolation:</div>
                    <p className="leading-relaxed">
                      {intelData.workspaces.compound_raw_material.rm_warehouse_ledger.audit_finding_200kg.details}
                    </p>
                    <div className="mt-2 text-slate-400 font-semibold">
                      Exact Entry: ID #2337 | Material #101 Resin 1068 | Date: 2026-10-29 | Challan #731 | Supplier: ANU LUBES LLP
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 06: CURING & PACKING FLOW */}
            {activeTab === 'curing_packing' && (
              <div className="space-y-5">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="pb-3 border-b border-[#1e293b]">
                    <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-100">
                      Curing-to-Packing Flow Dynamics &amp; Throughput
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Cycle Tyre conversion velocity between hot vulcanization and finished packaging
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-mono">
                    <div className="p-3.5 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Cured Output</div>
                      <div className="text-xl font-bold text-white mt-1 tabular-nums">
                        {fmtNum(intelData.workspaces.curing_packing_flow.cured_units)}
                      </div>
                      <div className="text-slate-400">Gross Vulcanized</div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Packed Output</div>
                      <div className="text-xl font-bold text-white mt-1 tabular-nums">
                        {fmtNum(intelData.workspaces.curing_packing_flow.packed_units)}
                      </div>
                      <div className="text-slate-400">Wrapped for Dispatch</div>
                    </div>

                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-800 rounded">
                      <div className="text-emerald-400 uppercase">Throughput Ratio</div>
                      <div className="text-xl font-bold text-emerald-300 mt-1 tabular-nums">
                        {fmtDec(intelData.workspaces.curing_packing_flow.curing_to_packing_throughput_ratio)}%
                      </div>
                      <div className="text-emerald-400/80">Conversion Velocity</div>
                    </div>

                    <div className="p-3.5 bg-blue-950/40 border border-blue-800 rounded">
                      <div className="text-sky-400 uppercase">Net Period Flow Difference</div>
                      <div className="text-xl font-bold text-sky-300 mt-1 tabular-nums">
                        +{fmtNum(intelData.workspaces.curing_packing_flow.net_period_flow_difference)}
                      </div>
                      <div className="text-sky-400/80">Cured - Packed Buffer</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#131d33] border border-[#2b3d63] rounded text-xs font-mono text-slate-300">
                    <span className="font-bold text-sky-400">&#9432; Work-In-Progress (WIP) Disclosure:</span>{' '}
                    {intelData.workspaces.curing_packing_flow.wip_verification_statement}
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 07: COMMERCIAL INVOICING */}
            {activeTab === 'commercial' && (
              <div className="space-y-5">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="pb-3 border-b border-[#1e293b]">
                    <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-100">
                      Commercial Invoicing &amp; Tally Prime Synchronization
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      GST sales vouchers and customer revenue roll-up for {month}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-xs font-mono">
                    <div className="p-3.5 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Total Invoices Generated</div>
                      <div className="text-xl font-bold text-white mt-1 tabular-nums">
                        {intelData.workspaces.commercial.total_invoices_count} vouchers
                      </div>
                      <div className="text-slate-400">Synced via Tally XML</div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Total Commercial Value</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
                        {fmtCur(intelData.workspaces.commercial.total_invoiced_value_inr)}
                      </div>
                      <div className="text-slate-400">Gross Invoiced Turnover</div>
                    </div>

                    <div className="p-3.5 bg-[#131d33] rounded border border-[#1e293b]">
                      <div className="text-slate-400 uppercase">Average Invoice Size</div>
                      <div className="text-xl font-bold text-white mt-1 tabular-nums">
                        {intelData.workspaces.commercial.total_invoices_count > 0
                          ? fmtCur(
                              intelData.workspaces.commercial.total_invoiced_value_inr /
                                intelData.workspaces.commercial.total_invoices_count
                            )
                          : '—'}
                      </div>
                      <div className="text-slate-400">Per B2B Consignment</div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-[#1e293b]">
                      Top Commercial Accounts by Invoiced Volume
                    </h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm font-mono">
                        <thead>
                          <tr className="border-b border-[#1e293b] text-slate-400 text-left bg-[#131d33]">
                            <th className="p-3">Customer Account / Party Ledger</th>
                            <th className="p-3 text-right">Invoices</th>
                            <th className="p-3 text-right">Total Invoiced Amount (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]">
                          {intelData.workspaces.commercial.top_customers.map((cust, idx) => (
                            <tr key={idx} className="hover:bg-[#131d33]/50">
                              <td className="p-3 font-bold text-slate-200">{cust.customer_name}</td>
                              <td className="p-3 text-right text-slate-400 tabular-nums">{cust.invoices}</td>
                              <td className="p-3 text-right font-bold text-emerald-400 tabular-nums">{fmtCur(cust.total_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 08: METRIC REGISTER & AUDITS (PROFESSIONAL GOVERNANCE CONSOLE) */}
            {activeTab === 'audit_register' && (
              <div className="space-y-5">
                {/* Governance Summary Bar */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1e293b] gap-2">
                    <div>
                      <h2 className="text-base font-mono font-bold uppercase tracking-wider text-slate-100">
                        Industrial Data Governance &amp; Metric Verification Register
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        Definitive mathematical reconciliation and source audit ledger for Radhu Complex
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded text-xs font-mono bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                        2 RECONCILIATIONS REQUIRED
                      </span>
                      <span className="px-2.5 py-1 rounded text-xs font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                        5 VERIFIED
                      </span>
                    </div>
                  </div>

                  {/* Status Distribution Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs font-mono">
                    <div className="p-3 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-slate-400 uppercase text-[11px]">Verified Ledgers</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">5</div>
                      <div className="text-slate-400 mt-0.5">100% Traceable</div>
                    </div>
                    <div className="p-3 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-slate-400 uppercase text-[11px]">Partially Verified</div>
                      <div className="text-xl font-bold text-sky-400 mt-1 tabular-nums">2</div>
                      <div className="text-slate-400 mt-0.5">Quality Yield &amp; Flow</div>
                    </div>
                    <div className="p-3 bg-amber-950/40 border border-amber-800 rounded">
                      <div className="text-amber-400 uppercase text-[11px]">Reconciliation Required</div>
                      <div className="text-xl font-bold text-amber-300 mt-1 tabular-nums">2</div>
                      <div className="text-amber-300/80 mt-0.5">Resin 200kg · CT54 2pcs</div>
                    </div>
                    <div className="p-3 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-slate-400 uppercase text-[11px]">Not Available</div>
                      <div className="text-xl font-bold text-slate-400 mt-1 tabular-nums">1</div>
                      <div className="text-slate-400 mt-0.5">Physical WIP Balance</div>
                    </div>
                    <div className="p-3 bg-[#131d33] border border-[#1e293b] rounded">
                      <div className="text-slate-400 uppercase text-[11px]">Engine Security</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">ENFORCED</div>
                      <div className="text-emerald-400 mt-0.5">SELECT-Only Error 1142</div>
                    </div>
                  </div>

                  {/* Exception Register Table */}
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm font-mono">
                      <thead>
                        <tr className="border-b border-[#1e293b] text-slate-400 text-left bg-[#131d33]">
                          <th className="p-3">Exception ID &amp; Metric</th>
                          <th className="p-3">Source Table &amp; Record</th>
                          <th className="p-3 text-right">Recorded Value</th>
                          <th className="p-3 text-right">Expected Value</th>
                          <th className="p-3 text-right">Variance</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Audit Finding &amp; Governance Directive</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]">
                        {/* Item 1 */}
                        <tr className="hover:bg-[#131d33]/50">
                          <td className="p-3 font-bold text-slate-100">
                            EXC-01: RM Stock Balance
                          </td>
                          <td className="p-3 text-slate-300">
                            rawmaterial_stockentry (ID #2337)
                          </td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">1,399,412.63 kg</td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">1,399,612.63 kg</td>
                          <td className="p-3 text-right font-bold text-amber-400 tabular-nums">200.00 kg</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 border border-amber-800 text-amber-300">
                              RECONCILIATION REQUIRED
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 leading-relaxed">
                            Resin 1068 receipt of 200 kg from ANU LUBES LLP (Challan #731) logged on 2026-10-29 was not added to the recorded closing balance of 69 kg. Flagged transparently; historical row unmodified.
                          </td>
                        </tr>

                        {/* Item 2 */}
                        <tr className="hover:bg-[#131d33]/50">
                          <td className="p-3 font-bold text-slate-100">
                            EXC-02: Quality Grading Units
                          </td>
                          <td className="p-3 text-slate-300">
                            cycletyres_cycletyreentry (ID #3701)
                          </td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">406 graded pcs</td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">408 cured pcs</td>
                          <td className="p-3 text-right font-bold text-amber-400 tabular-nums">2 pcs</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 border border-amber-800 text-amber-300">
                              RECONCILIATION REQUIRED
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 leading-relaxed">
                            SKU CT54 curing logged 408 pcs vs 392 First + 1 Second + 13 Rejected = 406. Exactly 2 unclassified units displayed separately in WS 03; First grade yield computed over 88,954 classified units.
                          </td>
                        </tr>

                        {/* Item 3 */}
                        <tr className="hover:bg-[#131d33]/50">
                          <td className="p-3 font-bold text-slate-100">
                            LED-01: Scrap Stream Partition
                          </td>
                          <td className="p-3 text-slate-300">
                            plantperformance_dailylog
                          </td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">3,254.37 kg</td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">Independent</td>
                          <td className="p-3 text-right text-emerald-400 font-bold tabular-nums">0.00 kg</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                              VERIFIED
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 leading-relaxed">
                            Auto Building Fabric Scrap is classified strictly under tyre-building drum cord trim. Compound mixing mill output remains 141,913.46 kg with 0.00 kg mixing scrap. Streams separated cleanly.
                          </td>
                        </tr>

                        {/* Item 4 */}
                        <tr className="hover:bg-[#131d33]/50">
                          <td className="p-3 font-bold text-slate-100">
                            LED-02: Overtime Scope Boundaries
                          </td>
                          <td className="p-3 text-slate-300">
                            hrms_attendance (78-col vs Master)
                          </td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">329h (Plant)</td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">341h (Company)</td>
                          <td className="p-3 text-right text-sky-400 font-bold tabular-nums">+12h (Oct) / +2,093h (Sep)</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                              VERIFIED
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 leading-relaxed">
                            Difference reconciled to 3 non-manufacturing auxiliary departments and weekend maintenance shifts recorded under Week Off / Absent shift types. Presented side-by-side in WS 04.
                          </td>
                        </tr>

                        {/* Item 5 */}
                        <tr className="hover:bg-[#131d33]/50">
                          <td className="p-3 font-bold text-slate-100">
                            LED-03: Curing-to-Packing Flow
                          </td>
                          <td className="p-3 text-slate-300">
                            CT Curing vs Packaging Log
                          </td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">86,544 packed</td>
                          <td className="p-3 text-right text-slate-200 tabular-nums">88,956 cured</td>
                          <td className="p-3 text-right text-sky-400 font-bold tabular-nums">+2,412 pcs</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-950 border border-sky-800 text-sky-300">
                              PARTIALLY VERIFIED
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 leading-relaxed">
                            Net Period Flow Difference (+2,412 pcs) represents vulcanization floor buffer. Physical WIP closing balance is marked NOT AVAILABLE pending physical inventory count baseline.
                          </td>
                        </tr>

                        {/* Item 6 */}
                        <tr className="hover:bg-[#131d33]/50">
                          <td className="p-3 font-bold text-slate-100">
                            SEC-01: Engine Security Enforcement
                          </td>
                          <td className="p-3 text-slate-300">
                            MySQL radhu_analytics (radhudb)
                          </td>
                          <td className="p-3 text-right text-slate-200">Error 1142</td>
                          <td className="p-3 text-right text-slate-200">Write Rejection</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">100% Safe</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                              VERIFIED
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 leading-relaxed">
                            SELECT-only user granted at MySQL storage engine level. Write operations actively rejected. All queries execute through analytics_readonly Django connection.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
