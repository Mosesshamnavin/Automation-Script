"""
core_engine.py
--------------
Central execution controller for on-demand Email / Withdrawal ID verification.
Runs datastudio_automation.py in unbuffered mode, parses milestones in real-time,
and supports cancellation and background queue processing.
"""

import sys
import os
import json
import subprocess
import threading
import time
import re
from typing import Callable, Optional, Dict, Any, List

def resolve_email_in_playbison(email: str, on_log: Optional[Callable[[str], None]] = None) -> Optional[Dict[str, str]]:
    """Scan the visible Playbison table for the withdrawal row matching this email."""
    try:
        import pyautogui
        import pyperclip
        from macro_loader import load_macro

        if on_log:
            on_log(f"[PLAYBISON] Searching table for email: {email}...")

        # Focus Playbison Tab 1
        pyautogui.hotkey('ctrl', '1')
        time.sleep(0.5)

        js_find = load_macro("playbison_find_by_email.js", TARGET_EMAIL=email)
        pyperclip.copy("WAITING_FOR_FIND")
        pyperclip.copy(js_find)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')

        for _ in range(8):
            time.sleep(0.5)
            res = pyperclip.paste().strip()
            if res.startswith("FOUND|"):
                parts = res.split("|")
                data = {
                    "email": parts[1] if len(parts) > 1 else email,
                    "id": parts[2] if len(parts) > 2 else "",
                    "brand": parts[3] if len(parts) > 3 else "bison casino",
                    "w_value": parts[4] if len(parts) > 4 else "",
                    "t_curr": parts[5] if len(parts) > 5 else "PLN",
                    "id_date": parts[6] if len(parts) > 6 else "",
                    "wallet_id": parts[7] if len(parts) > 7 else "",
                    "operator": parts[8] if len(parts) > 8 else "",
                    "name": parts[9] if len(parts) > 9 else ""
                }
                if on_log:
                    on_log(f"[PLAYBISON] Found target row! ID: {data['id']} | Player: {data['name']} | Wallet: {data['wallet_id']}")
                return data
            elif res in ("NOT_FOUND_ON_PAGE", "NOT_FOUND_TRY_PREV"):
                break
    except Exception as e:
        if on_log:
            on_log(f"[PLAYBISON] Note: Table pre-scan skipped ({e}). Proceeding to direct verification.")
    return None


class VerificationEngine:
    def __init__(self):
        self._current_process: Optional[subprocess.Popen] = None
        self._is_stopped = False
        self._is_paused = False

    def stop(self):
        """Terminate the active verification subprocess if running."""
        self._is_stopped = True
        if self._current_process and self._current_process.poll() is None:
            try:
                self._current_process.terminate()
                time.sleep(0.5)
                if self._current_process.poll() is None:
                    self._current_process.kill()
            except Exception:
                pass

    def pause(self):
        self._is_paused = True

    def resume(self):
        self._is_paused = False

    @property
    def is_paused(self) -> bool:
        return self._is_paused

    @property
    def is_stopped(self) -> bool:
        return self._is_stopped

    def verify_target(
        self,
        target: str,
        on_log: Optional[Callable[[str], None]] = None,
        on_status: Optional[Callable[[str, Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        """
        Verify a single target (Email or Withdrawal ID).
        """
        self._is_stopped = False
        target_clean = str(target).strip()
        is_email = "@" in target_clean

        result_data: Dict[str, Any] = {
            "target": target_clean,
            "id": target_clean if not is_email else "",
            "player_name": "",
            "player_id": "",
            "wallet_id": "",
            "email": target_clean if is_email else "",
            "wd_ratio": "",
            "stack_pln": "",
            "duplicate": "NO",
            "verdict": "Processing...",
            "status": "IN_PROGRESS",
            "error": None
        }

        if on_status:
            on_status(target_clean, result_data)

        # If it's an email, pre-scan table to grab withdrawal id and player details if present
        found_id = None
        if is_email:
            row_data = resolve_email_in_playbison(target_clean, on_log=on_log)
            if row_data:
                found_id = row_data.get("id")
                result_data["id"] = found_id or ""
                result_data["player_name"] = row_data.get("name", "")
                result_data["wallet_id"] = row_data.get("wallet_id", "")
                try:
                    with open("last_user.json", "w") as f:
                        json.dump(row_data, f, indent=2)
                except Exception:
                    pass
                if on_status:
                    on_status(target_clean, result_data)

        cmd = [
            sys.executable,
            "-u",  # Unbuffered stdout/stderr
            "datastudio_automation.py",
            "--auto"
        ]

        if is_email:
            cmd.extend(["--email", target_clean])
            if found_id:
                cmd.extend(["--id", found_id])
        else:
            cmd.extend(["--id", target_clean])

        if on_log:
            on_log(f"[ENGINE] Starting verification for: {target_clean}")

        try:
            self._current_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding="utf-8",
                errors="replace"
            )

            for line in iter(self._current_process.stdout.readline, ""):
                if self._is_stopped:
                    break
                line_str = line.rstrip("\r\n")
                if on_log:
                    on_log(line_str)

                # Milestone Parsing
                # 1. Player Name
                if "[PLAYBISON] Using scanned player name:" in line_str:
                    name_match = re.search(r"Using scanned player name:\s*(.*)", line_str)
                    if name_match:
                        result_data["player_name"] = name_match.group(1).strip()
                        if on_status:
                            on_status(target_clean, result_data)

                elif "Extracted true Player ID from wallet page:" in line_str:
                    m = re.search(r"Player ID from wallet page:\s*(\d+)\s*\(Name:\s*(.*?)\)", line_str)
                    if m:
                        result_data["player_id"] = m.group(1).strip()
                        result_data["player_name"] = m.group(2).strip()
                        if on_status:
                            on_status(target_clean, result_data)

                # 2. Player Email
                if "Extracted Player Email from" in line_str or "Successfully extracted Player Email:" in line_str:
                    m = re.search(r"Player Email(?: from \w+)?: ([\w\.-]+@[\w\.-]+)", line_str)
                    if m:
                        result_data["email"] = m.group(1).strip()
                        if on_status:
                            on_status(target_clean, result_data)

                # 3. Wallet ID
                if "wallet_id from table scan:" in line_str or "wallet_id in new tab:" in line_str:
                    m = re.search(r"(?:wallet_id|admin\.user):([a-f0-9]{15,})", line_str)
                    if m:
                        result_data["wallet_id"] = m.group(1).strip()
                        if on_status:
                            on_status(target_clean, result_data)

                # 4. Duplicate Check
                if "MULTIPLE ACCOUNTS FOUND FOR" in line_str or "MULTIPLE ACCOUNTS VERIFIED FOR" in line_str:
                    result_data["duplicate"] = "⚠️ YES (Multiple)"
                    if on_status:
                        on_status(target_clean, result_data)
                elif "No duplicate accounts found" in line_str:
                    result_data["duplicate"] = "NO"
                    if on_status:
                        on_status(target_clean, result_data)

                # 5. Data Studio W/D Ratio
                if "[DATASTUDIO] Parsed W/D ratio:" in line_str:
                    m = re.search(r"Parsed W/D ratio:\s*([\d\.]+)%", line_str)
                    if m:
                        result_data["wd_ratio"] = f"{m.group(1)}%"
                        if on_status:
                            on_status(target_clean, result_data)

                # 6. Stack Check
                if "Stack value (" in line_str and "PLN)" in line_str:
                    m = re.search(r"Stack value \(([\d\.]+) PLN\)", line_str)
                    if m:
                        result_data["stack_pln"] = f"{m.group(1)} PLN"
                        if on_status:
                            on_status(target_clean, result_data)

                if "-> 'Reject (Stack > 100 PLN)'" in line_str:
                    result_data["verdict"] = "Reject (Stack > 100 PLN)"
                    if on_status:
                        on_status(target_clean, result_data)

                elif "-> 'Reject (3rd Party)'" in line_str:
                    result_data["verdict"] = "Reject (3rd Party)"
                    if on_status:
                        on_status(target_clean, result_data)

                elif "-> 'Reject (" in line_str:
                    m = re.search(r"-> '(Reject [^']+)'", line_str)
                    if m:
                        result_data["verdict"] = m.group(1)
                        if on_status:
                            on_status(target_clean, result_data)

                # 7. Final Sheets Log & Approval
                if "Approval status:" in line_str:
                    m = re.search(r"Approval status:\s*'([^']+)'", line_str)
                    if m and result_data["verdict"] == "Processing...":
                        result_data["verdict"] = m.group(1)
                        if on_status:
                            on_status(target_clean, result_data)

                if "[GOOGLE SHEETS] Data successfully logged!" in line_str:
                    if result_data["verdict"] == "Processing...":
                        result_data["verdict"] = "Approved (Logged)"
                    result_data["status"] = "COMPLETED"
                    if on_status:
                        on_status(target_clean, result_data)

            self._current_process.wait()
            ret_code = self._current_process.returncode

            if self._is_stopped:
                result_data["status"] = "STOPPED"
                result_data["verdict"] = "Cancelled by User"
            elif ret_code == 0:
                result_data["status"] = "COMPLETED"
                if result_data["verdict"] == "Processing...":
                    result_data["verdict"] = "Approved / Clean"
            else:
                result_data["status"] = "FAILED"
                result_data["error"] = f"Process exited with code {ret_code}"
                if result_data["verdict"] == "Processing...":
                    result_data["verdict"] = f"Error (Exit {ret_code})"

        except Exception as e:
            result_data["status"] = "ERROR"
            result_data["error"] = str(e)
            result_data["verdict"] = f"Exception: {e}"
            if on_log:
                on_log(f"[ENGINE] Error executing datastudio_automation: {e}")

        finally:
            self._current_process = None
            if on_status:
                on_status(target_clean, result_data)

        return result_data

    # Backward compatibility alias
    def verify_id(self, withdrawal_id: str, on_log=None, on_status=None):
        return self.verify_target(withdrawal_id, on_log=on_log, on_status=on_status)


class QueueController:
    """Manages queue execution across multiple emails or withdrawal IDs."""
    def __init__(
        self,
        on_log: Optional[Callable[[str], None]] = None,
        on_status: Optional[Callable[[str, Dict[str, Any]], None]] = None,
        on_queue_finished: Optional[Callable[[], None]] = None
    ):
        self.engine = VerificationEngine()
        self.on_log = on_log
        self.on_status = on_status
        self.on_queue_finished = on_queue_finished
        self.queue: List[str] = []
        self._thread: Optional[threading.Thread] = None
        self._is_running = False

    def add_targets(self, targets: List[str]):
        for t in targets:
            clean = str(t).strip()
            if clean and clean not in self.queue:
                self.queue.append(clean)

    def add_ids(self, ids: List[str]):
        self.add_targets(ids)

    def clear_queue(self):
        self.queue.clear()

    def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._thread = threading.Thread(target=self._worker, daemon=True)
        self._thread.start()

    def stop(self):
        self._is_running = False
        self.engine.stop()

    def pause(self):
        self.engine.pause()

    def resume(self):
        self.engine.resume()

    @property
    def is_running(self) -> bool:
        return self._is_running

    def _worker(self):
        try:
            while self.queue and self._is_running:
                while self.engine.is_paused and self._is_running:
                    time.sleep(0.5)

                if not self._is_running:
                    break

                target = self.queue.pop(0)
                if self.on_log:
                    self.on_log(f"\n============================================================")
                    self.on_log(f"[QUEUE] Next Target: {target} ({len(self.queue)} remaining)")
                    self.on_log(f"============================================================")

                res = self.engine.verify_target(
                    target,
                    on_log=self.on_log,
                    on_status=self.on_status
                )

                if self.engine.is_stopped:
                    break

                # Small cooldown between consecutive verifications
                time.sleep(2.0)

        finally:
            self._is_running = False
            if self.on_queue_finished:
                self.on_queue_finished()
