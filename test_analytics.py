import time
import pyperclip
import pyautogui
import webbrowser
import sys
import os

from macro_loader import load_macro

def main():
    print("Testing Analytics Flow for tomaszmamon007...")
    wallet_id = "b933b28b64c2ea3c564f2d90"
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
            break
    else:
        print("Timeout.")

if __name__ == "__main__":
    main()
