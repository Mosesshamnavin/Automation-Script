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

  function simClick(el) {
    if (!el) return;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof el.click === 'function') el.click();
  }

  let topNoteText = "";
  let topNoteDate = "";
  let ccVer = false;
  let ccVer90 = false;
  let ibanVer = false;
  let hasPaymentNotes = false;

  let now = new Date();
  let cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  function findNotesTable() {
    for (let doc of getFrames()) {
      let tables = Array.from(doc.querySelectorAll('table'));
      for (let tbl of tables) {
        if (tbl.offsetWidth === 0 && tbl.offsetHeight === 0) continue;
        let rows = Array.from(tbl.querySelectorAll('tr'));
        if (rows.length === 0) continue;
        let headerCells = Array.from(rows[0].querySelectorAll('th, td'));
        let noteIdx = headerCells.findIndex(c => {
          let t = c.textContent.trim().toLowerCase();
          return t === 'note' || t === 'notes' || t === 'comment' || t === 'text';
        });
        if (noteIdx !== -1) {
          return { tbl: tbl, doc: doc };
        }
      }
    }
    return null;
  }

  function scanCurrentTableRows(tbl) {
    let rows = Array.from(tbl.querySelectorAll('tr'));
    if (rows.length < 2) return;
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
    if (noteIdx === -1) return;

    let dataRows = rows.filter(tr => tr.querySelector('td') && tr !== rows[0]);
    if (dataRows.length > 0 && !topNoteText) {
      if (dataRows[0].children.length > noteIdx) {
        topNoteText = dataRows[0].children[noteIdx].textContent.trim();
      }
      if (dateIdx !== -1 && dataRows[0].children.length > dateIdx) {
        topNoteDate = dataRows[0].children[dateIdx].textContent.trim();
      }
    }

    for (let tr of dataRows) {
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
      let cellNorm = cellLower.replace(/[\s_\-\+\*\/]/g, '');

      let rowDate = null;
      if (dateIdx !== -1 && tr.children.length > dateIdx) {
        try {
          let d = new Date(tr.children[dateIdx].textContent.trim().replace('T', ' '));
          if (!isNaN(d.getTime())) rowDate = d;
        } catch(e) {}
      }

      let within90 = rowDate ? (rowDate >= cutoff90) : true;

      // CC verified check
      let isCCVer = cellNorm.includes('ccver') || cellNorm.includes('ccverified') ||
                    cellNorm.includes('cardverified') || cellNorm.includes('cardver') ||
                    /\bcc\s+[\w\*]+\s+ver\b/.test(cellLower);
      if (isCCVer) {
        ccVer = true;
        if (within90) ccVer90 = true;
      }

      // IBAN / Account verified check (e.g. 'PL54114020040000380283660339 ver', 'IBAN ... ver', '... ver')
      let isIbanOrAcc = cellLower.includes('iban')
        || /\b[a-z]{2}\d{10,32}\b/i.test(cellLower)
        || /\b\d{16,32}\b/.test(cellLower);

      if (isIbanOrAcc && (cellLower.includes('ver') || /\bver\b/.test(cellLower))) {
        if (within90) {
          ibanVer = true;
        }
      }
    }
  }

  function findNextPageButton(tbl) {
    let container = tbl.parentElement;
    while (container && container !== document.body) {
      let allBtns = Array.from(container.querySelectorAll('button, a, input[type="button"], div[role="button"]'));
      let nextBtn = allBtns.find(b => {
        let txt = (b.textContent || b.value || '').toLowerCase().trim();
        let isNext = txt === 'next' || txt.startsWith('next') || txt.includes('next') || txt === 'next→' || txt === 'next →';
        let isDisabled = b.disabled || b.classList.contains('disabled') || (b.parentElement && b.parentElement.classList.contains('disabled'));
        return isNext && !isDisabled && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
      if (nextBtn) return nextBtn;
      container = container.parentElement;
    }
    return null;
  }

  function getFirstRowSignature(tbl) {
    let trs = Array.from(tbl.querySelectorAll('tr')).filter(r => r.querySelector('td'));
    return trs.length > 0 ? trs[0].textContent.trim().substring(0, 60) : '';
  }

  function finishAndCopy() {
    let lower = (topNoteText || '').toLowerCase();
    let ccNumVerified = /\bcc\s+[\w\*]+\s+ver\b/.test(lower);
    let needsVerifyDocs = /\breq\b/.test(lower)
      || /\brem\b/.test(lower)
      || lower.includes('waiting for cc')
      || (/\bcc\s+\d/.test(lower) && !ccNumVerified)
      || lower.includes('waiting for doc')
      || lower.includes('send doc')
      || lower.includes('verify cc')
      || lower.includes('verify card');

    let hasReq = needsVerifyDocs ? "YES" : "NO";
    let ccVerFlag = ccVer ? "YES" : "NO";
    let ccVer90Flag = ccVer90 ? "YES" : "NO";
    let ibanVerFlag = ibanVer ? "YES" : "NO";
    let paymentNotesFlag = hasPaymentNotes ? "YES" : "NO";

    let input = document.createElement('input');
    input.value = "REQ_FOUND:" + hasReq
      + "|TEXT:" + (topNoteText ? topNoteText.replace(/[\r\n]+/g, ' ') : "NOTES_NOT_FOUND")
      + "|TOP_NOTE_DATE:" + (topNoteDate ? topNoteDate.replace(/[\r\n]+/g, ' ') : "")
      + "|CC_VER:" + ccVerFlag
      + "|CC_VER_90:" + ccVer90Flag
      + "|IBAN_VER:" + ibanVerFlag
      + "|PAYMENT_NOTES:" + paymentNotesFlag;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  let pageNum = 1;
  const MAX_PAGES = 8;

  function doScanPages() {
    let found = findNotesTable();
    if (!found) {
      finishAndCopy();
      return;
    }

    scanCurrentTableRows(found.tbl);

    // If IBAN is already verified and CC is verified within 90 days, or we've reached max pages, stop and return
    if ((ibanVer && ccVer90) || pageNum >= MAX_PAGES) {
      finishAndCopy();
      return;
    }

    let nextBtn = findNextPageButton(found.tbl);
    if (!nextBtn) {
      finishAndCopy();
      return;
    }

    let oldSig = getFirstRowSignature(found.tbl);
    pageNum++;
    simClick(nextBtn);

    let attempts = 0;
    function waitForNextPage() {
      attempts++;
      let cur = findNotesTable();
      if (cur) {
        let newSig = getFirstRowSignature(cur.tbl);
        if (newSig && newSig !== oldSig) {
          setTimeout(doScanPages, 300);
          return;
        }
      }
      if (attempts < 15) {
        setTimeout(waitForNextPage, 300);
      } else {
        doScanPages();
      }
    }

    setTimeout(waitForNextPage, 400);
  }

  doScanPages();
})();
