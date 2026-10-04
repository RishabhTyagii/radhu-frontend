import os

f1 = 'C:/Users/risha/Documents/radhufullstack/frontend/src/app/cycletyres/production/page.js'
with open(f1, 'r', encoding='utf-8') as f: c1 = f.read()

import re
c1 = re.sub(
    r'const w_str = selectedItem\.weight \? .*? \: \"\"\;',
    'const w_str = selectedItem.weight ?  [kg] : "";',
    c1, flags=re.DOTALL
)
c1 = re.sub(
    r'const itemName = \$\{selectedItem\.size\}   \.replace\(/\\s\+/g, \" \"\)\.trim\(\)\;',
    'const itemName = ${selectedItem.size}   .replace(/\\s+/g, " ").trim();',
    c1, flags=re.DOTALL
)
c1 = re.sub(
    r'apiGet\(/hrms/production/last-rate/\?employee_id=&product_name=\)',
    'apiGet(/hrms/production/last-rate/?employee_id=&product_name=)',
    c1, flags=re.DOTALL
)

with open(f1, 'w', encoding='utf-8') as f: f.write(c1)

f2 = 'C:/Users/risha/Documents/radhufullstack/frontend/src/app/hrms/production/page.js'
with open(f2, 'r', encoding='utf-8') as f: c2 = f.read()

c2 = re.sub(
    r"const w_str = t\.weight \? .*? \: \'\';",
    "const w_str = t.weight ?  [kg] : '';",
    c2, flags=re.DOTALL
)
c2 = re.sub(
    r"const name = \$\{t\.size\}   \.replace\(/\\s\+/g, \' \'\)\.trim\(\)\;",
    "const name = ${t.size}   .replace(/\\s+/g, ' ').trim();",
    c2, flags=re.DOTALL
)

with open(f2, 'w', encoding='utf-8') as f: f.write(c2)
