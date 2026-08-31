(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
    }
    return docs;
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

  function getCurrentPage(doc) {
    let txt = (doc.body.innerText || "") + " " + (doc.body.textContent || "");
    let matches = [...txt.matchAll(/(\d+)\s+of\s+(\d+)/gi)];
    if (matches.length > 0) return matches[matches.length - 1][1];
    return null;
  }

  function isAfterToday1330(dateStr) {
    if (!dateStr) return true;
    let m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (!m) return true;

    let y = parseInt(m[1], 10);
    let mon = parseInt(m[2], 10) - 1;
    let d = parseInt(m[3], 10);
    let h = parseInt(m[4], 10);
    let min = parseInt(m[5], 10);

    let rowDate = new Date(y, mon, d, h, min, 0);

    let now = new Date();
    // Yesterday at 13:30:00
    let cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() -1, 13, 30, 0);

    return rowDate >= cutoff;
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

  function checkPage() {
    let injected = /*###COMPLETED_IDS###*/ [];
    window._processedBisonIds = window._processedBisonIds || new Set();
    if (Array.isArray(injected)) {
      for (let id of injected) {
        if (id) window._processedBisonIds.add(String(id).trim());
      }
    }

    for (let doc of getFrames()) {
      if (!doc || !doc.body) continue;
      let closeBtns = doc.querySelectorAll('.modal .close, .x-tool-close, button[aria-label="Close"], button[title="Close"], .close, [data-dismiss="modal"], a.close, [class*="modal-close"], [class*="dialog-close"]');
      for (let btn of closeBtns) {
        if (btn.offsetWidth > 0 || btn.offsetHeight > 0) {
          try { btn.click(); } catch (e) {}
        }
      }

      let tables = Array.from(doc.querySelectorAll('table'));
      for (let tbl of tables) {
        let ths = Array.from(tbl.querySelectorAll('th'));
        if (ths.length === 0) {
          let firstTr = tbl.querySelector('thead tr, tr');
          if (firstTr) ths = Array.from(firstTr.querySelectorAll('th, td'));
        }
        if (ths.length === 0) continue;

        let roleTh = ths.find(th => {
          let t = th.textContent.trim().toLowerCase();
          return t === 'roles' || t === 'role';
        });
        let loginTh = ths.find(th => {
          let t = th.textContent.trim().toLowerCase();
          return t === 'login' || t === 'email' || t === 'user' || t === 'player';
        });
        let idTh = ths.find(th => th.textContent.trim().toLowerCase() === 'id');

        // MUST be the withdrawals table containing both Roles and Login headers
        if (!roleTh || !loginTh) continue;

        let roleIdx = ths.indexOf(roleTh);
        let loginIdx = ths.indexOf(loginTh);
        let idIdx = idTh ? ths.indexOf(idTh) : -1;

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
        
        trs.reverse();

        let foundTarget = false;
        let foundEmail = "";
        let foundId = "";
        let foundBrand = "";
        let foundWValue = "";
        let foundTCurr = "";
        let foundDate = "";
        let foundWalletId = "";
        let foundOperator = "";
        let foundName = "";

        for (let tr of trs) {
          let idVal = "";
          if (idIdx !== -1 && tr.children[idIdx]) {
            idVal = tr.children[idIdx].textContent.trim();
          }
          
          // Skip if we already completed this ID
          if (idVal && window._processedBisonIds.has(idVal)) continue;

          // Extract and validate email from Login column using regex
          let emailVal = "";
          if (loginIdx !== -1 && tr.children[loginIdx]) {
            let rawLogin = tr.children[loginIdx].textContent || "";
            let emailMatch = rawLogin.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
              emailVal = emailMatch[0].trim().toLowerCase();
            }
          }

          // If no valid email found in this row, skip it
          if (!emailVal || !emailVal.includes('@')) {
            continue;
          }

          let dateVal = "";
          if (dateIdx !== -1 && tr.children[dateIdx]) {
            dateVal = (tr.children[dateIdx].textContent || '').replace(/\s+/g, ' ').trim();
            dateVal = dateVal.replace(/[+-]\d{2}:\d{2}$/, '').trim();
          }

          // Skip records that are older than today 13:30
          if (dateVal && !isAfterToday1330(dateVal)) {
            continue;
          }
          
          let td = tr.children[roleIdx];
          let roleVal = td ? td.textContent.trim() : "";
          if (td && !roleVal.toUpperCase().includes('VIP')) {
            foundTarget = true;
            td.style.border = "4px solid red";
            tr.style.backgroundColor = "#ffcccc";
            foundEmail = emailVal;
            foundDate = dateVal;
            if (idIdx !== -1 && tr.children[idIdx]) {
              foundId = tr.children[idIdx].textContent.trim();
            }
            if (brandIdx !== -1 && tr.children[brandIdx]) {
              foundBrand = tr.children[brandIdx].textContent.trim();
            }
            if (wValueIdx !== -1 && tr.children[wValueIdx]) {
              foundWValue = tr.children[wValueIdx].textContent.trim();
            }
            if (tCurrIdx !== -1 && tr.children[tCurrIdx]) {
              foundTCurr = tr.children[tCurrIdx].textContent.trim().toUpperCase();
            }

            if (walletIdIdx !== -1 && tr.children[walletIdIdx]) {
              let walletIdTd = tr.children[walletIdIdx];
              let a = walletIdTd.querySelector('a');
              let href = a ? (a.getAttribute('href') || a.href || '') : '';
              let hrefMatch = href.match(/admin\.user:([a-f0-9]+)/i);
              let qtip = walletIdTd.getAttribute('data-qtip') || walletIdTd.getAttribute('title') || (a ? (a.getAttribute('data-qtip') || a.getAttribute('title')) : '');
              if (hrefMatch && hrefMatch[1]) {
                foundWalletId = hrefMatch[1].trim();
              } else if (qtip && qtip.match(/^[a-f0-9]{15,}$/i)) {
                foundWalletId = qtip.trim();
              } else {
                let fullVal = walletIdTd.getAttribute('title') || (a ? a.getAttribute('title') : '') || walletIdTd.getAttribute('data-original-title') || walletIdTd.getAttribute('data-value');
                foundWalletId = (fullVal && fullVal.length > 5) ? fullVal.trim() : walletIdTd.textContent.trim();
              }
            }
            if (opIdx !== -1 && tr.children[opIdx]) {
              foundOperator = tr.children[opIdx].textContent.trim();
            }
            if (nameIdx !== -1 && tr.children[nameIdx]) {
              foundName = tr.children[nameIdx].textContent.trim();
            }
            break;
          }
        }

        if (foundTarget && foundEmail) {
          let payload = foundEmail + "|" + foundId + "|" + foundBrand + "|" + foundWValue + "|" + foundTCurr + "|" + foundDate + "|" + foundWalletId + "|" + foundOperator + "|" + foundName;
          copyToClipboard(payload, doc);
          return;
        }

        let prevBtn = findPrevButton(doc);
        if (prevBtn) {
          if (prevBtn.disabled || prevBtn.classList.contains('disabled') || prevBtn.parentElement.classList.contains('disabled')) {
            copyToClipboard('FINISHED_SCAN', doc);
            return;
          }
          let oldPageNum = getCurrentPage(doc);
          prevBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          prevBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          prevBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          if (typeof prevBtn.click === 'function') prevBtn.click();
          let checks = 0;
          let waitInterval = setInterval(() => {
            checks++;
            let newPageNum = getCurrentPage(doc);
            if ((newPageNum && newPageNum !== oldPageNum) || checks > 15) {
              clearInterval(waitInterval);
              setTimeout(checkPage, 1000);
            }
          }, 500);
          return;
        } else {
          copyToClipboard('FINISHED_SCAN', doc);
          return;
        }
      }
    }

    // If roles column not found on first attempt, retry up to 5 times before stopping
    window._rolesRetryCount = (window._rolesRetryCount || 0) + 1;
    if (window._rolesRetryCount <= 5) {
      setTimeout(checkPage, 1500);
    } else {
      window._rolesRetryCount = 0;
      copyToClipboard('FINISHED_SCAN');
    }
  }

  checkPage();
})();
