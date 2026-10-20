// Paste the Web App URL from your Google Apps Script deployment here (ends in /exec).
// See documents/waitlist-apps-script.gs for the script to deploy.
var WAITLIST_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzuzCmOT4r5CQv3NQEeUp8TNUOsEzbEgsWv1v-cPiUK74lBBQo4lq-NzUgja0ZfyD73cQ/exec';

function waitlistEscapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

var thisForm = document.getElementById('email-form');
if (thisForm) {
  var submitBtn  = document.getElementById('waitlist-submit');
  var btnTextEl  = document.getElementById('waitlist-btn-text');
  var isSubmitting = false;

  thisForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    var messageEl = document.getElementById('email-message');
    var email = (new FormData(thisForm)).get('email') || '';

    if (!WAITLIST_ENDPOINT || WAITLIST_ENDPOINT.indexOf('PASTE_YOUR') === 0) {
      messageEl.innerHTML = "<span style='color:red;'>Waitlist isn't connected yet — set WAITLIST_ENDPOINT in js/waitlist.js</span>";
      return;
    }

    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
    }
    if (btnTextEl) btnTextEl.textContent = 'Joining...';

    try {
      var response = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        // text/plain avoids a CORS preflight that Apps Script web apps don't handle.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ email: email })
      });
      var result = await response.json();

      if (result.ok) {
        messageEl.innerHTML = "<span style='color:green;'>Thank you! You're on the waitlist.</span>";
        thisForm.reset();
      } else {
        messageEl.innerHTML = "<span style='color:red;'>" + waitlistEscapeHtml(result.error || 'Something went wrong, please try again.') + "</span>";
      }
    } catch (err) {
      messageEl.innerHTML = "<span style='color:red;'>Oops! Something went wrong, please try again.</span>";
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
      }
      if (btnTextEl) btnTextEl.textContent = 'Join';
    }
  });
}
