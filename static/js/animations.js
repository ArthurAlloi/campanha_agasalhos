// ==========================================
// GSAP + ScrollTrigger + SplitType SETUP
// ==========================================

gsap.registerPlugin(ScrollTrigger);

// Divide textos em linhas e palavras
document.querySelectorAll("[data-split]").forEach(el => {
  new SplitType(el, {
    types: "lines, words",
    tagName: "span"
  });
});

// ==========================================
// ANIMAÇÃO DOS TÍTULOS (Lusion-like)
// ==========================================

gsap.utils.toArray(".split-title").forEach(title => {
  const words = title.querySelectorAll(".word");

  gsap.from(words, {
    scrollTrigger: {
      trigger: title,
      start: "top 85%",
      toggleActions: "play none none reverse"
    },
    opacity: 0,
    y: 40,
    duration: 0.6,
    stagger: 0.05,
    ease: "power3.out"
  });
});

// ==========================================
// ANIMAÇÃO DOS PARÁGRAFOS
// ==========================================

gsap.utils.toArray(".split-paragraph").forEach(p => {
  const words = p.querySelectorAll(".word");

  gsap.from(words, {
    scrollTrigger: {
      trigger: p,
      start: "top 92%",
      toggleActions: "play none none reverse"
    },
    opacity: 0,
    y: 25,
    duration: 0.4,
    stagger: 0.02,
    ease: "power2.out"
  });
});

// ==========================================
// ANIMAÇÃO DOS CARDS (fade suave)
// ==========================================

gsap.utils.toArray(".fade-in-item").forEach(item => {
  gsap.from(item, {
    scrollTrigger: {
      trigger: item,
      start: "top 90%",
      toggleActions: "play none none reverse"
    },
    opacity: 0,
    y: 60,
    duration: 0.6,
    ease: "power3.out"
  });
});

// ==========================================
// LINHA AZUL ANIMADA (efeito igual Lusion)
// ==========================================
//
// Funciona com scrub (anima conforme o scroll)
// A linha cresce conforme você desce a página
// ==========================================

gsap.from(".hero-line", {
  scrollTrigger: {
    trigger: "#hero",
    start: "top top",
    end: "bottom top",
    scrub: true
  },
  scaleX: 0,
  transformOrigin: "left center",
  ease: "none"
});

// ==========================================
// PARALLAX SUAVE NO HERO (opcional)
// ==========================================
//
// Dá profundidade ao texto
// ==========================================

gsap.to(".hero-content", {
  scrollTrigger: {
    trigger: "#hero",
    start: "top top",
    end: "bottom top",
    scrub: true
  },
  y: -80,
  ease: "none"
});

// ==========================================
// SCROLL SUAVE MELHORADO (fisicamente real)
// ==========================================
//
// Deixa o site mais premium sem biblioteca extra
// ==========================================

(function smoothScroll() {
  const body = document.body;
  const scrollWrap = document.scrollingElement || document.documentElement;
  let height = body.getBoundingClientRect().height - 1;
  let speed = 0.08;
  let offset = 0;

  body.style.position = "fixed";
  body.style.top = "0";
  body.style.left = "0";
  body.style.width = "100%";

  function updateHeight() {
    height = scrollWrap.scrollHeight - window.innerHeight;
    document.body.style.height = scrollWrap.scrollHeight + "px";
  }

  updateHeight();
  window.addEventListener("resize", updateHeight);

  function animate() {
    offset += (scrollWrap.scrollTop - offset) * speed;
    body.style.transform = `translateY(-${offset}px)`;
    requestAnimationFrame(animate);
  }

  animate();
})();
