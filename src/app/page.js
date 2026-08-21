'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const data = await apiGet('/auth/me/');
      if (data && data.authenticated && data.user) {
        setUserData(data.user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const isMobile = windowWidth < 768;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '4px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}></div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Loading dashboard...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const isSuperuser = userData?.is_superuser;
  const allowedPages = userData?.allowed_pages || [];

  const isModuleAllowed = (keys) => {
    if (isSuperuser) return true;
    return keys.some((k) => allowedPages.includes(k));
  };

  const modules = [
    {
      title: 'RADHU AI',
      icon: '🤖',
      description: 'Gemini ERP assistant — stock Q&A plus confirm-to-save add/delete/import, with a full audit log',
      path: '/ai-agent',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          features: ['Confirm before save', 'Excel item import', 'Typed DELETE', 'Audit log', 'Hindi + English'],
      keys: ['ai_agent'],
      alwaysShow: true,
    },
    {
      title: 'Auto Tyre',
      icon: '🚗',
      description: 'Auto tyre stock management — production, dispatch, adjustments, reports & daily summary',
      path: '/stock',
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      features: ['Stock Dashboard', 'Production Entry', 'Dispatch / Sale', 'Monthly Report', 'Production Sheet', 'Daily Summary'],
      keys: ['dashboard', 'add_tyre', 'add_production', 'add_dispatch', 'add_adjustment', 'entries_log', 'monthly_report', 'production_sheet', 'daily_summary'],
    },
    {
      title: 'Cycle Tube',
      icon: '🚲',
      description: 'Cycle tube inventory — production with quality grades, sales, adjustments & daily summary',
      path: '/cycletube',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      features: ['Tube Dashboard', 'Production (Quality)', 'Sale Entry', 'Monthly Report', 'Daily Summary', 'Stock Adjustment'],
      keys: ['tube_dashboard', 'tube_add_item', 'tube_add_production', 'tube_add_sale', 'tube_add_adjustment', 'tube_entries_log', 'tube_monthly_report', 'tube_production_summary'],
    },
    {
      title: 'Cycle Tyre',
      icon: '🚴',
      description: 'Cycle tyre stock — 1st/2nd/RFM grade production, bucket-wise sales & compound summary',
      path: '/cycletyres',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      features: ['Tyre Dashboard', 'Production (Curing)', '2nd Grade Stock', 'Bucket-wise Sale', 'Monthly Report', 'Daily Summary'],
      keys: ['cycletyre_dashboard', 'cycletyre_add_item', 'cycletyre_add_production', 'cycletyre_add_sale', 'cycletyre_add_adjustment', 'cycletyre_entries_log', 'cycletyre_monthly_report', 'cycletyre_daily_summary'],
    },
    {
      title: 'Tally Sync',
      icon: '📊',
      description: 'Automated Tally Prime sales & GST integration — auto stock deduction, item mappings & sync logs',
      path: '/tallysync',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      features: ['Sales & GST Summary', 'Party/GST Breakup', 'Item Mappings', 'Automatic Stock Deduction', 'Print Tax Invoice', 'Sync Logs'],
      keys: ['tally_sales_summary', 'tally_mapping_list', 'tally_sync_log', 'tally_map_pending_item'],
    },
    {
      title: 'HRMS & Payroll',
      icon: '👥',
      description: 'Human resource & payroll management — employee directory, attendance, piece-rate production & salary engine',
      path: '/hrms',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
      features: ['Employee Directory', 'Daily Attendance Sheet', 'Worker Piece Production', 'Automated Salary Engine', 'Print Payslips', 'Departments'],
      keys: ['hr_dashboard', 'employee_list', 'attendance_list', 'bulk_attendance', 'production_list', 'salary_list'],
    },
    {
      title: 'Order Booking',
      icon: '📦',
      description: 'Multi-item customer order booking across Auto Tyre, Cycle Tube & Cycle Tyre with live stock availability',
      path: '/orders',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      features: ['Book Multi-Item Orders', 'Live Stock Catalog', 'Customer Parties', 'My Orders List'],
      keys: ['my_orders', 'create_order', 'order_detail', 'import_orders'],
    },
    {
      title: 'Admin Orders & Sales',
      icon: '📋',
      description: 'Master control panel — category summaries (Auto Tyre, Cycle Tube, Cycle Tyre) & employee sales performance',
      path: '/orders/all',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      features: ['All Orders Master View', 'Category Breakdown', 'Employee Sales Stats', 'Status Change Control'],
      keys: ['admin_orders'],
    },
    {
      title: 'User Management',
      icon: '🔐',
      description: 'System user creation, password management & module-level page access permissions control',
      path: '/users',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      features: ['User Directory', 'Role Levels (Superuser / User)', 'Module Access Checkboxes', 'Granular Page Permissions', 'Password Manager', 'Live Search'],
      keys: ['manage_users', 'create_user', 'edit_user'],
    },
  ];

  const visibleModules = modules.filter((mod) => mod.alwaysShow || isModuleAllowed(mod.keys));

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
    }}>
      {/* DARK NAVBAR - Always Dark */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: '#0f172a',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        borderBottom: '2px solid #1e293b',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '12px 16px' : '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                fontWeight: 800,
                color: 'white',
              }}>
                🏭 Radhu Industries
              </span>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                color: '#94a3b8',
                backgroundColor: '#1e293b',
                padding: '2px 10px',
                borderRadius: '12px',
              }}>
                v2.0
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            {userData && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#e2e8f0',
                fontSize: '0.85rem',
              }}>
                <span style={{
                  backgroundColor: '#1e293b',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                }}>
                  👤 {userData.username}
                </span>
                {isSuperuser && (
                  <span style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    Admin
                  </span>
                )}
              </div>
            )}

            <button
              onClick={async () => { await apiPost('/auth/logout/', {}); router.push('/login'); }}
              style={{
                padding: '6px 14px',
                backgroundColor: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                border: '2px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.25)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{
        background: 'white',
        padding: isMobile ? '30px 20px 40px' : '50px 40px 60px',
        textAlign: 'center',
        borderBottom: '2px solid #e2e8f0',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: '#f1f5f9',
            padding: '4px 16px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#64748b',
            marginBottom: '12px',
          }}>
            🚀 Welcome Back
          </div>
          <h1 style={{
            fontSize: isMobile ? '1.8rem' : '2.8rem',
            fontWeight: 800,
            margin: 0,
            color: '#1e293b',
            letterSpacing: '-0.02em',
          }}>
            Stock Management Portal
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            marginTop: '8px',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Manage Auto Tyre, Cycle Tube, Cycle Tyre inventory, Tally sync, HRMS, and orders from one place
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}>
            <span style={{
              padding: '4px 14px',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              fontSize: '0.7rem',
              color: '#64748b',
              fontWeight: 500,
            }}>
              📦 {visibleModules.length} Modules
            </span>
            <span style={{
              padding: '4px 14px',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              fontSize: '0.7rem',
              color: '#64748b',
              fontWeight: 500,
            }}>
              👥 {isSuperuser ? 'Administrator' : 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '20px 16px 40px' : '30px 24px 60px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {visibleModules.map((mod) => (
            <div
              key={mod.path}
              onClick={() => router.push(mod.path)}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 16px 48px ${mod.color}33`;
                e.currentTarget.style.borderColor = mod.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {/* Card Top Strip */}
              <div style={{
                background: mod.gradient,
                padding: isMobile ? '20px' : '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  pointerEvents: 'none',
                }}></div>
                <span style={{
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  width: isMobile ? '50px' : '60px',
                  height: isMobile ? '50px' : '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                  backdropFilter: 'blur(10px)',
                }}>{mod.icon}</span>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    fontWeight: 700,
                    color: 'white',
                  }}>
                    {mod.title}
                  </h2>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: isMobile ? '16px 18px 20px' : '20px 24px 24px' }}>
                <p style={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  margin: '0 0 16px',
                }}>
                  {mod.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '18px',
                }}>
                  {mod.features.slice(0, 4).map((f) => (
                    <span key={f} style={{
                      backgroundColor: `${mod.color}12`,
                      color: mod.color,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${mod.color}25`,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${mod.color}25`;
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${mod.color}12`;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}>
                      {f}
                    </span>
                  ))}
                  {mod.features.length > 4 && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#94a3b8',
                      padding: '3px 8px',
                    }}>
                      +{mod.features.length - 4} more
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '10px 14px' : '12px 16px',
                  backgroundColor: `${mod.color}08`,
                  borderRadius: '10px',
                  border: `2px solid ${mod.color}15`,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${mod.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${mod.color}08`;
                }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: mod.color,
                  }}>
                    Launch Module →
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: mod.color,
                    opacity: 0.6,
                  }}>
                    Click to open
                  </span>
                </div>
              </div>
            </div>
          ))}

          {!visibleModules.length && (
            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              padding: '60px 20px',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🔒</span>
              <h2 style={{ color: '#1e293b', margin: '0 0 8px' }}>No Accessible Modules</h2>
              <p style={{ color: '#64748b' }}>
                Your account does not have permission to access any modules. Please contact system administrator.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '2px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.8rem',
            margin: 0,
          }}>
            © 2024 Radhu Industries • All rights reserved
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}>
            <span style={{
              color: '#64748b',
              fontSize: '0.7rem',
              padding: '4px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
            }}>
              🟢 System Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}