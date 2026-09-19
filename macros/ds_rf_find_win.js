(function () {
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
    var labs = Array.from(document.querySelectorAll('label, .form-label, .control-label, span, div, p'));
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
        if (t.indexOf('amount') >= 0 && t.indexOf('in') >= 0 && t.indexOf('from') >= 0 && t.indexOf('out') < 0 && t.length < 80) {
          return el;
        }
        p = p.parentElement;
      }
    }
    return null;
  }
  function findSearch() {
    return Array.from(document.querySelectorAll('button')).find(function (b) {
      return (b.textContent || '').toLowerCase().trim() === 'search' && b.offsetWidth > 0;
    });
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
  function ensureTransactionsTab() {
    var dateFrom = findByLabel('date from');
    if (dateFrom) return true;
    var links = Array.from(document.querySelectorAll('a.nav-link, a, button, [role="tab"]'));
    var tab = links.find(function (e) {
      return (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim() === 'transactions' && e.offsetWidth > 0;
    });
    if (tab) simClick(tab);
    return false;
  }
  function getRows() {
    var tables = Array.from(document.querySelectorAll('table'));
    var tbl = tables.find(function (t) {
      var h = (t.textContent || '').toLowerCase();
      return h.indexOf('date') >= 0 && h.indexOf('type') >= 0 && (t.offsetWidth > 0);
    });
    if (!tbl) return [];
    var trs = Array.from(tbl.querySelectorAll('tr')).filter(function (tr) {
      return tr.querySelector('td') && tr.children.length >= 8;
    });
    return trs.map(function (tr) {
      var c = tr.children;
      return {
        date: c[1] ? (c[1].textContent || '').trim() : '',
        type: c[3] ? (c[3].textContent || '').trim() : '',
        inVal: c[6] ? (c[6].textContent || '').trim() : '',
        inCurr: c[7] ? (c[7].textContent || '').trim() : 'PLN',
        note: c[c.length - 2] ? (c[c.length - 2].textContent || '').trim() : ''
      };
    });
  }
  function parseAmt(s) {
    var n = parseFloat(String(s || '').replace(/[^\d.\-]/g, ''));
    return isNaN(n) ? 0 : Math.abs(n);
  }
  function extractGame(note) {
    return String(note || '').replace(/R:\s*\d+.*$/i, '').replace(/\s+/g, ' ').trim();
  }

  function doSearchAndFind() {
    clearType();
    var d = new Date();
    d.setDate(d.getDate() - 31);
    var dateVal = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') +
      ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

    var dateFrom = findByLabel('date from');
    var amtFrom = findAmountInFrom();
    if (!dateFrom) { copy('REAL_FUND:FAIL:NO_DATE_INPUT'); return; }

    setVal(dateFrom, dateVal);
    if (amtFrom) setVal(amtFrom, '5000');

    var btn = findSearch();
    if (btn) btn.click();

    setTimeout(function () {
      setVal(dateFrom, dateVal);
      if (amtFrom) setVal(amtFrom, '5000');
      var rows = getRows();
      var best = null;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if ((r.type || '').toUpperCase().indexOf('WIN') < 0) continue;
        var amt = parseAmt(r.inVal);
        if (amt < 5000) continue;
        if (!best || amt > best.amt) best = { row: r, amt: amt };
      }
      if (!best) { copy('REAL_FUND:NO_WIN'); return; }
      var game = extractGame(best.row.note);
      var payload = 'REAL_FUND:WIN|' + best.row.date + '|' + best.amt.toFixed(2) + '|' +
        (best.row.inCurr || 'PLN').toUpperCase() + '|' + (game || 'Unknown');
      window.__RF_WIN__ = payload;
      copy(payload);
    }, 4500);
  }

  // If still on Payment Log, open Transactions then wait for filters
  if (!ensureTransactionsTab()) {
    setTimeout(function () {
      if (!findByLabel('date from')) {
        ensureTransactionsTab();
        setTimeout(doSearchAndFind, 2000);
      } else {
        doSearchAndFind();
      }
    }, 2500);
  } else {
    doSearchAndFind();
  }
})();
