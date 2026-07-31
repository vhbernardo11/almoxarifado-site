(() => {
  const raw = window.CARDAPIO_DATA || {categorias:[]};
  const normalize = s => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const slug = s => normalize(s).replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const drinkNames = new Set(['Drinks refrescantes','Drinks clássicos','Drinks clássicos brasileiros','Shots','Doses de cachaça','Doses de whisky','Doses em geral','Licores']);
  const foodNames = new Set(['Espetos','Porções','Parmegianas','Acompanhamentos','Lanches','Lanche de dia específico']);
  const beerNames = new Set(['Chopp','Cervejas 600 ml','Cervejas especiais','Long neck']);
  const icons = {'Drinks refrescantes':'🍹','Drinks clássicos':'🍸','Drinks clássicos brasileiros':'🍋','Shots':'🥃','Doses de cachaça':'🥃','Doses de whisky':'🥃','Doses em geral':'🥃','Licores':'🍷','Soda italiana sem álcool':'🥤','Chopp':'🍺','Cervejas 600 ml':'🍺','Cervejas especiais':'🍻','Long neck':'🍺','Refrigerantes 600 ml':'🥤','Refrigerantes 1 litro':'🥤','Refrigerantes em lata':'🥤','Energéticos':'⚡','Água':'💧','Sucos naturais':'🍊','Suco em lata':'🧃','Espetos':'🔥','Porções':'🍟','Parmegianas':'🍽️','Acompanhamentos':'🥗','Lanches':'🍔','Lanche de dia específico':'🥩'};
  const group = name => foodNames.has(name)?'comidas':drinkNames.has(name)?'drinks':beerNames.has(name)?'cervejas':'sem-alcool';
  const price = text => Number(String(text||'0').replace(/[^0-9,]/g,'').replace(',','.')) || 0;
  const categories = raw.categorias.map(c => ({...c,id:slug(c.nome),icon:icons[c.nome]||'•',group:group(c.nome),itens:c.itens.map((i,k)=>({...i,id:`${slug(c.nome)}-${k+1}`,preco:price(i.preco_formatado),search:[i.nome,i.descricao,(i.ingredientes||[]).join(' '),(i.sabores||[]).join(' '),c.nome].filter(Boolean).join(' ').toLowerCase()}))}));
  window.ARMAZEM_MENU={meta:{name:'Armazém Espetaria',address:'Rua José Lopes Corado, 950 — Centro, Teodoro Sampaio/SP',phone:'5518976031082',phoneDisplay:'(18) 97603-1082',totalItems:categories.reduce((n,c)=>n+c.itens.length,0)},categories};
})();

(() => {
  const DATA = window.ARMAZEM_MENU;
  const storage = {
    get(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(_) { return fallback; } },
    set(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(_) {} }
  };
  const state = {
    group: 'todos', query: '', favoritesOnly: false,
    favorites: new Set(storage.get('armazem:favorites', [])),
    cart: storage.get('armazem:cart', {}),
    openCategories: new Set(['espetos','porcoes','drinks-refrescantes','lanches'])
  };
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const menuContent = $('#menuContent');
  const nav = $('#categoryNav');
  const search = $('#searchInput');
  const clearSearch = $('#clearSearch');
  const emptyState = $('#emptyState');
  const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
  const normalize = s => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const today = () => new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short'}).format(new Date()).toLowerCase();
  const isTuesday = () => today().startsWith('tue');
  const isAvailableToday = cat => cat.nome === 'Lanches' ? !isTuesday() : cat.nome === 'Lanche de dia específico' ? isTuesday() : true;

  function save(){
    storage.set('armazem:favorites',[...state.favorites]);
    storage.set('armazem:cart',state.cart);
  }
  function toast(msg){
    const el=$('#toast'); el.textContent=msg; el.classList.add('is-visible');
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('is-visible'),1900);
  }
  function updateStatus(){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value])); const day=p.weekday.toLowerCase(); const hour=+p.hour;
    const open=!day.startsWith('sun') && hour>=18;
    $('#openDot').className='status-dot '+(open?'is-open':'is-closed');
    $('#openStatus').textContent=open?'Aberto agora':'Fechado agora';
    $('#todayHours').textContent=day.startsWith('sun')?'Domingo fechado':'Hoje, 18h–0h';
  }
  function itemText(item){ return item.descricao || (item.ingredientes?.join(', ') ?? ''); }
  function filteredCategories(){
    const q=normalize(state.query);
    return DATA.categories.map(cat=>{
      if(state.group!=='todos' && cat.group!==state.group) return {...cat,itens:[]};
      const itens=cat.itens.filter(i=>{
        const matches=!q || normalize(i.search).includes(q);
        const fav=!state.favoritesOnly || state.favorites.has(i.id);
        return matches&&fav;
      });
      return {...cat,itens};
    }).filter(c=>c.itens.length);
  }
  function renderNav(cats){
    nav.innerHTML=cats.map(c=>`<button class="category-pill" data-jump="${c.id}">${c.icon} ${c.nome}</button>`).join('');
  }
  function render(){
    const cats=filteredCategories();
    renderNav(cats);
    emptyState.hidden=!!cats.length;
    menuContent.innerHTML=cats.map(cat=>{
      const open=state.query||state.favoritesOnly||state.openCategories.has(cat.id);
      const available=isAvailableToday(cat);
      const note=cat.disponibilidade || (cat.nome==='Lanche de dia específico'?'Disponível toda terça-feira.':'');
      return `<article class="menu-section ${open?'is-open':''}" id="${cat.id}" data-category="${cat.id}">
        <button class="category-header" type="button" aria-expanded="${open}">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-title"><h3>${cat.nome}</h3><small>${cat.itens.length} ${cat.itens.length===1?'item':'itens'}${available?'':' • hoje indisponível'}</small></span>
          <span class="category-chevron">⌄</span>
        </button>
        <div class="category-body">
          ${note?`<div class="availability-note">${available?'✓':'○'} ${note}</div>`:''}
          ${cat.itens.map(item=>renderItem(item,cat,available)).join('')}
        </div>
      </article>`;
    }).join('');
    updateCounts();
  }
  function renderItem(item,cat,available){
    const fav=state.favorites.has(item.id); const desc=itemText(item);
    const ingredients=item.ingredientes?.length?`<div class="ingredients">${item.ingredientes.map(x=>`<span>${x}</span>`).join('')}</div>`:'';
    return `<article class="menu-item ${available?'':'is-unavailable'}">
      ${item.disponibilidade?`<span class="item-tag">${item.disponibilidade}</span>`:''}
      <div class="menu-item__top"><h4>${item.nome}</h4><span class="price">${item.preco_formatado||money(item.preco)}</span></div>
      ${desc?`<p class="description">${desc}</p>`:''}${ingredients}
      <div class="item-actions"><button class="favorite-button ${fav?'is-active':''}" data-favorite="${item.id}" aria-label="${fav?'Remover dos':'Adicionar aos'} favoritos">${fav?'♥':'♡'}</button>
      <button class="add-button" data-add="${item.id}" ${available?'':'disabled'}>${available?'Adicionar':'Indisponível hoje'}</button></div>
    </article>`;
  }
  function findItem(id){ for(const c of DATA.categories){ const item=c.itens.find(i=>i.id===id); if(item)return {...item,category:c.nome}; } }
  function updateCounts(){
    const fav=state.favorites.size; const count=Object.values(state.cart).reduce((a,b)=>a+b,0);
    $('#favCount').textContent=fav; $('#favCount').hidden=!fav;
    $('#cartCount').textContent=count; $('#cartCount').hidden=!count;
    $('#favoritesToggle').classList.toggle('is-active',state.favoritesOnly);
    $('#favoritesToggle').querySelector('span').textContent=state.favoritesOnly?'♥':'♡';
  }
  function renderCart(){
    const entries=Object.entries(state.cart).filter(([,q])=>q>0); const box=$('#cartItems');
    $('#cartEmpty').hidden=!!entries.length;
    box.innerHTML=entries.map(([id,qty])=>{const i=findItem(id);return `<div class="cart-row"><div><h4>${i.nome}</h4><small>${money(i.preco)} cada</small></div><div class="qty-controls"><button data-qty="${id}" data-delta="-1">−</button><b>${qty}</b><button data-qty="${id}" data-delta="1">+</button></div></div>`}).join('');
    const total=entries.reduce((sum,[id,q])=>sum+findItem(id).preco*q,0); $('#cartTotal').textContent=money(total);
    $('#sendWhatsapp').disabled=!entries.length;
  }
  function openSheet(id){
    const sheet=$(id); $$('.bottom-sheet').forEach(s=>s.classList.remove('is-open'));
    sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden','false');
    $('#sheetBackdrop').hidden=false; document.body.style.overflow='hidden'; if(id==='#cartSheet')renderCart();
  }
  function closeSheets(){
    $$('.bottom-sheet').forEach(s=>{s.classList.remove('is-open');s.setAttribute('aria-hidden','true')});
    $('#sheetBackdrop').hidden=true; document.body.style.overflow='';
  }
  document.addEventListener('click',e=>{
    const head=e.target.closest('.category-header'); if(head){const sec=head.closest('.menu-section');sec.classList.toggle('is-open');const open=sec.classList.contains('is-open');head.setAttribute('aria-expanded',open);open?state.openCategories.add(sec.dataset.category):state.openCategories.delete(sec.dataset.category);}
    const jump=e.target.closest('[data-jump]'); if(jump){const id=jump.dataset.jump; const sec=document.getElementById(id); if(sec){sec.classList.add('is-open');state.openCategories.add(id);sec.scrollIntoView({behavior:'smooth',block:'start'});} }
    const fav=e.target.closest('[data-favorite]'); if(fav){const id=fav.dataset.favorite;state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);save();render();toast(state.favorites.has(id)?'Adicionado aos favoritos':'Removido dos favoritos');}
    const add=e.target.closest('[data-add]'); if(add){const id=add.dataset.add;state.cart[id]=(state.cart[id]||0)+1;save();updateCounts();toast('Item adicionado ao pedido');}
    const qty=e.target.closest('[data-qty]'); if(qty){const id=qty.dataset.qty;state.cart[id]=(state.cart[id]||0)+(+qty.dataset.delta);if(state.cart[id]<=0)delete state.cart[id];save();renderCart();updateCounts();}
    if(e.target.closest('[data-close-sheet]')||e.target===$('#sheetBackdrop'))closeSheets();
  });
  search.addEventListener('input',()=>{state.query=search.value;clearSearch.hidden=!state.query;render()});
  clearSearch.addEventListener('click',()=>{search.value='';state.query='';clearSearch.hidden=true;render();search.focus()});
  $('#groupFilters').addEventListener('click',e=>{const b=e.target.closest('[data-group]');if(!b)return;state.group=b.dataset.group;$$('.filter-chip').forEach(x=>x.classList.toggle('is-active',x===b));render()});
  $('#favoritesToggle').addEventListener('click',()=>{state.favoritesOnly=!state.favoritesOnly;render(); if(state.favoritesOnly&&!state.favorites.size)toast('Marque itens com ♡ para salvar')});
  $('#bottomFavorites').addEventListener('click',()=>{state.favoritesOnly=true;render();document.getElementById('menu').scrollIntoView({behavior:'smooth'});if(!state.favorites.size)toast('Marque itens com ♡ para salvar')});
  $('#bottomSearch').addEventListener('click',()=>{document.getElementById('menu').scrollIntoView({behavior:'smooth'});setTimeout(()=>search.focus(),450)});
  $('#cartButton').addEventListener('click',()=>openSheet('#cartSheet'));
  $('#infoButton').addEventListener('click',()=>openSheet('#infoSheet'));
  $('#sheetBackdrop').addEventListener('click',closeSheets);
  $('#clearCart').addEventListener('click',()=>{state.cart={};save();renderCart();updateCounts();toast('Lista limpa')});
  $('#sendWhatsapp').addEventListener('click',()=>{
    const entries=Object.entries(state.cart).filter(([,q])=>q>0);if(!entries.length)return;
    const total=entries.reduce((s,[id,q])=>s+findItem(id).preco*q,0);
    const lines=['Olá! Gostaria de consultar este pedido do cardápio do Armazém:','',...entries.map(([id,q])=>{const i=findItem(id);return `• ${q}x ${i.nome} — ${money(i.preco*q)}`}),'',`Total estimado: ${money(total)}`,'','Pode confirmar disponibilidade e valor?'];
    window.open(`https://wa.me/${DATA.meta.phone}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank','noopener');
  });
  $('#shareButton').addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:'Cardápio — Armazém Espetaria',text:'Confira o cardápio do Armazém Espetaria',url:location.href});else{await navigator.clipboard.writeText(location.href);toast('Link copiado')}}catch(_){}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheets()});
  updateStatus(); render();
})();
