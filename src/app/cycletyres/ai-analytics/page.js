'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
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
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function CycleTyresAIAnalytics() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Filter & Inspector States
  const [filterTab, setFilterTab] = useState('all'); // all, fast, critical, slow, dead
  const [selectedItemId, setSelectedItemId] = useState('');
  const [searchItem, setSearchItem] = useState('');

  // Party filter states
  const [partySearch, setPartySearch] = useState('');
  const [partyFilter, setPartyFilter] = useState('all'); // all, urgent, thisweek, upcoming

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchAIData() {
      setLoading(true);
      const res = await apiGet('/cycletyres/ai-analytics-v2/');
      if (res) {
        setData(res);
        if (res.item_predictions?.length > 0) {
          setSelectedItemId(res.item_predictions[0].id);
        }
      }
      setLoading(false);
    }
    fetchAIData();
  }, []);

  const summary = data?.summary || {};
  const items = data?.item_predictions || [];
  const employees = data?.employee_predictions || [];
  const parties = data?.party_propensity || [];

  // Filtered items by tab & search
  const tabFilteredItems = useMemo(() => {
    let list = items;
    if (filterTab === 'fast') {
      list = list.filter((i) => i.velocity_status.includes('High Velocity'));
    } else if (filterTab === 'critical') {
      list = list.filter((i) => i.stockout_risk === 'CRITICAL' || i.stockout_risk === 'MODERATE');
    } else if (filterTab === 'slow') {
      list = list.filter((i) => i.velocity_status.includes('Slow Moving'));
    } else if (filterTab === 'dead') {
      list = list.filter((i) => i.velocity_status.includes('Dead Stock'));
    }

    if (searchItem.trim()) {
      const q = searchItem.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q));
    }
    return list;
  }, [items, filterTab, searchItem]);

  // Currently inspected item
  const inspectedItem = useMemo(() => {
    if (!selectedItemId) return items[0] || null;
    return items.find((i) => i.id === Number(selectedItemId)) || items[0] || null;
  }, [items, selectedItemId]);

  // Chart data: Top 10 Projected Demand vs Current Stock
  const top10Items = items.slice(0, 10);
  const demandVsStockChart = {
    labels: top10Items.map((i) => i.name.length > 22 ? i.name.slice(0, 22) + '…' : i.name),
    datasets: [
      {
        label: 'Current 1st Grade Stock',
        data: top10Items.map((i) => i.stock_1st),
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
      {
        label: 'AI Projected Demand (30 Days)',
        data: top10Items.map((i) => i.projected_demand_30d),
        backgroundColor: '#f59e0b',
        borderRadius: 6,
      },
    ],
  };

  const isMobile = windowWidth < 768;

  const theme = {
    bg: darkMode ? '#070b14' : '#f8fafc',
    bg2: darkMode ? '#111827' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#0f172a',
    text2: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#1f293d' : '#e2e8f0',
    shadow: darkMode ? '0 10px 30px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'all 0.3s ease' }}>
      <Navbar />

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: isMobile ? '12px' : '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>🤖</span>
              <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #7c3aed, #2563eb, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Cycle Tyre AI Predictive Analytics Hub
              </h1>
            </div>
            <p style={{ color: theme.text2, fontSize: '0.85rem', marginTop: '4px' }}>
              Machine learning intelligence: Demand velocity, stock-out risk, employee sales projection & dealer reorder propensity
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              href="/cycletyres/report"
              style={{ padding: '8px 18px', borderRadius: '50px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}
            >
              📊 Back to Monthly Report
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ padding: '8px 18px', borderRadius: '50px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
            >
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>

        {/* 5 Executive AI KPI Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: '6px solid #7c3aed', boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🔮 30-Day Projected Demand</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{summary.total_projected_demand ?? 0} pcs</div>
            <div style={{ fontSize: '0.7rem', color: theme.text2, marginTop: '2px' }}>AI forecast based on 60d velocity</div>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: '6px solid #ef4444', boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🔴 Critical Stock-Out Risk</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{summary.critical_stockout_items ?? 0} Items</div>
            <div style={{ fontSize: '0.7rem', color: theme.text2, marginTop: '2px' }}>Inventory buffer &lt; 7 days</div>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: '6px solid #10b981', boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>🚀 Fast Moving Products</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{summary.high_velocity_items ?? 0} Tyres</div>
            <div style={{ fontSize: '0.7rem', color: theme.text2, marginTop: '2px' }}>High market turnover rate</div>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: '6px solid #2563eb', boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>💰 Projected Sales Value</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{summary.total_predicted_pipeline_value ?? '₹ 0'}</div>
            <div style={{ fontSize: '0.7rem', color: theme.text2, marginTop: '2px' }}>Expected 30-day dealer intake</div>
          </div>

          <div style={{ backgroundColor: theme.bg2, borderRadius: '16px', padding: '16px', border: `2px solid ${theme.border}`, borderLeft: '6px solid #f59e0b', boxShadow: theme.shadow }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.text2, textTransform: 'uppercase' }}>⚙️ Top Priority Batch</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{summary.top_recommended_item ?? 'N/A'}</div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>High urgency replenishment</div>
          </div>
        </div>

        {/* Section 1: Item Demand & Stockout Intelligence */}
        <div style={{ backgroundColor: theme.bg2, borderRadius: '20px', padding: isMobile ? '16px' : '24px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow, marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📦</span>
                <span>Product Demand Velocity &amp; Stock-Out Predictor</span>
              </h2>
              <p style={{ color: theme.text2, fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                Select any tyre to view AI recommendations, or click 🔍 to open full item historical ledger
              </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Items' },
                { id: 'fast', label: '🚀 Fast Moving' },
                { id: 'critical', label: '🔴 Critical Stockout' },
                { id: 'slow', label: '🐢 Slow Moving' },
                { id: 'dead', label: '🛑 Dead Stock Risk' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '50px',
                    border: filterTab === tab.id ? '2px solid #7c3aed' : `1px solid ${theme.border}`,
                    backgroundColor: filterTab === tab.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    color: filterTab === tab.id ? '#7c3aed' : theme.text2,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Panel: Left Selector / Table & Right AI Deep Dive Inspector */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: '20px' }}>
            
            {/* Left: Product Table List */}
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.text2 }}>CLICK ITEM TO INSPECT AI METRICS</span>
                <input
                  type="text"
                  placeholder="Filter tyre..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {tabFilteredItems.map((item) => {
                  const isSelected = inspectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: `1px solid ${theme.border}`,
                        backgroundColor: isSelected ? (darkMode ? 'rgba(124, 58, 237, 0.2)' : '#f3e8ff') : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#7c3aed' : theme.text }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: theme.text2, marginTop: '2px' }}>
                          Stock: <strong style={{ color: '#2563eb' }}>{item.stock_1st}</strong> pcs • Velocity: {item.daily_velocity}/day
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
                            {item.projected_demand_30d} pcs
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '50px',
                            backgroundColor: item.risk_color === '#ef4444' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            color: item.risk_color,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}>
                            {item.stockout_risk} ({item.days_of_inventory}d)
                          </span>
                        </div>
                        <Link
                          href={`/cycletyres/item/${item.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(124, 58, 237, 0.12)',
                            color: '#7c3aed',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                          }}
                          title="View Full Item Analytics"
                        >
                          🔍
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: AI Deep Dive Card for Selected Item */}
            {inspectedItem && (
              <div style={{
                backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                borderRadius: '16px',
                padding: '20px',
                border: `2px solid ${inspectedItem.risk_color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: theme.text2 }}>AI DIAGNOSTIC REPORT</span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: theme.text }}>
                        {inspectedItem.name}
                      </h3>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '50px',
                      backgroundColor: inspectedItem.risk_color,
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}>
                      {inspectedItem.stockout_risk} RISK
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '18px 0' }}>
                    <div style={{ backgroundColor: theme.bg2, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: '0.7rem', color: theme.text2 }}>Current 1st Grade Stock</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>{inspectedItem.stock_1st} pcs</div>
                    </div>
                    <div style={{ backgroundColor: theme.bg2, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: '0.7rem', color: theme.text2 }}>Projected 30D Demand</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{inspectedItem.projected_demand_30d} pcs</div>
                    </div>
                    <div style={{ backgroundColor: theme.bg2, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: '0.7rem', color: theme.text2 }}>Days of Inventory (DOH)</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: inspectedItem.risk_color }}>{inspectedItem.days_of_inventory} Days</div>
                    </div>
                    <div style={{ backgroundColor: theme.bg2, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: '0.7rem', color: theme.text2 }}>Movement Velocity</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{inspectedItem.daily_velocity} / day</div>
                    </div>
                  </div>

                  {/* AI Recommendation Banner */}
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: darkMode ? 'rgba(124, 58, 237, 0.15)' : '#ede9fe',
                    border: '1px solid #7c3aed',
                    marginBottom: '16px',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '4px' }}>
                      💡 AI Production Guidance:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text, lineHeight: 1.4 }}>
                      {inspectedItem.recommendation}
                    </div>
                  </div>

                  {/* Direct Link to Item Detail Page */}
                  <Link
                    href={`/cycletyres/item/${inspectedItem.id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563eb',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                      marginBottom: '12px',
                    }}
                  >
                    📊 Open Full 12-Month Item History &amp; Buyers →
                  </Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: '12px', fontSize: '0.75rem', color: theme.text2 }}>
                  <span>AI Model: Time-Series Exponential Smoothing</span>
                  <span>Confidence: <strong style={{ color: '#10b981' }}>{inspectedItem.confidence_score}%</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Demand vs Stock Comparison Chart */}
          <div style={{ marginTop: '24px', height: '280px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text, marginBottom: '10px' }}>
              📊 Top 10 Moving Tyres: Current Stock vs AI 30-Day Forecast
            </div>
            <Bar
              data={demandVsStockChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { color: theme.text, font: { weight: 'bold' } } } },
                scales: {
                  x: { ticks: { color: theme.text2, font: { size: 10 } } },
                  y: { ticks: { color: theme.text2 } },
                },
              }}
            />
          </div>
        </div>

        {/* Section 2: Sales Representatives & Employee Performance Predictor */}
        <div style={{ backgroundColor: theme.bg2, borderRadius: '20px', padding: isMobile ? '16px' : '24px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow, marginBottom: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span>
              <span>Sales Representative &amp; Employee Order Forecasting</span>
            </h2>
            <p style={{ color: theme.text2, fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Predicts which sales executives are on track to close the highest volume &amp; revenue next month
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '14px' }}>
            {employees.map((emp, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                  borderRadius: '16px',
                  padding: '18px',
                  border: `2px solid ${theme.border}`,
                  borderTop: `6px solid ${emp.avatar_color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: theme.text }}>
                        {emp.name}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: theme.text2 }}>{emp.role}</span>
                    </div>
                  </div>

                  <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: theme.text2 }}>Historical Orders:</span>
                      <strong style={{ color: theme.text }}>{emp.historical_orders}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: theme.text2 }}>Order Conversion:</span>
                      <strong style={{ color: '#10b981' }}>{emp.conversion_rate}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', backgroundColor: theme.bg2, padding: '6px 8px', borderRadius: '6px' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>Predicted Volume:</span>
                      <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{emp.predicted_volume_pcs} pcs</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.text2, marginTop: '2px' }}>
                      Top Selling: <strong style={{ color: theme.text }}>{emp.top_product}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>{emp.trend}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', backgroundColor: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                    {emp.performance_badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Summary Bar between Employee and Party sections */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
          gap: '12px',
          marginBottom: '20px',
          padding: '16px 20px',
          backgroundColor: darkMode ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)',
          borderRadius: '16px',
          border: `2px dashed ${darkMode ? '#4c1d95' : '#ddd6fe'}`,
        }}>
          {[
            { label: '🏢 Total Active Dealers', value: parties.length },
            { label: '🔁 Avg Order Cycle', value: `${parties.length ? Math.round(parties.reduce((s, p) => s + (p.avg_cycle_days || 30), 0) / parties.length) : 0} Days` },
            { label: '🔥 Parties Due This Week', value: parties.filter(p => p.urgency_color === '#ef4444' || p.urgency_color === '#f59e0b').length },
            { label: '💰 Total Expected Value', value: `₹ ${parties.reduce((s, p) => s + (parseInt((p.estimated_order_value || '0').replace(/[^0-9]/g, '')) || 0), 0).toLocaleString()}` },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: theme.text2, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7c3aed' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Section 3: Dealer / Party Buying Propensity & Reorder Prediction */}
        <div style={{ backgroundColor: theme.bg2, borderRadius: '20px', padding: isMobile ? '16px' : '24px', border: `2px solid ${theme.border}`, boxShadow: theme.shadow }}>
          <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏢</span>
                <span>Dealer &amp; Party Buying Propensity Engine</span>
              </h2>
              <p style={{ color: theme.text2, fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                Click any party row to view full dealer intelligence — charts, order history, item preferences &amp; AI predictions
              </p>
            </div>
          </div>

          {/* Party Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', padding: '14px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
            <input
              type="text"
              placeholder="🔍 Search dealer / party name..."
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              style={{ flex: '1 1 200px', padding: '8px 14px', borderRadius: '8px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg2, color: theme.text, fontSize: '0.85rem', outline: 'none' }}
            />
            {[
              { id: 'all', label: '🌐 All Parties' },
              { id: 'urgent', label: '🔥 Reorder Due' },
              { id: 'thisweek', label: '⚡ This Week' },
              { id: 'upcoming', label: '✅ Upcoming' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPartyFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '50px',
                  border: partyFilter === tab.id ? '2px solid #7c3aed' : `1px solid ${theme.border}`,
                  backgroundColor: partyFilter === tab.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                  color: partyFilter === tab.id ? '#7c3aed' : theme.text2,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', borderBottom: `2px solid ${theme.border}`, color: theme.text2, textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>DEALER / PARTY NAME</th>
                  <th style={{ padding: '12px 14px' }}>BUYING CYCLE</th>
                  <th style={{ padding: '12px 14px', color: '#ef4444' }}>PREDICTED REORDER DATE</th>
                  <th style={{ padding: '12px 14px' }}>PREFERRED TYRE SIZE</th>
                  <th style={{ padding: '12px 14px', color: '#f59e0b' }}>EXPECTED QTY</th>
                  <th style={{ padding: '12px 14px' }}>ESTIMATED VALUE</th>
                  <th style={{ padding: '12px 14px' }}>PROPENSITY</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {parties
                  .filter(p => {
                    // Search filter
                    if (partySearch.trim() && !p.party_name.toLowerCase().includes(partySearch.toLowerCase())) return false;
                    // Tab filter
                    if (partyFilter === 'urgent') return p.urgency_color === '#ef4444';
                    if (partyFilter === 'thisweek') return p.urgency_color === '#f59e0b';
                    if (partyFilter === 'upcoming') return p.urgency_color === '#10b981';
                    return true;
                  })
                  .map((p, idx) => (
                  <tr
                    key={idx}
                    onClick={() => p.party_id && router.push(`/cycletyres/party/${p.party_id}`)}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      cursor: p.party_id ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
                    }}
                    onMouseEnter={e => { if (p.party_id) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(124,58,237,0.12)' : '#ede9fe'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'); }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: theme.text }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.urgency_color, flexShrink: 0, display: 'inline-block' }} />
                        {p.party_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: theme.text2 }}>Every {p.avg_cycle_days} Days ({p.days_since_last_order}d ago)</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: p.urgency_color }}>
                      📅 {p.predicted_reorder_date}
                      <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{p.urgency}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb', fontSize: '0.8rem', maxWidth: '160px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.preferred_item}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#f59e0b' }}>{p.predicted_quantity} pcs</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#10b981' }}>{p.estimated_order_value}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: darkMode ? '#1e2d45' : '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{ width: `${p.propensity_score}%`, height: '100%', borderRadius: '3px', backgroundColor: p.urgency_color }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: p.urgency_color, minWidth: '34px' }}>{p.propensity_score}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {p.party_id ? (
                        <Link
                          href={`/cycletyres/party/${p.party_id}`}
                          style={{ padding: '5px 12px', borderRadius: '50px', backgroundColor: 'rgba(124,58,237,0.12)', color: '#7c3aed', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none', display: 'inline-block', border: '1px solid #7c3aed', whiteSpace: 'nowrap' }}
                        >
                          🔍 View
                        </Link>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: theme.text2 }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                {parties.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: theme.text2 }}>No party data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
