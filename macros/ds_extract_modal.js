(function () {
  try {
    let targetId = '###PLAYER_ID###';
    let targetEmail = '###PLAYER_EMAIL###';
    let targetName = '###PLAYER_NAME###';

    if (targetId.startsWith('###')) targetId = '';
    if (targetEmail.startsWith('###')) targetEmail = '';
    if (targetName.startsWith('###')) targetName = '';

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

      // Find modal / dialog containers
      let allContainers = Array.from(doc.querySelectorAll('.x-window, .modal, [role="dialog"], .dialog, .popup, [class*="window"], [class*="modal"]'));
      
      // Filter for visible containers
      let visibleContainers = allContainers.filter(c => {
        let style = window.getComputedStyle(c);
        return style.display !== 'none' && style.visibility !== 'hidden' && (c.offsetWidth > 0 || c.offsetHeight > 0);
      });

      // Fallback: If no standard modal containers found, find container enclosing 'Payments Details'
      if (visibleContainers.length === 0) {
        let headers = Array.from(doc.querySelectorAll('div, span, h1, h2, h3, h4, p, td, th')).filter(e => {
          let t = e.textContent.trim().toLowerCase();
          return t.startsWith('payments details') || t.startsWith('payment details');
        });
        for (let h of headers) {
          let parent = h.closest('.x-window, .modal, [role="dialog"], .dialog, .popup, div[style*="position: fixed"], div[style*="position: absolute"]') || h.parentElement;
          if (parent && !visibleContainers.includes(parent)) {
            visibleContainers.push(parent);
          }
        }
      }

      let activeContainer = null;

      // 1. Try to find container matching targetId
      if (targetId && visibleContainers.length > 0) {
        activeContainer = visibleContainers.slice().reverse().find(c => {
          let txt = (c.innerText || c.textContent || '');
          return txt.includes(targetId);
        });
      }

      // 2. Try to find container matching targetEmail or targetName
      if (!activeContainer && (targetEmail || targetName) && visibleContainers.length > 0) {
        activeContainer = visibleContainers.slice().reverse().find(c => {
          let txt = (c.innerText || c.textContent || '').toLowerCase();
          return (targetEmail && txt.includes(targetEmail.toLowerCase())) ||
                 (targetName && txt.includes(targetName.toLowerCase()));
        });
      }

      // 3. If targetId was specified but container doesn't match and has a different numeric ID, do NOT use stale container
      if (!activeContainer && visibleContainers.length > 0) {
        let candidate = visibleContainers[visibleContainers.length - 1];
        let cTxt = candidate.innerText || candidate.textContent || '';
        // If candidate contains an obvious different transaction ID, reject it
        let hasWrongId = targetId && /\b\d{7}\b/.test(cTxt) && !cTxt.includes(targetId);
        if (!hasWrongId) {
          activeContainer = candidate;
        }
      }

      if (!activeContainer) {
        // If no valid modal container found yet, report NOTFOUND so python can retry/fallback
        continue;
      }

      let root = activeContainer;
      let all = Array.from(root.querySelectorAll('*'));

      function getVal(lbl) {
        let l = all.find(e => e.children.length === 0 && e.textContent.trim().toLowerCase() === lbl.toLowerCase());
        if (!l) return '';
        if (l.tagName === 'TD' && l.nextElementSibling) return l.nextElementSibling.textContent.trim();
        let tr = l.closest('tr');
        if (tr && tr.children.length >= 2) return tr.children[1].textContent.trim();
        if (l.nextElementSibling) return l.nextElementSibling.textContent.trim();
        return '';
      }

      let op = (getVal('Operator') || getVal('Operator Name')).toUpperCase();
      let fn = getVal('first name') || getVal('Firstname') || getVal('Name');
      let ln = getVal('last name') || getVal('Lastname') || getVal('Surname');
      let wid = getVal('wallet_id') || getVal('wallet id') || getVal('Wallet ID') || getVal('Wallet');
      let city = getVal('city') || getVal('City');

      let emailVal = getVal('login') || getVal('email') || getVal('player login') || getVal('user') || '';
      if (!emailVal || !emailVal.includes('@')) {
        let rootTxt = root.innerText || root.textContent || '';
        let emMatch = rootTxt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emMatch) emailVal = emMatch[0].trim().toLowerCase();
      }
      let brandVal = getVal('brand') || '';
      let wValueVal = getVal('amount') || getVal('value') || getVal('w value') || '';
      let tCurrVal = getVal('currency') || getVal('t currency') || getVal('w currency') || '';

      // If wid is empty in labels, check input fields/cells inside active modal container
      if (!wid) {
        let allInputs = Array.from(root.querySelectorAll('input, td, span, a'));
        let widEl = allInputs.find(e => ((e.value || e.textContent || '').trim().match(/^[a-f0-9]{20,}$/i)));
        if (widEl) wid = (widEl.value || widEl.textContent || '').trim();
      }

      if (op.includes('COINSPAID')) {
        prompt('RESULT:', 'COINSPAID_SKIP|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + city + '|OP:' + op + '|EMAIL:' + emailVal + '|BRAND:' + brandVal + '|WVAL:' + wValueVal + '|CURR:' + tCurrVal);
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

      let match = reqStr.match(/["']?maskedAccount["']?\s*[:=]\s*["']([^"']+)["']/i);
      if (!match) match = reqStr.match(/["']?maskedAccount["']?\s*[:=]\s*["']?([^,}\r\n]+)/i);
      let acc = match ? match[1].replace(/["']/g, '').trim() : '';

      let matchAH = reqStr.match(/["']?accountHolder["']?\s*[:=]\s*["']([^"']+)["']/i);
      if (!matchAH) matchAH = reqStr.match(/["']?accountHolder["']?\s*[:=]\s*["']?([^,}\r\n]+)/i);
      let accountHolder = matchAH ? matchAH[1].replace(/["']/g, '').trim() : '';

      let fnNorm = normStr(fn);
      let lnNorm = normStr(ln);
      let ahNorm = normStr(accountHolder);

      let isNoHolderOp = op.includes('PAYSAFECARD') || op.includes('PAYSAFE') || op.includes('SKRILL') || op.includes('COINSPAID');
      let hasValidAccountHolder = accountHolder &&
        accountHolder.toLowerCase() !== 'null' &&
        accountHolder.toLowerCase() !== 'undefined' &&
        accountHolder.trim() !== '';

      let fnWords = fnNorm.split(/\s+/).filter(w => w.length > 1);
      let lnWords = lnNorm.split(/\s+/).filter(w => w.length > 1);

      let isThirdParty = false;
      if (!isNoHolderOp && hasValidAccountHolder) {
        let fnMatched = fnWords.some(w => ahNorm.includes(w));
        let lnMatched = lnWords.some(w => ahNorm.includes(w));
        let nameMatch = fnMatched || lnMatched || (lnNorm && ahNorm.includes(lnNorm)) || (fnNorm && ahNorm.includes(fnNorm));
        if (!nameMatch) {
          isThirdParty = true;
        }
      }

      let matchIban = reqStr.match(/["']?iban["']?\s*[:=]\s*["']([^"']+)["']/i);
      if (!matchIban) matchIban = reqStr.match(/["']?iban["']?\s*[:=]\s*["']?([^,}\r\n]+)/i);
      let directIban = matchIban ? matchIban[1].replace(/["']/g, '').trim() : '';

      let isGbIban = /\bGB\d{2}[A-Z0-9]+/i.test(acc) || /\bGB\d{2}[A-Z0-9]+/i.test(directIban) || /^GB\d{2}/i.test(acc) || /^GB\d{2}/i.test(directIban);
      let gbFlag = isGbIban ? "YES" : "NO";

      let cleanAccHolder = hasValidAccountHolder ? accountHolder : '';
      let tpFlag = isThirdParty ? "YES" : "NO";
      let resPrefix = isThirdParty ? ("NAMEFAIL:" + (cleanAccHolder || (fn + ' ' + ln))) : (acc || directIban || 'OK');
      let fullRes = resPrefix + '|WALLET:' + wid + '|FN:' + fn + '|LN:' + ln + '|CITY:' + city + '|OP:' + op + '|ACCHOLDER:' + cleanAccHolder + '|THIRDPARTY:' + tpFlag + '|GB_IBAN:' + gbFlag + '|EMAIL:' + emailVal + '|BRAND:' + brandVal + '|WVAL:' + wValueVal + '|CURR:' + tCurrVal;
      try {
        let ta = doc.createElement('textarea');
        ta.value = fullRes;
        ta.style.position = 'fixed';
        ta.style.opacity = '0.01';
        (doc.body || document.body).appendChild(ta);
        ta.select();
        doc.execCommand('copy');
        ta.remove();
      } catch(e){}
      try { prompt(isThirdParty ? 'MISMATCH:' : 'RESULT:', fullRes); } catch(e){}
      return;
    }

    try {
      let ta = document.createElement('textarea');
      ta.value = 'NOTFOUND|WALLET:';
      ta.style.position = 'fixed';
      ta.style.opacity = '0.01';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    } catch(e){}
    try { prompt('ERROR:', 'NOTFOUND|WALLET:'); } catch(e){}
  } catch (e) {
    try { prompt('ERROR:', 'NOTFOUND|WALLET:'); } catch(e){}
  }
})();
