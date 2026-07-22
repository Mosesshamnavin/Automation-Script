import pyautogui
import time
import pyperclip
import webbrowser

def main():
    print("============================================================")
    print("DATA STUDIO AUTOMATION")
    print("============================================================")
    import sys
    
    print("\nINSTRUCTIONS:")
    print("1. Your email should already be copied to your clipboard.")
    print("2. Press ENTER to open Data Studio and start the macro.")
    print("3. DO NOT TOUCH YOUR MOUSE OR KEYBOARD until it is finished!")
    
    if "--auto" not in sys.argv:
        input("\nPress ENTER to start...")
    else:
        print("\n[AUTO-MODE] Starting automatically in 2 seconds...")
        time.sleep(1)
    
    url = "https://datastudio.google.com/u/0/reporting/83ab6a98-d02b-4d39-b793-c17189710132/page/ewQiF"
    webbrowser.open_new_tab(url)
    
    print("\nWaiting 9 seconds for Data Studio to fully load...")
    time.sleep(9)
    
    print("Executing Phase 1: Switching to Bison BO and focusing Email...")
    email_to_paste = pyperclip.paste().strip().lower()
    
    # Macro 1: Switch to Bison BO and focus the precise <input> box
    js_macro_1 = "(function(){try{function simClick(el){el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}let els=Array.from(document.querySelectorAll('*'));let bison=els.find(e=>e.children.length===0&&e.textContent.trim()==='Bison BO'&&e.getBoundingClientRect().width>0);if(bison){simClick(bison);setTimeout(()=>{let els2=Array.from(document.querySelectorAll('*'));let emailLabel=els2.find(e=>e.children.length===0&&e.textContent.trim()==='Email (lowercase)'&&e.getBoundingClientRect().width>0);if(emailLabel){let r=emailLabel.getBoundingClientRect();let inputs=Array.from(document.querySelectorAll('input'));let target=null;let minDist=Infinity;for(let inp of inputs){let ir=inp.getBoundingClientRect();if(ir.width>0&&ir.top>=r.bottom){let dx=(ir.left+ir.width/2)-(r.left+r.width/2);let dy=ir.top-r.bottom;let d=dx*dx+dy*dy;if(d<minDist){minDist=d;target=inp;}}}if(target){target.focus();if(target.style)target.style.border='3px solid blue';simClick(target);}else{alert('Could not find the email input box!');}}},1500);}}catch(e){alert('Macro 1 Error: '+e.message);}})();"
    
    pyperclip.copy(js_macro_1)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    time.sleep(2) # Wait for javascript macro to finish clicking and focusing
    
    print("Typing the email using simulated keystrokes...")
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.1)
    pyautogui.press('backspace')
    time.sleep(0.1)
    # RESTORE THE EMAIL TO THE CLIPBOARD!
    pyperclip.copy(email_to_paste)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    time.sleep(1)
    
    print("Executing Phase 2: Opening the Date Picker...")
    # Macro 2: Open Date Picker (using simple point click)
    js_macro_2 = "(function(){try{function simClick(el){el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}let els=Array.from(document.querySelectorAll('*'));let dateLabel=els.find(e=>e.children.length===0&&e.textContent.trim()==='UTC Time'&&e.getBoundingClientRect().width>0);if(dateLabel){let r=dateLabel.getBoundingClientRect();let target=document.elementFromPoint(r.left+10,r.bottom+15);if(target)simClick(target);}}catch(e){alert('Macro 2 Error: '+e.message);}})();"

    pyperclip.copy(js_macro_2)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("Waiting for Date Picker to open...")
    time.sleep(1)
    
    print("Executing Phase 3: Setting the Date Range (2 months ago -> today)...")
    # Macro 3: Navigate calendar back 1 month (to get 2 months ago), select days, click Apply
    js_macro_3 = "(function(){try{function simClick(el){el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(el.style)el.style.border='2px solid blue';}let arrows=Array.from(document.querySelectorAll('*')).filter(e=>{let t=e.textContent.trim().toLowerCase();let a=e.getAttribute('aria-label');return(t==='chevron_left'||t==='keyboard_arrow_left'||t==='<'||a==='Previous month')&&e.getBoundingClientRect().width>0;});arrows.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);if(arrows.length>=1){let leftPrev=arrows[0];simClick(leftPrev);setTimeout(()=>{let day=new Date().getDate().toString();let days=Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0&&e.textContent.trim()===day);days=days.filter(e=>{let r=e.getBoundingClientRect();return r.width>15&&r.width<60&&r.height>15&&r.height<60;});days.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);if(days.length>=2){simClick(days[0]);setTimeout(()=>{simClick(days[days.length-1]);setTimeout(()=>{let applyBtn=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&e.textContent.trim().toLowerCase()==='apply'&&e.getBoundingClientRect().width>0);if(applyBtn)simClick(applyBtn);},500);},500);}else{alert('Could not find the days in the calendar! Expected day: '+day);}},1000);}else{alert('Could not find calendar navigation arrows! Found: '+arrows.length);}}catch(e){alert('Macro 3 Error: '+e.message);}})();"
    
    pyperclip.copy(js_macro_3)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\nWaiting 6 seconds for Data Studio report table to update...")
    time.sleep(6)
    
    print("Executing Phase 4: Checking W/D ratio (volumes)...")
    # Macro 4: Read W/D ratio (volumes) from Data Studio table using robust multi-tier search
    js_macro_4 = "(function(){try{let allEls=Array.from(document.querySelectorAll('*'));let percentEls=allEls.filter(e=>{if(e.children.length>0)return false;let r=e.getBoundingClientRect();if(r.width===0||r.height===0||r.top<150)return false;let txt=e.textContent.trim();return/\\d+\\s*%/.test(txt);});if(percentEls.length>0){percentEls.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);prompt('WD_RATIO:',percentEls[0].textContent.trim());return;}let ratioHeader=allEls.find(e=>{let t=e.textContent.trim().toLowerCase();return(t.includes('w/d ratio')||t.includes('ratio (volumes)')||t.includes('ratio'))&&e.children.length===0&&e.getBoundingClientRect().width>0;});if(ratioHeader){let rHeader=ratioHeader.getBoundingClientRect();let headerMidX=rHeader.left+rHeader.width/2;let candidateCells=allEls.filter(e=>{if(e.children.length>0)return false;let r=e.getBoundingClientRect();if(r.width<=0||r.top<=rHeader.bottom)return false;return Math.abs((r.left+r.width/2)-headerMidX)<100;});candidateCells.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);if(candidateCells.length>0){prompt('WD_RATIO:',candidateCells[0].textContent.trim());return;}}prompt('WD_RATIO:','NO_DATA');}catch(e){prompt('WD_RATIO:','ERROR: '+e.message);}})();"

    pyperclip.copy(js_macro_4)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    time.sleep(1.5)
    
    # Grab prompt response via Ctrl+C
    pyautogui.hotkey('ctrl', 'c')
    time.sleep(0.5)
    ratio_raw = pyperclip.paste().strip()
    pyautogui.press('enter') # Close prompt
    
    print(f"\n[DATASTUDIO] Raw W/D ratio text: '{ratio_raw}'")
    
    # Read saved user ID & email if available
    import json, os, re
    player_id = ""
    player_email = ""
    if os.path.exists("last_user.json"):
        try:
            with open("last_user.json", "r") as f:
                data = json.load(f)
                player_id = data.get("id", "")
                player_email = data.get("email", "")
        except Exception:
            pass
            
    # Parse ratio float
    ratio_val = None
    if ratio_raw and "HEADER_NOT_FOUND" not in ratio_raw and "NO_DATA" not in ratio_raw:
        cleaned = ratio_raw.replace('%', '').replace(',', '.').strip()
        match = re.search(r'[-+]?\d*\.?\d+', cleaned)
        if match:
            try:
                ratio_val = float(match.group())
            except ValueError:
                pass

    if ratio_val is not None:
        print(f"[DATASTUDIO] Parsed W/D ratio: {ratio_val}%")
        if ratio_val < 25.0:
            print(f"\n[DATASTUDIO] ⚠️ W/D ratio is {ratio_val}% (< 25%)!")
            print(f"[DATASTUDIO] Returning to Playbison table page and clicking ID for '{player_email or player_id}'...")
            
            # Step A: Switch to Playbison tab and open modal via hash navigation + DOM click
            pyautogui.hotkey('ctrl', '1')
            time.sleep(1)
            
            js_open_modal = f"(function(){{let id='{player_id}';let email='{player_email}';window.location.hash='#action:admin.payment.details:'+id;let els=Array.from(document.querySelectorAll('*'));let target=els.find(e=>e.children.length===0&&(e.textContent.trim()===id||(email&&e.textContent.trim().toLowerCase()===email.toLowerCase())));if(target){{let clickEl=target.closest('a')||target;clickEl.click();clickEl.dispatchEvent(new MouseEvent('click',{{bubbles:true}}));}}}})();"
            
            pyperclip.copy(js_open_modal)
            pyautogui.hotkey('ctrl', 'l')
            time.sleep(0.3)
            pyautogui.write('javascript:')
            time.sleep(0.2)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.3)
            pyautogui.press('enter')
            
            print("[PLAYBISON] Waiting 2 seconds for Payment Details modal to open...")
            time.sleep(2.0)
            
            # Step B: Extract maskedAccount + wallet_id from open modal
            # Uses getVal('wallet_id') - same proven logic as first/last name extraction.
            # wallet_id is returned via prompt so Python can open it (window.open blocked in bookmarklets).
            # Handles Operator conditions: COINSPAID (skip), PAYSAFECARD/SKRILL (skip name check), BANK WITHDRAWAL PIQ (default check)
            js_extract_macro = "(function(){try{function getFrames(){let docs=[document];let frames=document.querySelectorAll('iframe, frame');for(let f of frames){try{docs.push(f.contentDocument||f.contentWindow.document);}catch(e){}}return docs;}function normStr(s){if(!s)return'';return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/ł/g,'l').replace(/Ł/g,'L').toLowerCase().trim();}for(let doc of getFrames()){if(!doc||!doc.body)continue;let all=Array.from(doc.querySelectorAll('*'));function getVal(lbl){let l=all.find(e=>e.children.length===0&&e.textContent.trim().toLowerCase()===lbl.toLowerCase());if(!l)return'';if(l.tagName==='TD'&&l.nextElementSibling)return l.nextElementSibling.textContent.trim();let tr=l.closest('tr');if(tr&&tr.children.length>=2)return tr.children[1].textContent.trim();if(l.nextElementSibling)return l.nextElementSibling.textContent.trim();return'';}let op=getVal('Operator').toUpperCase();let fn=getVal('first name');let ln=getVal('last name');let wid=getVal('wallet_id');if(op.includes('COINSPAID')){prompt('RESULT:','COINSPAID_SKIP|WALLET:'+wid);return;}let reqHeader=all.find(e=>e.children.length===0&&e.textContent.trim().toLowerCase()==='request data');let reqStr='';if(reqHeader){let tr=reqHeader.closest('tr');if(tr&&tr.nextElementSibling){reqStr=tr.nextElementSibling.textContent.trim();}else if(reqHeader.closest('table')){let tbl=reqHeader.closest('table');let rows=Array.from(tbl.querySelectorAll('tbody tr, tr')).filter(r=>r!==reqHeader.closest('tr'));if(rows.length>0)reqStr=rows[0].textContent.trim();}}if(!reqStr){let JSONEl=all.find(e=>e.children.length===0&&(e.textContent.includes('maskedAccount')||e.textContent.includes('userId')||e.textContent.includes('accountHolder')));if(JSONEl)reqStr=JSONEl.textContent.trim();}if(reqStr){let match=reqStr.match(/[\"']?maskedAccount[\"']?\\s*[:=]\\s*[\"']([^\"']+)[\"']/i);if(!match)match=reqStr.match(/[\"']?maskedAccount[\"']?\\s*[:=]\\s*[\"']?([^,}\r\n]+)/i);let acc=match?match[1].replace(/[\"']/g,'').trim():'';if(op.includes('PAYSAFECARD')||op.includes('SKRILL')){if(acc){prompt('RESULT:',acc+'|WALLET:'+wid);return;}else{prompt('MISMATCH:','NAMEFAIL:maskedAccount not found|WALLET:'+wid);return;}}else{let fnNorm=normStr(fn);let lnNorm=normStr(ln);let reqNorm=normStr(reqStr);let fnMatch=!fnNorm||reqNorm.includes(fnNorm);let lnMatch=!lnNorm||reqNorm.includes(lnNorm);if(fnMatch&&lnMatch){if(acc){prompt('RESULT:',acc+'|WALLET:'+wid);return;}else{prompt('RESULT:',reqStr+'|WALLET:'+wid);return;}}else{prompt('MISMATCH:','NAMEFAIL:'+fn+' '+ln+'|WALLET:'+wid);return;}}}}prompt('ERROR:','NOTFOUND|WALLET:');}catch(e){prompt('ERROR:','NOTFOUND|WALLET:');}})();"
            
            pyperclip.copy("WAITING_FOR_PROMPT")
            pyperclip.copy(js_extract_macro)
            pyautogui.hotkey('ctrl', 'l')
            time.sleep(0.3)
            pyautogui.write('javascript:')
            time.sleep(0.2)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.3)
            pyautogui.press('enter')
            
            verify_raw = ""
            for _ in range(6):
                time.sleep(0.8)
                pyautogui.hotkey('ctrl', 'c')
                time.sleep(0.3)
                clip_val = pyperclip.paste().strip()
                if clip_val and clip_val != "WAITING_FOR_PROMPT" and not clip_val.startswith("(function") and not clip_val.startswith("javascript:"):
                    verify_raw = clip_val
                    pyautogui.press('enter')
                    break
            else:
                pyautogui.press('enter')
            
            # Chrome prompt() Ctrl+C copies the INPUT FIELD value only, not the label.
            # Format: "maskedAccount_value|WALLET:hexId"  or  "NAMEFAIL:first last|WALLET:hexId"
            
            # Extract wallet_id from response
            wallet_id = ""
            if "|WALLET:" in verify_raw:
                parts = verify_raw.split("|WALLET:")
                verify_raw = parts[0].strip()
                wallet_id = parts[1].strip()
            
            # Detect name mismatch errors
            is_error = verify_raw.startswith("NAMEFAIL:") or "not found in request data" in verify_raw.lower() or verify_raw.startswith("NOTFOUND")
            
            if verify_raw == "COINSPAID_SKIP":
                print(f"\n[PLAYBISON] ℹ️ Operator is COINSPAID. No copy required.")
            elif is_error:
                print(f"\n[PLAYBISON] ⚠️ Name mismatch or error: {verify_raw}")
            elif verify_raw and not verify_raw.startswith("(function") and not verify_raw.startswith("WAITING"):
                pyperclip.copy(verify_raw)
                print(f"\n[PLAYBISON] ✅ Check passed!")
                print(f"[PLAYBISON] 📋 Copied maskedAccount value to clipboard: '{verify_raw}'")
            else:
                print(f"\n[PLAYBISON] ⚠️ Could not extract data from modal. Raw: {verify_raw}")
            
            # Open wallet_id in new tab regardless of match result
            if wallet_id:
                wallet_url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{wallet_id}"
                print(f"[PLAYBISON] 🚀 Opening wallet_id in new tab: {wallet_url}")
                webbrowser.open_new_tab(wallet_url)
                
                print("[PLAYBISON] Waiting 7 seconds for wallet page to load to open notes...")
                time.sleep(5.0)
                
                # We must manually type 'javascript:' because Chrome strips it when pasted
                # We also use dispatchEvent because some single-page apps ignore a basic .click()
                # To avoid clicking the global "Notes" menu, we specifically look for the "notes" tab 
                # that comes right after the "edit personal data" tab in the DOM.
                js_notes_macro = "(function(){let links=Array.from(document.querySelectorAll('a'));let notes=links.find(e=>{let txt=e.textContent.toLowerCase().trim();if(!txt.startsWith('notes'))return false;let idx=links.indexOf(e);let start=Math.max(0,idx-5);for(let i=start;i<idx;i++){if(links[i].textContent.toLowerCase().trim().startsWith('edit personal data'))return true;}return false;});if(notes){notes.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));notes.click();}})();"
                pyperclip.copy(js_notes_macro)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                print("[PLAYBISON] 📝 Opened Notes tab.")
                
                print("[PLAYBISON] Waiting 6 seconds for notes data to load...")
                time.sleep(6.0)
                
                js_trans_macro = "(function(){let tbodies=Array.from(document.querySelectorAll('tbody'));for(let tbody of tbodies){let tr=tbody.querySelector('tr');if(tr&&tr.children.length>=4){let isTarget=Array.from(tr.children).some(td=>{let txt=td.textContent.toLowerCase().trim();return txt==='normal'||txt==='payment';});if(isTarget){let links=Array.from(document.querySelectorAll('a'));let tTab=links.find(e=>{if(e.textContent.toLowerCase().trim()!=='transactions')return false;let idx=links.indexOf(e);let start=Math.max(0,idx-5);for(let i=start;i<idx;i++){if(links[i].textContent.toLowerCase().trim()==='freespins')return true;}return false;});if(tTab){tTab.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));tTab.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window}));tTab.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));if(typeof tTab.click==='function')tTab.click();setTimeout(()=>{let all=Array.from(document.querySelectorAll('*'));let setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;let wLabel=all.find(e=>e.children.length===0&&e.textContent.toLowerCase().trim().includes('wallet id'));if(wLabel){let idx=all.indexOf(wLabel);for(let i=idx;i<idx+10&&i<all.length;i++){if(all[i].tagName==='INPUT'){if(setter)setter.call(all[i],'');else all[i].value='';all[i].dispatchEvent(new Event('input',{bubbles:true}));all[i].dispatchEvent(new Event('change',{bubbles:true}));break;}}}let selects=Array.from(document.querySelectorAll('select'));for(let select of selects){let opt=Array.from(select.options).find(o=>o.textContent.toLowerCase().trim().includes('redeem the bonuses'));if(opt){select.value=opt.value;select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));break;}}let dLabel=all.find(e=>e.children.length===0&&e.textContent.toLowerCase().trim().includes('date from'));if(dLabel){let idx=all.indexOf(dLabel);for(let i=idx;i<idx+10&&i<all.length;i++){if(all[i].tagName==='INPUT'){let d=new Date();d.setMonth(d.getMonth()-1);let yy=d.getFullYear();let mm=String(d.getMonth()+1).padStart(2,'0');let dd=String(d.getDate()).padStart(2,'0');let val=`${yy}-${mm}-${dd} 00:00`;if(setter)setter.call(all[i],val);else all[i].value=val;all[i].dispatchEvent(new Event('input',{bubbles:true}));all[i].dispatchEvent(new Event('change',{bubbles:true}));all[i].dispatchEvent(new Event('blur',{bubbles:true}));break;}}}setTimeout(()=>{let candidates=Array.from(document.querySelectorAll('button, input[type=\"button\"], input[type=\"submit\"], a, .btn'));let searchBtn=candidates.find(c=>{let txt=(c.textContent||c.value||'').toLowerCase().trim();return txt==='search';});if(searchBtn){searchBtn.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));searchBtn.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window}));searchBtn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));if(typeof searchBtn.click==='function')searchBtn.click();}setTimeout(()=>{let tables=Array.from(document.querySelectorAll('table'));let resTable=tables.find(t=>Array.from(t.querySelectorAll('th')).some(th=>th.textContent.toLowerCase().trim()==='note'));if(resTable){let firstRow=resTable.querySelector('thead tr');let ths=Array.from(firstRow.children);let noteColIdx=0;for(let th of ths){if(th.textContent.toLowerCase().trim()==='note')break;let span=parseInt(th.getAttribute('colspan')||'1',10);noteColIdx+=span;}let dataRows=Array.from(resTable.querySelectorAll('tbody tr')).filter(r=>r.children.length>=10);let allHaveAuto=dataRows.length>0&&dataRows.every(r=>{if(!r.children[noteColIdx])return false;return r.children[noteColIdx].textContent.toLowerCase().includes('automatic');});if(!allHaveAuto){for(let select of selects){let opt=Array.from(select.options).find(o=>o.textContent.toLowerCase().trim().includes('redeem the bonuses'));if(opt){select.selectedIndex=0;select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));break;}}let allElem=Array.from(document.querySelectorAll('*'));let amtLabel=allElem.find(e=>e.children.length===0&&e.textContent.toLowerCase().trim().includes('amount range in (to)'));if(amtLabel){let idx=allElem.indexOf(amtLabel);for(let i=idx;i<idx+10&&i<allElem.length;i++){if(allElem[i].tagName==='INPUT'){if(setter)setter.call(allElem[i],'-8.01');else allElem[i].value='-8.01';allElem[i].dispatchEvent(new Event('input',{bubbles:true}));allElem[i].dispatchEvent(new Event('change',{bubbles:true}));allElem[i].dispatchEvent(new Event('blur',{bubbles:true}));break;}}}setTimeout(()=>{let sBtn=candidates.find(c=>{let txt=(c.textContent||c.value||'').toLowerCase().trim();return txt==='search';});if(sBtn){sBtn.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));sBtn.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window}));sBtn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));if(typeof sBtn.click==='function')sBtn.click();}},500);}}},4500);},600);},3500);}break;}}}})();"
                pyperclip.copy(js_trans_macro)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                print("[PLAYBISON] 🔍 Checked notes & transactions with 'Redeem the bonuses'. Validated note column for 'automatic'.")
            else:
                print("[PLAYBISON] ⚠️ Could not extract wallet_id from modal.")
                print(f"\n[PLAYBISON] Result: {verify_raw}")
        else:
            print(f"[DATASTUDIO] W/D ratio is {ratio_val}% (>= 25%). No action needed.")
    else:
        print("[DATASTUDIO] Could not determine W/D ratio automatically.")
        
    print("\n✅ Script complete! Workflow finished.")

if __name__ == "__main__":
    main()
