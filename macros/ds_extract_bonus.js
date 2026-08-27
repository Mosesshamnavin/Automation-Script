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
      try { navigator.clipboard.writeText(text); } catch(e){}
      try { prompt('BONUS_RESULT:', text); } catch(e){}
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

  // ── Find all bonus tables (Active Queue + Historical) ──────────────────────
  function getAllBonusTables() {
    let list = [];
    for (let doc of getFrames()) {
      if (!doc) continue;
      let tables = Array.from(doc.querySelectorAll('table'));
      for (let t of tables) {
        if (t.offsetWidth === 0 && t.offsetHeight === 0) continue;
        let ths = Array.from(t.querySelectorAll('th')).map(th => th.textContent.toLowerCase().trim());
        let isBonusTbl = ths.some(txt => txt === 'bonus name' || txt === 'bonus code' || txt.includes('application date') || txt.includes('enqueue date'));
        if (isBonusTbl) {
          list.push({ tbl: t, doc: doc });
        }
      }
    }
    return list;
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
        if (txt === 'bonus name' || txt.includes('bonus name') || (txt.includes('name') && !txt.includes('operator'))) nameIdx = i;
        if (txt === 'bonus code' || txt.includes('code')) codeIdx = i;
        if (txt.includes('application date') || txt.includes('app date') || txt.includes('apply date')) appDateIdx = i;
        if (txt.includes('enqueue date') || txt.includes('created') || (txt.includes('date') && enqDateIdx === -1)) enqDateIdx = i;
      }
      if (nameIdx !== -1 && (appDateIdx !== -1 || enqDateIdx !== -1)) break;
    }

    if (nameIdx === -1) nameIdx = 2;
    if (codeIdx === -1) codeIdx = 3;
    if (appDateIdx === -1 && enqDateIdx === -1) {
      appDateIdx = 4;
      enqDateIdx = 5;
    }

    let dTarget = new Date(targetDateYMD);
    let targetDay = !isNaN(dTarget.getTime()) ? dTarget.toISOString().split('T')[0] : targetDateYMD;
    let prevDay = !isNaN(dTarget.getTime()) ? new Date(dTarget.getTime() - 86400000).toISOString().split('T')[0] : '';
    let nextDay = !isNaN(dTarget.getTime()) ? new Date(dTarget.getTime() + 86400000).toISOString().split('T')[0] : '';

    let dataRows = allTrs.filter(tr => tr.querySelector('td'));

    for (let tr of dataRows) {
      let bName = (nameIdx !== -1 && tr.children[nameIdx]) ? tr.children[nameIdx].textContent.trim() : '';
      let bCode = (codeIdx !== -1 && tr.children[codeIdx]) ? tr.children[codeIdx].textContent.trim() : '';

      // If bName is still empty or looks like an ID, check all cells for a bonus-like name
      if (!bName || bName.toLowerCase() === 'null') {
        for (let cell of tr.children) {
          let cText = cell.textContent.trim();
          if (cText && cText.length > 3 && !/^\d+$/.test(cText) && !/^\d{4}-\d{2}/.test(cText) &&
              (cText.includes('_') || cText.includes('NDB') || cText.includes('BONUS') || cText.includes('AFF') || cText.includes('FB') || cText.includes('FS') || cText.includes('VIP') || cText.includes('Reload') || cText.includes('Deposit') || cText.includes('Free'))) {
            bName = cText;
            break;
          }
        }
      }

      let rowText = tr.textContent;
      let isExactDay = (targetDay && rowText.includes(targetDay)) || (targetDateYMD && rowText.includes(targetDateYMD));
      let isNearDay = (prevDay && rowText.includes(prevDay)) || (nextDay && rowText.includes(nextDay));

      if (isExactDay) {
        if (bName && bName.toLowerCase() !== 'null') {
          return { exact: true, name: bName };
        } else if (bCode && bCode.toLowerCase() !== 'null') {
          return { exact: true, name: bCode };
        }
      }

      let eff = bName || bCode;
      if (eff && eff.toLowerCase() !== 'null' && (isExactDay || isNearDay)) {
        if (!closestBonus) closestBonus = eff;
      } else if (eff && eff.toLowerCase() !== 'null' && !closestBonus) {
        closestBonus = eff;
      }
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
    if (closestBonus && closestBonus.toLowerCase() !== 'null') {
      copyToClipboard("BONUS_RESULT:" + closestBonus);
    } else {
      let allTbls = getAllBonusTables();
      for (let item of allTbls) {
        let trs = Array.from(item.tbl.querySelectorAll('tr')).filter(r => r.querySelector('td'));
        if (trs.length > 0) {
          for (let cell of trs[0].children) {
            let txt = cell.textContent.trim();
            if (txt && txt.length > 3 && !/^\d+$/.test(txt) && !/^\d{4}-\d{2}/.test(txt) && (txt.includes('_') || txt.includes('NDB') || txt.includes('BONUS') || txt.includes('AFF') || txt.includes('FB') || txt.includes('FS') || txt.includes('VIP') || txt.includes('Reload') || txt.includes('Deposit') || txt.includes('Free') || txt.includes('Bonus'))) {
              copyToClipboard("BONUS_RESULT:" + txt);
              return;
            }
          }
        }
      }
      copyToClipboard("BONUS_RESULT:NOT_FOUND");
    }
  }

  function doScan() {
    // 1. Check all visible bonus tables on the page (including Active Queue)
    let allTbls = getAllBonusTables();
    for (let item of allTbls) {
      let res = scanCurrentPage(item.tbl);
      if (res && res.exact) {
        copyToClipboard("BONUS_RESULT:" + res.name);
        return;
      }
    }

    // 2. Locate historical table for pagination
    let found = findHistoricalTable();
    if (!found) {
      finishScan();
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
