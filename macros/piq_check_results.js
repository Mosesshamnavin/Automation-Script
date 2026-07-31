(function () {
  let all = Array.from(document.querySelectorAll('th'));
  let holderTh = all.find(th => th.textContent.trim().toLowerCase() === 'holder');
  let successTh = all.find(th => th.textContent.trim().toLowerCase() === 'last success');
  let accountTh = all.find(th => th.textContent.trim().toLowerCase() === 'account');

  let holder = '';
  let lastSuccess = '';
  let account = '';

  if (holderTh || successTh || accountTh) {
    let tr = holderTh
      ? holderTh.closest('tr')
      : (successTh ? successTh.closest('tr') : accountTh.closest('tr'));
    let ths = Array.from(tr.children);
    let hIdx = holderTh ? ths.indexOf(holderTh) : -1;
    let sIdx = successTh ? ths.indexOf(successTh) : -1;
    let aIdx = accountTh ? ths.indexOf(accountTh) : -1;

    let tbody = tr.parentElement.nextElementSibling || tr.closest('table').querySelector('tbody');
    if (tbody) {
      let firstDataRow = tbody.querySelector('tr');
      if (firstDataRow && firstDataRow.children.length > Math.max(hIdx, sIdx, aIdx)) {
        if (hIdx !== -1) holder = firstDataRow.children[hIdx].textContent.trim();
        if (sIdx !== -1) lastSuccess = firstDataRow.children[sIdx].textContent.trim();
        if (aIdx !== -1) account = firstDataRow.children[aIdx].textContent.trim();
      }
    }
  }

  let res = 'HOLDER:' + holder + '|SUCCESS:' + lastSuccess + '|ACCOUNT:' + account;
  let input = document.createElement('input');
  input.value = res;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();
