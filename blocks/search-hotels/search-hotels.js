// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Pan Pacific Orchard, Singapore', description: 'Iconic Orchard Road luxury hotel with four dramatic open-air terraces and lush garden spaces.', image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/ppsor-property-listing.jpg', category: 'Pan Pacific', country: 'Singapore' },
  { name: 'BELLUSTAR TOKYO, A Pan Pacific Hotel', description: 'Luxury high-rise hotel in Shinjuku with panoramic city views and refined Japanese hospitality.', image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/ppbtk-property.jpg', category: 'Pan Pacific', country: 'Japan' },
  { name: 'Pan Pacific London', description: 'Contemporary luxury hotel in the City of London with a spa, pool and destination dining.', image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/pplon-property-new.jpg', category: 'Pan Pacific', country: 'United Kingdom' },
  { name: 'Pan Pacific Vancouver', description: 'Waterfront hotel on Canada Place with harbour and mountain views in downtown Vancouver.', image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/ppyvr-property.jpg', category: 'Pan Pacific', country: 'Canada' },
  { name: 'PARKROYAL COLLECTION Marina Bay, Singapore', description: 'Garden-in-a-hotel oasis overlooking Marina Bay with over 2,400 plants and trees.', image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/prsmb-property4.jpg', category: 'PARKROYAL COLLECTION', country: 'Singapore' },
  { name: 'PARKROYAL COLLECTION Kuala Lumpur', description: 'Sustainable urban sanctuary in the heart of Bukit Bintang with lush greenery throughout.', image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/prckul-property-2.jpg', category: 'PARKROYAL COLLECTION', country: 'Malaysia' },
  { name: 'PARKROYAL Langkawi Resort', description: 'Beachfront resort on Langkawi island with tropical gardens and direct access to the Andaman Sea.', image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/prlgk-property.jpg', category: 'PARKROYAL', country: 'Malaysia' },
];

// Brand palette from BuildWidgetRequest.
const PALETTE = ['#a7852e', '#d5c192', '#9b9380', '#007bff'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.hotels — bare array outputSchema; key derived from actionName "search_hotels"
      items = structuredContent?.hotels || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderItems(block, items, bridge) {
  const list = (items || []).filter((it) => !it.is_deal).slice(0, 10);

  const wrapper = document.createElement('div');
  wrapper.className = 'search-hotels-carousel-wrap';

  const track = document.createElement('div');
  track.className = 'search-hotels-track';

  list.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'search-hotels-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'search-hotels-image';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.loading = 'lazy';
      img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }
    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'search-hotels-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const title = document.createElement('h3');
    title.className = 'search-hotels-name';
    title.textContent = item.name || '';
    info.appendChild(title);

    if (item.country) {
      const loc = document.createElement('div');
      loc.className = 'search-hotels-location';
      loc.textContent = item.country;
      info.appendChild(loc);
    }

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'search-hotels-badge';
      badge.textContent = item.category;
      info.appendChild(badge);
    }

    const btn = document.createElement('button');
    btn.className = 'search-hotels-cta';
    btn.type = 'button';
    btn.textContent = 'View Hotel';
    if (bridge) {
      btn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    info.appendChild(btn);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'search-hotels-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `search-hotels-arrow search-hotels-arrow-${dir}`;
    b.textContent = dir === 'left' ? '◀' : '▶';
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    const scrollBy = () => {
      const cardW = track.querySelector('.search-hotels-card');
      const amount = cardW ? cardW.offsetWidth + 16 : 236;
      track.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };
    b.addEventListener('click', scrollBy);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollBy(); }
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    leftArrow.style.display = track.scrollLeft <= 2 ? 'none' : 'flex';
    rightArrow.style.display = track.scrollLeft >= maxScroll - 2 ? 'none' : 'flex';
    fade.style.display = track.scrollLeft >= maxScroll - 2 ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  setTimeout(updateArrows, 0);

  block.appendChild(wrapper);
}
