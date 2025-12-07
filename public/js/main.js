// header.js - Versão robusta (Minerva)
// Carregar após DOM estar pronto (colocar <script defer> ou no final do body)

(function () {
  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const safeLog = (...args) => { if (window && window.console) console.log('[header]', ...args); };

  // ---------- Seletores principais (pegue elementos com fallback) ----------
  const header = $('#header');
  const headerContainer = $('#header-container');
  const headerBackground = $('#header-background');
  const menuBtn = $('#header-right-menu-btn');
  const talkBtn = $('#header-right-talk-btn');
  const talkBtnPlaceholder = $('#header-right-talk-btn-placeholder');
  const loginBtn = $('#header-login-btn');
  const cadastroBtn = $('#header-cadastro-btn');
  const logoutBtn = $('#header-logout-btn');
  const headerMenu = $('#header-menu');
  const menuLinks = $$('.header-menu-link');
  // elemento opcional que troca texto "Menu" / "Fechar"
  const menuTitle = $('#header-right-menu-title') || null;
  

  // ---------- Debug: elementos ausentes ----------
  const missing = [];
  if (!header) missing.push('header (#header)');
  if (!headerBackground) missing.push('headerBackground (#header-background)');
  if (!menuBtn) missing.push('menuBtn (#header-right-menu-btn)');
  if (!talkBtn) missing.push('talkBtn (#header-right-talk-btn)');
  if (!headerMenu) missing.push('headerMenu (#header-menu)');

  if (missing.length) {
    safeLog('Aviso: alguns elementos não foram encontrados no DOM:', missing);
    // Não abortamos: o script tentará atuar apenas nos que existem.
  } else {
    safeLog('Todos os seletores essenciais encontrados. Iniciando inicialização...');
  }

  // ---------- Estado ----------
  let menuIsOpen = false;

  // ---------- Utility para forçar reflow (útil para transições) ----------
  function reflow(el) { void (el && el.offsetHeight); }

  // ---------- Remove inlines que bloqueiam animações ----------
  function cleanInlineStyles() {
    // Alguns elementos no seu HTML já tinham inline-style (transform/opacity/pointer-events).
    // Inline style tem prioridade sobre CSS; removemos propriedades específicas ou o attribute todo.
    [talkBtn, menuBtn, headerBackground, headerMenu].forEach((el) => {
      if (!el) return;
      // Remova transform/opacity/display/pointer-events inline que possam ter sido colocados.
      el.style.removeProperty('transform');
      el.style.removeProperty('opacity');
      el.style.removeProperty('display');
      el.style.removeProperty('pointer-events');
    });

    // Se o botão talk tem um <a> cobrindo tudo, garantir que não bloqueie pointer-events
    const talkLink = talkBtn && talkBtn.querySelector('a');
    if (talkLink) talkLink.style.removeProperty('pointer-events');

    safeLog('Limpeza de inline styles concluída.');
  }

  // ---------- Inicialização visual ao carregar a página ----------
  function initialShow() {
    
    if (header) {
      // Garante que transform/opacity do CSS possam animar
      header.style.transition = header.style.transition || 'transform .35s ease, opacity .35s ease';
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }

    // === LOGO Animation ===
    const logo = document.getElementById("header-logo");
    if (logo) {
      logo.style.opacity = "0";
      logo.style.transform = "translateY(15px) scale(0.95)";
    
      requestAnimationFrame(() => {
        reflow(logo);
        setTimeout(() => {
          logo.style.transition =
            "transform .65s cubic-bezier(.17, .84, .43, 1.2), opacity .5s ease";
          logo.style.transform = "translateY(0) scale(1)";
          logo.style.opacity = "1";
        }, 120);
      });
    }

    // Mostrar o talkBtn e menuBtn respeitando transições do CSS
    // Os elementos no CSS começam em scale(0) ou transform escondido; aqui nós "ativamos" via inline
    // usando requestAnimationFrame para garantir que a mudança seja animável.
    if (talkBtn) {
      talkBtn.style.opacity = '0';
      talkBtn.style.transform = 'scale(0)';
      // forçar reflow e depois ativar
      requestAnimationFrame(() => {
        reflow(talkBtn);
        setTimeout(() => {
          talkBtn.style.transition = talkBtn.style.transition || 'transform .35s cubic-bezier(.4,0,.1,1), opacity .28s ease';
          talkBtn.style.transform = 'scale(1)';
          talkBtn.style.opacity = '1';
        }, 60);
      });
    }

    if (menuBtn) {
      menuBtn.style.opacity = '0';
      menuBtn.style.transform = 'translate3d(0, 0.4em, 0) scale(0.95)';
      requestAnimationFrame(() => {
        reflow(menuBtn);
        setTimeout(() => {
          menuBtn.style.transition = menuBtn.style.transition || 'transform .35s cubic-bezier(.4,0,.1,1), opacity .28s ease';
          menuBtn.style.transform = 'translate3d(0,0,0) scale(1)';
          menuBtn.style.opacity = '1';
          menuBtn.style.pointerEvents = 'auto';
        }, 140);
      });
    }

    if (loginBtn) animateAuthBtn(loginBtn, 100);
    if (cadastroBtn) animateAuthBtn(cadastroBtn, 220);
    if (logoutBtn) animateAuthBtn(logoutBtn, 160);

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.location.href = "/logout";
      });
    }


    function addHoverAnimation(btn) {
      if (!btn) return;

        btn.addEventListener("mouseenter", () => {
          btn.style.transition = "transform .25s cubic-bezier(.4,0,.1,1), background-color .25s";
          btn.style.transform = "scale(1.06)";
          btn.style.filter = "brightness(1.12)";
        });
      
        btn.addEventListener("mouseleave", () => {
          btn.style.transition = "transform .3s cubic-bezier(.4,0,.1,1), background-color .25s";
          btn.style.transform = "scale(1)";
          btn.style.filter = "brightness(1)";
        });
      
        btn.addEventListener("mousedown", () => {
          btn.style.transform = "scale(0.96)";
        });
      
        btn.addEventListener("mouseup", () => {
          btn.style.transform = "scale(1.06)";
        });
    }

    addHoverAnimation(loginBtn);
    addHoverAnimation(cadastroBtn);
    addHoverAnimation(logoutBtn);

  }

  function animateAuthBtn(el, delay = 0) {
    if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'scale(0)';
      requestAnimationFrame(() => {
        reflow(el);
        setTimeout(() => {
          el.style.transition = el.style.transition || 'transform .35s cubic-bezier(.4,0,.1,1), opacity .28s ease';
          el.style.transform = 'scale(1)';
          el.style.opacity = '1';
        }, delay);
    });
  }

  // ---------- Abrir / Fechar Menu ----------
  function openMenu() {
    if (!headerMenu) return;
    menuIsOpen = true;
    safeLog('Abrindo menu...');
    headerBackground && headerBackground.classList.add('--opened');
    menuBtn && menuBtn.classList.add('--opened');
    headerMenu.classList.add('--opened');
    headerMenu.style.pointerEvents = 'auto';
    if (menuTitle) menuTitle.innerText = 'Fechar';
    // animação sequencial dos links: o CSS já tem transitions ligadas ao parent `. --opened`,
    // mas como fallback vamos aplicar small inline changes para garantir visibilidade.
    menuLinks.forEach((link, i) => {
      // reset
      link.style.transition = link.style.transition || 'transform .45s cubic-bezier(.4,0,.1,1), opacity .45s ease';
      link.style.transform = 'translateX(-10px)';
      link.style.opacity = '0';
      // aparecer em cascade
      setTimeout(() => {
        link.style.transform = 'translateX(0)';
        link.style.opacity = '1';
        // permitir pointer-events (o CSS também faz isso via #header-menu.--opened a { pointer-events: auto } )
        link.style.pointerEvents = 'auto';
      }, 120 + i * 60);
    });
  }

  function closeMenu() {
    if (!headerMenu) return;
    menuIsOpen = false;
    safeLog('Fechando menu...');
    headerBackground && headerBackground.classList.remove('--opened');
    menuBtn && menuBtn.classList.remove('--opened');
    headerMenu.classList.remove('--opened');
    headerMenu.style.pointerEvents = 'none';
    if (menuTitle) menuTitle.innerText = 'Menu';
    // esconder links
    menuLinks.forEach((link, i) => {
      // animar para trás
      setTimeout(() => {
        link.style.transform = 'translateX(-12px)';
        link.style.opacity = '0';
        link.style.pointerEvents = 'none';
      }, 20 + i * 15);
    });
  }

  // ---------- Toggle ----------
  function toggleMenu() {
    if (menuIsOpen) closeMenu();
    else openMenu();
  }

  // ---------- Fechar quando clica no background ----------
  function backgroundClickHandler(e) {
    if (!menuIsOpen) return;
    // garantir que clicou no background e não em filho
    if (e.target === headerBackground) {
      closeMenu();
    }
  }

  // ---------- Attach event listeners com segurança ----------
  function attachEvents() {
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
      });
      // acessibilidade: aria-expanded
      menuBtn.setAttribute('aria-expanded', 'false');
    }

    if (headerBackground) {
      headerBackground.addEventListener('click', backgroundClickHandler);
    }

    // ESC -> fechar
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && menuIsOpen) {
        closeMenu();
      }
    });

    // Quando o menu for aberto/fechado, atualizamos aria-expanded
    // Observador simples
    const updateAria = () => {
      if (menuBtn) menuBtn.setAttribute('aria-expanded', menuIsOpen ? 'true' : 'false');
    };
    // Intervalo pequeno para manter aria em sincronia (ou chamar em open/close)
    const originalOpen = openMenu;
    const originalClose = closeMenu;
    // envolvemos para atualizar aria
    openMenu = function () {
      originalOpen();
      updateAria();
    };
    closeMenu = function () {
      originalClose();
      updateAria();
    };

    function attachAuthRedirect(btn) {
      if (!btn) return;
      btn.addEventListener("click", () => {
        const url = btn.dataset.href;
        if (url) window.location.href = url;
      });
    }

    attachAuthRedirect(loginBtn);
    attachAuthRedirect(cadastroBtn);
    
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        const form = document.getElementById("logout-form");
        if (form) form.submit();
      });
    }

  }

  // ---------- Inicial bootstrap ----------
  function init() {
    safeLog('Inicializando header.js...');
    cleanInlineStyles();
    attachEvents();
    // garantir um pequeno delay para respeitar estilos CSS carregados
    window.setTimeout(initialShow, 80);
    safeLog('header.js pronto.');
  }

  // Start when DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // start async to ensure styles have aplicado
    setTimeout(init, 30);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  (function highlightMenu() {
  const path = window.location.pathname;

    document.querySelectorAll(".header-menu-link").forEach(link => {
      const href = link.getAttribute("href");

      // ignorar botões e itens sem href
      if (!href) return;

      // remover ativo antigo
      link.classList.remove("--active");

      // comparar a rota
      if (href === path) {
        link.classList.add("--active");
      }
    });
  })();

})();