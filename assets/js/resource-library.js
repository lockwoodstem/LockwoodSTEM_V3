(() => {
  'use strict';
  const DATA_URL = '../assets/data/resource-library.json?v=20260807-1';
  const PAGE_SIZE = 30;
  const STORAGE_KEY = 'lockwoodstem-resource-favorites-v1';
  const state = { items: [], filtered: [], visible: PAGE_SIZE, favoritesOnly: false, favorites: new Set(), query: '', category: '', course: '', unit: '', format: '', audience: '', sort: 'recommended' };
  const $ = (selector) => document.querySelector(selector);
  const els = {};

  const escapeHtml = (value='') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const normalize = (value='') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const openable = (format) => ['PDF','JPG','JPEG','PNG','HTML'].includes(format);
  const courseLabel = (course) => course === 'General' ? 'Cross-course resources' : course;

  function loadFavorites(){
    try { state.favorites = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
    catch { state.favorites = new Set(); }
  }
  function saveFavorites(){ try{localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.favorites]));toast('Saved resources updated on this device');}catch{toast('Storage unavailable; saved resources last only while this page is open');}updateFavoriteCount(); }
  function updateFavoriteCount(){ if(els.favoriteCount) els.favoriteCount.textContent = state.favorites.size; }
  function toast(message){
    let node = document.querySelector('.resource-toast');
    if(!node){ node=document.createElement('div'); node.className='resource-toast'; node.setAttribute('role','status'); document.body.appendChild(node); }
    node.textContent=message; node.classList.add('is-visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>node.classList.remove('is-visible'),1800);
  }

  function populateSelect(select, values, labelFn=(v)=>v){
    values.forEach(value => { const option=document.createElement('option'); option.value=value; option.textContent=labelFn(value); select.appendChild(option); });
  }
  function currentUnits(){
    const units = new Set(state.items.filter(i => !state.course || i.course===state.course).map(i=>i.unit).filter(Boolean));
    return [...units].sort((a,b)=>Number(a.replace(/\D/g,''))-Number(b.replace(/\D/g,'')));
  }
  function rebuildUnitOptions(){
    const current=state.unit; els.unit.innerHTML='<option value="">All units</option>'; populateSelect(els.unit,currentUnits());
    if([...els.unit.options].some(o=>o.value===current)) els.unit.value=current; else { state.unit=''; els.unit.value=''; }
  }

  function itemSearch(item){ return normalize(item.searchText || `${item.title} ${item.description} ${item.category} ${item.course} ${item.unit} ${item.format}`); }
  function applyFilters(resetVisible=true){
    if(resetVisible) state.visible=PAGE_SIZE;
    const tokens=normalize(state.query).split(' ').filter(Boolean);
    state.filtered=state.items.filter(item => {
      if(tokens.length && !tokens.every(t=>item._search.includes(t))) return false;
      if(state.category && item.category!==state.category) return false;
      if(state.course && item.course!==state.course) return false;
      if(state.unit && item.unit!==state.unit) return false;
      if(state.format && item.format!==state.format) return false;
      if(state.audience && item.audience!==state.audience) return false;
      if(state.favoritesOnly && !state.favorites.has(item.id)) return false;
      return true;
    });
    const sorters={
      recommended:(a,b)=>(Number(b.featured)-Number(a.featured)) || a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
      title:(a,b)=>a.title.localeCompare(b.title),
      course:(a,b)=>a.course.localeCompare(b.course) || (a.unit||'').localeCompare(b.unit||'',undefined,{numeric:true}) || a.title.localeCompare(b.title),
      category:(a,b)=>a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
      size:(a,b)=>b.sizeBytes-a.sizeBytes
    };
    state.filtered.sort(sorters[state.sort] || sorters.recommended);
    render(); syncUrl();
  }

  function tagsFor(item){
    const tags=[item.audience||'Student',item.category];
    if(item.course!=='General') tags.push(item.course);
    if(item.unit) tags.push(item.unit);
    return tags;
  }
  function saveButton(item){
    const saved=state.favorites.has(item.id);
    return `<button class="resource-save-button${saved?' is-saved':''}" type="button" data-save-id="${item.id}" aria-label="${saved?'Remove from':'Save to'} saved resources" aria-pressed="${saved?'true':'false'}">${saved?'★':'☆'}</button>`;
  }
  function actionLabel(item){ return openable(item.format) ? 'Open' : 'Download'; }
  function actionAttributes(item){ return openable(item.format) ? 'target="_blank" rel="noopener"' : 'download'; }
  function featuredCard(item){
    return `<article class="resource-featured-card" data-id="${item.id}">
      <div class="resource-featured-top"><span class="resource-file-badge" data-format="${item.format}">${item.format}</span>${saveButton(item)}</div>
      <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
      <div class="resource-featured-meta">${tagsFor(item).map(t=>`<span class="resource-meta-pill">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="resource-featured-actions"><button type="button" class="btn light small" data-preview-id="${item.id}">Preview & details</button><a class="btn dark small" href="${escapeHtml(item.url)}" ${actionAttributes(item)}>${actionLabel(item)}</a></div>
    </article>`;
  }
  function resourceCard(item){
    return `<article class="resource-card-modern" data-id="${item.id}">
      <div class="resource-card-heading"><span class="resource-file-badge" data-format="${item.format}">${item.format}</span>${saveButton(item)}</div>
      <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
      <div class="resource-card-tags">${tagsFor(item).map(t=>`<span class="resource-meta-pill">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="resource-card-details"><span>${escapeHtml(item.size)}</span><span>${escapeHtml(item.filename)}</span></div>
      <div class="resource-card-actions"><button type="button" class="btn light small" data-preview-id="${item.id}">Preview & details</button><a class="btn dark small" href="${escapeHtml(item.url)}" ${actionAttributes(item)}>${actionLabel(item)} ${item.format}</a><button class="resource-copy-link" type="button" data-copy-url="${escapeHtml(item.url)}" aria-label="Copy link to ${escapeHtml(item.title)}">↗</button></div>
    </article>`;
  }
  function renderFeatured(){
    const featured=state.items.filter(i=>i.featured).slice(0,8);
    els.featured.innerHTML=featured.map(featuredCard).join('');
  }
  function renderActiveFilters(){
    const active=[];
    if(state.query) active.push(['query',`Search: “${state.query}”`]);
    if(state.category) active.push(['category',state.category]);
    if(state.course) active.push(['course',courseLabel(state.course)]);
    if(state.unit) active.push(['unit',state.unit]);
    if(state.format) active.push(['format',state.format]);
    if(state.audience) active.push(['audience',state.audience]);
    if(state.favoritesOnly) active.push(['favorites','Saved resources']);
    els.activeFilters.innerHTML=active.map(([key,label])=>`<button class="resource-filter-chip" type="button" data-clear-filter="${key}">${escapeHtml(label)} <span aria-hidden="true">×</span></button>`).join('');
  }
  function render(){
    const shown=state.filtered.slice(0,state.visible);
    els.grid.innerHTML=shown.map(resourceCard).join('');
    els.grid.setAttribute('aria-busy','false');
    els.resultCount.textContent=state.filtered.length;
    els.empty.hidden=state.filtered.length!==0;
    els.grid.hidden=state.filtered.length===0;
    els.loadMore.hidden=state.visible>=state.filtered.length || state.filtered.length===0;
    els.loadMore.textContent=`Load more resources (${Math.min(PAGE_SIZE,state.filtered.length-state.visible)} more)`;
    els.clearSearch.hidden=!state.query;
    els.favoritesToggle.setAttribute('aria-pressed',state.favoritesOnly?'true':'false');
    els.favoritesToggle.querySelector('span').textContent=state.favoritesOnly?'★':'☆';
    renderActiveFilters();
  }

  function resetFilters(){
    state.query='';state.category='';state.course='';state.unit='';state.format='';state.audience='';els.audience.value='';state.sort='recommended';state.favoritesOnly=false;
    els.search.value='';els.category.value='';els.course.value='';els.format.value='';els.sort.value='recommended';els.favoritesToggle.setAttribute('aria-pressed','false');
    rebuildUnitOptions(); applyFilters();
  }
  function syncUrl(){
    const params=new URLSearchParams();
    if(state.query) params.set('q',state.query); if(state.category) params.set('category',state.category); if(state.course) params.set('course',state.course); if(state.unit) params.set('unit',state.unit); if(state.format) params.set('format',state.format); if(state.audience) params.set('audience',state.audience); if(state.favoritesOnly) params.set('saved','1');
    const next=`${location.pathname}${params.toString()?`?${params}`:''}${location.hash}`;
    history.replaceState(null,'',next);
  }
  function readUrl(){
    const p=new URLSearchParams(location.search); state.query=p.get('q')||'';state.category=p.get('category')||'';state.course=p.get('course')||'';state.unit=p.get('unit')||'';state.format=p.get('format')||'';state.audience=p.get('audience')||'';els.audience.value=state.audience;state.favoritesOnly=p.get('saved')==='1';
    els.search.value=state.query;els.category.value=state.category;els.course.value=state.course;els.format.value=state.format;
  }

  function bindEvents(){
    let searchTimer;
    els.search.addEventListener('input',()=>{clearTimeout(searchTimer); searchTimer=setTimeout(()=>{state.query=els.search.value.trim();applyFilters();},120);});
    els.clearSearch.addEventListener('click',()=>{els.search.value='';state.query='';applyFilters();els.search.focus();});
    els.category.addEventListener('change',()=>{state.category=els.category.value;applyFilters();});
    els.course.addEventListener('change',()=>{state.course=els.course.value;rebuildUnitOptions();applyFilters();});
    els.unit.addEventListener('change',()=>{state.unit=els.unit.value;applyFilters();});
    els.audience.addEventListener('change',()=>{state.audience=els.audience.value;applyFilters();});
    els.format.addEventListener('change',()=>{state.format=els.format.value;applyFilters();});
    els.sort.addEventListener('change',()=>{state.sort=els.sort.value;applyFilters(false);});
    els.reset.addEventListener('click',resetFilters); els.emptyReset.addEventListener('click',resetFilters);
    els.loadMore.addEventListener('click',()=>{state.visible+=PAGE_SIZE;render();});
    els.favoritesToggle.addEventListener('click',()=>{state.favoritesOnly=!state.favoritesOnly;applyFilters();});
    document.addEventListener('click',async event=>{
      const preview=event.target.closest('[data-preview-id]');
      if(preview){showPreview(state.items.find(x=>x.id===preview.dataset.previewId),preview);return;}
      const save=event.target.closest('[data-save-id]');
      if(save){const id=save.dataset.saveId;if(state.favorites.has(id)){state.favorites.delete(id);toast('Removed from saved resources');}else{state.favorites.add(id);toast('Saved on this device');}saveFavorites();renderFeatured();applyFilters(false);return;}
      const copy=event.target.closest('[data-copy-url]');
      if(copy){try{await navigator.clipboard.writeText(new URL(copy.dataset.copyUrl,location.href).href);toast('Resource link copied');}catch{toast('Could not copy the link');}return;}
      const chip=event.target.closest('[data-clear-filter]');
      if(chip){const key=chip.dataset.clearFilter;if(key==='query'){state.query='';els.search.value='';}else if(key==='favorites'){state.favoritesOnly=false;}else{state[key]='';els[key].value='';if(key==='course')rebuildUnitOptions();}applyFilters();}
    });
  }

  function showPreview(item,trigger){
    if(!item)return;
    const dialog=document.createElement('dialog');dialog.className='learning-dialog';dialog.setAttribute('aria-label','Resource preview');
    const url=new URL(item.url,location.href);if(!['http:','https:'].includes(url.protocol))return;
    dialog.innerHTML=`<div class="learning-actions"><h2>${escapeHtml(item.title)}</h2><button type="button" data-close>Close preview</button></div><p>${escapeHtml(item.description)}</p><p><strong>${escapeHtml(item.audience||'Student')}</strong> · ${escapeHtml(item.format)} · ${escapeHtml(item.size)} · ${escapeHtml(item.course)} ${escapeHtml(item.unit||'')}</p><div data-preview-body></div><p><a class="btn dark" href="${escapeHtml(url.href)}" target="_blank" rel="noopener">Open original ${escapeHtml(item.format)}</a></p><p>${item.audience==='Teacher reference'?'This is a public teacher-reference resource. Its label does not restrict access.':'Downloads are not submitted automatically.'}</p>`;
    const body=dialog.querySelector('[data-preview-body]');
    if(item.format==='PDF'){const frame=document.createElement('iframe');frame.className='resource-preview-frame';frame.title=item.title+' PDF preview';frame.src=url.href;body.append(frame);const note=document.createElement('p');note.textContent='If your browser cannot display this PDF, use Open original above.';body.append(note);}
    else if(['PNG','JPG','JPEG'].includes(item.format)){const img=document.createElement('img');img.className='resource-preview-image';img.alt=item.title;img.src=url.href;body.append(img);}
    else{const note=document.createElement('p');note.textContent=item.format==='HTML'?'Open the original to use this interactive activity.':'This file needs a compatible application. Review the description and file size above before downloading.';body.append(note);}
    document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();trigger.focus();},{once:true});dialog.showModal();dialog.querySelector('[data-close]').focus();
  }
  async function init(){
    Object.assign(els,{featured:$('#resourceFeaturedGrid'),grid:$('#resourceLibraryGrid'),search:$('#resourceLibrarySearch'),clearSearch:$('#resourceSearchClear'),category:$('#resourceCategoryFilter'),course:$('#resourceCourseFilter'),unit:$('#resourceUnitFilter'),format:$('#resourceFormatFilter'),audience:$('#resourceAudienceFilter'),sort:$('#resourceSort'),resultCount:$('#resourceResultCount'),activeFilters:$('#resourceActiveFilters'),empty:$('#resourceEmptyState'),emptyReset:$('#resourceEmptyReset'),loadMore:$('#resourceLoadMore'),reset:$('#resourceResetFilters'),favoritesToggle:$('#resourceFavoritesToggle'),favoriteCount:$('#resourceFavoriteCount')});
    document.querySelectorAll('.resource-toolbar input,.resource-toolbar select,.resource-toolbar button').forEach(el=>el.disabled=true);
    loadFavorites();updateFavoriteCount();
    try{
      const response=await fetch(DATA_URL,{cache:'no-store',signal:AbortSignal.timeout(15000)}); if(!response.ok) throw new Error(`Resource data failed: ${response.status}`); const data=await response.json();
      state.items=(data.items||[]).map(item=>({...item,_search:itemSearch(item)}));
      $('#resourceTotalStat').textContent=state.items.length;$('#resourceCategoryStat').textContent=data.categories.length;$('#resourceCourseStat').textContent=data.courses.filter(x=>x!=='General').length;$('#resourceFormatStat').textContent=data.formats.length;
      populateSelect(els.category,data.categories);populateSelect(els.course,data.courses,courseLabel);populateSelect(els.format,data.formats);
      rebuildUnitOptions();readUrl();rebuildUnitOptions();els.unit.value=state.unit;renderFeatured();bindEvents();applyFilters();document.querySelectorAll('.resource-toolbar input,.resource-toolbar select,.resource-toolbar button').forEach(el=>el.disabled=false);
    }catch(error){console.error(error);els.grid.innerHTML='<div class="resource-loading-card"><strong>The resource library could not load.</strong><br>Refresh the page and try again.</div>';els.featured.innerHTML='<div class="resource-loading-card">Featured resources could not load.</div>';}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
