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

  function findNoteColIdx(container) {
    if (!container) return { tbl: null, idx: -1 };
    let tables = Array.from(container.querySelectorAll('table'));
    let dataTbl = tables.find(t =>
      Array.from(t.querySelectorAll('th,td')).some(c => c.textContent.toLowerCase().trim().includes('note'))
    );
    if (!dataTbl) return { tbl: null, idx: -1 };
    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    for (let tr of allTrs) {
      let cells = Array.from(tr.children);
      let idx = cells.findIndex(c => c.textContent.toLowerCase().trim().includes('note'));
      if (idx !== -1) return { tbl: dataTbl, idx: idx };
    }
    return { tbl: null, idx: -1 };
  }

  function hasBlankInResults(container) {
    if (!container) return true;
    let { tbl, idx } = findNoteColIdx(container);
    if (!tbl || idx === -1) return true;

    let allTrs = Array.from(tbl.querySelectorAll('tr'));
    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > idx);

    if (dataRows.length === 0) return true;

    for (let tr of dataRows) {
      let txt = (tr.children[idx].textContent || '').trim().toLowerCase();
      if (txt === '' || !txt.includes('automatic')) {
        return true;
      }
    }
    return false;
  }

  function computeAllPagesStack(container, doneCallback) {
    let globalCounts = {};
    let seenIds = new Set();

    function parseCurrentPage(cont) {
      let tables = Array.from(cont.querySelectorAll('table'));
      let dataTbl = tables.find(t =>
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
          if (txt === 'before' && i > 10) {
            bonusBeforeIdx = i;
            if (i + 1 < cells.length) bonusAfterIdx = i + 1;
          }
        }
        if (valIdx !== -1 && bonusBeforeIdx !== -1) break;
      }

      if (valIdx === -1) {
        valIdx = 6;
        currIdx = 7;
      }

      if (bonusBeforeIdx === -1) {
        bonusBeforeIdx = 13;
        bonusAfterIdx = 14;
      }

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

        let currFormatted = currStr ? currStr.charAt(0).toUpperCase() + currStr.slice(1).toLowerCase() : '';
        let absVal = Math.abs(num);
        let valFormatted = `-${absVal}`;

        if (valFormatted.endsWith('.00')) {
          valFormatted = valFormatted.slice(0, -3);
        }

        let key = `${valFormatted}${currFormatted}`;
        globalCounts[key] = (globalCounts[key] || 0) + 1;
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
        doneCallback(resultLines.join('\n'));
      }
    }

    step();
  }

  function copyToClipboard(text) {
    try {
      let ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}
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
        modalContainer = doc;
        dateInput = findDateFromInput(modalContainer);
        if (!dateInput) {
          modalContainer = getActiveModalContainer(tTab, doc);
          dateInput = findDateFromInput(modalContainer);
        }
        if (!dateInput) continue;
        targetDoc = doc;
        amtInput = findAmountInToInput(modalContainer);
        typeSelect = findTypeSelect(modalContainer);
        searchBtn = findSearchButtonForInput(dateInput || typeSelect, doc);
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
          let freshModal = getActiveModalContainer(tTab, freshDoc) || freshDoc;
          let blankFound = hasBlankInResults(freshModal);

          if (blankFound) {
            let freshTypeSelect = findTypeSelect(freshModal) || findTypeSelect(freshDoc);
            let freshAmtInput = findAmountInToInput(freshModal) || findAmountInToInput(freshDoc);
            let freshSearchBtn = findSearchButtonForInput(freshAmtInput || freshTypeSelect, freshDoc);

            if (freshTypeSelect) setSelectVal(freshTypeSelect, 0);
            if (freshAmtInput) setVal(freshAmtInput, '-8.01');

            setTimeout(() => {
              if (freshSearchBtn) simClick(freshSearchBtn);
              setTimeout(() => {
                let liveDoc = getFrames()[0];
                let liveModal = getActiveModalContainer(tTab, liveDoc) || liveDoc;
                computeAllPagesStack(liveModal, function(stackResult) {
                  let resText = stackResult || "NO_STACK_FOUND";
                  copyToClipboard("TRANS_RESULT:" + resText);
                  if (stackResult) {
                    prompt("POLAND TRANSACTION STACK COUNT (DIFFERING BONUS ONLY):\nCopy with Ctrl+C:", stackResult);
                  }
                });
              }, 4500);
            }, 800);
          } else {
            computeAllPagesStack(freshModal, function(stackResult) {
              let resText = stackResult || "AUTOMATIC_ALL";
              copyToClipboard("TRANS_RESULT:" + resText);
              if (stackResult) {
                prompt("TRANSACTION STACK COUNT (DIFFERING BONUS ONLY):\nCopy with Ctrl+C:", stackResult);
              }
            });
          }
        }, 4500);

      }, 1000);

    }, 3500);
  } else {
    copyToClipboard("TRANS_RESULT:NO_TRANSACTIONS_TAB");
  }
})();
