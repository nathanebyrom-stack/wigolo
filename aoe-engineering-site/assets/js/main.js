// AOE Engineering — shared front-end behaviour (no build step, no dependencies)
document.addEventListener('DOMContentLoaded', () => {

  /* Sticky header shadow */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-primary');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* Active nav link for current page */
  const here = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-primary a[href]').forEach(a => {
    const target = a.getAttribute('href').split('/').pop();
    if (target === here || (here === '' && target === 'index.html')) a.classList.add('active');
  });

  /* Reveal-on-scroll */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
    // Safety net: never leave content permanently hidden if the observer misses it.
    setTimeout(() => revealEls.forEach(el => el.classList.add('is-visible')), 4000);
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* Animated stat counters */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-GB')) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => io2.observe(el));
  }

  /* Contact form — builds a mailto: so the site works with zero backend */
  const form = document.querySelector('#enquiry-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name') || '';
      const company = data.get('company') || '';
      const email = data.get('email') || '';
      const phone = data.get('phone') || '';
      const sector = data.get('sector') || '';
      const message = data.get('message') || '';

      const subject = `Website enquiry — ${company || name}`;
      const body =
        `Name: ${name}\n` +
        `Company: ${company}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `Sector: ${sector}\n\n` +
        `${message}`;

      const mailto = `mailto:enquiries@aoeengineering.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;

      const success = document.querySelector('.form-success');
      if (success) success.classList.add('is-visible');
    });
  }

});
