import { store } from '../data/store.js';
export function orderSummary(lines, format) {
  if (!lines.length) throw new Error('أضف منتجات إلى السلة أولاً.');
  return lines.map(({product, quantity}) => `${product.name} × ${quantity} — ${format(product.price * quantity, product.currency)}`).join('\n');
}
export function shippingStatus(lines) {
  const subtotal = lines.reduce((total, {product, quantity}) => total + product.price * quantity, 0);
  return { subtotal, free: subtotal >= store.freeShippingThreshold, remaining: Math.max(0, store.freeShippingThreshold - subtotal) };
}
export function whatsappOrder(lines, format, customer = {}) {
  const summary = orderSummary(lines, format);
  const name = String(customer.name || '').trim();
  const address = String(customer.address || '').trim();
  const phone = String(customer.phone || '').trim().replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit));
  if (!name || !address || !phone) throw new Error('يرجى تعبئة الاسم والعنوان ورقم التواصل.');
  if (!/^[+\d\s()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) throw new Error('يرجى إدخال رقم تواصل صحيح.');
  const {subtotal, free} = shippingStatus(lines);
  const text = `مرحباً ضحكة طفل، أرغب بطلب المنتجات التالية:\n\n${summary}\n\nمجموع المنتجات: ${format(subtotal, store.currency)}\n${free ? 'التوصيل: مجاني' : 'رسوم التوصيل: يرجى تأكيدها قبل اعتماد الطلب'}\n\nالاسم: ${name}\nرقم التواصل: ${phone}\nالمدينة والعنوان: ${address}\n\nيرجى تأكيد توفر المنتجات والطلب.`;
  return { text, url: `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(text)}` };
}
