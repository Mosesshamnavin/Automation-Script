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

  function setVal(el, val) {
    if (!el) return;
    try { el.focus(); } catch (e) {}
    let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (setter) setter.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('keyup', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function setSelectVal(el, optionIndexOrVal) {
    if (!el) return;
    try { el.focus(); } catch (e) {}
    if (typeof optionIndexOrVal === 'number') {
      el.selectedIndex = optionIndexOrVal;
      if (el.options && el.options[optionIndexOrVal]) {
        let setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        if (setter) setter.call(el, el.options[optionIndexOrVal].value);
        else el.value = el.options[optionIndexOrVal].value;
      }
    } else {
      let opt = Array.from(el.options || []).find(o => o.value === optionIndexOrVal || o.textContent.toLowerCase().trim().includes(optionIndexOrVal.toLowerCase()));
      if (opt) {
        el.selectedIndex = opt.index;
        let setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        if (setter) setter.call(el, opt.value);
        else el.value = opt.value;
      } else {
        el.selectedIndex = 0;
        let setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        if (setter && el.options && el.options.length > 0) setter.call(el, el.options[0].value);
        else el.value = '';
      }
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function getActiveModalContainer(tTab, doc) {
    if (tTab) {
      let p = tTab.parentElement;
      while (p && p !== doc.body) {
        let inputs = p.querySelectorAll('input');
        if (inputs.length >= 4) {
          return p;
        }
        p = p.parentElement;
      }
    }
    return doc;
  }

  function findDateFromInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let attr = ((inp.placeholder || '') + ' ' + (inp.name || '') + ' ' + (inp.id || '') + ' ' + (inp.getAttribute('ng-model') || '')).toLowerCase();
      if ((attr.includes('date') && attr.includes('from')) || attr.includes('datefrom') || attr.includes('date_from')) {
        return inp;
      }
    }
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

  function findDateToInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let attr = ((inp.placeholder || '') + ' ' + (inp.name || '') + ' ' + (inp.id || '') + ' ' + (inp.getAttribute('ng-model') || '')).toLowerCase();
      if ((attr.includes('date') && attr.includes('to')) || attr.includes('dateto') || attr.includes('date_to')) {
        return inp;
      }
    }
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if ((t.includes('date to') || (t.includes('date') && t.includes('to'))) && !t.includes('date from') && !t.includes('registered')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }
    return null;
  }

  function findAmountInToInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));

    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;

      let attrStr = (
        (inp.placeholder || '') + ' ' +
        (inp.name || '') + ' ' +
        (inp.id || '') + ' ' +
        (inp.getAttribute('ng-model') || '') + ' ' +
        (inp.getAttribute('formcontrolname') || '') + ' ' +
        (inp.getAttribute('aria-label') || '')
      ).toLowerCase();

      if (attrStr.includes('in') && attrStr.includes('to') && !attrStr.includes('out') && !attrStr.includes('from')) {
        return inp;
      }

      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (t.includes('amount') && t.includes('in') && t.includes('to') && !t.includes('out') && !t.includes('from')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }

    let amountInputs = inputs.filter(inp => {
      let p = inp.parentElement;
      while (p && p !== container) {
        let t = (p.textContent || '').toLowerCase();
        if (t.includes('amount')) return true;
        p = p.parentElement;
      }
      return false;
    });

    if (amountInputs.length >= 4) {
      return amountInputs[3];
    }
    return null;
  }

  function findAmountInFromInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));

    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;

      let attrStr = (
        (inp.placeholder || '') + ' ' +
        (inp.name || '') + ' ' +
        (inp.id || '') + ' ' +
        (inp.getAttribute('ng-model') || '') + ' ' +
        (inp.getAttribute('formcontrolname') || '') + ' ' +
        (inp.getAttribute('aria-label') || '')
      ).toLowerCase();

      if (attrStr.includes('in') && attrStr.includes('from') && !attrStr.includes('out') && !attrStr.includes('to') && !attrStr.includes('date')) {
        return inp;
      }

      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (t.includes('amount') && t.includes('in') && t.includes('from') && !t.includes('out') && !t.includes('to')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }

    let amountInputs = inputs.filter(inp => {
      let p = inp.parentElement;
      while (p && p !== container) {
        let t = (p.textContent || '').toLowerCase();
        if (t.includes('amount')) return true;
        p = p.parentElement;
      }
      return false;
    });

    if (amountInputs.length >= 4) {
      return amountInputs[2];
    }
    return null;
  }

  function findTypeSelect(container) {
    if (!container) return null;
    let selects = Array.from(container.querySelectorAll('select'));
    for (let sel of selects) {
      if (sel.offsetWidth === 0 && sel.getBoundingClientRect().width === 0) continue;
      let p = sel.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if ((t.includes('type') && !t.includes('product')) || t === 'type') {
          let childSelects = p.querySelectorAll('select');
          if (childSelects.length <= 2) return sel;
        }
        p = p.parentElement;
      }
    }
    return null;
  }

  function findSearchButton(container, inputEl) {
    // 1. Try finding search button inside the closest form/filter container
    if (inputEl) {
      let formOrFilter = inputEl.closest('form, [class*="filter"], [class*="tab-pane"], [class*="modal"]');
      if (formOrFilter) {
        let btns = Array.from(formOrFilter.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a'));
        let sBtn = btns.find(b => {
          let t = (b.textContent || b.value || '').toLowerCase().trim();
          return t === 'search' && !t.includes('clear') && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
        });
        if (sBtn) return sBtn;
      }
    }
    // 2. Try finding within the modal container
    if (container) {
      let btns = Array.from(container.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a'));
      let sBtn = btns.find(b => {
        let t = (b.textContent || b.value || '').toLowerCase().trim();
        return t === 'search' && !t.includes('clear') && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
      if (sBtn) return sBtn;
    }
    return null;
  }

  function findNoteColIdx(container) {
    if (!container) return { tbl: null, idx: -1 };
    let tables = Array.from(container.querySelectorAll('table'));
    let dataTbl = tables.find(t =>
      (t.offsetWidth > 0 || t.offsetHeight > 0) && 
      Array.from(t.querySelectorAll('th,td')).some(c => c.textContent.toLowerCase().trim() === 'note' || c.textContent.toLowerCase().trim().includes('note'))
    );
    if (!dataTbl) return { tbl: null, idx: -1 };

    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    let dataRow = allTrs.find(tr => tr.querySelector('td') && tr.children.length > 12);
    
    let colIndex = -1;
    
    // Attempt standard colspan calculation
    for (let tr of allTrs) {
      if (tr.querySelector('td') && !tr.querySelector('th')) continue;
      let currentIdx = 0;
      let found = false;
      for (let cell of Array.from(tr.children)) {
        let txt = cell.textContent.toLowerCase().trim();
        if (txt === 'note' || (txt.includes('note') && txt.length < 10)) {
          colIndex = currentIdx;
          found = true;
          break;
        }
        currentIdx += parseInt(cell.getAttribute('colspan') || cell.colSpan || 1, 10);
      }
      if (found) break;
    }

    // Force bulletproof fallback for Playbison Transactions table
    if (dataRow) {
      let len = dataRow.children.length;
      // In Playbison, if length is 17, note is 15. It's always len - 2.
      if (len >= 15) {
        // Double check if colIndex is reasonable. If it points to 'balance after' (e.g., 11), override it.
        if (colIndex === -1 || colIndex < 14) {
          colIndex = len - 2;
        }
      }
    }

    return { tbl: dataTbl, idx: colIndex };
  }

  function hasBlankInResults(container) {
    if (!container) return { found: false, date: null };
    let { tbl, idx } = findNoteColIdx(container);
    if (!tbl || idx === -1) return { found: false, date: null };

    let allTrs = Array.from(tbl.querySelectorAll('tr'));
    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > Math.max(1, idx));

    if (dataRows.length === 0) return { found: false, date: null };

    let dateIdx = 1;
    let balBeforeIdx = -1, balAfterIdx = -1;

    for (let tr of allTrs) {
      if (tr.querySelector('th')) {
        let cells = Array.from(tr.children);
        for (let i = 0; i < cells.length; i++) {
          let t = cells[i].textContent.toLowerCase().trim();
          if (t === 'date') dateIdx = i;
          if (t === 'before' && i >= 10 && i < 13) balBeforeIdx = i;
          if (t === 'after' && i >= 11 && i <= 13) balAfterIdx = i;
          if (t.includes('balance') && t.includes('before')) balBeforeIdx = i;
          if (t.includes('balance') && t.includes('after')) balAfterIdx = i;
        }
        break;
      }
    }

    if (balBeforeIdx === -1) balBeforeIdx = 11;
    if (balAfterIdx === -1) balAfterIdx = 12;

    for (let tr of dataRows) {
      let txt = (tr.children[idx].textContent || '').trim().toLowerCase();
      // If note contains 'automatic', skip it (already verified automatic)
      if (txt.includes('automatic')) continue;

      let inValStr = tr.children.length > 6 ? tr.children[6].textContent.trim() : '0';
      let inVal = Math.abs(parseFloat(inValStr.replace(',', '.')) || 0);

      let balBeforeStr = tr.children.length > balBeforeIdx ? tr.children[balBeforeIdx].textContent.trim() : '0';
      let balAfterStr = tr.children.length > balAfterIdx ? tr.children[balAfterIdx].textContent.trim() : '0';
      let bBefore = parseFloat(balBeforeStr.replace(',', '.')) || 0;
      let bAfter = parseFloat(balAfterStr.replace(',', '.')) || 0;

      let bonBefore = tr.children.length > (balAfterIdx + 1) ? (parseFloat(tr.children[balAfterIdx + 1].textContent.trim().replace(',', '.')) || 0) : 0;
      let bonAfter = tr.children.length > (balAfterIdx + 2) ? (parseFloat(tr.children[balAfterIdx + 2].textContent.trim().replace(',', '.')) || 0) : 0;

      // Check if this row is an inactive forfeiture/zero-change row where player received 0 funds
      let isUnchanged = (inVal === 0) && (bBefore === bAfter) && (bonAfter <= bonBefore);
      if (isUnchanged) {
        continue;
      }

      // Real bonus redemption detected!
      let dateStr = tr.children[dateIdx] ? (tr.children[dateIdx].textContent || '').trim() : null;
      return { found: true, date: dateStr };
    }
    return { found: false, date: null };
  }

  function getCurrency(container) {
    if (!container) return null;
    let tables = Array.from(container.querySelectorAll('table'));
    let dataTbl = tables.find(t =>
      (t.offsetWidth > 0 || t.offsetHeight > 0) &&
      Array.from(t.querySelectorAll('th,td')).some(c => {
        let txt = c.textContent.toLowerCase().trim();
        return txt === 'out val' || txt === 'in val' || txt === 'wallet id';
      })
    );
    if (!dataTbl) return null;

    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    let currIdx = -1;
    for (let tr of allTrs) {
      let cells = Array.from(tr.children);
      for (let i = 0; i < cells.length; i++) {
        let txt = cells[i].textContent.toLowerCase().trim();
        if (txt === 'val' || txt === 'out val' || txt === 'in val') {
          if (i + 1 < cells.length && (cells[i+1].textContent.toLowerCase().trim() === 'curr' || cells[i+1].textContent.toLowerCase().trim() === 'currency')) {
            currIdx = i + 1;
            break;
          }
        }
      }
      if (currIdx !== -1) break;
    }
    
    if (currIdx === -1) currIdx = 7;

    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > currIdx);
    for (let tr of dataRows) {
        let currCell = tr.children[currIdx];
        if (currCell) {
            let txt = currCell.textContent.trim().toUpperCase();
            if (txt) return txt;
        }
    }
    return null;
  }

  function computeAllPagesStack(container, doneCallback) {
    let globalCounts = {};
    let seenIds = new Set();
    let globalGames = new Set();

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
      let valIdx = -1;
      let currIdx = -1;
      let bonusBeforeIdx = -1;
      let bonusAfterIdx = -1;
      let noteIdx = -1;

      for (let tr of allTrs) {
        let cells = Array.from(tr.children);
        for (let i = 0; i < cells.length; i++) {
          let txt = cells[i].textContent.toLowerCase().trim();
          if (txt === 'val' || txt === 'out val' || txt === 'in val') {
            if (i + 1 < cells.length && (cells[i+1].textContent.toLowerCase().trim() === 'curr' || cells[i+1].textContent.toLowerCase().trim() === 'currency')) {
              valIdx = i;
              currIdx = i + 1;
            }
          }
          if (txt === 'before' && i > 8) {
            bonusBeforeIdx = i;
            if (i + 1 < cells.length) bonusAfterIdx = i + 1;
          }
          if (txt === 'note' || (txt.includes('note') && txt.length < 10)) {
            noteIdx = i;
          }
        }
        if (valIdx !== -1 && bonusBeforeIdx !== -1 && noteIdx !== -1) break;
      }

      if (valIdx === -1) {
        valIdx = 5;
        currIdx = 7;
      }

      if (bonusBeforeIdx === -1) {
        bonusBeforeIdx = 13;
        bonusAfterIdx = 14;
      }
      if (noteIdx === -1) noteIdx = 15;

      let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > Math.max(currIdx, bonusAfterIdx));

      for (let tr of dataRows) {
        let idStr = tr.children[0] ? tr.children[0].textContent.trim() : '';
        if (!/^\d{6,15}$/.test(idStr)) continue;

        if (seenIds.has(idStr)) continue;
        seenIds.add(idStr);

        let bonusBeforeStr = tr.children.length > bonusBeforeIdx ? tr.children[bonusBeforeIdx].textContent.trim() : '0';
        let bonusAfterStr = tr.children.length > bonusAfterIdx ? tr.children[bonusAfterIdx].textContent.trim() : '0';

        let bBefore = parseFloat(bonusBeforeStr.replace(',', '.')) || 0;
        let bAfter = parseFloat(bonusAfterStr.replace(',', '.')) || 0;

        // RULE: If bonus before AND bonus after have the SAME value, SKIP THIS ROW!
        // Only count rows where bonus before and bonus after values DIFFER!
        if (bBefore === bAfter) {
          continue;
        }

        let valStr = tr.children[valIdx].textContent.trim();
        let currStr = tr.children[currIdx].textContent.trim();

        if (!valStr) continue;

        let num = parseFloat(valStr.replace(',', '.'));
        if (isNaN(num)) continue;

        let currCode = currStr ? currStr.split(' ')[0] : '';
        let currFormatted = currCode ? currCode.charAt(0).toUpperCase() + currCode.slice(1).toLowerCase() : '';
        let absVal = Math.abs(num);
        let valFormatted = `-${absVal}`;

        if (valFormatted.endsWith('.00')) {
          valFormatted = valFormatted.slice(0, -3);
        }

        let key = `${valFormatted}${currFormatted}`;
        globalCounts[key] = (globalCounts[key] || 0) + 1;

        let noteStr = tr.children.length > noteIdx ? tr.children[noteIdx].textContent.trim() : '';
        if (noteStr) {
          let rIndex = noteStr.lastIndexOf('R:');
          if (rIndex !== -1) {
            let gName = noteStr.substring(0, rIndex).trim();
            if (gName) globalGames.add(gName);
          }
        }
      }
    }

    function findNextButton(cont) {
      let btns = Array.from(cont.querySelectorAll('button, a, input, div[role="button"], li'));
      return btns.find(b => {
        let txt = (b.textContent || b.value || '').toLowerCase().trim();
        let isNext = txt === 'next' || txt.includes('next') || txt === 'next→' || txt === 'next →' || txt === '→';
        let isDisabled = b.disabled || b.classList.contains('disabled') || b.parentElement.classList.contains('disabled');
        return isNext && !isDisabled && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
    }

    function step() {
      let liveDoc = getFrames()[0];
      let liveModal = container ? container : liveDoc;
      parseCurrentPage(liveModal);

      let nextBtn = findNextButton(liveModal);
      if (nextBtn) {
        simClick(nextBtn);
        setTimeout(() => {
          step();
        }, 3000);
      } else {
        let keys = Object.keys(globalCounts).sort((a, b) => {
          let numA = Math.abs(parseFloat(a) || 0);
          let numB = Math.abs(parseFloat(b) || 0);
          return numB - numA;
        });

        let resultLines = keys.map(k => `${k}*${globalCounts[k]}`);
        let gamesArr = Array.from(globalGames);
        let gamesStr = gamesArr.length > 0 ? '\n|GAMES:' + gamesArr.join('|') : '';
        doneCallback(resultLines.join('\n') + gamesStr);
      }
    }

    step();
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
      // Intentionally leave the textarea in the DOM and focused
      // so that Python's Ctrl+C loop can successfully copy it.
      setTimeout(() => {
        try { document.body.removeChild(ta); } catch(e){}
      }, 30000);
    } catch (e) {}
  }

  function getTotalPages(cont) {
    let allEls = Array.from(cont.querySelectorAll('*'));
    let bestMatch = null;
    let maxDepth = -1;
    
    for (let e of allEls) {
      let t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (t.includes('of') && /\d+ of \d+/.test(t)) {
        // Calculate depth to get the most specific element containing the text
        let depth = 0;
        let curr = e;
        while(curr.parentElement) { depth++; curr = curr.parentElement; }
        
        if (depth > maxDepth) {
          maxDepth = depth;
          bestMatch = t;
        }
      }
    }
    
    if (bestMatch) {
      let m = bestMatch.match(/(\d+)\s+of\s+(\d+)/i);
      if (m && m[2]) return parseInt(m[2], 10);
    }
    return 1;
  }

  function getStackDatesFromPage(cont) {
    let tables = Array.from(cont.querySelectorAll('table'));
    let dataTbl = tables.find(t => (t.offsetWidth > 0 || t.offsetHeight > 0) && Array.from(t.querySelectorAll('th,td')).some(c => c.textContent.toLowerCase().trim() === 'out val' || c.textContent.toLowerCase().trim() === 'in val'));
    if (!dataTbl) return [];
    
    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    let dateIdx = -1, noteIdx = -1;
    
    // Find the header row and identify column indices for 'date' and 'note'
    for (let tr of allTrs) {
      let cells = Array.from(tr.children);
      for (let i = 0; i < cells.length; i++) {
        let txt = cells[i].textContent.toLowerCase().trim();
        if (txt === 'date') dateIdx = i;
        if (txt === 'note') noteIdx = i;
      }
      if (dateIdx !== -1) break;
    }
    
    // Fallbacks if headers not found
    if (dateIdx === -1) dateIdx = 1;
    // Note column is typically the 15th column (index 14), after 'ip' (index 13)
    if (noteIdx === -1) noteIdx = 14;

    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > dateIdx);
    let stackDates = [];
    
    for (let tr of dataRows) {
      // A stack row has an empty 'note' column
      let noteCell = tr.children[noteIdx];
      let noteText = noteCell ? (noteCell.textContent || '').trim() : '';
      if (noteText === '') {
        let dateStr = (tr.children[dateIdx].textContent || '').trim();
        if (dateStr) stackDates.push(dateStr);
      }
    }
    return stackDates;
  }

  let links = Array.from(document.querySelectorAll('a'));
  let tTab = links.find(e => {
    if (e.textContent.toLowerCase().trim() !== 'transactions') return false;
    let idx = links.indexOf(e);
    let start = Math.max(0, idx - 5);
    for (let i = start; i < idx; i++) {
      if (links[i].textContent.toLowerCase().trim().startsWith('notes')) return true;
    }
    return false;
  });
  if (!tTab) { tTab = links.find(e => e.textContent.toLowerCase().trim() === 'transactions'); }

  if (tTab) {
    simClick(tTab);
    setTimeout(() => {
      let targetDoc = null;
      let modalContainer = null;
      let dateInput = null;
      let amtInput = null;
      let typeSelect = null;
      let searchBtn = null;

      for (let doc of getFrames()) {
        if (!doc) continue;
        modalContainer = getActiveModalContainer(tTab, doc);
        dateInput = findDateFromInput(modalContainer);
        if (!dateInput) continue;
        targetDoc = doc;
        amtInput = findAmountInToInput(modalContainer);
        typeSelect = findTypeSelect(modalContainer);
        searchBtn = findSearchButton(modalContainer, dateInput || typeSelect);
        break;
      }

      if (dateInput) {
        let d = new Date(); d.setMonth(d.getMonth() - 1);
        let val = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " 00:00";
        setVal(dateInput, val);
      } else {
        copyToClipboard("TRANS_RESULT:NO_DATE_INPUT");
        return;
      }

      if (typeSelect) {
        setSelectVal(typeSelect, 'redeem the bonus');
      }
      if (amtInput) {
        setVal(amtInput, '');
      }

      setTimeout(() => {
        if (searchBtn) simClick(searchBtn);

        setTimeout(() => {
          let freshDoc = getFrames()[0];
          let freshModal = getActiveModalContainer(tTab, freshDoc);
          let blankCheck = hasBlankInResults(freshModal);
          let blankFound = blankCheck.found;
          let blankDate = blankCheck.date;

          if (blankFound) {
            let userCurr = "###TCURR###".toUpperCase();
            let searchAmt = '-8.01';
            if (userCurr.includes('EUR')) searchAmt = '-2.01';
            else if (userCurr.includes('HUF')) searchAmt = '-800.01';
            else if (userCurr.includes('USD')) searchAmt = '-2.01';

            let freshTypeSelect = findTypeSelect(freshModal);
            let freshAmtInput = findAmountInToInput(freshModal);
            let freshAmtFromInput = findAmountInFromInput(freshModal);
            let freshDateInput = findDateFromInput(freshModal);
            let freshDateToInput = findDateToInput(freshModal);
            let freshSearchBtn = findSearchButton(freshModal, freshAmtInput || freshTypeSelect);

            if (freshTypeSelect) setSelectVal(freshTypeSelect, 0);
            if (freshAmtInput) setVal(freshAmtInput, searchAmt);
            if (freshAmtFromInput) setVal(freshAmtFromInput, '-10000');
            
            if (freshDateInput && blankDate) {
              let parsedDate = new Date(blankDate);
              if (!isNaN(parsedDate.getTime())) {
                let newVal = parsedDate.getFullYear() + "-" + String(parsedDate.getMonth() + 1).padStart(2, "0") + "-" + String(parsedDate.getDate()).padStart(2, "0") + " 00:00";
                setVal(freshDateInput, newVal);
              }
            }
            if (freshDateToInput) {
              let now = new Date();
              now.setDate(now.getDate() + 1);
              let toVal = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0") + " 23:59";
              setVal(freshDateToInput, toVal);
            }

            setTimeout(() => {
              if (freshSearchBtn) simClick(freshSearchBtn);
              setTimeout(() => {
                let liveDoc = getFrames()[0];
                let liveModal = getActiveModalContainer(tTab, liveDoc) || liveDoc;
                
                let totalPages = getTotalPages(liveModal);
                if (totalPages > 50) {
                  let stackDates = getStackDatesFromPage(liveModal);
                  copyToClipboard("TRANS_RESULT:EXCEEDS_5_PAGES|" + stackDates.join(','));
                  return;
                }
                
                computeAllPagesStack(liveModal, function(stackResult) {
                  let resText = stackResult || "NO_STACK";
                  let dateStr = blankDate ? `|STACK_DATE:${blankDate}` : "";
                  copyToClipboard("TRANS_RESULT:" + resText + dateStr);
                });
              }, 3000);
            }, 500);
          } else {
            copyToClipboard("TRANS_RESULT:AUTOMATIC");
          }
        }, 3000);

      }, 600);

    }, 2000);
  } else {
    copyToClipboard("TRANS_RESULT:NO_TRANSACTIONS_TAB");
  }
})();
