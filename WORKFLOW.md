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
