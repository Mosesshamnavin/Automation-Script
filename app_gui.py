"""
app_gui.py
----------
Modern Dark-Themed Desktop GUI for On-Demand Email / Withdrawal ID Verification.
Bypasses historical table scans and directly validates user-specified Emails or IDs.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import threading
import queue
import re
import datetime
from typing import Dict, Any, List

from core_engine import QueueController

# --- Color Palette (Catppuccin Mocha Inspired) ---
BG_DARK = "#181825"
CARD_BG = "#1e1e2e"
SURFACE_BG = "#313244"
TEXT_PRIMARY = "#cdd6f4"
TEXT_SECONDARY = "#a6adc8"
ACCENT_BLUE = "#89b4fa"
ACCENT_BLUE_HOVER = "#b4befe"
ACCENT_GREEN = "#a6e3a1"
ACCENT_RED = "#f38ba8"
ACCENT_YELLOW = "#f9e2af"
ACCENT_CYAN = "#89dceb"
ACCENT_PURPLE = "#cba6f7"
LOG_BG = "#11111b"

class VerificationApp(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Playbison & Data Studio Verification")
        self.geometry("1140x820")
        self.minsize(980, 700)
        self.configure(bg=BG_DARK)

        # Thread-safe communication queue
        self.msg_queue: queue.Queue = queue.Queue()

        # Engine & Controller
        self.controller = QueueController(
            on_log=self._on_log_callback,
            on_status=self._on_status_callback,
            on_queue_finished=self._on_queue_finished_callback
        )

        # Tracking state
        self.total_submitted = 0
        self.completed_count = 0
        self.stack_count = 0
        self.dup_count = 0
        self.item_row_ids: Dict[str, str] = {}  # target (email/id) -> treeview iid

        # Build UI
        self._setup_styles()
        self._build_header()
        self._build_input_card()
        self._build_table_card()
        self._build_log_card()
        self._build_status_bar()

        # Periodic GUI queue poller
        self.after(100, self._poll_queue)

    def _setup_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")

        # Configure generic TTK elements
        style.configure(".", background=BG_DARK, foreground=TEXT_PRIMARY, font=("Segoe UI", 10))
        style.configure("Card.TFrame", background=CARD_BG, relief="flat")

        # Treeview Styles
        style.configure(
            "Custom.Treeview",
            background=CARD_BG,
            foreground=TEXT_PRIMARY,
            fieldbackground=CARD_BG,
            font=("Segoe UI", 9),
            rowheight=28,
            borderwidth=0
        )
        style.configure(
            "Custom.Treeview.Heading",
            background=SURFACE_BG,
            foreground=TEXT_PRIMARY,
            font=("Segoe UI", 10, "bold"),
            relief="flat",
            padding=(6, 6)
        )
        style.map(
            "Custom.Treeview.Heading",
            background=[("active", ACCENT_BLUE)],
            foreground=[("active", BG_DARK)]
        )
        style.map(
            "Custom.Treeview",
            background=[("selected", SURFACE_BG)],
            foreground=[("selected", ACCENT_BLUE)]
        )

        # Scrollbars
        style.configure("Vertical.TScrollbar", background=SURFACE_BG, troughcolor=BG_DARK, borderwidth=0)
        style.configure("Horizontal.TScrollbar", background=SURFACE_BG, troughcolor=BG_DARK, borderwidth=0)

    def _build_header(self):
        header_frame = tk.Frame(self, bg=BG_DARK, padx=20, pady=12)
        header_frame.pack(fill="x")

        title_box = tk.Frame(header_frame, bg=BG_DARK)
        title_box.pack(side="left")

        title_lbl = tk.Label(
            title_box,
            text="PLAYBISON & DATA STUDIO",
            font=("Segoe UI", 16, "bold"),
            bg=BG_DARK,
            fg=ACCENT_BLUE
        )
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            title_box,
            text="Direct Email & Withdrawal Verification Dashboard",
            font=("Segoe UI", 9),
            bg=BG_DARK,
            fg=TEXT_SECONDARY
        )
        sub_lbl.pack(anchor="w")

        # Status badge indicator
        self.status_badge = tk.Label(
            header_frame,
            text="IDLE",
            font=("Segoe UI", 10, "bold"),
            bg=SURFACE_BG,
            fg=TEXT_PRIMARY,
            padx=14,
            pady=4,
            relief="flat"
        )
        self.status_badge.pack(side="right")

    def _build_input_card(self):
        card = tk.Frame(self, bg=CARD_BG, padx=16, pady=14, highlightthickness=1, highlightbackground=SURFACE_BG)
        card.pack(fill="x", padx=20, pady=(0, 10))

        lbl_box = tk.Frame(card, bg=CARD_BG)
        lbl_box.pack(fill="x", pady=(0, 6))

        lbl = tk.Label(
            lbl_box,
            text="Enter Email Address(es) or Withdrawal ID(s):",
            font=("Segoe UI", 10, "bold"),
            bg=CARD_BG,
            fg=TEXT_PRIMARY
        )
        lbl.pack(side="left")

        hint = tk.Label(
            lbl_box,
            text="(Paste single or multiple Emails/IDs separated by newline, comma, or space - e.g. player@domain.com)",
            font=("Segoe UI", 8, "italic"),
            bg=CARD_BG,
            fg=TEXT_SECONDARY
        )
        hint.pack(side="left", padx=10)

        # Content split: Text Area on left, Buttons on right
        content_box = tk.Frame(card, bg=CARD_BG)
        content_box.pack(fill="x")

        self.txt_ids = tk.Text(
            content_box,
            height=3,
            bg=LOG_BG,
            fg=TEXT_PRIMARY,
            insertbackground=ACCENT_BLUE,
            font=("Consolas", 10),
            relief="flat",
            padx=8,
            pady=6,
            highlightthickness=1,
            highlightbackground=SURFACE_BG
        )
        self.txt_ids.pack(side="left", fill="both", expand=True, padx=(0, 12))

        btn_box = tk.Frame(content_box, bg=CARD_BG)
        btn_box.pack(side="right", fill="y")

        # Row 1 of buttons
        row1 = tk.Frame(btn_box, bg=CARD_BG)
        row1.pack(fill="x", pady=(0, 6))

        self.btn_start = tk.Button(
            row1,
            text="▶ Start Validation",
            font=("Segoe UI", 9, "bold"),
            bg=ACCENT_BLUE,
            fg=BG_DARK,
            activebackground=ACCENT_BLUE_HOVER,
            activeforeground=BG_DARK,
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2",
            command=self._on_start_clicked
        )
        self.btn_start.pack(side="left", padx=(0, 6))

        self.btn_pause = tk.Button(
            row1,
            text="⏸ Pause",
            font=("Segoe UI", 9),
            bg=SURFACE_BG,
            fg=TEXT_PRIMARY,
            activebackground=CARD_BG,
            activeforeground=TEXT_PRIMARY,
            relief="flat",
            padx=10,
            pady=6,
            state="disabled",
            cursor="hand2",
            command=self._on_pause_clicked
        )
        self.btn_pause.pack(side="left")

        # Row 2 of buttons
        row2 = tk.Frame(btn_box, bg=CARD_BG)
        row2.pack(fill="x")

        self.btn_stop = tk.Button(
            row2,
            text="⏹ Stop",
            font=("Segoe UI", 9),
            bg=SURFACE_BG,
            fg=ACCENT_RED,
            activebackground=CARD_BG,
            activeforeground=ACCENT_RED,
            relief="flat",
            padx=14,
            pady=6,
            state="disabled",
            cursor="hand2",
            command=self._on_stop_clicked
        )
        self.btn_stop.pack(side="left", padx=(0, 6))

        self.btn_clear = tk.Button(
            row2,
            text="🗑 Clear Queue",
            font=("Segoe UI", 9),
            bg=SURFACE_BG,
            fg=TEXT_SECONDARY,
            activebackground=CARD_BG,
            activeforeground=TEXT_PRIMARY,
            relief="flat",
            padx=10,
            pady=6,
            cursor="hand2",
            command=self._on_clear_clicked
        )
        self.btn_clear.pack(side="left")

    def _build_table_card(self):
        card = tk.Frame(self, bg=CARD_BG, padx=16, pady=10, highlightthickness=1, highlightbackground=SURFACE_BG)
        card.pack(fill="both", expand=True, padx=20, pady=(0, 10))

        tbl_header = tk.Frame(card, bg=CARD_BG)
        tbl_header.pack(fill="x", pady=(0, 6))

        lbl = tk.Label(
            tbl_header,
            text="Queue & Validation Results",
            font=("Segoe UI", 10, "bold"),
            bg=CARD_BG,
            fg=TEXT_PRIMARY
        )
        lbl.pack(side="left")

        # Table & Scrollbars
        tbl_container = tk.Frame(card, bg=CARD_BG)
        tbl_container.pack(fill="both", expand=True)

        columns = ("order", "target", "name", "ratio", "stack", "dup", "verdict")
        self.tree = ttk.Treeview(
            tbl_container,
            columns=columns,
            show="headings",
            style="Custom.Treeview",
            selectmode="browse"
        )

        self.tree.heading("order", text="#")
        self.tree.heading("target", text="Target (Email / ID)")
        self.tree.heading("name", text="Player Name")
        self.tree.heading("ratio", text="W/D Ratio")
        self.tree.heading("stack", text="Stack (PLN)")
        self.tree.heading("dup", text="Duplicates")
        self.tree.heading("verdict", text="Verdict / Status")

        self.tree.column("order", width=40, anchor="center")
        self.tree.column("target", width=190, anchor="w")
        self.tree.column("name", width=170, anchor="w")
        self.tree.column("ratio", width=85, anchor="center")
        self.tree.column("stack", width=105, anchor="center")
        self.tree.column("dup", width=120, anchor="center")
        self.tree.column("verdict", width=220, anchor="w")

        # Tags for colored rows
        self.tree.tag_configure("pending", foreground=TEXT_SECONDARY)
        self.tree.tag_configure("in_progress", foreground=ACCENT_CYAN, background=SURFACE_BG)
        self.tree.tag_configure("approved", foreground=ACCENT_GREEN)
        self.tree.tag_configure("rejected", foreground=ACCENT_RED)
        self.tree.tag_configure("warning", foreground=ACCENT_YELLOW)

        vsb = ttk.Scrollbar(tbl_container, orient="vertical", command=self.tree.yview, style="Vertical.TScrollbar")
        self.tree.configure(yscrollcommand=vsb.set)

        self.tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

    def _build_log_card(self):
        card = tk.Frame(self, bg=CARD_BG, padx=16, pady=10, highlightthickness=1, highlightbackground=SURFACE_BG)
        card.pack(fill="both", expand=True, padx=20, pady=(0, 10))

        log_head = tk.Frame(card, bg=CARD_BG)
        log_head.pack(fill="x", pady=(0, 6))

        lbl = tk.Label(
            log_head,
            text="Live Activity Console",
            font=("Segoe UI", 10, "bold"),
            bg=CARD_BG,
            fg=TEXT_PRIMARY
        )
        lbl.pack(side="left")

        btn_clear_log = tk.Button(
            log_head,
            text="Clear Logs",
            font=("Segoe UI", 8),
            bg=SURFACE_BG,
            fg=TEXT_SECONDARY,
            relief="flat",
            padx=8,
            pady=2,
            cursor="hand2",
            command=self._clear_logs
        )
        btn_clear_log.pack(side="right")

        log_container = tk.Frame(card, bg=CARD_BG)
        log_container.pack(fill="both", expand=True)

        self.txt_log = tk.Text(
            log_container,
            height=7,
            bg=LOG_BG,
            fg=TEXT_PRIMARY,
            insertbackground=ACCENT_BLUE,
            font=("Consolas", 9),
            relief="flat",
            padx=8,
            pady=6,
            wrap="word",
            state="disabled"
        )
        log_vsb = ttk.Scrollbar(log_container, orient="vertical", command=self.txt_log.yview, style="Vertical.TScrollbar")
        self.txt_log.configure(yscrollcommand=log_vsb.set)

        self.txt_log.pack(side="left", fill="both", expand=True)
        log_vsb.pack(side="right", fill="y")

        # Console Color Tags
        self.txt_log.tag_config("time", foreground=TEXT_SECONDARY)
        self.txt_log.tag_config("playbison", foreground=ACCENT_CYAN)
        self.txt_log.tag_config("datastudio", foreground=ACCENT_YELLOW)
        self.txt_log.tag_config("sheets", foreground=ACCENT_GREEN)
        self.txt_log.tag_config("warning", foreground=ACCENT_RED, font=("Consolas", 9, "bold"))
        self.txt_log.tag_config("engine", foreground=ACCENT_PURPLE)

    def _build_status_bar(self):
        bar = tk.Frame(self, bg=SURFACE_BG, padx=20, pady=6)
        bar.pack(fill="x", side="bottom")

        self.lbl_stats = tk.Label(
            bar,
            text="Queue: 0 | Completed: 0 | Stacks Detected: 0 | Duplicates: 0",
            font=("Segoe UI", 9),
            bg=SURFACE_BG,
            fg=TEXT_PRIMARY
        )
        self.lbl_stats.pack(side="left")

        lbl_ready = tk.Label(
            bar,
            text="Chrome Focus: Ctrl+1 | DO NOT TOUCH MOUSE WHILE VALIDATING",
            font=("Segoe UI", 9, "italic"),
            bg=SURFACE_BG,
            fg=TEXT_SECONDARY
        )
        lbl_ready.pack(side="right")

    # --- Actions & Handlers ---

    def _parse_input_targets(self) -> List[str]:
        raw = self.txt_ids.get("1.0", "end").strip()
        if not raw:
            return []
        tokens = re.split(r"[\r\n,;\s]+", raw)
        valid_targets = []
        for t in tokens:
            t_clean = t.strip()
            if not t_clean:
                continue
            # Accept valid email (contains @ and .) OR valid numeric ID (>= 4 digits)
            is_email = "@" in t_clean and "." in t_clean
            is_id = t_clean.isdigit() and len(t_clean) >= 4
            if (is_email or is_id) and t_clean not in valid_targets:
                valid_targets.append(t_clean)
        return valid_targets

    def _on_start_clicked(self):
        targets = self._parse_input_targets()
        if not targets:
            messagebox.showwarning(
                "No Valid Targets",
                "Please enter at least one valid Email address (e.g. user@domain.com) or numeric Withdrawal ID."
            )
            return

        for idx, target in enumerate(targets, start=len(self.item_row_ids) + 1):
            if target not in self.item_row_ids:
                row_id = self.tree.insert(
                    "",
                    "end",
                    values=(idx, target, "...", "...", "...", "...", "Queued"),
                    tags=("pending",)
                )
                self.item_row_ids[target] = row_id

        self.total_submitted += len(targets)
        self.controller.add_targets(targets)
        self.txt_ids.delete("1.0", "end")

        # Update controls
        self.btn_start.configure(state="disabled")
        self.btn_pause.configure(state="normal", text="⏸ Pause")
        self.btn_stop.configure(state="normal")
        self._set_status_badge("PROCESSING", ACCENT_BLUE)

        self.controller.start()
        self._update_stats_label()

    def _on_pause_clicked(self):
        if not self.controller.is_paused:
            self.controller.pause()
            self.btn_pause.configure(text="▶ Resume")
            self._set_status_badge("PAUSED", ACCENT_YELLOW)
            self._append_log("[ENGINE] Verification paused by operator.\n", "engine")
        else:
            self.controller.resume()
            self.btn_pause.configure(text="⏸ Pause")
            self._set_status_badge("PROCESSING", ACCENT_BLUE)
            self._append_log("[ENGINE] Verification resumed.\n", "engine")

    def _on_stop_clicked(self):
        if messagebox.askyesno("Confirm Stop", "Are you sure you want to stop current validation?"):
            self.controller.stop()
            self.btn_stop.configure(state="disabled")
            self.btn_pause.configure(state="disabled")
            self.btn_start.configure(state="normal")
            self._set_status_badge("STOPPED", ACCENT_RED)
            self._append_log("[ENGINE] Verification aborted by operator.\n", "warning")

    def _on_clear_clicked(self):
        if self.controller.is_running:
            messagebox.showinfo("Busy", "Cannot clear queue while validation is actively running. Stop it first.")
            return
        self.tree.delete(*self.tree.get_children())
        self.item_row_ids.clear()
        self.controller.clear_queue()
        self.total_submitted = 0
        self.completed_count = 0
        self.stack_count = 0
        self.dup_count = 0
        self._update_stats_label()
        self._set_status_badge("IDLE", SURFACE_BG)

    def _set_status_badge(self, text: str, color: str):
        self.status_badge.configure(text=text, bg=color, fg=BG_DARK if color != SURFACE_BG else TEXT_PRIMARY)

    def _clear_logs(self):
        self.txt_log.configure(state="normal")
        self.txt_log.delete("1.0", "end")
        self.txt_log.configure(state="disabled")

    def _update_stats_label(self):
        remaining = len(self.controller.queue)
        text = f"Total: {self.total_submitted} | Remaining: {remaining} | Completed: {self.completed_count} | Stacks: {self.stack_count} | Duplicates: {self.dup_count}"
        self.lbl_stats.configure(text=text)

    # --- Callbacks from Worker Threads ---

    def _on_log_callback(self, message: str):
        self.msg_queue.put(("log", message))

    def _on_status_callback(self, target: str, data: Dict[str, Any]):
        self.msg_queue.put(("status", target, data))

    def _on_queue_finished_callback(self):
        self.msg_queue.put(("finished",))

    # --- Main Thread Queue Consumer ---

    def _poll_queue(self):
        try:
            while True:
                item = self.msg_queue.get_nowait()
                msg_type = item[0]

                if msg_type == "log":
                    self._append_log(item[1])

                elif msg_type == "status":
                    target, data = item[1], item[2]
                    self._update_row(target, data)

                elif msg_type == "finished":
                    self.btn_start.configure(state="normal")
                    self.btn_pause.configure(state="disabled", text="⏸ Pause")
                    self.btn_stop.configure(state="disabled")
                    self._set_status_badge("FINISHED", ACCENT_GREEN)
                    self._append_log("\n[ENGINE] All queued items processed successfully.\n", "sheets")
                    self._update_stats_label()

        except queue.Empty:
            pass

        self.after(100, self._poll_queue)

    def _append_log(self, text: str, default_tag: str = ""):
        self.txt_log.configure(state="normal")
        now_str = datetime.datetime.now().strftime("[%H:%M:%S] ")
        self.txt_log.insert("end", now_str, "time")

        tag = default_tag
        if not tag:
            if "[PLAYBISON]" in text:
                tag = "playbison"
            elif "[DATASTUDIO]" in text:
                tag = "datastudio"
            elif "[GOOGLE SHEETS]" in text:
                tag = "sheets"
            elif "[WARNING]" in text or "REJECT" in text.upper():
                tag = "warning"
            elif "[ENGINE]" in text or "[QUEUE]" in text:
                tag = "engine"

        clean_text = text if text.endswith("\n") else text + "\n"
        if tag:
            self.txt_log.insert("end", clean_text, tag)
        else:
            self.txt_log.insert("end", clean_text)

        self.txt_log.see("end")
        self.txt_log.configure(state="disabled")

    def _update_row(self, target: str, data: Dict[str, Any]):
        row_id = self.item_row_ids.get(target)
        if not row_id:
            return

        order_val = self.tree.item(row_id)["values"][0]
        # Show target (e.g. email) and append ID if discovered
        display_target = target
        found_id = data.get("id")
        if found_id and found_id != target and found_id != "":
            display_target = f"{target} (#{found_id})"

        name = data.get("player_name") or "..."
        ratio = data.get("wd_ratio") or "..."
        stack = data.get("stack_pln") or "..."
        dup = data.get("duplicate") or "NO"
        verdict = data.get("verdict") or "Processing..."
        status = data.get("status", "IN_PROGRESS")

        # Tag selection
        row_tag = "in_progress"
        if status == "COMPLETED":
            if "Reject" in verdict or "REJECT" in verdict:
                row_tag = "rejected"
            elif "Warning" in dup or "Multiple" in dup:
                row_tag = "warning"
            else:
                row_tag = "approved"
            self.completed_count = sum(
                1 for iid in self.item_row_ids.values()
                if self.tree.item(iid)["tags"] and self.tree.item(iid)["tags"][0] in ("approved", "rejected", "warning")
            )
        elif status in ("FAILED", "ERROR", "STOPPED"):
            row_tag = "rejected"

        if "Stack" in verdict and "Reject" in verdict:
            self.stack_count = sum(1 for iid in self.item_row_ids.values() if "Stack" in str(self.tree.item(iid)["values"][6]))
        if "YES" in dup:
            self.dup_count = sum(1 for iid in self.item_row_ids.values() if "YES" in str(self.tree.item(iid)["values"][5]))

        self.tree.item(
            row_id,
            values=(order_val, display_target, name, ratio, stack, dup, verdict),
            tags=(row_tag,)
        )
        self._update_stats_label()


def main():
    app = VerificationApp()
    app.mainloop()

if __name__ == "__main__":
    main()
