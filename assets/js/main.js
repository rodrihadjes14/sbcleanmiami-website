// UTM capture + hidden-field injection

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function currentTracking() {
  const p = new URLSearchParams(window.location.search);
  const data = {};
  for (const k of UTM_KEYS) data[k] = p.get(k) || '';
  data.page_location = window.location.href;
  data.referrer = document.referrer || '';
  return data;
}

function ensureHidden(form, name) {
  let el = form.querySelector(`[name="${name}"]`);
  if (!el) {
    el = document.createElement('input');
    el.type = 'hidden';
    el.name = name;
    form.appendChild(el);
  }
  return el;
}

function injectHidden(form) {
  const data = currentTracking();
  for (const k of [...UTM_KEYS, 'page_location', 'referrer']) {
    const el = ensureHidden(form, k);
    el.value = data[k] || '';
  }
}

// Pre-inject on load so even FormData(form) sees fields
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach(injectHidden);
});

// Refresh right before submit
document.addEventListener('submit', (ev) => {
  const form = ev.target;
  if (form instanceof HTMLFormElement) injectHidden(form);
}, true);

// Safety: handle clicks on submit buttons used by custom JS
document.addEventListener('click', (ev) => {
  const btn = ev.target && ev.target.closest('button, input[type="submit"]');
  if (!btn || !btn.form) return;
  injectHidden(btn.form);
}, true);


// Inline success message (no redirect)
(function () {
  const form = document.getElementById('lead-form');
  const note = document.getElementById('form-note');
  const iframe = document.getElementById('gform_iframe');
  const submitBtn = form.querySelector('[type="submit"]');

  // Ensure correct posting setup (defensive)
  form.setAttribute('method', 'POST');
  form.setAttribute('target', 'gform_iframe');

  form.addEventListener('submit', function () {
    // mark that this load event corresponds to a submit
    window.__gformSubmitted = true;

    // UX: disable button while “sending”
    if (submitBtn) {
      submitBtn.dataset.prevText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    // hide previous note (if any)
    if (note) note.hidden = true;
  });

  // When the hidden iframe loads (Google confirms the response page),
  // show the success note and reset the form.
  iframe.addEventListener('load', function () {
    if (!window.__gformSubmitted) return; // ignore unrelated loads

    // Reset state
    window.__gformSubmitted = false;
    if (form) form.reset();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.prevText || 'Get a Free Quote';
    }

    // Show confirmation message
    if (note) {
      note.textContent = 'We will contact you soon.';
      note.hidden = false;
      note.focus();
      note.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // GA4 lead event
if (window.gtag) {
  gtag('event', 'generate_lead', {
    event_category: 'lead',
    event_label: 'contact_form',
    value: 1
  });
}

  });
})();


