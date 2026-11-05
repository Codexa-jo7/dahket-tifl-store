import {SUPABASE_URL,SUPABASE_KEY} from './services/products.js?v=repair1';
import {categories} from './data/categories.js';
const $=s=>document.querySelector(s), client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let rows=[];
const status=text=>$('#adminStatus').textContent=text;
const cell=text=>{const td=document.createElement('td');td.textContent=text;return td;};
for(const label of [...categories,'منتجات أخرى']){const option=document.createElement('option');option.value=option.textContent=label;$('#category').append(option);}
function reset(){ $('#productForm').reset();$('#editProductId').value='';$('#imageFile').required=true;$('#formTitle').textContent='إضافة منتج جديد';$('#cancelBtn').style.display='none'; }
async function refresh(){
 const {data,error}=await client.from('products').select('*').order('id');if(error)throw error;rows=data;
 $('#loading').hidden=true;$('#productsTable').style.display='table';$('#tableBody').replaceChildren();
 for(const p of rows){const tr=document.createElement('tr');const td=cell('');const img=document.createElement('img');img.src=p.image_url;img.alt=p.title;img.className='product-thumb';td.append(img);tr.append(td,cell(p.title),cell(`${p.price} د.أ`));const actions=cell('');
 const edit=document.createElement('button');edit.textContent='تعديل';edit.className='btn-edit';edit.onclick=()=>{reset();$('#editProductId').value=p.id;$('#title').value=p.title;$('#price').value=p.price;$('#description').value=p.description||'';$('#category').value=p.category||'منتجات أخرى';$('#available').checked=p.available!==false;$('#imageFile').required=false;$('#formTitle').textContent='تعديل المنتج';$('#cancelBtn').style.display='inline-block';};
 const del=document.createElement('button');del.textContent='حذف';del.className='btn-delete';del.onclick=async()=>{if(!confirm(`حذف ${p.title}؟`))return;try{const {data,error}=await client.from('products').delete().eq('id',p.id).select('id');if(error)throw error;if(!data.length)throw new Error('لم يتم الحذف. تحقق من صلاحيات المدير.');await refresh();}catch(e){status(e.message);}};actions.append(edit,del);tr.append(actions);$('#tableBody').append(tr);}
}
async function sessionView(){const {data:{session}}=await client.auth.getSession();$('#loginForm').hidden=!!session;$('#logout').hidden=!session;document.querySelectorAll('[data-management]').forEach(e=>e.hidden=!session);if(session)try{await refresh();}catch(e){status(e.message);}}
$('#loginForm').onsubmit=async e=>{e.preventDefault();status('');const {error}=await client.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error){status('تعذر تسجيل الدخول. تحقق من بياناتك.');return;}$('#password').value='';await sessionView();};
$('#logout').onclick=async()=>{await client.auth.signOut();rows=[];$('#tableBody').replaceChildren();reset();await sessionView();};
$('#cancelBtn').onclick=reset;
$('#productForm').onsubmit=async e=>{e.preventDefault();$('#submitBtn').disabled=true;try{
 const id=$('#editProductId').value,title=$('#title').value.trim(),price=Number($('#price').value);if(!title||!Number.isFinite(price)||price<0)throw new Error('تحقق من الاسم والسعر.');
 const payload={title,price,description:$('#description').value.trim(),category:$('#category').value,available:$('#available').checked};
 const file=$('#imageFile').files[0];if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('اختر صورة JPG أو PNG أو WebP أصغر من 5 ميغابايت.');const path=`${crypto.randomUUID()}.${file.type.split('/')[1]}`;const {error}=await client.storage.from('product-images').upload(path,file);if(error)throw error;payload.image_url=client.storage.from('product-images').getPublicUrl(path).data.publicUrl;}
 const query=id?client.from('products').update(payload).eq('id',id):client.from('products').insert(payload);const {data,error}=await query.select('id');if(error)throw error;if(!data.length)throw new Error('لم يتم الحفظ. تحقق من صلاحيات المدير.');reset();await refresh();status('تم الحفظ. يظهر التعديل في المتجر عند تحديث الصفحة.');
 }catch(e){status(e.message);}finally{$('#submitBtn').disabled=false;}};
sessionView();
