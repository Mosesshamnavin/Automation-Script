(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
    }
    return docs;
  }

  function simClick(el) {
    if (!el) return;
    try { el.focus(); } catch (e) {}
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof el.click === 'function') el.click();
  }

  for (let doc of getFrames()) {
    if (!doc || !doc.body) continue;
    let txt = (doc.body.innerText || "") + " " + (doc.body.textContent || "");
    let matches = [...txt.matchAll(/\d+\s+of\s+(\d+)/gi)];
    if (matches.length === 0) continue;
    let match = matches[matches.length - 1];
    let lastPage = String(match[1]).trim();
    if (!lastPage || lastPage === '1') continue;

    // Find Go button
    let els = Array.from(doc.querySelectorAll('button, a, div, input, span'));
    let goBtn = els.reverse().find(e => {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(e.tagName)) return false;
      let t = (e.textContent || '').trim().toLowerCase();
      let v = (e.value || '').trim().toLowerCase();
      return (t === 'go' || v === 'go') && e.getBoundingClientRect().width > 0;
    });

    // Find the pagination page input box
    let inputs = Array.from(doc.querySelectorAll('input')).filter(
      i => i.type !== 'hidden' && i.type !== 'button' && i.type !== 'submit' && i.getBoundingClientRect().width > 0
    );

    let targetInput = null;
    if (goBtn) {
      let btnR = goBtn.getBoundingClientRect();
      let minD = Infinity;
      for (let inp of inputs) {
        let r = inp.getBoundingClientRect();
        let dx = (r.left + r.width / 2) - (btnR.left + btnR.width / 2);
        let dy = (r.top + r.height / 2) - (btnR.top + btnR.height / 2);
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < minD) { minD = d; targetInput = inp; }
      }
    } else if (inputs.length > 0) {
      targetInput = inputs[inputs.length - 1];
    }

    if (targetInput) {
      try { targetInput.scrollIntoView({ block: 'center' }); } catch (e) {}
      targetInput.focus();
      targetInput.select();

      // Set value multiple ways for maximum framework compatibility
      try {
        targetInput.value = lastPage;
        let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(targetInput, lastPage);
      } catch (e) {}

      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      targetInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      targetInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

      if (goBtn) {
        let clickTarget = goBtn.tagName === 'SPAN' ? goBtn.parentElement : goBtn;
        setTimeout(() => {
          simClick(clickTarget);
          if (clickTarget !== goBtn) simClick(goBtn);
          if (targetInput.form) {
            try { targetInput.form.dispatchEvent(new Event('submit', { bubbles: true })); } catch(e){}
          }
        }, 300);
      }
      return;
    }
  }
})();
