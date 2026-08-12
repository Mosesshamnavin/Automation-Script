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

  function checkPage() {
    for (let doc of getFrames()) {
      if (!doc || !doc.body) continue;
      let ths = Array.from(doc.querySelectorAll('th'));
      let roleTh = ths.find(th => th.textContent.trim().toLowerCase() === 'roles');
      let loginTh = ths.find(th => th.textContent.trim().toLowerCase() === 'login');
      let idTh = ths.find(th => th.textContent.trim().toLowerCase() === 'id');

      let brandTh = ths.find(th => th.textContent.trim().toLowerCase() === 'brand');
      let wValueTh = ths.find(th => th.textContent.trim().toLowerCase() === 'w value' || th.textContent.trim().toLowerCase() === 'value w currency' || th.textContent.trim().toLowerCase() === 't value');
      let tCurrTh = ths.find(th => th.textContent.trim().toLowerCase() === 't currency');

      if (roleTh) {
        let roleIdx = ths.indexOf(roleTh);
        let loginIdx = loginTh ? ths.indexOf(loginTh) : -1;
        let idIdx = idTh ? ths.indexOf(idTh) : -1;
        let brandIdx = brandTh ? ths.indexOf(brandTh) : -1;
        let wValueIdx = wValueTh ? ths.indexOf(wValueTh) : -1;
        let tCurrIdx = tCurrTh ? ths.indexOf(tCurrTh) : -1;
        let trs = Array.from(doc.querySelectorAll('tbody tr'));
        if (trs.length === 0) continue;
        
        trs.reverse();

        let foundTarget = false;
        let foundEmail = "";
        let foundId = "";
        let foundBrand = "";
        let foundWValue = "";
        let foundTCurr = "";

        window._processedBisonIds = window._processedBisonIds || new Set();

        for (let tr of trs) {
          let idVal = "";
          if (idIdx !== -1) {
            let idTd = tr.children[idIdx];
            if (idTd) idVal = idTd.textContent.trim();
          }
          
          // Skip if we already processed this ID in a previous loop
          if (idVal && window._processedBisonIds.has(idVal)) continue;
          
          let emailVal = "";
          if (loginIdx !== -1) {
            let loginTd = tr.children[loginIdx];
            if (loginTd) emailVal = loginTd.textContent.trim().toLowerCase();
          }
          
          let td = tr.children[roleIdx];
          let roleVal = td ? td.textContent.trim() : "";
          if (td && !roleVal.toUpperCase().includes('VIP')) {
            foundTarget = true;
            if (idVal) window._processedBisonIds.add(idVal);
            td.style.border = "4px solid red";
            tr.style.backgroundColor = "#ffcccc";
            if (loginIdx !== -1) {
              let loginTd = tr.children[loginIdx];
              if (loginTd) foundEmail = loginTd.textContent.trim();
            }
            if (idIdx !== -1) {
              let idTd = tr.children[idIdx];
              if (idTd) foundId = idTd.textContent.trim();
            }
            if (brandIdx !== -1) {
              let brandTd = tr.children[brandIdx];
              if (brandTd) foundBrand = brandTd.textContent.trim();
            }
            if (wValueIdx !== -1) {
              let wValueTd = tr.children[wValueIdx];
              if (wValueTd) foundWValue = wValueTd.textContent.trim();
            }
            if (tCurrIdx !== -1) {
              let tCurrTd = tr.children[tCurrIdx];
              if (tCurrTd) foundTCurr = tCurrTd.textContent.trim().toUpperCase();
            }
            break;
          }
        }

        if (foundTarget) {
          if (foundEmail) {
            prompt("Non-VIP Role Found! Press Ctrl+C to copy (Email|ID|Brand|WValue|TCurr):", foundEmail + "|" + foundId + "|" + foundBrand + "|" + foundWValue + "|" + foundTCurr);
          } else {
            alert("Found a non-VIP Role, but couldn't find the email in the login column.");
          }
          return;
        }

        let prevBtn = findPrevButton(doc);
        if (prevBtn) {
          if (prevBtn.disabled || prevBtn.classList.contains('disabled') || prevBtn.parentElement.classList.contains('disabled')) {
            try {
              let ta = document.createElement('textarea');
              ta.value = 'FINISHED_SCAN';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            } catch(e){}
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
          try {
            let ta = document.createElement('textarea');
            ta.value = 'FINISHED_SCAN';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          } catch(e){}
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
      try {
        let ta = document.createElement('textarea');
        ta.value = 'FINISHED_SCAN';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch(e){}
    }
  }

  checkPage();
})();
