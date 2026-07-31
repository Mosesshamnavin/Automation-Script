import ast

with open('datastudio_automation.py', 'r', encoding='utf-8') as f: code = f.read()
m=[n.value.value for n in ast.walk(ast.parse(code)) if isinstance(n, ast.Assign) and len(n.targets)==1 and getattr(n.targets[0],'id','')=='js_trans_macro'][0]

# Replace the broken part
broken_part = 'break;}}}}setTimeout(()=>{let docs=getFrames();'
fixed_part  = 'break;}}}}}setTimeout(()=>{let docs=getFrames();'

if broken_part in m:
    new_macro = m.replace(broken_part, fixed_part)
    code = code.replace(m, new_macro)
    with open('datastudio_automation.py', 'w', encoding='utf-8') as f: f.write(code)
    print('Fixed JS brace successfully!')
else:
    print('Could not find broken part! Let me investigate.')
