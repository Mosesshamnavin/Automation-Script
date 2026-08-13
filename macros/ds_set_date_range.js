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
      startFallback.setUTCDate(startFallback.getUTCDate() - 61);
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

    let MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function simClick(el) {
      if (!el) return;
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      if (el.style) el.style.border = "2px solid red";
    }

    function visible(el) {
      if (!el) return false;
      let r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }

    function leafEls(root) {
      return Array.from((root || document).querySelectorAll("*")).filter(function (e) {
        return e.children.length === 0 && visible(e);
      });
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

    function headerMatches(text, year, monthNum) {
      let t = (text || "").replace(/\s+/g, " ").trim();
      let longH = MONTHS[monthNum - 1] + " " + year;
      let shortH = MONTHS_SHORT[monthNum - 1] + " " + year;
      return t.toLowerCase() === longH.toLowerCase() || t.toLowerCase() === shortH.toLowerCase();
    }

    function parseHeader(text) {
      let t = (text || "").replace(/\s+/g, " ").trim();
      let all = MONTHS.concat(MONTHS_SHORT);
      for (let i = 0; i < all.length; i++) {
        let name = all[i];
        let re = new RegExp("^" + name + "\\s+(\\d{4})$", "i");
        let m = t.match(re);
        if (m) {
          let monthNum = (i % 12) + 1;
          return { year: parseInt(m[1], 10), month: monthNum };
        }
      }
      return null;
    }

    function monthHeaders() {
      let found = leafEls().filter(function (e) {
        return parseHeader(e.textContent) !== null;
      });
      found.sort(function (a, b) {
        return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
      });
      return found;
    }

    function calendarRoot(header) {
      let el = header;
      for (let i = 0; i < 8 && el; i++) {
        let r = el.getBoundingClientRect();
        if (r.width >= 160 && r.height >= 160 && r.height < 520) return el;
        el = el.parentElement;
      }
      return header.parentElement || header;
    }

    function navButtons(root, header) {
      let prev = null;
      let next = null;
      let nodes = Array.from(root.querySelectorAll("*")).filter(visible);
      for (let i = 0; i < nodes.length; i++) {
        let al = (nodes[i].getAttribute("aria-label") || "").toLowerCase();
        if (al.indexOf("previous") !== -1) prev = nodes[i];
        if (al.indexOf("next") !== -1) next = nodes[i];
      }
      if (prev && next) return { prev: prev, next: next };
      let row = header.parentElement || header;
      let small = Array.from(row.querySelectorAll("*")).filter(function (e) {
        let r = e.getBoundingClientRect();
        return visible(e) && r.width > 0 && r.width <= 44 && r.height <= 44;
      });
      small.sort(function (a, b) {
        return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
      });
      if (small.length >= 2) {
        return { prev: small[0], next: small[small.length - 1] };
      }
      return { prev: prev, next: next };
    }

    function clickDayInCalendar(root, dayNum) {
      let cells = Array.from(root.querySelectorAll("*")).filter(function (e) {
        if (e.children.length !== 0) return false;
        if (!visible(e)) return false;
        if (e.textContent.trim() !== String(dayNum)) return false;
        let r = e.getBoundingClientRect();
        if (r.width > 50 || r.height > 50) return false;
        if (e.getAttribute("aria-disabled") === "true") return false;
        let cls = (e.className || "").toString().toLowerCase();
        if (cls.indexOf("disabled") !== -1 || cls.indexOf("outside") !== -1) return false;
        return true;
      });
      if (!cells.length) return false;
      simClick(cells[0]);
      return true;
    }

    function monthIndex(year, month) {
      return year * 12 + month;
    }

    function navigateCalendar(header, year, monthNum, done) {
      let attempts = 0;
      function step() {
        let parsed = parseHeader(header.textContent);
        if (parsed && parsed.year === year && parsed.month === monthNum) {
          done(true);
          return;
        }
        if (attempts >= 16) {
          done(false);
          return;
        }
        attempts++;
        let root = calendarRoot(header);
        let nav = navButtons(root, header);
        let target = monthIndex(year, monthNum);
        let current = parsed ? monthIndex(parsed.year, parsed.month) : target;
        let btn = current > target ? nav.prev : nav.next;
        if (!btn) {
          done(false);
          return;
        }
        simClick(btn);
        setTimeout(step, 280);
      }
      step();
    }

    function clickApply() {
      let applyBtn = leafEls().find(function (e) {
        return e.textContent.trim().toLowerCase() === "apply";
      });
      if (applyBtn) simClick(applyBtn);
      else alert("Could not find Apply button!");
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

    let headers = monthHeaders();
    if (headers.length < 2) {
      headers = monthHeaders();
    }
    if (headers.length < 1) {
      alert("Could not find date calendars. Start=" + startStr + " End=" + endStr);
      return;
    }

    let startHeader = headers[0];
    let endHeader = headers.length > 1 ? headers[headers.length - 1] : headers[0];

    navigateCalendar(startHeader, startY, startM, function (okStart) {
      clickDayInCalendar(calendarRoot(startHeader), startD);
      setTimeout(function () {
        navigateCalendar(endHeader, endY, endM, function (okEnd) {
          clickDayInCalendar(calendarRoot(endHeader), endD);
          setTimeout(clickApply, 400);
        });
      }, 350);
    });
  } catch (e) {
    alert("Macro 3 Error: " + e.message);
  }
})();
