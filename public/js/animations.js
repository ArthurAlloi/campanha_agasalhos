document.addEventListener("DOMContentLoaded", () => {
    
    // 1. REGISTRAR PLUGINS
    gsap.registerPlugin(ScrollTrigger);

    // 2. INICIAR SMOOTH SCROLL (LENIS)
    // Isso faz o scroll ficar "amanteigado", essencial para esse tipo de site.
    let lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({
        // Aumente a duração para dar a sensação de "peso" (1.2 é padrão, 2.5 é bem suave)
        duration: 2.2, 
        
        // Easing exponencial para parar suavemente
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
        
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1, // Sensibilidade do mouse (1 = normal)
        smoothTouch: false, // Desative em mobile para performance nativa (melhor UX)
        touchMultiplier: 2,
      });

      function raf(time) {
        lenis.raf(time);
        ScrollTrigger.update(); 
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }


    // =========================================================
    // FUNÇÃO AUXILIAR: PREPARAR O TEXTO
    // =========================================================
    // Se o elemento já tem .word (seu HTML manual), usa eles.
    // Se não tem, usa SplitType para criar.
    const getTargets = (element) => {
        let targets = element.querySelectorAll('.word');
        
        if (targets.length === 0) {
            // Se não houver divisão manual, divide agora:
            const split = new SplitType(element, { types: 'lines, words', tagName: 'span' });
            targets = split.words;
        }
        return targets;
    };


    // =========================================================
    // 3. ANIMAÇÃO DO HERO (Entrada Imediata)
    // =========================================================
    const heroTitle = document.querySelector('#home-hero-title');
    if (heroTitle) {
        const words = getTargets(heroTitle);
        
        // Define estado inicial
        gsap.set(words, { y: 100, rotate: 5, opacity: 0 });

        // Animação de entrada
        gsap.to(words, {
            y: 0,
            rotate: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.04, // Efeito cascata entre as palavras
            ease: "power4.out",
            delay: 0.2
        });
    }


    // =========================================================
    // 4. ANIMAÇÃO DE SCROLL (Text Reveal Generico)
    // =========================================================
    // Seleciona títulos e parágrafos de TODAS as seções (exceto o título do hero que já foi)
    const scrollElements = document.querySelectorAll(
        '.section:not(#home-hero) h1, ' +
        '.section:not(#home-hero) h2, ' +
        '.section:not(#home-hero) h4, ' +
        '#home-reel-desc' // Garante que a descrição do reel entre
    );

    scrollElements.forEach(el => {
        const words = getTargets(el);

        // Estado inicial (escondido para baixo)
        gsap.set(words, { y: "110%", opacity: 0, rotate: 3 });

        // Gatilho de Scroll
        ScrollTrigger.create({
            trigger: el,
            start: "top 85%", // Começa quando o topo do texto está em 85% da tela
            onEnter: () => {
                gsap.to(words, {
                    y: "0%",
                    opacity: 1,
                    rotate: 0,
                    duration: 0.8,
                    stagger: 0.02,
                    ease: "power3.out",
                    overwrite: true
                });
            }
        });
    });


    // =========================================================
    // 5. ANIMAÇÃO DE COMPONENTES (Mapas, Vídeos, Botões)
    // =========================================================
    // Faz elementos não-textuais subirem suavemente
    const visualElements = document.querySelectorAll(
        '.map-container, .video-container, #home-reel-cta, #home-reel-thumb-wrapper'
    );

    visualElements.forEach(el => {
        gsap.set(el, { y: 50, opacity: 0 });

        ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            onEnter: () => {
                gsap.to(el, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out"
                });
            }
        });
    });

});