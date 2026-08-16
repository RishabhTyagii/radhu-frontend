'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function MonthlyReport() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetchReport();
  }, [month]);

  async function fetchReport() {
    setLoading(true);
    const result = await apiGet(`/stock/monthly-report/?month=${month}`);
    if (result) {
      setData(result);
      if (result.trend) {
        setTimeout(() => renderChart(result.trend), 100);
      }
    }
    setLoading(false);
  }

  const renderChart = (trendData) => {
    if (!trendData || typeof window === 'undefined' || !chartRef.current) return;
    
    if (!window.Chart) {
      // Load Chart.js dynamically if not already loaded
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => createChart(trendData);
      document.body.appendChild(script);
    } else {
      createChart(trendData);
    }
  };

  const createChart = (trendData) => {
    if (!chartRef.current || !window.Chart) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: trendData.map(d => d.month),
        datasets: [
          {
            label: 'Production',
            data: trendData.map(d => d.production),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 1
          },
          {
            label: 'Dispatch',
            data: trendData.map(d => d.dispatch),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: '#ef4444',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  };

  const totals = data?.totals || {};
  const items = data?.items || [];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Monthly Report</h1>
          <div>
            <input 
              type="month" 
              className="form-input" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)} 
            />
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading report...</div>
        ) : (
          <>
            <div className="grid-4" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <span className="stat-label">Total Curing</span>
                <span className="stat-number">{totals.total_curing || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Despatch</span>
                <span className="stat-number">{totals.total_despatch || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Net Balance</span>
                <span className="stat-number" style={{ color: (totals.net_balance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {(totals.net_balance || 0) > 0 ? '+' : ''}{totals.net_balance || 0}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Grand Total Stock</span>
                <span className="stat-number" style={{ color: 'var(--primary)' }}>{totals.grand_total_stock || 0}</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h2 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>6-Month Trend</h2>
                <div style={{ height: '300px', position: 'relative' }}>
                  <canvas ref={chartRef}></canvas>
                </div>
              </div>

              <div className="card">
                <h2 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Tyre Breakdown</h2>
                <div className="table-container" style={{ maxHeight: '300px' }}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Tyre</th>
                        <th>Pattern</th>
                        <th>Type</th>
                        <th>Curing</th>
                        <th>Despatch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.tyre_name}</td>
                          <td>{item.pattern}</td>
                          <td>{item.type}</td>
                          <td><span className="badge green">{item.monthly_curing}</span></td>
                          <td><span className="badge red">{item.monthly_despatch}</span></td>
                        </tr>
                      ))}
                      {!items.length && (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No activity logged for this month</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
