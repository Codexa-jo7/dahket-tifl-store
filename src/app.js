import { categories } from './data/categories.js?v=2';
import { listProducts, getProduct } from './services/products.js?v=9';
import { changeQuantity, loadCart, saveCart } from './cart/cart.js';
import { shippingStatus, whatsappOrder } from './checkout/checkout.js?v=customer';
import { store } from './data/store.js';
const $ = s => document.querySelector(s);
const t = (ar) => ar;
const money = (value, currency) => new Intl.NumberFormat('ar-JO', {style:'currency', currency}).format(value / 100);
let cart = loadCart(), lines = [], category = "الكل";
function element(tag, text, className) { const el = document.createElement(tag); el.textContent = text; if(className) el.className = className; return el; }
async function renderProducts() {
  const products = (await listProducts($('#search').value)).filter(p => category === 'الكل' || p.category === category); const grid = $('#products-list'); grid.replaceChildren();
  if (!products.length) { grid.append(element('p', $('#search').value ? t('لا توجد منتجات تطابق بحثك', 'No products match your search.') : t('لا توجد منتجات حالياً.', 'No products available.'))); return; }
  products.forEach(p => { const card = element('article','','card'); if(p.images?.length) { const img = document.createElement('img'); img.src = p.images[0].url; img.alt = p.images[0].alt || p.name; img.loading = 'lazy'; card.append(img); }
    card.append(element('h3', p.name));
    if (p.description) card.append(element('p', p.description));
    card.append(element('strong', money(p.price, p.currency)));
    const btn = element('button', t('أضف للسلة +', 'Add to cart'));
    btn.onclick = () => { cart = changeQuantity(cart, p.id, 1); saveCart(cart); renderCart(); };
    card.append(btn);
    grid.append(card);
  });
}
async function renderCart() {
  saveCart(cart); lines=(await Promise.all(cart.map(async item=>({ ...item, product:await getProduct(item.id) })))).filter(x=>x.product);
  $('#count').textContent=lines.reduce((n,x)=>n+x.quantity,0); $('#floating-count').textContent=$('#count').textContent; const container=$('#cart-items'); container.replaceChildren();
  if(!lines.length) { container.append(element('p',t('سلتك لسه فاضية. اكتشف المنتجات وأضف اختياراتك.','Your bag is empty. Discover something in our store.'))); $('#checkout-btn').disabled = true; return; }
  lines.forEach(({product,quantity})=>{ const row=element('div','','cart-row'); row.append(element('span',product.name)); const price = element('span',money(product.price*quantity,product.currency)); const qty = element('div','','cart-qty-ctrl');
    const minus = element('button','-'); minus.onclick = () => { cart = changeQuantity(cart, product.id, -1); renderCart(); };
    const plus = element('button','+'); plus.onclick = () => { cart = changeQuantity(cart, product.id, 1); renderCart(); };
    qty.append(minus, element('span',` ${quantity} `), plus); row.append(price, qty); container.append(row);
  });
  const totals={}; lines.forEach(x=>totals[x.product.currency]=(totals[x.product.currency]||0)+x.product.price*x.quantity); $('#subtotal').textContent=money(totals.JOD||0,'JOD');
}
$('#search').oninput=renderProducts; $('#cart-button').onclick=()=>$('#cart').showModal(); $('#close-cart').onclick=()=>$('#cart').close();
$('#instagram-link').href=store.instagramUrl;
$('#checkout').onsubmit=e=>{e.preventDefault();try {const order = whatsappOrder(lines,money,{name:$('#customer-name').value,phone:$('#customer-phone').value,address:$('#customer-address').value});window.open(order.url,'_blank');} catch(err){alert(err.message);}};

for(const label of ['الكل', ...categories]) {const button=element('button',label);button.setAttribute('aria-pressed',String(label===category));button.onclick=()=>{category=label;document.querySelectorAll('#filters button').forEach(b=>b.setAttribute('aria-pressed','false'));button.setAttribute('aria-pressed','true');renderProducts();};$('#filters').append(button);}

$('#floating-cart').onclick=()=>$('#cart').showModal();
renderProducts(); renderCart();
