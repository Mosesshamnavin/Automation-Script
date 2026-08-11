(function() {
  let targetDateStr = "###STACK_DATE###";
  if (targetDateStr.includes("T")) {
    targetDateStr = targetDateStr.split("T")[0]; // Get just YYYY-MM-DD
  } else if (targetDateStr.includes(" ")) {
    targetDateStr = targetDateStr.split(" ")[0];
  }

  function copyToClipboard(text) {
    let inp = document.createElement('input');
    document.body.appendChild(inp);
    inp.value = text;
    inp.select();
    document.execCommand('copy', false);
    inp.remove();
  }

  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
    }
    return docs;
  }

  function simClick(el) {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (typeof el.click === 'function') el.click();
  }

  let links = Array.from(document.querySelectorAll('a'));
  let bonusTab = links.find(e => e.textContent.toLowerCase().trim() === 'bonuses');
  
  if (bonusTab) {
    simClick(bonusTab);
    
    setTimeout(() => {
      let foundBonus = "";
      for (let doc of getFrames()) {
        if (!doc) continue;
        let tables = Array.from(doc.querySelectorAll('table'));
        let histTbl = tables.find(t => 
          (t.offsetWidth > 0 || t.offsetHeight > 0) &&
          Array.from(t.querySelectorAll('th')).some(th => th.textContent.toLowerCase().trim() === 'bonus name')
        );

        if (histTbl) {
          let allTrs = Array.from(histTbl.querySelectorAll('tr'));
          let nameIdx = -1;
          let dateIdx = -1;
          
          for (let tr of allTrs) {
            let cells = Array.from(tr.children);
            for (let i = 0; i < cells.length; i++) {
              let txt = cells[i].textContent.toLowerCase().trim();
              if (txt === 'bonus name') nameIdx = i;
              if (txt === 'application date' || txt.includes('application date')) dateIdx = i;
            }
            if (nameIdx !== -1 && dateIdx !== -1) break;
          }

          if (nameIdx === -1) nameIdx = 2; // Default fallback
          if (dateIdx === -1) dateIdx = 4; // Default fallback

          let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > Math.max(nameIdx, dateIdx));
          
          for (let tr of dataRows) {
            let appDateStr = (tr.children[dateIdx].textContent || '').trim();
            if (appDateStr.includes(targetDateStr)) {
              let bonusName = (tr.children[nameIdx].textContent || '').trim();
              if (bonusName) {
                foundBonus = bonusName;
                break; // Stop at first match
              }
            }
          }
          if (foundBonus) break;
        }
      }

      if (foundBonus) {
        copyToClipboard("BONUS_RESULT:" + foundBonus);
      } else {
        copyToClipboard("BONUS_RESULT:NOT_FOUND");
      }
    }, 4500);
  } else {
    copyToClipboard("BONUS_RESULT:NOT_FOUND");
  }
})();
