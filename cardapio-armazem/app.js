(() => {
  const data = window.CARDAPIO_DATA;
  const menuRoot = document.getElementById('menuRoot');
  const categoryNav = document.getElementById('categoryNav');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const emptyState = document.getElementById('emptyState');
  const itemCount = document.getElementById('itemCount');
  const segments = [...document.querySelectorAll('.segment')];

  const drinkCategories = new Set([
    'Drinks refrescantes','Drinks clássicos','Drinks clássicos brasileiros','Shots',
    'Doses de cachaça','Doses de whisky','Doses em geral','Licores'
  ]);
  const foodCategories = new Set([
    'Espetos','Porções','Parmegianas','Acompanhamentos','Lanches','Lanche de dia específico'
  ]);

  let state = { query: '', group: 'todos', activeCategory: 'todos' };

  const normalize = (value='') => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const categoryGroup = (name) => foodCategories.has(name) ? 'comidas' : drinkCategories.has(name) ? 'drinks' : 'bebidas';
  const iconFor = (name) => {
    if (/lanche/i.test(name)) return '🍔';
    if (/espeto/i.test(name)) return '🥩';
    if (/porç|acompanh/i.test(name)) return '🍟';
    if (/parmegiana/i.test(name)) return '🍽️';
    if (/drink|shot|dose|licor/i.test(name)) return '🍸';
    if (/cerveja|chopp|long neck/i.test(name)) return '🍺';
    if (/suco|refrigerante|água|energético|soda/i.test(name)) return '🥤';
    return '✦';
  };

  function itemText(item) {
    const extra = item.descricao || item.ingredientes?.join(', ') || (item.sabores ? `Sabores: ${item.sabores.join(', ')}` : '');
    return `${item.nome} ${extra}`;
  }

  function visibleCategories() {
    return data.categorias
      .filter(cat => state.group === 'todos' || categoryGroup(cat.nome) === state.group)
      .map(cat => ({
        ...cat,
        itens: cat.itens.filter(item => !state.query || normalize(itemText(item)).includes(normalize(state.query)))
      }))
      .filter(cat => cat.itens.length > 0)
      .filter(cat => state.activeCategory === 'todos' || slugify(cat.nome) === state.activeCategory);
  }

  function renderCategoryNav() {
    const categories = data.categorias.filter(cat => state.group === 'todos' || categoryGroup(cat.nome) === state.group);
    categoryNav.innerHTML = '';
    const all = document.createElement('button');
    all.type = 'button';
    all.className = `category-chip ${state.activeCategory === 'todos' ? 'is-active' : ''}`;
    all.textContent = 'Todas as categorias';
    all.dataset.category = 'todos';
    categoryNav.appendChild(all);

    categories.forEach(cat => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-chip ${state.activeCategory === slugify(cat.nome) ? 'is-active' : ''}`;
      button.textContent = `${iconFor(cat.nome)} ${cat.nome}`;
      button.dataset.category = slugify(cat.nome);
      categoryNav.appendChild(button);
    });
  }

  function render() {
    renderCategoryNav();
    const categories = visibleCategories();
    menuRoot.innerHTML = '';
    let total = 0;

    categories.forEach(cat => {
      total += cat.itens.length;
      const section = document.createElement('section');
      section.className = 'menu-section';
      section.id = slugify(cat.nome);
      const availability = cat.disponibilidade ? `<span class="item-badge">${cat.disponibilidade}</span>` : '';
      section.innerHTML = `
        <h3 class="category-title"><span>${iconFor(cat.nome)} ${cat.nome}</span></h3>
        ${availability}
        <div class="menu-grid"></div>`;
      const grid = section.querySelector('.menu-grid');

      cat.itens.forEach(item => {
        const details = item.descricao || item.ingredientes?.join(', ') || (item.sabores ? `Sabores: ${item.sabores.join(', ')}` : '');
        const card = document.createElement('article');
        card.className = 'menu-item';
        card.innerHTML = `
          <div class="item-top">
            <h4 class="item-name">${item.nome}</h4>
            <span class="item-price">${item.preco_formatado}</span>
          </div>
          ${details ? `<p class="item-description">${details}</p>` : ''}
          ${item.disponibilidade ? `<span class="item-badge">${item.disponibilidade}</span>` : ''}`;
        grid.appendChild(card);
      });
      menuRoot.appendChild(section);
    });

    emptyState.hidden = categories.length > 0;
    itemCount.textContent = `${total} ${total === 1 ? 'item' : 'itens'}`;
  }

  searchInput.addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    state.activeCategory = 'todos';
    render();
  });
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    state.query = '';
    render();
    searchInput.focus();
  });
  segments.forEach(button => button.addEventListener('click', () => {
    segments.forEach(b => b.classList.remove('is-active'));
    button.classList.add('is-active');
    state.group = button.dataset.group;
    state.activeCategory = 'todos';
    render();
  }));
  categoryNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.activeCategory = button.dataset.category;
    render();
    document.getElementById('menuRoot').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  render();
})();
