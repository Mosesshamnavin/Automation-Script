import time
import pyperclip
import pyautogui
import subprocess
import sys

def main():
    import sys
    
    if "--auto" not in sys.argv:
        input("\nPress ENTER to start...")
    else:
        print("\n[AUTO-MODE] Starting automatically in 2 seconds...")
        time.sleep(1)

    is_first_run = True
    
    while True:
        # 1. Clear the clipboard so we know when the user copies the new email
        pyperclip.copy("WAITING_FOR_EMAIL")
        
        # 2. Execute Step 1 (Playbison Extraction)
        try:
            if is_first_run:
                print("\n[LOOP] Starting First Iteration...")
                subprocess.run([sys.executable, "playbison_automation.py"])
                is_first_run = False
            else:
                print("\n[LOOP] Starting Next Iteration (Scan Only)...")
                subprocess.run([sys.executable, "playbison_automation.py", "--scan-only"])
        except Exception as e:
            print(f"Error running playbison_automation.py: {e}")
            break
            
        print("\n[MAIN] Playbison macro injected.")
        print("[MAIN] Waiting for the browser to find a non-VIP role...")
        print("[MAIN] (Auto-Copy is enabled! It will automatically grab the email when found)")
        
        # 3. Wait for the clipboard to change (meaning the script found the email)
        email_found = False
        while True:
            clipboard_content = pyperclip.paste().strip()
            
            # If not yet copied, also trigger Ctrl+C in case a modal dialog appeared
            if clipboard_content == "WAITING_FOR_EMAIL":
                pyautogui.hotkey('ctrl', 'c')
                time.sleep(0.4)
                clipboard_content = pyperclip.paste().strip()
            
            # If clipboard changed from our waiting flag, and looks like an email (not raw JS code)
            if (clipboard_content != "WAITING_FOR_EMAIL"
                and not clipboard_content.startswith("(function")
                and not clipboard_content.startswith("javascript:")
                and "@" in clipboard_content):
                parts = clipboard_content.split("|")
                email = parts[0].strip() if len(parts) > 0 else clipboard_content
                player_id = parts[1].strip() if len(parts) > 1 else ""
                brand = parts[2].strip() if len(parts) > 2 else ""
                w_value = parts[3].strip() if len(parts) > 3 else ""
                t_curr = (parts[4].strip() if len(parts) > 4 and parts[4].strip() else "PLN")
                id_date = parts[5].strip() if len(parts) > 5 else ""
                wallet_id = parts[6].strip() if len(parts) > 6 else ""
                operator = parts[7].strip() if len(parts) > 7 else ""
                name = parts[8].strip() if len(parts) > 8 else ""
                
                print(f"\n[MAIN] Extracted Email: {email} | Transaction ID: {player_id} | Brand: {brand} | W-Value: {w_value} | T-Curr: {t_curr} | Wallet ID: {wallet_id} | Operator: {operator} | Name: {name}")
                
                # Save session data for Data Studio step
                import json
                with open("last_user.json", "w") as f:
                    json.dump({
                        "email": email,
                        "id": player_id,
                        "brand": brand,
                        "w_value": w_value,
                        "t_curr": t_curr,
                        "id_date": id_date,
                        "wallet_id": wallet_id,
                        "operator": operator,
                        "name": name
                    }, f, indent=2)
                
                # Put clean email in clipboard for Data Studio search input
                pyperclip.copy(email)
                
                # Dismiss any prompt/dialog if one was open
                pyautogui.press('enter')
                email_found = True
                break
            
            # If the macro finished but didn't find an email (it clicked Previous), it will prompt FINISHED_SCAN
            if clipboard_content == "FINISHED_SCAN":
                print("[MAIN] Table scan finished, but no non-VIP records were found on this page.")
                break

            # If clipboard contains unexpected non-email data (e.g. accidental text from another window), reset waiting flag & dismiss
            if (clipboard_content != "WAITING_FOR_EMAIL"
                and clipboard_content != "FINISHED_SCAN"
                and not clipboard_content.startswith("(function")
                and not clipboard_content.startswith("javascript:")
                and "@" not in clipboard_content):
                pyautogui.press('enter')
                time.sleep(0.3)
                pyperclip.copy("WAITING_FOR_EMAIL")
                
            time.sleep(1.0)
            
        if not email_found:
            print("[MAIN] No target found in this iteration. Retrying in 5 seconds...")
            time.sleep(5)
            continue
        
        # 4. Give the user 2 seconds to release the Enter key after closing the prompt
        print("\n[MAIN] Proceeding to Data Studio in 3 seconds. DO NOT TOUCH MOUSE/KEYBOARD!")
        time.sleep(3)
        
        # 5. Execute Step 2 (Data Studio)
        print("\n--- STARTING STEP 2: DATA STUDIO ---")
        try:
            ds_run = subprocess.run([sys.executable, "datastudio_automation.py", "--auto"])
        except Exception as e:
            print(f"Error running datastudio_automation.py: {e}")
            break

        if ds_run.returncode != 0:
            print(f"\n[MAIN] Data Studio step crashed (exit code {ds_run.returncode}). Stopping so this ID is not skipped.")
            break
            
        print("\n[MAIN] Finished processing this ID. Looping back to Playbison...\n")
        time.sleep(3)

if __name__ == "__main__":
    main()
