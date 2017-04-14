/* global hljs */
(function() {
  hljs.initHighlightingOnLoad();

  function toggleTabs(evt) {
    document.querySelectorAll('.tab-toggle')
      .forEach(function(tab) {
        tab.classList.remove('is-active');
      });
    var clicked = evt.target || evt.srcElement;
    clicked.parentElement.classList.add('is-active');
  }

  window.addEventListener('load', function() {
    document.querySelectorAll('.tab-toggle')
      .forEach(function(tab) {
        tab.addEventListener('click', toggleTabs);
      });
  });
})();
