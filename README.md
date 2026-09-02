# Playbison to Data Studio Automation Suite

A hybrid Python + JavaScript automation system designed to automate end-to-end player verification workflows across **Playbison Back Office**, **Google Looker Studio (Data Studio)**, and **Google Sheets**.

---

## Table of Contents
- [Features](#features)
- [Prerequisites & Installation](#prerequisites--installation)
- [Browser Setup (Before Running)](#browser-setup-before-running)
- [How to Run](#how-to-run)
  - [1. Full Automated Loop (Standard Run)](#1-full-automated-loop-standard-run)
  - [2. Single ID / Manual Run](#2-single-id--manual-run)
  - [3. Playbison Table Scan Only](#3-playbison-table-scan-only)
- [Key Configurations](#key-configurations)
  - [Adjusting Date Cutoff Filter](#adjusting-date-cutoff-filter)
  - [Completed IDs Tracking](#completed-ids-tracking)
  - [Data Studio Date Range](#data-studio-date-range)
- [Automated Verification Rules](#automated-verification-rules)
- [Troubleshooting & Best Practices](#troubleshooting--best-practices)
- [Project Architecture](#project-architecture)

---

## Features
- **Headless-Free RPA**: Runs directly inside your existing, authenticated Chrome browser session. Avoids 2FA logins, CAPTCHAs, and Cloudflare/bot-detection triggers.
- **Cross-Platform Synchronization**: Bridges Playbison Admin, Looker Studio, Analytics, and Google Sheets smoothly via targeted JS macros and clipboard orchestration.
- **Auto Non-VIP Pagination Scanner**: Automatically navigates to the oldest records on the last page and scans backwards, ignoring VIP roles.
- **Duplicate Account Detection**: Automatically searches the Users database to flag duplicate names/accounts.
- **Looker Studio W/D Ratio Calculation**: Automatically focuses the email, sets the 62-day date range, handles multibrand filtering, and reads volumes.
- **Multi-Status Approval Logic**: Automatically checks:
  - Stack betting violations (> 100 PLN) & bonus extraction
  - Third-party withdrawal name mismatches
  - GB IBAN restrictions
  - Restricted operator mismatches (Skrill, Paysafecard, Coinspaid)
  - Active document requests & unverified CC/IBAN requirements
  - Previous calendar year payment rules
- **Live FX Currency Conversion**: Converts HUF, EUR, and USD amounts to PLN using live exchange rates.
- **Google Sheets Auto-Logging**: Appends formatted rows directly to the Google Sheet tracker.

---

## Prerequisites & Installation

### 1. Python
Ensure **Python 3.8+** is installed on your machine.

### 2. Install Dependencies
Open a terminal (Command Prompt / PowerShell / VS Code terminal) in the project directory:
```bash
cd E:\HYSAS\Projects\Script
pip install -r requirements.txt
```
*(Or install manually: `pip install pyautogui pyperclip requests`)*

---

## Browser Setup (Before Running)

Before starting the script, ensure **Google Chrome** is opened and maximized:

1. **Tab 1 (First Tab)**:
   - Navigate to **Playbison Back Office** (`api-acnt.playbison.com/platform-admin`).
   - Go to **Payments & Frauds -> Withdrawals To Confirm**.
2. **Logged In Accounts**:
   - Ensure you are already logged into Google (for Looker Studio & Google Sheets access).
3. **Display Settings**:
   - Keep Chrome zoom at **100%**.
   - Make sure Chrome is visible on your primary monitor.

---

## How to Run

### 1. Full Automated Loop (Standard Run)
This is the primary workflow that continuously scans for withdrawals, processes each user, logs them to Google Sheets, and refreshes for new records.

```bash
python main.py
```

**Step-by-step:**
1. Run the command in your terminal.
2. Press **ENTER** when prompted.
3. You have **5 seconds** to click into Google Chrome to focus it.
4. **DO NOT touch your mouse or keyboard** while the script is running.
5. The automation will:
   - Filter verified withdrawals and jump to the last page.
   - Scan backward for the next non-VIP row.
   - Extract player info and run duplicate checks.
   - Switch to Looker Studio to calculate W/D volume ratio.
   - Open player wallet, check Notes, Transactions (stacks), and Payment Log.
   - Determine the approval/rejection status.
   - Open Google Sheets and log the row.
   - Record the completed ID and loop for the next withdrawal.

---

### 2. Single ID / Manual Run
If you want to re-run or test a specific withdrawal ID without scanning the table:

1. Open `last_user.json` and fill in the player details:
   ```json
   {
     "email": "player_email@gmail.com",
     "id": "6255040",
     "brand": "bison casino",
     "w_value": "110.00",
     "t_curr": "PLN",
     "id_date": "2026-08-31 18:55:38",
     "wallet_id": "3df23d48cdf7b969248c054d",
     "operator": "BANK WITHDRAWAL PIQ",
     "name": "Player Full Name"
   }
   ```
2. Run:
   ```bash
   python datastudio_automation.py
   ```
3. Press **ENTER** and focus Chrome. It will process only this player and append to Google Sheets.

---

### 3. Playbison Table Scan Only
To only scan the table and copy the next eligible non-VIP record to your clipboard:

```bash
python playbison_automation.py
```

Or for loop refresh mode:
```bash
python playbison_automation.py --scan-only
```

---

## Key Configurations

### Adjusting Date Cutoff Filter
File: `macros/playbison_scan_nonvip.js` (around line 118)

Controls which records are considered "recent" vs skipped:
- **Default (Today from 13:30 onwards):**
  ```javascript
  let cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30, 0);
  ```
- **Catch-up (Yesterday from 13:30 onwards):**
  ```javascript
  let cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 13, 30, 0);
  ```
- **Full Day (Today from 00:00 midnight):**
  ```javascript
  let cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  ```

---

### Completed IDs Tracking
File: `completed_ids.json`

- Stores the IDs of withdrawals already processed today to prevent duplicate runs.
- **Auto-Reset:** Automatically resets whenever a new calendar day is detected.
- If you need to re-process an ID that was previously logged, simply remove its ID from `completed_ids.json`.

---

### Data Studio Date Range
File: `datastudio_automation.py`

- The Looker Studio date filter automatically calculates a **62-day rolling window** (~2 full calendar months) ending on today's date (e.g. `1 Jul 2026 - 1 Sept 2026`).

---

## Automated Verification Rules

| Check | Condition | Generated Status |
|---|---|---|
| **Stack Betting** | Combined stack bets > 100 PLN in date range | `Reject (Stack > 100 PLN)` |
| **GB IBAN** | Masked account starts with `GB` | `Reject (GB IBAN)` |
| **Third Party** | Account holder name does not match player name | `Third party request (Name mismatch: ...)` |
| **Operator Mismatch** | Skrill / Paysafecard / Coinspaid used on one side only | `Cancel (Mismatch Operator: ... vs ...)` |
| **Duplicate Accounts** | Multiple accounts found in Users search | `Review (Duplicates)` |
| **Active Doc Request** | Keyword `req` / `rem` found in top note or payment log | `Verify docs (Active doc request)` |
| **First-Time CC Deposit** | Credit card deposit without prior `cc ver` note | `Verify docs (First-time CC deposit)` |
| **High Ratio** | W/D ratio $\ge$ 25% (Non-exempt card/bank operators) | `Req last deposit (W/D Ratio >= 25%: ...)` |
| **Previous Year Payment** | Last deposit or withdrawal made in previous calendar year | `Req last deposit (Last deposit in previous year: ...)` |
| **High Amount** | Withdrawal > 2000 PLN without verified IBAN within 90 days | `Req IBAN (> 2000 PLN: ...)` |
| **Clean Approval** | Passed all checks | `Approve (Ratio ...)` |

---

## Troubleshooting & Best Practices

1. **"Hands-off" during execution:**
   PyAutoGUI uses simulated keyboard shortcuts (`Ctrl+L`, `Ctrl+V`, `Ctrl+W`). Moving the mouse or typing during execution will cause missed keystrokes or clipboard conflicts.
2. **If a modal or tab gets stuck:**
   Press `Escape` or manually close the auxiliary tab, then switch focus back to **Tab 1** (Playbison Back Office).
3. **Emergency Stop:**
   Press `Ctrl + C` in the running terminal window to immediately abort execution.
4. **Google Sheets Destination:**
   Make sure the destination Google Sheet URL in `datastudio_automation.py` is accessible with your logged-in Google account.

---

## Project Architecture

```
Script/
├── main.py                     # Master loop controller
├── playbison_automation.py     # Playbison navigation, filter, and extraction
├── datastudio_automation.py    # Looker Studio & full verification pipeline
├── macro_loader.py             # Macro loader and template variable injector
├── completed_ids.json          # Daily tracker for completed withdrawal IDs
├── last_user.json              # Session bridge for player data
├── macros/                     # JavaScript DOM automation modules
│   ├── playbison_navigate.js
│   ├── playbison_filter.js
│   ├── playbison_goto_last_page.js
│   ├── playbison_scan_nonvip.js
│   ├── playbison_refresh.js
│   ├── ds_switch_email.js
│   ├── ds_set_date_range.js
│   ├── ds_read_wd_ratio.js
│   ├── ds_brand_filter.js
│   ├── ds_extract_modal.js
│   ├── ds_check_duplicates.js
│   ├── ds_open_notes.js
│   ├── ds_check_notes.js
│   ├── ds_check_transactions.js
│   ├── ds_extract_bonus.js
│   ├── ds_payment_log.js
│   └── ds_get_last_deposit.js
└── README.md                   # This documentation
```
