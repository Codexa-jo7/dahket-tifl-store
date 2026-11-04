import { categories } from './data/categories.js?v=2';
import { changeQuantity, loadCart, saveCart } from './cart/cart.js';
import { shippingStatus, whatsappOrder } from './checkout/checkout.js?v=customer';
import { store } from './data/store.js';

const SUPABASE_URL = "https://ekkfcefygmvdcwbxybth.supabase.co";
const SUPABASE_KEY = "sb_publishable_h-L8N3j5IQUg7Pnl1eL3Qw_voWpqqh7";

async function fetchSupabaseProducts() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await res.json();
    return data.map(item => ({
      id: String(item.id),
      name: item.title,
      description: item.description || '',
      price: Math.round(Number(item.price) * 100),
      currency: 'JOD',
      category: item.category || 'الكل',
      images: [{ url: item.image_url, alt: item.title }],
      available: true
    }));
  } catch (e) {
    console.error("خطأ Supabase:", e);
    return [];
  }
}

let allProductsCache = [];

async function listProducts(query = '') {
  if (allProductsCache.length === 0) {
    allProductsCache = await fetchSupabaseProducts();
  }
  const q = query.trim().toLowerCase();
  if (!q) return allProductsCache;
  return allProductsCache.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
}

async function getProduct(id) {
  if (allProductsCache.length === 0) {
    allProductsCache = await fetchSupabaseProducts();
  }
  return allProductsCache.find(p => String(p.id) === String(id));
}

const $ = s => document.querySelector(s);
const t = (ar) => ar;
const money = (value, currency) => new Intl.NumberFormat('ar-JO', {style:'currency', currency}).format(value / 100);
let cart = loadCart(), lines = [], category = "الكل";

function element(tag, text, className) { 
  const el = document.createElement(tag); 
  if (text) el.textContent = text; 
  if (className) el.className = className; 
  return el; 
}

async function renderProducts() {
  const products = (await listProducts($('#search').value)).filter(p => category === 'الكل' || p.category === category);
  const grid = $('#products-list');
  grid.innerHTML = '';
  
  if (!products.length) {
    grid.append(element('p', $('#search').value ? t('لا توجد منتجات تطابق بحثك') : 'لا توجد منتجات متوفرة.', 'empty'));
    return;
  }

  products.forEach(p => {
    const card = element('article', '', 'card');
    
    if (p.images && p.images.length) {
      const img = document.createElement('img');
      img.src = p.images[0].url;
      img.alt = p.images[0].alt || p.name;
      img.loading = 'lazy';
      card.append(img);
    }
    
    card.append(element('h3', p.name));
    if (p.description) {
      card.append(element('p', p.description));
    }
    
    const priceEl = element('strong', money(p.price, p.currency));
    card.append(priceEl);
    
    const addBtn = element('button', 'أضف للسلة +');
    addBtn.onclick = () => {
      cart = changeQuantity(cart, p.id, 1);
      saveCart(cart);
      renderCart();
    };
    card.append(addBtn);
    
    grid.append(card);
  });
}

async function renderCart() {
  saveCart(cart);
  lines = (await Promise.all(cart.map(async item => ({ ...item, product: await getProduct(item.id) })))).filter(x => x.product);
  $('#count').textContent = lines.reduce((n, x) => n + x.quantity, 0);
  if ($('#floating-count')) $('#floating-count').textContent = $('#count').textContent;

  const container = $('#cart-items') || $('#cart dialog');
  // استدعاء دالة عرض السلة الأصلية إن وجدت أو الاكتفاء بالعداد
}

$('#search').oninput = renderProducts;
$('#cart-button').onclick = () => $('#cart').showModal();
if ($('#close-cart')) $('#close-cart').onclick = () => $('#cart').close();
if ($('#instagram-link')) $('#instagram-link').href = store.instagramUrl;

$('#checkout').onsubmit = e => {
  e.preventDefault();
  try {
    const customer = {
      name: $('#customer-name').value,
      phone: $('#customer-phone').value,
      address: $('#customer-address').value
    };
    const order = whatsappOrder(lines, money, customer);
    window.open(order.url, '_blank');
  } catch (err) {
    alert(err.message);
  }
};

const filterContainer = $('#filters');
if (filterContainer) {
  for (const label of ['الكل', ...categories]) {
    const button = element('button', label);
    button.setAttribute('aria-pressed', String(label === category));
    button.onclick = () => {
      category = label;
      filterContainer.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      renderProducts();
    };
    filterContainer.append(button);
  }
}

if ($('#floating-cart')) $('#floating-cart').onclick = () => $('#cart').showModal();

renderProducts();
renderCart();
