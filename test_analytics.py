import time
import pyperclip
import pyautogui
import webbrowser
import sys
import os
import pyautogui

pyautogui.FAILSAFE = False

from macro_loader import load_macro

def main():
    import json
    player_email = "Werciagry@gmail.com"
    wallet_id = "bfadaae74107ad283d2f7f6c"
    
    if os.path.exists("last_user.json"):
        try:
            with open("last_user.json", "r") as f:
                data = json.load(f)
                player_email = data.get("email", player_email)
                wallet_id = data.get("wallet_id", data.get("id", wallet_id))
        except Exception:
            pass

    print(f"Testing Analytics Flow for {player_email} (wallet: {wallet_id})...")
    wallet_url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{wallet_id}"
    
    print(f"Opening wallet tab: {wallet_url}")
    webbrowser.open_new_tab(wallet_url)
    
    print("\n--- IMPORTANT ---")
    print("1. Please wait for the wallet page to fully load in Chrome.")
    print("2. Make sure Chrome is your ACTIVE window.")
    print("3. Click back here, press ENTER, and then IMMEDIATELY click back into Chrome!")
    input("Press ENTER when ready...")
    
    print("Switching to Chrome and executing macro in 3 seconds...")
    time.sleep(3.0)
    
    # Step 1: Open Notes Tab
    js_notes_macro = load_macro("ds_open_notes.js")
    pyperclip.copy(js_notes_macro)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.3)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.3)
    pyautogui.press('enter')
    print("Opened Notes tab.")
    
    print("Waiting 5 seconds for notes data to load...")
    time.sleep(5.0)

    # Step 1.5: Check Notes for "req" keyword
    print("Checking Notes tab data (waiting for table to load)...")
    js_check_notes = load_macro("ds_check_notes.js")
    
    notes_have_req = False
    for i in range(15):
        pyperclip.copy("WAITING_FOR_NOTES")
        pyperclip.copy(js_check_notes)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        time.sleep(1.0) # Wait a bit before checking clipboard
        
        clip_val = pyperclip.paste().strip()
        if clip_val.startswith("REQ_FOUND:"):
            res_part = clip_val.replace("REQ_FOUND:", "")
            if "|" in res_part:
                parts = res_part.split("|")
                note_txt = parts[1].replace("TEXT:", "")
                if note_txt != "NOTES_NOT_FOUND":
                    if parts[0] == "YES":
                        notes_have_req = True
                    print(f"Checked top note: '{note_txt}' (Contains 'req': {notes_have_req})")
                    break
        time.sleep(0.5)

    if notes_have_req:
        print("Keyword 'req' detected in notes! Opening Documents tab...")
        js_docs_macro = load_macro("ds_open_documents.js")
        pyperclip.copy(js_docs_macro)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        print("Waiting 7 seconds on Documents tab for inspection...")
        time.sleep(7.0)
        
        print("Checking for 'In progress' documents...")
        js_open_doc = load_macro("ds_open_in_progress_doc.js")
        pyperclip.copy(js_open_doc)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        time.sleep(1.5) # Give it time to click and copy result
        clip_val = pyperclip.paste().strip()
        if clip_val == "DOC_OPENED:YES":
            print("\n" + "="*60)
            print("⚠️ AN 'IN PROGRESS' DOCUMENT IS OPEN!")
            print(f"Note context to verify: '{note_txt}'")
            print("="*60 + "\n")
            
            # Use sound alert to notify user
            try:
                import winsound
                winsound.Beep(1000, 500)
            except:
                pass
                
            print("Taking screenshot of the document in 2 seconds...")
            time.sleep(2.0)
            try:
                import base64
                import io
                import requests
                
                img = pyautogui.screenshot()
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=70)
                b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                
                print("Verifying document via Mistral AI...")
                r = requests.post('https://api.mistral.ai/v1/chat/completions', 
                    headers={'Authorization': 'Bearer wMV2n0FvKzyQYqiiBlGXHVlNKpiQCWJD', 'Content-Type': 'application/json'},
                    json={
                        'model': 'pixtral-12b-2409',
                        'messages': [
                            {
                                'role': 'user', 
                                'content': [
                                    {'type': 'text', 'text': f"This is a screenshot of a user's uploaded document. Does this document contain the exact credit card number or details mentioned in this note? Note: '{note_txt}'. Reply only with YES or NO, followed by a very brief explanation."},
                                    {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
                                ]
                            }
                        ]
                    }
                )
                resp = r.json()
                ai_msg = resp['choices'][0]['message']['content']
                print(f"\n[MISTRAL AI VERIFICATION]:\n{ai_msg}\n")
                
                if ai_msg.strip().upper().startswith("NO"):
                    print("Verification FAILED! Please check manually.")
                    input("Press ENTER when you are ready to continue...")
                else:
                    print("Verification PASSED! Automatically continuing in 3 seconds...")
                    time.sleep(3.0)
            except Exception as e:
                print(f"Mistral API failed: {e}")
                input("Press ENTER when you have verified the details and are ready to continue...")
            
            print("Resuming automation flow...")
            
            # Switch focus back to Chrome if they clicked away to the terminal
            print("Switching back to Chrome in 3 seconds...")
            time.sleep(3.0)

    # Step 2: Transactions & Stack Check macro
    js_trans_macro = load_macro("ds_check_transactions.js")
    pyperclip.copy("WAITING_FOR_TRANS")
    pyperclip.copy(js_trans_macro)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.3)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.3)
    pyautogui.press('enter')
    print("Executing Transactions & Stack Check Macro...")
    
    trans_result = ""
    for _ in range(35):
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(1.0)
        clip_val = pyperclip.paste().strip()
        if clip_val and clip_val.startswith("TRANS_RESULT:"):
            trans_result = clip_val.replace("TRANS_RESULT:", "").strip()
            if trans_result in ["NO_STACK", "AUTOMATIC", "NO_TRANSACTIONS_TAB", "NO_DATE_INPUT"]:
                print(f"No stack found ({trans_result}).")
            elif trans_result.startswith("EXCEEDS_5_PAGES"):
                dates_str = trans_result.split("|")[1] if "|" in trans_result else ""
                print(f"\n{'='*60}\n⚠️ OVER 5 PAGES OF TRANSACTIONS FOUND!\nFound Stack Dates on Page 1: {dates_str}\n{'='*60}\n")
                
                analytics_url = "https://playbison-analytics.web.app/reports/violating-transactions"
                print(f"Opening Analytics Platform: {analytics_url}")
                webbrowser.open_new_tab(analytics_url)
                print("Waiting 8 seconds for Analytics to load...")
                time.sleep(8.0)
                
                print(f"Pasting Wallet ID: {wallet_id} and clicking Search...")
                js_analytics = f"""(function(){{
                    let inputs = Array.from(document.querySelectorAll('input'));
                    let inp = inputs.find(i => (i.placeholder||'').toLowerCase().includes('walletid') || (i.name||'').toLowerCase().includes('wallet'));
                    if (!inp) inp = inputs[0];
                    if (inp) {{
                        let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        if (s) s.call(inp, '{wallet_id}'); else inp.value = '{wallet_id}';
                        inp.dispatchEvent(new Event('input', {{bubbles: true}}));
                        
                        setTimeout(() => {{
                          let btns = Array.from(document.querySelectorAll('button'));
                          let searchBtn = btns.find(b => (b.textContent||'').toLowerCase().includes('search'));
                          if (searchBtn) searchBtn.click();
                        }}, 500);
                    }}
                }})();"""
                js_analytics_min = js_analytics.replace('\n', ' ').replace('\r', '')
                pyperclip.copy(js_analytics_min)
                time.sleep(0.5)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                
                print("Waiting 10 seconds for Analytics data to load...")
                time.sleep(10.0)
                
                print("Injecting macro to scrape Analytics dates...")
                js_scrape = load_macro("ds_analytics_scrape.js")
                pyperclip.copy("WAITING_FOR_ANALYTICS")
                pyperclip.copy(js_scrape)
                time.sleep(0.5)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                
                analytics_dates_str = ""
                for _ in range(15):
                    pyautogui.hotkey('ctrl', 'c')
                    time.sleep(1.0)
                    clip_val = pyperclip.paste().strip()
                    if clip_val and clip_val.startswith("ANALYTICS_DATES:"):
                        analytics_dates_str = clip_val.replace("ANALYTICS_DATES:", "").strip()
                        break
                
                if not analytics_dates_str or analytics_dates_str == "NO_DATES_FOUND" or analytics_dates_str.startswith("ERROR"):
                    print(f"Failed to extract dates from Analytics: {analytics_dates_str}")
                    sys.exit(1)
                
                print("Successfully extracted dates from Analytics.")
                dates_list = analytics_dates_str.split(',')
                
                import datetime
                
                # Parse the original stack dates from the Playbison transactions tab
                # (These are the dates from rows with empty 'note' field)
                stack_dates = [d.strip() for d in dates_str.split(',') if d.strip()]
                stack_days = set()
                for sd in stack_dates:
                    # Handle both formats: 2026-08-02T08:04:43Z and 2026-08-02T08:04:43
                    sd_clean = sd.replace('Z', '').strip()
                    try:
                        dt = datetime.datetime.strptime(sd_clean, "%Y-%m-%dT%H:%M:%S")
                        stack_days.add(dt.date())
                    except Exception:
                        pass
                
                print(f"Stack dates from Playbison: {stack_dates}")
                print(f"Stack days to match in Analytics: {stack_days}")
                
                # Parse ALL Analytics dates first
                all_analytics_dates = []
                for ds in dates_list:
                    try:
                        dt = datetime.datetime.strptime(ds.strip(), "%Y-%m-%dT%H:%M:%S")
                        all_analytics_dates.append(dt)
                    except Exception:
                        pass
                
                if stack_days:
                    # Filter Analytics dates to only those matching the stack days from Playbison
                    parsed_dates = [dt for dt in all_analytics_dates if dt.date() in stack_days]
                    print(f"Filtered to {len(parsed_dates)} Analytics dates matching stack days: {stack_days}")
                else:
                    # JS couldn't find empty-note rows — fallback:
                    # Use only the MOST RECENT day from Analytics (that's what we're investigating)
                    if all_analytics_dates:
                        most_recent_day = max(dt.date() for dt in all_analytics_dates)
                        parsed_dates = [dt for dt in all_analytics_dates if dt.date() == most_recent_day]
                        print(f"Stack days empty — using most recent Analytics day: {most_recent_day} ({len(parsed_dates)} dates)")
                    else:
                        parsed_dates = []
                
                if not parsed_dates:
                    print("Could not parse any valid dates.")
                    sys.exit(1)
                    
                min_date = min(parsed_dates)
                max_date = max(parsed_dates)
                
                # Apply 1 minute adjustment (subtract 1 min from start, add 1 min to end)
                adjusted_start = min_date - datetime.timedelta(minutes=1)
                adjusted_end = max_date + datetime.timedelta(minutes=1)
                
                # Format for Playbison Date Picker (YYYY-MM-DD HH:MM)
                start_str = adjusted_start.strftime("%Y-%m-%d %H:%M")
                end_str = adjusted_end.strftime("%Y-%m-%d %H:%M")
                
                print(f"\n{'='*60}\n[ANALYTICS] Matched {len(parsed_dates)} dates for stack days {stack_days}:\nDate From: {start_str}\nDate To:   {end_str}\n{'='*60}\n")
                
                print("Closing Analytics tab to return to Playbison tab...")
                pyautogui.hotkey('ctrl', 'w')   # close Analytics tab → Chrome auto-focuses prev tab
                time.sleep(2.0)
                
                print("Injecting macro to set Playbison Date filters...")
                js_set_dates = load_macro("ds_set_transaction_dates.js", DATE_FROM=start_str, DATE_TO=end_str)
                pyperclip.copy("WAITING_FOR_SET_DATES")
                pyperclip.copy(js_set_dates)
                time.sleep(0.5)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                
                for _ in range(5):
                    pyautogui.hotkey('ctrl', 'c')
                    time.sleep(1.0)
                    clip_val = pyperclip.paste().strip()
                    if clip_val and clip_val.startswith("SET_DATES:"):
                        print(f"Date Set Result: {clip_val}")
                        break
                
                # The ds_set_transaction_dates.js macro clicks Search AND runs computeAllPagesStack
                # internally. Just wait for the final TRANS_RESULT to appear in clipboard.
                print("\nWaiting for stack check result (dates set, search clicked, checking all pages)...")
                stack_result = ""
                for i in range(60):  # wait up to 60 seconds
                    pyautogui.hotkey('ctrl', 'c')
                    time.sleep(1.0)
                    clip_val = pyperclip.paste().strip()
                    
                    if i % 10 == 0 or clip_val.startswith("SET_DATES:") or clip_val.startswith("TRANS_RESULT:"):
                        print(f"   -> [Clipboard poll {i}/60]: {clip_val[:100]}")
                        
                    if clip_val and clip_val.startswith("TRANS_RESULT:"):
                        stack_result = clip_val.replace("TRANS_RESULT:", "").strip()
                        break
                
                if stack_result in ("NO_STACK", ""):
                    print(f"\n{'='*60}\n✅ NO STACK FOUND in filtered date range.\n{'='*60}\n")
                elif stack_result:
                    print(f"\n{'='*60}\n⚠️ STACK FOUND:\n{stack_result}\n{'='*60}\n")
                else:
                    print("Timed out waiting for stack check result.")
                
                sys.exit(0)
            else:
                print(f"\n{'='*60}\n⚠️ STACK TRANSACTIONS FOUND:\n{trans_result}\n{'='*60}\n")
                
                stack_date = ""
                if "|STACK_DATE:" in trans_result:
                    parts = trans_result.split("|STACK_DATE:")
                    trans_result = parts[0].strip()
                    stack_date = parts[1].strip()

                if stack_date:
                    stack_date_ymd = stack_date.split("T")[0] if "T" in stack_date else stack_date.split(" ")[0]
                    print(f"\n[PLAYBISON] Stack Date: {stack_date_ymd}. Navigating to Bonuses tab to extract Bonus Name...")
                    
                    wallet_base_url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{wallet_id}"
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.4)
                    pyperclip.copy(wallet_base_url)
                    pyautogui.hotkey('ctrl', 'a')
                    time.sleep(0.1)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.2)
                    pyautogui.press('enter')
                    print("[PLAYBISON] Waiting 5 seconds for wallet page to reload...")
                    time.sleep(5.0)

                    js_open_bonuses = load_macro("ds_open_bonuses.js")
                    pyperclip.copy(js_open_bonuses)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    print("[PLAYBISON] Bonuses tab clicked. Waiting 5 seconds for data to load...")
                    time.sleep(5.0)

                    js_bonus = load_macro("ds_extract_bonus.js")
                    js_bonus = js_bonus.replace("###STACK_DATE###", stack_date)

                    pyperclip.copy("__WAITING_BONUS__")
                    pyperclip.copy(js_bonus)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    time.sleep(0.2)
                    pyautogui.press('tab') # Move focus out of the address bar
                    
                    print("[PLAYBISON] Extracting Bonus Name...")
                    bonus_name = ""
                    for _ in range(90):
                        pyautogui.hotkey('ctrl', 'c') # Copy from the hidden textarea selected by JS
                        time.sleep(1.0)
                        clip_val = pyperclip.paste().strip()
                        if clip_val.startswith("BONUS_RESULT:"):
                            bonus_name = clip_val.replace("BONUS_RESULT:", "").strip()
                            break
                    
                    if bonus_name and not bonus_name.startswith("NOT_FOUND") and bonus_name != "":
                        print(f"[PLAYBISON] ✅ Found Bonus Name: {bonus_name}")
                    else:
                        print(f"[PLAYBISON] ⚠️ No matching bonus found for date {stack_date_ymd}.")
            break
    else:
        print("Timeout.")

if __name__ == "__main__":
    main()
