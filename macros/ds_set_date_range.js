(function () {
  try {
    let startStr = "###START_DATE###";
    let endStr = "###END_DATE###";

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function toYMD(d) {
      return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
      let endFallback = new Date();
      let startFallback = new Date(Date.UTC(endFallback.getUTCFullYear(), endFallback.getUTCMonth(), endFallback.getUTCDate()));
      startFallback.setUTCDate(startFallback.getUTCDate() - 62);
      endStr = toYMD(new Date(Date.UTC(endFallback.getUTCFullYear(), endFallback.getUTCMonth(), endFallback.getUTCDate())));
      startStr = toYMD(startFallback);
    }

    let startParts = startStr.split("-");
    let endParts = endStr.split("-");
    let startY = parseInt(startParts[0], 10);
    let startM = parseInt(startParts[1], 10);
    let startD = parseInt(startParts[2], 10);
    let endY = parseInt(endParts[0], 10);
    let endM = parseInt(endParts[1], 10);
    let endD = parseInt(endParts[2], 10);

    const MONTH_MAP = {
      "jan": 1, "january": 1,
      "feb": 2, "february": 2,
      "mar": 3, "march": 3,
      "apr": 4, "april": 4,
      "may": 5,
      "jun": 6, "june": 6,
      "jul": 7, "july": 7,
      "aug": 8, "august": 8,
      "sep": 9, "sept": 9, "september": 9,
      "oct": 10, "october": 10,
      "nov": 11, "november": 11,
      "dec": 12, "december": 12
    };

    function simClick(el) {
      if (!el) return;
      try { el.scrollIntoView({ block: "center", inline: "center" }); } catch (e) {}
      const opts = { bubbles: true, cancelable: true, view: window };
      el.dispatchEvent(new PointerEvent("pointerdown", opts));
      el.dispatchEvent(new MouseEvent("mousedown", opts));
      el.dispatchEvent(new PointerEvent("pointerup", opts));
      el.dispatchEvent(new MouseEvent("mouseup", opts));
      el.click();
      if (el.style) el.style.outline = "2px solid green";
    }

    function visible(el) {
      if (!el) return false;
      let r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }

    function setNativeValue(input, val) {
      try {
        let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (setter) setter.call(input, val);
        else input.value = val;
      } catch (err) {
        input.value = val;
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function parseHeader(text) {
      if (!text) return null;
      let t = text.replace(/[\u25BC\u25B2\u25BE\u25B8▼▲▾▸]/g, " ").replace(/\s+/g, " ").trim();
      let m = t.match(/\b([A-Za-z]+)\.?\s+(\d{4})\b/) || t.match(/\b(\d{4})\s+([A-Za-z]+)\b/);
      if (m) {
        let mStr = isNaN(m[1]) ? m[1].toLowerCase() : m[2].toLowerCase();
        let yStr = isNaN(m[1]) ? m[2] : m[1];
        if (MONTH_MAP[mStr]) {
          return { year: parseInt(yStr, 10), month: MONTH_MAP[mStr] };
        }
      }
      return null;
    }

    function findDatePickerContainer() {
      let all = Array.from(document.querySelectorAll("*")).filter(visible);
      let applyBtn = all.find(e => {
        let t = (e.textContent || "").trim().toLowerCase();
        return (t === "apply" || t === "apply filter") && (e.children.length === 0 || e.tagName === "BUTTON");
      });
      if (applyBtn) {
        let p = applyBtn.parentElement;
        for (let i = 0; i < 12 && p && p !== document.body; i++) {
          let r = p.getBoundingClientRect();
          if (r.width >= 350 && r.height >= 250) {
            return p;
          }
          p = p.parentElement;
        }
      }
      return document.body;
    }

    function getPaneControls(isLeft) {
      let container = findDatePickerContainer();
      let cr = container.getBoundingClientRect();
      let midX = cr.left + cr.width / 2;

      let paneEls = Array.from(container.querySelectorAll("*")).filter(e => {
        if (!visible(e)) return false;
        let r = e.getBoundingClientRect();
        if (isLeft) {
          return r.right <= midX + 35;
        } else {
          return r.left >= midX - 35;
        }
      });

      let headerMatchEls = paneEls.filter(e => parseHeader(e.textContent) !== null);
      headerMatchEls = headerMatchEls.filter(e => {
        return !Array.from(e.children).some(c => parseHeader(c.textContent) !== null);
      });
      let headerEl = headerMatchEls[0] || null;
      let parsedMonth = headerEl ? parseHeader(headerEl.textContent) : null;

      let prevBtn = null;
      let nextBtn = null;

      if (headerEl) {
        let hr = headerEl.getBoundingClientRect();
        let rowCandidates = paneEls.filter(e => {
          let r = e.getBoundingClientRect();
          let sameRow = Math.abs(r.top - hr.top) < 40 && r.height > 0 && r.height <= 60;
          return sameRow && e !== headerEl && !headerEl.contains(e);
        });

        for (let e of rowCandidates) {
          let al = (e.getAttribute("aria-label") || "").toLowerCase();
          let txt = (e.textContent || "").trim().toLowerCase();
          if (al.includes("prev") || al.includes("before") || al.includes("back") || txt === "<" || txt === "‹" || txt === "chevron_left" || txt === "navigate_before" || txt === "keyboard_arrow_left") {
            prevBtn = e;
          }
          if (al.includes("next") || al.includes("forward") || txt === ">" || txt === "›" || txt === "chevron_right" || txt === "navigate_next" || txt === "keyboard_arrow_right") {
            nextBtn = e;
          }
        }

        if (!prevBtn || !nextBtn) {
          let smallBtns = rowCandidates.filter(e => {
            let r = e.getBoundingClientRect();
            return r.width > 0 && r.width <= 50 && e.children.length <= 1;
          });
          smallBtns.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
          if (smallBtns.length >= 2) {
            if (!prevBtn) prevBtn = smallBtns[0];
            if (!nextBtn) nextBtn = smallBtns[smallBtns.length - 1];
          } else if (smallBtns.length === 1) {
            if (!prevBtn) prevBtn = smallBtns[0];
          }
        }
      }

      return {
        headerEl: headerEl,
        parsed: parsedMonth,
        prevBtn: prevBtn,
        nextBtn: nextBtn,
        paneEls: paneEls
      };
    }

    function clickDayInPane(isLeft, dayNum) {
      let ctrl = getPaneControls(isLeft);
      let headerEl = ctrl.headerEl;
      let hr = headerEl ? headerEl.getBoundingClientRect() : null;

      let dayCells = ctrl.paneEls.filter(e => {
        if (e.children.length !== 0) return false;
        let txt = e.textContent.trim();
        if (txt !== String(dayNum)) return false;
        let r = e.getBoundingClientRect();
        if (r.width > 55 || r.height > 55 || r.width === 0) return false;
        if (hr && r.top < hr.bottom - 5) return false;
        if (e.getAttribute("aria-disabled") === "true") return false;
        let cls = (e.className || "").toString().toLowerCase();
        if (cls.includes("disabled") || cls.includes("outside") || cls.includes("other-month")) return false;
        return true;
      });

      if (dayCells.length > 0) {
        simClick(dayCells[0]);
        return true;
      }
      return false;
    }

    function navigatePane(isLeft, targetYear, targetMonth, callback) {
      let maxSteps = 16;
      let steps = 0;

      function checkAndStep() {
        steps++;
        if (steps > maxSteps) {
          callback(false);
          return;
        }

        let ctrl = getPaneControls(isLeft);
        if (!ctrl.parsed) {
          callback(false);
          return;
        }

        let curIdx = ctrl.parsed.year * 12 + ctrl.parsed.month;
        let targetIdx = targetYear * 12 + targetMonth;

        if (curIdx === targetIdx) {
          callback(true);
          return;
        }

        let btn = curIdx > targetIdx ? ctrl.prevBtn : ctrl.nextBtn;
        if (!btn) {
          callback(false);
          return;
        }

        simClick(btn);
        setTimeout(checkAndStep, 280);
      }

      checkAndStep();
    }

    function clickApply() {
      let all = Array.from(document.querySelectorAll("*")).filter(visible);
      let applyBtn = all.find(e => {
        let t = (e.textContent || "").trim().toLowerCase();
        return (t === "apply" || t === "apply filter") && (e.children.length === 0 || e.tagName === "BUTTON");
      });
      if (applyBtn) {
        simClick(applyBtn);
      } else {
        let btns = Array.from(document.querySelectorAll("button, div[role='button']")).filter(visible);
        let b = btns.find(btn => (btn.textContent || "").trim().toLowerCase().includes("apply"));
        if (b) simClick(b);
      }
    }

    function tryFillInputs() {
      let inputs = Array.from(document.querySelectorAll("input")).filter(function (i) {
        if (!visible(i)) return false;
        return (i.type || "").toLowerCase() === "date";
      });
      if (inputs.length >= 2) {
        inputs.sort(function (a, b) {
          return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
        });
        setNativeValue(inputs[0], startStr);
        setNativeValue(inputs[1], endStr);
        return true;
      }
      return false;
    }

    if (tryFillInputs()) {
      setTimeout(clickApply, 500);
      return;
    }

    // Navigate Left Pane (Start Date) -> click Start Day -> Navigate Right Pane (End Date) -> click End Day -> Apply
    navigatePane(true, startY, startM, function (okStart) {
      setTimeout(function () {
        clickDayInPane(true, startD);
        setTimeout(function () {
          navigatePane(false, endY, endM, function (okEnd) {
            setTimeout(function () {
              clickDayInPane(false, endD);
              setTimeout(clickApply, 400);
            }, 300);
          });
        }, 350);
      }, 300);
    });
  } catch (e) {
    alert("Macro 3 Error: " + e.message);
  }
})();
