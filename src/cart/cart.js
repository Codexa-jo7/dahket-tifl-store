export function changeQuantity(cart, id, quantity) {
  const next = cart.filter(item => item.id !== id);
  if (Number.isSafeInteger(quantity) && quantity > 0) next.push({ id, quantity: Math.min(quantity, 99) });
  return next;
}
export function loadCart() {
  try { const data = JSON.parse(localStorage.getItem('store-cart') || '[]'); return Array.isArray(data) ? data.filter(x => typeof x.id === 'string' && Number.isSafeInteger(x.quantity) && x.quantity > 0 && x.quantity <= 99) : []; } catch { return []; }
}
export function saveCart(cart) { try { localStorage.setItem('store-cart', JSON.stringify(cart)); } catch {} }
