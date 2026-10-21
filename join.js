'use strict';
// Sends the signup to Brevo (our email list) in the background and shows our own thank-you,
// instead of Brevo's plain page. Without JavaScript the form still posts to Brevo directly.
const form = document.getElementById('joinForm');
const email = document.getElementById('EMAIL');
const adult = document.getElementById('AGE_18_PLUS');
const error = document.getElementById('joinError');
const submit = document.getElementById('joinSubmit');

function showError(text) {
  error.textContent = text;
  error.hidden = false;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.hidden = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return showError('That email doesn’t look right. Check it and try again.');
  if (!adult.checked) return showError('Offlip is for adults. Tick the box to confirm you’re 18 or older.');
  submit.disabled = true;
  submit.textContent = 'Saving your spot…';
  try {
    const res = await fetch(form.action + '?isAjax=1', { method: 'POST', body: new FormData(form) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error('rejected');
    document.getElementById('formView').hidden = true;
    document.getElementById('doneView').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    showError('Couldn’t save your spot just now. Check your connection and try again.');
    submit.disabled = false;
    submit.textContent = 'Save my spot';
  }
});
