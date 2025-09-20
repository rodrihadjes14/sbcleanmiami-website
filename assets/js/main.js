// assets/js/main.js
// ------------------------------------------------------------
// 1) UTM capture + hidden-field injection (works for any form)
// ------------------------------------------------------------
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
  if (!form) return;
  const data = currentTracking();
  for (const k of [...UTM_KEYS, 'page_location', 'referrer']) {
    ensureHidden(form, k).value = data[k] || '';
  }
}

// ------------------------------------------------------------
// 2) Attach listeners after DOM is ready
//    - Pre-inject UTMs
//    - Re-inject right before submit/click
//    - Handle inline success UI + GA4 event for the contact form
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Pre-inject into all forms on load
  document.querySelectorAll('form').forEach(injectHidden);

  // Keep UTMs fresh just before submission
  document.addEventListener('submit', (ev) => {
    const f = ev.target;
    if (f instanceof HTMLFormElement) injectHidden(f);
  }, true);

  // Also catch clicks on submit buttons that might trigger custom submits
  document.addEventListener('click', (ev) => {
    const btn = ev.target && ev.target.closest('button, input[type="submit"]');
    if (btn && btn.form) injectHidden(btn.form);
  }, true);

  // Inline success message + GA4 for the main contact form
  const form   = document.getElementById('lead-form');
  const note   = document.getElementById('form-note');
  const iframe = document.getElementById('gform_iframe');
  if (!form || !iframe) return; // safely exit on pages without the form

  const submitBtn = form.querySelector('[type="submit"]');

  // Defensive: ensure correct posting setup
  form.method = 'POST';
  form.target = 'gform_iframe';

  form.addEventListener('submit', () => {
    window.__gformSubmitted = true;
    if (submitBtn) {
      submitBtn.dataset.prevText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    if (note) note.hidden = true;
  });

  iframe.addEventListener('load', () => {
    if (!window.__gformSubmitted) return; // ignore unrelated loads
    window.__gformSubmitted = false;

    form.reset();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.prevText || 'Get a Free Quote';
    }
    if (note) {
      note.textContent = 'We will contact you soon.';
      note.hidden = false;
      note.focus();
      note.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // GA4 lead event (shows up in Realtime/DebugView)
    if (window.gtag) {
      window.gtag('event', 'generate_lead', {
        event_category: 'lead',
        event_label: 'contact_form',
        value: 1
        // ,debug_mode: true // uncomment during DebugView testing
      });
    }
  });
});


// Footer phone/email + Google Review CTA tracking (robust to async GA load)
document.addEventListener('DOMContentLoaded', () => {
  function sendGA(name, params) {
    const payload = Object.assign({ transport_type: 'beacon' }, params || {});
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    } else {
      setTimeout(() => {
        if (typeof window.gtag === 'function') window.gtag('event', name, payload);
      }, 500);
    }
  }

  // Phone
  const tel = document.getElementById('tel-link');
  if (tel) tel.addEventListener('click', () => {
    sendGA('click_to_call', { event_category: 'engagement', event_label: 'footer_tel' });
  });

  // Email
  const email = document.getElementById('email-link');
  if (email) email.addEventListener('click', () => {
    sendGA('click_email', { event_category: 'engagement', event_label: 'footer_email' });
  });

  // Review links on ANY page (use class selector)
  document.querySelectorAll('a.review-link').forEach((el) => {
    el.addEventListener('click', () => {
      sendGA('click_review', {
        event_category: 'engagement',
        event_label: el.id || 'review_link'
      });
    });
  });
});


// Review links on ANY page (use class selector)
document.querySelectorAll('a.review-link').forEach((el) => {
  el.addEventListener('click', () => {
    // TEMP: debug + console so we can see it fire
    sendGA('click_review', {
      event_category: 'engagement',
      event_label: el.id || 'review_link',
      debug_mode: true
    });
    console.log('click_review fired:', el.href);
  });
});

