// Dynamic placeholders:
//   ###MSG_TITLE### -> message title (short text)
//   ###AUTO_SEND### -> YES to click Send Message, NO to fill only (review mode)
//
// Message body is read from the clipboard (Python copies it before injection).

(function () {
  function copyVal(val) {
    try {
      let ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0.01';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      ta.remove();
    } catch (e) {}
  }

  if (window.__BISON_MSG_MACRO_LOCK) {
    copyVal('MSG_SENT:SKIP:ALREADY_RUNNING');
    return;
  }
  window.__BISON_MSG_MACRO_LOCK = true;

  let msgTitle = '###MSG_TITLE###';
  let autoSend = ('###AUTO_SEND###' || 'NO').toUpperCase() === 'YES';

  function simClick(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function setInputValue(inp, val) {
    inp.focus();
    let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (s) s.call(inp, val);
    else inp.value = val;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findTitleInput() {
    let labels = Array.from(document.querySelectorAll('label, td, th, div, span'));
    let titleLabel = labels.find(function (e) {
      return (e.textContent || '').trim().toLowerCase() === 'title';
    });
    if (titleLabel) {
      let row = titleLabel.closest('tr') || titleLabel.parentElement;
      if (row) {
        let inp = row.querySelector('input[type="text"], input:not([type])');
        if (inp) return inp;
      }
    }
    let inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
    return inputs.find(function (inp) {
      let r = inp.getBoundingClientRect();
      return r.width > 120 && r.top < 500;
    });
  }

  function pasteIntoEditor() {
    if (window.CKEDITOR && CKEDITOR.instances) {
      let keys = Object.keys(CKEDITOR.instances);
      if (keys.length) {
        let ed = CKEDITOR.instances[keys[0]];
        ed.focus();
        ed.execCommand('paste');
        return true;
      }
    }

    let iframe = document.querySelector('iframe.cke_wysiwyg_frame, iframe[title*="Editor"], iframe[title*="Rich"]');
    if (iframe) {
      try {
        let doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.body) {
          doc.body.focus();
          doc.execCommand('paste');
          return true;
        }
      } catch (e) {}
    }

    let editable = document.querySelector('[contenteditable="true"]');
    if (editable) {
      editable.focus();
      document.execCommand('paste');
      editable.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }

  function clickSendButtonOnce() {
    if (window.__BISON_MSG_SENT) {
      return false;
    }
    let btns = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
    let sendBtn = btns.find(function (b) {
      let t = (b.textContent || b.value || '').trim().toLowerCase();
      return t === 'send message';
    });
    if (sendBtn) {
      window.__BISON_MSG_SENT = true;
      simClick(sendBtn);
      return true;
    }
    return false;
  }

  try {
    if (msgTitle.startsWith('###')) {
      copyVal('MSG_SENT:FAIL:MISSING_TITLE');
      window.__BISON_MSG_MACRO_LOCK = false;
      return;
    }

    let titleInp = findTitleInput();
    if (!titleInp) {
      copyVal('MSG_SENT:FAIL:NO_TITLE');
      window.__BISON_MSG_MACRO_LOCK = false;
      return;
    }

    setInputValue(titleInp, msgTitle);

    setTimeout(function () {
      if (!pasteIntoEditor()) {
        copyVal('MSG_SENT:FAIL:NO_EDITOR');
        window.__BISON_MSG_MACRO_LOCK = false;
        return;
      }

      setTimeout(function () {
        if (!autoSend) {
          copyVal('MSG_FILLED:OK');
          window.__BISON_MSG_MACRO_LOCK = false;
          return;
        }
        if (!clickSendButtonOnce()) {
          copyVal('MSG_SENT:FAIL:NO_BUTTON');
          window.__BISON_MSG_MACRO_LOCK = false;
          return;
        }
        copyVal('MSG_SENT:OK');
        window.__BISON_MSG_MACRO_LOCK = false;
      }, 900);
    }, 700);
  } catch (e) {
    copyVal('MSG_SENT:FAIL:' + e.message);
    window.__BISON_MSG_MACRO_LOCK = false;
  }
})();
