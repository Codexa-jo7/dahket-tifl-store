import { products as fallbackProducts } from '../data/products.js';

const SUPABASE_URL = "https://ekkfcefygmvdcwbxybth.supabase.co";
const SUPABASE_KEY = "sb_publishable_h-L8N3j5IQUg7Pnl1eL3Qw_voWpqqh7";

let cachedProducts = null;

async function getLiveProducts() {
  if (cachedProducts) return cachedProducts;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) throw new Error("Supabase error");
    const dbData = await res.json();
    
    // دمج الأسعار والتعديلات الجديدة مع تفاصيل وتصنيفات المنتجات الأصلية بدقة
    cachedProducts = fallbackProducts.map(fp => {
      const live = dbData.find(d => d.title.trim() === fp.name.trim());
      if (live) {
        return {
          ...fp,
          price: Math.round(Number(live.price) * 100), // السعر المعدل من لوحة التحكم
          description: live.description || fp.description,
          images: [{ url: live.image_url, alt: live.title }]
        };
      }
      return fp;
    });
    return cachedProducts;
  } catch (e) {
    return fallbackProducts;
  }
}

export async function listProducts(query = '') {
  const prods = await getLiveProducts();
  const q = query.trim().toLowerCase();
  if (!q) return prods;
  return prods.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
}

export async function getProduct(id) {
  const prods = await getLiveProducts();
  return prods.find(p => p.id === id);
}
