function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('active');
}


window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  if (window.scrollY > 30) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
});





(function () {
  // Espera DOM pronto (protege caso o script seja carregado no <head> sem defer)
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    const faders = Array.from(document.querySelectorAll(".fade-in"));

    if (!faders.length) {
      console.info("[anim] Nenhum elemento .fade-in encontrado.");
      return;
    }

    // Se o navegador suporta IntersectionObserver -> usa ele
    if ("IntersectionObserver" in window) {
      const options = {
        root: null,
        rootMargin: "0px 0px -10% 0px", // pega um pouco antes do elemento entrar totalmente
        threshold: 0.15, // entra quando ~15% do elemento estiver visível
      };

      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      }, options);

      faders.forEach((el) => {
        // se já estiver visível na carga inicial, marca imediatamente
        const rect = el.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight && rect.bottom >= 0;
        if (inViewport) {
          el.classList.add("visible");
        } else {
          io.observe(el);
        }
      });
    } else {
      // Fallback simples: adiciona a classe visible com um pequeno delay em sequência
      console.warn("[anim] IntersectionObserver não disponível — usando fallback.");
      faders.forEach((el, i) => {
        setTimeout(() => el.classList.add("visible"), 120 * i);
      });
    }

  });
})();