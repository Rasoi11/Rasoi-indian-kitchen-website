/* Rasoi Waterfront — minimal interactions */
(function () {
  'use strict';

  // Current year in footer
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

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
    if (location.hash) {
      const id = location.hash.replace('#', '');
      if (document.getElementById(id) && document.querySelector('.menu-pane#' + CSS.escape(id))) {
        activate(id);
      }
    }
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
          '<p class="eyebrow">Christmas 2026</p>' +
          '<h2 id="promo-modal-title">A very Rasoi <em>Christmas.</em></h2>' +
          '<p>Join us this festive season for our Christmas set lunch, full opening times over the holidays, and a New Year’s Eve to remember.</p>' +
          '<div class="promo-modal__actions">' +
            '<a href="christmas.html" class="btn btn--christmas">See our Christmas menu</a>' +
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

    setTimeout(openModal, 4000);
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
