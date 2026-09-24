import sys, re

file_path = r'C:\Users\risha\Documents\radhufullstack\frontend\src\app\tallysync\page.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update initial state
text = text.replace("ledger: '',", "ledger: [],")

# 2. Update URL building
text = text.replace("if (filters.ledger) query += `ledger=${encodeURIComponent(filters.ledger)}&`;", 
"if (filters.ledger && filters.ledger.length > 0) query += `ledger=${encodeURIComponent(filters.ledger.join(','))}&`;")

# 3. Update reset
text = text.replace("setFilters({ party: '', month: '', from_date: '', to_date: '', ledger: '' });",
"setFilters({ party: '', month: '', from_date: '', to_date: '', ledger: [] });")

# 4. Update local filtering
local_filter_old = '''      if (filters.ledger) {
        const lq = filters.ledger.toLowerCase();
        const sledger = (inv.sales_ledger || '').toLowerCase();
        const isummary = (inv.items_summary || '').toLowerCase();
        if (!sledger.includes(lq) && !isummary.includes(lq)) {
          return false;
        }
      }'''
local_filter_new = '''      if (filters.ledger && filters.ledger.length > 0) {
        const sledger = (inv.sales_ledger || '');
        if (!filters.ledger.includes(sledger)) {
          return false;
        }
      }'''
text = text.replace(local_filter_old, local_filter_new)

# 5. Add custom dropdown state
state_hook_old = "const [theme, setTheme] = useState('dark');"
state_hook_new = "const [theme, setTheme] = useState('dark');\n  const [isLedgerDropdownOpen, setIsLedgerDropdownOpen] = useState(false);"
text = text.replace(state_hook_old, state_hook_new)

# 6. Replace UI for ledger
ui_old = '''            {/* Sales Ledger Filter Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                <i className="fas fa-book mr-1"></i> Sales / GST Ledger
              </label>
              <select
                value={filters.ledger || ''}
                onChange={(e) => setFilters({ ...filters, ledger: e.target.value })}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  color: colors.textMain,
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Sales Ledgers</option>
                {data?.available_ledgers?.map((ledger, idx) => (
                  <option key={idx} value={ledger}>
                    {ledger}
                  </option>
                ))}
              </select>
            </div>'''
            
ui_new = '''            {/* Sales Ledger Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                <i className="fas fa-book mr-1"></i> Sales / GST Ledger
              </label>
              <div
                onClick={() => setIsLedgerDropdownOpen(!isLedgerDropdownOpen)}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  color: colors.textMain,
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {filters.ledger && filters.ledger.length > 0 ? `${filters.ledger.length} Selected` : 'All Sales Ledgers'}
                </span>
                <i className={`fas fa-chevron-${isLedgerDropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
              </div>
              
              {isLedgerDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: colors.cardBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  zIndex: 50,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '8px'
                }}>
                  <div 
                    onClick={() => setFilters({ ...filters, ledger: [] })}
                    style={{ padding: '6px 8px', cursor: 'pointer', fontSize: '0.85rem', color: filters.ledger.length === 0 ? '#3b82f6' : colors.textMain, display: 'flex', alignItems: 'center' }}
                  >
                    <div style={{ width: '16px', height: '16px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', marginRight: '8px', background: filters.ledger.length === 0 ? '#3b82f6' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {filters.ledger.length === 0 && <i className="fas fa-check" style={{ color: '#fff', fontSize: '10px' }}></i>}
                    </div>
                    All Sales Ledgers
                  </div>
                  
                  {data?.available_ledgers?.map((ledger, idx) => {
                    const isSelected = filters.ledger.includes(ledger);
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          const newLedgers = isSelected 
                            ? filters.ledger.filter(l => l !== ledger)
                            : [...filters.ledger, ledger];
                          setFilters({ ...filters, ledger: newLedgers });
                        }}
                        style={{ padding: '6px 8px', cursor: 'pointer', fontSize: '0.85rem', color: colors.textMain, display: 'flex', alignItems: 'center' }}
                      >
                        <div style={{ width: '16px', height: '16px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', marginRight: '8px', background: isSelected ? '#3b82f6' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {isSelected && <i className="fas fa-check" style={{ color: '#fff', fontSize: '10px' }}></i>}
                        </div>
                        {ledger}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>'''
text = text.replace(ui_old, ui_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Done!')
