/**
 * OS.JS - Modern PC Taskbar & Windows Desktop Environment
 * Matches Windows 11 Light Taskbar with full interactive PC multi-window capabilities
 */

(function () {
  'use strict';

  // Global State
  let topZIndex = 100;
  let activeWindow = null;
  let soundEnabled = true;
  let audioCtx = null;
  let peekMinimizedList = [];

  // Sound Synthesizer (Web Audio API - 100% self contained)
  function initAudio() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const Sound = {
    click: function () {
      if (!soundEnabled) return;
      try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
      } catch (e) {}
    },

    buzzer: function () {
      if (!soundEnabled) return;
      try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.setValueAtTime(110, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.28);
      } catch (e) {}
    },

    tada: function () {
      if (!soundEnabled) return;
      try {
        initAudio();
        if (!audioCtx) return;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const startTime = audioCtx.currentTime + idx * 0.08;
          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.45);
        });
      } catch (e) {}
    },

    chime: function () {
      if (!soundEnabled) return;
      try {
        initAudio();
        if (!audioCtx) return;
        const chord = [392, 523.25, 659.25, 783.99];
        chord.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const start = audioCtx.currentTime + i * 0.07;
          gain.gain.setValueAtTime(0.1, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(start);
          osc.stop(start + 0.65);
        });
      } catch (e) {}
    }
  };

  window.RetroSound = Sound;

  // Window Manager Class
  class WindowManager {
    constructor() {
      this.windows = new Map();
      this.taskbarDock = document.getElementById('taskbar-dock');
      this.init();
    }

    init() {
      const winElements = document.querySelectorAll('.window');
      winElements.forEach((el) => {
        const id = el.id;
        const title = el.getAttribute('data-title') || 'Application';
        const icon = el.getAttribute('data-icon') || 'assets/icons/about_us.png';

        // Ensure all windows are closed/hidden by default on reload
        el.classList.add('hidden');
        el.classList.remove('minimized');
        el.classList.remove('active');

        this.windows.set(id, {
          element: el,
          title: title,
          icon: icon,
          isOpen: false,
          isMinimized: false,
          isMaximized: el.classList.contains('maximized')
        });

        this.setupWindowControls(el, id);
        this.setupDragging(el);
        this.setTaskbarState(id, false, false);
      });

      this.setupTaskbarDock();
      activeWindow = null;
    }

    setupTaskbarDock() {
      const dockApps = document.querySelectorAll('.taskbar-app');
      dockApps.forEach((appEl) => {
        const winId = appEl.getAttribute('data-window');
        const url = appEl.getAttribute('data-url');

        appEl.addEventListener('click', (e) => {
          e.stopPropagation();
          Sound.click();

          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
          }

          if (!winId) return;
          const winData = this.windows.get(winId);
          if (!winData) return;

          if (!winData.isOpen) {
            this.openWindow(winId);
          } else if (winData.isMinimized) {
            this.restoreWindow(winId);
          } else if (activeWindow === winId) {
            this.minimizeWindow(winId);
          } else {
            // When switching to another window, close previous and open this one
            this.openWindow(winId);
          }
        });
      });
    }

    setTaskbarState(winId, isRunning, isFocused) {
      const appEls = document.querySelectorAll(`.taskbar-app[data-window="${winId}"]`);
      appEls.forEach((appEl) => {
        if (isRunning) {
          appEl.classList.add('running');
        } else {
          appEl.classList.remove('running');
          appEl.classList.remove('focused');
        }

        if (isFocused) {
          appEl.classList.add('focused');
        } else {
          appEl.classList.remove('focused');
        }
      });
    }

    setupWindowControls(winEl, id) {
      // Bring to front on click anywhere in window
      winEl.addEventListener('mousedown', () => {
        this.focusWindow(id);
      });

      // Controls
      const btnMin = winEl.querySelector('.btn-minimize');
      const btnMax = winEl.querySelector('.btn-maximize');
      const btnClose = winEl.querySelector('.btn-close');

      if (btnMin) {
        btnMin.addEventListener('click', (e) => {
          e.stopPropagation();
          Sound.click();
          this.minimizeWindow(id);
        });
      }

      if (btnMax) {
        btnMax.addEventListener('click', (e) => {
          e.stopPropagation();
          Sound.click();
          this.toggleMaximize(id);
        });
      }

      if (btnClose) {
        btnClose.addEventListener('click', (e) => {
          e.stopPropagation();
          Sound.click();
          this.closeWindow(id);
        });
      }
    }

    setupDragging(winEl) {
      const titlebar = winEl.querySelector('.window-titlebar');
      if (!titlebar) return;

      let isDragging = false;
      let startX, startY, origLeft, origTop;

      const onMouseDown = (e) => {
        if (e.button !== 0 || e.target.closest('.window-controls')) return;
        if (winEl.classList.contains('maximized')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = winEl.getBoundingClientRect();
        origLeft = rect.left;
        origTop = rect.top;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newLeft = origLeft + dx;
        let newTop = origTop + dy;

        const taskbarH = 48;
        newTop = Math.max(0, Math.min(window.innerHeight - taskbarH - 30, newTop));
        newLeft = Math.max(-winEl.offsetWidth + 60, Math.min(window.innerWidth - 60, newLeft));

        winEl.style.left = `${newLeft}px`;
        winEl.style.top = `${newTop}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      titlebar.addEventListener('mousedown', onMouseDown);

      // Touch drag for mobile
      titlebar.addEventListener('touchstart', (e) => {
        if (e.target.closest('.window-controls') || winEl.classList.contains('maximized')) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        const rect = winEl.getBoundingClientRect();
        origLeft = rect.left;
        origTop = rect.top;
      }, { passive: true });

      titlebar.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        let newLeft = origLeft + dx;
        let newTop = origTop + dy;
        newTop = Math.max(0, Math.min(window.innerHeight - 50, newTop));
        winEl.style.left = `${newLeft}px`;
        winEl.style.top = `${newTop}px`;
      }, { passive: true });

      titlebar.addEventListener('touchend', () => {
        isDragging = false;
      });
    }

    openWindow(id) {
      const winData = this.windows.get(id);
      if (!winData) return;

      // Automatically close any previously open window so only one is open at a time
      this.windows.forEach((data, otherId) => {
        if (otherId !== id && data.isOpen) {
          this.closeWindow(otherId);
        }
      });

      winData.element.classList.remove('hidden');
      winData.element.classList.remove('minimized');
      winData.isOpen = true;
      winData.isMinimized = false;

      this.setTaskbarState(id, true, true);
      this.focusWindow(id);
      if (winData.element.classList.contains('retro-coming-soon')) {
        const el = winData.element;
        el.style.left = Math.max(8, (window.innerWidth - el.offsetWidth) / 2) + 'px';
        el.style.top = Math.max(8, (window.innerHeight - el.offsetHeight - 60) / 2) + 'px';
        el.querySelector('.retro-dialog-actions button').focus();
        Sound.buzzer();
      } else {
        Sound.click();
      }
    }

    closeWindow(id) {
      const winData = this.windows.get(id);
      if (!winData) return;

      winData.element.classList.add('hidden');
      winData.isOpen = false;
      winData.isMinimized = false;

      this.setTaskbarState(id, false, false);

      if (activeWindow === id) {
        activeWindow = null;
        let highest = 0;
        let nextToFocus = null;
        this.windows.forEach((data, wId) => {
          if (data.isOpen && !data.isMinimized) {
            const z = parseInt(data.element.style.zIndex || '0', 10);
            if (z > highest) {
              highest = z;
              nextToFocus = wId;
            }
          }
        });
        if (nextToFocus) {
          this.focusWindow(nextToFocus);
        }
      }
    }

    minimizeWindow(id) {
      const winData = this.windows.get(id);
      if (!winData) return;

      winData.element.classList.add('minimized');
      winData.isMinimized = true;

      this.setTaskbarState(id, true, false);

      if (activeWindow === id) {
        activeWindow = null;
      }
    }

    restoreWindow(id) {
      const winData = this.windows.get(id);
      if (!winData) return;

      // Automatically close any previously open window so only one is open at a time
      this.windows.forEach((data, otherId) => {
        if (otherId !== id && data.isOpen) {
          this.closeWindow(otherId);
        }
      });

      winData.element.classList.remove('minimized');
      winData.isMinimized = false;
      this.focusWindow(id);
    }

    toggleMaximize(id) {
      const winData = this.windows.get(id);
      if (!winData) return;

      const el = winData.element;
      const isMax = el.classList.toggle('maximized');
      winData.isMaximized = isMax;

      const maxBtn = el.querySelector('.btn-maximize');
      if (maxBtn) {
        maxBtn.textContent = isMax ? '🗗' : '🗖';
      }
    }

    focusWindow(id) {
      const winData = this.windows.get(id);
      if (!winData) return;

      topZIndex += 2;
      winData.element.style.zIndex = topZIndex;

      // Update active classes on windows
      this.windows.forEach((data, wId) => {
        if (wId === id) {
          data.element.classList.add('active');
          this.setTaskbarState(wId, true, true);
        } else {
          data.element.classList.remove('active');
          this.setTaskbarState(wId, data.isOpen, false);
        }
      });

      activeWindow = id;
    }

    togglePeekDesktop() {
      Sound.click();
      let anyVisible = false;

      this.windows.forEach((data) => {
        if (data.isOpen && !data.isMinimized) {
          anyVisible = true;
        }
      });

      if (anyVisible) {
        peekMinimizedList = [];
        this.windows.forEach((data, wId) => {
          if (data.isOpen && !data.isMinimized) {
            peekMinimizedList.push(wId);
            this.minimizeWindow(wId);
          }
        });
      } else {
        peekMinimizedList.forEach((wId) => {
          this.restoreWindow(wId);
        });
        peekMinimizedList = [];
      }
    }
  }

  // Setup Desktop Icons Click & Selection
  function setupDesktopIcons(wm) {
    const icons = document.querySelectorAll('.desktop-icon');

    icons.forEach((icon) => {
      const targetWindowId = icon.getAttribute('data-window');
      const url = icon.getAttribute('data-url');

      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        icons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
        if (url) {
          Sound.click();
          window.open(url, '_blank', 'noopener,noreferrer');
        } else if (targetWindowId) {
          wm.openWindow(targetWindowId);
        }
      });

      icon.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (url) {
          Sound.click();
          window.open(url, '_blank', 'noopener,noreferrer');
        } else if (targetWindowId) {
          wm.openWindow(targetWindowId);
        }
      });
    });

    document.getElementById('desktop').addEventListener('click', (e) => {
      if (e.target.id === 'desktop') {
        icons.forEach(i => i.classList.remove('selected'));
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('start-button').classList.remove('active');
        document.getElementById('context-menu').style.display = 'none';
      }
    });
  }

  // Setup Start Menu
  function setupStartMenu(wm) {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');

    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      Sound.click();
      const isHidden = startMenu.classList.toggle('hidden');
      startBtn.classList.toggle('active', !isHidden);
    });

    // Start menu item clicks
    const startItems = startMenu.querySelectorAll('.start-grid-item, .start-action-item');
    startItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = item.getAttribute('data-action') || item.getAttribute('data-window');
        const url = item.getAttribute('data-url');
        startMenu.classList.add('hidden');
        startBtn.classList.remove('active');

        if (url) {
          Sound.click();
          window.open(url, '_blank', 'noopener,noreferrer');
        } else if (target && target.startsWith('win-')) {
          wm.openWindow(target);
        } else if (target === 'shutdown') {
          showBSOD();
        } else if (target === 'wallpaper') {
          cycleWallpaper();
        }
      });
    });

    // Start search filter
    const searchInput = document.getElementById('start-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        startMenu.querySelectorAll('.start-grid-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) ? 'flex' : 'none';
        });
      });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        startMenu.classList.add('hidden');
        startBtn.classList.remove('active');
      }
    });
  }

  // Real-Time System Tray Clock & Date
  function startClock() {
    const timeEl = document.getElementById('system-time');
    const dateEl = document.getElementById('system-date');
    if (!timeEl) return;

    function update() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      timeEl.textContent = `${hours}:${minutes} ${ampm}`;

      if (dateEl) {
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const year = now.getFullYear();
        dateEl.textContent = `${month}/${day}/${year}`;
      }
    }

    update();
    setInterval(update, 1000);
  }

  // Audio Toggle in System Tray
  function setupAudioToggle() {
    const toggle = document.getElementById('tray-audio');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      toggle.innerHTML = soundEnabled ? '🔊' : '🔇';
      toggle.title = soundEnabled ? 'Sound: Enabled' : 'Sound: Muted';
      if (soundEnabled) Sound.click();
    });
  }

  // Peek Show Desktop (Win+D line)
  function setupPeekDesktop(wm) {
    const peekBtn = document.getElementById('btn-peek-desktop');
    if (peekBtn) {
      peekBtn.addEventListener('click', () => {
        wm.togglePeekDesktop();
      });
    }
  }

  // Wallpaper Switcher
  const wallpapers = ['theme-bliss', 'theme-teal', 'theme-matrix', 'theme-vaporwave'];
  let currentWpIndex = 0;

  function cycleWallpaper() {
    const desktop = document.getElementById('desktop');
    wallpapers.forEach(w => desktop.classList.remove(w));
    currentWpIndex = (currentWpIndex + 1) % wallpapers.length;
    desktop.classList.add(wallpapers[currentWpIndex]);
    Sound.click();
  }

  // Right-Click Context Menu
  function setupContextMenu(wm) {
    const menu = document.getElementById('context-menu');
    const desktop = document.getElementById('desktop');

    desktop.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      menu.style.display = 'block';
      let x = e.clientX;
      let y = e.clientY;
      if (x + 180 > window.innerWidth) x = window.innerWidth - 180;
      if (y + 160 > window.innerHeight) y = window.innerHeight - 160;
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    });

    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    const ctxItems = menu.querySelectorAll('.context-item');
    ctxItems.forEach(item => {
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        if (action === 'wallpaper') {
          cycleWallpaper();
        } else if (action && action.startsWith('win-')) {
          wm.openWindow(action);
        } else if (action === 'refresh') {
          Sound.click();
        }
      });
    });
  }

  // BSOD Prank / Shutdown
  function showBSOD() {
    Sound.buzzer();
    const bsod = document.getElementById('bsod-screen');
    if (!bsod) return;
    bsod.classList.remove('hidden');

    const exitBsod = () => {
      bsod.classList.add('hidden');
      Sound.chime();
      document.removeEventListener('keydown', exitBsod);
    };

    bsod.onclick = exitBsod;
    document.addEventListener('keydown', exitBsod);
  }

  // Boot initialization
  document.addEventListener('DOMContentLoaded', () => {
    const wm = new WindowManager();
    window.OSWindowManager = wm;

    setupDesktopIcons(wm);
    setupStartMenu(wm);
    startClock();
    setupAudioToggle();
    setupPeekDesktop(wm);
    setupContextMenu(wm);

    const unlockAudio = () => {
      initAudio();
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);

    setTimeout(() => {
      Sound.chime();
    }, 600);
  });
})();
