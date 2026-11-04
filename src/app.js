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
  
  // فرض شبكة متناسقة للبطاقات
  grid.style.cssText = 'display: grid !important; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) !important; gap: 20px !important; padding: 25px 0 !important; width: 100% !important; max-width: 1200px !important; margin: 0 auto !important;';

  if (!products.length) {
    grid.append(element('p', $('#search').value ? t('لا توجد منتجات تطابق بحثك') : 'لا توجد منتجات متوفرة حالياً.', 'empty'));
    return;
  }

  products.forEach(p => {
    const card = element('article', '', 'card');
    card.style.cssText = 'display: flex !important; flex-direction: column !important; background: #ffffff !important; border-radius: 18px !important; overflow: hidden !important; border: 1px solid #eee !important; box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; padding: 14px !important; box-sizing: border-box !important; text-align: center !important;';
    
    if (p.images && p.images.length) {
      const img = document.createElement('img');
      img.src = p.images[0].url;
      img.alt = p.images[0].alt || p.name;
      img.loading = 'lazy';
      // ضبط قياس الصورة وإلغاء التمدد
      img.style.cssText = 'width: 100% !important; height: 230px !important; object-fit: contain !important; border-radius: 12px !important; background-color: #fafafa !important; margin-bottom: 12px !important; display: block !important;';
      card.append(img);
    }
    
    const title = element('h3', p.name);
    title.style.cssText = 'font-size: 16px !important; margin: 8px 0 4px !important; color: #2f3542 !important; font-weight: 700 !important;';
    card.append(title);

    if (p.description) {
      const desc = element('p', p.description);
      desc.style.cssText = 'font-size: 12px !important; color: #747d8c !important; margin-bottom: 10px !important; flex-grow: 1 !important; line-height: 1.4 !important;';
      card.append(desc);
    }
    
    const priceEl = element('strong', money(p.price, p.currency));
    priceEl.style.cssText = 'font-size: 18px !important; color: #2f3542 !important; margin-bottom: 12px !important; display: block !important; font-weight: bold !important;';
    card.append(priceEl);
    
    const addBtn = element('button', 'أضف للسلة +');
    addBtn.style.cssText = 'width: 100% !important; background: #4a335a !important; color: #ffffff !important; border: none !important; padding: 10px !important; border-radius: 10px !important; font-size: 14px !important; font-weight: bold !important; cursor: pointer !important; transition: opacity 0.2s !important;';
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

  const container = $('#cart-items');
  if (!container) return;
  container.innerHTML = '';

  if (!lines.length) {
    container.append(element('p', 'سلتك فارغة حالياً.', 'empty-cart'));
    if ($('#checkout-btn')) $('#checkout-btn').disabled = true;
    return;
  }
  if ($('#checkout-btn')) $('#checkout-btn').disabled = false;

  lines.forEach(({ product, quantity }) => {
    const row = element('div', '', 'cart-row');
    row.append(element('span', product.name));
    row.append(element('span', money(product.price * quantity, product.currency)));
    
    const qtyDiv = element('div', '', 'cart-qty-ctrl');
    const minus = element('button', '-');
    minus.onclick = () => { cart = changeQuantity(cart, product.id, -1); renderCart(); };
    const plus = element('button', '+');
    plus.onclick = () => { cart = changeQuantity(cart, product.id, 1); renderCart(); };
    
    qtyDiv.append(minus, element('span', ` ${quantity} `), plus);
    row.append(qtyDiv);
    container.append(row);
  });

  const subtotal = lines.reduce((sum, line) => sum + (line.product.price * line.quantity), 0);
  if ($('#cart-subtotal')) $('#cart-subtotal').textContent = money(subtotal, 'JOD');
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
