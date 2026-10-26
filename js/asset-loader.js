/** Optional artwork and app icons. Loaded in <head> before images are parsed. */
(function () {
  'use strict';
  const iconNames = new Set([
    'about_us', 'wl_application', 'maxxers_nft', 'maxxers_token',
    'maxx_in', 'maxx_league', 'dashboard', 'maxx_out',
    'discord', 'x', 'opensea', 'faq'
  ]);
  const svgURL = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const defaultIcon = svgURL('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect x="5" y="7" width="54" height="48" fill="#c0c0c0" stroke="#000" stroke-width="2"/><path d="M7 9h50v11H7z" fill="#000080"/><path d="M12 27h40v21H12z" fill="#fff"/><path d="M17 33h26M17 39h18" stroke="#808080" stroke-width="3"/></svg>');
  function nftPlaceholder(number) {
    return svgURL('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#d5d5d5"/><rect x="24" y="24" width="552" height="552" fill="#eee" stroke="#808080" stroke-width="3"/><rect x="24" y="24" width="552" height="48" fill="#000080"/><text x="48" y="57" fill="white" font-size="22" font-family="monospace">MAXXER ' + number + '</text><path d="M220 205h160v130H220z" fill="#c0c0c0" stroke="#808080" stroke-width="4"/><path d="m233 322 45-50 31 30 25-28 33 48" fill="none" stroke="#808080" stroke-width="5"/><circle cx="340" cy="240" r="13" fill="#808080"/><text x="300" y="398" text-anchor="middle" font-size="24" font-family="monospace" fill="#333">ARTWORK COMING SOON</text></svg>');
  }
  function applyFallback(image) {
    if (!image || image.tagName !== 'IMG') return;
    const source = image.getAttribute('src') || '';
    // Embedded fallbacks are terminal: never retry an image indefinitely.
    if (source.startsWith('data:')) return;
    const custom = source.match(/(?:^|\/)assets\/icons\/custom\/([a-z_]+)\.png(?:[?#].*)?$/);
    if (custom && iconNames.has(custom[1])) {
      image.src = 'assets/icons/' + custom[1] + '.png';
      return;
    }
    const original = source.match(/(?:^|\/)assets\/icons\/([a-z_]+)\.png(?:[?#].*)?$/);
    if (original && iconNames.has(original[1])) {
      image.src = defaultIcon;
      return;
    }
    const nft = source.match(/(?:^|\/)assets\/images\/nfts\/nft-(0[1-9]|1[0-2])\.png(?:[?#].*)?$/);
    if (nft) {
      image.src = nftPlaceholder(nft[1]);
      image.alt = 'MAXXER ' + nft[1] + ' — artwork coming soon';
    }
  }
  // Capturing handles image errors, including images created later by the OS.
  document.addEventListener('error', event => applyFallback(event.target), true);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img').forEach(image => {
      if (image.complete && image.naturalWidth === 0) applyFallback(image);
    });
  });
}());
