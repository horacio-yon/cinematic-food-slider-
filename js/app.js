'use strict';

// One continuous position drives the plates, the thumbnail rail and the atmosphere.
// Only settle() commits dish data; dragging never changes the confirmed dish.
const dishes = [
  {
    "id": "ceviche",
    "first": "Ceviche",
    "second": "Clásico",
    "short": "Ceviche clásico",
    "category": "Frescura del Pacífico",
    "tagline": "El mar peruano, en cada bocado.",
    "description": "Pescado fresco en leche de tigre, cebolla roja y ají limo. Camote, choclo y cancha completan un clásico de nuestra costa.",
    "rating": 4.9,
    "chef": "Chef Lucía",
    "role": "Inspiración en la costa peruana",
    "accent": "#d5c9a9",
    "strong": "#84744d",
    "time": "20 min",
    "diet": "Pescado fresco",
    "price": 38,
    "ingredients": [
      "Pescado blanco y leche de tigre",
      "Cebolla roja, culantro y ají limo",
      "Camote y choclo peruano",
      "Cancha serrana tostada"
    ],
    "allergens": "Contiene pescado. Preparado en una cocina que manipula alérgenos.",
    "pairing": "Chicha morada",
    "pairingNote": "Maíz morado, piña y canela, con un toque de limón: el contraste fresco para nuestro ceviche.",
    "image": "assets/images/ceviche.png",
    "thumbnail": "assets/images/ceviche.png"
  },
  {
    "id": "lomo-saltado",
    "first": "Lomo",
    "second": "Saltado",
    "short": "Lomo saltado",
    "category": "Tradición al fuego",
    "tagline": "Fuego intenso. Sabor bien peruano.",
    "description": "Lomo de res salteado al wok con cebolla roja, tomate y sillao. Servido con papas doradas y arroz blanco, como manda la tradición.",
    "rating": 4.8,
    "chef": "Chef Mateo",
    "role": "Herencia criolla y técnica al wok",
    "accent": "#dfb694",
    "strong": "#a15e39",
    "time": "30 min",
    "diet": "Cocina criolla",
    "price": 42,
    "ingredients": [
      "Lomo de res salteado al wok",
      "Cebolla roja y tomate",
      "Papas fritas y arroz blanco",
      "Sillao, vinagre y perejil"
    ],
    "allergens": "Contiene soya y trigo por el sillao.",
    "pairing": "Maracuyá refrescante",
    "pairingNote": "Una refrescante bebida de maracuyá para acompañar el sabor ahumado del wok y las papas doradas.",
    "image": "assets/images/lomo-saltado.png",
    "thumbnail": "assets/images/lomo-saltado.png"
  },
  {
    "id": "aji-gallina",
    "first": "Ají de",
    "second": "Gallina",
    "short": "Ají de gallina",
    "category": "Un clásico de casa",
    "tagline": "La calidez de nuestra mesa.",
    "description": "Pollo deshilachado en una crema de ají amarillo, pan y leche, sobre papas sancochadas. Con arroz, huevo y aceituna de botija.",
    "rating": 4.7,
    "chef": "Chef Valeria",
    "role": "Recetas que saben a hogar",
    "accent": "#e3d293",
    "strong": "#968036",
    "time": "25 min",
    "diet": "Cremoso y casero",
    "price": 32,
    "ingredients": [
      "Pollo deshilachado",
      "Ají amarillo, pan y leche",
      "Papas sancochadas y arroz blanco",
      "Huevo y aceitunas de botija"
    ],
    "allergens": "Contiene trigo, leche y huevo.",
    "pairing": "Limonada de hierbaluisa",
    "pairingNote": "Limón y hierbaluisa en una bebida ligera que acompaña la cremosidad y el delicado picor del ají amarillo.",
    "image": "assets/images/aji-gallina.png",
    "thumbnail": "assets/images/aji-gallina.png"
  },
  {
    "id": "causa-limena",
    "first": "Causa",
    "second": "Limeña",
    "short": "Causa limeña",
    "category": "Frescura limeña",
    "tagline": "Capas de historia y sabor.",
    "description": "Papa amarilla con limón y ají amarillo, rellena de pollo cremoso y palta. Una entrada fresca con el sello inconfundible de Lima.",
    "rating": 4.8,
    "chef": "Chef Diego",
    "role": "Una mirada fresca a la cocina limeña",
    "accent": "#bdcba5",
    "strong": "#627d43",
    "time": "25 min",
    "diet": "Entrada fría",
    "price": 28,
    "ingredients": [
      "Papa amarilla, limón y ají amarillo",
      "Pollo deshilachado y mayonesa",
      "Palta fresca",
      "Huevo de codorniz y aceituna de botija"
    ],
    "allergens": "Contiene huevo.",
    "pairing": "Emoliente frío",
    "pairingNote": "Una versión fría de nuestro emoliente, con cebada, linaza y limón, para acompañar la frescura de la causa.",
    "image": "assets/images/causa-limena.png",
    "thumbnail": "assets/images/causa-limena.png"
  }
];
const $ = id => document.getElementById(id);
const mod = n => ((n % dishes.length) + dishes.length) % dishes.length;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const normalizeSearch = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { position:4, confirmed:0, committedPosition:4, target:4, frame:0, ratingFrame:0, pointer:null, suppressedClick:false, size:400, step:140, viewport:560 };
let saved = new Set();
try {
  const stored = JSON.parse(localStorage.getItem('table-saved') || '[]');
  // Remove stale favorites when dishes are removed from the menu.
  saved = new Set(Array.isArray(stored) ? stored.filter(id => dishes.some(dish => dish.id === id)) : []);
  localStorage.setItem('table-saved', JSON.stringify([...saved]));
} catch (_) { /* Storage is optional for local-file browsers. */ }
const plates = dishes.map(dish => {
  const image = new Image(); image.src=dish.image; image.alt=`${dish.first} ${dish.second}, visto desde arriba`; image.className='plate'; image.draggable=false; $('food-stage').append(image); return image;
});
const options = [];
// Three copies allow a continuous cyclic rail without a visible reset.
for(let position=0;position<12;position++) {
  const dish=dishes[mod(position)];
  const button=document.createElement('button'); button.className='dish-option'; button.dataset.position=position; button.tabIndex=-1;
  button.setAttribute('aria-label',`${dish.first} ${dish.second}`);
  button.innerHTML=`<img src="${dish.thumbnail}" alt="" draggable="false"><span class="option-title">${dish.short}</span><span class="option-subtitle">${dish.category}</span><span class="option-dot"></span>`;
  button.addEventListener('click',()=>{if(!state.suppressedClick) select(position);});
  $('selector-track').append(button); options.push(button);
}
function measure() {
  state.size=$('food-stage').getBoundingClientRect().width;
  state.viewport=$('selector').clientWidth;
  state.step=(state.viewport-10)/4;
  render();
}
function mixColor(a,b,t) {
  const parts = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const c=parts(a), d=parts(b);
  return `rgb(${c.map((v,i)=>Math.round(v+(d[i]-v)*t)).join(',')})`;
}
function render() {
  const p=state.position, s=state.size;
  plates.forEach((plate,index)=>{
    let d=mod(index-mod(p)+2)-2;
    const distance=Math.abs(d);
    if(distance>1.45){plate.style.visibility='hidden';return;}
    plate.style.visibility='visible';
    // The next dish descends along a quadratic arc; the old dish exits left.
    const x=d>=0 ? s*.9*d : s*1.55*d;
    const y=d>=0 ? -s*1.5*d*d : -s*.26*Math.sin(Math.min(1,distance)*Math.PI/2);
    const rotation=d>=0 ? -14*d : 12*d;
    const scale=1-.09*Math.min(distance,1.5);
    plate.style.transform=`translate3d(${x}px,${y}px,0) rotate(${rotation}deg) scale(${scale})`;
    plate.style.opacity=clamp((1.4-distance)*2.5,0,1);
    plate.style.zIndex=d>=0 ? 2 : 1;
    plate.setAttribute('aria-hidden',index!==state.confirmed);
  });
  $('selector-track').style.transform=`translate3d(${state.viewport/2-state.step/2-5-p*state.step}px,0,0)`;
  options.forEach((button,i)=>{
    const weight=clamp(1-Math.abs(i-p),0,1);
    button.style.setProperty('--selection',weight.toFixed(4));
    button.setAttribute('aria-pressed',String(mod(i)===state.confirmed));
    button.setAttribute('aria-hidden',String(Math.abs(i-p)>2.1));
  });
  const base=Math.floor(p), fraction=p-base;
  const a=dishes[mod(base)],b=dishes[mod(base+1)];
  document.documentElement.style.setProperty('--accent',mixColor(a.accent,b.accent,fraction));
  document.documentElement.style.setProperty('--accent-strong',mixColor(a.strong,b.strong,fraction));
  document.querySelector('.orbit').style.transform=`translate3d(${Math.sin(p*.5)*24}px,${Math.cos(p*.5)*14}px,0) rotate(${p*3}deg)`;
  const visibility=clamp(1-Math.abs(p-state.committedPosition)*2.8,0,1);
  $('dish-title').style.opacity=visibility;
  $('dish-title').style.transform=`translateY(${-10*(1-visibility)}px)`;
  $('dish-tagline').style.opacity=visibility;
  $('panel-content').style.opacity=.25+.75*visibility;
  $('progress-fill').style.transform=`translateX(${mod(p)*100}%)`;
}
function stopMotion(){cancelAnimationFrame(state.frame);state.frame=0;}
function select(target) {
  stopMotion();
  state.target=target;
  const start=state.position, delta=target-start;
  if(Math.abs(delta)<.0001){settle(target);return;}
  const duration=reducedMotion.matches?0:Math.min(1150,650+Math.abs(delta)*120);
  const began=performance.now();
  // A single replaceable RAF owns snapping; retargeting starts at the current pose.
  function tick(now){
    const t=duration?clamp((now-began)/duration,0,1):1;
    const ease=1-Math.pow(1-t,3);
    state.position=start+delta*ease;render();
    if(t<1)state.frame=requestAnimationFrame(tick);else settle(target);
  }
  state.frame=requestAnimationFrame(tick);
}
function settle(position){
  state.frame=0;
  const index=mod(Math.round(position));
  const changed=index!==state.confirmed;
  state.position=index+4;state.target=state.position;state.committedPosition=state.position;state.confirmed=index;
  if(changed)updateContent(true);
  render();
}
function updateFavorite(){
  const active=saved.has(dishes[state.confirmed].id);
  $('favorite-button').setAttribute('aria-pressed',String(active));
  $('favorite-button').querySelector('span').textContent=active?'Guardado en favoritos':'Guardar favorito';
}
function updateContent(animate=false){
  const d=dishes[state.confirmed], number=String(state.confirmed+1).padStart(2,'0');
  const fields={'title-first':d.first,'title-second':d.second,'dish-number':number,'chef':d.chef,'chef-role':d.role,'description':d.description,'dish-tagline':d.tagline,'prep-time':d.time,'diet':d.diet,'allergen-note':d.allergens,'panel-index':`${number} / 04`,'chapter-current':number};
  Object.entries(fields).forEach(([id,value])=>{$(id).textContent=value;});
  $('ingredient-list').replaceChildren(...d.ingredients.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  updateFavorite();
  cancelAnimationFrame(state.ratingFrame);
  const from=Number($('rating').textContent), began=performance.now();
  function rating(now){const t=reducedMotion.matches?1:clamp((now-began)/450,0,1);$('rating').textContent=(from+(d.rating-from)*t).toFixed(1);if(t<1)state.ratingFrame=requestAnimationFrame(rating);}
  if(animate){
    for(const node of [document.querySelector('.hero-copy'),document.querySelector('.info-panel')]){
      node.classList.remove('revealing');void node.offsetWidth;node.classList.add('revealing');
    }
    state.ratingFrame=requestAnimationFrame(rating);
    $('announcement').textContent=`${d.first} ${d.second}. ${d.rating} de 5. ${d.chef}.`;
  }else $('rating').textContent=d.rating.toFixed(1);
}
const selector=$('selector');
selector.addEventListener('pointerdown',event=>{
  if(!event.isPrimary || (event.pointerType==='mouse' && event.button!==0))return;
  stopMotion();
  state.pointer={id:event.pointerId,x:event.clientX,y:event.clientY,start:state.position,moved:false,vertical:false};
  state.suppressedClick=false;
  document.querySelector('.hero-copy').classList.remove('revealing');
});
selector.addEventListener('pointermove',event=>{
  const drag=state.pointer;if(!drag||drag.id!==event.pointerId||drag.vertical)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved && Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>5){drag.vertical=true;return;}
  if(dx!==0 && !drag.moved){drag.moved=true;selector.setPointerCapture(event.pointerId);selector.classList.add('dragging');}
  if(drag.moved){
    state.suppressedClick=true;
    state.position=clamp(drag.start-dx/state.step,2,9);
    render();
  }
});
function release(event,cancelled=false){
  const drag=state.pointer;if(!drag||drag.id!==event.pointerId)return;
  state.pointer=null;selector.classList.remove('dragging');
  if(selector.hasPointerCapture(event.pointerId))selector.releasePointerCapture(event.pointerId);
  if(cancelled)select(state.committedPosition);
  else if(drag.moved||drag.vertical)select(Math.round(state.position));
  else if(Math.abs(state.position-Math.round(state.position))>.001)select(Math.round(state.position));
  // The click generated by pointerup must not turn a drag into a second selection.
  if(state.suppressedClick)requestAnimationFrame(()=>{state.suppressedClick=false;});
}
selector.addEventListener('pointerup',e=>release(e));
selector.addEventListener('pointercancel',e=>release(e,true));
selector.addEventListener('lostpointercapture',e=>{if(state.pointer)release(e,true);});
window.addEventListener('blur',()=>{if(state.pointer){const id=state.pointer.id;release({pointerId:id},true);}});
function navigate(direction){select(clamp(Math.round(state.target)+direction,2,9));}
$('previous').addEventListener('click',()=>navigate(-1));$('next').addEventListener('click',()=>navigate(1));
selector.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key))return;
  event.preventDefault();
  if(event.key==='ArrowLeft')navigate(-1);
  if(event.key==='ArrowRight')navigate(1);
  if(event.key==='Home')select(4);
  if(event.key==='End')select(7);
  if(event.key==='Escape'){state.pointer=null;selector.classList.remove('dragging');select(state.committedPosition);}
});
function setTab(id){
  ['overview','ingredients'].forEach(name=>{const active=name===id;$(name).hidden=!active;$(`${name}-tab`).setAttribute('aria-selected',active);$(`${name}-tab`).tabIndex=active?0:-1;});
}
['overview','ingredients'].forEach(name=>{
  $(`${name}-tab`).addEventListener('click',()=>setTab(name));
  $(`${name}-tab`).addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=name==='overview'?'ingredients':'overview';setTab(next);$(`${next}-tab`).focus();}});
});
$('favorite-button').addEventListener('click',()=>{const id=dishes[state.confirmed].id;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('table-saved',JSON.stringify([...saved]));}catch(_){}updateFavorite();});
const modal=$('modal');
function openModal(label,html){
  $('modal-label').textContent=`TABLE / ${label}`;$('modal-body').innerHTML=html;
  modal.setAttribute('aria-label',label);if(!modal.open)modal.showModal();
}
function closeModal(){modal.close();}
$('modal-close').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
modal.addEventListener('close',()=>{const video=modal.querySelector('video');if(video)video.pause();});
function showCollection(search=false,onlySaved=false){
  openModal(onlySaved?'TUS FAVORITOS':'LA CARTA PERUANA',`${search?'<label class="sr-only" for="dish-search">Buscar platos o ingredientes</label><input class="collection-search" id="dish-search" type="search" placeholder="¿Qué se te antoja?" autocomplete="off">':'<h2>Un sabor para cada antojo.</h2>'}<div class="collection-list" id="collection-list"></div>`);
  function filter(query=''){
    const matches=dishes.filter(d=>(!onlySaved||saved.has(d.id))&&normalizeSearch(`${d.first} ${d.second} ${d.ingredients.join(' ')}`).includes(normalizeSearch(query)));
    $('collection-list').innerHTML=matches.length?matches.map(d=>`<button class="collection-card" data-id="${d.id}"><img src="${d.thumbnail}" alt=""><span><strong>${d.first} ${d.second}</strong><small>${d.category} · S/ ${d.price}</small></span></button>`).join(''):`<p>${onlySaved?'Guarda un plato con el botón del corazón para empezar tu colección.':'No encontramos platos. Prueba ceviche, lomo, papa o ají.'}</p>`;
    $('collection-list').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{const index=dishes.findIndex(d=>d.id===button.dataset.id);closeModal();select(state.position+mod(index-mod(state.position)+2)-2);}));
  }
  filter();if(search){$('dish-search').addEventListener('input',e=>filter(e.target.value));$('dish-search').focus();}
}
$('search-button').addEventListener('click',()=>showCollection(true));$('menu-button').addEventListener('click',()=>showCollection());$('food-button').addEventListener('click',()=>showCollection());$('saved-button').addEventListener('click',()=>showCollection(false,true));
$('pairing-button').addEventListener('click',()=>{const d=dishes[state.confirmed];openModal('PARA ACOMPAÑAR',`<h2>${d.pairing}</h2><p>${d.pairingNote}</p><p>Nuestra bebida sin alcohol para acompañar ${d.first} ${d.second}.</p>`);});
$('about-button').addEventListener('click',()=>openModal('UNA EXPERIENCIA CON SABOR','<h2>Hecho con cariño.<br>Disfrútalo sin prisa.</h2><p>Una experiencia gastronómica de <strong>Codea con Horacio</strong>. Arrastra los platos, elige tu favorito y disfruta sin prisa.</p><p>Esta es una demostración web interactiva. Los platos, chefs, valoraciones y precios son ilustrativos. Los pedidos se simulan en tu dispositivo. Las imágenes gastronómicas se generaron con inteligencia artificial.</p><p>Teclado: enfoca el selector de platos y usa ← → para explorar, Inicio / Fin para ir al primer o último plato y Esc para cancelar el arrastre. Las animaciones respetan tu preferencia de movimiento reducido.</p>'));
$('play-button').addEventListener('click',()=>openModal('SABORES EN DOCE SEGUNDOS','<h2>Un viaje por los sabores del Perú.</h2><video class="tasting-video" src="assets/tasting.mp4" controls autoplay muted playsinline preload="metadata" aria-label="Video animado de doce segundos con nuestros cuatro platos peruanos"></video><p>Un video original creado a partir de las imágenes de nuestros cuatro platos.</p>'));
$('order-button').addEventListener('click',()=>{
  const d=dishes[state.confirmed];let quantity=1;
  openModal('TU MESA',`<h2>Una gran elección.</h2><div class="order-summary"><img src="${d.image}" alt="${d.first} ${d.second}"><div><h3>${d.first} ${d.second}</h3><p>S/ ${d.price.toFixed(2)} / porción</p><div class="quantity"><button id="qty-less" aria-label="Quitar una porción">−</button><output id="quantity" aria-label="Porciones" aria-live="polite">1</output><button id="qty-more" aria-label="Añadir una porción">+</button></div></div></div><p>Pedido de demostración · No se realizan cobros ni entregas.</p><button class="primary-button" id="confirm-order">Confirmar pedido de prueba · S/ ${d.price.toFixed(2)}</button>`);
  const update=()=>{$('quantity').textContent=quantity;$('qty-less').disabled=quantity===1;$('qty-more').disabled=quantity===12;$('confirm-order').textContent=`Confirmar pedido de prueba · S/ ${(quantity*d.price).toFixed(2)}`;};
  $('qty-less').addEventListener('click',()=>{quantity=clamp(quantity-1,1,12);update();});$('qty-more').addEventListener('click',()=>{quantity=clamp(quantity+1,1,12);update();});update();
  $('confirm-order').addEventListener('click',()=>{openModal('¡BUEN PROVECHO!',`<h2>Tu pedido de prueba está listo.</h2><p>${quantity} × ${d.first} ${d.second} · S/ ${(quantity*d.price).toFixed(2)}</p><p>Una muestra de la experiencia. No se ha realizado ningún pedido real.</p><button class="primary-button" id="back-menu">Seguir explorando</button>`);$('back-menu').addEventListener('click',closeModal);});
});
new ResizeObserver(measure).observe(selector);
updateContent();measure();
