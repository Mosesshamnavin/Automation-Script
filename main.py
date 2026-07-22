import time
import pyperclip
import pyautogui
import subprocess
import sys

def main():
    print("============================================================")
    print("   PLAYBISON TO DATA STUDIO - MASTER AUTOMATION SCRIPT")
    print("============================================================")
    print("This script will run all steps sequentially.")
    
    # 1. Clear the clipboard so we know when the user copies the new email
    pyperclip.copy("WAITING_FOR_EMAIL")
    
    # 2. Execute Step 1 (Playbison Extraction)
    print("\n--- STARTING STEP 1: PLAYBISON EXTRACTION ---")
    try:
        subprocess.run([sys.executable, "playbison_automation.py"])
    except Exception as e:
        print(f"Error running playbison_automation.py: {e}")
        return
        
    print("\n[MAIN] Playbison macro injected.")
    print("[MAIN] Waiting for the browser to find a non-VIP role...")
    print("[MAIN] (Auto-Copy is enabled! It will automatically grab the email when found)")
    
    # 3. Wait for the clipboard to change (meaning the script found the email)
    while True:
        # Try to copy from the prompt that appears
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.5)
        
        clipboard_content = pyperclip.paste().strip()
        # If clipboard changed from our waiting flag, and looks like an email
        if clipboard_content != "WAITING_FOR_EMAIL" and "@" in clipboard_content:
            if "|" in clipboard_content:
                email, player_id = clipboard_content.split("|", 1)
            else:
                email, player_id = clipboard_content, ""
            
            print(f"\n[MAIN] Extracted Email: {email} | Player ID: {player_id}")
            
            # Save session data for Data Studio step
            import json
            with open("last_user.json", "w") as f:
                json.dump({"email": email, "id": player_id}, f, indent=2)
            
            # Put clean email in clipboard for Data Studio search input
            pyperclip.copy(email)
            
            # Hit Enter to close the JS prompt
            pyautogui.press('enter')
            break
        time.sleep(1.5)
        
    # 4. Give the user 2 seconds to release the Enter key after closing the prompt
    print("\n[MAIN] Proceeding to Data Studio in 3 seconds. DO NOT TOUCH MOUSE/KEYBOARD!")
    time.sleep(2)
    
    # 5. Execute Step 2 (Data Studio)
    print("\n--- STARTING STEP 2: DATA STUDIO ---")
    try:
        subprocess.run([sys.executable, "datastudio_automation.py", "--auto"])
    except Exception as e:
        print(f"Error running datastudio_automation.py: {e}")
        
    print("\n[MAIN] Master automation workflow complete!")

if __name__ == "__main__":
    main()
