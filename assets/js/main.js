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
