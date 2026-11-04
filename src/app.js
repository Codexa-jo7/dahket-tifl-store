import { listProducts, getProduct } from './services/products.js';
import { changeQuantity, loadCart, saveCart } from './cart/cart.js';
import { shippingStatus, whatsappOrder } from './checkout/checkout.js';
import { store } from './data/store.js';
const $ = s => document.querySelector(s);
const money = (value, currency) => new Intl.NumberFormat('ar-JO', {style:'currency', currency}).format(value / 100);
let cart = loadCart(), lines = [], category = "الكل";
function element(tag, text, className) { const el = document.createElement(tag); el.textContent = text; if(className) el.className = className; return el; }
async function renderProducts() {
 const products = (await listProducts($('#search').value)).filter(p => category === 'الكل' || p.category === category); $('#results-count').textContent = `${products.length} منتج`; const grid = $('#products-list'); grid.replaceChildren();
 if (!products.length) { grid.append(element('p', $('#search').value ? 'لا توجد منتجات تطابق بحثك.' : 'نجهّز مجموعتنا الأولى. صور المنتجات وتفاصيلها ستظهر هنا قريباً.', 'empty')); return; }
 products.forEach(p => { const card = element('article','','card'); if(p.images?.length) { const img = document.createElement('img'); img.src=p.images[0].url; img.loading='lazy'; img.tabIndex=0; const openImage=()=>{const full=$('#image-view img');full.src=img.src;full.alt=img.alt;$('#image-view').showModal();}; img.onclick=openImage;img.onkeydown=e=>{if(e.key==='Enter')openImage();}; img.alt=p.images[0].alt || p.name; card.append(img); } card.append(element('h3',p.name),element('p',p.description),element('strong',money(p.price,p.currency))); const add=element('button',p.available?'أضف للسلة':'غير متوفر','primary'); add.disabled=!p.available; add.onclick=()=> { cart=changeQuantity(cart,p.id,(cart.find(x=>x.id===p.id)?.quantity||0)+1); renderCart(); }; card.append(add); grid.append(card); });
}
async function renderCart() {
 saveCart(cart); lines=(await Promise.all(cart.map(async item=>({ ...item, product:await getProduct(item.id) })))).filter(x=>x.product?.available);
 $('#count').textContent=lines.reduce((n,x)=>n+x.quantity,0); const container=$('#cart-items'); container.replaceChildren();
 if(!lines.length) container.append(element('p','سلتك لسه فاضية. اكتشف المنتجات وأضف اختياراتك.','empty'));
 lines.forEach(({product,quantity})=>{ const row=element('div','','cart-row'); row.append(element('span',product.name)); const input=document.createElement('input'); input.type='number'; input.min=1; input.max=99; input.value=quantity; input.setAttribute('aria-label',`كمية ${product.name}`); input.onchange=()=>{cart=changeQuantity(cart,product.id,Number(input.value));renderCart();}; const remove=element('button','إزالة'); remove.onclick=()=>{cart=changeQuantity(cart,product.id,0);renderCart();}; row.append(input,remove);container.append(row); });
 const totals={}; lines.forEach(x=>totals[x.product.currency]=(totals[x.product.currency]||0)+x.product.price*x.quantity); $('#total').textContent=Object.entries(totals).map(([currency,total])=>'مجموع المنتجات: '+money(total,currency)).join('، '); $('#summary').hidden=true; $('#checkout-message').textContent=''; const shipping = shippingStatus(lines); $('#shipping-status').textContent = shipping.free ? 'مبروك! طلبك مؤهل للتوصيل المجاني ♡' : `باقي ${money(shipping.remaining, store.currency)} لتحصل على توصيل مجاني`;
}
$('#search').oninput=renderProducts; $('#cart-button').onclick=()=>$('#cart').showModal(); $('#close-cart').onclick=()=>$('#cart').close();
$('#instagram-link').href=store.instagramUrl;
$('#checkout').onsubmit=e=>{e.preventDefault();try {const order=whatsappOrder(lines,money);$('#summary').value=order.text;$('#summary').hidden=false;window.open(order.url,'_blank','noopener,noreferrer');$('#checkout-message').textContent='أكمل اسمك وعنوانك في واتساب واضغط إرسال لتأكيد طلبك مع المتجر.';}catch(error){$('#checkout-message').textContent=error.message;}};

for(const label of ['الكل','الرضاعة والتغذية','العناية بالطفل','العناية بالأم']) {const button=element('button',label);button.setAttribute('aria-pressed',String(label===category));button.onclick=()=>{category=label;for(const b of $('#filters').children)b.setAttribute('aria-pressed',String(b===button));renderProducts();};$('#filters').append(button);} $('#close-image').onclick=()=>$('#image-view').close(); renderProducts();renderCart();
