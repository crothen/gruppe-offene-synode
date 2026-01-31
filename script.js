/* ============================================
   Gruppe Offene Synode — Scripts
   ============================================ */

(function () {
  'use strict';

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Mobile nav toggle ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // --- Scroll-triggered animations ---
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const animatedElements = document.querySelectorAll(
      '.about-card, .timeline-item, .doc-card, .contact-form-wrapper, .contact-card'
    );

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // If no IntersectionObserver or reduced motion, show everything
    document.querySelectorAll(
      '.about-card, .timeline-item, .doc-card, .contact-form-wrapper, .contact-card'
    ).forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // --- Contact form validation ---
  const form = document.getElementById('contactForm');

  if (form) {
    form.addEventListener('submit', function (e) {
      let valid = true;

      // Name
      const nameInput = document.getElementById('name');
      const nameGroup = nameInput.closest('.form-group');
      if (!nameInput.value.trim()) {
        nameGroup.classList.add('error');
        valid = false;
      } else {
        nameGroup.classList.remove('error');
      }

      // Email
      const emailInput = document.getElementById('email');
      const emailGroup = emailInput.closest('.form-group');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        emailGroup.classList.add('error');
        valid = false;
      } else {
        emailGroup.classList.remove('error');
      }

      // Message
      const msgInput = document.getElementById('message');
      const msgGroup = msgInput.closest('.form-group');
      if (!msgInput.value.trim()) {
        msgGroup.classList.add('error');
        valid = false;
      } else {
        msgGroup.classList.remove('error');
      }

      if (!valid) {
        e.preventDefault();
      }
    });

    // Clear errors on input
    form.querySelectorAll('input, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        this.closest('.form-group').classList.remove('error');
      });
    });
  }

  // --- Termine filter with sliding pill ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const timelineItems = document.querySelectorAll('.timeline-item[data-category]');
  const filterBar = document.querySelector('.filter-bar');

  // Create sliding pill element
  var filterPill = document.createElement('div');
  filterPill.className = 'filter-pill';
  if (filterBar) {
    filterBar.insertBefore(filterPill, filterBar.firstChild);
  }

  // Position pill over active button
  function updatePill(targetBtn, animate) {
    if (!targetBtn || !filterPill || !filterBar) return;
    filterPill.style.width = targetBtn.offsetWidth + 'px';
    filterPill.style.transform = 'translateX(' + targetBtn.offsetLeft + 'px)';
    if (!animate) {
      filterPill.style.transition = 'none';
      filterPill.offsetHeight; // force reflow
      filterPill.style.transition = '';
    }
  }

  // Initialize pill position
  var initialActive = filterBar ? filterBar.querySelector('.filter-btn.active') : null;
  if (initialActive) {
    updatePill(initialActive, false);
  }

  // Reposition on resize
  window.addEventListener('resize', function () {
    var activeBtn = filterBar ? filterBar.querySelector('.filter-btn.active') : null;
    if (activeBtn) updatePill(activeBtn, false);
  });

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = this.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');

      // Slide pill to new position
      updatePill(this, true);

      // Filter items with staggered animation
      var showDelay = 0;
      timelineItems.forEach(function (item) {
        var matches = filter === 'all' || item.getAttribute('data-category') === filter;
        if (matches) {
          // Show item with stagger
          item.classList.remove('hidden');
          item.classList.add('filter-entering');
          item.style.animationDelay = showDelay + 'ms';
          showDelay += 60;
          // Clean up animation class after it finishes
          item.addEventListener('animationend', function handler() {
            item.classList.remove('filter-entering');
            item.style.animationDelay = '';
            item.removeEventListener('animationend', handler);
          });
          // Ensure visible class is set
          item.classList.add('visible');
        } else {
          item.classList.add('hidden');
          item.classList.remove('filter-entering');
          item.style.animationDelay = '';
        }
      });
    });
  });

  // --- Smooth scroll for all anchor links (fallback for older browsers) ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
