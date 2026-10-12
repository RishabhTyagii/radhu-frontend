'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

// Module accent colours — each module gets a unique brand colour
const MODULE_COLORS = {
  'Auto Tyre':          { accent: '#2563eb', light: '#EFF6FF', icon: 'fa-car-side' },
  'Cycle Tyre':         { accent: '#7c3aed', light: '#F5F3FF', icon: 'fa-bicycle' },
  'Cycle Tube':         { accent: '#0891b2', light: '#ECFEFF', icon: 'fa-life-ring' },
  'Tally Sync':         { accent: '#059669', light: '#ECFDF5', icon: 'fa-file-invoice-dollar' },
  'HRMS & Payroll':     { accent: '#d97706', light: '#FFFBEB', icon: 'fa-users' },
  'Order Booking':      { accent: '#dc2626', light: '#FEF2F2', icon: 'fa-box' },
  'Admin Orders & Sales':{ accent: '#9333ea', light: '#FAF5FF', icon: 'fa-tasks' },
  'User Management':    { accent: '#475569', light: '#F8FAFC', icon: 'fa-cog' },
  'RADHU AI':           { accent: '#0ea5e9', light: '#F0F9FF', icon: 'fa-robot' },
};

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const data = await apiGet('/auth/me/');
      if (data && data.authenticated && data.user) {
        setUserData(data.user);
      } else {
        router.push('/login');
      }
    }
    fetchUser();
  }, [router]);

  if (!userData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Loading workspace...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isAllowed = (key) => userData.is_superuser || userData.permissions?.includes(key);

  const modulesList = [
    {
      title: 'Auto Tyre',
      description: 'Production, dispatch, adjustments, monthly reports & daily summary',
      path: '/stock',
      features: ['Stock Dashboard', 'Production Entry', 'Dispatch / Sale', 'Monthly Report', 'Production Sheet', 'Daily Summary'],
      keys: ['dashboard', 'add_tyre', 'add_production', 'add_dispatch', 'add_adjustment', 'entries_log', 'monthly_report', 'production_sheet', 'daily_summary'],
    },
    {
      title: 'Cycle Tyre',
      description: '1st/2nd/RFM grade production, bucket-wise sales & compound summary',
      path: '/cycletyres',
      features: ['Tyre Dashboard', 'Production (Curing)', '2nd Grade Stock', 'Bucket-wise Sale', 'Monthly Report', 'Daily Summary'],
      keys: ['cycletyre_dashboard', 'cycletyre_add_item', 'cycletyre_add_production', 'cycletyre_add_sale', 'cycletyre_add_adjustment', 'cycletyre_entries_log', 'cycletyre_monthly_report', 'cycletyre_daily_summary'],
    },
    {
      title: 'Cycle Tube',
      description: 'Quality-grade production, sales, adjustments & inventory summary',
      path: '/cycletube',
      features: ['Tube Dashboard', 'Production (Quality)', 'Sale Entry', 'Monthly Report', 'Daily Summary', 'Stock Adjustment'],
      keys: ['tube_dashboard', 'tube_add_item', 'tube_add_production', 'tube_add_sale', 'tube_add_adjustment', 'tube_entries_log', 'tube_monthly_report', 'tube_production_summary'],
    },
    {
      title: 'Tally Sync',
      description: 'Automated Tally Prime integration — auto stock deduction & GST sync',
      path: '/tallysync',
      features: ['Sales & GST Summary', 'Party/GST Breakup', 'Item Mappings', 'Auto Stock Deduction', 'Print Tax Invoice', 'Sync Logs'],
      keys: ['tally_sales_summary', 'tally_mapping_list', 'tally_sync_log', 'tally_map_pending_item'],
    },
    {
      title: 'HRMS & Payroll',
      description: 'Employee directory, attendance, piece-rate production & salary engine',
      path: '/hrms',
      features: ['Employee Directory', 'Daily Attendance', 'Worker Piece Production', 'Salary Engine', 'Print Payslips', 'Departments'],
      keys: ['hr_dashboard', 'employee_list', 'attendance_list', 'bulk_attendance', 'production_list', 'salary_list'],
    },
    {
      title: 'Order Booking',
      description: 'Multi-item customer orders across Auto Tyre, Cycle Tube & Cycle Tyre',
      path: '/orders',
      features: ['Book Multi-Item Orders', 'Live Stock Catalog', 'Customer Parties', 'My Orders List'],
      keys: ['my_orders', 'create_order', 'order_detail', 'import_orders'],
    },
    {
      title: 'Admin Orders & Sales',
      description: 'Master control — category summaries & employee sales performance',
      path: '/orders/all',
      features: ['All Orders Master View', 'Category Breakdown', 'Employee Sales Stats', 'Status Control'],
      keys: ['admin_orders'],
    },
    {
      title: 'User Management',
      description: 'User creation, password management & module-level access control',
      path: '/users',
      features: ['User Directory', 'Role Levels', 'Module Access', 'Page Permissions', 'Password Manager'],
      keys: ['manage_users', 'create_user', 'edit_user'],
    },
    {
      title: 'RADHU AI',
      description: 'AI ERP assistant — stock queries, data analysis & workflow automation',
      path: '/ai-agent',
      features: ['Data Analysis', 'Stock Status', 'Audit Logs', 'Automated Workflows'],
      keys: ['ai_agent'],
      alwaysShow: true,
    },
  ];

  const visibleModules = modulesList.filter(
    (m) => m.alwaysShow || m.keys.some((k) => isAllowed(k))
  );

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Navbar />

      {/* ── Page Header ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-th-large" style={{ color: 'white', fontSize: 16 }} />
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Workspace
              </h1>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              Welcome back, <strong style={{ color: '#0f172a' }}>{userData.username}</strong>
              {userData.is_superuser && (
                <span style={{ marginLeft: 8, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                  Super Admin
                </span>
              )}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{today}</div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
              {visibleModules.length} modules accessible
            </div>
          </div>
        </div>
      </div>

      {/* ── Module Grid ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {visibleModules.map((mod) => {
            const c = MODULE_COLORS[mod.title] || { accent: '#2563eb', light: '#EFF6FF', icon: 'fa-cube' };
            return (
              <div
                key={mod.path}
                onClick={() => router.push(mod.path)}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.10)`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = c.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: c.accent, borderRadius: '16px 16px 0 0' }} />

                {/* Icon + Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: c.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className={`fas ${c.icon}`} style={{ fontSize: 20, color: c.accent }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {mod.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                      {mod.description}
                    </p>
                  </div>
                </div>

                {/* Feature tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {mod.features.map((f) => (
                    <span
                      key={f}
                      style={{
                        background: c.light,
                        color: c.accent,
                        border: `1px solid ${c.accent}22`,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 14, borderTop: '1px solid #f1f5f9',
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: c.accent }}>
                    Open Module
                  </span>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fas fa-arrow-right" style={{ fontSize: 11, color: c.accent }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {visibleModules.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <i className="fas fa-lock" style={{ fontSize: 40, marginBottom: 16, display: 'block' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No modules available for your access level.</p>
            <p style={{ fontSize: '0.85rem' }}>Contact your administrator to request access.</p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.75rem', background: 'white' }}>
        Radhu Industries ERP &nbsp;·&nbsp; All rights reserved
      </footer>
    </div>
  );
}
