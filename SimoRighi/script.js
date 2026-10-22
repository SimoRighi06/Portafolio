(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Aggiorna l'anno del footer.
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Barra di avanzamento della pagina.
  const progressBar = $('#scrollProgress');
  let scrollTicking = false;
  const updateScrollProgress = () => {
    if (!progressBar) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollProgress);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollProgress();

  // Animazioni d'ingresso, con fallback per browser che non supportano IntersectionObserver.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Menu mobile accessibile.
  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#mobileMenu');
  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Apri menu');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  };
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Apri menu' : 'Chiudi menu');
      mobileMenu.classList.toggle('is-open', !isOpen);
      mobileMenu.setAttribute('aria-hidden', String(isOpen));
      document.body.classList.toggle('menu-open', !isOpen);
    });
    $$('a', mobileMenu).forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); });
  }

  // Filtri per categoria.
  const filterButtons = $$('.filter-btn');
  const projectCards = $$('.project-card');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      filterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      projectCards.forEach(card => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !visible);
        if (visible) card.removeAttribute('aria-hidden');
        else card.setAttribute('aria-hidden', 'true');
      });
    });
  });

  // Schede case study: dati demo modificabili qui.
  const projectData = {
    forma: {
      number: '01', title: 'Righi-IDE',
      description: 'impara con la AI a programme e impara sporcandoti le mani.',
      scope: 'Istruzione', year: '2026' 
    },
    nord: {
      number: '02', title: 'Nord Objects',
      description: 'Identità per un brand di oggetti quotidiani progettati per durare. La direzione visiva usa una palette naturale, una tipografia sobria e un linguaggio fotografico caldo per raccontare un approccio più consapevole al design.',
      scope: 'Brand identity · Visual system', year: '2025'
    },
    tempo: {
      number: '03', title: 'Tempo Finance',
      description: 'Un’interfaccia finanziaria pensata per rendere leggibili dati complessi. Gerarchia chiara, visualizzazioni immediate e componenti modulari aiutano le persone a capire velocemente ciò che conta.',
      scope: 'Product design · UI/UX', year: '2025'
    },
    zero: {
      number: '04', title: 'Zero Gravity',
      description: 'Un laboratorio di creative coding dedicato al movimento e alla tipografia cinetica. Un piccolo universo digitale dove esplorare ritmo, profondità e interazione senza perdere semplicità.',
      scope: 'Creative coding · Interaction', year: '2025'
    }
  };

  const modal = $('#projectModal');
  const modalBackdrop = $('#modalBackdrop');
  const modalClose = $('#modalClose');
  let lastFocusedElement = null;

  const openProject = key => {
    const data = projectData[key];
    if (!data || !modal) return;
    lastFocusedElement = document.activeElement;
    $('#modalNumber').textContent = data.number;
    $('#modalTitle').textContent = data.title;
    $('#modalDescription').textContent = data.description;
    $('#modalScope').textContent = data.scope;
    $('#modalYear').textContent = data.year;
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    modalBackdrop?.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    modalClose?.focus();
  };

  const closeProject = () => {
    if (!modal) return;
    if (typeof modal.close === 'function' && modal.open) modal.close();
    else modal.removeAttribute('open');
    modalBackdrop?.classList.remove('is-visible');
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  };

  projectCards.forEach(card => {
    card.addEventListener('click', () => openProject(card.dataset.project));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProject(card.dataset.project);
      }
    });
  });
  modalClose?.addEventListener('click', closeProject);
  modalBackdrop?.addEventListener('click', closeProject);
  modal?.addEventListener('click', event => {
    // Chiudi solo se viene cliccata l'area vuota del dialog.
    if (event.target === modal) closeProject();
  });
  modal?.addEventListener('close', () => {
    modalBackdrop?.classList.remove('is-visible');
    document.body.style.overflow = '';
  });
  $('.modal-contact')?.addEventListener('click', closeProject);

  // Cursore custom solo su dispositivi con puntatore preciso.
  const canUseCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth > 760;
  const cursorDot = $('.cursor-dot');
  const cursorRing = $('.cursor-ring');
  if (canUseCustomCursor && cursorDot && cursorRing) {
    document.body.classList.add('custom-cursor');
    let mouseX = -50, mouseY = -50, ringX = -50, ringY = -50;
    window.addEventListener('mousemove', event => {
      mouseX = event.clientX; mouseY = event.clientY;
      cursorDot.style.opacity = '1'; cursorRing.style.opacity = '1';
      cursorDot.style.left = `${mouseX}px`; cursorDot.style.top = `${mouseY}px`;
    }, { passive: true });
    const animateRing = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      window.requestAnimationFrame(animateRing);
    };
    animateRing();
    $$('a, button, .project-card').forEach(element => {
      element.addEventListener('mouseenter', () => cursorRing.classList.add('is-hover'));
      element.addEventListener('mouseleave', () => cursorRing.classList.remove('is-hover'));
    });
    window.addEventListener('mouseout', event => {
      if (!event.relatedTarget) { cursorDot.style.opacity = '0'; cursorRing.style.opacity = '0'; }
    });
  }

  // Leggero effetto magnetico per elementi CTA (disattivato in modalità reduced-motion).
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.magnetic').forEach(element => {
      element.addEventListener('mousemove', event => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * .08}px, ${y * .08}px)`;
      });
      element.addEventListener('mouseleave', () => { element.style.transform = ''; });
    });
  }
})();
