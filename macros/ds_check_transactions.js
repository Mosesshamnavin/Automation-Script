(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try {
        if (f.contentDocument || f.contentWindow.document)
          docs.push(f.contentDocument || f.contentWindow.document);
      } catch (e) {}
    }
    return docs;
  }

  function simClick(el) {
    if (!el) return;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof el.click === 'function') el.click();
  }

  function closeDatePopups(doc) {
    try {
      let targetDoc = doc || document;
      let popups = targetDoc.querySelectorAll('.datepicker, .datetimepicker, .bootstrap-datetimepicker-widget, .flatpickr-calendar, .ui-datepicker, [class*="datepicker"], [class*="calendar"], [class*="datetime"], .dropdown-menu');
      popups.forEach(p => {
        if (p.offsetWidth > 0 || p.offsetHeight > 0 || window.getComputedStyle(p).display !== 'none') {
          p.style.display = 'none';
        }
      });
      targetDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      targetDoc.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', keyCode: 27, bubbles: true }));
    } catch (e) {}
  }

  function setVal(el, val) {
    if (!el) return;
    let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (setter) setter.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('keyup', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    closeDatePopups(el.ownerDocument);
  }

  // Redeem check: Date From = today minus 31 days (previous month), keep current HH:MM
  // e.g. run 2026-09-19 15:16 -> "2026-08-19 15:16"
  function getRedeemDateFromValue() {
    let d = new Date();
    d.setDate(d.getDate() - 31);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") +
      " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function findDateFromInput(container) {
    if (!container) return null;
    let root = container;

    // 1) Label exactly "Date From" / "Date from"
    let labels = Array.from(root.querySelectorAll('label, .form-label, .control-label, .col-form-label, span, div, p, strong, b, td, th'));
    let dateLab = labels.find(el => {
      if (el.children && el.children.length > 2) return false;
      let t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return t === 'date from' || t === 'date from:' || t === 'datefrom';
    });
    if (dateLab) {
      let wrap = dateLab.closest('.form-group, .mb-3, .col, [class*="col-"], .form-item, td, .x-form-item, .x-field') || dateLab.parentElement;
      if (wrap) {
        let inp = wrap.querySelector('input:not([type="hidden"])');
        if (inp) return inp;
      }
      if (dateLab.nextElementSibling) {
        let n = dateLab.nextElementSibling;
        let inp = (n.tagName === 'INPUT' ? n : n.querySelector('input:not([type="hidden"])'));
        if (inp) return inp;
      }
    }

    // 2) Attribute / ng-model / name match
    let inputs = Array.from(root.querySelectorAll('input:not([type="hidden"])'));
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let attr = (
        (inp.placeholder || '') + ' ' + (inp.name || '') + ' ' + (inp.id || '') + ' ' +
        (inp.getAttribute('ng-model') || '') + ' ' + (inp.getAttribute('formcontrolname') || '') + ' ' +
        (inp.getAttribute('aria-label') || '')
      ).toLowerCase();
      if ((attr.includes('date') && attr.includes('from') && !attr.includes('to')) ||
          attr.includes('datefrom') || attr.includes('date_from') || attr.includes('date-from')) {
        return inp;
      }
    }

    // 3) Parent walk — tight wrappers only
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== root; level++) {
        let labEl = p.querySelector && p.querySelector(':scope > label, :scope > .form-label, :scope > .control-label');
        let lab = labEl ? (labEl.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim() : '';
        if (lab === 'date from' || lab === 'date from:') return inp;
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (t.length < 60 && (t.includes('date from') || (t.startsWith('date') && t.includes('from'))) &&
            !t.includes('date to') && !t.includes('registered')) {
          let childInputs = p.querySelectorAll('input:not([type="hidden"])');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }

    // 4) Heuristic: visible input whose current value looks like YYYY-MM-01 (page default month start)
    let monthStart = inputs.find(inp => {
      let v = (inp.value || '').trim();
      return /^\d{4}-\d{2}-01(\s|$)/.test(v) && (inp.offsetWidth > 0 || inp.getBoundingClientRect().width > 0);
    });
    if (monthStart) return monthStart;

    return null;
  }

  function setDateFromOneMonthAgo(inputEl) {
    if (!inputEl) return "";
    let val = getRedeemDateFromValue();
    let doc = inputEl.ownerDocument || document;

    try { inputEl.focus(); } catch (e) {}
    try { inputEl.click(); } catch (e) {}

    // Clear first so Angular/datepicker does not keep 2026-09-01
    try {
      let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      if (setter) setter.call(inputEl, '');
      else inputEl.value = '';
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {}

    try {
      let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      if (setter) setter.call(inputEl, val);
      else inputEl.value = val;
    } catch (e) {
      inputEl.value = val;
    }
    try { inputEl.setAttribute('value', val); } catch (e) {}

    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    inputEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', keyCode: 13 }));

    // AngularJS ngModel (Playbison admin often uses this)
    try {
      if (window.angular) {
        let ngEl = window.angular.element(inputEl);
        let ngModel = ngEl.controller && ngEl.controller('ngModel');
        if (ngModel) {
          ngModel.$setViewValue(val);
          ngModel.$render();
        }
        ngEl.triggerHandler('input');
        ngEl.triggerHandler('change');
      }
    } catch (e) {}

    // jQuery / bootstrap-datetimepicker / flatpickr hooks
    try {
      if (window.jQuery) {
        let $ = window.jQuery;
        $(inputEl).val(val).trigger('input').trigger('change').trigger('blur');
        if ($(inputEl).data('DateTimePicker')) $(inputEl).data('DateTimePicker').date(val);
        if ($(inputEl).data('datepicker')) $(inputEl).datepicker('update', val);
      }
    } catch (e) {}

    // Do NOT Escape here — that can cancel the edit and restore 2026-09-01
    try {
      let popups = doc.querySelectorAll('.datepicker, .datetimepicker, .bootstrap-datetimepicker-widget, .flatpickr-calendar, .ui-datepicker');
      popups.forEach(p => { try { p.style.display = 'none'; } catch (e) {} });
    } catch (e) {}

    // Final verify — if still month-start default (YYYY-MM-01), force again
    let cur = (inputEl.value || '').trim();
    let wantDay = val.slice(0, 10);
    if (!cur || /^\d{4}-\d{2}-01(\s|$)/.test(cur) || cur.indexOf(wantDay) !== 0) {
      inputEl.value = val;
      try {
        let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (setter) setter.call(inputEl, val);
      } catch (e) {}
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return val;
  }

  function setSelectVal(el, optionIndexOrVal) {
    if (!el) return false;
    try { el.focus(); } catch (e) {}
    let matched = false;
    if (typeof optionIndexOrVal === 'number') {
      el.selectedIndex = optionIndexOrVal;
      if (el.options && el.options[optionIndexOrVal]) {
        let setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        if (setter) setter.call(el, el.options[optionIndexOrVal].value);
        else el.value = el.options[optionIndexOrVal].value;
        matched = true;
      }
    } else {
      let needle = String(optionIndexOrVal || '').toLowerCase().trim();
      let opts = Array.from(el.options || []);
      let opt = opts.find(o => {
        let t = ((o.textContent || '') + ' ' + (o.value || '')).toLowerCase().trim();
        return t === needle || t.includes(needle);
      });
      // Prefer "Redeem the bonuses" style match (redeem + bonus)
      if (!opt && needle.includes('redeem')) {
        opt = opts.find(o => {
          let t = ((o.textContent || '') + ' ' + (o.value || '')).toLowerCase();
          return t.includes('redeem') && t.includes('bonus');
        }) || opts.find(o => ((o.textContent || '') + ' ' + (o.value || '')).toLowerCase().includes('redeem'));
      }
      if (opt) {
        el.selectedIndex = opt.index;
        let setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        if (setter) setter.call(el, opt.value);
        else el.value = opt.value;
        matched = true;
      } else if (needle === '' || needle === '0' || needle === 'all') {
        el.selectedIndex = 0;
        let setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        if (setter && el.options && el.options.length > 0) setter.call(el, el.options[0].value);
        else el.value = '';
        matched = true;
      }
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return matched;
  }

  function getActiveModalContainer(tTab, doc) {
    if (tTab) {
      let p = tTab.parentElement;
      while (p && p !== doc.body) {
        let inputs = p.querySelectorAll('input');
        if (inputs.length >= 4) {
          return p;
        }
        p = p.parentElement;
      }
    }
    return doc;
  }

  function findDateToInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let attr = ((inp.placeholder || '') + ' ' + (inp.name || '') + ' ' + (inp.id || '') + ' ' + (inp.getAttribute('ng-model') || '')).toLowerCase();
      if ((attr.includes('date') && attr.includes('to')) || attr.includes('dateto') || attr.includes('date_to')) {
        return inp;
      }
    }
    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;
      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if ((t.includes('date to') || (t.includes('date') && t.includes('to'))) && !t.includes('date from') && !t.includes('registered')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }
    return null;
  }

  function findAmountInToInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));

    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;

      let attrStr = (
        (inp.placeholder || '') + ' ' +
        (inp.name || '') + ' ' +
        (inp.id || '') + ' ' +
        (inp.getAttribute('ng-model') || '') + ' ' +
        (inp.getAttribute('formcontrolname') || '') + ' ' +
        (inp.getAttribute('aria-label') || '')
      ).toLowerCase();

      if (attrStr.includes('in') && attrStr.includes('to') && !attrStr.includes('out') && !attrStr.includes('from')) {
        return inp;
      }

      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (t.includes('amount') && t.includes('in') && t.includes('to') && !t.includes('out') && !t.includes('from')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }

    let amountInputs = inputs.filter(inp => {
      let p = inp.parentElement;
      while (p && p !== container) {
        let t = (p.textContent || '').toLowerCase();
        if (t.includes('amount')) return true;
        p = p.parentElement;
      }
      return false;
    });

    if (amountInputs.length >= 4) {
      return amountInputs[3];
    }
    return null;
  }

  function findAmountInFromInput(container) {
    if (!container) return null;
    let inputs = Array.from(container.querySelectorAll('input'));

    for (let inp of inputs) {
      if (inp.offsetWidth === 0 && inp.getBoundingClientRect().width === 0) continue;

      let attrStr = (
        (inp.placeholder || '') + ' ' +
        (inp.name || '') + ' ' +
        (inp.id || '') + ' ' +
        (inp.getAttribute('ng-model') || '') + ' ' +
        (inp.getAttribute('formcontrolname') || '') + ' ' +
        (inp.getAttribute('aria-label') || '')
      ).toLowerCase();

      if (attrStr.includes('in') && attrStr.includes('from') && !attrStr.includes('out') && !attrStr.includes('to') && !attrStr.includes('date')) {
        return inp;
      }

      let p = inp.parentElement;
      for (let level = 0; level < 5 && p && p !== container; level++) {
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (t.includes('amount') && t.includes('in') && t.includes('from') && !t.includes('out') && !t.includes('to')) {
          let childInputs = p.querySelectorAll('input');
          if (childInputs.length <= 2) return inp;
        }
        p = p.parentElement;
      }
    }

    let amountInputs = inputs.filter(inp => {
      let p = inp.parentElement;
      while (p && p !== container) {
        let t = (p.textContent || '').toLowerCase();
        if (t.includes('amount')) return true;
        p = p.parentElement;
      }
      return false;
    });

    if (amountInputs.length >= 4) {
      return amountInputs[2];
    }
    return null;
  }

  function getFieldLabelText(wrap) {
    if (!wrap) return '';
    let lab = wrap.querySelector('label, .form-label, .control-label, .col-form-label');
    if (lab) return (lab.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
    // First text node / small text sibling
    let first = Array.from(wrap.querySelectorAll('span, div, p, strong, b')).find(el => {
      let t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return t.length > 0 && t.length < 40 && el.children.length === 0;
    });
    return first ? (first.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim() : '';
  }

  function findTypeSelect(container) {
    if (!container) return null;
    // Include HIDDEN selects (Select2/Chosen/Bootstrap-select often hide the native <select>)
    let selects = Array.from(container.querySelectorAll('select'));

    // 1) Label exactly "Type" (not Product Type)
    for (let sel of selects) {
      let wrap = sel.closest('.form-group, .mb-3, .col, [class*="col-"], .form-item, .form-floating') || sel.parentElement;
      let lab = getFieldLabelText(wrap);
      if (lab === 'type' || lab === 'type:') return sel;
    }

    // 2) Parent walk — still allow zero-size selects
    for (let sel of selects) {
      let p = sel.parentElement;
      for (let level = 0; level < 6 && p && p !== container; level++) {
        let labEl = p.querySelector && p.querySelector(':scope > label, :scope > .form-label, :scope > .control-label');
        let lab = labEl ? (labEl.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim() : '';
        if (lab === 'type' || lab === 'type:') return sel;
        let t = (p.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        // Keep this check tight: short wrappers only (avoid whole Filters panel with Product Type)
        if (t.length < 80 && ((t.includes('type') && !t.includes('product')) || t === 'type')) {
          let childSelects = p.querySelectorAll('select');
          if (childSelects.length <= 2) return sel;
        }
        p = p.parentElement;
      }
    }

    // 3) Select that actually has a "Redeem the bonuses" option
    for (let sel of selects) {
      let hasRedeem = Array.from(sel.options || []).some(o => {
        let t = ((o.textContent || '') + ' ' + (o.value || '')).toLowerCase();
        return t.includes('redeem') && t.includes('bonus');
      });
      if (hasRedeem) return sel;
    }
    return null;
  }

  function getTypeDisplayValue(container) {
    let sel = findTypeSelect(container);
    if (sel) {
      let opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      let txt = ((opt && opt.textContent) || sel.value || '').trim();
      if (txt) return txt;
    }
    // Visible Select2 / Chosen / bootstrap-select display text near Type label
    let labels = Array.from((container || document).querySelectorAll('label, .form-label, .control-label'));
    let typeLab = labels.find(l => {
      let t = (l.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return t === 'type' || t === 'type:';
    });
    if (typeLab) {
      let wrap = typeLab.closest('.form-group, .mb-3, .col, [class*="col-"]') || typeLab.parentElement;
      if (wrap) {
        let chosen = wrap.querySelector('.select2-selection__rendered, .chosen-single span, .filter-option-inner-inner, .dropdown-toggle, .bootstrap-select .filter-option');
        if (chosen) return (chosen.textContent || '').trim();
      }
    }
    return '';
  }

  function isRedeemTypeSet(container) {
    let v = getTypeDisplayValue(container).toLowerCase();
    return v.includes('redeem') && v.includes('bonus');
  }

  function pickRedeemOptionFromOpenMenus(doc) {
    let root = doc || document;
    let items = Array.from(root.querySelectorAll(
      'select option, .dropdown-menu li, .dropdown-menu a, .dropdown-item, [role="option"], .select2-results__option, .chosen-results li, .x-boundlist-item'
    ));
    let match = items.find(el => {
      let t = (el.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return t.includes('redeem') && t.includes('bonus') && t.length < 60;
    });
    if (!match) return false;
    if (match.tagName && match.tagName.toLowerCase() === 'option' && match.parentElement) {
      return setSelectVal(match.parentElement, 'redeem the bonuses');
    }
    simClick(match);
    return true;
  }

  function setTypeToRedeem(container) {
    if (!container) container = document;
    let sel = findTypeSelect(container);
    if (sel && setSelectVal(sel, 'redeem the bonuses')) {
      // Sync common custom select UIs
      try {
        if (window.jQuery) {
          let $ = window.jQuery;
          if ($(sel).data('select2')) $(sel).trigger('change');
          if ($(sel).data('chosen')) { $(sel).trigger('chosen:updated'); $(sel).trigger('change'); }
          if (typeof $(sel).selectpicker === 'function') $(sel).selectpicker('refresh');
        }
      } catch (e) {}
      if (isRedeemTypeSet(container)) return true;
    }

    // Click visible Type control and pick "Redeem the bonuses"
    let labels = Array.from(container.querySelectorAll('label, .form-label, .control-label'));
    let typeLab = labels.find(l => {
      let t = (l.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return t === 'type' || t === 'type:';
    });
    let clickTarget = null;
    if (typeLab) {
      let wrap = typeLab.closest('.form-group, .mb-3, .col, [class*="col-"]') || typeLab.parentElement;
      clickTarget = wrap && wrap.querySelector(
        '.select2-selection, .chosen-single, .dropdown-toggle, .bootstrap-select button, select, [role="combobox"], input'
      );
    }
    if (!clickTarget && sel) {
      let wrap = sel.closest('.form-group, .mb-3, .bootstrap-select, .chosen-container, .select2') || sel.parentElement;
      clickTarget = (wrap && wrap.querySelector('.select2-selection, .chosen-single, .dropdown-toggle, button')) || sel;
    }
    if (clickTarget) simClick(clickTarget);
    pickRedeemOptionFromOpenMenus(container.ownerDocument || document);
    if (sel) setSelectVal(sel, 'redeem the bonuses');
    return isRedeemTypeSet(container);
  }

  function findSearchButton(container, inputEl) {
    // 1. Try finding search button inside the closest form/filter container
    if (inputEl) {
      let formOrFilter = inputEl.closest('form, [class*="filter"], [class*="tab-pane"], [class*="modal"]');
      if (formOrFilter) {
        let btns = Array.from(formOrFilter.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a'));
        let sBtn = btns.find(b => {
          let t = (b.textContent || b.value || '').toLowerCase().trim();
          return t === 'search' && !t.includes('clear') && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
        });
        if (sBtn) return sBtn;
      }
    }
    // 2. Try finding within the modal container
    if (container) {
      let btns = Array.from(container.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a'));
      let sBtn = btns.find(b => {
        let t = (b.textContent || b.value || '').toLowerCase().trim();
        return t === 'search' && !t.includes('clear') && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
      if (sBtn) return sBtn;
    }
    return null;
  }

  function findNoteColIdx(container) {
    if (!container) return { tbl: null, idx: -1 };
    let tables = Array.from(container.querySelectorAll('table'));
    let dataTbl = tables.find(t =>
      (t.offsetWidth > 0 || t.offsetHeight > 0) && 
      Array.from(t.querySelectorAll('th,td')).some(c => c.textContent.toLowerCase().trim() === 'note' || c.textContent.toLowerCase().trim().includes('note'))
    );
    if (!dataTbl) return { tbl: null, idx: -1 };

    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    let dataRow = allTrs.find(tr => tr.querySelector('td') && tr.children.length > 12);
    
    let colIndex = -1;
    
    // Attempt standard colspan calculation
    for (let tr of allTrs) {
      if (tr.querySelector('td') && !tr.querySelector('th')) continue;
      let currentIdx = 0;
      let found = false;
      for (let cell of Array.from(tr.children)) {
        let txt = cell.textContent.toLowerCase().trim();
        if (txt === 'note' || (txt.includes('note') && txt.length < 10)) {
          colIndex = currentIdx;
          found = true;
          break;
        }
        currentIdx += parseInt(cell.getAttribute('colspan') || cell.colSpan || 1, 10);
      }
      if (found) break;
    }

    // Force bulletproof fallback for Playbison Transactions table
    if (dataRow) {
      let len = dataRow.children.length;
      // In Playbison, if length is 17, note is 15. It's always len - 2.
      if (len >= 15) {
        // Double check if colIndex is reasonable. If it points to 'balance after' (e.g., 11), override it.
        if (colIndex === -1 || colIndex < 14) {
          colIndex = len - 2;
        }
      }
    }

    return { tbl: dataTbl, idx: colIndex };
  }

  function hasBlankInResults(container) {
    if (!container) return { found: false, date: null };
    let { tbl, idx } = findNoteColIdx(container);
    if (!tbl) return { found: false, date: null };

    let allTrs = Array.from(tbl.querySelectorAll('tr'));
    let dataRows = allTrs.filter(tr => tr.querySelector('td'));
    if (dataRows.length === 0) return { found: false, date: null };

    let dateIdx = 1;
    let typeIdx = 3;
    let balBeforeIdx = -1, balAfterIdx = -1;
    let bonBeforeIdx = -1, bonAfterIdx = -1;

    for (let tr of allTrs) {
      if (tr.querySelector('th')) {
        let cells = Array.from(tr.children);
        for (let i = 0; i < cells.length; i++) {
          let t = cells[i].textContent.toLowerCase().trim();
          if (t === 'date') dateIdx = i;
          if (t === 'type') typeIdx = i;
          if (t === 'before' && (i >= 9 && i <= 11)) balBeforeIdx = i;
          if (t === 'after' && (i >= 10 && i <= 12)) balAfterIdx = i;
          if (t.includes('balance') && t.includes('before')) balBeforeIdx = i;
          if (t.includes('balance') && t.includes('after')) balAfterIdx = i;
          if (t.includes('bonus') && t.includes('before')) bonBeforeIdx = i;
          if (t.includes('bonus') && t.includes('after')) bonAfterIdx = i;
        }
        break;
      }
    }

    if (balBeforeIdx === -1) balBeforeIdx = 10;
    if (balAfterIdx === -1) balAfterIdx = 11;
    if (bonBeforeIdx === -1) bonBeforeIdx = 12;
    if (bonAfterIdx === -1) bonAfterIdx = 13;
    let noteIdx = idx !== -1 ? idx : 15;

    for (let tr of dataRows) {
      // 1. MUST verify row is a BONUS REDEMPTION!
      let typeTxt = tr.children.length > typeIdx ? (tr.children[typeIdx].textContent || '').toLowerCase().trim() : '';
      
      // If the row is NOT a bonus redemption (e.g. STAKE, WIN, DEPOSIT, WITHDRAWAL), skip!
      if (!typeTxt.includes('redeem') && !typeTxt.includes('bonus')) {
        continue;
      }

      // 2. Check note column
      let txt = (tr.children.length > noteIdx ? (tr.children[noteIdx].textContent || '') : '').trim().toLowerCase();
      // If note contains 'automatic', skip it (already verified automatic)
      if (txt.includes('automatic')) continue;

      let transValIdx = 4;
      let inValIdx = 6;
      let outValIdx = 7;
      
      let transVal = tr.children.length > transValIdx ? Math.abs(parseFloat(tr.children[transValIdx].textContent.trim().replace(',', '.')) || 0) : 0;
      let inVal = tr.children.length > inValIdx ? Math.abs(parseFloat(tr.children[inValIdx].textContent.trim().replace(',', '.')) || 0) : 0;
      let outVal = tr.children.length > outValIdx ? Math.abs(parseFloat(tr.children[outValIdx].textContent.trim().replace(',', '.')) || 0) : 0;
      let hasAmount = (transVal > 0) || (inVal > 0) || (outVal > 0);

      let balBeforeStr = tr.children.length > balBeforeIdx ? tr.children[balBeforeIdx].textContent.trim() : '0';
      let balAfterStr = tr.children.length > balAfterIdx ? tr.children[balAfterIdx].textContent.trim() : '0';
      let bBefore = parseFloat(balBeforeStr.replace(',', '.')) || 0;
      let bAfter = parseFloat(balAfterStr.replace(',', '.')) || 0;
      let balChanged = (bBefore !== bAfter);

      let bonBefore = tr.children.length > bonBeforeIdx ? (parseFloat(tr.children[bonBeforeIdx].textContent.trim().replace(',', '.')) || 0) : 0;
      let bonAfter = tr.children.length > bonAfterIdx ? (parseFloat(tr.children[bonAfterIdx].textContent.trim().replace(',', '.')) || 0) : 0;
      let bonChanged = (bonBefore !== bonAfter) && (bonBefore > 0 || bonAfter > 0);

      // Check if this row is an inactive forfeiture/zero-change row where player received 0 funds
      if (!hasAmount && !balChanged && !bonChanged) {
        continue;
      }

      // Real bonus redemption detected!
      let dateStr = tr.children[dateIdx] ? (tr.children[dateIdx].textContent || '').trim() : null;
      return { found: true, date: dateStr };
    }
    return { found: false, date: null };
  }

  function getCurrency(container) {
    if (!container) return null;
    let tables = Array.from(container.querySelectorAll('table'));
    let dataTbl = tables.find(t =>
      (t.offsetWidth > 0 || t.offsetHeight > 0) &&
      Array.from(t.querySelectorAll('th,td')).some(c => {
        let txt = c.textContent.toLowerCase().trim();
        return txt === 'out val' || txt === 'in val' || txt === 'wallet id';
      })
    );
    if (!dataTbl) return null;

    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    let currIdx = -1;
    for (let tr of allTrs) {
      let cells = Array.from(tr.children);
      for (let i = 0; i < cells.length; i++) {
        let txt = cells[i].textContent.toLowerCase().trim();
        if (txt === 'val' || txt === 'out val' || txt === 'in val') {
          if (i + 1 < cells.length && (cells[i+1].textContent.toLowerCase().trim() === 'curr' || cells[i+1].textContent.toLowerCase().trim() === 'currency')) {
            currIdx = i + 1;
            break;
          }
        }
      }
      if (currIdx !== -1) break;
    }
    
    if (currIdx === -1) currIdx = 7;

    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > currIdx);
    for (let tr of dataRows) {
        let currCell = tr.children[currIdx];
        if (currCell) {
            let txt = currCell.textContent.trim().toUpperCase();
            if (txt) return txt;
        }
    }
    return null;
  }

  function computeAllPagesStack(container, doneCallback) {
    let globalCounts = {};
    let seenIds = new Set();
    let globalGames = new Set();

    function parseCurrentPage(cont) {
      let tables = Array.from(cont.querySelectorAll('table'));
      let dataTbl = tables.find(t =>
        (t.offsetWidth > 0 || t.offsetHeight > 0) &&
        Array.from(t.querySelectorAll('th,td')).some(c => {
          let txt = c.textContent.toLowerCase().trim();
          return txt === 'out val' || txt === 'in val' || txt === 'wallet id';
        })
      );
      if (!dataTbl) return;

      let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
      let valIdx = -1;
      let currIdx = -1;
      let bonusBeforeIdx = -1;
      let bonusAfterIdx = -1;
      let noteIdx = -1;

      for (let tr of allTrs) {
        let cells = Array.from(tr.children);
        for (let i = 0; i < cells.length; i++) {
          let txt = cells[i].textContent.toLowerCase().trim();
          if (txt === 'val' || txt === 'out val' || txt === 'in val') {
            if (i + 1 < cells.length && (cells[i+1].textContent.toLowerCase().trim() === 'curr' || cells[i+1].textContent.toLowerCase().trim() === 'currency')) {
              valIdx = i;
              currIdx = i + 1;
            }
          }
          if (txt === 'before' && i > 8) {
            bonusBeforeIdx = i;
            if (i + 1 < cells.length) bonusAfterIdx = i + 1;
          }
          if (txt === 'note' || (txt.includes('note') && txt.length < 10)) {
            noteIdx = i;
          }
        }
        if (valIdx !== -1 && bonusBeforeIdx !== -1 && noteIdx !== -1) break;
      }

      if (valIdx === -1) {
        valIdx = 5;
        currIdx = 7;
      }

      if (bonusBeforeIdx === -1) {
        bonusBeforeIdx = 13;
        bonusAfterIdx = 14;
      }
      if (noteIdx === -1) noteIdx = 15;

      let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > Math.max(currIdx, bonusAfterIdx));

      for (let tr of dataRows) {
        let idStr = tr.children[0] ? tr.children[0].textContent.trim() : '';
        if (!/^\d{6,15}$/.test(idStr)) continue;

        if (seenIds.has(idStr)) continue;
        seenIds.add(idStr);

        let bonusBeforeStr = tr.children.length > bonusBeforeIdx ? tr.children[bonusBeforeIdx].textContent.trim() : '0';
        let bonusAfterStr = tr.children.length > bonusAfterIdx ? tr.children[bonusAfterIdx].textContent.trim() : '0';

        let bBefore = parseFloat(bonusBeforeStr.replace(',', '.')) || 0;
        let bAfter = parseFloat(bonusAfterStr.replace(',', '.')) || 0;

        // RULE: If bonus before AND bonus after have the SAME value, SKIP THIS ROW!
        // Only count rows where bonus before and bonus after values DIFFER!
        if (bBefore === bAfter) {
          continue;
        }

        let valStr = tr.children[valIdx].textContent.trim();
        let currStr = tr.children[currIdx].textContent.trim();

        if (!valStr) continue;

        let num = parseFloat(valStr.replace(',', '.'));
        if (isNaN(num)) continue;

        let currCode = currStr ? currStr.split(' ')[0] : '';
        let currFormatted = currCode ? currCode.charAt(0).toUpperCase() + currCode.slice(1).toLowerCase() : '';
        let absVal = Math.abs(num);
        let valFormatted = `-${absVal}`;

        if (valFormatted.endsWith('.00')) {
          valFormatted = valFormatted.slice(0, -3);
        }

        let key = `${valFormatted}${currFormatted}`;
        globalCounts[key] = (globalCounts[key] || 0) + 1;

        let noteStr = tr.children.length > noteIdx ? tr.children[noteIdx].textContent.trim() : '';
        if (noteStr) {
          let rIndex = noteStr.lastIndexOf('R:');
          if (rIndex !== -1) {
            let gName = noteStr.substring(0, rIndex).trim();
            if (gName) globalGames.add(gName);
          }
        }
      }
    }

    function findNextButton(cont) {
      let btns = Array.from(cont.querySelectorAll('button, a, input, div[role="button"], li'));
      return btns.find(b => {
        let txt = (b.textContent || b.value || '').toLowerCase().trim();
        let isNext = txt === 'next' || txt.includes('next') || txt === 'next→' || txt === 'next →' || txt === '→';
        let isDisabled = b.disabled || b.classList.contains('disabled') || b.parentElement.classList.contains('disabled');
        return isNext && !isDisabled && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
      });
    }

    function step() {
      let liveDoc = getFrames()[0];
      let liveModal = container ? container : liveDoc;
      parseCurrentPage(liveModal);

      let nextBtn = findNextButton(liveModal);
      if (nextBtn) {
        simClick(nextBtn);
        setTimeout(() => {
          step();
        }, 3000);
      } else {
        let keys = Object.keys(globalCounts).sort((a, b) => {
          let numA = Math.abs(parseFloat(a) || 0);
          let numB = Math.abs(parseFloat(b) || 0);
          return numB - numA;
        });

        let resultLines = keys.map(k => `${k}*${globalCounts[k]}`);
        let gamesArr = Array.from(globalGames);
        let gamesStr = gamesArr.length > 0 ? '\n|GAMES:' + gamesArr.join('|') : '';
        doneCallback(resultLines.join('\n') + gamesStr);
      }
    }

    step();
  }

  function copyToClipboard(text) {
    try {
      let ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0.01';
      document.body.appendChild(ta);
      ta.select();
      ta.focus();
      document.execCommand('copy');
      // Intentionally leave the textarea in the DOM and focused
      // so that Python's Ctrl+C loop can successfully copy it.
      setTimeout(() => {
        try { document.body.removeChild(ta); } catch(e){}
      }, 30000);
    } catch (e) {}
  }

  function getTotalPages(cont) {
    let allEls = Array.from(cont.querySelectorAll('*'));
    let bestMatch = null;
    let maxDepth = -1;
    
    for (let e of allEls) {
      let t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (t.includes('of') && /\d+ of \d+/.test(t)) {
        // Calculate depth to get the most specific element containing the text
        let depth = 0;
        let curr = e;
        while(curr.parentElement) { depth++; curr = curr.parentElement; }
        
        if (depth > maxDepth) {
          maxDepth = depth;
          bestMatch = t;
        }
      }
    }
    
    if (bestMatch) {
      let m = bestMatch.match(/(\d+)\s+of\s+(\d+)/i);
      if (m && m[2]) return parseInt(m[2], 10);
    }
    return 1;
  }

  function getStackDatesFromPage(cont) {
    let tables = Array.from(cont.querySelectorAll('table'));
    let dataTbl = tables.find(t => (t.offsetWidth > 0 || t.offsetHeight > 0) && Array.from(t.querySelectorAll('th,td')).some(c => c.textContent.toLowerCase().trim() === 'out val' || c.textContent.toLowerCase().trim() === 'in val'));
    if (!dataTbl) return [];
    
    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    let dateIdx = -1, noteIdx = -1;
    
    // Find the header row and identify column indices for 'date' and 'note'
    for (let tr of allTrs) {
      let cells = Array.from(tr.children);
      for (let i = 0; i < cells.length; i++) {
        let txt = cells[i].textContent.toLowerCase().trim();
        if (txt === 'date') dateIdx = i;
        if (txt === 'note') noteIdx = i;
      }
      if (dateIdx !== -1) break;
    }
    
    // Fallbacks if headers not found
    if (dateIdx === -1) dateIdx = 1;
    // Note column is typically the 15th column (index 14), after 'ip' (index 13)
    if (noteIdx === -1) noteIdx = 14;

    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > dateIdx);
    let stackDates = [];
    
    for (let tr of dataRows) {
      // A stack row has an empty 'note' column
      let noteCell = tr.children[noteIdx];
      let noteText = noteCell ? (noteCell.textContent || '').trim() : '';
      if (noteText === '') {
        let dateStr = (tr.children[dateIdx].textContent || '').trim();
        if (dateStr) stackDates.push(dateStr);
      }
    }
    return stackDates;
  }

  let links = Array.from(document.querySelectorAll('a'));
  let tTab = links.find(e => {
    if (e.textContent.toLowerCase().trim() !== 'transactions') return false;
    let idx = links.indexOf(e);
    let start = Math.max(0, idx - 5);
    for (let i = start; i < idx; i++) {
      if (links[i].textContent.toLowerCase().trim().startsWith('notes')) return true;
    }
    return false;
  });
  if (!tTab) { tTab = links.find(e => e.textContent.toLowerCase().trim() === 'transactions'); }

  if (tTab) {
    simClick(tTab);
    setTimeout(() => {
      let targetDoc = null;
      let modalContainer = null;
      let dateInput = null;
      let amtInput = null;
      let typeSelect = null;
      let searchBtn = null;

      for (let doc of getFrames()) {
        if (!doc) continue;
        modalContainer = getActiveModalContainer(tTab, doc);
        dateInput = findDateFromInput(modalContainer);
        if (!dateInput) continue;
        targetDoc = doc;
        amtInput = findAmountInToInput(modalContainer);
        typeSelect = findTypeSelect(modalContainer);
        searchBtn = findSearchButton(modalContainer, dateInput || typeSelect);
        break;
      }

      if (dateInput) {
        setDateFromOneMonthAgo(dateInput);
        // Re-apply — some datepickers reset to month-start (e.g. 2026-09-01) on first blur
        setTimeout(() => { setDateFromOneMonthAgo(dateInput); }, 150);
      } else {
        copyToClipboard("TRANS_RESULT:NO_DATE_INPUT");
        return;
      }

      // Set Type = "Redeem the bonuses" (must stick before Search)
      setTypeToRedeem(modalContainer);
      if (!isRedeemTypeSet(modalContainer)) {
        setTypeToRedeem(targetDoc || document);
      }
      if (amtInput) {
        setVal(amtInput, '');
      }

      closeDatePopups(targetDoc || document);

      setTimeout(() => {
        closeDatePopups(targetDoc || document);

        // Retry Type if still empty, then Search
        if (!isRedeemTypeSet(modalContainer)) {
          setTypeToRedeem(modalContainer);
          pickRedeemOptionFromOpenMenus(targetDoc || document);
        }

        setTimeout(() => {
          closeDatePopups(targetDoc || document);
          if (!isRedeemTypeSet(modalContainer)) {
            setTypeToRedeem(modalContainer);
          }

          // Ensure Date From = today - 31 days (previous month) BEFORE Search
          let expectedDate = getRedeemDateFromValue();
          let liveDate = findDateFromInput(modalContainer) || findDateFromInput(targetDoc || document) || dateInput;
          if (liveDate) {
            setDateFromOneMonthAgo(liveDate);
            // If still stuck on month-start default, force once more
            let curVal = (liveDate.value || '').trim();
            if (!curVal.startsWith(expectedDate.slice(0, 10))) {
              liveDate.value = expectedDate;
              try {
                let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                if (setter) setter.call(liveDate, expectedDate);
              } catch (e) {}
              liveDate.dispatchEvent(new Event('input', { bubbles: true }));
              liveDate.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }

          setTimeout(() => {
            // Final date force right before Search click
            let finalDate = findDateFromInput(modalContainer) || liveDate;
            if (finalDate) setDateFromOneMonthAgo(finalDate);

            let liveSearch = findSearchButton(modalContainer, finalDate || findTypeSelect(modalContainer)) || searchBtn;
            if (liveSearch) simClick(liveSearch);

            // Wait 4.5 seconds for Redeem the bonuses search results to load
            setTimeout(() => {
            let freshDoc = getFrames()[0];
            let freshModal = getActiveModalContainer(tTab, freshDoc) || freshDoc;
            let blankCheck = hasBlankInResults(freshModal);
            let blankFound = blankCheck.found;
            let blankDate = blankCheck.date;

            if (blankFound) {
              let userCurr = "###TCURR###".toUpperCase();
              let searchAmt = '-8.01';
              if (userCurr.includes('EUR')) searchAmt = '-2.01';
              else if (userCurr.includes('HUF')) searchAmt = '-800.01';
              else if (userCurr.includes('USD')) searchAmt = '-2.01';

              let freshTypeSelect = findTypeSelect(freshModal);
              let freshAmtInput = findAmountInToInput(freshModal);
              let freshAmtFromInput = findAmountInFromInput(freshModal);
              let freshDateInput = findDateFromInput(freshModal);
              let freshDateToInput = findDateToInput(freshModal);
              let freshSearchBtn = findSearchButton(freshModal, freshAmtInput || freshTypeSelect);

              if (freshTypeSelect) setSelectVal(freshTypeSelect, 0);
              if (freshAmtInput) setVal(freshAmtInput, searchAmt);
              if (freshAmtFromInput) setVal(freshAmtFromInput, '-10000');
              
              if (freshDateInput) {
                setDateFromOneMonthAgo(freshDateInput);
              }
              if (freshDateToInput) {
                let now = new Date();
                now.setDate(now.getDate() + 1);
                let toVal = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0") + " 23:59";
                setVal(freshDateToInput, toVal);
              }

              closeDatePopups(freshDoc || document);

              setTimeout(() => {
                closeDatePopups(freshDoc || document);
                if (freshSearchBtn) simClick(freshSearchBtn);
                
                // Wait 4.5 seconds for Stack search results to load
                setTimeout(() => {
                  let liveDoc = getFrames()[0];
                  let liveModal = getActiveModalContainer(tTab, liveDoc) || liveDoc;
                  
                  let totalPages = getTotalPages(liveModal);
                  if (totalPages > 50) {
                    let stackDates = getStackDatesFromPage(liveModal);
                    copyToClipboard("TRANS_RESULT:EXCEEDS_5_PAGES|" + stackDates.join(','));
                    return;
                  }
                  
                  computeAllPagesStack(liveModal, function(stackResult) {
                    let resText = stackResult || "NO_STACK";
                    let dateStr = blankDate ? `|STACK_DATE:${blankDate}` : "";
                    copyToClipboard("TRANS_RESULT:" + resText + dateStr);
                  });
                }, 4500);
              }, 600);
            } else {
              copyToClipboard("TRANS_RESULT:AUTOMATIC");
            }
            }, 4500);
          }, 400);
        }, 700);
      }, 800);

    }, 2000);
  } else {
    copyToClipboard("TRANS_RESULT:NO_TRANSACTIONS_TAB");
  }
})();
