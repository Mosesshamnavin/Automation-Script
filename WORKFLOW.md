# Complete Workflow Overview

This document details the exact sequence of actions performed by the Playbison to Data Studio Automation Script.

## Part 1: Initial Playbison Data Extraction (playbison_automation.py)
1. **Prepare Browser:** Open Google Chrome and navigate to the **Playbison Admin Dashboard** (Withdrawals To Confirm page).
2. **Start Script:** Run python main.py.
3. **Execution:**
   - **Phase 1 & 2:** Automatically filters Verified in Player Status and generates the table.
   - **Phase 3:** Jumps directly to the last page.
   - **Phase 4:** Scans backwards for non-VIP roles (
oles column does not contain VIP).
   - Automatically extracts the matching player's email & Player ID and saves it to last_user.json.

## Part 2: Payment Details & Duplicate Checking (datastudio_automation.py)
1. **Payment Details Modal:**
   - Instantly opens the Payments Details modal for the extracted Player ID.
   - Extracts the player's First Name, Last Name, City, Operator, and maskedAccount.
   - Also extracts the internal wallet_id.
   - **Operator Rules:**
     - **BANK WITHDRAWAL PIQ**: Validates first & last name against request data.
     - **PAYSAFECARD / SKRILL**: Skips name check.
     - **COINSPAID**: Skips copy operation.
     - **MISMATCH**: Returns all details (including Name and Operator) even if a name mismatch occurs, allowing duplicate checks to proceed.
2. **Duplicate Search:**
   - Opens the Playbison Users list in a new tab.
   - Automatically injects the First Name and Last Name into the search filters.
   - If multiple results appear, it adds the City to the search filter.
   - If multiple results still appear, it flags a massive [WARNING] in the terminal for duplicate accounts.

## Part 3: Google Data Studio Input & W/D Ratio Check
1. Automatically opens Google Data Studio in a new Chrome tab.
2. Focuses Email (lowercase) input field and types the extracted email.
3. Sets the Date Picker filter to the last 2 months.
4. Reads the **W/D ratio (volumes)** cell.

## Part 4: Wallet Verification, Notes & Transactions
1. **Wallet Navigation & Notes Tab:**
   - Directly opens the user's wallet profile in a new tab using the wallet_id extracted earlier (bypassing the need to switch back to the original table tab).
   - Waits for wallet profile to load, then automatically clicks the **
otes** tab.
2. **Transactions Tab Check:**
   - Finds the **	ransactions** tab and automatically switches to it.
   - Selects **Redeem the bonuses** in the Type dropdown and sets Date From to **1 month ago**.
   - Inspects the 
ote column across all result rows.
   - If all rows have the text "automatic", it skips further analysis.
   - If any row lacks "automatic", it clears the type filter, sets Amount Range In (To) to **-8.01** and clicks Search again.
3. **Payment Log Validation:**
   - Switches to the **payment log** tab.
   - Automatically selects both **Pending** and **Completed** options and searches.
   - Automatically searches the results for the last successful **DEPOSIT** row and extracts the **Deposit ID**.

## Part 5: PaymentIQ Search & Conditional Cancellation Notes
1. Opens a new tab directed to https://backoffice.paymentiq.io/#/user-accounts.
2. Automatically detects if PaymentIQ is **logged out**. If so, it securely aborts the script to prevent account locking.
3. Automatically inputs user<ID> and submits the search.
4. **Data Extraction:** Extracts the Holder, Last Success, and Account columns.
5. **Conditional Cancellation Note Generation:**
   - The script determines if a specific cancellation note is needed based on exactly 4 rules:
     - **Condition 1 (3rd Party)**: If Name does not match PIQ Holder, and NOT a credit card -> wd {id} cancelled, 3rd party "{name}" / Req last dep {dep_id}
     - **Condition 2 (Card Ownership)**: If Name does not match PIQ Holder, and IS a credit card -> wd {id} cancelled, req confirmation of card ownership {cc}
     - **Condition 3 (High Ratio)**: If W/D ratio is >= 25% -> wd {id} cancelled, req dep {dep_id}, w/d ratio is {ratio}%
     - **Condition 4 (CC Requirements)**: Based on Operator text, requests CC or Webredirect (e.g. APPLE PAY BANK, WEBREDIRECT BITEXPRO GOOGLE PAY, or default Req CC {cc}).
6. **Note Injection:**
   - If any condition is met, the script automatically switches back to the Playbison Wallet tab.
   - Types the generated note into the Notes textarea.
   - Sets the Note Type dropdown to **Important**.
   - Waits for the manual **Add Note** click.

---

## Project File Structure

### Python Entry Points

| File | Purpose |
|---|---|
| `main.py` | Entry point — runs Playbison extraction, then Data Studio automation |
| `playbison_automation.py` | Phases 1–4: navigate, filter, last page, scan non-VIP roles |
| `datastudio_automation.py` | Phases 1–5: modal, duplicate check, Data Studio, wallet, PaymentIQ, note |
| `macro_loader.py` | Utility: reads a `.js` file from `macros/` and substitutes `###KEY###` placeholders at runtime |

### JavaScript Macro Files (`macros/`)

All JS functions have been extracted from the Python files into individual readable `.js` files.
They are loaded at runtime via `load_macro("filename.js", KEY=value)`.

#### Playbison macros

| File | Phase | Purpose |
|---|---|---|
| `playbison_navigate.js` | Phase 1 | Navigate to Payments & Frauds → Withdrawals to Confirm |
| `playbison_filter.js` | Phase 2 | Set Player Status = Verified and click Generate |
| `playbison_goto_last_page.js` | Phase 3 | Read "X of Y" pagination and jump to last page via Go button |
| `playbison_scan_nonvip.js` | Phase 4 | Scan pages backwards for non-VIP roles; prompt Email\|ID when found |

#### Data Studio / Playbison Wallet macros

| File | Phase | Purpose |
|---|---|---|
| `ds_open_modal.js` | Part 2 | Open Payment Details modal (`###PLAYER_ID###`, `###PLAYER_EMAIL###`) |
| `ds_extract_modal.js` | Part 2 | Extract maskedAccount, wallet_id, first/last name, city, operator |
| `ds_check_duplicates.js` | Part 2 | Search Users by name + city for duplicates (`###FN###`, `###LN###`, `###CITY###`) |
| `ds_switch_email.js` | Part 3 | Switch to Bison BO data source and focus Email input |
| `ds_open_date_picker.js` | Part 3 | Open the date picker near UTC Time label |
| `ds_set_date_range.js` | Part 3 | Ensure "Include Today" is checked and click Apply |
| `ds_read_wd_ratio.js` | Part 3 | Read W/D ratio % from Data Studio table; returns MULTIBRAND if multiple rows |
| `ds_brand_filter.js` | Part 3 | Open Brand filter and deselect Fireball to isolate Bison Casino row |
| `ds_extract_player_id.js` | Part 4 | Extract numeric Player ID and Name from wallet page |
| `ds_open_notes.js` | Part 4 | Click the Notes tab (near "edit personal data", not the global menu) |
| `ds_check_transactions.js` | Part 4 | Filter Transactions by Redeem the Bonus; validate note column for "automatic" |
| `ds_payment_log.js` | Part 4 | Open Payment Log, select Pending/Completed, click Search |
| `ds_get_last_deposit.js` | Part 4 | Find first DEPOSIT row and copy its ID as `DEP_ID:value` |

#### PaymentIQ macros

| File | Phase | Purpose |
|---|---|---|
| `piq_check_login.js` | Part 5 | Detect if PaymentIQ auth portal is open; copies `LOGGED_OUT:YES/NO` |
| `piq_search_user.js` | Part 5 | Search for `user{id}` in the search box (`###PLAYER_ID###`) |
| `piq_check_results.js` | Part 5 | Extract Holder, Last Success, Account from results table |
| `ds_add_note.js` | Part 5 | Inject cancellation note into Notes textarea; set type = Important (`###NOTE_TEXT###`) |

### Dynamic Placeholder Convention

Macros with `###KEY###` markers receive runtime values from Python:

```python
# Static macro — no substitution needed
js = load_macro("playbison_navigate.js")

# Dynamic macro — ###KEY### placeholders replaced at runtime
js = load_macro("ds_open_modal.js", PLAYER_ID=player_id, PLAYER_EMAIL=player_email)
js = load_macro("ds_check_duplicates.js", FN=fn, LN=ln, CITY=city)
js = load_macro("piq_search_user.js", PLAYER_ID=extracted_id)
js = load_macro("ds_add_note.js", NOTE_TEXT=note_text)
```

