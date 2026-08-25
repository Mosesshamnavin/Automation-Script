(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try {
        if (f.contentDocument || f.contentWindow.document)
          docs.push(f.contentDocument || f.contentWindow.document);
      } catch (e) {}
    }
    return docs;
  }

  // ── STEP 1: Get top note text (same proven logic as original) ────────────────
  function getTopNote() {
    // Primary: find table with a 'note'/'notes'/'comment'/'text' column header
    for (let doc of getFrames()) {
      let tables = Array.from(doc.querySelectorAll('table'));
      for (let tbl of tables) {
        let rows = Array.from(tbl.querySelectorAll('tr'));
        if (rows.length === 0) continue;
        let headerCells = Array.from(rows[0].querySelectorAll('th, td'));
        let noteIdx = headerCells.findIndex(c => {
          let t = c.textContent.trim().toLowerCase();
          return t === 'note' || t === 'notes' || t === 'comment' || t === 'text';
        });
        if (noteIdx !== -1) {
          let dataRows = rows.filter(tr => tr.querySelector('td') && tr !== rows[0]);
          if (dataRows.length > 0) {
            let topRow = dataRows[0];
            if (topRow.children.length > noteIdx) {
              return topRow.children[noteIdx].textContent.trim();
            }
          }
        }
      }
    }
    // Fallback: any table that looks like a notes table — take last cell of first data row
    for (let doc of getFrames()) {
      let tables = Array.from(doc.querySelectorAll('table'));
      for (let tbl of tables) {
        let rows = Array.from(tbl.querySelectorAll('tr'));
        if (rows.length > 1) {
          let tblText = tbl.textContent.toLowerCase();
          if ((tblText.includes('note') || tblText.includes('comment')) &&
              (tblText.includes('creator') || tblText.includes('author') ||
               tblText.includes('created') || tblText.includes('date'))) {
            let dataRows = rows.filter(tr => tr.querySelector('td') && tr !== rows[0]);
            if (dataRows.length > 0) {
              let cells = Array.from(dataRows[0].querySelectorAll('td'));
              if (cells.length > 0) {
                return cells[cells.length - 1].textContent.trim();
              }
            }
          }
        }
      }
    }
    return '';
  }

  // ── STEP 2: Scan ALL note rows for CC ver, IBAN ver, and Payment/Important notes ──
  function scanAllNotes() {
    let ccVer = false;
    let ccVer90 = false;
    let ibanVer = false;
    let hasPaymentNotes = false;
    let now = new Date();
    let cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    let cutoff180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    for (let doc of getFrames()) {
      let tables = Array.from(doc.querySelectorAll('table'));
      for (let tbl of tables) {
        let rows = Array.from(tbl.querySelectorAll('tr'));
        if (rows.length < 2) continue;
        let headerCells = Array.from(rows[0].querySelectorAll('th, td'));
        let noteIdx = headerCells.findIndex(c => {
          let t = c.textContent.trim().toLowerCase();
          return t === 'note' || t === 'notes' || t === 'comment' || t === 'text';
        });
        let dateIdx = headerCells.findIndex(c => {
          let t = c.textContent.trim().toLowerCase();
          return t === 'created' || t === 'date' || t === 'created at';
        });
        let typeIdx = headerCells.findIndex(c => {
          let t = c.textContent.trim().toLowerCase();
          return t === 'type' || t === 'note type';
        });
        if (noteIdx === -1) continue;

        let dataRows = rows.filter(tr => tr.querySelector('td') && tr !== rows[0]);
        for (let tr of dataRows) {
          // Check for payment or important note types/badges
          if (typeIdx !== -1 && tr.children.length > typeIdx) {
            let typeText = tr.children[typeIdx].textContent.trim().toLowerCase();
            if (typeText.includes('payment') || typeText.includes('important')) {
              hasPaymentNotes = true;
            }
          }
          let rowText = tr.textContent.toLowerCase();
          if (rowText.includes('payment') || rowText.includes('important') ||
              /\bwd\s+\d/.test(rowText) || /\bdep\s+\d/.test(rowText)) {
            hasPaymentNotes = true;
          }

          if (tr.children.length <= noteIdx) continue;
          let cellText = tr.children[noteIdx].textContent.trim();
          let cellLower = cellText.toLowerCase();
          let cellNorm  = cellLower.replace(/[\s_\-\+\*\/]/g, '');

          // CC verified check (lifetime and within 90 days / 3 months)
          let isCCVer = cellNorm.includes('ccver') || cellNorm.includes('ccverified') ||
                        cellNorm.includes('cardverified') || cellNorm.includes('cardver') ||
                        /\bcc\s+[\w\*]+\s+ver\b/.test(cellLower);
          if (isCCVer) {
            ccVer = true;
            let within90 = true;
            if (dateIdx !== -1 && tr.children.length > dateIdx) {
              try {
                let d = new Date(tr.children[dateIdx].textContent.trim().replace('T', ' '));
                if (!isNaN(d.getTime())) within90 = d >= cutoff90;
              } catch(e) {}
            }
            if (within90) ccVer90 = true;
          }

          // IBAN / Account verified — within 180 days only
          let isIbanOrAcc = cellLower.includes('iban')
            || /\b[a-z]{2}\d{10,32}\b/i.test(cellLower)
            || /\b\d{16,32}\b/.test(cellLower);

          if (!ibanVer && isIbanOrAcc) {
            let withinCutoff = true;
            if (dateIdx !== -1 && tr.children.length > dateIdx) {
              try {
                let d = new Date(tr.children[dateIdx].textContent.trim().replace('T', ' '));
                if (!isNaN(d.getTime())) withinCutoff = d >= cutoff180;
              } catch(e) {}
            }
            if (withinCutoff && (/\bver\b/.test(cellLower) || cellLower.includes(' ver') || cellNorm.includes('ver'))) {
              ibanVer = true;
            }
          }
        }
      }
    }
    return { ccVer: ccVer, ccVer90: ccVer90, ibanVer: ibanVer, hasPaymentNotes: hasPaymentNotes };
  }

  // ── STEP 3: Assemble and copy result ────────────────────────────────────────
  let text   = getTopNote();
  let lower  = (text || '').toLowerCase();

  let ccNumVerified = /\bcc\s+[\w\*]+\s+ver\b/.test(lower);
  let needsVerifyDocs = /\breq\b/.test(lower)
    || /\brem\b/.test(lower)
    || lower.includes('waiting for cc')
    || (/\bcc\s+\d/.test(lower) && !ccNumVerified)
    || lower.includes('waiting for doc')
    || lower.includes('send doc')
    || lower.includes('verify cc')
    || lower.includes('verify card');

  let flags = { ccVer: false, ccVer90: false, ibanVer: false, hasPaymentNotes: false };
  try { flags = scanAllNotes(); } catch(e) {}

  let hasReq          = needsVerifyDocs       ? "YES" : "NO";
  let ccVerFlag       = flags.ccVer           ? "YES" : "NO";
  let ccVer90Flag     = flags.ccVer90         ? "YES" : "NO";
  let ibanVerFlag     = flags.ibanVer         ? "YES" : "NO";
  let paymentNotesFlag = flags.hasPaymentNotes ? "YES" : "NO";

  let input = document.createElement('input');
  input.value = "REQ_FOUND:" + hasReq
    + "|TEXT:" + (text ? text.replace(/[\r\n]+/g, ' ') : "NOTES_NOT_FOUND")
    + "|CC_VER:" + ccVerFlag
    + "|CC_VER_90:" + ccVer90Flag
    + "|IBAN_VER:" + ibanVerFlag
    + "|PAYMENT_NOTES:" + paymentNotesFlag;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();
