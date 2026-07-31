(function () {
  let p = document.evaluate(
    "//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'payment&frauds')]]",
    document, null, 9, null
  ).singleNodeValue;

  if (p) {
    p.click();
    setTimeout(() => {
      let w = document.evaluate(
        "//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'withdraw to confirm')]]",
        document, null, 9, null
      ).singleNodeValue;
      if (w) w.click();
    }, 1000);
  }
})();
