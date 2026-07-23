# Playbison to Data Studio Automation Script

A hybrid Python + JavaScript automation suite designed to streamline manual user verification workflows across Playbison Admin, Google Data Studio, and PaymentIQ. 

## Features
- **Cross-Domain Automation**: Seamlessly transfers context (Emails, IDs) across entirely different platforms without complex API integrations.
- **Headless-Free Execution**: Operates directly inside your authenticated Chrome browser session, completely avoiding CAPTCHAs, 2FA prompts, and anti-bot systems that block standard headless browsers.
- **Smart DOM Interactions**: Injects highly targeted JavaScript macros directly into the browser to handle dynamic React/Vue elements, complex shadow DOMs, and nested iframes instantly.

## Getting Started

1. **Prepare Browser:** Open Google Chrome and navigate to the **Playbison Admin Dashboard** (`Withdrawals To Confirm` page).
2. **Start Script:** Open your terminal and run:
   ```bash
   python main.py
   ```
3. **Hands Off:** Once started, do not touch your mouse or keyboard. The script will physically simulate keyboard shortcuts (like opening tabs) and use clipboard bridging.

## Documentation
- **[View the Complete Workflow Documentation (WORKFLOW.md)](WORKFLOW.md)**: Detailed step-by-step breakdown of exactly what the script checks and validates at each stage.

## File Structure
- `main.py` - Master controller script that orchestrates the entire workflow.
- `playbison_automation.py` - Handles Playbison withdrawal table filtering & extraction.
- `datastudio_automation.py` - Handles Data Studio W/D ratio checks, Wallet profile navigation, Transaction validations, and PaymentIQ lookups.
- `last_user.json` - Temporary data bridge used automatically between components.
- `WORKFLOW.md` - Detailed documentation of the business logic and rules.

## Architecture & Design Choice
This project uses a **Python + JS Hybrid Approach** ("Poor Man's RPA"). 
- **Python (pyautogui)** acts as the "hands" to manage tabs and clipboard safely.
- **JavaScript** acts as the "eyes" to instantly manipulate dynamic React applications.
This approach bypasses the massive overhead of Selenium/Playwright logins, while allowing cross-domain communication that standard Bookmarklets or simple JS scripts cannot achieve.
