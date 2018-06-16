/* global QRCode otplib*/
(function() {
  var secret = '';
  var timing;

  otplib.authenticator.options = {
    window: 1,
    step: 30
  };

  function toggleTabs(evt) {
    document.querySelectorAll('.tab-item').forEach(function(tab) {
      tab.classList.remove('is-active');
    });

    var clicked = evt.target || evt.srcElement;
    var parent = clicked.parentElement;
    parent.classList.add('is-active');

    var tabClass = parent.getAttribute('data-tab-id');
    document.querySelectorAll('.tab-item.' + tabClass).forEach(function(tab) {
      tab.classList.add('is-active');
    });
  }

  function createSecret() {
    secret = otplib.authenticator.generateSecret();

    startCountdown();

    var otpauth = otplib.authenticator.keyuri('demo', 'otplib', secret);

    document.querySelector('.otp-secret').innerHTML = secret;

    QRCode.toDataURL(otpauth, function(err, url) {
      var container = document.querySelector('.otp-qrcode .qrcode');
      if (err) {
        container.innerHTML = 'Error generating QR Code';
        return;
      }
      container.innerHTML = '<img src="' + url + '" alt="" />';
    });
  }

  function setToken(token) {
    document.querySelector('.otp-token').innerHTML = token;
  }

  function generator() {
    if (!secret) {
      window.clearInterval(timing);
      return;
    }

    const remaining = otplib.authenticator.timeRemaining();
    if (otplib.authenticator.timeUsed() === 0) {
      setToken(otplib.authenticator.generate(secret));
    }

    // time left
    document.querySelector('.otp-countdown').innerHTML = remaining + 's';
  }

  function startCountdown() {
    window.setTimeout(() => {
      if (secret) {
        setToken(otplib.authenticator.generate(secret));
      }
      timing = window.setInterval(generator, 1000);
    }, 2000);
  }

  function initVerify() {
    document
      .querySelector('.otp-verify-send')
      .addEventListener('click', function() {
        var inputValue = document.querySelector('.otp-verify-input').value;
        var delta = otplib.authenticator.checkDelta(inputValue, secret);

        var text = document.querySelector('.otp-verify-result .text');
        var icon = document.querySelector('.otp-verify-result .fa');

        var win = '<br /> (window: ' + delta + ')';

        if (Number.isInteger(delta)) {
          icon.classList.add('fa-check');
          icon.classList.remove('fa-times');
          text.innerHTML = 'Verified token' + win;
          return;
        }

        icon.classList.add('fa-times');
        icon.classList.remove('fa-check');
        text.innerHTML = 'Cannot verify token';
      });
  }

  window.addEventListener('load', function() {
    document.querySelectorAll('.tabs .tab-item').forEach(function(tab) {
      tab.addEventListener('click', toggleTabs);
    });

    createSecret();
    initVerify();
  });
})();
