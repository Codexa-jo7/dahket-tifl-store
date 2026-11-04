import test from 'node:test';
import assert from 'node:assert/strict';
import { shippingStatus, whatsappOrder } from '../src/checkout/checkout.js';
const lines = price => [{product:{name:'كوب & رضاعة',price,currency:'JOD'},quantity:1}];
const format = n => (n/100).toFixed(2);
test('free shipping starts at exactly ten dinars',()=>{
 assert.equal(shippingStatus(lines(999)).free,false);
 assert.equal(shippingStatus(lines(999)).remaining,1);
 assert.equal(shippingStatus(lines(1000)).free,true);
 assert.equal(shippingStatus(lines(1001)).free,true);
});
test('WhatsApp destination and Arabic cart survive URL encoding',()=>{
 const order=whatsappOrder(lines(1000),format), url=new URL(order.url);
 assert.equal(url.pathname,'/962790782290');
 assert.equal(url.searchParams.get('text'),order.text);
 assert.match(order.text,/كوب & رضاعة × 1/);
 assert.match(order.text,/10.00/);
 assert.match(order.text,/التوصيل: مجاني/);
 assert.match(whatsappOrder(lines(999),format).text,/يرجى تأكيدها/);
});
test('empty carts cannot produce an order',()=>assert.throws(()=>whatsappOrder([],format)));
