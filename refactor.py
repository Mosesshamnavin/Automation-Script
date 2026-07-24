import sys
import os

with open("datastudio_automation.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Extract JSON loading logic
json_start = content.find("    # Read saved user ID & email if available")
json_end = content.find("    # Parse ratio float")

if json_start == -1 or json_end == -1:
    print("Error: Could not find JSON loading logic.")
    sys.exit(1)
    
json_logic = content[json_start:json_end]

# 2. Extract Modal logic
modal_start = content.find("            # Step A: Switch to Playbison tab and open modal")
modal_end = content.find("            elif verify_raw and not verify_raw.startswith(\"(function\")")

if modal_start == -1 or modal_end == -1:
    print("Error: Could not find Modal logic.")
    sys.exit(1)

modal_logic = content[modal_start:modal_end]
# Fix indentation of modal logic (it was indented under if True: if ratio_val < 25.0: etc, which is 12 spaces)
# We want it to be 4 spaces.
modal_logic_lines = modal_logic.split('\n')
modal_logic_out = []
for line in modal_logic_lines:
    if line.startswith("            "):
        modal_logic_out.append(line[8:])
    else:
        modal_logic_out.append(line)
modal_logic = "\n".join(modal_logic_out)

# 3. Modify js_extract_macro to get FN, LN, CITY
modal_logic = modal_logic.replace(
    """prompt('RESULT:',acc+'|WALLET:'+wid);""",
    """prompt('RESULT:',acc+'|WALLET:'+wid+'|FN:'+fn+'|LN:'+ln+'|CITY:'+getVal('city'));"""
).replace(
    """prompt('RESULT:',reqStr+'|WALLET:'+wid);""",
    """prompt('RESULT:',reqStr+'|WALLET:'+wid+'|FN:'+fn+'|LN:'+ln+'|CITY:'+getVal('city'));"""
)

# 4. Create Duplicate Checking logic
python_parse_add = """
    # Extract fn, ln, city
    fn = ""
    ln = ""
    city = ""
    if "|FN:" in verify_raw:
        parts = verify_raw.split("|FN:")
        verify_raw = parts[0].strip()
        rest = parts[1]
        if "|LN:" in rest:
            fn, rest = rest.split("|LN:")
            fn = fn.strip()
            if "|CITY:" in rest:
                ln, city = rest.split("|CITY:")
                ln = ln.strip()
                city = city.strip()
                
    if fn and ln:
        print(f"\\n[PLAYBISON] Checking duplicates for {fn} {ln} in Users list...")
        webbrowser.open_new_tab("https://api-acnt.playbison.com/platform-admin/#action:admin.users")
        time.sleep(6.0)
        
        js_check_dup = f\"\"\"(function(){{
            function simClick(el){{if(!el)return;el.dispatchEvent(new MouseEvent('mousedown',{{bubbles:true}}));el.dispatchEvent(new MouseEvent('mouseup',{{bubbles:true}}));el.dispatchEvent(new MouseEvent('click',{{bubbles:true}}));}}
            let fn='{fn}'; let ln='{ln}'; let city='{city}';
            let inputs = Array.from(document.querySelectorAll('input'));
            let fnInput = inputs.find(i=>(i.placeholder||'').toLowerCase().includes('search by firstname'));
            let lnInput = inputs.find(i=>(i.placeholder||'').toLowerCase().includes('search by lastname'));
            
            if(fnInput) {{ let s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; if(s)s.call(fnInput, fn); else fnInput.value=fn; fnInput.dispatchEvent(new Event('input',{{bubbles:true}})); }}
            if(lnInput) {{ let s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; if(s)s.call(lnInput, ln); else lnInput.value=ln; lnInput.dispatchEvent(new Event('input',{{bubbles:true}})); }}
            
            let searchBtns=Array.from(document.querySelectorAll('button, a')).filter(b=>b.textContent.trim().toLowerCase()==='search'&&b.getBoundingClientRect().width>0);
            if(searchBtns.length>0) simClick(searchBtns[0]);
            
            setTimeout(()=>{{
                let trs=Array.from(document.querySelectorAll('tbody tr')).filter(r=>r.children.length>3); 
                if(trs.length>1){{ 
                    let cityInput = inputs.find(i=>(i.placeholder||'').toLowerCase().includes('search by city'));
                    if(cityInput && city){{ 
                        let s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; 
                        if(s)s.call(cityInput, city); else cityInput.value=city; 
                        cityInput.dispatchEvent(new Event('input',{{bubbles:true}})); 
                        let clrBtns=Array.from(document.querySelectorAll('button, a')).filter(b=>b.textContent.trim().toLowerCase()==='search'&&b.getBoundingClientRect().width>0);
                        if(clrBtns.length>0) simClick(clrBtns[0]); 
                        setTimeout(()=>{{
                            let trs2=Array.from(document.querySelectorAll('tbody tr')).filter(r=>r.children.length>3); 
                            if(trs2.length>1){{prompt('DUPLICATE','YES');}}else{{prompt('DUPLICATE','NO');}}
                        }}, 4000); 
                    }} else {{ prompt('DUPLICATE','YES'); }}
                }}else{{ prompt('DUPLICATE','NO'); }} 
            }}, 4000);
        }})();\"\"\"
        
        pyperclip.copy("WAITING_FOR_DUP")
        pyperclip.copy(js_check_dup)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        dup_res = ""
        for _ in range(12):
            time.sleep(1.0)
            pyautogui.hotkey('ctrl', 'c')
            time.sleep(0.3)
            clip_val = pyperclip.paste().strip()
            if clip_val and clip_val != "WAITING_FOR_DUP" and not clip_val.startswith("(function") and not clip_val.startswith("javascript:"):
                dup_res = clip_val
                pyautogui.press('enter')
                break
        else:
            pyautogui.press('enter')
            
        if dup_res == "YES":
            print(f"\\n\\n{'='*60}\\n[WARNING] MULTIPLE ACCOUNTS FOUND FOR {fn} {ln} {city}!!!\\n{'='*60}\\n")
        else:
            print(f"[PLAYBISON] No duplicate accounts found for {fn} {ln}.")
"""

# Insert duplicate check logic inside modal_logic right after wallet_id parsing
wallet_id_logic_end = "verify_raw = parts[0].strip()\n        wallet_id = parts[1].strip()\n"
wallet_idx = modal_logic.find(wallet_id_logic_end)
if wallet_idx != -1:
    wallet_idx += len(wallet_id_logic_end)
    modal_logic = modal_logic[:wallet_idx] + python_parse_add + modal_logic[wallet_idx:]
else:
    print("Could not find wallet_id logic to inject python parse!")
    sys.exit(1)

# Now, we need to remove json_logic and modal_logic from their old places
# Wait, for modal_logic, let's just remove everything from:
# "            # Step A: Switch to Playbison tab"
# to "            else:" (line 255)
# And we also need to remove the json logic.

new_content = content[:json_start] + content[json_end:]

# Now find the old modal logic in new_content
# It was wrapped in:
#         if True: # Proceed regardless of ratio
#             if ratio_val < 25.0:
#                 print(f"\n[DATASTUDIO] W/D ratio is {ratio_val}% (< 25%)!")
#             else:
#                 print(f"\n[DATASTUDIO] W/D ratio is {ratio_val}% (>= 25%). Proceeding to Playbison for manual cancellation check!")
#             print(f"[DATASTUDIO] Returning to Playbison table page and clicking ID for '{player_email or player_id}'...")

# Wait, `player_email` and `player_id` were used in that print statement!
# If we remove json_logic from here, that's fine.
old_modal_start = new_content.find("            # Step A: Switch to Playbison tab")
old_modal_end = new_content.find("            elif verify_raw and not verify_raw.startswith(\"(function\")")

if old_modal_start != -1 and old_modal_end != -1:
    new_content = new_content[:old_modal_start] + "            pass\n" + new_content[old_modal_end:]
    
# Now, find where to insert the new block (json_logic + modal_logic) at the top.
# Insert after "time.sleep(1)"
insert_marker = "        time.sleep(1)\n"
insert_idx = new_content.find(insert_marker)
if insert_idx != -1:
    insert_idx += len(insert_marker)
    final_content = new_content[:insert_idx] + "\n" + json_logic + modal_logic + "\n" + new_content[insert_idx:]
    
    with open("datastudio_automation.py", "w", encoding="utf-8") as f:
        f.write(final_content)
    print("Successfully refactored datastudio_automation.py!")
else:
    print("Could not find insert marker!")
    sys.exit(1)
