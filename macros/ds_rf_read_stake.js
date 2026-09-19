(function () {
  // SYNC ONLY — find STAKE row below the WIN. No setTimeout.
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
  function findStake(rows, dateStr) {
    var prefix = String(dateStr || '').replace(/Z$/, '').slice(0, 19);
    var winIdx = -1;
    for (var i = 0; i < rows.length; i++) {
      var rd = (rows[i].date || '').replace(/Z$/, '').slice(0, 19);
      if ((rd === prefix || (rows[i].date || '').indexOf(String(dateStr).slice(0, 16)) >= 0) &&
          (rows[i].type || '').toUpperCase().indexOf('WIN') >= 0) {
        winIdx = i;
        break;
      }
    }
    if (winIdx < 0) {
      // Fallback: first WIN row matching amount
      var wantAmt = parseAmt(winAmt);
      for (var k = 0; k < rows.length; k++) {
        if ((rows[k].type || '').toUpperCase().indexOf('WIN') >= 0 &&
            Math.abs(parseAmt(rows[k].inVal) - wantAmt) < 0.01) {
          winIdx = k;
          break;
        }
      }
    }
    if (winIdx < 0) return null;
    var winGame = extractGame(rows[winIdx].note).toLowerCase();
    for (var j = winIdx + 1; j < Math.min(rows.length, winIdx + 8); j++) {
      if ((rows[j].type || '').toUpperCase().indexOf('STAKE') < 0) continue;
      var g = extractGame(rows[j].note).toLowerCase();
      if (!winGame || !g || g === winGame || g.indexOf(winGame) >= 0 || winGame.indexOf(g) >= 0) {
        return rows[j];
      }
    }
    for (var j2 = winIdx + 1; j2 < Math.min(rows.length, winIdx + 4); j2++) {
      if ((rows[j2].type || '').toUpperCase().indexOf('STAKE') >= 0) return rows[j2];
    }
    return null;
  }

  if (!winDate || winDate.indexOf('###') === 0) {
    copy('REAL_FUND:FAIL:NO_WIN_DATE');
    return;
  }

  var rows = getRows();
  var stake = findStake(rows, winDate);
  var stakeAmt = stake ? parseAmt(stake.inVal).toFixed(2) : '0.00';
  var stakeCurr = stake ? (stake.inCurr || winCurr || 'PLN').toUpperCase() : (winCurr || 'PLN');
  if (stake && (!game || game === 'Unknown')) game = extractGame(stake.note) || game;

  copy(
    'REAL_FUND:OK|DATE:' + winDate + '|WIN:' + winAmt + '|STAKE:' + stakeAmt +
    '|CURR:' + stakeCurr + '|GAME:' + (game || 'Unknown') + '|ROWS:' + rows.length +
    (stake ? '' : '|NOTE:NO_STAKE_ROW')
  );
})();
