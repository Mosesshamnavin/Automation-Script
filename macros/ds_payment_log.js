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
    try { el.focus(); } catch (e) {}
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof el.click === 'function') el.click();
  }

  function findPaymentLogTab(doc) {
    if (!doc) return null;
    let links = Array.from(doc.querySelectorAll('a.nav-link, a, button, [role="tab"], li'));
    return links.find(e => {
      let t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return (t === 'payment log' || t.startsWith('payment log') || t.includes('payment log')) &&
             (e.offsetWidth > 0 || e.getBoundingClientRect().width > 0 || e.offsetHeight > 0);
    });
  }

  function getPaymentLogContainer(pTab, doc) {
    if (pTab) {
      // 1. Walk up parents to find container that has Payment Log filters
      let curr = pTab.parentElement;
      while (curr && curr !== doc.body) {
        let txt = (curr.textContent || '').toLowerCase();
        if (txt.includes('transaction currency') || (txt.includes('value to') && txt.includes('operator'))) {
          return curr;
        }
        curr = curr.parentElement;
      }
      // 2. Check closest modal / dialog / window
      let modal = pTab.closest('.modal, .modal-dialog, .modal-content, [class*="modal"], [class*="window"], [role="dialog"], .tab-content');
      if (modal && modal !== doc.body) return modal;
    }

    // 3. Fallback: find container in doc that has "transaction currency" and "value to"
    let allContainers = Array.from(doc.querySelectorAll('div, section, form, fieldset'));
    let payLogPane = allContainers.find(c => {
      let txt = (c.textContent || '').toLowerCase();
      return txt.includes('transaction currency') && txt.includes('value to') && (c.offsetWidth > 0 || c.offsetHeight > 0);
    });
    if (payLogPane) return payLogPane;

    return doc;
  }

  function findStatusBoxInContainer(container, doc) {
    if (!container) container = doc;

    // 1. Look for label strictly matching "Status" inside the Payment Log container
    let allEls = Array.from(container.querySelectorAll('label, th, td, span, div, p')).filter(el => {
      let t = (el.textContent || '').trim().toLowerCase();
      return (t === 'status' || t === 'status:') &&
             el.children.length === 0 &&
             !t.includes('player') && !t.includes('samstop') && !t.includes('gamstop') &&
             (el.offsetWidth > 0 || el.getBoundingClientRect().width > 0);
    });

    for (let statusLabel of allEls) {
      let p = statusLabel.parentElement;
      if (p) {
        let inp = p.querySelector('input, select, [role="combobox"], [contenteditable="true"], div[tabindex], [class*="select"], [class*="chosen"], [class*="dropdown"]');
        if (inp && inp !== statusLabel) return inp;
      }
      if (statusLabel.nextElementSibling) {
        let n = statusLabel.nextElementSibling;
        let inp = n.querySelector('input, select, [role="combobox"]') || n;
        if (inp) return inp;
      }
      let r = statusLabel.getBoundingClientRect();
      let belowEl = doc.elementFromPoint(r.left + 15, r.bottom + 15);
      if (belowEl && belowEl !== statusLabel && container.contains(belowEl)) {
        let inp = belowEl.querySelector('input, select, [role="combobox"]') || belowEl;
        if (inp) return inp;
      }
    }

    // 2. Look for input with placeholder/name/id containing status inside container
    let inputs = Array.from(container.querySelectorAll('input, select, [role="combobox"], div[tabindex]'));
    let inp = inputs.find(i => {
      let attr = ((i.placeholder || '') + ' ' + (i.name || '') + ' ' + (i.id || '') + ' ' + (i.getAttribute('ng-model') || '')).toLowerCase();
      return attr.includes('status') && !attr.includes('player') && !attr.includes('samstop') && !attr.includes('gamstop');
    });
    if (inp) return inp;

    return null;
  }

  function findOptionElement(doc, targetText) {
    let lowerTarget = targetText.toLowerCase().trim();

    // Scan all visible elements for EXACT match (avoid "Pending Investigation", "Pending User", etc.)
    let allEls = Array.from(doc.querySelectorAll('*')).filter(el => {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) return false;
      let t = (el.textContent || '').trim().toLowerCase();
      return (t === lowerTarget || (t.startsWith(lowerTarget) && !t.includes('investigation') && !t.includes('user') && t.length < lowerTarget.length + 5)) &&
             (el.offsetWidth > 0 || el.getBoundingClientRect().width > 0);
    });

    if (allEls.length > 0) {
      allEls.sort((a, b) => a.children.length - b.children.length);
      return allEls[0];
    }

    // Fallback: search in common dropdown menus / options / list items
    let leafEls = Array.from(doc.querySelectorAll('li, a, span, div, p, [role="option"], td, option, label')).filter(el => {
      let t = (el.textContent || '').trim().toLowerCase();
      return (t === lowerTarget || (t.startsWith(lowerTarget) && !t.includes('investigation') && t.length < lowerTarget.length + 5)) &&
             el.children.length <= 1 && (el.offsetWidth > 0 || el.getBoundingClientRect().width > 0);
    });

    if (leafEls.length > 0) {
      return leafEls[0];
    }

    return null;
  }

  function clickSearchInContainer(container, doc) {
    let searchTarget = container || doc;
    let btns = Array.from(searchTarget.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a, div[role="button"]'));
    let sBtn = btns.find(b => {
      let t = (b.textContent || b.value || '').toLowerCase().trim();
      return (t === 'search' || t.startsWith('search') || t === 'szukaj' || t === 'filtrer' || t === 'filter') &&
             !t.includes('clear') && !t.includes('reset') && !t.includes('download') &&
             (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0 || b.offsetHeight > 0);
    });

    if (sBtn) {
      try {
        if (sBtn.style) {
          sBtn.style.outline = '3px solid red';
          sBtn.style.boxShadow = '0 0 10px red';
        }
      } catch(e){}

      simClick(sBtn);

      let form = sBtn.closest('form');
      if (form) {
        try {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          if (typeof form.submit === 'function') form.submit();
        } catch (err) {}
      }
    }
  }

  function executeStatusSelectionAndSearch(container, doc) {
    let statusBox = findStatusBoxInContainer(container, doc);

    // Also fallback: check any standard <select> for Pending and Completed inside container
    let allSelects = Array.from((container || doc).querySelectorAll('select'));
    for (let sel of allSelects) {
      let attr = ((sel.name || '') + ' ' + (sel.id || '') + ' ' + (sel.getAttribute('ng-model') || '')).toLowerCase();
      let hasP = Array.from(sel.options).some(o => (o.textContent || '').toLowerCase().includes('pending'));
      let hasC = Array.from(sel.options).some(o => (o.textContent || '').toLowerCase().includes('completed'));
      if (attr.includes('status') || (hasP && hasC)) {
        try { sel.multiple = true; } catch(e){}
        for (let o of sel.options) {
          let t = (o.textContent || o.value || '').toLowerCase().trim();
          if (t === 'pending' || t === 'completed' || (t.includes('pending') && !t.includes('investigation')) || t.includes('completed') || t.includes('approved')) {
            o.selected = true;
          }
        }
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sel.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    if (!statusBox) {
      // If no custom box found, click search directly inside container
      setTimeout(() => {
        clickSearchInContainer(container, doc);
      }, 500);
      return;
    }

    // Step 1: Click the status box inside Payment Log to open the dropdown
    simClick(statusBox);

    // Step 2: Find and click "Pending"
    setTimeout(() => {
      let pendingOpt = findOptionElement(doc, 'Pending');
      if (pendingOpt) {
        simClick(pendingOpt);
      }

      // Step 3: Find and click "Completed"
      setTimeout(() => {
        let completedOpt = findOptionElement(doc, 'Completed');
        if (!completedOpt) {
          // Dropdown might have closed after clicking Pending, re-click status box to open
          simClick(statusBox);
          setTimeout(() => {
            let completedOpt2 = findOptionElement(doc, 'Completed');
            if (completedOpt2) {
              simClick(completedOpt2);
            }
            // Step 4: Click Search inside Payment Log container
            setTimeout(() => {
              clickSearchInContainer(container, doc);
            }, 400);
          }, 300);
        } else {
          simClick(completedOpt);
          // Step 4: Click Search inside Payment Log container
          setTimeout(() => {
            clickSearchInContainer(container, doc);
          }, 400);
        }
      }, 400);
    }, 400);
  }

  // ── Main Flow ──
  let targetDoc = null;
  let pTab = null;

  for (let doc of getFrames()) {
    pTab = findPaymentLogTab(doc);
    if (pTab) {
      targetDoc = doc;
      break;
    }
  }

  if (pTab && targetDoc) {
    // 1. Click Payment Log tab
    simClick(pTab);

    // 2. Wait for Payment Log tab to render
    setTimeout(() => {
      let container = getPaymentLogContainer(pTab, targetDoc);
      executeStatusSelectionAndSearch(container, targetDoc);
    }, 800);
  } else {
    // If already on Payment Log
    for (let doc of getFrames()) {
      let container = getPaymentLogContainer(null, doc);
      executeStatusSelectionAndSearch(container, doc);
    }
  }
})();
