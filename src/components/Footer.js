'use client';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="no-print" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      borderTop: '1px solid rgba(99,102,241,0.3)',
      color: '#94a3b8',
      marginTop: '60px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '1px',
        background: 'linear-gradient(90deg, transparent, #6366f1, #38bdf8, #6366f1, transparent)',
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <i className="fas fa-industry" style={{ color: '#38bdf8', fontSize: '1.4rem' }}></i>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                RADHU <span style={{ color: '#38bdf8' }}>ERP</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#64748b', marginBottom: '20px' }}>
              Enterprise-grade ERP system powering Radhu Industries — from factory floor to final dispatch.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { icon: 'fas fa-globe', color: '#38bdf8', text: 'radhuerp.site' },
                { icon: 'fas fa-server', color: '#10b981', text: 'api.radhuerp.site' },
                { icon: 'fas fa-shield-alt', color: '#f59e0b', text: 'SSL Secured · AWS EC2' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <i className={item.icon} style={{ color: item.color, width: '14px' }}></i>
                  <span style={{ color: '#94a3b8' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '16px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ERP Modules</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: 'fas fa-circle-notch', label: 'Auto Tyre Management', path: '/stock' },
                { icon: 'fas fa-bicycle', label: 'Cycle Tyre & Tube', path: '/cycletyres' },
                { icon: 'fas fa-sync-alt', label: 'Tally Sync Engine', path: '/tallysync' },
                { icon: 'fas fa-users', label: 'HRMS & Payroll', path: '/hrms' },
                { icon: 'fas fa-shopping-cart', label: 'Orders & Dispatch', path: '/orders' },
                { icon: 'fas fa-robot', label: 'AI Analytics', path: '/ai-agent' },
              ].map(item => (
                <li key={item.path}>
                  <Link href={item.path} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={item.icon} style={{ width: '14px', color: '#475569' }}></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '16px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Technology Stack</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
               
                { tech: 'MicroServices', desc: 'Rishabh Tyagi', color: '#a78bfa' },
              
              ].map(item => (
                <div key={item.tech} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ color: item.color, fontWeight: 600, fontSize: '0.78rem' }}>{item.tech}</span>
                  <span style={{ color: '#475569', fontSize: '0.74rem' }}>— {item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '16px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Development Team</h4>
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(56,189,248,0.05))',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: 'white', fontSize: '1.1rem', flexShrink: 0,
                }}>R</div>
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>Rishabh Tyagi</div>
                  <div style={{ color: '#6366f1', fontSize: '0.72rem', fontWeight: 600 }}>Lead Software Engineer</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.7 }}>
                Full Stack Developer · System Architect · <br />ERP Specialist · Cloud Infrastructure
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.8 }}>
              <div><i className="fas fa-code" style={{ color: '#6366f1', marginRight: '6px' }}></i><span style={{ color: '#64748b' }}>Radhu Tech Team</span></div>
              <div><i className="fas fa-cogs" style={{ color: '#10b981', marginRight: '6px' }}></i><span style={{ color: '#64748b' }}>Software Engineers</span></div>
              <div><i className="fas fa-building" style={{ color: '#f59e0b', marginRight: '6px' }}></i><span style={{ color: '#64748b' }}>Radhu Industries, India</span></div>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.3), transparent)', marginBottom: '20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>
            © {currentYear} <strong style={{ color: '#64748b' }}>Radhu Industries</strong>. All rights reserved.
            &nbsp;·&nbsp; Designed & Developed by{' '}
            <strong style={{ color: '#6366f1' }}>Rishabh Tyagi</strong> & the{' '}
            <strong style={{ color: '#38bdf8' }}>  Team</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '20px', padding: '4px 12px',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>All Systems Operational</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#334155' }}>
              <i className="fas fa-code-branch" style={{ marginRight: '4px', color: '#475569' }}></i>v2.0.0 Production
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.7rem', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Built with ❤️ for Radhu Industries · Powered by Radhu Tech Team Software Engineers
        </div>
      </div>
    </footer>
  );
}
