/* Лапушка: опубликованные цены из Supabase. */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://dxjwybdoeaktnugehbhd.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_6EhfeqIa8oWhLu2kkg-WLw_ntj2NcIL';

  function renderPrices() {
    const programs = document.getElementById('programs');
    if (!programs || !window.supabase) return;
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    client.from('site_prices')
      .select('direction,price')
      .eq('is_published', true)
      .order('id', { ascending: true })
      .then(({data, error}) => {
        if (error) { console.warn('Не удалось загрузить цены:', error.message); return; }
        const prices = (data || []).filter(item =>
          typeof item.direction === 'string' && item.direction.trim() &&
          item.price !== null && Number.isFinite(Number(item.price)) && Number(item.price) >= 0
        );
        if (!prices.length) return;
        const style = document.createElement('style');
        style.textContent = `
          .lapushka-prices { background: #fffdf8; }
          .lapushka-prices-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px; }
          .lapushka-price-card { background:#f7f0f6;border:1px solid rgba(122,60,121,.14);border-radius:22px;padding:22px; }
          .lapushka-price-name { margin:0 0 12px;font-size:1.15rem;font-weight:900;line-height:1.35;overflow-wrap:anywhere; }
          .lapushka-price-amount { color:#7a3c79;font-size:1.65rem;font-weight:900; }
          @media(max-width:600px){.lapushka-prices-grid{grid-template-columns:1fr}.lapushka-price-card{padding:19px}}
        `;
        document.head.append(style);
        const section = document.createElement('section');
        section.className = 'content-section lapushka-prices';
        section.id = 'prices';
        const heading = document.createElement('div');
        heading.className = 'section-heading';
        const title = document.createElement('h2');
        title.textContent = 'Цены и абонементы';
        heading.append(title);
        const grid = document.createElement('div');
        grid.className = 'lapushka-prices-grid';
        for (const item of prices) {
          const card = document.createElement('article');
          card.className = 'lapushka-price-card';
          const name = document.createElement('h3');
          name.className = 'lapushka-price-name';
          name.textContent = item.direction.trim();
          const amount = document.createElement('div');
          amount.className = 'lapushka-price-amount';
          amount.textContent = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(item.price)) + ' ₽';
          card.append(name, amount);
          grid.append(card);
        }
        section.append(heading, grid);
        programs.insertAdjacentElement('afterend', section);
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderPrices);
  else renderPrices();
})();
