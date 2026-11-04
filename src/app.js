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
 if (!products.length) { grid.append(element('p', $('#search').value ? t('لا توجد منتجات تطابق بحثك.','No products match your search.') : 'نجهّز مجموعتنا الأولى. صور المنتجات وتفاصيلها ستظهر هنا قريباً.', 'empty')); return; }
 products.forEach(p => { const card = element('article','','card'); if(p.images?.length) { const img = document.createElement('img'); img.src=p.images[0].url; img.loading='lazy'; img.tabIndex=0; const openImage=()=>{const full=$('#image-view img');full.src=img.src;full.alt=img.alt;$('#image-view').showModal();}; img.onclick=openImage;img.onkeydown=e=>{if(e.key==='Enter')openImage();}; img.alt=p.images[0].alt || p.name; card.append(img); } card.append(element('h3',p.name),element('p',t(p.description,'See the original product image for details.')),element('strong',money(p.price,p.currency))); const add=element('button',p.available?t('أضف للسلة +','Add to bag +'):t('غير متوفر','Unavailable'),'primary'); add.disabled=!p.available; add.onclick=()=> { cart=changeQuantity(cart,p.id,(cart.find(x=>x.id===p.id)?.quantity||0)+1); renderCart(); $('#toast').textContent=t('تمت الإضافة إلى السلة ♡','Added to your bag ♡'); $('#toast').classList.add('visible'); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2200); }; card.append(add); grid.append(card); });
}
async function renderCart() {
 saveCart(cart); lines=(await Promise.all(cart.map(async item=>({ ...item, product:await getProduct(item.id) })))).filter(x=>x.product?.available);
 $('#count').textContent=lines.reduce((n,x)=>n+x.quantity,0); $('#floating-count').textContent=$('#count').textContent; const container=$('#cart-items'); container.replaceChildren();
 if(!lines.length) container.append(element('p',t('سلتك لسه فاضية. اكتشف المنتجات وأضف اختياراتك.','Your bag is empty. Discover something for your little one.'),'empty'));
 lines.forEach(({product,quantity})=>{ const row=element('div','','cart-row'); row.append(element('span',product.name)); const input=document.createElement('input'); input.type='number'; input.min=1; input.max=99; input.value=quantity; input.setAttribute('aria-label',`كمية ${product.name}`); input.onchange=()=>{cart=changeQuantity(cart,product.id,Number(input.value));renderCart();}; const remove=element('button',t('إزالة','Remove')); remove.onclick=()=>{cart=changeQuantity(cart,product.id,0);renderCart();}; row.append(input,remove);container.append(row); });
 const totals={}; lines.forEach(x=>totals[x.product.currency]=(totals[x.product.currency]||0)+x.product.price*x.quantity); $('#total').textContent=Object.entries(totals).map(([currency,total])=>t('مجموع المنتجات: ','Subtotal: ')+money(total,currency)).join('، '); $('#summary').hidden=true; $('#checkout-message').textContent=''; const shipping = shippingStatus(lines); $('#shipping-status').textContent = shipping.free ? t('مبروك! طلبك مؤهل للتوصيل المجاني ♡','Your order qualifies for free delivery ♡') : t(`باقي ${money(shipping.remaining, store.currency)} لتحصل على توصيل مجاني`, `Add ${money(shipping.remaining, store.currency)} for free delivery`);
}
$('#search').oninput=renderProducts; $('#cart-button').onclick=()=>$('#cart').showModal(); $('#close-cart').onclick=()=>$('#cart').close();
$('#instagram-link').href=store.instagramUrl;
$('#checkout').onsubmit=e=>{e.preventDefault();try {const order=whatsappOrder(lines,money,{name:$('#customer-name').value,phone:$('#customer-phone').value,address:$('#customer-address').value});$('#summary').value=order.text;$('#summary').hidden=false;window.open(order.url,'_blank','noopener,noreferrer');$('#checkout-message').textContent='تم تجهيز المنتجات وبياناتك في الرسالة. اضغط إرسال في واتساب لتأكيد الطلب مع المتجر.';}catch(error){$('#checkout-message').textContent=error.message;}};

for(const label of ['الكل', ...categories]) {const button=element('button',label);button.setAttribute('aria-pressed',String(label===category));button.onclick=()=>{category=label;for(const b of $('#filters').children)b.setAttribute('aria-pressed',String(b===button));renderProducts();};$('#filters').append(button);} $('#close-image').onclick=()=>$('#image-view').close(); renderProducts();renderCart();

$('#floating-cart').onclick=()=>$('#cart').showModal();

