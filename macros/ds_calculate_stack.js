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
    let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (setter) setter.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function findInputByPatterns(doc, patterns) {
    let inputs = Array.from(doc.querySelectorAll('input'));
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let p = inp.parentElement;
      for (let level = 0; level < 4 && p && p !== doc.body; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        let matchAll = patterns.every(pat => t.includes(pat.toLowerCase()));
        if (matchAll) return inp;
        p = p.parentElement;
      }
    }
    return null;
  }

  function findSelectByPatterns(doc, patterns) {
    let selects = Array.from(doc.querySelectorAll('select'));
    for (let sel of selects) {
      if (sel.offsetWidth === 0 && sel.getBoundingClientRect().width === 0) continue;
      let p = sel.parentElement;
      for (let level = 0; level < 4 && p && p !== doc.body; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        let matchAll = patterns.every(pat => t.includes(pat.toLowerCase()));
        if (matchAll) return sel;
        p = p.parentElement;
      }
    }
    return null;
  }

  function findSearchButton(refEl, doc) {
    if (refEl) {
      let p = refEl.parentElement;
      while (p && p !== doc.body) {
        let btns = Array.from(p.querySelectorAll('button, input, a, div[role="button"]'));
        let found = btns.find(b => {
          let t = (b.textContent || b.value || '').toLowerCase().trim();
          return t === 'search' && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
        });
        if (found) return found;
        p = p.parentElement;
      }
    }
    let allBtns = Array.from(doc.querySelectorAll('button, input, a, div[role="button"]'));
    return allBtns.find(b => (b.textContent || b.value || '').toLowerCase().trim() === 'search' && b.getBoundingClientRect().width > 0);
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

  function computeStackFromTable() {
    let counts = {};
    for (let doc of getFrames()) {
      if (!doc) continue;
      let tables = Array.from(doc.querySelectorAll('table'));
      let dataTbl = tables.find(t =>
        Array.from(t.querySelectorAll('th,td')).some(c => {
          let txt = c.textContent.toLowerCase().trim();
          return txt === 'out val' || txt === 'in val' || txt === 'wallet id';
        })
      );
      if (!dataTbl) continue;

      let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
      let outValIdx = -1;
      let outCurrIdx = -1;
      let inValIdx = -1;
      let inCurrIdx = -1;
      let headerFound = false;

      for (let tr of allTrs) {
        let cells = Array.from(tr.children);
        if (!headerFound) {
          let idxOut = cells.findIndex(c => {
            let txt = c.textContent.toLowerCase().trim();
            return txt === 'out val' || txt === 'out';
          });
          let idxIn = cells.findIndex(c => {
            let txt = c.textContent.toLowerCase().trim();
            return txt === 'in val' || txt === 'in';
          });

          if (idxOut !== -1) {
            outValIdx = idxOut;
            if (cells.length > idxOut + 1) outCurrIdx = idxOut + 1;
            headerFound = true;
          } else if (idxIn !== -1) {
            inValIdx = idxIn;
            if (cells.length > idxIn + 1) inCurrIdx = idxIn + 1;
            headerFound = true;
          }
          continue;
        }

        let targetValIdx = outValIdx !== -1 ? outValIdx : inValIdx;
        let targetCurrIdx = outValIdx !== -1 ? outCurrIdx : inCurrIdx;

        if (targetValIdx !== -1 && cells.length > targetValIdx) {
          let valStr = cells[targetValIdx].textContent.trim();
          let currStr = targetCurrIdx !== -1 && cells.length > targetCurrIdx ? cells[targetCurrIdx].textContent.trim() : '';

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
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }

    let keys = Object.keys(counts).sort((a, b) => {
      let numA = Math.abs(parseFloat(a) || 0);
      let numB = Math.abs(parseFloat(b) || 0);
      return numB - numA;
    });

    let resultLines = keys.map(k => `${k}*${counts[k]}`);
    return resultLines.join('\n');
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
      let dateInput = null;
      let amtInput = null;
      let typeSelect = null;
      let searchBtn = null;

      for (let doc of getFrames()) {
        if (!doc) continue;
        dateInput = findInputByPatterns(doc, ['date from']);
        if (!dateInput) continue;
        amtInput = findInputByPatterns(doc, ['amount range in', '(to)']);
        if (!amtInput) amtInput = findInputByPatterns(doc, ['amount range in']);
        typeSelect = findSelectByPatterns(doc, ['type']);
        searchBtn = findSearchButton(dateInput, doc);
        break;
      }

      if (dateInput) {
        let d = new Date(); d.setMonth(d.getMonth() - 1);
        let val = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " 00:00";
        setVal(dateInput, val);
      }

      if (typeSelect) {
        let opt = Array.from(typeSelect.options).find(o => o.textContent.toLowerCase().trim().includes('redeem the bonus'));
        if (opt) {
          typeSelect.value = opt.value; typeSelect.selectedIndex = opt.index;
          typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          typeSelect.dispatchEvent(new Event('input', { bubbles: true }));
          typeSelect.dispatchEvent(new Event('blur', { bubbles: true }));
        }
      }

      setTimeout(() => {
        if (searchBtn) simClick(searchBtn);

        setTimeout(() => {
          let stackResult = computeStackFromTable();
          copyToClipboard(stackResult);
          alert("STACK_RESULT:\n" + (stackResult || "NO_TRANSACTIONS_FOUND"));
        }, 4000);

      }, 1000);

    }, 3500);
  }
})();
