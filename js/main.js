/* Juan Gobbi — Medical Aesthetics Berlin */
/* Claude can do it better — Main JS */

'use strict';

/* ─── Navigation ──────────────────────────────────────────────────── */
class Nav {
  constructor() {
    this.nav        = document.querySelector('.nav');
    this.hamburger  = document.querySelector('.nav__hamburger');
    this.overlay    = document.querySelector('.nav__mobile-overlay');
    this.lastY      = 0;
    this.ticking    = false;

    if (!this.nav) return;
    this.init();
  }

  init() {
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    if (this.hamburger && this.overlay) {
      this.hamburger.addEventListener('click', () => this.toggleMenu());

      // Close overlay when a link inside is clicked
      this.overlay.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => this.closeMenu())
      );
    }
  }

  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > this.lastY && y > 80) {
        this.nav.classList.add('nav--hidden');
      } else {
        this.nav.classList.remove('nav--hidden');
      }
      this.lastY = y;
      this.ticking = false;
    });
  }

  toggleMenu() {
    const open = this.overlay.classList.toggle('is-open');
    this.hamburger.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  closeMenu() {
    this.overlay.classList.remove('is-open');
    this.hamburger.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

/* ─── FAQ Accordion ───────────────────────────────────────────────── */
class Accordion {
  constructor(selector) {
    this.triggers = Array.from(document.querySelectorAll(selector));
    if (!this.triggers.length) return;
    this.init();
  }

  init() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.toggle(trigger));
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle(trigger);
        }
      });
    });
  }

  toggle(trigger) {
    const isOpen   = trigger.getAttribute('aria-expanded') === 'true';
    const body     = trigger.nextElementSibling;

    // Close all
    this.triggers.forEach(t => {
      if (t !== trigger) {
        t.setAttribute('aria-expanded', 'false');
        const b = t.nextElementSibling;
        if (b) this.close(b);
      }
    });

    if (isOpen) {
      trigger.setAttribute('aria-expanded', 'false');
      this.close(body);
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      this.open(body);
    }
  }

  open(body) {
    const inner  = body.querySelector('.faq-body__inner');
    const height = inner ? inner.scrollHeight : body.scrollHeight;
    body.style.height = height + 'px';
    body.classList.add('is-open');
    body.addEventListener('transitionend', () => {
      if (body.classList.contains('is-open')) body.style.height = 'auto';
    }, { once: true });
  }

  close(body) {
    if (!body) return;
    body.style.height = body.scrollHeight + 'px';
    body.offsetHeight; // force reflow
    body.style.height = '0';
    body.classList.remove('is-open');
  }
}

/* ─── Reveal on scroll ────────────────────────────────────────────── */
class Reveal {
  constructor() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings in the same section
          const section = entry.target.closest('section, .reveal-group');
          const siblings = section
            ? Array.from(section.querySelectorAll('.reveal:not(.is-visible)'))
            : [];
          const delay = siblings.indexOf(entry.target);

          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, Math.max(0, delay * 80));

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
  }
}

/* ─── Smooth scrolling for anchor links ───────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─── Mark active nav link ────────────────────────────────────────── */
function markActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    // Strip trailing slash and filename for comparison
    const linkFile = href.split('/').pop().replace('.html', '');
    const pathFile = path.split('/').pop().replace('.html', '');
    if (
      (linkFile === pathFile && linkFile !== '') ||
      (linkFile === 'index' && (pathFile === '' || pathFile === 'index'))
    ) {
      link.classList.add('nav__link--active');
    }
  });
}

/* ─── Treatment Carousel ──────────────────────────────────────────── */
class Carousel {
  constructor(trackId) {
    this.track   = document.getElementById(trackId);
    if (!this.track) return;
    this.wrap    = this.track.parentElement;
    this.section = this.track.closest('.treatment-carousel');
    this.btnPrev = this.section && this.section.querySelector('.carousel-btn--prev');
    this.btnNext = this.section && this.section.querySelector('.carousel-btn--next');
    this.cards   = Array.from(this.track.children);
    this.current = 0;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
    if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prev());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.next());
    // Touch / swipe
    let startX = 0;
    this.track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    this.track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? this.next() : this.prev();
    });
  }

  visible() {
    return window.innerWidth >= 992 ? 3 : window.innerWidth >= 600 ? 2 : 1;
  }

  maxSlide() {
    return Math.max(0, this.cards.length - this.visible());
  }

  resize() {
    const cardW = this.wrap.offsetWidth / this.visible();
    this.cards.forEach(c => { c.style.width = cardW + 'px'; c.style.flexBasis = cardW + 'px'; });
    this.goTo(Math.min(this.current, this.maxSlide()));
  }

  goTo(idx) {
    this.current = Math.max(0, Math.min(idx, this.maxSlide()));
    const cardW  = this.wrap.offsetWidth / this.visible();
    this.track.style.transform = `translateX(${-this.current * cardW}px)`;
    
    // Update active cards
    const visibleCount = this.visible();
    this.cards.forEach((card, i) => {
      if (i >= this.current && i < this.current + visibleCount) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }
    });
    
    if (this.btnPrev) this.btnPrev.disabled = (this.current === 0);
    if (this.btnNext) this.btnNext.disabled = (this.current === this.maxSlide());
  }

  prev() { this.goTo(this.current - 1); }
  next() { this.goTo(this.current + 1); }
}

/* ─── FAQ Group Accordion (two-level) ────────────────────────────── */
class GroupAccordion {
  constructor() {
    this.triggers = Array.from(document.querySelectorAll('.faq-group__trigger'));
    if (!this.triggers.length) return;
    // Open first group by default
    const first = this.triggers[0];
    if (first) {
      first.setAttribute('aria-expanded', 'true');
      const body = first.nextElementSibling;
      if (body) { body.style.height = 'auto'; body.classList.add('is-open'); }
    }
    this.init();
  }

  init() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.toggle(trigger));
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(trigger); }
      });
    });
  }

  toggle(trigger) {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    // Close all groups first
    this.triggers.forEach(t => {
      if (t !== trigger) {
        t.setAttribute('aria-expanded', 'false');
        const b = t.nextElementSibling;
        if (b) this.close(b);
      }
    });
    if (isOpen) {
      trigger.setAttribute('aria-expanded', 'false');
      this.close(trigger.nextElementSibling);
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      this.open(trigger.nextElementSibling);
    }
  }

  open(body) {
    if (!body) return;
    const inner  = body.querySelector('.faq-list');
    const height = inner ? inner.scrollHeight : body.scrollHeight;
    body.style.height = height + 'px';
    body.classList.add('is-open');
    body.addEventListener('transitionend', () => {
      if (body.classList.contains('is-open')) body.style.height = 'auto';
    }, { once: true });
  }

  close(body) {
    if (!body) return;
    body.style.height = body.scrollHeight + 'px';
    body.offsetHeight; // force reflow
    body.style.height = '0';
    body.classList.remove('is-open');
  }
}

/* ─── Init ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  new Nav();
  new Accordion('.faq-trigger');
  new GroupAccordion();
  new Carousel('treatmentTrack');
  new Reveal();
  initSmoothScroll();
  markActiveNavLink();
});
