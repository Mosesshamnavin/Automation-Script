(function () {
  var winDate = '###WIN_DATE###';
  var winAmt = '###WIN_AMT###';
  var winCurr = '###WIN_CURR###';
  var game = '###WIN_GAME###';

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
      var p = el.parentElement;
      for (var lv = 0; lv < 5 && p; lv++) {
        var t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ');
        if (t.indexOf('amount') >= 0 && t.indexOf('in') >= 0 && t.indexOf('from') >= 0 && t.indexOf('out') < 0 && t.length < 80) return el;
        p = p.parentElement;
      }
    }
    return null;
  }
  function parseTs(s) {
    var d = new Date(String(s).trim().replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;
    var m = String(s).match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
    if (m) { d = new Date(m[1] + 'T' + m[2] + 'Z'); if (!isNaN(d.getTime())) return d; }
    return new Date();
  }
  function fmtUtc(d) {
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0') +
      ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  }
  function getRows() {
    var tables = Array.from(document.querySelectorAll('table'));
    var tbl = tables.find(function (t) {
      var h = (t.textContent || '').toLowerCase();
      return h.indexOf('date') >= 0 && h.indexOf('type') >= 0 && t.offsetWidth > 0;
    });
    if (!tbl) return [];
    return Array.from(tbl.querySelectorAll('tr')).filter(function (tr) {
      return tr.querySelector('td') && tr.children.length >= 8;
    }).map(function (tr) {
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
  function findStake(rows, dateStr) {
    var prefix = String(dateStr || '').replace(/Z$/, '').slice(0, 19);
    var winIdx = -1;
    for (var i = 0; i < rows.length; i++) {
      var rd = (rows[i].date || '').replace(/Z$/, '').slice(0, 19);
      if ((rd === prefix || (rows[i].date || '').indexOf(dateStr) >= 0) &&
          (rows[i].type || '').toUpperCase().indexOf('WIN') >= 0) { winIdx = i; break; }
    }
    if (winIdx < 0) return null;
    var winGame = extractGame(rows[winIdx].note).toLowerCase();
    for (var j = winIdx + 1; j < Math.min(rows.length, winIdx + 6); j++) {
      if ((rows[j].type || '').toUpperCase().indexOf('STAKE') < 0) continue;
      var g = extractGame(rows[j].note).toLowerCase();
      if (!winGame || !g || g === winGame || g.indexOf(winGame) >= 0 || winGame.indexOf(g) >= 0) return rows[j];
    }
    return winIdx + 1 < rows.length ? rows[winIdx + 1] : null;
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
  if (amtFrom) setVal(amtFrom, '');
  if (dateFrom) setVal(dateFrom, fromVal);
  if (dateTo) setVal(dateTo, toVal);

  var btn = Array.from(document.querySelectorAll('button')).find(function (b) {
    return (b.textContent || '').toLowerCase().trim() === 'search' && b.offsetWidth > 0;
  });
  if (btn) btn.click();

  setTimeout(function () {
    var rows = getRows();
    var stake = findStake(rows, winDate);
    if (!stake) {
      if (dateFrom) setVal(dateFrom, fmtUtc(new Date(ts.getTime() - 15 * 60 * 1000)));
      if (dateTo) setVal(dateTo, fmtUtc(new Date(ts.getTime() + 5 * 60 * 1000)));
      if (btn) btn.click();
      setTimeout(function () {
        stake = findStake(getRows(), winDate);
        finish(stake);
      }, 4500);
      return;
    }
    finish(stake);
  }, 4500);

  function finish(stake) {
    var stakeAmt = stake ? parseAmt(stake.inVal).toFixed(2) : '0.00';
    var stakeCurr = stake ? (stake.inCurr || winCurr || 'PLN').toUpperCase() : (winCurr || 'PLN');
    if (stake && (!game || game === 'Unknown')) game = extractGame(stake.note) || game;
    copy('REAL_FUND:OK|DATE:' + winDate + '|WIN:' + winAmt + '|STAKE:' + stakeAmt +
      '|CURR:' + stakeCurr + '|GAME:' + (game || 'Unknown'));
  }
})();
