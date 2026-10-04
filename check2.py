import re

files = [
    'C:/Users/risha/Documents/radhufullstack/frontend/src/app/cycletyres/production/page.js',
    'C:/Users/risha/Documents/radhufullstack/frontend/src/app/hrms/production/page.js'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        c = f.read()
    
    # Fix w_str
    c = re.sub(r'const w_str = .*?;', 'const w_str = (typeof t !== "undefined" ? t.weight : (typeof selectedItem !== "undefined" ? selectedItem.weight : null)) ?  [kg] : "";', c)
    
    # Fix itemName
    c = re.sub(r'const (itemName|name) = .*?\.replace\(/\\\\s\+/g, ["\'] ["\']\)\.trim\(\);', 'const \\1 = ${typeof t !== "undefined" ? t.size : selectedItem.size}   .replace(/\\s+/g, " ").trim();', c)
    
    # Actually that regex might be too messy. Let's just restore the entire script blocks using literal string in python.
