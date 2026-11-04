const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function revealCards(container) {
 if (reduced()) return;
 const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.animate([{opacity:0,transform:'translateY(16px) scale(1)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:400,easing:'cubic-bezier(.2,.8,.2,1)'});
  observer.unobserve(entry.target);
 }), {threshold:.12});
 container.querySelectorAll('.card').forEach(card=>observer.observe(card));
}
export function flyToCart(card) {
 if(reduced()) return;
 const source=card.querySelector('img'), target=document.querySelector('#floating-cart');
 const from=source.getBoundingClientRect(), to=target.getBoundingClientRect();
 const ghost=source.cloneNode();ghost.className='flying-product';
 Object.assign(ghost.style,{left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`});
 document.body.append(ghost);
 const animation=ghost.animate([{transform:'translate(0,0) scale(1)',opacity:.9},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(.12)`,opacity:0}],{duration:450,easing:'cubic-bezier(.4,0,.2,1)'});
 animation.onfinish=()=>{ghost.remove();target.animate([{transform:'scale(1)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:350});};
}

export function startHeroMotion() {
 const art=document.querySelector('.art');
 const hero=art.querySelector('.hero-product');
 const images=['0021','0050','0065','0072'];
 const controls=document.createElement('div');controls.className='motion-controls';
 const toggle=document.createElement('button');toggle.type='button';
 let paused=reduced(), index=0;
 function sync(){document.body.classList.toggle('motion-paused',paused);toggle.textContent=paused?'تشغيل الحركة ▶':'إيقاف الحركة Ⅱ';toggle.setAttribute('aria-pressed',String(paused));}
 toggle.onclick=()=>{paused=!paused;sync();};controls.append(toggle);art.append(controls);sync();
 const ring=document.createElement('div');ring.className='orbit-ring';ring.setAttribute('aria-hidden','true');art.append(ring);
 for(const [i,symbol] of ['✦','♡','✧'].entries()){const chip=document.createElement('span');chip.className=`motion-chip chip-${i}`;chip.textContent=symbol;chip.setAttribute('aria-hidden','true');art.append(chip);}
 setInterval(()=>{
  if(paused||document.hidden)return;
  index=(index+1)%images.length;
  const next=new Image();next.src=`./assets/products/IMG-20261103-WA${images[index]}.jpg`;
  next.onload=()=>{
   if(paused)return;
   const out=hero.animate([{opacity:1,transform:'translateX(0) rotate(-5deg)'},{opacity:0,transform:'translateX(-12px) rotate(-5deg) scale(1)'}],{duration:400,easing:'ease-in',fill:'forwards'});
   out.onfinish=()=>{hero.src=next.src;hero.alt='من مجموعة منتجات ضحكة طفل';out.cancel();hero.animate([{opacity:0,transform:'translateX(12px) rotate(-5deg) scale(1)'},{opacity:1,transform:'translateX(0) rotate(-5deg) scale(1)'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});};
  };
 },7000);
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{paused=e.matches;sync();});
}
