(function() {
  let rawTargetDate = "###STACK_DATE###";
  let targetDateYMD = rawTargetDate;
  if (targetDateYMD.includes("T")) {
    targetDateYMD = targetDateYMD.split("T")[0];
  } else if (targetDateYMD.includes(" ")) {
    targetDateYMD = targetDateYMD.split(" ")[0];
  }
  let targetTime = new Date(targetDateYMD).getTime();

  let closestBonus = null;
  let minDiff = Infinity;

  function copyToClipboard(text) {
    try {
      let ta = document.getElementById('__bonus_result_holder__');
      if (!ta) {
        ta = document.createElement('textarea');
        ta.id = '__bonus_result_holder__';
        ta.style.position = 'fixed';
        ta.style.top = '10px';
        ta.style.left = '10px';
        ta.style.zIndex = '999999';
        ta.style.width = '300px';
        ta.style.height = '60px';
        ta.style.backgroundColor = '#ffffcc';
        ta.style.border = '2px solid #333';
        document.body.appendChild(ta);
      }
      ta.value = text;
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch(e){}
    } catch (e) {}
  }

  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
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

  // ── Find historical bonus table ────────────────────────────────────────────
  function findHistoricalTable() {
    for (let doc of getFrames()) {
      if (!doc) continue;
      let tables = Array.from(doc.querySelectorAll('table'));
      let histTbl = tables.find(t =>
        (t.offsetWidth > 0 || t.offsetHeight > 0) &&
        Array.from(t.querySelectorAll('th')).some(th => {
          let txt = th.textContent.toLowerCase().trim();
          return txt.includes('application date');
        })
      );
      if (histTbl) return { tbl: histTbl, doc: doc };
    }
    return null;
  }

  // ── Scan current page for matching bonus date ──────────────────────────────
  function scanCurrentPage(tbl) {
    let allTrs = Array.from(tbl.querySelectorAll('tr'));
    let nameIdx = -1, codeIdx = -1, appDateIdx = -1, enqDateIdx = -1;

    for (let tr of allTrs) {
      if (!tr.querySelector('th')) continue;
      let cells = Array.from(tr.children);
      for (let i = 0; i < cells.length; i++) {
        let txt = cells[i].textContent.toLowerCase().trim();
        if (txt === 'bonus name') nameIdx = i;
        if (txt === 'bonus code') codeIdx = i;
        if (txt.includes('application date')) appDateIdx = i;
        if (txt.includes('enqueue date')) enqDateIdx = i;
      }
      if (appDateIdx !== -1) break;
    }

    if (nameIdx === -1) nameIdx = 2;
    if (codeIdx === -1) codeIdx = 3;
    if (appDateIdx === -1) appDateIdx = 4;
    if (enqDateIdx === -1) enqDateIdx = 5;

    let maxIdx = Math.max(nameIdx, codeIdx, appDateIdx, enqDateIdx);
    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > maxIdx);

    let dateMatchWithBonusName = null;
    let dateMatchWithCodeOnly = null;

    for (let tr of dataRows) {
      let bName = (tr.children[nameIdx] ? tr.children[nameIdx].textContent : '').trim();
      let bCode = (tr.children[codeIdx] ? tr.children[codeIdx].textContent : '').trim();

      let appDateStr = (tr.children[appDateIdx] ? tr.children[appDateIdx].textContent : '').trim();
      let enqDateStr = (tr.children[enqDateIdx] ? tr.children[enqDateIdx].textContent : '').trim();

      let isDateMatch = (appDateStr && appDateStr.includes(targetDateYMD)) ||
                        (enqDateStr && enqDateStr.includes(targetDateYMD));

      if (isDateMatch) {
        if (bName) {
          // Explicit Bonus Name found on target date — HIGHEST PRIORITY!
          return { exact: true, name: bName };
        } else if (bCode && !dateMatchWithCodeOnly) {
          dateMatchWithCodeOnly = bCode;
        }
      }

      // Fallback tracking
      let eff = bName || bCode;
      let dateToCheck = appDateStr || enqDateStr;
      if (eff && dateToCheck) {
        let rowTime = new Date(dateToCheck.replace(' ', 'T')).getTime();
        if (!isNaN(rowTime) && !isNaN(targetTime)) {
          let diff = Math.abs(rowTime - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestBonus = eff;
          }
        }
      }
    }

    if (dateMatchWithCodeOnly) {
      return { exact: true, name: dateMatchWithCodeOnly };
    }

    return { exact: false };
  }

  // ── Find Next / Page controls for historical section ───────────────────────
  function findNextButton(tbl) {
    let container = tbl.parentElement;
    while (container && container !== document.body) {
      let allBtns = Array.from(container.querySelectorAll('button, a, input[type="button"], div[role="button"]'));
      let nextBtn = allBtns.find(b => {
        let txt = (b.textContent || b.value || '').toLowerCase().trim();
        let isNext = txt === 'next' || txt.startsWith('next') || txt.includes('next') || txt === 'next→' || txt === 'next →';
        let isDisabled = b.disabled || b.classList.contains('disabled') ||
                         (b.parentElement && b.parentElement.classList.contains('disabled'));
        return isNext && !isDisabled && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });

      if (nextBtn) return nextBtn;
      container = container.parentElement;
    }
    return null;
  }

  function getFirstRowSignature(tbl) {
    let trs = Array.from(tbl.querySelectorAll('tr')).filter(r => r.querySelector('td'));
    return trs.length > 0 ? trs[0].textContent.trim().substring(0, 50) : '';
  }

  // ── Paginator Loop ────────────────────────────────────────────────────────
  let pageCount = 1;
  const MAX_PAGES = 15;

  function finishScan() {
    if (closestBonus) {
      copyToClipboard("BONUS_RESULT:" + closestBonus);
    } else {
      copyToClipboard("BONUS_RESULT:NOT_FOUND");
    }
  }

  function doScan() {
    let found = findHistoricalTable();
    if (!found) {
      finishScan();
      return;
    }

    let result = scanCurrentPage(found.tbl);
    if (result && result.exact) {
      copyToClipboard("BONUS_RESULT:" + result.name);
      return;
    }

    if (pageCount >= MAX_PAGES) {
      finishScan();
      return;
    }

    let nextBtn = findNextButton(found.tbl);
    if (!nextBtn) {
      finishScan();
      return;
    }

    let oldSig = getFirstRowSignature(found.tbl);
    pageCount++;
    simClick(nextBtn);

    // Wait for page to change
    let waitAttempts = 0;
    function waitForPageChange() {
      waitAttempts++;
      let cur = findHistoricalTable();
      if (cur) {
        let newSig = getFirstRowSignature(cur.tbl);
        if (newSig && newSig !== oldSig) {
          // Page successfully loaded new data!
          setTimeout(doScan, 400);
          return;
        }
      }
      if (waitAttempts < 20) {
        setTimeout(waitForPageChange, 400);
      } else {
        // Fallback: proceed to scan anyway
        doScan();
      }
    }

    setTimeout(waitForPageChange, 600);
  }

  // ── Entry point ───────────────────────────────────────────────────────────
  setTimeout(doScan, 500);
})();
