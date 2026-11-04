import { listProducts, getProduct } from './services/products.js';
import { changeQuantity, loadCart, saveCart } from './cart/cart.js';
import { shippingStatus, whatsappOrder } from './checkout/checkout.js';
import { store } from './data/store.js';
const $ = s => document.querySelector(s);
let language = 'ar';
const t = (ar,en) => language === 'ar' ? ar : en;
const money = (value, currency) => new Intl.NumberFormat(language === 'ar' ? 'ar-JO' : 'en-JO', {style:'currency', currency}).format(value / 100);
let cart = loadCart(), lines = [], category = "الكل";
function element(tag, text, className) { const el = document.createElement(tag); el.textContent = text; if(className) el.className = className; return el; }
async function renderProducts() {
 const products = (await listProducts($('#search').value)).filter(p => category === 'الكل' || p.category === category); $('#results-count').textContent = `${products.length} ${t('منتج','products')}`; const grid = $('#products-list'); grid.replaceChildren();
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
$('#checkout').onsubmit=e=>{e.preventDefault();try {const order=whatsappOrder(lines,money);$('#summary').value=order.text;$('#summary').hidden=false;window.open(order.url,'_blank','noopener,noreferrer');$('#checkout-message').textContent='أكمل اسمك وعنوانك في واتساب واضغط إرسال لتأكيد طلبك مع المتجر.';}catch(error){$('#checkout-message').textContent=error.message;}};

for(const label of ['الكل','الرضاعة والتغذية','العناية بالطفل','العناية بالأم']) {const button=element('button',label);button.setAttribute('aria-pressed',String(label===category));button.onclick=()=>{category=label;for(const b of $('#filters').children)b.setAttribute('aria-pressed',String(b===button));renderProducts();};$('#filters').append(button);} $('#close-image').onclick=()=>$('#image-view').close(); renderProducts();renderCart();

$('#floating-cart').onclick=()=>$('#cart').showModal();
const translations = [
 ['.announcement','فرحتكم علينا ♡ توصيل مجاني لطلبات بقيمة 10 دنانير أو أكثر','A little extra joy ♡ Free delivery on orders of 10 JOD or more'],
 ['nav a[href="#products"]','منتجاتنا','Shop'],['nav a[href="#about"]','عن المتجر','Our story'],
 ['.hero .eyebrow','لأجمل ضحكة في البيت','FOR YOUR LITTLE ONE'],
 ['.hero h1','عالم صغير،<br><em>مليان ضحكات.</em>','Little moments.<br><em>Big, happy smiles.</em>'],
 ['.hero > div > p:not(.eyebrow)','أهلاً بكم في ضحكة طفل، مساحة للصغار وللحظات الحلوة التي تجمعنا بهم.','Everyday essentials for little ones and the lovely moments you share. Welcome to Baby Smile.'],
 ['.hero .primary','اكتشفوا منتجاتنا ←','Explore the collection →'],
 ['#products .eyebrow','اختيارات للصغار','THE LITTLE ESSENTIALS'],['#products h2','منتجاتنا','Shop the collection'],
 ['#about h2','لأن فرحتهم تعني لنا الكثير.','Their happiness means everything.'],
 ['#about p:last-child','متجر للصغار، بتجربة بسيطة تساعدكم على اكتشاف المنتجات وجمع اختياراتكم في مكان واحد.','Discover essentials for your little ones, save your favourites in your bag, and order directly with us on WhatsApp.'],
 ['#cart h2','سلة المشتريات','Your shopping bag'],['#checkout h3','ملخص طلبك','Your order'],
 ['#checkout > p:first-of-type','نجهّز طلبك برسالة واتساب. أضف اسمك وعنوانك وأرسل الرسالة للمتجر لإتمام الطلب.','Continue to WhatsApp, add your name and address, and send your order to the store.'],
 ['#checkout button','متابعة الطلب عبر واتساب','Continue on WhatsApp'],
 ['#floating-label','سلة المشتريات','Shopping bag'],['footer > p','لحظات صغيرة، فرحة كبيرة.','Little moments. Big smiles.'],
 ['#instagram-link','تابعونا على إنستجرام @babysmile.jo ↗','Follow @babysmile.jo on Instagram ↗']
];
const englishCategories=['All products','Feeding essentials','Baby care','For mum'];
function setLanguage(next) {
 language=next; document.documentElement.lang=next;document.documentElement.dir=next==='ar'?'rtl':'ltr';
 for(const [selector,ar,en] of translations) $(selector).innerHTML=t(ar,en);
 $('#language').textContent=t('English','العربية');$('#search').placeholder=t('ابحث عن منتج…','Search products…');$('#search').setAttribute('aria-label',t('ابحث عن منتج','Search products'));
 $('#cart-button').firstChild.textContent=t('السلة ','Bag ');$('#floating-cart').setAttribute('aria-label',t('فتح السلة','Open shopping bag'));
 [...$('#filters').children].forEach((b,i)=>b.textContent=t(['الكل','الرضاعة والتغذية','العناية بالطفل','العناية بالأم'][i],englishCategories[i]));
 renderProducts();renderCart(); try{localStorage.setItem('baby-smile-language',next);}catch{}
}
$('#language').onclick=()=>setLanguage(language==='ar'?'en':'ar');
try{setLanguage(localStorage.getItem('baby-smile-language')==='en'?'en':'ar');}catch{setLanguage('ar');}
