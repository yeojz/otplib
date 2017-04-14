/* global hljs */
(function() {
  hljs.initHighlightingOnLoad();

  function toggleTabs(evt) {
    document.querySelectorAll('.tab-item')
      .forEach(function(tab) {
        tab.classList.remove('is-active');
      });

    var clicked = evt.target || evt.srcElement;
    var parent = clicked.parentElement;
    parent.classList.add('is-active');

    var tabClass = parent.getAttribute('data-tab-id');
    document.querySelectorAll('.tab-item.' + tabClass)
      .forEach(function(tab) {
        tab.classList.add('is-active');
      });
  }

  window.addEventListener('load', function() {
    document.querySelectorAll('.tabs .tab-item')
      .forEach(function(tab) {
        tab.addEventListener('click', toggleTabs);
      });
  });
})();
