import { store } from '../data/store.js';
export function orderSummary(lines, format) {
  if (!lines.length) throw new Error('أضف منتجات إلى السلة أولاً.');
  return lines.map(({product, quantity}) => `${product.name} × ${quantity} — ${format(product.price * quantity, product.currency)}`).join('\n');
}
export function shippingStatus(lines) {
  const subtotal = lines.reduce((total, {product, quantity}) => total + product.price * quantity, 0);
  return { subtotal, free: subtotal >= store.freeShippingThreshold, remaining: Math.max(0, store.freeShippingThreshold - subtotal) };
}
export function whatsappOrder(lines, format) {
  const summary = orderSummary(lines, format);
  const {subtotal, free} = shippingStatus(lines);
  const text = `مرحباً ضحكة طفل، أرغب بطلب المنتجات التالية:\n\n${summary}\n\nمجموع المنتجات: ${format(subtotal, store.currency)}\n${free ? 'التوصيل: مجاني' : 'رسوم التوصيل: يرجى تأكيدها قبل اعتماد الطلب'}\n\nالاسم:\nرقم التواصل:\nالمدينة والعنوان:\n\nيرجى تأكيد توفر المنتجات والطلب.`;
  return { text, url: `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(text)}` };
}
