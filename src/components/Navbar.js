'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [activeModule, setActiveModule] = useState('stock');

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

  useEffect(() => {
    if (pathname.startsWith('/cycletyres')) {
      setActiveModule('cycletyres');
    } else if (pathname.startsWith('/cycletube')) {
      setActiveModule('cycletube');
    } else if (pathname.startsWith('/tallysync')) {
      setActiveModule('tallysync');
    } else if (pathname.startsWith('/hrms')) {
      setActiveModule('hrms');
    } else if (pathname.startsWith('/orders')) {
      setActiveModule('orders');
    } else if (pathname.startsWith('/users')) {
      setActiveModule('users');
    } else if (pathname.startsWith('/ai-agent')) {
      setActiveModule('ai');
    } else if (pathname.startsWith('/stock')) {
      setActiveModule('stock');
    }
  }, [pathname]);

  const handleLogout = async () => {
    await apiPost('/auth/logout/', {});
    router.push('/login');
  };

  const isPageAllowed = (urlKey) => {
    if (!userData) return false;
    if (userData.is_superuser) return true;
    const allowed = userData.allowed_pages || [];
    return allowed.includes(urlKey);
  };

  const modulesList = [
    { id: 'stock', name: 'Auto Tyre', icon: '🏎️', path: '/stock', color: '#2563eb' },
    { id: 'cycletyres', name: 'Cycle Tyre', icon: '🚴', path: '/cycletyres', color: '#059669' },
    { id: 'cycletube', name: 'Cycle Tube', icon: '🚲', path: '/cycletube', color: '#d97706' },
    { id: 'tallysync', name: 'Tally Sync', icon: '📊', path: '/tallysync', color: '#7c3aed' },
    { id: 'hrms', name: 'HRMS', icon: '👥', path: '/hrms', color: '#0284c7' },
    { id: 'orders', name: 'Orders', icon: '📦', path: '/orders', color: '#e11d48' },
    { id: 'ai', name: 'RADHU AI', icon: '🤖', path: '/ai-agent', color: '#7c3aed' },
    ...(userData?.is_superuser ? [{ id: 'users', name: 'Users', icon: '⚙️', path: '/users', color: '#475569' }] : []),
  ];

  const stockNavItems = [
    { name: 'Dashboard', path: '/stock', icon: 'fas fa-warehouse', key: 'dashboard' },
    { name: 'Production', path: '/stock/production', icon: 'fas fa-plus-circle', color: '#10b981', key: 'add_production' },
    { name: 'Dispatch', path: '/stock/dispatch', icon: 'fas fa-truck', color: '#ef4444', key: 'add_dispatch' },
    { name: 'Adjustment', path: '/stock/adjustment', icon: 'fas fa-sliders-h', color: '#8b5cf6', key: 'add_adjustment' },
    { name: 'Entries', path: '/stock/entries', icon: 'fas fa-history', key: 'entries_log' },
    { name: 'Report', path: '/stock/monthly-report', icon: 'fas fa-chart-bar', key: 'monthly_report' },
    { name: 'Sheet', path: '/stock/production-sheet', icon: 'fas fa-file-alt', key: 'production_sheet' },
    { name: 'Add Tyre', path: '/stock/add-tyre', icon: 'fas fa-plus-circle', key: 'add_tyre' },
    { name: 'Daily Summary', path: '/stock/daily-summary', icon: 'fas fa-calendar-day', key: 'daily_summary' },
  ];

  const cycleTubeNavItems = [
    { name: 'Dashboard', path: '/cycletube', icon: 'fas fa-ring', key: 'tube_dashboard' },
    { name: 'Production', path: '/cycletube/production', icon: 'fas fa-plus-circle', color: '#10b981', key: 'tube_add_production' },
    { name: 'Sale', path: '/cycletube/sale', icon: 'fas fa-shopping-cart', color: '#f59e0b', key: 'tube_add_sale' },
    { name: 'Adjustment', path: '/cycletube/adjustment', icon: 'fas fa-sliders-h', color: '#8b5cf6', key: 'tube_add_adjustment' },
    { name: 'Entries', path: '/cycletube/entries', icon: 'fas fa-history', key: 'tube_entries_log' },
    { name: 'Report', path: '/cycletube/report', icon: 'fas fa-chart-bar', key: 'tube_monthly_report' },
    { name: 'Summary', path: '/cycletube/summary', icon: 'fas fa-list-alt', color: '#14b8a6', key: 'tube_production_summary' },
    { name: 'Add Tube', path: '/cycletube/add-item', icon: 'fas fa-plus-circle', key: 'tube_add_item' },
  ];

  const cycleTyresNavItems = [
    { name: 'Dashboard', path: '/cycletyres', icon: 'fas fa-bicycle', key: 'cycletyre_dashboard' },
    { name: 'Production', path: '/cycletyres/production', icon: 'fas fa-plus-circle', color: '#10b981', key: 'cycletyre_add_production' },
    { name: '2nd Grade', path: '/cycletyres/second-grade', icon: 'fas fa-tags', color: '#f59e0b', key: 'cycletyre_add_sale' },
    { name: 'Sale', path: '/cycletyres/sale', icon: 'fas fa-shopping-cart', color: '#ef4444', key: 'cycletyre_add_sale' },
    { name: 'Adjustment', path: '/cycletyres/adjustment', icon: 'fas fa-sliders-h', color: '#8b5cf6', key: 'cycletyre_add_adjustment' },
    { name: 'Entries', path: '/cycletyres/entries', icon: 'fas fa-history', key: 'cycletyre_entries_log' },
    { name: 'Report', path: '/cycletyres/report', icon: 'fas fa-chart-bar', key: 'cycletyre_monthly_report' },
    { name: 'Summary', path: '/cycletyres/summary', icon: 'fas fa-list-alt', color: '#14b8a6', key: 'cycletyre_daily_summary' },
    { name: 'Sheet', path: '/cycletyres/production-sheet', icon: 'fas fa-file-alt', key: 'cycletyre_production_sheet' },
    { name: 'Add Tyre', path: '/cycletyres/add-item', icon: 'fas fa-plus-circle', key: 'cycletyre_add_item' },
  ];

  const tallySyncNavItems = [
    { name: 'Sales & GST', path: '/tallysync', icon: 'fas fa-chart-pie', color: '#2563eb', key: 'tally_sales_summary' },
    { name: 'Item Mappings', path: '/tallysync/mapping', icon: 'fas fa-link', color: '#10b981', key: 'tally_mapping_list' },
    { name: 'Sync Logs', path: '/tallysync/logs', icon: 'fas fa-history', color: '#f59e0b', key: 'tally_sync_log' },
  ];

  const hrmsNavItems = [
    { name: 'HR Dashboard', path: '/hrms', icon: 'fas fa-user-shield', color: '#2563eb', key: 'hr_dashboard' },
    { name: 'Employees', path: '/hrms/employees', icon: 'fas fa-users', color: '#10b981', key: 'employee_list' },
    { name: 'Attendance', path: '/hrms/attendance', icon: 'fas fa-calendar-check', color: '#f59e0b', key: 'attendance_list' },
    { name: 'Piece Production', path: '/hrms/production', icon: 'fas fa-cogs', color: '#8b5cf6', key: 'production_list' },
    { name: 'Salary Engine', path: '/hrms/salary', icon: 'fas fa-calculator', color: '#ef4444', key: 'salary_list' },
    { name: 'Departments', path: '/hrms/departments', icon: 'fas fa-building', color: '#64748b', key: 'hr_dashboard' },
  ];

  const ordersNavItems = [
    { name: 'My Orders', path: '/orders', icon: 'fas fa-box', color: '#2563eb', key: 'my_orders' },
    { name: 'Book Order', path: '/orders/create', icon: 'fas fa-cart-plus', color: '#10b981', key: 'create_order' },
    { name: 'All Orders', path: '/orders/all', icon: 'fas fa-tasks', color: '#8b5cf6', key: 'admin_orders' },
  ];

  const usersNavItems = [
    { name: 'User Directory', path: '/users', icon: 'fas fa-users-cog', color: '#2563eb', key: 'manage_users' },
    { name: 'Create User', path: '/users/create', icon: 'fas fa-user-plus', color: '#10b981', key: 'create_user' },
  ];

  const aiNavItems = [
    { name: 'AI Chat', path: '/ai-agent', icon: 'fas fa-robot', color: '#a78bfa', key: 'ai_agent' },
    { name: 'Audit Log', path: '/ai-agent/logs', icon: 'fas fa-clipboard-list', color: '#38bdf8', key: 'ai_audit_log' },
  ];

  if (!userData) return null;

  let currentNavItems = stockNavItems;
  if (activeModule === 'cycletube') currentNavItems = cycleTubeNavItems;
  if (activeModule === 'cycletyres') currentNavItems = cycleTyresNavItems;
  if (activeModule === 'tallysync') currentNavItems = tallySyncNavItems;
  if (activeModule === 'hrms') currentNavItems = hrmsNavItems;
  if (activeModule === 'orders') currentNavItems = ordersNavItems;
  if (activeModule === 'users') currentNavItems = usersNavItems;
  if (activeModule === 'ai') currentNavItems = aiNavItems;

  const filteredNavItems = currentNavItems.filter((item) => (
    item.key === 'ai_agent' || item.key === 'ai_audit_log' || isPageAllowed(item.key)
  ));

  return (
    <nav className="navbar">
      {/* Tier 1: Main Header & Module Switcher Tabs */}
      <div className="nav-top-bar">
        <Link href="/" className="nav-brand" style={{ textDecoration: 'none' }}>
          <i className="fas fa-industry" style={{ color: '#38bdf8' }}></i>
          <span>RADHU <span style={{ color: '#38bdf8', fontSize: '0.8em' }}>ERP</span></span>
        </Link>

        {/* Module Switcher Tabs */}
        <div className="nav-module-switcher">
          {modulesList.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setActiveModule(m.id);
                router.push(m.path);
              }}
              className={`module-btn ${activeModule === m.id ? 'active' : ''}`}
              style={activeModule === m.id ? { background: m.color } : {}}
            >
              <span>{m.icon}</span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        {/* User Account Section */}
        <div className="user-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Django Admin Button - Only visible for Super Admin */}
          {userData?.is_superuser && (
            <a
              href="https://api.radhuerp.site/admin/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #064e3b, #047857)',
                border: '1px solid #10b981',
                color: '#d1fae5',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
              }}
              title="Open Django Admin Panel (Radhu Industries Portal)"
            >
              <span>🐍</span>
              <span>Django Admin</span>
              <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem', opacity: 0.8 }}></i>
            </a>
          )}

          <div className="avatar">{userData.username?.charAt(0).toUpperCase()}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
              {userData.username}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {userData.is_superuser ? 'Super Admin' : 'Staff User'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="btn"
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      {/* Tier 2: Sub-Navigation Links */}
      <div className="nav-sub-bar">
        {filteredNavItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`subnav-link ${pathname === item.path ? 'active' : ''}`}
          >
            <i className={item.icon} style={item.color ? { color: item.color } : {}}></i>
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
