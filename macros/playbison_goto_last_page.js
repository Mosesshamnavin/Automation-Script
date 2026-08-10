(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
    }
    return docs;
  }

  let done = false;
  let foundText = false;
  let foundBtn = false;
  let matchStr = "";

  for (let doc of getFrames()) {
    if (!doc || !doc.body) continue;
    let txt = (doc.body.innerText || "") + " " + (doc.body.textContent || "");
    let matches = [...txt.matchAll(/\d+\s+of\s+(\d+)/gi)];
    if (matches.length === 0) continue;
    foundText = true;
    let match = matches[matches.length - 1];
    let lastPage = match[1];
    matchStr = match[0];

    try {
      let els = Array.from(doc.querySelectorAll('*'));
      let goBtn = els.reverse().find(e => {
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(e.tagName)) return false;
        let t = e.textContent.trim().toLowerCase();
        let v = (e.value || '').trim().toLowerCase();
        return (t === 'go' || v === 'go') && e.children.length === 0 && e.getBoundingClientRect().width > 0;
      });

      if (goBtn) {
        foundBtn = true;
        let inputs = Array.from(doc.querySelectorAll('input')).filter(
          i => i.type !== 'hidden' && i.getBoundingClientRect().width > 0 && i !== goBtn
        );
        let btnR = goBtn.getBoundingClientRect();
        let closest = null;
        let minD = Infinity;
        for (let inp of inputs) {
          let r = inp.getBoundingClientRect();
          let dx = (r.left + r.width / 2) - (btnR.left + btnR.width / 2);
          let dy = (r.top + r.height / 2) - (btnR.top + btnR.height / 2);
          let d = Math.sqrt(dx * dx + dy * dy);
          if (d < minD) { minD = d; closest = inp; }
        }

        if (closest && minD < 400) {
          goBtn.scrollIntoView({ block: 'center', behavior: 'smooth' });
          setTimeout(() => {
            const valueSetter = Object.getOwnPropertyDescriptor(closest, 'value')?.set;
            const prototype = Object.getPrototypeOf(closest);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
            
            if (valueSetter && valueSetter !== prototypeValueSetter && prototypeValueSetter) {
              prototypeValueSetter.call(closest, lastPage);
            } else if (valueSetter) {
              valueSetter.call(closest, lastPage);
            } else {
              closest.value = lastPage;
            }
            
            closest.dispatchEvent(new Event('input', { bubbles: true }));
            closest.dispatchEvent(new Event('change', { bubbles: true }));
            
            setTimeout(() => {
              let clickTarget = goBtn.tagName === 'SPAN' ? goBtn.parentElement : goBtn;
              clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
              clickTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
              clickTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              if (typeof clickTarget.click === 'function') clickTarget.click();
            }, 500);
          }, 500);
          done = true;
          break;
        } else {
          alert('Found Go button, but input box was too far. Min dist: ' + Math.round(minD));
          done = true;
        }
      }
    } catch (e) {}
  }

  if (!done) {
    if (!foundText) alert('Could not find pagination text (looked for "X of Y").');
    else if (!foundBtn) alert('Found text "' + matchStr + '", but could not find the Go button.');
    else alert('Unknown error in Macro 3');
  }
})();
