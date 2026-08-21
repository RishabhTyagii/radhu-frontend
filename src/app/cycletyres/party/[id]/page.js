'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

const STATUS_COLORS = {
  pending: '#f59e0b',
  approved: '#2563eb',
  dispatched: '#10b981',
  completed: '#059669',
  cancelled: '#ef4444',
};
const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32', '#6366f1', '#10b981'];
const RANK_LABELS = ['🥇 #1 Preferred', '🥈 #2 Preferred', '🥉 #3 Preferred', '#4 Popular', '#5 Popular'];

export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | history | items

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const res = await apiGet(`/cycletyres/party-analytics/${params.id}/`);
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
      <div style={{ width: '60px', height: '60px', border: '5px solid #7c3aed', borderTop: '5px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading party intelligence...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text }}>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem' }}>🏢</div>
        <h2 style={{ color: '#ef4444' }}>Party Not Found</h2>
        <p style={{ color: t.text2 }}>This party ID doesn&apos;t exist or has no data.</p>
        <Link href="/cycletyres/ai-analytics" style={{ color: '#7c3aed', fontWeight: 700 }}>← Back to AI Analytics</Link>
      </div>
    </div>
  );

  const { party, order_history, monthly_chart, item_preferences, ai_summary } = data;

  // Chart data
  const monthlyBarData = {
    labels: monthly_chart.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Quantity Ordered (Pcs)',
        data: monthly_chart.quantities,
        backgroundColor: 'rgba(124, 58, 237, 0.7)',
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Orders Placed',
        data: monthly_chart.orders_count,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        yAxisID: 'y1',
      },
    ],
  };

  const doughnutColors = ['#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#ef4444'];
  const itemPrefDoughnut = {
    labels: item_preferences.slice(0, 5).map(i => i.item_name.length > 20 ? i.item_name.slice(0, 20) + '…' : i.item_name),
    datasets: [{
      data: item_preferences.slice(0, 5).map(i => i.total_qty),
      backgroundColor: doughnutColors,
      borderWidth: 3,
      borderColor: darkMode ? '#111827' : '#ffffff',
      hoverOffset: 10,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.text, font: { size: 11, weight: 'bold' } } },
      tooltip: { backgroundColor: darkMode ? '#0f172a' : '#fff', titleColor: t.text, bodyColor: t.text2, borderColor: t.border, borderWidth: 1, padding: 10 },
    },
    scales: {
      x: { grid: { color: t.chartGrid }, ticks: { color: t.text2, font: { size: 10 } } },
      y: { grid: { color: t.chartGrid }, ticks: { color: t.text2 }, type: 'linear', position: 'left' },
      y1: { grid: { display: false }, ticks: { color: '#f59e0b' }, type: 'linear', position: 'right' },
    },
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, transition: 'all 0.3s' }}>
      <Navbar />
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Link href="/cycletyres/ai-analytics" style={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>← AI Analytics</Link>
              <span style={{ color: t.text2 }}>/</span>
              <span style={{ color: t.text2, fontSize: '0.85rem' }}>Tally Party Intelligence</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🏢 {party.name}
            </h1>
            <p style={{ color: t.text2, fontSize: '0.85rem', margin: '6px 0 0 0', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>📍 <strong>Location:</strong> {party.location || party.state || 'India'}</span>
              {party.gstin && <span>🏷️ <strong>GSTIN:</strong> {party.gstin}</span>}
              <span>🧾 <strong>Tally Invoices:</strong> {party.total_orders} Bills</span>
              <span>💰 <strong>Turnover:</strong> {ai_summary.total_value}</span>
            </p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '8px 18px', borderRadius: '50px', border: `2px solid ${t.border}`, backgroundColor: t.bg2, color: t.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
            {darkMode ? '🌙' : '☀️'} {darkMode ? 'Dark' : 'Light'}
          </button>
        </div>

        {/* AI Recommendation Banner */}
        <div style={{ borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', background: 'linear-gradient(135deg, #4c1d95, #1e40af)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', boxShadow: '0 6px 24px rgba(124,58,237,0.35)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>🤖 AI Sales Intelligence Recommendation</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{ai_summary.recommendation_text}</div>
          </div>
          <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 20px', minWidth: '100px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: ai_summary.urgency_color }}>{ai_summary.propensity_score}%</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>Propensity</div>
          </div>
        </div>

        {/* 5 KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: '📦 Total Orders', value: ai_summary.total_orders, sub: 'Lifetime', color: '#7c3aed' },
            { label: '🔢 Total Qty Purchased', value: `${ai_summary.total_quantity?.toLocaleString()} pcs`, sub: 'Lifetime cycle tyres', color: '#2563eb' },
            { label: '🔁 Avg Reorder Cycle', value: `${ai_summary.avg_interval_days} Days`, sub: 'Between orders', color: '#0d9488' },
            { label: '📅 Next Predicted Order', value: ai_summary.predicted_reorder_date, sub: ai_summary.urgency_label, color: ai_summary.urgency_color },
            { label: '💰 Total Lifetime Value', value: ai_summary.total_value, sub: 'All orders combined', color: '#10b981' },
          ].map((c, i) => (
            <div key={i} style={{ backgroundColor: t.bg2, borderRadius: '14px', padding: '16px', border: `2px solid ${t.border}`, borderLeft: `6px solid ${c.color}`, boxShadow: t.shadow }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: t.text2, textTransform: 'uppercase', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '0.72rem', color: t.text2, marginTop: '2px' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[['overview', '📊 Overview & Charts'], ['history', '📋 Order History'], ['items', '📦 Item Preferences']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '9px 22px', borderRadius: '50px', border: activeTab === tab ? '2px solid #7c3aed' : `2px solid ${t.border}`, backgroundColor: activeTab === tab ? 'rgba(124,58,237,0.12)' : 'transparent', color: activeTab === tab ? '#7c3aed' : t.text2, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>

            {/* Monthly Trend Chart */}
            <div style={{ backgroundColor: t.bg2, borderRadius: '18px', padding: '22px', border: `2px solid ${t.border}`, boxShadow: t.shadow }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: t.text }}>📈 12-Month Buying Trend</h3>
              <div style={{ height: '300px' }}>
                <Bar data={monthlyBarData} options={chartOpts} />
              </div>
            </div>

            {/* Item Preference Doughnut */}
            <div style={{ backgroundColor: t.bg2, borderRadius: '18px', padding: '22px', border: `2px solid ${t.border}`, boxShadow: t.shadow }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: t.text }}>🍩 Top Product Preferences</h3>
              <div style={{ height: '300px' }}>
                {item_preferences.length > 0 ? (
                  <Doughnut data={itemPrefDoughnut} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: t.text, font: { size: 10 }, boxWidth: 12 } }, tooltip: { backgroundColor: darkMode ? '#0f172a' : '#fff', titleColor: t.text, bodyColor: t.text2, borderColor: t.border, borderWidth: 1 } } }} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text2 }}>No item order data found</div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Order History Tab */}
        {activeTab === 'history' && (
          <div style={{ backgroundColor: t.bg2, borderRadius: '18px', border: `2px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: t.text }}>🧾 Tally Sales Invoices &amp; Billing Ledger</h3>
              <span style={{ fontSize: '0.8rem', color: t.text2 }}>Showing {order_history.length} Invoices</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: t.bg3, color: t.text2, textAlign: 'center' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>TALLY VOUCHER NO.</th>
                    <th style={{ padding: '12px 14px' }}>DATE</th>
                    <th style={{ padding: '12px 14px' }}>STATUS</th>
                    <th style={{ padding: '12px 14px' }}>ITEMS</th>
                    <th style={{ padding: '12px 14px' }}>TOTAL QTY</th>
                    <th style={{ padding: '12px 14px' }}>INVOICE VALUE</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>BILLED ITEMS / REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {order_history.map((o, idx) => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: idx % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#7c3aed' }}>{o.id}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: t.text2 }}>{new Date(o.date).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '50px', backgroundColor: o.status === 'synced' ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.15)', color: o.status === 'synced' ? '#10b981' : '#2563eb', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: t.text }}>{o.items_count} SKUs</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{o.total_qty?.toLocaleString()} pcs</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{o.total_value}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'left', color: t.text2, fontSize: '0.78rem' }}>{o.notes || '—'}</td>
                    </tr>
                  ))}
                  {order_history.length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: t.text2 }}>No Tally billing invoices found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Item Preferences Tab */}
        {activeTab === 'items' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {item_preferences.map((item, idx) => (
              <div key={item.item_id} style={{ backgroundColor: t.bg2, borderRadius: '16px', padding: '20px', border: `2px solid ${t.border}`, borderTop: `6px solid ${RANK_COLORS[idx] || '#6366f1'}`, boxShadow: t.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', backgroundColor: `${RANK_COLORS[idx] || '#6366f1'}20`, color: RANK_COLORS[idx] || '#6366f1' }}>
                    {RANK_LABELS[idx] || `#${idx + 1}`}
                  </span>
                  <Link href={`/cycletyres/item/${item.item_id}`} style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>View Details →</Link>
                </div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: t.text, lineHeight: 1.3 }}>{item.item_name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                  <div style={{ backgroundColor: t.bg3, padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: t.text2 }}>Times Ordered</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: RANK_COLORS[idx] || '#6366f1' }}>{item.times_ordered}</div>
                  </div>
                  <div style={{ backgroundColor: t.bg3, padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: t.text2 }}>Total Qty</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>{item.total_qty?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            {item_preferences.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: t.text2 }}>
                <div style={{ fontSize: '3rem' }}>📦</div>
                <p>No cycle tyre orders found for this party.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
