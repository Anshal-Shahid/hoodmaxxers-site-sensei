/**
 * APPS.JS - Interactive Application Logic for Hood Maxxers Platform
 * Handles Trading Dashboard with real-time stock simulation, Whitelist application,
 * MAXX IN guide, NFT preview selector, and FAQ accordion.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ====================================================
  // 1. DASHBOARD - REAL-TIME STOCK TRADING PLATFORM
  // ====================================================
  const stockTokens = {
    AAPL: {
      name: 'Apple Inc.',
      price: 234.85,
      change: +1.42,
      high: 236.20,
      low: 232.10,
      history: [230.5, 231.2, 233.0, 232.4, 233.8, 234.2, 233.9, 234.5, 234.85]
    },
    TSLA: {
      name: 'Tesla Inc.',
      price: 218.40,
      change: -0.85,
      high: 222.50,
      low: 216.30,
      history: [221.0, 220.4, 219.0, 217.8, 219.2, 218.7, 218.1, 218.9, 218.40]
    },
    NVDA: {
      name: 'NVIDIA Corp.',
      price: 138.25,
      change: +3.65,
      high: 139.80,
      low: 134.50,
      history: [132.0, 133.5, 135.0, 136.2, 137.4, 136.8, 137.9, 138.1, 138.25]
    },
    GOOG: {
      name: 'Alphabet Inc.',
      price: 164.50,
      change: +0.72,
      high: 166.10,
      low: 163.20,
      history: [162.8, 163.5, 164.0, 163.7, 164.1, 163.9, 164.3, 164.2, 164.50]
    },
    AMZN: {
      name: 'Amazon.com',
      price: 188.90,
      change: +1.15,
      high: 190.40,
      low: 186.80,
      history: [186.2, 187.0, 188.1, 187.5, 188.4, 188.0, 188.6, 188.5, 188.90]
    },
    MSFT: {
      name: 'Microsoft Corp.',
      price: 418.30,
      change: -0.42,
      high: 421.50,
      low: 416.80,
      history: [420.1, 419.5, 418.8, 417.9, 418.5, 418.0, 417.7, 418.6, 418.30]
    }
  };

  let activeSym = 'AAPL';
  const canvas = document.getElementById('trading-chart-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  // Render Trading Canvas Chart
  function renderChart() {
    if (!canvas || !ctx) return;
    const stock = stockTokens[activeSym];
    if (!stock) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 30; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 50; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Min and Max for normalization
    const data = stock.history;
    const minVal = Math.min(...data) * 0.998;
    const maxVal = Math.max(...data) * 1.002;
    const range = maxVal - minVal || 1;

    // Line & Area coordinates
    const stepX = (width - 40) / (data.length - 1);
    const points = data.map((val, i) => {
      const x = 20 + i * stepX;
      const y = height - 30 - ((val - minVal) / range) * (height - 60);
      return { x, y };
    });

    const isPositive = stock.change >= 0;
    const strokeCol = isPositive ? '#4ade80' : '#f87171';
    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isPositive) {
      fillGradient.addColorStop(0, 'rgba(74, 222, 128, 0.35)');
      fillGradient.addColorStop(1, 'rgba(74, 222, 128, 0.0)');
    } else {
      fillGradient.addColorStop(0, 'rgba(248, 113, 113, 0.35)');
      fillGradient.addColorStop(1, 'rgba(248, 113, 113, 0.0)');
    }

    // Draw Fill Area
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - 20);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, height - 20);
    ctx.closePath();
    ctx.fillStyle = fillGradient;
    ctx.fill();

    // Draw Stroke Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw End Glowing Dot
    const lastPt = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = strokeCol;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Current Price tag on chart
    ctx.fillStyle = strokeCol;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`$${stock.price.toFixed(2)}`, lastPt.x - 45, Math.max(16, lastPt.y - 8));
  }

  // Stock Pair Selector Clicks
  const stockItems = document.querySelectorAll('.dash-stock-item');
  stockItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.RetroSound) window.RetroSound.click();
      stockItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const sym = item.getAttribute('data-sym');
      if (stockTokens[sym]) {
        activeSym = sym;
        updateActiveDisplay();
        renderChart();
      }
    });
  });

  function updateActiveDisplay() {
    const stock = stockTokens[activeSym];
    if (!stock) return;

    const symEl = document.getElementById('active-pair-sym');
    const priceEl = document.getElementById('active-pair-price');
    const isPositive = stock.change >= 0;

    if (symEl) symEl.textContent = `$${activeSym} / USD`;
    if (priceEl) {
      priceEl.textContent = `$${stock.price.toFixed(2)}`;
      priceEl.className = isPositive ? 'price-up' : 'price-down';
    }
  }

  // Real-Time Simulation Interval (price tick every 1.8 seconds)
  setInterval(() => {
    const syms = Object.keys(stockTokens);
    // Pick 1 or 2 random stocks to tick
    const sym = syms[Math.floor(Math.random() * syms.length)];
    const stock = stockTokens[sym];
    if (!stock) return;

    // Small random delta (+/- 0.15% to 0.45%)
    const pct = (Math.random() * 0.6 - 0.28) / 100;
    const oldPrice = stock.price;
    stock.price = Math.max(10, +(stock.price * (1 + pct)).toFixed(2));
    stock.change = +(stock.change + pct * 10).toFixed(2);
    stock.history.push(stock.price);
    if (stock.history.length > 16) stock.history.shift();

    // Update stock item in sidebar
    const priceEl = document.getElementById(`price-${sym}`);
    if (priceEl) {
      const isUp = stock.price >= oldPrice;
      const sign = stock.change >= 0 ? '+' : '';
      priceEl.innerHTML = `$${stock.price.toFixed(2)}<br><span style="font-size: 9.5px;">${sign}${stock.change.toFixed(2)}%</span>`;
      priceEl.className = 'dash-stock-price ' + (isUp ? 'price-up' : 'price-down');
    }

    if (sym === activeSym) {
      updateActiveDisplay();
      renderChart();
    }
  }, 1800);

  // Initial chart render
  setTimeout(() => {
    updateActiveDisplay();
    renderChart();
  }, 200);

  // Order Placement Alert
  const btnPlaceOrder = document.getElementById('btn-place-order');
  const btnTabBuy = document.getElementById('btn-tab-buy');
  const btnTabSell = document.getElementById('btn-tab-sell');

  if (btnTabBuy && btnTabSell) {
    btnTabBuy.addEventListener('click', () => {
      btnTabBuy.style.opacity = '1';
      btnTabSell.style.opacity = '0.6';
    });
    btnTabSell.addEventListener('click', () => {
      btnTabSell.style.opacity = '1';
      btnTabBuy.style.opacity = '0.6';
    });
  }

  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', () => {
      if (window.RetroSound) window.RetroSound.buzzer();
      alert('⚠️ MAXX LEAGUE PRE-SEASON ACTIVE\n\nTrading orders are currently disabled until Season 1 officially commences.\n\nMake sure to complete your Whitelist Application and MAXX IN your NFT to receive rarity-based MAXX CASH!');
    });
  }

  // FCFS uses the existing live Google Form (wallet field only).
  const WL_GOOGLE_FORM = {
    formURL: 'https://docs.google.com/forms/d/e/1FAIpQLSdyNhJEVVfU3vYisiJUSmxJNjIy3g78y8lmECjjVzWZUtRKNw/formResponse',
    entries: { wallet: 'entry.1643935123' }
  };
  // IMPORTANT: GTD requires a NEW Google Form with 3 questions: story, wallet, X handle.
  // Replace the placeholders below with its formResponse URL and entry IDs before going live.
  const GTD_GOOGLE_FORM = {
    formURL: 'https://docs.google.com/forms/d/e/1FAIpQLScdYx2quhdjHlt3uFSNNBQ06NRFUmT2_sutPx_9yMi3ex25lA/formResponse',
    entries: { story: 'entry.1611260614', wallet: 'entry.413195611', xHandle: 'entry.275103923' }
  };
  const configured = cfg => /^https:\/\/docs\.google\.com\/forms\/d\/e\/[^/]+\/formResponse$/.test(cfg.formURL)
    && Object.values(cfg.entries).every(id => /^entry\.\d+$/.test(id));
  const showFeedback = (el, message, ok = false) => {
    el.textContent = message;
    el.classList.toggle('wl-feedback-success', ok);
  };
  const tabs = [document.getElementById('wl-tab-fcfs'), document.getElementById('wl-tab-gtd')];
  const panels = [document.getElementById('wl-panel-fcfs'), document.getElementById('wl-panel-gtd')];
  tabs.forEach((tab, i) => tab?.addEventListener('click', () => {
    tabs.forEach((t, j) => { t.classList.toggle('is-active', i === j); t.setAttribute('aria-selected', String(i === j)); panels[j].hidden = i !== j; });
  }));
  const fcfs = document.getElementById('wl-form-container');
  if (fcfs) {
    const rows = [...fcfs.querySelectorAll('.wl-task-item')];
    const checks = rows.map(row => row.querySelector('.wl-checkbox'));
    const wallet = document.getElementById('wl-wallet-input');
    const submit = document.getElementById('btn-submit-whitelist');
    const feedback = document.getElementById('wl-feedback');
    let sending = false;
    const postURL = 'https://x.com/HoodMaxxers/status/2115101398488723549';
    document.getElementById('btn-task-2').href = postURL;
    document.getElementById('btn-task-3').href = postURL;
    function refresh() {
      checks[3].checked = !!wallet.value.trim();
      let unlocked = true;
      rows.forEach((row, i) => {
        const locked = !unlocked || sending;
        row.classList.toggle('wl-task-locked', locked);
        row.inert = locked;
        row.setAttribute('aria-disabled', String(locked));
        row.querySelectorAll('a').forEach(link => link.tabIndex = locked ? -1 : 0);
        if (i === 3) wallet.disabled = locked;
        unlocked = unlocked && checks[i].checked;
      });
      submit.disabled = sending || !checks.every(c => c.checked);
    }
    rows.slice(0, 3).forEach((row, i) => {
      row.querySelector('a').addEventListener('click', event => {
        if (row.inert) { event.preventDefault(); return; }
        checks[i].checked = true; // Indicates link opened; cannot verify social action.
        refresh();
      });
    });
    wallet.addEventListener('input', refresh);
    fcfs.addEventListener('submit', async event => {
      event.preventDefault();
      refresh();
      if (submit.disabled) return;
      if (!configured(WL_GOOGLE_FORM)) { showFeedback(feedback, 'FCFS submission is not configured yet.'); return; }
      const data = new FormData();
      data.append(WL_GOOGLE_FORM.entries.wallet, wallet.value.trim());
      sending = true; refresh(); submit.textContent = 'SUBMITTING...';
      try {
        await fetch(WL_GOOGLE_FORM.formURL, { method: 'POST', mode: 'no-cors', body: data });
        showFeedback(feedback, 'Your FCFS application was sent. Please follow our X account for updates.', true);
      } catch (_) { showFeedback(feedback, 'Submission could not be sent. Please retry.'); }
      finally { sending = false; refresh(); submit.textContent = 'SUBMIT FCFS APPLICATION'; }
    });
    refresh();
  }
  const gtd = document.getElementById('gtd-form-container');
  if (gtd) {
    const story = document.getElementById('gtd-story');
    const wallet = document.getElementById('gtd-wallet');
    const xHandle = document.getElementById('gtd-x-handle');
    const submit = document.getElementById('btn-submit-gtd');
    const feedback = document.getElementById('gtd-feedback');
    gtd.addEventListener('submit', async event => {
      event.preventDefault();
      if (!story.value.trim() || !wallet.value.trim() || !xHandle.value.trim()) {
        showFeedback(feedback, 'Please complete your story, wallet address, and X username.'); return;
      }
      if (!configured(GTD_GOOGLE_FORM)) {
        showFeedback(feedback, 'GTD applications are not connected yet. Please check back soon.'); return;
      }
      const data = new FormData();
      data.append(GTD_GOOGLE_FORM.entries.story, story.value.trim());
      data.append(GTD_GOOGLE_FORM.entries.wallet, wallet.value.trim());
      data.append(GTD_GOOGLE_FORM.entries.xHandle, xHandle.value.trim());
      submit.disabled = true; submit.textContent = 'SUBMITTING...';
      try {
        await fetch(GTD_GOOGLE_FORM.formURL, { method: 'POST', mode: 'no-cors', body: data });
        showFeedback(feedback, 'Your application was sent. If approved, you’ll receive a DM on X. Please follow @HoodMaxxers and keep your DMs open.', true);
      } catch (_) { showFeedback(feedback, 'Submission could not be sent. Please retry.'); }
      finally { submit.disabled = false; submit.textContent = 'SUBMIT GTD APPLICATION'; }
    });
  }

  // Native buttons support mouse, touch, Enter and Space.
  const nftCards = document.querySelectorAll('.nft-card-item');
  nftCards.forEach(card => card.addEventListener('click', () => {
    nftCards.forEach(item => {
      item.classList.toggle('active', item === card);
      item.setAttribute('aria-pressed', String(item === card));
    });
    document.getElementById('inspect-nft-name').textContent = card.dataset.name;
    if (window.RetroSound) window.RetroSound.click();
  }));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.retro-coming-soon:not(.hidden)').forEach(dialog => window.OSWindowManager.closeWindow(dialog.id));
  });

  // ====================================================
  // 5. FAQ ACCORDION
  // ====================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        if (window.RetroSound) window.RetroSound.click();
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });

});
