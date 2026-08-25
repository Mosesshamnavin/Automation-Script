(function () {
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
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof el.click === 'function') el.click();
  }

  function doScopedSearch(refNode) {
    if (refNode) {
      let p = refNode.parentElement;
      while (p && p !== document.body) {
        let btns = Array.from(p.querySelectorAll('button, input, a, div[role="button"]'));
        let sBtn = btns.find(b => {
          let t = (b.textContent || b.value || '').toLowerCase().trim();
          return t === 'search' && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
        });
        if (sBtn) {
          let btn = sBtn.closest('button, input, a, div[role="button"]') || sBtn;
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
        p = p.parentElement;
      }
    }

    for (let doc of getFrames()) {
      if (!doc) continue;
      let allBtns = Array.from(doc.querySelectorAll('*'));
      let searchBtns = allBtns.filter(b => {
        let t = (b.textContent || b.value || '').toLowerCase().trim();
        return t === 'search' && b.getBoundingClientRect().width > 0;
      });
      let best = null;
      for (let i = searchBtns.length - 1; i >= 0; i--) {
        if (searchBtns[i].tagName === 'BUTTON') { best = searchBtns[i]; break; }
      }
      if (!best && searchBtns.length > 0) best = searchBtns[searchBtns.length - 1];
      if (best) {
        let btn = best.closest('button, input, a, div[role="button"]') || best;
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
    return false;
  }

  let links = Array.from(document.querySelectorAll('a'));
  let pTab = links.find(
    e => e.textContent.toLowerCase().trim() === 'payment log' && e.getBoundingClientRect().width > 0
  );

  if (pTab) {
    simClick(pTab);
    setTimeout(() => {
      let all = Array.from(document.querySelectorAll('*'));
      let sLabels = all.filter(e => {
        if (e.tagName === 'TH' || e.tagName === 'TD') return false;
        let t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        return (t === 'status' || t === 'status *' || t === 'status:') &&
          e.getBoundingClientRect().width > 0 && e.children.length <= 2;
      });
      let sLabel = sLabels.pop();

      if (sLabel) {
        let idx = all.indexOf(sLabel);
        let targetSelect = null;
        for (let i = idx + 1; i < idx + 30 && i < all.length; i++) {
          if (all[i].tagName === 'SELECT') { targetSelect = all[i]; break; }
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
        }
        setTimeout(() => doScopedSearch(targetSelect || sLabel), 300);
      } else {
        setTimeout(() => doScopedSearch(null), 300);
      }
    }, 1200);
  }
})();
