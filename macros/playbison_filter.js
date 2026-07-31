(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
    }
    return docs;
  }

  function findText(text, exact = false) {
    let xpath = exact
      ? "//*[not(self::script) and not(self::style) and normalize-space(text())='" + text + "']"
      : "//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + text.toLowerCase() + "')]]";
    for (let doc of getFrames()) {
      if (!doc) continue;
      try {
        let res = doc.evaluate(xpath, doc, null, 7, null);
        for (let i = 0; i < res.snapshotLength; i++) {
          if (res.snapshotItem(i).children.length === 0) return res.snapshotItem(i);
        }
        if (res.snapshotLength > 0) return res.snapshotItem(res.snapshotLength - 1);
      } catch (e) {}
    }
    return null;
  }

  function findInput(sel) {
    for (let doc of getFrames()) {
      if (!doc) continue;
      try { let el = doc.querySelector(sel); if (el) return el; } catch (e) {}
    }
    return null;
  }

  function simClick(el) {
    if (!el) return;
    if (el.tagName === 'OPTION') {
      let s = el.closest('select');
      if (s) { s.value = el.value; s.dispatchEvent(new Event('change', { bubbles: true })); return; }
    }
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  let box = findText('search for a player status') || findInput('input[placeholder*="player status" i]');
  if (box) {
    simClick(box);
  } else {
    let label = findText('player status');
    if (label) {
      simClick(label);
      if (label.nextElementSibling) simClick(label.nextElementSibling);
      let r = label.getBoundingClientRect();
      let visualBox = label.ownerDocument.elementFromPoint(r.left + 10, r.bottom + 15);
      if (visualBox) simClick(visualBox);
    } else {
      alert('Could not find Player Status');
    }
  }

  setTimeout(() => {
    let v = findText('Verified', true);
    if (v) {
      simClick(v);
    } else {
      alert('Could not find exact Verified text');
    }

    setTimeout(() => {
      let btn = null;
      let btnXPath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'generate')]";
      for (let doc of getFrames()) {
        if (!doc) continue;
        try { btn = doc.evaluate(btnXPath, doc, null, 9, null).singleNodeValue; if (btn) break; } catch (e) {}
      }
      if (btn) simClick(btn);
      else alert('Could not find Generate button');
    }, 500);
  }, 1500);
})();
