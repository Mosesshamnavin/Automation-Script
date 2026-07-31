(function () {
  try {
    function getFrames() {
      let docs = [document];
      let frames = document.querySelectorAll('iframe, frame');
      for (let f of frames) {
        try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
      }
      return docs;
    }

    function normStr(s) {
      if (!s) return '';
      return s.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ł/g, 'l')
        .replace(/Ł/g, 'L')
        .toLowerCase().trim();
    }

    for (let doc of getFrames()) {
      if (!doc || !doc.body) continue;
      let all = Array.from(doc.querySelectorAll('*'));

      function getVal(lbl) {
        let l = all.find(e => e.children.length === 0 && e.textContent.trim().toLowerCase() === lbl.toLowerCase());
        if (!l) return '';
        if (l.tagName === 'TD' && l.nextElementSibling) return l.nextElementSibling.textContent.trim();
        let tr = l.closest('tr');
        if (tr && tr.children.length >= 2) return tr.children[1].textContent.trim();
        if (l.nextElementSibling) return l.nextElementSibling.textContent.trim();
        return '';
      }

      let op = getVal('Operator').toUpperCase();
      let fn = getVal('first name');
      let ln = getVal('last name');
      let wid = getVal('wallet_id');

      if (op.includes('COINSPAID')) {
        prompt('RESULT:', 'COINSPAID_SKIP|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + getVal('city') + '|OP:' + op);
        return;
      }

      let reqHeader = all.find(e => e.children.length === 0 && e.textContent.trim().toLowerCase() === 'request data');
      let reqStr = '';
      if (reqHeader) {
        let tr = reqHeader.closest('tr');
        if (tr && tr.nextElementSibling) {
          reqStr = tr.nextElementSibling.textContent.trim();
        } else if (reqHeader.closest('table')) {
          let tbl = reqHeader.closest('table');
          let rows = Array.from(tbl.querySelectorAll('tbody tr, tr')).filter(r => r !== reqHeader.closest('tr'));
          if (rows.length > 0) reqStr = rows[0].textContent.trim();
        }
      }

      if (!reqStr) {
        let JSONEl = all.find(
          e => e.children.length === 0 &&
            (e.textContent.includes('maskedAccount') || e.textContent.includes('userId') || e.textContent.includes('accountHolder'))
        );
        if (JSONEl) reqStr = JSONEl.textContent.trim();
      }

      if (reqStr) {
        let match = reqStr.match(/["']?maskedAccount["']?\s*[:=]\s*["']([^"']+)["']/i);
        if (!match) match = reqStr.match(/["']?maskedAccount["']?\s*[:=]\s*["']?([^,}\r\n]+)/i);
        let acc = match ? match[1].replace(/["']/g, '').trim() : '';

        if (op.includes('PAYSAFECARD') || op.includes('SKRILL')) {
          if (acc) {
            prompt('RESULT:', acc + '|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + getVal('city') + '|OP:' + op);
          } else {
            prompt('MISMATCH:', 'NAMEFAIL:maskedAccount not found|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + getVal('city') + '|OP:' + op);
          }
          return;
        } else {
          let fnNorm = normStr(fn);
          let lnNorm = normStr(ln);
          let reqNorm = normStr(reqStr);
          let fnMatch = !fnNorm || reqNorm.includes(fnNorm);
          let lnMatch = !lnNorm || reqNorm.includes(lnNorm);

          if (fnMatch && lnMatch) {
            if (acc) {
              prompt('RESULT:', acc + '|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + getVal('city') + '|OP:' + op);
            } else {
              prompt('RESULT:', reqStr + '|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + getVal('city') + '|OP:' + op);
            }
            return;
          } else {
            prompt('MISMATCH:', 'NAMEFAIL:' + fn + ' ' + ln + '|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + getVal('city') + '|OP:' + op);
            return;
          }
        }
      }
    }

    prompt('ERROR:', 'NOTFOUND|WALLET:');
  } catch (e) {
    prompt('ERROR:', 'NOTFOUND|WALLET:');
  }
})();
