'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

/* ---------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------- */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const N = (v) => Number(v || 0);
const money = (v) =>
  N(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyShort = (v) => N(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const twoDigits = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''));
const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigits(r) : '');
}
;

function amountInWords(amount) {
  const total = Math.round(Math.abs(N(amount)) * 100);
  let rupees = Math.floor(total / 100);
  const paise = total % 100;
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  const parts = [];
  const crore = Math.floor(rupees / 10000000); rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000); rupees %= 100000;
  const thousand = Math.floor(rupees / 1000); rupees %= 1000;

  if (crore) parts.push(threeDigits(crore) + ' Crore');
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
  if (rupees) parts.push(threeDigits(rupees));

  let words = (parts.join(' ') || 'Zero') + ' Rupees';
  if (paise) words += ' and ' + twoDigits(paise) + ' Paise';
  return words + ' Only';
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function attendanceCode(status = '') {
  const s = String(status).toLowerCase();
  if (s === 'present') return { code: 'P', cls: 'p' }
;
  if (s === 'absent') return { code: 'A', cls: 'a' }
;
  if (s.includes('half')) return { code: 'H', cls: 'h' }
;
  if (s.includes('holiday')) return { code: 'HD', cls: 'hd' }
;
  if (s.includes('week')) return { code: 'WO', cls: 'wo' }
;
  return { code: '', cls: '' }
;
}

/* Zyada products hone par rows automatically thodi compact ho jaati hain,
   taaki poori slip hamesha ek hi A4 page me aaye. */
function densityFor(productCount) {
  if (productCount >= 11) return 'd3';
  if (productCount >= 7) return 'd2';
  if (productCount >= 4) return 'd1';
  return 'd0';
}

/* ---------------------------------------------------------------------------
   Salary slip + wages register  (ONE A4 landscape page per employee)
--------------------------------------------------------------------------- */
const SlipRenderer = ({ selectedSlip, printWages, onClose, onPrint, isBulk = false }) => {
  if (!selectedSlip) return null;

  const { salary, employee, attendance_summary: att } = selectedSlip;
  const year = N(salary.year);
  const month = N(salary.month);
  const daysInMonth = N(att.days_in_month);
  const monthLabel = `${MONTH_NAMES[month - 1] || month} ${year}`;

  const dayInfo = Array.from({ length: daysInMonth }, (_, i) => ({
    d: i + 1,
    wd: new Date(year, month - 1, i + 1).getDay(),
  }));

  // Group production by product, keyed by day
  const prodGroups = {}
;
  (selectedSlip.production_detail || []).forEach((p) => {
    if (!prodGroups[p.product_name]) prodGroups[p.product_name] = {}
;
    prodGroups[p.product_name][parseInt(p.day, 10)] = p;
  });

  // Attendance by day
  const attMap = {}
;
  (selectedSlip.attendance_detail || []).forEach((a) => {
    attMap[parseInt(a.day, 10)] = a;
  });

  const attDates = (selectedSlip.attendance_detail || [])
    .filter((a) => ['Present', 'Holiday', 'Half Day'].includes(a.status))
    .map((a) => a.date);
  const prodDates = (selectedSlip.production_detail || []).map((p) => p.date);
  const totalActiveDays = att.total_active_days || new Set([...attDates, ...prodDates]).size;

  const totalEarnings =
    N(salary.basic_salary) + N(salary.overtime_amount) + N(salary.production_amount) +
    N(salary.bonus) + N(salary.incentive_amount);
  const totalDeductions =
    N(salary.pf_amount) + N(salary.esi_amount) + N(salary.advance) + N(salary.deduction);

  const showWages =
    (isBulk ? true : printWages.value) &&
    ((selectedSlip.attendance_detail?.length || 0) > 0 || (selectedSlip.production_detail?.length || 0) > 0);

  const prodRows = Object.keys(prodGroups).map((name) => {
    const items = Object.values(prodGroups[name]);
    return {
      name,
      byDay: prodGroups[name],
      qty: items.reduce((s, p) => s + N(p.quantity), 0),
      rate: items.length ? N(items[0].rate) : 0,
      amount: items.reduce((s, p) => s + N(p.total_amount), 0),
    }
;
  });

  const wagesTotal =
    N(salary.basic_salary) + N(salary.overtime_amount) + prodRows.reduce((s, r) => s + r.amount, 0);

  const earningRows = [
    ['Earned Basic Salary', salary.basic_salary],
    ['Overtime Earnings', salary.overtime_amount],
    ['Piece-Rate Production', salary.production_amount],
    ['Bonus', salary.bonus],
    ['Incentive / Cycle Press', salary.incentive_amount],
  ];
  const deductionRows = [
    ['PF Contribution', salary.pf_amount],
    ['ESI Contribution', salary.esi_amount],
    ['Salary Advance', salary.advance],
    ['Other Deductions', salary.deduction],
  ];

  const density = densityFor(prodRows.length);
  const qtyCls = (q) => (String(q).length >= 4 ? 'qty-long' : '');

  return (
    <section className={`slip-root ${isBulk ? 'is-bulk' : 'is-single'}`}>
      {!isBulk && (
        <div className="slip-toolbar no-print">
          <div className="slip-toolbar-left">
            <button onClick={onClose} className="hr-btn hr-btn-ghost">← Back to list</button>
            <label className="hr-check">
              <input
                type="checkbox"
                checked={printWages.value}
                onChange={(e) => printWages.setter(e.target.checked)}
              />
              <span>Include wages record on the same page</span>
            </label>
          </div>
          <button onClick={onPrint} className="hr-btn hr-btn-danger">🖨 Print payslip (A4 landscape)</button>
        </div>
      )}

      <div className="sheet-scroll">
        <div className={`sheet ${density}`}>
          {/* ---------- Header ---------- */}
          <header className="sh-head">
            <div className="sh-brand">
              <div className="sh-logo">R</div>
              <div>
                <h1>RADHU INDUSTRIES</h1>
                <p>Salary Slip &amp; Wages Record</p>
              </div>
            </div>
            <div className="sh-period">
              <span>Pay period</span>
              <strong>{monthLabel}</strong>
            </div>
          </header>

          {/* ---------- Top: pay table (left) + employee & attendance (right) ---------- */}
          <div className="sh-top">
            <div className="sh-left">
              <table className="pay-table">
                <thead>
                  <tr>
                    <th>Earnings</th>
                    <th className="amt">Amount (Rs)</th>
                    <th className="split">Deductions</th>
                    <th className="amt">Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {earningRows.map((e, i) => {
                    const dd = deductionRows[i];
                    return (
                      <tr key={e[0]}>
                        <td>{e[0]}</td>
                        <td className="amt">{money(e[1])}</td>
                        <td className="split">{dd ? dd[0] : ''}</td>
                        <td className="amt">{dd ? money(dd[1]) : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total Earnings</td>
                    <td className="amt">{money(totalEarnings)}</td>
                    <td className="split">Total Deductions</td>
                    <td className="amt">{money(totalDeductions)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="net-pay">
                <div>
                  <span className="net-label">Net payable salary</span>
                  <span className="net-words">{amountInWords(salary.net_salary)}</span>
                </div>
                <div className="net-amount">Rs {money(salary.net_salary)}</div>
              </div>
            </div>

            <div className="sh-right">
              <div className="emp-card">
                <div><span>Employee Code</span><strong>{employee.employee_code}</strong></div>
                <div><span>Employee Name</span><strong>{employee.name}</strong></div>
                <div><span>Designation</span><strong>{employee.designation || '-'}</strong></div>
                <div><span>Department</span><strong>{employee.department_name || '-'}</strong></div>
              </div>

              <div className="mini-stats">
                <div><b>{daysInMonth}</b><span>Month days</span></div>
                <div><b>{totalActiveDays}</b><span>Active days</span></div>
                <div><b>{att.total_worked_days}</b><span>Worked days</span></div>
                <div><b>{att.total_overtime_hours}</b><span>OT hours</span></div>
              </div>

              <div className="chips">
                <div className="chip chip-p"><b>{att.present_days}</b><span>Present</span></div>
                <div className="chip chip-h"><b>{att.half_days}</b><span>Half day</span></div>
                <div className="chip chip-hd"><b>{att.holiday_days || 0}</b><span>Holiday</span></div>
                <div className="chip chip-a"><b>{att.absent_days}</b><span>Absent</span></div>
                <div className="chip chip-wo"><b>{att.week_off_days || 0}</b><span>Week off</span></div>
              </div>
            </div>
          </div>

          {/* ---------- Wages register (same page) ---------- */}
          {showWages && (
            <div className="wages">
              <div className="wages-title">
                <h2>Wages Record — Attendance &amp; Production</h2>
                <div className="legend">
                  <span><i className="lg lg-p">P</i>Present</span>
                  <span><i className="lg lg-a">A</i>Absent</span>
                  <span><i className="lg lg-h">H</i>Half day</span>
                  <span><i className="lg lg-hd">HD</i>Holiday</span>
                  <span><i className="lg lg-wo">WO</i>Week off</span>
                </div>
              </div>

              <table className="wages-table">
                <thead>
                  <tr>
                    <th className="w-name">Particulars</th>
                    {dayInfo.map(({ d, wd }) => (
                      <th key={d} className={wd === 0 ? 'sun' : ''}>
                        <span className="dn">{d}</span>
                        <span className="wd">{WEEKDAY_LETTERS[wd]}</span>
                      </th>
                    ))}
                    <th className="w-sum">Total</th>
                    <th className="w-rate">Rate</th>
                    <th className="w-amt">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="w-name">Attendance</td>
                    {dayInfo.map(({ d, wd }) => {
                      const { code, cls } = attendanceCode(attMap[d]?.status);
                      return (
                        <td key={d} className={`${wd === 0 ? 'sun' : ''} st-${cls}`}>{code}</td>
                      );
                    })}
                    <td className="w-sum strong">{att.total_worked_days}</td>
                    <td className="w-rate">-</td>
                    <td className="w-amt strong">{moneyShort(salary.basic_salary)}</td>
                  </tr>

                  <tr>
                    <td className="w-name">Overtime (hrs)</td>
                    {dayInfo.map(({ d, wd }) => {
                      const a = attMap[d];
                      return (
                        <td key={d} className={wd === 0 ? 'sun' : ''}>
                          {a && N(a.overtime_hours) > 0 ? a.overtime_hours : ''}
                        </td>
                      );
                    })}
                    <td className="w-sum strong">{att.total_overtime_hours}</td>
                    <td className="w-rate">{employee.overtime_rate || '-'}</td>
                    <td className="w-amt strong">{moneyShort(salary.overtime_amount)}</td>
                  </tr>

                  {prodRows.map((r) => (
                    <tr key={r.name}>
                      <td className="w-name prod">{r.name}</td>
                      {dayInfo.map(({ d, wd }) => {
                        const p = r.byDay[d];
                        return (
                          <td key={d} className={`${wd === 0 ? 'sun' : ''} ${p ? qtyCls(p.quantity) : ''}`}>
                            {p ? p.quantity : ''}
                          </td>
                        );
                      })}
                      <td className="w-sum strong">{r.qty}</td>
                      <td className="w-rate">{r.rate}</td>
                      <td className="w-amt strong">{moneyShort(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="w-total-label" colSpan={dayInfo.length + 3}>
                      Total wages (basic + overtime + production)
                    </td>
                    <td className="w-amt">{moneyShort(wagesTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ---------- Signatures ---------- */}
          <div className="sh-sign">
            <div>Employer Signature</div>
            <p>This is a computer generated salary slip.</p>
            <div>Employee Signature</div>
          </div>
        </div>
      </div>
    </section>
  );
}
;

/* ---------------------------------------------------------------------------
   Page
--------------------------------------------------------------------------- */
export default function HRMSSalary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedSlip, setSelectedSlip] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  const [printWages, setPrintWages] = useState(true);

  const [bulkSlips, setBulkSlips] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  useEffect(() => {
    fetchSalaries();
    fetchDepartments();
  }, [selectedMonth]);

  // Print dialog band hone par bulk slips hata do
  useEffect(() => {
    const clear = () => setBulkSlips([]);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  async function fetchDepartments() {
    const res = await apiGet('/hrms/departments/');
    if (res) setDepartments(res);
  }

  async function fetchSalaries() {
    setLoading(true);
    const [year, month] = selectedMonth.split('-');
    const res = await apiGet(`/hrms/salary/?year=${year}&month=${month}`);
    if (res) setData(res);
    setLoading(false);
  }

  const handleGenerate = async () => {
    setGenerating(true);
    const [year, month] = selectedMonth.split('-');
    const res = await apiPost('/hrms/salary/', { year, month });
    setGenerating(false);

    if (res && res.ok) {
      alert(`Salary generated/updated for ${month}/${year}!`);
      fetchSalaries();
    } else {
      alert('Failed to generate salary');
    }
  }
;

  const fetchSlip = async (id) => {
    const res = await apiGet(`/hrms/salary/${id}/slip/`);
    if (res) {
      setSelectedSlip(res);
      setBulkSlips([]);
    }
  }
;

  const handlePrintSlip = () => window.print();

  const salaries = data?.salaries || [];
  const totals = data?.totals || {}
;

  const filteredSalaries = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return salaries.filter((sal) => {
      const matchSearch =
        (sal.employee_name || '').toLowerCase().includes(q) ||
        (sal.employee_code || '').toLowerCase().includes(q);
      const matchDept = selectedDepartment ? String(sal.department_name) === selectedDepartment : true;
      return matchSearch && matchDept;
    });
  }, [salaries, searchQuery, selectedDepartment]);

  const filteredNet = useMemo(
    () => filteredSalaries.reduce((s, x) => s + N(x.net_salary), 0),
    [filteredSalaries]
  );

  const handleBulkPrint = async () => {
    if (filteredSalaries.length === 0) {
      alert('No employees found in the current filter.');
      return;
    }
    if (!confirm(`Are you sure you want to fetch and print ${filteredSalaries.length} salary slips?`)) return;

    setIsBulkLoading(true);
    setSelectedSlip(null);

    const slips = await Promise.all(filteredSalaries.map((sal) => apiGet(`/hrms/salary/${sal.id}/slip/`)));

    setBulkSlips(slips.filter(Boolean));
    setIsBulkLoading(false);

    // DOM ko bada list render karne ka time do
    setTimeout(() => window.print(), 1000);
  }
;

  const [selYear, selMonth] = selectedMonth.split('-');
  const monthTitle = `${MONTH_NAMES[N(selMonth) - 1] || ''} ${selYear}`;
  const listHidden = Boolean(selectedSlip) || isBulkLoading;

  return (
    <>
      <style>{STYLES}</style>

      <div className="no-print">
        <Navbar />
      </div>

      <div className="hr-wrap">
        {/* ---------- Hero ---------- */}
        <div className="hr-hero no-print">
          <div>
            <h1>Payroll &amp; Salary Slips</h1>
            <p>{monthTitle} · generate salaries, review them and print professional payslips.</p>
          </div>
          <div className="hr-hero-actions">
            <input
              type="month"
              className="hr-input hr-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <button onClick={handleGenerate} className="hr-btn hr-btn-primary" disabled={generating}>
              {generating ? 'Calculating…' : '⚡ Generate / Recalculate'}
            </button>
          </div>
        </div>

        {/* ---------- Single slip ---------- */}
        {!isBulkLoading && selectedSlip && (
          <SlipRenderer
            selectedSlip={selectedSlip}
            printWages={{ value: printWages, setter: setPrintWages }}
            onClose={() => setSelectedSlip(null)}
            onPrint={handlePrintSlip}
          />
        )}

        {/* ---------- Bulk slips (print only) ---------- */}
        {bulkSlips.length > 0 && (
          <div className="bulk-wrapper">
            {bulkSlips.map((slip, idx) => (
              <SlipRenderer key={idx} selectedSlip={slip} printWages={{ value: true }} isBulk />
            ))}
          </div>
        )}

        {/* ---------- Stats ---------- */}
        <div className="hr-stats no-print" style={{ display: listHidden ? 'none' : 'grid' }}>
          <div className="hr-stat s-blue">
            <div className="hr-stat-icon">₹</div>
            <div>
              <span>Total salary payout</span>
              <b>₹{N(totals.total_payout).toLocaleString('en-IN')}</b>
            </div>
          </div>
          <div className="hr-stat s-slate">
            <div className="hr-stat-icon">🧾</div>
            <div>
              <span>Total earned basic</span>
              <b>₹{N(totals.total_basic).toLocaleString('en-IN')}</b>
            </div>
          </div>
          <div className="hr-stat s-green">
            <div className="hr-stat-icon">🏭</div>
            <div>
              <span>Total piece production</span>
              <b>₹{N(totals.total_production).toLocaleString('en-IN')}</b>
            </div>
          </div>
          <div className="hr-stat s-violet">
            <div className="hr-stat-icon">⏱</div>
            <div>
              <span>Total overtime amount</span>
              <b>₹{N(totals.total_overtime).toLocaleString('en-IN')}</b>
            </div>
          </div>
        </div>

        {/* ---------- Filters ---------- */}
        <div className="hr-filters no-print" style={{ display: listHidden ? 'none' : 'flex' }}>
          <div className="hr-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by employee code or name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="hr-input hr-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button
            onClick={handleBulkPrint}
            className="hr-btn hr-btn-danger"
            disabled={isBulkLoading || filteredSalaries.length === 0}
          >
            {isBulkLoading ? 'Loading slips…' : `🖨 Bulk print (${filteredSalaries.length})`}
          </button>
        </div>

        {/* ---------- Table ---------- */}
        <div className="hr-card no-print" style={{ display: listHidden ? 'none' : 'block' }}>
          <div className="hr-table-scroll">
            {loading ? (
              <div className="hr-empty">Loading salary records…</div>
            ) : (
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th className="r">Basic</th>
                    <th className="r">Overtime</th>
                    <th className="r">Production</th>
                    <th className="r">Incentive</th>
                    <th className="r">Deduction</th>
                    <th className="r">Net salary</th>
                    <th className="c">Payslip</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaries.map((sal) => (
                    <tr key={sal.id}>
                      <td>
                        <div className="emp">
                          <div className="avatar">{initials(sal.employee_name)}</div>
                          <div>
                            <div className="emp-name">{sal.employee_name}</div>
                            <div className="emp-code">{sal.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {sal.department_name ? <span className="badge">{sal.department_name}</span> : '-'}
                      </td>
                      <td className="r">₹{money(sal.basic_salary)}</td>
                      <td className="r">₹{money(sal.overtime_amount)}</td>
                      <td className="r t-green">₹{money(sal.production_amount)}</td>
                      <td className="r t-violet">₹{money(sal.incentive_amount)}</td>
                      <td className="r t-red">
                        ₹{money(N(sal.advance) + N(sal.deduction) + N(sal.pf_amount) + N(sal.esi_amount))}
                      </td>
                      <td className="r">
                        <span className="net-pill">₹{money(sal.net_salary)}</span>
                      </td>
                      <td className="c">
                        <button onClick={() => fetchSlip(sal.id)} className="hr-btn hr-btn-soft">
                          📄 View slip
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredSalaries.length && (
                    <tr>
                      <td colSpan="9" className="hr-empty">
                        No salary records found. Generate salaries for this month or change the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredSalaries.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="7" className="r">
                        Total for {filteredSalaries.length} employee{filteredSalaries.length > 1 ? 's' : ''}
                      </td>
                      <td className="r">₹{money(filteredNet)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------------
   Styles
--------------------------------------------------------------------------- */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  :root {
    --ink: #0f172a;
    --ink-2: #334155;
    --muted: #64748b;
    --line: #e2e8f0;
    --brand: #1d4ed8;
    --brand-dark: #1e3a8a;
    --green: #15803d;
    --red: #dc2626;
    --violet: #7c3aed;
    --font: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* ===================== SCREEN UI ===================== */
  .hr-wrap { width: 100%; max-width: 100%; margin: 0; padding: 24px 30px 60px; font-family: var(--font); color: var(--ink); box-sizing: border-box; }
  .hr-wrap * { font-family: inherit; }

  .hr-hero { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; padding: 26px 30px; border-radius: 16px; margin-bottom: 22px; color: #fff; background: linear-gradient(120deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%); box-shadow: 0 12px 30px rgba(30, 58, 138, .25); }
  .hr-hero h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -.3px; }
  .hr-hero p { margin: 6px 0 0; font-size: 14px; color: #cbd5e1; }
  .hr-hero-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

  .hr-input { padding: 10px 14px; border: 1px solid var(--line); border-radius: 10px; font-size: 14px; background: #fff; color: var(--ink); outline: none; }
  .hr-input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,.25); }
  .hr-month { width: 180px; font-weight: 600; }
  .hr-select { min-width: 200px; }

  .hr-btn { border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 700; cursor: pointer; transition: transform .12s ease, background .12s ease; white-space: nowrap; }
  .hr-btn:disabled { opacity: .55; cursor: not-allowed; }
  .hr-btn:not(:disabled):active { transform: translateY(1px); }
  .hr-btn-primary { background: #fff; color: var(--brand-dark); }
  .hr-btn-primary:not(:disabled):hover { background: #eff6ff; }
  .hr-btn-danger { background: var(--red); color: #fff; box-shadow: 0 4px 12px rgba(220,38,38,.25); }
  .hr-btn-danger:not(:disabled):hover { background: #b91c1c; }
  .hr-btn-ghost { background: #f1f5f9; color: var(--ink); }
  .hr-btn-ghost:hover { background: #e2e8f0; }
  .hr-btn-soft { background: #2563eb; color: #fff; padding: 8px 14px; font-size: 13px; }
  .hr-btn-soft:hover { background: #1d4ed8; }

  .hr-stats { grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
  .hr-stat { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
  .hr-stat-icon { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; font-weight: 800; flex-shrink: 0; }
  .hr-stat span { display: block; font-size: 12.5px; color: var(--muted); font-weight: 600; margin-bottom: 4px; }
  .hr-stat b { font-size: 22px; font-weight: 800; letter-spacing: -.3px; }
  .s-blue .hr-stat-icon { background: #dbeafe; color: var(--brand); } .s-blue b { color: var(--brand); }
  .s-slate .hr-stat-icon { background: #e2e8f0; color: var(--ink-2); }
  .s-green .hr-stat-icon { background: #dcfce7; color: var(--green); } .s-green b { color: var(--green); }
  .s-violet .hr-stat-icon { background: #ede9fe; color: var(--violet); } .s-violet b { color: var(--violet); }

  .hr-filters { gap: 12px; align-items: center; flex-wrap: wrap; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 12px; margin-bottom: 20px; }
  .hr-search { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid var(--line); border-radius: 10px; background: #f8fafc; }
  .hr-search:focus-within { border-color: #60a5fa; background: #fff; box-shadow: 0 0 0 3px rgba(96,165,250,.25); }
  .hr-search input { flex: 1; border: none; outline: none; background: transparent; padding: 11px 0; font-size: 14px; }

  .hr-card { background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
  .hr-table-scroll { overflow-x: auto; }
  .hr-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .hr-table thead th { background: #0f172a; color: #e2e8f0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; padding: 14px 16px; text-align: left; white-space: nowrap; }
  .hr-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .hr-table tbody tr:hover { background: #f8fafc; }
  .hr-table .r { text-align: right; } .hr-table .c { text-align: center; }
  .hr-table tfoot td { background: #f8fafc; font-weight: 800; border-top: 2px solid var(--line); border-bottom: none; }
  .t-green { color: var(--green); font-weight: 600; } .t-violet { color: var(--violet); font-weight: 600; } .t-red { color: var(--red); font-weight: 600; }
  .emp { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #1e3a8a); color: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
  .emp-name { font-weight: 700; }
  .emp-code { font-size: 12px; color: var(--brand); font-weight: 700; }
  .badge { background: #f1f5f9; color: var(--ink-2); font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
  .net-pill { background: #eff6ff; color: var(--brand-dark); font-weight: 800; padding: 6px 12px; border-radius: 8px; }
  .hr-empty { text-align: center; color: var(--muted); padding: 40px 16px !important; }

  @media (max-width: 900px) { .hr-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 520px) { .hr-stats { grid-template-columns: 1fr; } .hr-hero { padding: 20px; } }

  .slip-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; margin-bottom: 18px; }
  .slip-toolbar-left { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
  .hr-check { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .hr-check input { width: 18px; height: 18px; accent-color: var(--brand); }

  /* ===================== SHEET (A4 LANDSCAPE) ===================== */
  .sheet-scroll { overflow-x: auto; padding-bottom: 20px; }

  .sheet {
    width: 100%;
    max-width: 1450px; /* Looks huge and nice on screen */
    margin: 0 auto 40px;
    padding: 36px 40px;
    background: #ffffff;
    color: #0f172a;
    font-family: var(--font);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 20px 40px -10px rgba(15,23,42,.08);
    box-sizing: border-box;
    font-variant-numeric: tabular-nums;
  }

  .sh-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 2px solid #cbd5e1; margin-bottom: 20px; }
  .sh-brand { display: flex; align-items: center; gap: 18px; }
  .sh-logo { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #1e3a8a, #0f172a); color: #fff; display: grid; place-items: center; font-size: 32px; font-weight: 900; box-shadow: 0 4px 10px rgba(15,23,42,.2); }
  .sh-brand h1 { margin: 0; font-size: 30px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; line-height: 1.1; }
  .sh-brand p { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; }
  .sh-period { text-align: right; }
  .sh-period span { display: block; font-size: 12.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
  .sh-period strong { display: block; font-size: 26px; font-weight: 900; color: #1e40af; margin-top: 4px; line-height: 1.1; }

  .sh-top { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; margin-bottom: 24px; align-items: start; }
  .sh-left { display: flex; flex-direction: column; gap: 14px; }
  .sh-right { display: flex; flex-direction: column; gap: 14px; }

  /* Premium Pay Table */
  .pay-table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; font-size: 14.5px; box-shadow: 0 4px 6px rgba(0,0,0,.02); }
  .pay-table th { background: #f8fafc; color: #334155; padding: 12px 16px; font-size: 12.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; text-align: left; border-bottom: 1px solid #cbd5e1; }
  .pay-table td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; font-size: 14.5px; }
  .pay-table tbody tr:hover td { background: #f8fafc; }
  .pay-table .amt { text-align: right; font-weight: 700; width: 18%; }
  .pay-table .split { border-left: 1px solid #e2e8f0; }
  .pay-table tfoot td { background: #f1f5f9; font-weight: 800; font-size: 15px; border-top: 1px solid #cbd5e1; padding: 14px 16px; }

  /* Net Pay Highlight */
  .net-pay { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 20px; border-radius: 10px; background: linear-gradient(to right, #f0fdf4, #dcfce7); border: 1px solid #86efac; box-shadow: 0 4px 12px rgba(34,197,94,.1); }
  .net-label { display: block; font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px; }
  .net-words { display: block; margin-top: 4px; font-size: 13.5px; font-weight: 700; color: #15803d; }
  .net-amount { font-size: 32px; font-weight: 900; color: #14532d; letter-spacing: -0.5px; }

  /* Employee Details */
  .emp-card { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 18px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,.02); }
  .emp-card span { display: block; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }
  .emp-card strong { display: block; font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }

  /* Mini Stats */
  .mini-stats { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,.02); }
  .mini-stats div { text-align: center; padding: 12px 6px; border-right: 1px solid #cbd5e1; }
  .mini-stats div:last-child { border-right: none; }
  .mini-stats b { display: block; font-size: 22px; font-weight: 900; color: #1e3a8a; }
  .mini-stats span { display: block; font-size: 11px; font-weight: 800; color: #475569; margin-top: 4px; text-transform: uppercase; }

  /* Chips */
  .chips { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .chip { border-radius: 8px; padding: 10px 4px; text-align: center; border: 1px solid; }
  .chip b { display: block; font-size: 20px; font-weight: 900; line-height: 1; }
  .chip span { display: block; font-size: 11px; font-weight: 800; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .chip-p { background: #f0fdf4; border-color: #86efac; color: #166534; }
  .chip-h { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
  .chip-hd { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
  .chip-a { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
  .chip-wo { background: #f1f5f9; border-color: #cbd5e1; color: #334155; }

  /* ---------- WAGES REGISTER (ULTRA PREMIUM) ---------- */
  .wages { margin-top: 20px; }
  .wages-title { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  .wages-title h2 { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
  .legend { display: flex; gap: 14px; font-size: 13px; font-weight: 700; color: #475569; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .lg { font-style: normal; min-width: 24px; height: 20px; display: inline-grid; place-items: center; border-radius: 4px; font-size: 11px; font-weight: 900; border: 1px solid #94a3b8; color: #0f172a; }
  .lg-p { background: #dcfce7; border-color: #4ade80; } 
  .lg-a { background: #fee2e2; border-color: #f87171; } 
  .lg-h { background: #fef3c7; border-color: #fbbf24; } 
  .lg-hd { background: #dbeafe; border-color: #60a5fa; } 
  .lg-wo { background: #f1f5f9; border-color: #cbd5e1; }

  .wages-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,.02); }
  .wages-table th, .wages-table td { border: 1px solid #cbd5e1; padding: 7px 2px; text-align: center; color: #0f172a; font-weight: 700; font-size: 13px; }
  .wages-table thead th { background: #f8fafc; padding: 8px 0; border-bottom: 2px solid #94a3b8; }
  .wages-table .dn { display: block; font-size: 14.5px; font-weight: 900; color: #0f172a; line-height: 1.1; }
  .wages-table .wd { display: block; font-size: 10px; font-weight: 800; color: #64748b; margin-top: 2px; text-transform: uppercase; }
  
  .wages-table .sun { background: #f1f5f9; }
  .wages-table thead th.sun { background: #e2e8f0; color: #ef4444; }
  .wages-table thead th.sun .dn { color: #dc2626; }
  
  /* Wider Name Column */
  .wages-table .w-name { width: 220px; text-align: left; padding: 6px 10px; font-weight: 800; font-size: 13px; color: #1e293b; background: #f8fafc; }
  .wages-table .w-name.prod { white-space: normal; line-height: 1.3; font-size: 12.5px; }
  
  .wages-table .w-sum { width: 50px; background: #f8fafc; font-weight: 900; font-size: 14px; }
  .wages-table .w-rate { width: 50px; background: #f8fafc; font-weight: 700; color: #475569; }
  .wages-table .w-amt { width: 80px; background: #f8fafc; font-weight: 900; font-size: 14px; color: #1e3a8a; }
  
  .wages-table .strong { font-weight: 900; }
  
  /* Better Attendance Colors */
  .wages-table td.st-p { background: #dcfce7; color: #166534; font-weight: 900; font-size: 14px; }
  .wages-table td.st-a { background: #fee2e2; color: #991b1b; font-weight: 900; font-size: 14px; }
  .wages-table td.st-h { background: #fef3c7; color: #92400e; font-weight: 900; font-size: 14px; }
  .wages-table td.st-hd { background: #dbeafe; color: #1e40af; font-weight: 900; font-size: 12px; }
  .wages-table td.st-wo { background: #f1f5f9; color: #475569; font-weight: 900; font-size: 12px; }
  
  .wages-table tfoot td { background: #f1f5f9; font-weight: 900; padding: 12px 8px; border-top: 2px solid #94a3b8; font-size: 16px; color: #0f172a; }
  .wages-table tfoot td.w-total-label { text-align: right; padding-right: 16px; text-transform: uppercase; letter-spacing: 1px; color: #334155; }

  /* Signatures */
  .sh-sign { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; }
  .sh-sign div { width: 240px; border-top: 2px solid #cbd5e1; padding-top: 8px; text-align: center; font-size: 14px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
  .sh-sign p { margin: 0; font-size: 12px; font-weight: 600; color: #94a3b8; }

  .bulk-wrapper { display: none; }

  /* ===================== PRINT ===================== */
  @page { size: A4 landscape; margin: 5mm; }

  @media print {
    html, body { background: #fff !important; height: auto !important; margin: 0 !important; padding: 0 !important; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .no-print { display: none !important; }
    .hr-wrap { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
    .bulk-wrapper { display: block !important; }

    .slip-root { break-after: page; page-break-after: always; }
    .slip-root:last-child, .slip-root.is-single { break-after: auto; page-break-after: auto; }

    .sheet-scroll { overflow: visible !important; padding: 0 !important; }
    .sheet {
      width: 100% !important; max-width: none !important; margin: 0 !important; padding: 10px 10px 0 10px !important;
      border: none !important; border-radius: 0 !important; box-shadow: none !important;
      break-inside: avoid; page-break-inside: avoid;
    }
    
    /* Make print fonts crisp and readable */
    .wages-table .w-name { width: 160px !important; font-size: 12px !important; padding: 4px 6px !important; }
    .wages-table .w-name.prod { font-size: 11.5px !important; line-height: 1.2 !important; }
    .wages-table th, .wages-table td { font-size: 12.5px !important; padding: 4px 1px !important; }
    .wages-table .dn { font-size: 13.5px !important; }
    .wages-table .wd { font-size: 9px !important; }
    .wages-table .w-sum, .wages-table .w-rate { width: 38px !important; font-size: 12px !important; }
    .wages-table .w-amt { width: 55px !important; font-size: 13px !important; }
    .wages-title h2 { font-size: 16px !important; }
    .sh-brand h1 { font-size: 26px !important; }
  }



`;
