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

  function getActiveModalContainer(pTab, doc) {
    if (pTab) {
      let p = pTab.parentElement;
      while (p && p !== doc.body) {
        let inputs = p.querySelectorAll('input, select, table');
        if (inputs.length >= 3) {
          return p;
        }
        p = p.parentElement;
      }
    }
    let modals = Array.from(doc.querySelectorAll('.modal, .modal-content, [role="dialog"], .popup, .window'));
    for (let m of modals) {
      if (m.offsetWidth > 0 && m.offsetHeight > 0) return m;
    }
    return doc;
  }

  function selectPendingAndCompleted(container) {
    if (!container) return null;
    let allSelects = Array.from(container.querySelectorAll('select'));
    let targetSelect = null;

    // 1. Find select by label or attribute
    for (let sel of allSelects) {
      let attrStr = ((sel.name || '') + ' ' + (sel.id || '') + ' ' + (sel.getAttribute('ng-model') || '') + ' ' + (sel.getAttribute('formcontrolname') || '')).toLowerCase();
      if (attrStr.includes('status')) {
        targetSelect = sel;
        break;
      }
      let p = sel.parentElement;
      for (let lvl = 0; lvl < 4 && p && p !== container; lvl++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (t.includes('status') && !t.includes('process')) {
          targetSelect = sel;
          break;
        }
        p = p.parentElement;
      }
      if (targetSelect) break;
    }

    if (targetSelect) {
      let changed = false;
      for (let o of targetSelect.options) {
        let t = o.textContent.toLowerCase().trim();
        if (t === 'pending' || t === 'completed') {
          if (!o.selected) { o.selected = true; changed = true; }
        } else {
          if (o.selected) { o.selected = false; changed = true; }
        }
      }
      if (changed) {
        targetSelect.dispatchEvent(new Event('change', { bubbles: true }));
        targetSelect.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return targetSelect;
    }

    // 2. Fallback: inspect any select with 'pending' or 'completed' options
    for (let sel of allSelects) {
      let hasPending = Array.from(sel.options).some(o => o.textContent.toLowerCase().includes('pending'));
      let hasCompleted = Array.from(sel.options).some(o => o.textContent.toLowerCase().includes('completed'));
      if (hasPending || hasCompleted) {
        for (let o of sel.options) {
          let t = o.textContent.toLowerCase().trim();
          if (t === 'pending' || t === 'completed') {
            o.selected = true;
          } else {
            o.selected = false;
          }
        }
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        return sel;
      }
    }
    return null;
  }

  function clickModalSearch(container) {
    if (!container) return false;
    let btns = Array.from(container.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a, div[role="button"]'));
    let sBtn = btns.find(b => {
      let t = (b.textContent || b.value || '').toLowerCase().trim();
      return (t === 'search' || t.startsWith('search')) && !t.includes('clear') && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
    });

    if (sBtn) {
      if (sBtn.style) sBtn.style.border = '3px solid red';
      simClick(sBtn);
      let form = sBtn.closest('form');
      if (form) {
        try {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          if (typeof form.submit === 'function') form.submit();
        } catch (err) {}
      }
      return true;
    }
    return false;
  }

  // --- Main Execution ---
  for (let doc of getFrames()) {
    let links = Array.from(doc.querySelectorAll('a.nav-link, a, button, [role="tab"]'));
    let pTab = links.find(e => {
      let t = (e.textContent || '').toLowerCase().trim();
      return t === 'payment log' && (e.offsetWidth > 0 || e.getBoundingClientRect().width > 0);
    });

    if (pTab) {
      simClick(pTab);
      setTimeout(() => {
        let container = getActiveModalContainer(pTab, doc);
        selectPendingAndCompleted(container);
        setTimeout(() => {
          clickModalSearch(container);
        }, 400);
      }, 1000);
      return;
    }
  }
})();
