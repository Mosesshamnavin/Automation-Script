// ds_set_transaction_dates.js
// Uses the SAME proven helper functions from ds_check_transactions.js to find
// the Date From input and Search button, then runs computeAllPagesStack.
(function () {
  let dateFromStr = "###DATE_FROM###";
  let dateToStr   = "###DATE_TO###";

  // ── Helpers (copied verbatim from ds_check_transactions.js) ───────────────
  function getFrames() {
    let frames = [document];
    let iframes = document.querySelectorAll('iframe');
    for (let i of iframes) {
      try { if (i.contentDocument) frames.push(i.contentDocument); } catch(e){}
    }
    return frames;
  }

  function setVal(input, val) {
    try {
      let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      if (setter) setter.call(input, val);
      else input.value = val;
    } catch(e) { input.value = val; }
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
  }

  function simClick(el) {
    el.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window}));
    el.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, cancelable: true, view: window}));
    el.click();
  }

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
    } catch(err) {}
  }

  // Exact copy of findDateFromInput from ds_check_transactions.js
  function findDateFromInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if ((t.includes('date from') || (t.includes('date') && t.includes('from'))) && !t.includes('date to') && !t.includes('registered')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }
    return null;
  }

  // Find Date To input — same parent-walk approach but for "date to"
  function findDateToInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (t.includes('date to') && !t.includes('date from')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }
    return null;
  }

  function findSearchButton(doc) {
    if (!doc) return null;
    let btns = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"], a, div[role="button"]'));
    return btns.find(b => {
      let t = (b.textContent || b.value || '').toLowerCase().trim();
      return t === 'search' && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
    });
  }

  function findSearchButtonForInput(inputEl, doc) {
    if (inputEl) {
      let p = inputEl.parentElement;
      while (p && p !== (doc ? doc.body : null)) {
        let btns = Array.from(p.querySelectorAll('button, input, a, div[role="button"]'));
        let sBtn = btns.find(b => {
          let t = (b.textContent || b.value || '').toLowerCase().trim();
          return t === 'search' && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
        });
        if (sBtn) return sBtn;
        p = p.parentElement;
      }
    }
    return findSearchButton(doc);
  }

  // ── computeAllPagesStack (same logic as ds_check_transactions.js) ──────────
  function computeAllPagesStack(container, doneCallback) {
    let globalCounts = {};
    let seenIds = new Set();

    function parseCurrentPage(cont) {
      let tables = Array.from(cont.querySelectorAll('table'));
      let dataTbl = tables.find(t =>
        (t.offsetWidth > 0 || t.offsetHeight > 0) &&
        Array.from(t.querySelectorAll('th,td')).some(c => {
          let txt = c.textContent.toLowerCase().trim();
          return txt === 'out val' || txt === 'in val' || txt === 'wallet id';
        })
      );
      if (!dataTbl) return;

      let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
      let valIdx = -1, currIdx = -1, bonusBeforeIdx = -1, bonusAfterIdx = -1;

      for (let tr of allTrs) {
        let cells = Array.from(tr.children);
        for (let i = 0; i < cells.length; i++) {
          let txt = cells[i].textContent.toLowerCase().trim();
          if ((txt === 'val' || txt === 'out val' || txt === 'in val') && i + 1 < cells.length) {
            let next = cells[i+1].textContent.toLowerCase().trim();
            if (next === 'curr' || next === 'currency' || next === 'currval') {
              valIdx = i; currIdx = i + 1;
            }
          }
          if (txt === 'before' && i > 8) { bonusBeforeIdx = i; if (i+1 < cells.length) bonusAfterIdx = i+1; }
        }
        if (valIdx !== -1 && bonusBeforeIdx !== -1) break;
      }

      if (valIdx === -1) { valIdx = 5; currIdx = 7; }
      if (bonusBeforeIdx === -1) { bonusBeforeIdx = 13; bonusAfterIdx = 14; }

      let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > Math.max(currIdx, bonusAfterIdx));
      for (let tr of dataRows) {
        let idStr = tr.children[0] ? tr.children[0].textContent.trim() : '';
        if (!/^\d{6,15}$/.test(idStr)) continue;
        if (seenIds.has(idStr)) continue;
        seenIds.add(idStr);

        let bBefore = parseFloat((tr.children.length > bonusBeforeIdx ? tr.children[bonusBeforeIdx].textContent.trim() : '0').replace(',', '.')) || 0;
        let bAfter  = parseFloat((tr.children.length > bonusAfterIdx  ? tr.children[bonusAfterIdx].textContent.trim()  : '0').replace(',', '.')) || 0;
        if (bBefore === bAfter) continue;

        let valStr  = tr.children[valIdx].textContent.trim();
        let currStr = tr.children[currIdx].textContent.trim();
        if (!valStr) continue;
        let num = parseFloat(valStr.replace(',', '.'));
        if (isNaN(num)) continue;

        let currCode = currStr ? currStr.split(' ')[0] : '';
        let currFormatted = currCode ? currCode.charAt(0).toUpperCase() + currCode.slice(1).toLowerCase() : '';
        let absVal = Math.abs(num);
        let valFormatted = `-${absVal}`;
        if (valFormatted.endsWith('.00')) valFormatted = valFormatted.slice(0, -3);

        let key = `${valFormatted}${currFormatted}`;
        globalCounts[key] = (globalCounts[key] || 0) + 1;
      }
    }

    function findNextButton(cont) {
      let btns = Array.from(cont.querySelectorAll('button, a, input, div[role="button"], li'));
      return btns.find(b => {
        let txt = (b.textContent || b.value || '').toLowerCase().trim();
        let isNext = txt === 'next' || txt === 'next→' || txt === 'next →' || txt === '→' || (txt.includes('next') && txt.length < 10);
        let isDisabled = b.disabled || b.classList.contains('disabled') || (b.parentElement && b.parentElement.classList.contains('disabled'));
        return isNext && !isDisabled && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
    }

    function step() {
      let cont = container ? container : getFrames()[0];
      parseCurrentPage(cont);
      let nextBtn = findNextButton(cont);
      if (nextBtn) {
        simClick(nextBtn);
        setTimeout(() => { step(); }, 3000);
      } else {
        let keys = Object.keys(globalCounts).sort((a, b) => Math.abs(parseFloat(b)||0) - Math.abs(parseFloat(a)||0));
        let resultLines = keys.map(k => `${k}*${globalCounts[k]}`);
        copyToClipboard("TRANS_RESULT:" + (resultLines.join('\n') || "NO_STACK"));
      }
    }

    step();
  }

  // ── MAIN FLOW ──────────────────────────────────────────────────────────────
  let found = false;
  for (let doc of getFrames()) {
    if (!doc) continue;
    let dateFromInput = findDateFromInput(doc);
    if (!dateFromInput) continue;

    let dateToInput = findDateToInput(doc);
    let searchBtn   = findSearchButtonForInput(dateFromInput, doc);

    setVal(dateFromInput, dateFromStr);
    if (dateToInput) setVal(dateToInput, dateToStr);
    if (searchBtn) {
      setTimeout(() => {
        simClick(searchBtn);
        // Wait 8s for results then run stack check
        setTimeout(() => {
          computeAllPagesStack(doc, function(stackResult) {
            copyToClipboard("TRANS_RESULT:" + (stackResult || "NO_STACK"));
          });
        }, 8000);
      }, 500);
      found = true;
      copyToClipboard("SET_DATES:SUCCESS");
    } else {
      copyToClipboard("SET_DATES:NO_SEARCH_BTN");
    }
    break;
  }

  if (!found) {
    copyToClipboard("SET_DATES:INPUTS_NOT_FOUND");
  }
})();
