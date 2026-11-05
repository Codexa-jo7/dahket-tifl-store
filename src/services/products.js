import { products as localProducts } from '../data/products.js';
export const SUPABASE_URL = 'https://ekkfcefygmvdcwbxybth.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_h-L8N3j5IQUg7Pnl1eL3Qw_voWpqqh7';
export function normalizeProduct(row) {
 const filename = value => { try { return decodeURIComponent(new URL(value, 'https://local.invalid/').pathname.split('/').pop()); } catch { return ''; } };
 const imageMatch = localProducts.filter(p => filename(p.images[0]?.url) === filename(row.image_url) && filename(row.image_url));
 const nameMatch = localProducts.filter(p => p.name === row.title);
 const original = imageMatch.length === 1 ? imageMatch[0] : nameMatch.length === 1 ? nameMatch[0] : null;
 const price = Number(row.price);
 if (!row.id || !row.title || !Number.isFinite(price) || price < 0) throw new Error('بيانات أحد المنتجات غير صحيحة.');
 return { id:`db:${row.id}`, name:row.title, price:Math.round(price*100), currency:'JOD', description:row.description ?? '', category:row.category || original?.category || 'منتجات أخرى', available:row.available !== false, images:row.image_url ? [{url:row.image_url,alt:row.title}] : [], attributes:{}, variants:[] };
}
let pending;
export async function catalog() {
 if (!pending) pending = fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id.asc`,{headers:{apikey:SUPABASE_KEY},cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async response=>{
  if(!response.ok) throw new Error('تعذر تحميل المنتجات. يرجى المحاولة مجدداً.');
  const rows=await response.json();if(!Array.isArray(rows))throw new Error('استجابة المنتجات غير صحيحة.');return rows.map(normalizeProduct);
 }).catch(error=>{pending=null;throw error;});
 return structuredClone(await pending);
}
export async function listProducts(query='') { const q=query.trim().toLowerCase();return (await catalog()).filter(p=>`${p.name} ${p.description}`.toLowerCase().includes(q)); }
export async function getProduct(id) {return (await catalog()).find(p=>p.id===id) ?? null;}
