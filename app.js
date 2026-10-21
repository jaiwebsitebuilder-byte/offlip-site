'use strict';
// Brevo signup form (email + required 18+ checkbox, no confirmation email). Empty = button disabled.
const WAITLIST_URL = 'https://fc2c06e4.sibforms.com/serve/MUIFABc9jkTiEAo8xBX48nmHnb0_x6LXKOb6LF8urFApCm8b_-ikc8AUyVmmlLUtTw3gH6LCkSkqYy1dZGY0VBXAUdayA4YTBVgbRt1UNRwsMa5OcNJObkDw2uK4iDjxY7Whkx_bFpT3nh4P89mCnvtuZAW2P-lbMgP-QNfukcTFCm5uyQnvWINUOar8dtlHKw1DJzOr2KdzLYttGQ==';

// Same ladder and cost formula as the app (src/data/ranks.ts, src/lib/plan.ts).
const RANKS = [['Fresh Start', 0], ['Pocket Change', 5], ['Snack Fund', 20], ['Takeout Money', 50], ['Hundred Club', 100],
  ['Concert Ticket', 250], ['Weekend Away', 500], ['Four Figures', 1000], ['Flight Mode', 2500], ['Main Character Money', 5000]];
// Same cost formula as the app: pouches and cigarettes are priced per unit, vapes by weekly spend.
const DEFAULTS = { pouches: { perDay: 8, price: 5.5, perCan: 15 }, cigarettes: { perDay: 10, price: 9, perCan: 20 }, vape: { perDay: 20, price: 0, perCan: 0 } };
const COPY = {
  pouches: { perDay: 'Pouches a day', price: 'Price per can', perCan: 'Pouches per can', packs: 'Cans per year' },
  cigarettes: { perDay: 'Cigarettes a day', price: 'Price per pack', perCan: 'Cigarettes per pack', packs: 'Packs per year' },
  vape: { perDay: 'Spent a week', price: '', perCan: '', packs: 'Per week', control: 'weekly spend' },
};
const state = JSON.parse(JSON.stringify(DEFAULTS));
let product = 'pouches';
// Same limits as the app's onboarding steppers.
const limits = { perDay: [1, 60], price: [0.5, 50], perCan: [5, 100] };
const VAPE_WEEKLY = [5, 500];
const $ = (id) => document.getElementById(id);
const money = (n, cents) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

function rankFor(amount) {
  let idx = 0;
  RANKS.forEach(([, t], i) => { if (amount >= t) idx = i; });
  return idx;
}

function render() {
  const s = state[product], c = COPY[product], vape = product === 'vape';
  const daily = vape ? s.perDay / 7 : (s.perDay * s.price) / s.perCan;
  const year = daily * 365;
  $('lblPerDay').textContent = c.perDay;
  $('lblPrice').textContent = c.price;
  $('lblPerCan').textContent = c.perCan;
  $('rowPrice').hidden = vape;
  $('rowPer').hidden = vape;
  // Fields being typed in keep what the person typed; the rest show the formatted value.
  const show = (id, text, label) => {
    const el = $(id);
    if (document.activeElement !== el) el.value = text;
    if (label) el.setAttribute('aria-label', label);
  };
  show('perDay', vape ? money(s.perDay) : String(s.perDay), c.perDay);
  show('price', money(s.price, true), c.price);
  show('perCan', String(s.perCan), c.perCan);
  document.querySelectorAll('[data-step]').forEach((btn) => {
    const [key, step] = btn.dataset.step.split(':');
    const label = key === 'perDay' ? c.control || c.perDay : key === 'price' ? c.price : c.perCan;
    btn.setAttribute('aria-label', (Number(step) < 0 ? 'Decrease ' : 'Increase ') + label.toLowerCase());
  });
  $('day').textContent = money(daily, true);
  // A year over twelve, like the app's plan screen.
  $('month').textContent = money(Math.round(year / 12));
  $('lblCans').textContent = c.packs;
  $('cans').textContent = vape ? money(s.perDay) : Math.round((s.perDay * 365) / s.perCan).toLocaleString('en-US');
  const total = $('year');
  total.innerHTML = '<span>' + money(Math.round(year)) + '</span>';
  total.classList.remove('tick'); void total.offsetWidth; total.classList.add('tick');
  // Reece reacts to the yearly number (same lines as the app's price step, src/lib/mascot.ts).
  $('react').dataset.mood = year >= 1000 ? 'shocked' : 'thinking';
  $('reeceSay').textContent = year >= 1000 ? 'Wait. Seriously? Every year?' : 'Let’s keep every cent of it.';
  const r = rankFor(year);
  $('rankNote').textContent = "That's rank " + String(r + 1).padStart(2, '0') + ', ' + RANKS[r][0] + '.';
  $('ladder').innerHTML = RANKS.map(([name, t], i) =>
    '<div class="line' + (i <= r ? ' reached' : '') + '"><span class="lbl">' + String(i + 1).padStart(2, '0') + ' ' + name +
    '</span><span class="dots"></span><span class="val">' + money(t) + '</span></div>').join('');
}

document.querySelectorAll('[data-step]').forEach((btn) => btn.addEventListener('click', () => {
  const [key, step] = btn.dataset.step.split(':');
  const vape = product === 'vape';
  const [min, max] = vape ? VAPE_WEEKLY : limits[key];
  const delta = Number(step) * (vape ? 5 : 1);
  state[product][key] = Math.min(max, Math.max(min, Math.round((state[product][key] + delta) * 100) / 100));
  render();
}));

// Typed numbers: same rules as the app (a comma before three digits is a thousands separator).
function parseTyped(raw) {
  let t = String(raw).replace(/[$\s]/g, '');
  if (t.includes('.') || /,\d{3}(,\d{3})*$/.test(t)) t = t.replace(/,/g, '');
  else t = t.replace(',', '.');
  if (!/^\d*\.?\d*$/.test(t) || !/\d/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function applyTyped(key, commit) {
  const el = $(key);
  const n = parseTyped(el.value);
  if (n !== null) {
    const vape = product === 'vape';
    const [min, max] = vape && key === 'perDay' ? VAPE_WEEKLY : limits[key];
    const rounded = key === 'price' || (vape && key === 'perDay') ? Math.round(n * 100) / 100 : Math.round(n);
    state[product][key] = Math.min(max, Math.max(min, rounded));
  }
  if (commit) el.blur();
  render();
}
['perDay', 'price', 'perCan'].forEach((key) => {
  const el = $(key);
  el.addEventListener('focus', () => el.select());
  el.addEventListener('input', () => applyTyped(key, false));
  el.addEventListener('change', () => applyTyped(key, false));
  el.addEventListener('blur', () => render());
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyTyped(key, true); });
});

document.querySelectorAll('[data-product]').forEach((btn) => btn.addEventListener('click', () => {
  product = btn.dataset.product;
  document.querySelectorAll('[data-product]').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
  render();
}));


const joinBtn = $('joinBtn'), joinNote = $('joinNote');
function syncJoin() {
  // Only ever link to a real https address (never javascript: or a typo). The form itself asks 18+.
  const ready = /^https:\/\/[^\s"'<>]+$/.test(WAITLIST_URL);
  joinBtn.setAttribute('aria-disabled', ready ? 'false' : 'true');
  // Our own signup page (it sends to the same Brevo list), styled like the rest of the site.
  joinBtn.href = ready ? 'join.html' : '#join';
  if (!ready) joinNote.textContent = 'The waitlist opens soon.';
}
joinBtn.addEventListener('click', (e) => { if (joinBtn.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

const now = new Date();
$('today').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
$('year-copy').textContent = now.getFullYear();
render();
syncJoin();
