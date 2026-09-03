"""
main.py
-------
Primary entry point for Playbison & Data Studio Verification.
- Default: Launches the Modern Desktop GUI (app_gui.py).
- CLI Mode: Validates specific ID(s) directly via --id or --ids.
- Legacy Mode: Runs the continuous backwards table scan loop via --legacy-scan.
"""

import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import time
import subprocess
import json
import os
import pyperclip
import pyautogui

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.05


def run_cli_validation(targets: list):
    """Run validation for one or more specific Emails or IDs directly in terminal."""
    from core_engine import VerificationEngine

    engine = VerificationEngine()
    print("\n" + "=" * 60)
    print(f"CLI TARGET VALIDATION: {len(targets)} target(s) queued")
    print("=" * 60)
    print("[START] Waiting 5 seconds... Release your mouse & keyboard!")
    for sec in range(5, 0, -1):
        print(f"Starting in {sec}s... ", end="\r", flush=True)
        time.sleep(1.0)
    print("Starting now!             \n")

    for idx, target in enumerate(targets, start=1):
        print(f"\n[{idx}/{len(targets)}] Processing Target: {target}")
        res = engine.verify_target(
            target,
            on_log=lambda msg: print(msg)
        )
        print("\n--- RESULT ---")
        print(f"Target   : {res.get('target', target)}")
        print(f"ID       : {res.get('id', '')}")
        print(f"Email    : {res.get('email', '')}")
        print(f"Player   : {res.get('player_name', '')}")
        print(f"W/D Ratio: {res.get('wd_ratio', '')}")
        print(f"Stack    : {res.get('stack_pln', '')}")
        print(f"Duplicate: {res.get('duplicate', '')}")
        print(f"Verdict  : {res.get('verdict', '')}")
        print(f"Status   : {res.get('status', '')}")
        print("-" * 30)
        time.sleep(2.0)


def legacy_scan_loop():
    """Original legacy autonomous backwards table scan from yesterday 13:30."""
    print("\n[LEGACY MODE] Starting continuous table scan loop...")
    if "--auto" not in sys.argv:
        input("\nPress ENTER to start...")
    else:
        print("\n[AUTO-MODE] Starting automatically in 2 seconds...")
        time.sleep(1)

    is_first_run = True

    while True:
        pyperclip.copy("WAITING_FOR_EMAIL")
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

        email_found = False
        while True:
            clipboard_content = pyperclip.paste().strip()
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

                print(f"\n[MAIN] Extracted Email: {email} | Transaction ID: {player_id} | Brand: {brand} | Name: {name}")
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

                pyperclip.copy(email)
                email_found = True
                break

            if clipboard_content == "FINISHED_SCAN":
                print("[MAIN] Table scan finished, but no non-VIP records were found on this page.")
                break

            time.sleep(0.4)

        if not email_found:
            print("\n[MAIN] Waiting 10 seconds before refreshing table for new incoming withdrawals...")
            for sec in range(10, 0, -1):
                print(f"[MAIN] Re-checking in {sec}s... ", end="\r")
                time.sleep(1)
            continue

        print("\n[MAIN] Proceeding to Data Studio in 3 seconds. DO NOT TOUCH MOUSE/KEYBOARD!")
        time.sleep(3)

        print("\n--- STARTING STEP 2: DATA STUDIO ---")
        try:
            ds_run = subprocess.run([sys.executable, "datastudio_automation.py", "--auto"])
        except Exception as e:
            print(f"Error running datastudio_automation.py: {e}")
            break

        if ds_run.returncode != 0:
            print(f"\n[MAIN] Data Studio step crashed (exit code {ds_run.returncode}). Stopping.")
            break

        print("\n[MAIN] Finished processing this ID. Looping back to Playbison...\n")
        time.sleep(3)


def main():
    # 1. Legacy Scan Mode
    if "--legacy-scan" in sys.argv:
        legacy_scan_loop()
        return

    # 2. CLI Specific Target Mode (Email or ID)
    targets = []
    if "--email" in sys.argv:
        try:
            idx = sys.argv.index("--email") + 1
            if idx < len(sys.argv):
                targets.append(sys.argv[idx].strip())
        except Exception:
            pass
    elif "--emails" in sys.argv:
        try:
            idx = sys.argv.index("--emails") + 1
            if idx < len(sys.argv):
                for i in sys.argv[idx].split(","):
                    if i.strip():
                        targets.append(i.strip())
        except Exception:
            pass
    elif "--id" in sys.argv:
        try:
            idx = sys.argv.index("--id") + 1
            if idx < len(sys.argv):
                targets.append(sys.argv[idx].strip())
        except Exception:
            pass
    elif "--ids" in sys.argv:
        try:
            idx = sys.argv.index("--ids") + 1
            if idx < len(sys.argv):
                for i in sys.argv[idx].split(","):
                    if i.strip():
                        targets.append(i.strip())
        except Exception:
            pass

    if targets:
        run_cli_validation(targets)
        return

    # 3. Default: Launch Desktop GUI
    import app_gui
    app_gui.main()


if __name__ == "__main__":
    main()
