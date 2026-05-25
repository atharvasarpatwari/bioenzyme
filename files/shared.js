/* ═══════════════════════════════════════════
   VIDHATRI — SHARED JAVASCRIPT
   Cart, Order DB, Utils
═══════════════════════════════════════════ */

// ── CART SYSTEM ──────────────────────────────
const Cart = {
  get() {
    try { return JSON.parse(localStorage.getItem('vidhatri_cart') || '[]'); }
    catch { return []; }
  },
  save(items) {
    localStorage.setItem('vidhatri_cart', JSON.stringify(items));
    Cart.updateBadge();
  },
  add(product) {
    const items = Cart.get();
    const existing = items.find(i => i.id === product.id && i.volume === product.volume);
    if (existing) {
      existing.qty += product.qty || 1;
    } else {
      items.push({ ...product, qty: product.qty || 1, addedAt: Date.now() });
    }
    Cart.save(items);
    Toast.show(`🛒 ${product.name} added to cart!`);
  },
  remove(id, volume) {
    const items = Cart.get().filter(i => !(i.id === id && i.volume === volume));
    Cart.save(items);
  },
  updateQty(id, volume, qty) {
    const items = Cart.get();
    const item = items.find(i => i.id === id && i.volume === volume);
    if (item) { item.qty = Math.max(1, qty); }
    Cart.save(items);
  },
  clear() { localStorage.removeItem('vidhatri_cart'); Cart.updateBadge(); },
  total() {
    return Cart.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  count() {
    return Cart.get().reduce((sum, i) => sum + i.qty, 0);
  },
  updateBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const n = Cart.count();
    badges.forEach(b => { b.textContent = n; b.style.display = n === 0 ? 'none' : 'flex'; });
  }
};

// ── ORDER DATABASE (localStorage) ───────────────
const OrderDB = {
  save(order) {
    const orders = OrderDB.getAll();
    order.id = 'VID' + Date.now();
    order.status = 'confirmed';
    order.placedAt = new Date().toISOString();
    orders.push(order);
    localStorage.setItem('vidhatri_orders', JSON.stringify(orders));
    return order.id;
  },
  getAll() {
    try { return JSON.parse(localStorage.getItem('vidhatri_orders') || '[]'); }
    catch { return []; }
  },
  getById(id) {
    return OrderDB.getAll().find(o => o.id === id);
  },
  saveAddress(addr) {
    localStorage.setItem('vidhatri_last_address', JSON.stringify(addr));
  },
  getLastAddress() {
    try { return JSON.parse(localStorage.getItem('vidhatri_last_address') || 'null'); }
    catch { return null; }
  }
};

// ── TOAST ───────────────────────────────────────
const Toast = {
  timer: null,
  show(msg, dur = 3000) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(Toast.timer);
    Toast.timer = setTimeout(() => el.classList.remove('show'), dur);
  }
};

// ── NAV SCROLL EFFECT ───────────────────────────
function initNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
  Cart.updateBadge();
}

// ── REVEAL ANIMATION ────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
}

// ── TABS ────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.detail-tabs-group');
      group.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = group.querySelector('#' + tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ── QTY SELECTOR ────────────────────────────────
function initQtySelectors() {
  document.querySelectorAll('.qty-selector').forEach(sel => {
    const input = sel.querySelector('.qty-input');
    sel.querySelector('.qty-minus')?.addEventListener('click', () => {
      input.value = Math.max(1, parseInt(input.value) - 1);
      input.dispatchEvent(new Event('change'));
    });
    sel.querySelector('.qty-plus')?.addEventListener('click', () => {
      input.value = parseInt(input.value) + 1;
      input.dispatchEvent(new Event('change'));
    });
  });
}

// ── VOLUME PRICING SELECTOR ─────────────────────
function initVolumePricing(volumePrices) {
  const rows = document.querySelectorAll('.vol-table .vol-row');
  const priceEl = document.querySelector('.price-current');
  const volDisplay = document.querySelector('.selected-vol');
  rows.forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      rows.forEach(r => r.classList.remove('best-val'));
      row.classList.add('best-val');
      const vol = row.dataset.vol;
      const price = row.dataset.price;
      if (priceEl) priceEl.textContent = '₹' + price;
      if (volDisplay) volDisplay.textContent = vol;
      window._selectedVol = vol;
      window._selectedPrice = parseInt(price);
    });
  });
}

// ── ADD TO CART (product page) ──────────────────
function setupAddToCart(product) {
  const btn = document.getElementById('add-to-cart-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const qty = parseInt(document.querySelector('.qty-input')?.value || 1);
    Cart.add({
      id: product.id,
      name: product.name,
      emoji: product.emoji,
      volume: window._selectedVol || product.defaultVol,
      price: window._selectedPrice || product.defaultPrice,
      qty
    });
  });
}

// ── BUY NOW ─────────────────────────────────────
function setupBuyNow(product) {
  const btn = document.getElementById('buy-now-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const qty = parseInt(document.querySelector('.qty-input')?.value || 1);
    Cart.add({
      id: product.id,
      name: product.name,
      emoji: product.emoji,
      volume: window._selectedVol || product.defaultVol,
      price: window._selectedPrice || product.defaultPrice,
      qty
    });
    window.location.href = '../cart.html';
  });
}

// ── RUPEE FORMAT ─────────────────────────────────
function rupee(n) { return '₹' + n.toLocaleString('en-IN'); }

// ── INIT ALL ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initTabs();
  initQtySelectors();
});
