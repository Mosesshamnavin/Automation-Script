(function () {
  // SYNC ONLY — set Transactions WIN filters and click Search. No setTimeout copies.
  function copy(t) {
    try {
      var ta = document.getElementById('__rf_clip__');
      if (!ta) {
        ta = document.createElement('textarea');
        ta.id = '__rf_clip__';
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;z-index:2147483647;';
        document.body.appendChild(ta);
      }
      ta.value = t;
      window.__RF_STATUS__ = t;
      try { window.name = t; } catch (e) {}
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      document.execCommand('copy');
    } catch (e) {}
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
  function setVal(el, val) {
    if (!el) return;
    try {
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      if (setter) setter.call(el, val); else el.value = val;
    } catch (e) { el.value = val; }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function findByLabel(labelText) {
    var want = labelText.toLowerCase();
    var labs = Array.from(document.querySelectorAll('label, .form-label, .control-label'));
    var lab = labs.find(function (el) {
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return t === want || t === want + ':';
    });
    if (!lab) return null;
    var wrap = lab.closest('.form-group, .mb-3, .col, [class*="col-"], td, .form-item') || lab.parentElement;
    return wrap ? wrap.querySelector('input:not([type="hidden"]), select') : null;
  }
  function findAmountInFrom() {
    var inp = findByLabel('amount range in (from)') || findByLabel('amount range in from');
    if (inp) return inp;
    var inputs = Array.from(document.querySelectorAll('input'));
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.offsetWidth === 0 && el.getBoundingClientRect().width === 0) continue;
      var p = el.parentElement;
      for (var lv = 0; lv < 5 && p; lv++) {
        var t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ');
        if (t.indexOf('amount') >= 0 && t.indexOf('in') >= 0 && t.indexOf('from') >= 0 &&
            t.indexOf('out') < 0 && t.length < 100) return el;
        p = p.parentElement;
      }
    }
    return null;
  }
  function clearType() {
    var labs = Array.from(document.querySelectorAll('label, .form-label, .control-label'));
    var lab = labs.find(function (l) {
      var t = (l.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return t === 'type' || t === 'type:';
    });
    if (!lab) return;
    var wrap = lab.closest('.form-group, .mb-3, .col, [class*="col-"]') || lab.parentElement;
    var sel = wrap ? wrap.querySelector('select') : null;
    if (sel) {
      sel.selectedIndex = 0;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  var dateFrom = findByLabel('date from');
  if (!dateFrom) {
    var links = Array.from(document.querySelectorAll('a.nav-link, a, button, [role="tab"]'));
    var tab = links.find(function (e) {
      return (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim() === 'transactions' && e.offsetWidth > 0;
    });
    if (tab) {
      copy('REAL_FUND:NEED_TAB');
      simClick(tab);
      return;
    }
    copy('REAL_FUND:FAIL:NO_DATE_INPUT');
    return;
  }

  clearType();
  var d = new Date();
  d.setDate(d.getDate() - 31);
  var dateVal = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');

  setVal(dateFrom, dateVal);
  var amtFrom = findAmountInFrom();
  if (amtFrom) {
    setVal(amtFrom, '5000');
    try { amtFrom.style.outline = '3px solid lime'; } catch (e) {}
  }
  try { dateFrom.style.outline = '3px solid lime'; } catch (e) {}

  var btn = Array.from(document.querySelectorAll('button')).find(function (b) {
    return (b.textContent || '').toLowerCase().trim() === 'search' && b.offsetWidth > 0;
  });
  if (btn) {
    try { btn.style.outline = '3px solid lime'; } catch (e) {}
    simClick(btn);
  }
  copy('REAL_FUND:SEARCHED');
})();
