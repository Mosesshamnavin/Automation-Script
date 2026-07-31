// Dynamic placeholders replaced at runtime:
//   ###NOTE_TEXT### -> the cancellation note string (must not contain single quotes)

(function () {
  let noteText = '###NOTE_TEXT###';

  // Inject note into textarea
  let ta = document.querySelector('textarea');
  if (ta) {
    let setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    if (setter) setter.call(ta, noteText); else ta.value = noteText;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Select "Important" in the Note Type dropdown
  let selects = Array.from(document.querySelectorAll('select'));
  let noteSelect = selects.find(s =>
    s.parentElement && s.parentElement.textContent.toLowerCase().includes('note type') ||
    s.parentElement && s.parentElement.previousElementSibling &&
      s.parentElement.previousElementSibling.textContent.toLowerCase().includes('note type') ||
    s.closest('div') && s.closest('div').textContent.toLowerCase().includes('note type')
  );
  if (!noteSelect && selects.length > 0) noteSelect = selects[0];

  if (noteSelect) {
    for (let o of noteSelect.options) {
      if (o.textContent.trim().toLowerCase() === 'important') {
        o.selected = true;
      } else {
        o.selected = false;
      }
    }
    noteSelect.dispatchEvent(new Event('change', { bubbles: true }));
    noteSelect.dispatchEvent(new Event('input', { bubbles: true }));
  }
})();
