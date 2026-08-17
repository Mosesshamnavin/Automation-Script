(function () {
  // Extract the converted PLN amount from Google's currency converter page.
  // Tries multiple selector strategies since Google's DOM changes occasionally.
  let result = null;

  // Strategy 1: Look for input elements inside the converter widget.
  // Google renders two inputs: [from-amount] and [to-amount].
  // The second input in the .KF1n4b or [data-attrid="converter"] section is the result.
  let converterRoot = document.querySelector(
    '[data-attrid="converter"], [jsname="kA6FYd"], .vk_c.card-section, .vk_bk'
  );
  if (converterRoot) {
    let inputs = Array.from(converterRoot.querySelectorAll('input[type="text"], input:not([type="hidden"])'));
    // The second input is the "to" amount (PLN result)
    if (inputs.length >= 2) {
      result = inputs[1].value.replace(/,/g, '').trim();
    }
  }

  // Strategy 2: look for an input whose aria-label contains "Polish" or "PLN"
  if (!result) {
    let allInputs = Array.from(document.querySelectorAll('input'));
    for (let inp of allInputs) {
      let lbl = (inp.getAttribute('aria-label') || '').toLowerCase();
      if (lbl.includes('polish') || lbl.includes('pln')) {
        let val = (inp.value || '').replace(/,/g, '').trim();
        if (val && /^\d/.test(val)) { result = val; break; }
      }
    }
  }

  // Strategy 3: look for the result in a span / div with a big bold number near "Polish złoty"
  if (!result) {
    let allEls = Array.from(document.querySelectorAll('span, div'));
    for (let el of allEls) {
      let txt = (el.textContent || '').trim();
      // Find "3876.11 Polish złoty" pattern
      let m = txt.match(/^([\d,]+\.?\d*)\s+Polish\s+(z[ł\u0142]oty|zloty)/i);
      if (m) { result = m[1].replace(/,/g, ''); break; }
    }
  }

  let output = result ? ('FX_RESULT:' + result) : 'FX_RESULT:FAILED';

  try {
    let inp = document.createElement('input');
    inp.value = output;
    document.body.appendChild(inp);
    inp.select();
    document.execCommand('copy');
    document.body.removeChild(inp);
  } catch (e) {}
})();
