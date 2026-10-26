# Hood Maxxers — client revisions

## Replace files
Replace index.html, css/apps.css, css/retro.css, js/apps.js and js/os.js at the same paths. Also include the new js/asset-loader.js file. Keep the assets folder. The ZIP includes the complete site and assets; no build step is required. Open index.html or serve this folder on your existing static host. retro.css is supplied unchanged for completeness.

## Changes implemented
- WL: requested title, introduction, task copy, EVM/Robinhood Chain wallet field and SUBMIT APPLICATION button. Removed demo wallet button, automatic-verification claim and generated VIP pass.
- NFT: requested sneak-peek heading and 4,444 description, removed filter buttons and invented traits/rarities, enlarged artwork in a classic-PC gallery. Clicking each preview changes the selected item; Trait Details shows MORE DETAILS SOON.
- Token: Network changed to Robinhood Chain.
- MAXX IN: locked state, all seven supplied steps, important note and cycle, in a retro layout.
- MAXX LEAGUE and MAXX OUT: old content removed and replaced by classic COMING SOON windows, dismissible with OK, close button or Escape.
- Related FAQ copy updated to avoid contradicting the new collection size, rarity-based allocation and removed pass.

## NFT artwork and custom app icons
The gallery contains 12 numbered slots. Put nft-01.png through nft-12.png in assets/images/nfts/. Missing artwork shows a neutral placeholder, not sample NFT art. Optional custom app icons belong in assets/icons/custom/ and automatically fall back to the existing bundled app icons. See ASSET-GUIDE.txt for every filename and installation instructions.

## Whitelist submission setup
The original code had no server integration. It only fabricated a verified pass. This revision validates three unique X handles, a 0x + 40-hex wallet address and five user-confirmed tasks. Social tasks are self-confirmed, not verified through X or Discord.

Set data-endpoint="/your-endpoint" on #wl-form-container in index.html. The endpoint must accept JSON POST with wallet, taggedUsers and tasks, and return a successful HTTP response with {"success": true} only after storing the application. Add server-side validation, duplicate handling, rate limiting and any required social verification in that service. Cross-origin endpoints must allow your site's origin. No endpoint or credentials were provided, so the default explains that the application has not been sent; it does not claim success or allocate a spot.

The existing View Post button points to the HoodMaxxers X profile; replace its href with the exact pinned-post URL when available. Existing social destinations are preserved.

## Existing functionality
The trading dashboard remains the original local price simulation; this revision does not connect wallets, execute transactions, mint NFTs or enable live trading.
