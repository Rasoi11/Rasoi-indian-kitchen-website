/* Rasoi Waterfront — minimal interactions */
(function () {
  'use strict';

  // Current year in footer
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // "Open today" line in the utility bar — worked out from UK time so it is
  // right whatever timezone the visitor is in. Keep in sync with contact.html.
  const openEl = document.querySelector('[data-open-today]');
  if (openEl) {
    // Weekly hours, 0 = Sunday. Times as 'HH:MM'. Empty = closed.
    const WEEK = {
      0: [['12:00', '15:00'], ['17:00', '22:30']],
      1: [],
      2: [['17:00', '21:00']],
      3: [['17:00', '21:00']],
      4: [['17:00', '21:00']],
      5: [['17:00', '22:00']],
      6: [['12:00', '15:00'], ['17:00', '22:30']]
    };
    // Date-specific overrides (YYYY-MM-DD). These win over the weekly hours.
    const SPECIAL = {};
    const xmas = [['12:00', '15:00'], ['17:00', '22:00']];
    for (let d = 14; d <= 30; d++) SPECIAL['2026-12-' + d] = xmas;
    SPECIAL['2026-12-24'] = [['12:00', '22:00']];
    SPECIAL['2026-12-25'] = [];
    SPECIAL['2026-12-31'] = [['12:00', '23:00']];
    SPECIAL['2027-01-01'] = [['17:00', '22:00']];

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const pad = n => String(n).padStart(2, '0');
    const fmt = t => {
      let [h, m] = t.split(':').map(Number);
      const ap = h >= 12 ? 'pm' : 'am';
      h = h % 12 || 12;
      return m ? h + ':' + pad(m) + ap : h + ap;
    };
    const fmtRange = ([a, b]) => {
      const fa = fmt(a), fb = fmt(b);
      // "5–9pm" when both ends share am/pm, else "11am–3pm"
      return fa.slice(-2) === fb.slice(-2) ? fa.slice(0, -2) + '–' + fb : fa + '–' + fb;
    };
    const fmtDay = slots => slots.map(fmtRange).join(' · ');

    // Current date/time in the UK
    const parts = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
    const today = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
    const nowMins = +parts.hour * 60 + +parts.minute;
    const toMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

    const hoursFor = date => {
      const key = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
      return key in SPECIAL ? SPECIAL[key] : WEEK[date.getUTCDay()];
    };

    const todays = hoursFor(today);
    const stillOpenLater = todays.some(([, close]) => toMins(close) > nowMins);
    let text;
    if (todays.length && stillOpenLater) {
      text = 'Open today ' + fmtDay(todays);
    } else {
      // Closed for the rest of today — show the next day we open.
      for (let i = 1; i <= 14; i++) {
        const d = new Date(today.getTime() + i * 864e5);
        const h = hoursFor(d);
        if (!h.length) continue;
        const label = i === 1 ? 'tomorrow' : DAYS[d.getUTCDay()];
        text = (todays.length ? 'Closed now' : 'Closed today') + ' · Open ' + label + ' ' + fmtDay(h);
        break;
      }
    }
    if (text) openEl.textContent = text;
  }

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // close on link click (mobile) — but skip dropdown trigger anchors,
    // since those expand sub-menus rather than navigating away.
    nav.querySelectorAll('a').forEach(a => {
      const isDropdownTrigger = a.parentElement && a.parentElement.classList.contains('has-dropdown');
      if (isDropdownTrigger) return;
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Sticky header shadow on scroll
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Dropdown toggle (works on desktop click + mobile tap, complements CSS :hover).
  // Closes on outside click, Escape, or when another dropdown opens.
  const dropdownItems = document.querySelectorAll('.has-dropdown');
  dropdownItems.forEach(item => {
    const trigger = item.querySelector(':scope > a');
    if (!trigger) return;
    trigger.addEventListener('click', (e) => {
      // If the trigger is a real link (href != "#"), let mouse-only desktop hover handle it
      // and only intercept when nav is mobile-open OR on touch devices.
      const isMobile = window.matchMedia('(max-width: 960px)').matches;
      const isAnchor = (trigger.getAttribute('href') || '').replace(/^\s+|\s+$/g, '') === '#';
      if (isMobile || isAnchor) {
        e.preventDefault();
        const wasOpen = item.classList.contains('is-open');
        // Close any other open dropdowns first
        dropdownItems.forEach(o => { if (o !== item) o.classList.remove('is-open'); });
        item.classList.toggle('is-open', !wasOpen);
        trigger.setAttribute('aria-expanded', (!wasOpen).toString());
      }
    });
  });
  // Close all dropdowns on outside click or Escape
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dropdown')) {
      dropdownItems.forEach(o => o.classList.remove('is-open'));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdownItems.forEach(o => o.classList.remove('is-open'));
  });

  // Menu page — tab switching
  const menuTabs = document.querySelectorAll('.menu-tab');
  const menuPanes = document.querySelectorAll('.menu-pane');
  if (menuTabs.length && menuPanes.length) {
    const activate = (target) => {
      menuTabs.forEach(b => {
        const on = b.dataset.target === target;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      menuPanes.forEach(p => {
        const on = p.id === target;
        p.classList.toggle('is-active', on);
        if (on) {
          p.removeAttribute('hidden');
        } else {
          p.setAttribute('hidden', '');
        }
      });
      // Smoothly bring the menu section into view (without jumping past header).
      if (window.scrollY > 200) {
        const sec = document.querySelector('.menu-section');
        if (sec) {
          const headerH = (document.getElementById('site-header') || {}).offsetHeight || 0;
          const tabsH = (document.querySelector('.menu-tabs') || {}).offsetHeight || 0;
          const y = sec.getBoundingClientRect().top + window.scrollY - headerH - tabsH - 16;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    };
    menuTabs.forEach(btn => {
      btn.addEventListener('click', () => activate(btn.dataset.target));
    });
    // Hash-link support — e.g. /menus.html#cocktails opens that pane.
    const fromHash = () => {
      const id = location.hash.replace('#', '');
      if (id && document.querySelector('.menu-pane#' + CSS.escape(id))) {
        activate(id);
        return true;
      }
      return false;
    };
    fromHash();
    // In-page links (e.g. the hero's "New Year's Eve menu" button) change the
    // hash without reloading, so switch panes on hashchange too.
    window.addEventListener('hashchange', fromHash);
  }

  // Christmas promo popup — once per browser session, skipped on the
  // Christmas page itself (nothing to promote to someone already there).
  const SESSION_KEY = 'rasoiPromoShown';
  if (!/christmas\.html/.test(location.pathname) && !sessionStorage.getItem(SESSION_KEY)) {
    const modal = document.createElement('div');
    modal.className = 'promo-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'promo-modal-title');
    modal.hidden = true;
    modal.innerHTML =
      '<div class="promo-modal__card">' +
        '<button type="button" class="promo-modal__close" aria-label="Close">&times;</button>' +
        '<div class="promo-modal__media" aria-hidden="true">' +
          '<img src="assets/images/christmas-team-hero.jpg" alt="" loading="lazy" />' +
        '</div>' +
        '<div class="promo-modal__body">' +
          '<p class="eyebrow">Christmas &amp; New Year 2026</p>' +
          '<h2 id="promo-modal-title">Christmas &amp; <em>New Year’s Eve.</em></h2>' +
          '<p>Join us this festive season for our Christmas and New Year’s Eve set menus, plus full opening times over the holidays.</p>' +
          '<div class="promo-modal__actions">' +
            '<a href="christmas.html" class="btn btn--christmas">Christmas menu</a>' +
            '<a href="christmas.html#nye-dinner" class="btn btn--outline">New Year’s Eve menu</a>' +
            '<button type="button" class="promo-modal__dismiss">No thanks</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    const card = modal.querySelector('.promo-modal__card');
    let lastFocused = null;

    const closeModal = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      setTimeout(() => { modal.hidden = true; }, 350);
      if (lastFocused) lastFocused.focus();
    };

    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = card.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const openModal = () => {
      lastFocused = document.activeElement;
      modal.hidden = false;
      // Force reflow so the opening transition runs.
      void modal.offsetWidth;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKeydown);
      const closeBtn = modal.querySelector('.promo-modal__close');
      if (closeBtn) closeBtn.focus();
      sessionStorage.setItem(SESSION_KEY, '1');
    };

    modal.querySelector('.promo-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.promo-modal__dismiss').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Fires immediately (not after a delay) — a delay lets anyone who clicks
    // "Book" or "Order" right away leave the page before ever seeing this.
    openModal();
  }

  // Content is always visible. We reserve reveal animations for the manual
  // `.reveal` class only, avoiding flash-of-invisible-content on fast scroll.
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }
})();
