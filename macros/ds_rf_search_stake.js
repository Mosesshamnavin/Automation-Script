(function () {
  // SYNC ONLY — narrow date window around WIN and Search. No setTimeout copies.
  var winDate = '###WIN_DATE###';

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
  function parseTs(s) {
    var d = new Date(String(s).trim().replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;
    var m = String(s).match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
    if (m) {
      d = new Date(m[1] + 'T' + m[2] + 'Z');
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }
  function fmtUtc(d) {
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0') + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' +
      String(d.getUTCMinutes()).padStart(2, '0');
  }
  function simClick(el) {
    if (!el) return;
    try {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    } catch (e) {}
    try { if (typeof el.click === 'function') el.click(); } catch (e) {}
  }

  if (!winDate || winDate.indexOf('###') === 0) {
    copy('REAL_FUND:FAIL:NO_WIN_DATE');
    return;
  }

  var ts = parseTs(winDate);
  var fromVal = fmtUtc(new Date(ts.getTime() - 3 * 60 * 1000));
  var toVal = fmtUtc(new Date(ts.getTime() + 60 * 1000));

  var dateFrom = findByLabel('date from');
  var dateTo = findByLabel('date to');
  var amtFrom = findAmountInFrom();
  if (!dateFrom) {
    copy('REAL_FUND:FAIL:NO_DATE_INPUT');
    return;
  }

  if (amtFrom) setVal(amtFrom, '');
  setVal(dateFrom, fromVal);
  if (dateTo) setVal(dateTo, toVal);

  var btn = Array.from(document.querySelectorAll('button')).find(function (b) {
    return (b.textContent || '').toLowerCase().trim() === 'search' && b.offsetWidth > 0;
  });
  if (btn) simClick(btn);
  copy('REAL_FUND:STAKE_SEARCHED');
})();
