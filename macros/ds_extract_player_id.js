(function () {
  let txt = document.body.innerText;
  let matchId = txt.match(/\(id:\s*(\d+)/i);
  let id = matchId ? matchId[1] : '';

  let all = Array.from(document.querySelectorAll('td'));
  let nameLabel = all.find(td => td.textContent.trim().toLowerCase() === 'name');
  let name = '';
  if (nameLabel && nameLabel.nextElementSibling) {
    name = nameLabel.nextElementSibling.textContent.trim();
  }

  let res = id + '|NAME:' + name;
  let input = document.createElement('input');
  input.value = res;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();
