'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

/* ---------------------------------------------------------
   Design language: factory control-room panel.
   Rubber-black base, hazard-amber accent, hairline dividers,
   condensed industrial numerals for data-heavy readouts.
--------------------------------------------------------- */

export default function AutoTyreDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRange, setCustomRange] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async (month, sd, ed) => {
    setLoading(true);
    let url = '/stock/dashboard/?';
    if (sd && ed) {
      url += `start_date=${sd}&end_date=${ed}`;
    } else if (month) {
      url += `month=${month}`;
    }
    const result = await apiGet(url);
    if (result) {
      setData(result);
      if (!month && result.selected_month) {
        setSelectedMonth(result.selected_month);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData('', '', '');
  }, []);

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    setCustomRange(false);
    setStartDate('');
    setEndDate('');
    fetchData(val, '', '');
  };

  const handleApplyRange = () => {
    if (startDate && endDate) {
      setCustomRange(true);
      fetchData('', startDate, endDate);
    }
  };

  const handleResetRange = () => {
    setCustomRange(false);
    setStartDate('');
    setEndDate('');
    fetchData(selectedMonth, '', '');
  };

  const items = data?.items || [];
  const totals = data?.totals || {};
  const stats = data?.stats || {};
  const availableMonths = data?.available_months || [];

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      (item.tyre || '').toLowerCase().includes(q) ||
      (item.pattern || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const filteredTotals = useMemo(() => {
    if (!search.trim()) return totals;
    return filteredItems.reduce((acc, item) => {
      acc.prev_closing_first += item.prev_closing_first || 0;
      acc.prev_closing_second += item.prev_closing_second || 0;
      acc.prev_closing_third += item.prev_closing_third || 0;
      acc.month_prod_total += item.month_prod_total || 0;
      acc.month_prod_first += item.month_prod_first || 0;
      acc.month_prod_second += item.month_prod_second || 0;
      acc.month_prod_third += item.month_prod_third || 0;
      acc.month_sale_first += item.month_sale_first || 0;
      acc.month_sale_second += item.month_sale_second || 0;
      acc.month_sale_third += item.month_sale_third || 0;
      acc.rfm_ok_tyre += item.rfm_ok_tyre || 0;
      acc.closing_first += item.closing_first || 0;
      acc.closing_second += item.closing_second || 0;
      acc.closing_third += item.closing_third || 0;
      acc.total_closing += item.total_closing || 0;
      return acc;
    }, {
      prev_closing_first: 0, prev_closing_second: 0, prev_closing_third: 0,
      month_prod_total: 0, month_prod_first: 0, month_prod_second: 0, month_prod_third: 0,
      month_sale_first: 0, month_sale_second: 0, month_sale_third: 0,
      rfm_ok_tyre: 0,
      closing_first: 0, closing_second: 0, closing_third: 0, total_closing: 0,
    });
  }, [filteredItems, search, totals]);

  const exportCSV = () => {
    const headers = ['TYRE', 'PATTERN', 'TYPE', 'LAST CL (1ST)', 'LAST CL (2ND)', 'LAST CL (3RD)', 'PROD (TOTAL)', 'PROD (1ST)', 'PROD (2ND)', 'PROD (3RD)', 'SALE (1ST)', 'SALE (2ND)', 'SALE (3RD)', 'RFM', 'CLOSING (1ST)', 'CLOSING (2ND)', 'CLOSING (3RD)', 'TOTAL STOCK'];
    const rows = filteredItems.map(item => [
      item.tyre, item.pattern, item.type,
      item.prev_closing_first, item.prev_closing_second, item.prev_closing_third,
      item.month_prod_total, item.month_prod_first, item.month_prod_second, item.month_prod_third,
      item.month_sale_first, item.month_sale_second, item.month_sale_third,
      item.rfm_ok_tyre,
      item.closing_first, item.closing_second, item.closing_third, item.total_closing
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'auto_tyre_stock.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const isMobile = windowWidth < 860;
  const isTablet = windowWidth >= 860 && windowWidth < 1180;

  /* ---------------- Theme tokens ---------------- */
  const theme = darkMode ? {
    bg: '#0b0c0e',
    panel: '#15171b',
    panel2: '#1b1e23',
    ink: '#eef0f2',
    inkMute: '#82868f',
    line: '#26292f',
    lineStrong: '#34383f',
    amber: '#ffb020',
    steel: '#5b9bd5',
    green: '#3ecf8e',
    red: '#f0555c',
    violet: '#b48cf2',
    rowAlt: '#121317',
  } : {
    bg: '#eef0ee',
    panel: '#ffffff',
    panel2: '#f6f7f5',
    ink: '#14171a',
    inkMute: '#666c72',
    line: '#dcdfdc',
    lineStrong: '#c5c9c5',
    amber: '#b9760a',
    steel: '#2f6690',
    green: '#1f8f5f',
    red: '#c0323a',
    violet: '#7a4fc9',
    rowAlt: '#f4f5f3',
  };

  const numeralFont = "'Oswald', 'Barlow Condensed', 'Arial Narrow', sans-serif";

  const KpiCard = ({ label, value, accent, unit }) => (
    <div style={{
      backgroundColor: theme.panel,
      border: `1px solid ${theme.line}`,
      borderTop: `3px solid ${accent}`,
      padding: isMobile ? '14px 14px' : '18px 20px',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: '0.68rem', fontWeight: 600, color: theme.inkMute,
        letterSpacing: '0.04em', marginBottom: '8px',
      }}>{label}</div>
      <div style={{
        fontFamily: numeralFont, fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: 600, color: theme.ink, lineHeight: 1, letterSpacing: '0.01em',
      }}>
        {value ?? '—'}
        {unit && <span style={{ fontSize: '0.9rem', color: theme.inkMute, marginLeft: '6px', fontFamily: 'inherit' }}>{unit}</span>}
      </div>
    </div>
  );

  const thStyle = {
    padding: '9px 10px', fontSize: '0.66rem', fontWeight: 600,
    letterSpacing: '0.03em', whiteSpace: 'nowrap', position: 'sticky', top: 0,
    backgroundColor: theme.panel2, color: theme.inkMute, borderBottom: `1px solid ${theme.lineStrong}`,
    textAlign: 'center', zIndex: 2,
  };
  const tdStyle = {
    padding: '8px 10px', fontFamily: numeralFont, fontSize: '0.86rem', color: theme.ink,
    textAlign: 'center', borderBottom: `1px solid ${theme.line}`, whiteSpace: 'nowrap',
  };

  const sectionColors = {
    lastClosing: theme.steel,
    production: theme.green,
    dispatch: theme.red,
    rfm: theme.violet,
    closing: theme.amber,
  };

  const badgeStyle = (color) => ({
    padding: '2px 9px', border: `1px solid ${color}55`, color,
    fontSize: '0.68rem', fontWeight: 700, fontFamily: numeralFont, letterSpacing: '0.02em',
  });

  const monthLabel = customRange && startDate && endDate
    ? `${startDate} → ${endDate}`
    : availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;

  return (
    <div style={{
      minHeight: '100vh', width: '100%', backgroundColor: theme.bg,
      color: theme.ink, fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      transition: 'background-color 0.2s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: ${theme.amber}; color: #111; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: ${darkMode ? 'invert(1)' : 'none'}; opacity: 0.6; cursor: pointer; }
      `}</style>

      <Navbar />

      {/* ---- Edge-to-edge industrial header strip ---- */}
      <div style={{
        borderBottom: `1px solid ${theme.line}`,
        backgroundColor: theme.panel,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
          padding: isMobile ? '14px 16px' : '18px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '38px', height: '38px', flexShrink: 0,
              border: `2px solid ${theme.amber}`, borderRadius: '50%',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${theme.amber}` }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: numeralFont, fontWeight: 600, letterSpacing: '0.01em',
                fontSize: isMobile ? '1.05rem' : '1.35rem', lineHeight: 1.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                AUTO TYRE STOCK
              </div>
              <div style={{ fontSize: '0.72rem', color: theme.inkMute, marginTop: '2px' }}>
                Production &amp; dispatch control · {monthLabel || 'no period selected'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={exportCSV} style={{
              padding: '9px 16px', border: `1px solid ${theme.amber}`, backgroundColor: 'transparent',
              color: theme.amber, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
              letterSpacing: '0.03em', fontFamily: 'inherit',
            }}>
              Export CSV
            </button>
            <button onClick={() => setDarkMode(!darkMode)} style={{
              padding: '9px 14px', border: `1px solid ${theme.line}`, backgroundColor: theme.panel2,
              color: theme.ink, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit',
            }}>
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Filters — edge to edge ---- */}
      <div style={{ backgroundColor: theme.panel2, borderBottom: `1px solid ${theme.line}` }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: isMobile ? '10px' : '0',
          padding: isMobile ? '12px 16px' : '0 28px',
        }}>
          {[
            {
              label: 'Month', node: (
                <select
                  value={customRange ? '' : selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  style={selectStyle(theme)}
                >
                  <option value="">Select month</option>
                  {availableMonths.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              )
            },
            {
              label: 'From', node: (
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={selectStyle(theme)} />
              )
            },
            {
              label: 'To', node: (
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={selectStyle(theme)} />
              )
            },
          ].map((f, i) => (
            <div key={f.label} style={{
              flex: isMobile ? '1 1 100%' : '0 0 auto',
              padding: isMobile ? '0' : '12px 20px',
              borderRight: !isMobile ? `1px solid ${theme.line}` : 'none',
              minWidth: isMobile ? 'auto' : '170px',
            }}>
              <label style={filterLabelStyle(theme)}>{f.label}</label>
              {f.node}
            </div>
          ))}

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: isMobile ? '2px 0 0' : '12px 20px',
            borderRight: !isMobile ? `1px solid ${theme.line}` : 'none',
          }}>
            <button onClick={handleApplyRange} disabled={!startDate || !endDate} style={{
              padding: '9px 16px', border: 'none', backgroundColor: theme.amber, color: '#141414',
              cursor: (!startDate || !endDate) ? 'not-allowed' : 'pointer', fontSize: '0.76rem', fontWeight: 700,
              opacity: (!startDate || !endDate) ? 0.4 : 1, fontFamily: 'inherit',
            }}>
              Apply
            </button>
            <button onClick={handleResetRange} style={{
              padding: '9px 16px', border: `1px solid ${theme.line}`, backgroundColor: 'transparent',
              color: theme.inkMute, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, fontFamily: 'inherit',
            }}>
              Reset
            </button>
          </div>

          <div style={{
            flex: isMobile ? '1 1 100%' : '1 1 220px',
            padding: isMobile ? '0' : '12px 20px',
            minWidth: '180px',
          }}>
            <label style={filterLabelStyle(theme)}>Search</label>
            <input
              type="text" placeholder="Tyre, pattern, type…" value={search}
              onChange={(e) => setSearch(e.target.value)} style={selectStyle(theme)}
            />
          </div>
        </div>
      </div>

      {/* ---- KPI strip — edge to edge ---- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: '1px', backgroundColor: theme.line,
        borderBottom: `1px solid ${theme.line}`,
      }}>
        <KpiCard label="TODAY'S PRODUCTION" value={stats.today_production} accent={theme.green} />
        <KpiCard label="TODAY'S DISPATCH" value={stats.today_dispatch} accent={theme.red} />
        <KpiCard label="MONTH PRODUCTION" value={stats.month_prod_total} accent={theme.steel} />
        <KpiCard label="RFM STOCK" value={filteredTotals.rfm_ok_tyre} accent={theme.violet} />
        <KpiCard label="TOTAL CLOSING" value={stats.total_closing} accent={theme.amber} />
      </div>

      {/* ==================================================
          DESKTOP / TABLET — full table, edge to edge
      ================================================== */}
      {!isMobile && (
        <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
          {loading ? (
            <LoadingRow theme={theme} />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1380px' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, zIndex: 3, backgroundColor: theme.panel2 }} rowSpan={2}>TYRE</th>
                  <th style={{ ...thStyle, textAlign: 'left' }} rowSpan={2}>PATTERN</th>
                  <th style={thStyle} rowSpan={2}>TYPE</th>
                  <th style={{ ...thStyle, color: sectionColors.lastClosing, borderBottom: `1px solid ${theme.line}` }} colSpan={3}>LAST CLOSING</th>
                  <th style={{ ...thStyle, color: sectionColors.production, borderBottom: `1px solid ${theme.line}` }} colSpan={4}>PRODUCTION</th>
                  <th style={{ ...thStyle, color: sectionColors.dispatch, borderBottom: `1px solid ${theme.line}` }} colSpan={3}>SALE / DISPATCH</th>
                  <th style={{ ...thStyle, color: sectionColors.rfm }} rowSpan={2}>RFM</th>
                  <th style={{ ...thStyle, color: sectionColors.closing, borderBottom: `1px solid ${theme.line}` }} colSpan={3}>CLOSING STOCK</th>
                  <th style={thStyle} rowSpan={2}>TOTAL</th>
                </tr>
                <tr>
                  <th style={thStyle}>1st</th><th style={thStyle}>2nd</th><th style={thStyle}>3rd</th>
                  <th style={thStyle}>Total</th><th style={thStyle}>1st</th><th style={thStyle}>2nd</th><th style={thStyle}>3rd</th>
                  <th style={thStyle}>1st</th><th style={thStyle}>2nd</th><th style={thStyle}>3rd</th>
                  <th style={thStyle}>1st</th><th style={thStyle}>2nd</th><th style={thStyle}>3rd</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : theme.rowAlt }}>
                    <td style={{ ...tdStyle, fontFamily: 'inherit', textAlign: 'left', fontWeight: 700, position: 'sticky', left: 0, backgroundColor: idx % 2 === 0 ? theme.panel : theme.rowAlt, zIndex: 1 }}>{item.tyre}</td>
                    <td style={{ ...tdStyle, fontFamily: 'inherit', textAlign: 'left', fontSize: '0.78rem', color: theme.inkMute }}>{item.pattern}</td>
                    <td style={tdStyle}><span style={badgeStyle(item.type === 'TL' ? theme.steel : theme.amber)}>{item.type}</span></td>
                    <td style={tdStyle}>{item.prev_closing_first}</td>
                    <td style={tdStyle}>{item.prev_closing_second}</td>
                    <td style={tdStyle}>{item.prev_closing_third}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: sectionColors.production }}>{item.month_prod_total}</td>
                    <td style={tdStyle}>{item.month_prod_first}</td>
                    <td style={tdStyle}>{item.month_prod_second}</td>
                    <td style={tdStyle}>{item.month_prod_third}</td>
                    <td style={{ ...tdStyle, color: sectionColors.dispatch, fontWeight: 600 }}>{item.month_sale_first}</td>
                    <td style={{ ...tdStyle, color: sectionColors.dispatch }}>{item.month_sale_second}</td>
                    <td style={{ ...tdStyle, color: sectionColors.dispatch }}>{item.month_sale_third}</td>
                    <td style={{ ...tdStyle, color: sectionColors.rfm, fontWeight: 600 }}>{item.rfm_ok_tyre}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{item.closing_first}</td>
                    <td style={tdStyle}>{item.closing_second}</td>
                    <td style={tdStyle}>{item.closing_third}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, fontSize: '0.95rem', color: theme.amber }}>{item.total_closing}</td>
                  </tr>
                ))}
                {!filteredItems.length && <EmptyRow colSpan={18} theme={theme} loading={loading} search={search} />}
              </tbody>
              {filteredItems.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: theme.panel2, fontWeight: 700 }}>
                    <td style={{ ...tdStyle, fontFamily: 'inherit', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: theme.panel2 }} colSpan={3}>TOTALS</td>
                    <td style={tdStyle}>{filteredTotals.prev_closing_first}</td>
                    <td style={tdStyle}>{filteredTotals.prev_closing_second}</td>
                    <td style={tdStyle}>{filteredTotals.prev_closing_third}</td>
                    <td style={{ ...tdStyle, color: sectionColors.production }}>{filteredTotals.month_prod_total}</td>
                    <td style={tdStyle}>{filteredTotals.month_prod_first}</td>
                    <td style={tdStyle}>{filteredTotals.month_prod_second}</td>
                    <td style={tdStyle}>{filteredTotals.month_prod_third}</td>
                    <td style={{ ...tdStyle, color: sectionColors.dispatch }}>{filteredTotals.month_sale_first}</td>
                    <td style={tdStyle}>{filteredTotals.month_sale_second}</td>
                    <td style={tdStyle}>{filteredTotals.month_sale_third}</td>
                    <td style={{ ...tdStyle, color: sectionColors.rfm }}>{filteredTotals.rfm_ok_tyre}</td>
                    <td style={tdStyle}>{filteredTotals.closing_first}</td>
                    <td style={tdStyle}>{filteredTotals.closing_second}</td>
                    <td style={tdStyle}>{filteredTotals.closing_third}</td>
                    <td style={{ ...tdStyle, fontSize: '1rem', color: theme.amber }}>{filteredTotals.total_closing}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}

      {/* ==================================================
          MOBILE — stacked cards, tap to expand full breakdown
      ================================================== */}
      {isMobile && (
        <div style={{ padding: '10px 12px 24px' }}>
          {loading ? (
            <LoadingRow theme={theme} />
          ) : !filteredItems.length ? (
            <EmptyRow theme={theme} loading={loading} search={search} mobile />
          ) : (
            filteredItems.map((item) => {
              const open = expandedRow === item.id;
              return (
                <div key={item.id} style={{
                  border: `1px solid ${theme.line}`, borderLeft: `3px solid ${theme.amber}`,
                  backgroundColor: theme.panel, marginBottom: '8px',
                }}>
                  <button
                    onClick={() => setExpandedRow(open ? null : item.id)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: theme.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.tyre}
                        <span style={badgeStyle(item.type === 'TL' ? theme.steel : theme.amber)}>{item.type}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: theme.inkMute, marginTop: '2px' }}>{item.pattern}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: numeralFont, fontSize: '1.15rem', fontWeight: 700, color: theme.amber, lineHeight: 1 }}>{item.total_closing}</div>
                        <div style={{ fontSize: '0.62rem', color: theme.inkMute, marginTop: '2px' }}>TOTAL STOCK</div>
                      </div>
                      <span style={{ color: theme.inkMute, fontSize: '0.8rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
                    </div>
                  </button>

                  {open && (
                    <div style={{ borderTop: `1px solid ${theme.line}`, padding: '12px 14px' }}>
                      <MobileStatGroup theme={theme} label="PRODUCTION" color={sectionColors.production}
                        cells={[['1st', item.month_prod_first], ['2nd', item.month_prod_second], ['3rd', item.month_prod_third], ['Total', item.month_prod_total]]} />
                      <MobileStatGroup theme={theme} label="SALE / DISPATCH" color={sectionColors.dispatch}
                        cells={[['1st', item.month_sale_first], ['2nd', item.month_sale_second], ['3rd', item.month_sale_third]]} />
                      <MobileStatGroup theme={theme} label="CLOSING STOCK" color={sectionColors.closing}
                        cells={[['1st', item.closing_first], ['2nd', item.closing_second], ['3rd', item.closing_third]]} />
                      <MobileStatGroup theme={theme} label="LAST CLOSING" color={sectionColors.lastClosing}
                        cells={[['1st', item.prev_closing_first], ['2nd', item.prev_closing_second], ['3rd', item.prev_closing_third]]} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: theme.inkMute, marginTop: '4px' }}>
                        <span>RFM</span>
                        <span style={{ fontFamily: numeralFont, fontWeight: 700, color: sectionColors.rfm }}>{item.rfm_ok_tyre}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {filteredItems.length > 0 && (
            <div style={{
              backgroundColor: theme.panel2, border: `1px solid ${theme.lineStrong}`,
              padding: '12px 14px', marginTop: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.inkMute }}>TOTAL CLOSING · {filteredItems.length} tyres</span>
              <span style={{ fontFamily: numeralFont, fontSize: '1.2rem', fontWeight: 700, color: theme.amber }}>{filteredTotals.total_closing}</span>
            </div>
          )}
        </div>
      )}

      <div style={{
        textAlign: 'center', padding: '12px', color: theme.inkMute, fontSize: '0.7rem',
        borderTop: `1px solid ${theme.line}`,
      }}>
        Showing {filteredItems.length} of {items.length} tyres
      </div>
    </div>
  );
}

function MobileStatGroup({ theme, label, color, cells }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 700, color, letterSpacing: '0.03em', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '1px', backgroundColor: theme.line }}>
        {cells.map(([k, v]) => (
          <div key={k} style={{ flex: 1, backgroundColor: theme.panel2, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.92rem', fontWeight: 700, color: theme.ink }}>{v ?? 0}</div>
            <div style={{ fontSize: '0.6rem', color: theme.inkMute, marginTop: '1px' }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingRow({ theme }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.inkMute, fontSize: '0.9rem' }}>
      Loading stock data…
    </div>
  );
}

function EmptyRow({ colSpan, theme, loading, search, mobile }) {
  const message = loading ? 'Loading…' : search ? 'No matching tyres found' : 'No tyres found. Add tyres first.';
  if (mobile) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.inkMute, fontSize: '0.85rem' }}>{message}</div>;
  }
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', color: theme.inkMute, padding: '40px', fontSize: '0.88rem' }}>{message}</td>
    </tr>
  );
}

function selectStyle(theme) {
  return {
    width: '100%', padding: '8px 10px', border: `1px solid ${theme.line}`,
    backgroundColor: theme.panel, color: theme.ink, fontSize: '0.82rem',
    fontFamily: 'inherit', outline: 'none',
  };
}

function filterLabelStyle(theme) {
  return {
    display: 'block', fontSize: '0.66rem', fontWeight: 700, color: theme.inkMute,
    letterSpacing: '0.03em', marginBottom: '5px',
  };
}