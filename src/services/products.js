import { products } from '../data/products.js?v=8';
// Replace this adapter with API calls when a database is introduced.
export async function listProducts(query = '') {
  return structuredClone(products.filter(p => p.name.includes(query.trim())));
}
export async function getProduct(id) {
  return structuredClone(products.find(p => p.id === id) ?? null);
}
