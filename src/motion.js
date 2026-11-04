const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function revealCards(container) {
 if (reduced()) return;
 const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.animate([{opacity:0,transform:'translateY(45px) scale(.94)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});
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
 const animation=ghost.animate([{transform:'translate(0,0) scale(1)',opacity:.9},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(.12)`,opacity:0}],{duration:750,easing:'cubic-bezier(.4,0,.2,1)'});
 animation.onfinish=()=>{ghost.remove();target.animate([{transform:'scale(1)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:350});};
}
