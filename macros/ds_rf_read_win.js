(function () {
  // SYNC ONLY — read Transactions table for largest WIN >= 5000. No setTimeout.
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
  function parseAmt(s) {
    var n = parseFloat(String(s || '').replace(/[^\d.\-]/g, ''));
    return isNaN(n) ? 0 : Math.abs(n);
  }
  function extractGame(note) {
    return String(note || '').replace(/R:\s*\d+.*$/i, '').replace(/\s+/g, ' ').trim();
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

  var rows = getRows();
  var best = null;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if ((r.type || '').toUpperCase().indexOf('WIN') < 0) continue;
    var amt = parseAmt(r.inVal);
    if (amt < 5000) continue;
    if (!best || amt > best.amt) best = { row: r, amt: amt };
  }
  if (!best) {
    copy('REAL_FUND:NO_WIN|ROWS:' + rows.length);
    return;
  }
  var game = extractGame(best.row.note);
  copy(
    'REAL_FUND:WIN|' + best.row.date + '|' + best.amt.toFixed(2) + '|' +
    (best.row.inCurr || 'PLN').toUpperCase() + '|' + (game || 'Unknown')
  );
})();
