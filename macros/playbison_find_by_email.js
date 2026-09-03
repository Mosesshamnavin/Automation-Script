// Dynamic placeholder:
//   ###TARGET_EMAIL### -> the target email to find in the table

(function () {
  let targetEmail = '###TARGET_EMAIL###'.toLowerCase().trim();

  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
    }
    return docs;
  }

  function copyToClipboard(payload, doc) {
    let d = doc || document;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload);
      }
    } catch(e){}
    try {
      let ta = d.createElement('textarea');
      ta.value = payload;
      ta.style.position = 'fixed';
      ta.style.top = '10px';
      ta.style.left = '10px';
      ta.style.width = '10px';
      ta.style.height = '10px';
      ta.style.opacity = '0.01';
      ta.style.zIndex = '999999';
      (d.body || document.body).appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, 999999);
      d.execCommand('copy');
      document.execCommand('copy');
      setTimeout(() => { try { ta.remove(); } catch(e){} }, 500);
    } catch(e){}
  }

  function findPrevButton(doc) {
    let els = Array.from(doc.querySelectorAll('*'));
    let prev = els.reverse().find(e => {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(e.tagName)) return false;
      let t = e.textContent.trim().toLowerCase();
      let v = (e.value || '').trim().toLowerCase();
      return (t.includes('previous') || v.includes('previous')) && e.children.length === 0 && e.getBoundingClientRect().width > 0;
    });
    if (!prev) {
      prev = Array.from(doc.querySelectorAll('button, a')).find(
        e => e.textContent.toLowerCase().includes('previous') && e.getBoundingClientRect().width > 0
      );
    }
    return prev;
  }

  for (let doc of getFrames()) {
    if (!doc || !doc.body) continue;
    let tables = Array.from(doc.querySelectorAll('table'));
    for (let tbl of tables) {
      let ths = Array.from(tbl.querySelectorAll('th'));
      if (ths.length === 0) {
        let firstTr = tbl.querySelector('thead tr, tr');
        if (firstTr) ths = Array.from(firstTr.querySelectorAll('th, td'));
      }
      if (ths.length === 0) continue;

      let loginTh = ths.find(th => {
        let t = th.textContent.trim().toLowerCase();
        return t === 'login' || t === 'email' || t === 'user' || t === 'player';
      });
      if (!loginTh) continue;

      let idTh = ths.find(th => th.textContent.trim().toLowerCase() === 'id');
      let brandTh = ths.find(th => th.textContent.trim().toLowerCase() === 'brand');
      let wValueTh = ths.find(th => {
        let t = th.textContent.trim().toLowerCase();
        return t === 'w value' || t === 'value w currency' || t === 't value' || t === 'value';
      });
      let tCurrTh = ths.find(th => {
        let t = th.textContent.trim().toLowerCase();
        return t === 'w currency' || t === 't currency' || t === 'currency';
      });
      let dateTh = ths.find(th => th.textContent.trim().toLowerCase() === 'date' || th.textContent.trim().toLowerCase() === 'created');
      let walletIdTh = ths.find(th => {
        let t = th.textContent.trim().toLowerCase();
        return t === 'wallet id' || t === 'wallet_id' || t === 'wallet';
      });
      let opTh = ths.find(th => {
        let t = th.textContent.trim().toLowerCase();
        return t === 'operator' || t === 'operator name' || t === 'payment method';
      });
      let nameTh = ths.find(th => th.textContent.trim().toLowerCase() === 'name');

      let loginIdx = ths.indexOf(loginTh);
      let idIdx = idTh ? ths.indexOf(idTh) : -1;
      let brandIdx = brandTh ? ths.indexOf(brandTh) : -1;
      let wValueIdx = wValueTh ? ths.indexOf(wValueTh) : -1;
      let tCurrIdx = tCurrTh ? ths.indexOf(tCurrTh) : -1;
      let dateIdx = dateTh ? ths.indexOf(dateTh) : -1;
      let walletIdIdx = walletIdTh ? ths.indexOf(walletIdTh) : -1;
      let opIdx = opTh ? ths.indexOf(opTh) : -1;
      let nameIdx = nameTh ? ths.indexOf(nameTh) : -1;

      let trs = Array.from(tbl.querySelectorAll('tbody tr'));
      if (trs.length === 0) trs = Array.from(tbl.querySelectorAll('tr')).slice(1);
      if (trs.length === 0) continue;

      for (let tr of trs) {
        let rawLogin = loginIdx !== -1 && tr.children[loginIdx] ? tr.children[loginIdx].textContent : '';
        let rowEmail = '';
        let m = rawLogin.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (m) rowEmail = m[0].trim().toLowerCase();
        else rowEmail = rawLogin.trim().toLowerCase();

        if (rowEmail === targetEmail || rawLogin.toLowerCase().includes(targetEmail)) {
          let foundId = idIdx !== -1 && tr.children[idIdx] ? tr.children[idIdx].textContent.trim() : '';
          let foundBrand = brandIdx !== -1 && tr.children[brandIdx] ? tr.children[brandIdx].textContent.trim() : '';
          let foundWValue = wValueIdx !== -1 && tr.children[wValueIdx] ? tr.children[wValueIdx].textContent.trim() : '';
          let foundTCurr = tCurrIdx !== -1 && tr.children[tCurrIdx] ? tr.children[tCurrIdx].textContent.trim().toUpperCase() : 'PLN';
          let foundDate = dateIdx !== -1 && tr.children[dateIdx] ? tr.children[dateIdx].textContent.trim() : '';
          let foundWalletId = '';
          if (walletIdIdx !== -1 && tr.children[walletIdIdx]) {
            let wTd = tr.children[walletIdIdx];
            let a = wTd.querySelector('a');
            let href = a ? (a.getAttribute('href') || a.href || '') : '';
            let hrefMatch = href.match(/admin\.user:([a-f0-9]+)/i);
            if (hrefMatch) foundWalletId = hrefMatch[1].trim();
            else foundWalletId = wTd.textContent.trim();
          }
          let foundOp = opIdx !== -1 && tr.children[opIdx] ? tr.children[opIdx].textContent.trim() : '';
          let foundName = nameIdx !== -1 && tr.children[nameIdx] ? tr.children[nameIdx].textContent.trim() : '';

          tr.style.backgroundColor = '#d4edda';
          let payload = 'FOUND|' + rowEmail + '|' + foundId + '|' + foundBrand + '|' + foundWValue + '|' + foundTCurr + '|' + foundDate + '|' + foundWalletId + '|' + foundOp + '|' + foundName;
          copyToClipboard(payload, doc);
          return;
        }
      }

      // Check if we should try navigating previous page
      let prevBtn = findPrevButton(doc);
      if (prevBtn && !prevBtn.disabled && !prevBtn.classList.contains('disabled')) {
        copyToClipboard('NOT_FOUND_TRY_PREV', doc);
        return;
      }
    }
  }

  copyToClipboard('NOT_FOUND_ON_PAGE', document);
})();
