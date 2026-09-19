(function () {
  // Payment Log: select Status = Pending + Completed (multi), then Search.
  // Clicks are scoped to the open Status dropdown only (never table cells).

  function getFrames() {
    var docs = [document];
    var frames = document.querySelectorAll('iframe, frame');
    for (var i = 0; i < frames.length; i++) {
      try {
        if (frames[i].contentDocument) docs.push(frames[i].contentDocument);
      } catch (e) {}
    }
    return docs;
  }

  function simClick(el) {
    if (!el) return;
    try { el.focus(); } catch (e) {}
    try {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    } catch (e) {}
    try { if (typeof el.click === 'function') el.click(); } catch (e) {}
  }

  function findPaymentLogTab(doc) {
    var links = Array.from(doc.querySelectorAll('a.nav-link, a, button, [role="tab"], li'));
    return links.find(function (e) {
      var t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return (t === 'payment log' || t.indexOf('payment log') === 0) &&
        (e.offsetWidth > 0 || e.getBoundingClientRect().width > 0);
    });
  }

  function isWanted(t) {
    t = (t || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return t === 'pending' || t === 'completed';
  }

  function findStatusSelect(doc) {
    // Prefer native <select> that actually has Pending + Completed options
    var selects = Array.from(doc.querySelectorAll('select'));
    var best = null;
    for (var i = 0; i < selects.length; i++) {
      var sel = selects[i];
      var opts = Array.from(sel.options || []).map(function (o) {
        return (o.textContent || o.value || '').toLowerCase().trim();
      });
      if (opts.indexOf('pending') < 0 || opts.indexOf('completed') < 0) continue;
      // Prefer one near a Status label in Filters (not a huge container)
      var wrap = sel.closest('.form-group, .mb-3, .col, [class*="col-"], .bootstrap-select, .chosen-container') || sel.parentElement;
      var labEl = wrap ? wrap.querySelector('label, .form-label, .control-label') : null;
      var lab = (labEl ? labEl.textContent : '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (lab === 'status' || lab === 'status:' || lab === 'status *') return sel;
      if (!best) best = sel;
    }
    if (best) return best;

    // Fallback: Status label → next SELECT in document order (original approach)
    var all = Array.from(doc.querySelectorAll('*'));
    var sLabels = all.filter(function (e) {
      if (e.tagName === 'TH' || e.tagName === 'TD') return false;
      var t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return (t === 'status' || t === 'status *' || t === 'status:') &&
        e.getBoundingClientRect().width > 0 && e.children.length <= 2;
    });
    var sLabel = sLabels.length ? sLabels[sLabels.length - 1] : null;
    if (!sLabel) return null;
    var idx = all.indexOf(sLabel);
    for (var j = idx + 1; j < idx + 40 && j < all.length; j++) {
      if (all[j].tagName === 'SELECT') return all[j];
    }
    return null;
  }

  function applyNative(sel) {
    if (!sel || !sel.options) return 0;
    try { sel.setAttribute('multiple', 'multiple'); sel.multiple = true; } catch (e) {}
    var n = 0;
    var values = [];
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      var want = isWanted(o.textContent || o.value || '');
      o.selected = want;
      if (want) {
        n++;
        values.push(o.value);
      }
    }
    try {
      var proto = window.HTMLSelectElement.prototype;
      var desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set && values.length === 1) desc.set.call(sel, values[0]);
    } catch (e) {}
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    try {
      if (window.jQuery) {
        var $ = window.jQuery;
        $(sel).val(values).trigger('change');
        if ($(sel).data('chosen')) $(sel).trigger('chosen:updated');
        if ($(sel).data('select2')) $(sel).trigger('change');
        if (typeof $(sel).selectpicker === 'function') {
          try { $(sel).selectpicker('val', values); } catch (e2) {}
          try { $(sel).selectpicker('refresh'); } catch (e3) {}
        }
      }
    } catch (e) {}
    return n;
  }

  function findTrigger(sel, doc) {
    if (!sel) return null;
    var wrap = sel.closest('.form-group, .mb-3, .col, [class*="col-"], .bootstrap-select, .chosen-container, .select2') || sel.parentElement;
    if (wrap) {
      var trig = wrap.querySelector(
        '.dropdown-toggle, .filter-option, .filter-option-inner, .chosen-choices, .chosen-single, .select2-selection, button.dropdown-toggle, [role="combobox"]'
      );
      if (trig) return trig;
    }
    return sel;
  }

  function openDropdownMenus(doc) {
    return Array.from(doc.querySelectorAll(
      '.dropdown-menu.show, .dropdown-menu.inner, .select2-results, .select2-dropdown, .chosen-results, ul.dropdown-menu, .bs-container .dropdown-menu'
    )).filter(function (m) {
      return m.offsetWidth > 0 || m.getBoundingClientRect().height > 0;
    });
  }

  function clickInOpenMenu(doc, name) {
    var lower = name.toLowerCase();
    var menus = openDropdownMenus(doc);
    if (!menus.length) return false;
    for (var m = 0; m < menus.length; m++) {
      var items = Array.from(menus[m].querySelectorAll(
        'a, li, span, label, .dropdown-item, [role="option"], .active-result, .select2-results__option'
      ));
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (t !== lower) continue;
        var cb = el.querySelector && el.querySelector('input[type="checkbox"]');
        if (cb) {
          if (!cb.checked) simClick(cb);
        } else {
          simClick(el);
        }
        return true;
      }
      // Also try <option> inside menu wrappers
      var opts = Array.from(menus[m].querySelectorAll('option'));
      for (var k = 0; k < opts.length; k++) {
        var ot = (opts[k].textContent || '').toLowerCase().trim();
        if (ot === lower) {
          opts[k].selected = true;
          if (opts[k].parentElement) opts[k].parentElement.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }

  function clickSearch(doc, refNode) {
    var root = refNode;
    while (root && root !== doc.body) {
      var btn = Array.from(root.querySelectorAll('button, input[type="submit"], a')).find(function (b) {
        var t = (b.textContent || b.value || '').toLowerCase().trim();
        return t === 'search' && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
      if (btn) {
        try { btn.style.outline = '3px solid lime'; } catch (e) {}
        simClick(btn);
        return true;
      }
      root = root.parentElement;
    }
    var all = Array.from(doc.querySelectorAll('button')).filter(function (b) {
      return (b.textContent || '').toLowerCase().trim() === 'search' && b.offsetWidth > 0;
    });
    if (all.length) {
      simClick(all[all.length - 1]);
      return true;
    }
    return false;
  }

  function run(doc) {
    var sel = findStatusSelect(doc);
    var trig = findTrigger(sel, doc);
    var selected = applyNative(sel);

    // Open UI widget and click Pending then Completed inside the open menu only
    if (trig) simClick(trig);

    setTimeout(function () {
      clickInOpenMenu(doc, 'Pending');
      applyNative(sel);
      setTimeout(function () {
        // Keep/re-open menu for second pick (some widgets close after one click)
        if (!openDropdownMenus(doc).length && trig) simClick(trig);
        setTimeout(function () {
          clickInOpenMenu(doc, 'Completed');
          applyNative(sel);
          try { doc.activeElement && doc.activeElement.blur(); } catch (e) {}
          try {
            doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
          } catch (e) {}
          setTimeout(function () {
            applyNative(sel);
            try {
              if (sel) sel.style.outline = selected >= 1 ? '3px solid lime' : '3px solid red';
            } catch (e) {}
            clickSearch(doc, sel || trig || doc.body);
          }, 400);
        }, 350);
      }, 450);
    }, 500);
  }

  var targetDoc = document;
  var pTab = null;
  var frames = getFrames();
  for (var i = 0; i < frames.length; i++) {
    pTab = findPaymentLogTab(frames[i]);
    if (pTab) { targetDoc = frames[i]; break; }
  }
  if (!pTab) pTab = findPaymentLogTab(document);

  if (pTab) {
    simClick(pTab);
    setTimeout(function () { run(targetDoc || document); }, 1400);
  } else {
    run(document);
  }
})();
