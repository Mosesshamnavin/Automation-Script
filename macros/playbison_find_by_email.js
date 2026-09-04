// Dynamic placeholder:
//   ###TARGET_EMAIL### -> the target email to find in the table
//   ###TARGET_BRAND### -> optional target brand (e.g. fireball, meteoro, bison casino)

(function () {
  let targetEmail = '###TARGET_EMAIL###'.toLowerCase().trim();
  let targetBrand = '###TARGET_BRAND###'.toLowerCase().trim();

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

      // Check if table is Withdrawals To Confirm
      let isWithdrawalsTable = ths.some(th => {
        let t = th.textContent.trim().toLowerCase();
        return t === 'operator' || t === 'operator name' || t === 'w value' || t === 'w currency';
      });

      let idTh = ths.find(th => th.textContent.trim().toLowerCase() === 'id');
      let brandTh = ths.find(th => th.textContent.trim().toLowerCase() === 'brand' || th.textContent.trim().toLowerCase() === 'brand name');
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
      let cityTh = ths.find(th => th.textContent.trim().toLowerCase().includes('city'));

      let loginIdx = ths.indexOf(loginTh);
      let idIdx = idTh ? ths.indexOf(idTh) : -1;
      let brandIdx = brandTh ? ths.indexOf(brandTh) : -1;
      let wValueIdx = wValueTh ? ths.indexOf(wValueTh) : -1;
      let tCurrIdx = tCurrTh ? ths.indexOf(tCurrTh) : -1;
      let dateIdx = dateTh ? ths.indexOf(dateTh) : -1;
      let walletIdIdx = walletIdTh ? ths.indexOf(walletIdTh) : -1;
      let opIdx = opTh ? ths.indexOf(opTh) : -1;
      let nameIdx = nameTh ? ths.indexOf(nameTh) : -1;
      let cityIdx = cityTh ? ths.indexOf(cityTh) : -1;

      let trs = Array.from(tbl.querySelectorAll('tbody tr'));
      if (trs.length === 0) trs = Array.from(tbl.querySelectorAll('tr')).slice(1);

      // Search through rows
      let matchingRows = [];
      for (let tr of trs) {
        let rawLogin = loginIdx !== -1 && tr.children[loginIdx] ? tr.children[loginIdx].textContent : '';
        let rowEmail = '';
        let m = rawLogin.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (m) rowEmail = m[0].trim().toLowerCase();
        else rowEmail = rawLogin.trim().toLowerCase();

        let emailIdx = ths.findIndex(th => th.textContent.trim().toLowerCase() === 'email');
        if (emailIdx !== -1 && tr.children[emailIdx]) {
          let eText = tr.children[emailIdx].textContent.trim().toLowerCase();
          if (eText && eText.includes('@')) rowEmail = eText;
        }

        if (rowEmail === targetEmail || rawLogin.toLowerCase().includes(targetEmail)) {
          let brandText = brandIdx !== -1 && tr.children[brandIdx] ? tr.children[brandIdx].textContent.trim().toLowerCase() : '';
          matchingRows.push({ tr: tr, rowEmail: rowEmail, brand: brandText });
        }
      }

      if (matchingRows.length > 0) {
        // If multiple accounts found for this email, match targetBrand if specified
        let chosen = null;
        if (targetBrand && !targetBrand.startsWith('###')) {
          let tb = targetBrand.replace('casino', '').trim();
          chosen = matchingRows.find(r => r.brand.includes(targetBrand) || (tb && r.brand.includes(tb)) || (tb && targetBrand.includes(r.brand)));
        }
        if (!chosen) {
          chosen = matchingRows.find(r => r.brand.includes('bison')) || matchingRows[0];
        }
        let tr = chosen.tr;
        let rowEmail = chosen.rowEmail;
        tr.style.backgroundColor = '#d4edda';

        if (isWithdrawalsTable) {
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

          let payload = 'FOUND_WITHDRAWAL|' + rowEmail + '|' + foundId + '|' + foundBrand + '|' + foundWValue + '|' + foundTCurr + '|' + foundDate + '|' + foundWalletId + '|' + foundOp + '|' + foundName;
          copyToClipboard(payload, doc);
          return;
        } else {
          let playerId = idIdx !== -1 && tr.children[idIdx] ? tr.children[idIdx].textContent.trim() : '';
          let foundBrand = brandIdx !== -1 && tr.children[brandIdx] ? tr.children[brandIdx].textContent.trim() : '';
          let foundName = nameIdx !== -1 && tr.children[nameIdx] ? tr.children[nameIdx].textContent.trim() : '';
          let foundCity = cityIdx !== -1 && tr.children[cityIdx] ? tr.children[cityIdx].textContent.trim() : '';

          let aTags = Array.from(tr.querySelectorAll('a'));
          let foundWalletId = '';
          for (let a of aTags) {
            let href = a.getAttribute('href') || a.href || '';
            let hMatch = href.match(/admin\.user:([a-zA-Z0-9_-]+)/i);
            if (hMatch) {
              foundWalletId = hMatch[1].trim();
              break;
            }
          }
          if (!foundWalletId) {
            let m = tr.innerHTML.match(/admin\.user:([a-zA-Z0-9_-]+)/i);
            if (m) foundWalletId = m[1].trim();
          }

          let payload = 'FOUND_USERS_LIST|' + rowEmail + '|' + playerId + '|' + foundBrand + '|' + foundCity + '|' + foundWalletId + '|' + foundName;
          copyToClipboard(payload, doc);
          return;
        }
      }

      // If on Withdrawals table and not found in visible rows, try using the "Search login" filter!
      if (isWithdrawalsTable) {
        let loginInput = Array.from(doc.querySelectorAll('input')).find(i => {
          let ph = (i.placeholder || '').toLowerCase();
          return ph.includes('search login') || ph.includes('login');
        });
        if (loginInput) {
          let curVal = loginInput.value.trim().toLowerCase();
          if (curVal !== targetEmail) {
            loginInput.value = targetEmail;
            loginInput.dispatchEvent(new Event('input', { bubbles: true }));
            loginInput.dispatchEvent(new Event('change', { bubbles: true }));

            let genBtn = Array.from(doc.querySelectorAll('button, input[type="button"], a')).find(b => {
              let t = (b.textContent || b.value || '').trim().toLowerCase();
              return t === 'generate';
            });
            if (genBtn) {
              genBtn.click();
              copyToClipboard('FILTER_APPLIED', doc);
              return;
            }
          } else {
            // Already filtered by this email, but 0 results in table
            copyToClipboard('NO_PENDING_WITHDRAWAL', doc);
            return;
          }
        }
      } else {
        // If on Users list and not found in visible rows, filter by the dedicated 'Email' field!
        let inputs = Array.from(doc.querySelectorAll('input'));
        let emailInput = inputs.find(i => {
          let ph = (i.placeholder || '').toLowerCase();
          let nm = (i.name || '').toLowerCase();
          return (ph.includes('email') || nm.includes('email')) && (i.offsetWidth > 0 || i.offsetHeight > 0);
        });
        if (!emailInput) {
          let emailLabel = Array.from(doc.querySelectorAll('label, div, span, td')).find(e => {
            let t = (e.textContent || '').trim().toLowerCase();
            return (t === 'email' || t === 'email:') && e.children.length === 0;
          });
          if (emailLabel) {
            let container = emailLabel.closest('.x-form-item, div, td, form') || emailLabel.parentElement;
            if (container) emailInput = container.querySelector('input');
          }
        }
        if (!emailInput) {
          let visibleInputs = inputs.filter(i => (i.offsetWidth > 0 || i.offsetHeight > 0) && i.type !== 'button' && i.type !== 'submit');
          if (visibleInputs.length >= 2) emailInput = visibleInputs[1];
        }
        if (emailInput) {
          let curVal = emailInput.value.trim().toLowerCase();
          if (curVal !== targetEmail) {
            let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            if (s) s.call(emailInput, targetEmail); else emailInput.value = targetEmail;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            emailInput.dispatchEvent(new Event('change', { bubbles: true }));
            emailInput.dispatchEvent(new Event('blur', { bubbles: true }));

            let searchBtns = Array.from(doc.querySelectorAll('button, input[type="button"], a, div[role="button"]')).filter(b => {
              let t = (b.textContent || b.value || '').trim().toLowerCase();
              return t === 'search' && (b.offsetWidth > 0 || b.offsetHeight > 0 || b.getBoundingClientRect().width > 0);
            });
            if (searchBtns.length > 0) {
              let btn = searchBtns[0];
              btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
              btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
              btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              try { btn.click(); } catch(e){}
              copyToClipboard('FILTER_APPLIED', doc);
              return;
            }
          } else {
            copyToClipboard('NOT_FOUND_ON_PAGE', doc);
            return;
          }
        }
      }
    }
  }

  copyToClipboard('NOT_FOUND_ON_PAGE', document);
})();
