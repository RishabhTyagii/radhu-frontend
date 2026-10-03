import sys
import re

with open('C:/Users/risha/Documents/radhufullstack/frontend/src/app/hrms/salary/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div className="chip chip-hd"><b>{att.holiday_days || 0}</b><span>Holiday</span></div>',
    '<div className="chip chip-hd"><b>{att.holiday_days || 0}</b><span>Holiday</span></div>\n                {att.cl_days > 0 && <div className="chip chip-cl"><b>{att.cl_days}</b><span>CL</span></div>}\n                {att.el_days > 0 && <div className="chip chip-el"><b>{att.el_days}</b><span>EL</span></div>}\n                {att.lop_days > 0 && <div className="chip chip-a"><b>{att.lop_days}</b><span>LOP</span></div>}'
)

content = content.replace(
    '.chip-wo { background: #f1f5f9; border-color: #cbd5e1; color: #334155; }',
    '.chip-wo { background: #f1f5f9; border-color: #cbd5e1; color: #334155; }\n  .chip-cl, .chip-el { background: #f3e8ff; border-color: #d8b4fe; color: #6b21a8; }'
)

with open('C:/Users/risha/Documents/radhufullstack/frontend/src/app/hrms/salary/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
