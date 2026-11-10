const endpoint = 'https://advento-tour-excursao-2026.origem-ag.chatgpt.site/api';
const entry = document.querySelector('#admin-entry');
const gate = document.querySelector('#admin-gate');
const pin = gate.querySelector('input');
const statusLine = document.querySelector('#admin-status');
const panel = document.querySelector('#admin-panel');
const save = document.querySelector('#save-admin');
const saveStatus = document.querySelector('#save-status');
const textNodes = [];
for (const element of document.querySelectorAll('main h1, main h2, main h3, main section p, .schedule dt, .schedule dd, .ticket strong, .ticket b, .food, .hero-caption small, .intro small')) {
 if (element.id === 'count' || element.closest('form')) continue;
 const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
 while (walker.nextNode()) {
  const node = walker.currentNode;
  if (node.data.trim() && !textNodes.includes(node)) textNodes.push(node);
 }
}
const images = [...document.querySelectorAll('main img')];
const defaults = {
 texts: textNodes.map(node => node.data),
 images: images.map(() => null),
 extra: [],
 seats: Array(19).fill(false)
};
let revision = 0;
let current = defaults;
let draft;
let password;


async function request(path, options={}) {
 if (!endpoint) throw new Error('Painel ainda sem conexão com o servidor.');
 const response = await fetch(endpoint + path, options);
 if (response.status === 409) throw new Error('Outra alteração foi salva. Feche e abra o painel novamente.');
 if (response.status === 429) throw new Error('Aguarde um minuto para tentar novamente.');
 if (response.status === 401) throw new Error('Código inválido.');
 if (!response.ok) throw new Error('Não foi possível concluir a operação.');
 return response.json();
}
function apply(data) {
 textNodes.forEach((node,index) => { node.data = data.texts[index] ?? defaults.texts[index]; });
 images.forEach((image,index) => { if (data.images[index]) image.src=data.images[index]; });
 photos.querySelectorAll('[data-added]').forEach(image=>image.remove());
 data.extra.forEach(src => {
  const image = Object.assign(document.createElement('img'),{src,alt:'Foto da van da excursão'});
  image.dataset.added = '';
  photos.append(image);
 });
 photoCount.textContent = (currentPhoto()+1) + ' / ' + slides.length;
 renderSeats(data.seats);
}
async function refresh() {
 const state = await request('/state');
 revision = state.revision;
 current = state.data || defaults;
 apply(current);
}
if (endpoint) refresh().catch(()=>{
 document.querySelector('#count').textContent='Disponibilidade temporariamente indisponível';
 document.querySelector('#seats').replaceChildren();
});
entry.onclick = () => {
 gate.hidden = !gate.hidden;
 entry.setAttribute('aria-expanded',String(!gate.hidden));
 if (!gate.hidden) pin.focus();
};
function addFields(container, values, make) {
 container.replaceChildren(...values.map(make));
}
gate.onsubmit=async event=>{
 event.preventDefault();
 if (pin.disabled) return;
 pin.disabled=true;
 statusLine.textContent='';
 try {
  const candidate=pin.value;
  await request('/login',{method:'POST',headers:{Authorization:'Bearer '+candidate}});
  await refresh();
  password=candidate;
  draft=JSON.parse(JSON.stringify(current));
  addFields(document.querySelector('#edit-seats'),draft.seats,(taken,index)=>{
   const button=Object.assign(document.createElement('button'),{type:'button',textContent:index+1});
   button.setAttribute('aria-pressed',String(taken));
   button.onclick=()=>{draft.seats[index]=!draft.seats[index];button.setAttribute('aria-pressed',String(draft.seats[index]));};
   return button;
  });
  addFields(document.querySelector('#edit-texts'),draft.texts,(value,index)=>{
   const label=document.createElement('label');
   const field=Object.assign(document.createElement('textarea'),{value,maxLength:3000});
   label.append('Texto '+(index+1),field);
   field.oninput=()=>{draft.texts[index]=field.value;};
   return label;
  });

  gate.hidden=true;
  entry.setAttribute('aria-expanded','false');
  saveStatus.textContent='';
  panel.showModal();
 } catch(error){statusLine.textContent=error.message;}
 finally {pin.disabled=false;pin.value='';}
};
document.querySelector('#close-admin').onclick=()=>panel.close();
panel.addEventListener('close',()=>{password=undefined;});
save.onclick=async ()=>{
 const body=JSON.stringify({revision,data:draft});
 if(new TextEncoder().encode(body).length>1450000){saveStatus.textContent='As fotos excedem o limite de 1,45 MB. Use imagens menores.';return;}
 save.disabled=true;
 try {
  const result=await request('/state',{method:'POST',headers:{Authorization:'Bearer '+password,'Content-Type':'application/json'},body});
  revision=result.revision;
  current=JSON.parse(body).data;
  apply(current);
  saveStatus.textContent='Alterações salvas.';
 } catch(error){saveStatus.textContent=error.message;}
 finally {save.disabled=false;}
};
