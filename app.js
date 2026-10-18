'use strict';
// Paste the Brevo form's share link here once the form has its 18+ checkbox and captcha.
// While it's empty, the button stays disabled and nothing is collected.
const WAITLIST_URL = '';

// Same ladder and cost formula as the app (src/data/ranks.ts, src/lib/plan.ts).
const RANKS = [['Fresh Start', 0], ['Pocket Change', 5], ['Snack Fund', 20], ['Takeout Money', 50], ['Hundred Club', 100],
  ['Concert Ticket', 250], ['Weekend Away', 500], ['Four Figures', 1000], ['Flight Mode', 2500], ['Main Character Money', 5000]];
const state = { perDay: 8, price: 5.5, perCan: 15 };
const limits = { perDay: [1, 60], price: [0.25, 30], perCan: [1, 40] };
const $ = (id) => document.getElementById(id);
const money = (n, cents) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

function rankFor(amount) {
  let idx = 0;
  RANKS.forEach(([, t], i) => { if (amount >= t) idx = i; });
  return idx;
}

function render() {
  const daily = (state.perDay * state.price) / state.perCan;
  const year = daily * 365;
  $('perDay').textContent = state.perDay;
  $('price').textContent = money(state.price, true);
  $('perCan').textContent = state.perCan;
  $('day').textContent = money(daily, true);
  $('month').textContent = money(Math.round(daily * 30));
  $('cans').textContent = Math.round((state.perDay * 365) / state.perCan).toLocaleString('en-US');
  const total = $('year');
  total.innerHTML = '<span>' + money(Math.round(year)) + '</span>';
  total.classList.remove('tick'); void total.offsetWidth; total.classList.add('tick');
  const r = rankFor(year);
  $('rankNote').textContent = "That's rank " + String(r + 1).padStart(2, '0') + ', ' + RANKS[r][0] + '.';
  $('ladder').innerHTML = RANKS.map(([name, t], i) =>
    '<div class="line' + (i <= r ? ' reached' : '') + '"><span class="lbl">' + String(i + 1).padStart(2, '0') + ' ' + name +
    '</span><span class="dots"></span><span class="val">' + money(t) + '</span></div>').join('');
}

document.querySelectorAll('[data-step]').forEach((btn) => btn.addEventListener('click', () => {
  const [key, step] = btn.dataset.step.split(':');
  const [min, max] = limits[key];
  state[key] = Math.min(max, Math.max(min, Math.round((state[key] + Number(step)) * 100) / 100));
  render();
}));

const adult = $('adult'), joinBtn = $('joinBtn'), joinNote = $('joinNote');
function syncJoin() {
  // Only ever link to a real https address (never javascript: or a typo).
  const ready = adult.checked && /^https:\/\/[^\s"'<>]+$/.test(WAITLIST_URL);
  joinBtn.setAttribute('aria-disabled', ready ? 'false' : 'true');
  joinBtn.href = ready ? WAITLIST_URL : '#join';
  joinNote.textContent = !WAITLIST_URL ? 'The waitlist opens soon.' : adult.checked ? 'Opens the signup form.' : 'Tick the box to continue.';
}
adult.addEventListener('change', syncJoin);
joinBtn.addEventListener('click', (e) => { if (joinBtn.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

const now = new Date();
$('today').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
$('year-copy').textContent = now.getFullYear();
render();
syncJoin();
