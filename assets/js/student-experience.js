(() => {
  'use strict';
  const root = new URL('../../', document.currentScript.src);
  const localUrl = value => { try { const url = new URL(value, location.href); return url.origin === root.origin && url.pathname.startsWith(root.pathname) ? url.href : null; } catch { return null; } };
  document.addEventListener('DOMContentLoaded', () => {
    // Retire browser-held student and teacher credentials.
    try { ['lockwoodstem_cert_session','lockwoodstem_cert_profile','lockwoodstem_teacher_session','lockwoodstem_teacher_profile','lockwoodstem-cert-status-cache-v1'].forEach(k => localStorage.removeItem(k)); } catch {}
    const menu = document.querySelector('.nav-links');
    const toggle = document.querySelector('.nav-toggle');
    if (menu && toggle) {
      if (!menu.id) menu.id = 'site-navigation';
      toggle.setAttribute('aria-controls',menu.id);
      const sync = () => toggle.setAttribute('aria-expanded',String(menu.classList.contains('open')));
      toggle.removeAttribute('onclick');
      // Existing pages use inline toggleNav; own this button after removing it.
      toggle.addEventListener('click', () => { menu.classList.toggle('open'); sync(); });
      document.addEventListener('keydown', e => { if(e.key==='Escape' && menu.classList.contains('open')) { menu.classList.remove('open'); sync(); toggle.focus(); } });
      menu.addEventListener('click', e => { if(e.target.closest('a')) {menu.classList.remove('open');sync();} });
      sync();
    }
    const main = document.querySelector('main');
    if(main && !main.id) main.id='main';
    if(main && !document.querySelector('.skip-link')) {const a=document.createElement('a');a.className='skip-link';a.href='#'+main.id;a.textContent='Skip to main content';document.body.prepend(a);}
    document.querySelectorAll('iframe').forEach(el=>{if(!el.loading)el.loading='lazy';});
    document.querySelectorAll('[data-cert-filter]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-cert-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      document.querySelectorAll('[data-cert-card]').forEach(card=>card.hidden=button.dataset.certFilter!=='all'&&card.dataset.certCategory!==button.dataset.certFilter);
    }));
  });
})();
