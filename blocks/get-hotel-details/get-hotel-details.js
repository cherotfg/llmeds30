// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Pan Pacific Orchard, Singapore',
    description: 'Iconic Orchard Road luxury hotel with four dramatic open-air terraces and lush garden spaces.',
    image_url: 'https://www.panpacific.com/content/dam/pphg-revamp/en/global/hotels-and-resorts/ppsor-property-listing.jpg',
    category: 'Pan Pacific',
    country: 'Singapore',
  },
];

// Brand palette from BuildWidgetRequest — getThemedCardBg darkens palette[0] to
// luminance <= 0.12 so white text keeps WCAG AA contrast on the content panel.
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

// Compute readable text color for a solid background (dark text on light, white on dark).
function readableText(hex) {
  if (!hex) return '#1a1a1a';
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return '#1a1a1a';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#1a1a1a' : '#ffffff';
}

const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA[0];
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      item = (_result?.structuredContent || _result) || {};
    }
  } else {
    item = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderDetail(block, item, bridge);

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

function renderDetail(block, item, bridge) {
  if (!item || !item.name) {
    const empty = document.createElement('div');
    empty.className = 'detail-empty';
    empty.textContent = 'No hotel details available.';
    block.appendChild(empty);
    return;
  }

  const card = document.createElement('div');
  card.className = 'detail-card';

  // LEFT — image
  const media = document.createElement('div');
  media.className = 'detail-media';
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${CARD_COLORS[0]};`;
    return d;
  };
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
    media.appendChild(img);
  } else {
    media.appendChild(colorDiv());
  }
  card.appendChild(media);

  // RIGHT — content
  const content = document.createElement('div');
  content.className = 'detail-content';
  content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  if (item.category) {
    const badge = document.createElement('span');
    badge.className = 'detail-badge';
    badge.textContent = item.category;
    content.appendChild(badge);
  }

  const title = document.createElement('h3');
  title.className = 'detail-title';
  title.textContent = item.name;
  content.appendChild(title);

  if (item.country) {
    const loc = document.createElement('div');
    loc.className = 'detail-location';
    const pin = document.createElement('span');
    pin.className = 'detail-pin';
    pin.setAttribute('aria-hidden', 'true');
    pin.textContent = '◉';
    const locText = document.createElement('span');
    locText.textContent = item.country;
    loc.appendChild(pin);
    loc.appendChild(locText);
    content.appendChild(loc);
  }

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'detail-desc';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  const cta = document.createElement('button');
  cta.className = 'detail-cta';
  cta.type = 'button';
  cta.textContent = 'Book Now';
  const ctaBg = PALETTE[1] || '#d5c192';
  cta.style.cssText = `background:${ctaBg};color:${readableText(ctaBg)};`;
  if (bridge) {
    cta.addEventListener('click', () => {
      bridge.sendMessage(`Tell me more about ${item.name}`);
    });
  }
  content.appendChild(cta);

  card.appendChild(content);
  block.appendChild(card);
}
