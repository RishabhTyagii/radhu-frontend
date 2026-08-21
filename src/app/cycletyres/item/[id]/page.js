'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function ItemDetailPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const res = await apiGet(`/cycletyres/item-analytics/${params.id}/`);
      if (res) setData(res);
      setLoading(false);
    }
    if (params.id) fetch();
  }, [params.id]);

  const t = {
    bg: darkMode ? '#07101e' : '#f8fafc',
    bg2: darkMode ? '#111827' : '#ffffff',
    bg3: darkMode ? '#0f172a' : '#f1f5f9',
    text: darkMode ? '#f1f5f9' : '#0f172a',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#1e2d45' : '#e2e8f0',
    shadow: darkMode ? '0 8px 32px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.07)',
    chartGrid: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <Navbar />
      <div style={{ width: '60px', height: '60px', border: '5px solid #0d9488', borderTop: '5px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#94a3b8' }}>Loading item intelligence...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text }}>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem' }}>🚴</div>
        <h2 style={{ color: '#ef4444' }}>Item Not Found</h2>
        <Link href="/cycletyres/ai-analytics" style={{ color: '#7c3aed', fontWeight: 700 }}>← Back to AI Analytics</Link>
      </div>
    </div>
  );

  const { item_info, monthly_history, daily_history, all_time_totals, grade_breakdown, velocity_stats, top_buyers } = data;
  const itemTitle = `${item_info.size} ${item_info.box_type} ${item_info.brand}`.trim();

  // 12-month chart
  const monthlyChartData = {
    labels: monthly_history.labels,
    datasets: [
      {
        type: 'bar',
        label: '1st Grade Production',
        data: monthly_history.production,
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        borderRadius: 6,
      },
      {
        type: 'bar',
        label: 'Total Sales',
        data: monthly_history.sales,
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderRadius: 6,
      },
      {
        type: 'line',
        label: 'Curing (Press)',
        data: monthly_history.curing,
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  // Grade doughnut
  const gradeDoughnut = {
    labels: ['1st Grade', '2nd Grade', 'Rejected'],
    datasets: [{
      data: [grade_breakdown.first_grade, grade_breakdown.second_grade, grade_breakdown.rejected_grade],
      backgroundColor: ['#2563eb', '#f59e0b', '#ef4444'],
      borderWidth: 3,
      borderColor: darkMode ? '#111827' : '#ffffff',
      hoverOffset: 8,
    }],
  };

  // Daily activity line chart
  const dailyChartData = {
    labels: daily_history.labels,
    datasets: [
      {
        label: 'Daily Production (pcs)',
        data: daily_history.production,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Daily Sales (pcs)',
        data: daily_history.sales,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const chartBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.text, font: { size: 11, weight: 'bold' } } },
      tooltip: { backgroundColor: darkMode ? '#0f172a' : '#fff', titleColor: t.text, bodyColor: t.text2, borderColor: t.border, borderWidth: 1, padding: 10 },
    },
    scales: {
      x: { grid: { color: t.chartGrid }, ticks: { color: t.text2, font: { size: 10 } } },
      y: { grid: { color: t.chartGrid }, ticks: { color: t.text2 } },
    },
  };

  const riskBg = {
    CRITICAL: 'rgba(239,68,68,0.12)',
    MODERATE: 'rgba(245,158,11,0.12)',
    HEALTHY: 'rgba(16,185,129,0.12)',
    OVERSTOCKED: 'rgba(37,99,235,0.12)',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, transition: 'all 0.3s' }}>
      <Navbar />
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '20px 16px' }}>

        {/* Breadcrumb + Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Link href="/cycletyres/ai-analytics" style={{ color: '#0d9488', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>← AI Analytics</Link>
              <span style={{ color: t.text2 }}>/</span>
              <span style={{ color: t.text2, fontSize: '0.85rem' }}>Tyre Item Intelligence</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(135deg, #059669, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🚴 {itemTitle}
            </h1>
            <p style={{ color: t.text2, fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Material: {item_info.material} &nbsp;•&nbsp; Weight: {item_info.weight} kg
            </p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '8px 18px', borderRadius: '50px', border: `2px solid ${t.border}`, backgroundColor: t.bg2, color: t.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
            {darkMode ? '🌙' : '☀️'} {darkMode ? 'Dark' : 'Light'}
          </button>
        </div>

        {/* AI Recommendation Banner */}
        <div style={{ borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', background: `linear-gradient(135deg, ${velocity_stats.risk_color}22, ${velocity_stats.risk_color}11)`, border: `2px solid ${velocity_stats.risk_color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: velocity_stats.risk_color, textTransform: 'uppercase', marginBottom: '4px' }}>🤖 AI Production Recommendation</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: t.text }}>{velocity_stats.recommendation}</div>
          </div>
          <span style={{ padding: '8px 18px', borderRadius: '50px', backgroundColor: velocity_stats.risk_color, color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
            {velocity_stats.stockout_risk}
          </span>
        </div>

        {/* Stock Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: '📦 1st Grade Stock', value: `${item_info.stock?.toLocaleString()} pcs`, color: '#2563eb' },
            { label: '🟡 2nd Grade Stock', value: `${item_info.second_stock?.toLocaleString()} pcs`, color: '#f59e0b' },
            { label: '🟣 RFM Stock', value: `${item_info.rfm_stock?.toLocaleString()} pcs`, color: '#7c3aed' },
            { label: '📊 Combined Total', value: `${(item_info.stock + item_info.second_stock + item_info.rfm_stock)?.toLocaleString()} pcs`, color: '#10b981' },
          ].map((c, i) => (
            <div key={i} style={{ backgroundColor: t.bg2, borderRadius: '14px', padding: '16px', border: `2px solid ${t.border}`, borderLeft: `6px solid ${c.color}`, boxShadow: t.shadow }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: t.text2, textTransform: 'uppercase', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* AI Velocity Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: '⚡ Daily Velocity', value: `${velocity_stats.daily_velocity} pcs/day`, color: '#0d9488', bg: 'rgba(13,148,136,0.1)' },
            { label: '🔮 30-Day Forecast', value: `${velocity_stats.projected_demand_30d?.toLocaleString()} pcs`, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
            { label: '🗓️ Days of Inventory', value: `${velocity_stats.days_of_inventory === 999 ? '∞' : velocity_stats.days_of_inventory} Days`, color: velocity_stats.risk_color, bg: riskBg[velocity_stats.stockout_risk] || 'rgba(0,0,0,0.05)' },
            { label: '🏭 Total Curing (All Time)', value: `${all_time_totals.total_curing?.toLocaleString()} pcs`, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
          ].map((c, i) => (
            <div key={i} style={{ backgroundColor: c.bg, borderRadius: '14px', padding: '16px', border: `2px solid ${t.border}`, boxShadow: t.shadow }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: t.text2, textTransform: 'uppercase', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* 12-Month Production vs Sales */}
          <div style={{ backgroundColor: t.bg2, borderRadius: '18px', padding: '22px', border: `2px solid ${t.border}`, boxShadow: t.shadow }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: t.text }}>📊 12-Month Production & Sales History</h3>
            <div style={{ height: '300px' }}>
              <Bar data={monthlyChartData} options={chartBase} />
            </div>
          </div>

          {/* Grade Doughnut */}
          <div style={{ backgroundColor: t.bg2, borderRadius: '18px', padding: '22px', border: `2px solid ${t.border}`, boxShadow: t.shadow }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: t.text }}>🥧 All-Time Quality Grade Composition</h3>
            <div style={{ height: '230px' }}>
              <Doughnut data={gradeDoughnut} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: t.text, font: { size: 11 }, boxWidth: 14 } }, tooltip: { backgroundColor: darkMode ? '#0f172a' : '#fff', titleColor: t.text, bodyColor: t.text2, borderColor: t.border, borderWidth: 1 } } }} />
            </div>
            {/* Grade percentages */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px' }}>
              {[
                { label: '1st Grade', pct: grade_breakdown.first_pct, color: '#2563eb' },
                { label: '2nd Grade', pct: grade_breakdown.second_pct, color: '#f59e0b' },
                { label: 'Rejected', pct: grade_breakdown.rejected_pct, color: '#ef4444' },
              ].map((g, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: g.color }}>{g.pct}%</div>
                  <div style={{ fontSize: '0.7rem', color: t.text2 }}>{g.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Daily Activity Chart */}
        <div style={{ backgroundColor: t.bg2, borderRadius: '18px', padding: '22px', border: `2px solid ${t.border}`, boxShadow: t.shadow, marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: t.text }}>📈 Last 30 Days — Daily Production vs Sales</h3>
          <div style={{ height: '260px' }}>
            <Line data={dailyChartData} options={chartBase} />
          </div>
        </div>

        {/* Top Buyers Table */}
        <div style={{ backgroundColor: t.bg2, borderRadius: '18px', border: `2px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: t.text }}>🏆 Top Dealers & Buyers for This Item</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: t.bg3, color: t.text2 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>RANK</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>PARTY / DEALER</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>TOTAL QTY</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>ORDER COUNT</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>AVG PER ORDER</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {top_buyers.map((b, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: idx % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 800, color: ['#f59e0b', '#94a3b8', '#cd7f32'][idx] || t.text2, fontSize: '1rem' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: t.text }}>{b.party_name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>{b.total_qty?.toLocaleString()} pcs</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: t.text }}>{b.order_count}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{b.avg_per_order?.toLocaleString()} pcs</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Link href={`/cycletyres/party/${b.party_id}`} style={{ padding: '5px 14px', borderRadius: '50px', backgroundColor: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none', display: 'inline-block' }}>
                        🔍 Party Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {top_buyers.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: t.text2 }}>No order data for this item yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
