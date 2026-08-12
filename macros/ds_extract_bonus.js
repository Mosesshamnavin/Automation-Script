(function() {
  let rawTargetDate = "###STACK_DATE###";
  let targetTime = new Date(rawTargetDate).getTime();
  let targetDateYMD = rawTargetDate;
  if (targetDateYMD.includes("T")) {
    targetDateYMD = targetDateYMD.split("T")[0];
  } else if (targetDateYMD.includes(" ")) {
    targetDateYMD = targetDateYMD.split(" ")[0];
  }

  let closestBonus = null;
  let minDiff = Infinity;

  function copyToClipboard(text) {
    try {
      let ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0.01';
      document.body.appendChild(ta);
      ta.select();
      ta.focus();
      document.execCommand('copy');
      setTimeout(() => { try { document.body.removeChild(ta); } catch(e){} }, 30000);
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
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof el.click === 'function') el.click();
  }

  function setVal(el, val) {
    try { el.focus(); } catch(e) {}
    let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (setter) setter.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('keyup', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // ── Find historical bonus table ────────────────────────────────────────────
  function findHistoricalTable() {
    for (let doc of getFrames()) {
      if (!doc) continue;
      let tables = Array.from(doc.querySelectorAll('table'));
      // Must find the HISTORICAL table, which has 'Application date'
      // (The active 'Bonus queue' table only has 'Enqueue date')
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

  // ── Scan one page for the target date ────────────────────────────────────
  function scanCurrentPage(tbl) {
    let allTrs = Array.from(tbl.querySelectorAll('tr'));
    let nameIdx = -1, dateIdx = -1;
    let passedTarget = false;

    for (let tr of allTrs) {
      if (!tr.querySelector('th')) continue;
      let cells = Array.from(tr.children);
      for (let i = 0; i < cells.length; i++) {
        let txt = cells[i].textContent.toLowerCase().trim();
        if (txt === 'bonus name') nameIdx = i;
        if (txt.includes('application date')) dateIdx = i;
      }
      if (nameIdx !== -1 && dateIdx !== -1) break;
    }

    if (nameIdx === -1) nameIdx = 2;
    if (dateIdx === -1) dateIdx = 4;

    let maxIdx = Math.max(nameIdx, dateIdx);
    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > maxIdx);
    for (let tr of dataRows) {
      let rawDateStr = (tr.children[dateIdx].textContent || '').trim();
      let cleanDateStr = rawDateStr.replace(/\s+/g, ' ').trim();
      let parseableDateStr = cleanDateStr.replace(' ', 'T');
      let bonusName = (tr.children[nameIdx].textContent || '').trim();
      if (!bonusName) continue;

      if (cleanDateStr.includes(targetDateYMD) || parseableDateStr.includes(targetDateYMD)) {
        return { exact: true, name: bonusName };
      }

      let rowTime = new Date(parseableDateStr).getTime();
      if (!isNaN(rowTime) && !isNaN(targetTime)) {
        let diff = Math.abs(rowTime - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestBonus = bonusName;
        }
        if (rowTime < targetTime) {
          passedTarget = true;
        }
      }
    }
    
    return { exact: false, stopScan: passedTarget };
  }

  // ── Find Next button in the historical section ────────────────────────────
  function findNextBtn(tbl) {
    let container = tbl.parentElement;
    while (container && container !== document.body) {
      let allBtns = Array.from(container.querySelectorAll('button, a, input[type="button"], div[role="button"]'));
      let nextBtn = allBtns.find(b => {
        let txt = (b.textContent || b.value || '').toLowerCase().trim();
        let isNext = txt === 'next' || txt.startsWith('next');
        let isDisabled = b.disabled || b.classList.contains('disabled') ||
                         (b.parentElement && b.parentElement.classList.contains('disabled'));
        return isNext && !isDisabled && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
      if (nextBtn) return { goBtn: null, nextBtn: nextBtn };

      let goBtn = allBtns.find(b =>
        (b.textContent || b.value || '').toLowerCase().trim() === 'go' &&
        (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0)
      );
      let pageInput = Array.from(container.querySelectorAll('input[type="text"], input[type="number"]')).find(inp =>
        inp.offsetWidth > 0 && /^\d+$/.test((inp.value || '').trim())
      );
      if (goBtn && pageInput) return { goBtn: goBtn, pageInput: pageInput };

      container = container.parentElement;
    }
    return null;
  }

  // ── Paginator ─────────────────────────────────────────────────────────────
  let currentPage = 1;
  const MAX_PAGES = 15;

  function finishScan() {
    if (closestBonus) {
      copyToClipboard("BONUS_RESULT:" + closestBonus);
    } else {
      copyToClipboard("BONUS_RESULT:NOT_FOUND");
    }
  }

  function checkPage() {
    let found = findHistoricalTable();
    if (!found) {
      if (currentPage === 1) {
        setTimeout(checkPage, 2000);
        currentPage = 1.5;
      } else {
        finishScan();
      }
      return;
    }

    let result = scanCurrentPage(found.tbl);
    if (result && result.exact) {
      copyToClipboard("BONUS_RESULT:" + result.name);
      return;
    }
    if (result && result.stopScan && closestBonus) {
      finishScan();
      return;
    }

    if (currentPage >= MAX_PAGES) {
      finishScan();
      return;
    }

    let nextEl = findNextBtn(found.tbl);
    if (!nextEl) {
      finishScan();
      return;
    }

    currentPage++;
    if (nextEl.goBtn) {
      setVal(nextEl.pageInput, String(currentPage));
      setTimeout(() => { simClick(nextEl.goBtn); setTimeout(checkPage, 3000); }, 300);
    } else {
      simClick(nextEl.nextBtn);
      setTimeout(checkPage, 3000);
    }
  }

  // ── Entry point ───────────────────────────────────────────────────────────
  checkPage();
})();
