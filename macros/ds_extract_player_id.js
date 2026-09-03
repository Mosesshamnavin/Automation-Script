(function () {
  let txt = document.body.innerText || document.body.textContent || '';
  let matchId = txt.match(/\(id:\s*(\d+)/i);
  let id = matchId ? matchId[1] : '';

  let all = Array.from(document.querySelectorAll('td, span, div, p'));
  let nameLabel = all.find(td => td.textContent.trim().toLowerCase() === 'name');
  let name = '';
  if (nameLabel && nameLabel.nextElementSibling) {
    name = nameLabel.nextElementSibling.textContent.trim();
  }

  // Also extract email from wallet page if present
  let emailMatch = txt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  let email = emailMatch ? emailMatch[0].trim().toLowerCase() : '';

  let res = id + '|NAME:' + name + '|EMAIL:' + email;
  let input = document.createElement('input');
  input.value = res;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();
