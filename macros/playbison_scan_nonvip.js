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

      if (roleTh) {
        let roleIdx = ths.indexOf(roleTh);
        let loginIdx = loginTh ? ths.indexOf(loginTh) : -1;
        let idIdx = idTh ? ths.indexOf(idTh) : -1;
        let trs = Array.from(doc.querySelectorAll('tbody tr'));
        if (trs.length === 0) continue;

        let foundTarget = false;
        let foundEmail = "";
        let foundId = "";

        for (let tr of trs) {
          let td = tr.children[roleIdx];
          let roleVal = td ? td.textContent.trim() : "";
          if (td && !roleVal.toUpperCase().includes('VIP')) {
            foundTarget = true;
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
            break;
          }
        }

        if (foundTarget) {
          if (foundEmail) {
            prompt("Non-VIP Role Found! Press Ctrl+C to copy (Email|ID):", foundEmail + "|" + foundId);
          } else {
            alert("Found a non-VIP Role, but couldn't find the email in the login column.");
          }
          return;
        }

        let prevBtn = findPrevButton(doc);
        if (prevBtn) {
          if (prevBtn.disabled || prevBtn.classList.contains('disabled') || prevBtn.parentElement.classList.contains('disabled')) {
            alert("Scanned all the way to the first page! No non-VIP roles found.");
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
          alert("Could not find the Previous button to go back.");
          return;
        }
      }
    }
    alert("Could not find the 'roles' column in the table.");
  }

  checkPage();
})();
