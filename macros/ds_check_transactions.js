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

  function doScopedSearch(refEl) {
    if (refEl) {
      let c = refEl.parentElement;
      while (c && c !== document.body) {
        let bs = Array.from(c.querySelectorAll('*')).filter(b => {
          let t = (b.textContent || b.value || '').toLowerCase().trim();
          return t === 'search' && b.getBoundingClientRect().width > 0;
        });
        if (bs.length > 0) {
          let best = null;
          for (let i = bs.length - 1; i >= 0; i--) {
            if (bs[i].tagName === 'BUTTON') { best = bs[i]; break; }
          }
          if (!best) best = bs[bs.length - 1];
          if (best) {
            let btn = best.closest('button,input,a,div[role="button"]') || best;
            if (btn.style) btn.style.border = '3px solid red';
            simClick(btn);
            let form = btn.closest('form');
            if (form) {
              try {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                if (typeof form.submit === 'function') form.submit();
              } catch (err) {}
            }
            return true;
          }
        }
        c = c.parentElement;
      }
    }
    return false;
  }

  function findNoteColIdx(doc) {
    let tables = Array.from(doc.querySelectorAll('table'));
    let dataTbl = tables.find(t =>
      Array.from(t.querySelectorAll('th,td')).some(c => c.textContent.toLowerCase().trim() === 'note')
    );
    if (!dataTbl) return { tbl: null, idx: -1 };
    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    for (let tr of allTrs) {
      let cells = Array.from(tr.children);
      let idx = cells.findIndex(c => c.textContent.toLowerCase().trim() === 'note');
      if (idx !== -1) return { tbl: dataTbl, idx: idx };
    }
    return { tbl: null, idx: -1 };
  }

  function hasBlankInResults() {
    for (let doc of getFrames()) {
      if (!doc) continue;
      let { tbl, idx } = findNoteColIdx(doc);
      if (!tbl || idx === -1) continue;
      let allTrs = Array.from(tbl.querySelectorAll('tr'));
      let headerFound = false;
      for (let tr of allTrs) {
        let cells = Array.from(tr.children);
        if (!headerFound) {
          if (cells.some(c => c.textContent.toLowerCase().trim() === 'note')) { headerFound = true; continue; }
          continue;
        }
        if (cells.length > idx) {
          let txt = cells[idx].textContent.trim().toLowerCase();
          if (txt === '' || !txt.includes('automatic')) return true;
        }
      }
    }
    return false;
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
      let globalDLabel = null;
      let globalAmtLabel = null;
      let globalSelectsRev = [];
      let globalDoc = null;

      for (let doc of getFrames()) {
        if (!doc) continue;
        let all = Array.from(doc.querySelectorAll('*'));
        let dLabels = all.filter(e => {
          if (e.tagName === 'TH' || e.tagName === 'TD') return false;
          let t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
          return (t === 'date from' || t === 'date from *' || t === 'date from:') &&
            e.getBoundingClientRect().width > 0 && e.children.length <= 2;
        });
        let dLabel = dLabels.pop();
        if (!dLabel) continue;
        globalDLabel = dLabel;
        globalDoc = doc;

        let idx = all.indexOf(dLabel);
        for (let i = idx + 1; i < idx + 30 && i < all.length; i++) {
          if (all[i].tagName === 'INPUT' && all[i].getBoundingClientRect().width > 0) {
            let d = new Date(); d.setMonth(d.getMonth() - 1);
            let val = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " 00:00";
            setVal(all[i], val); break;
          }
        }

        let selects = Array.from(doc.querySelectorAll('select'));
        globalSelectsRev = selects.slice().reverse();

        let amtLabels = all.filter(e => {
          if (e.tagName === 'TH' || e.tagName === 'TD') return false;
          let t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
          return (t === 'amount range in (to)' || t === 'amount range in (to) *' || t === 'amount range in (to):') &&
            e.getBoundingClientRect().width > 0 && e.children.length <= 2;
        });
        globalAmtLabel = amtLabels.pop();
        break;
      }

      function setType(val) {
        for (let select of globalSelectsRev) {
          let opt = Array.from(select.options).find(o => o.textContent.toLowerCase().trim().includes('redeem the bonus'));
          if (opt) {
            if (val === 'redeem') { select.value = opt.value; select.selectedIndex = opt.index; }
            else { select.value = ''; select.selectedIndex = 0; }
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('blur', { bubbles: true }));
            break;
          }
        }
      }

      function setAmt(val) {
        if (!globalAmtLabel) return;
        let all = Array.from(globalAmtLabel.ownerDocument.querySelectorAll('*'));
        let idx = all.indexOf(globalAmtLabel);
        for (let i = idx + 1; i < idx + 30 && i < all.length; i++) {
          if (all[i].tagName === 'INPUT' && all[i].getBoundingClientRect().width > 0) { setVal(all[i], val); break; }
        }
      }

      setType('redeem');
      setAmt('');

      setTimeout(() => {
        doScopedSearch(globalDLabel);
        setTimeout(() => {
          if (hasBlankInResults()) {
            setType('');
            setAmt('-8.01');
            setTimeout(() => { doScopedSearch(globalDLabel); }, 600);
          }
        }, 4000);
      }, 1000);
    }, 3500);
  } else {
    alert("Could not find the Transactions tab!");
  }
})();
