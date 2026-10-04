import sys

with open('C:/Users/risha/Documents/radhufullstack/frontend/src/app/cycletyres/production/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const itemName = ${selectedItem.size}  .trim();',
    'const w_str = selectedItem.weight ?  [kg] : \"\";\n      const itemName = ${selectedItem.size}   .replace(/\\s+/g, \" \").trim();'
)

with open('C:/Users/risha/Documents/radhufullstack/frontend/src/app/cycletyres/production/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
