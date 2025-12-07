document.addEventListener("DOMContentLoaded", () => {

  gsap.registerPlugin(ScrollTrigger);

  // -----------------------------
  // SPLITTYPE: transformar tudo
  // -----------------------------
  const heroTitle = new SplitType("#home-hero-title", { types: "words" });
  const reelTitle = new SplitType("#home-reel-title", { types: "words" });
  const reelDesc = new SplitType("#home-reel-desc", { types: "words" });

  // -----------------------------
  // HERO TITLE – entrada inicial
  // -----------------------------
  gsap.from(heroTitle.words, {
    y: 60,
    rotate: 12,
    opacity: 0,
    stagger: 0.06,
    duration: 0.9,
    delay: 0.3,
    ease: "cubic-bezier(.4,0,.1,1)"
  });

  // -----------------------------
  // LOGO – entrada própria
  // -----------------------------
  gsap.from("#index-logo", {
    opacity: 0,
    scale: 0.7,
    y: 40,
    duration: 1.2,
    ease: "cubic-bezier(.17, .84, .43, 1.2)",
  });

  // -----------------------------
  // REEL TITLE – scroll suave
  // -----------------------------
  gsap.from(reelTitle.words, {
    scrollTrigger: {
      trigger: "#home-reel-title",
      start: "top 85%",
    },
    y: 45,
    opacity: 0,
    duration: 0.9,
    stagger: 0.05,
    ease: "cubic-bezier(.4,0,.1,1)",
  });

  // -----------------------------
  // REEL DESCRIPTION – scroll
  // -----------------------------
  gsap.from(reelDesc.words, {
    scrollTrigger: {
      trigger: "#home-reel-content",
      start: "top 80%",
    },
    y: 35,
    opacity: 0,
    duration: 1,
    stagger: 0.02,
    ease: "cubic-bezier(.4,0,.1,1)",
  });

  // -----------------------------
  // LOCALIZAÇÃO SECTION
  // -----------------------------
  gsap.from("#home-local .word", {
    scrollTrigger: {
      trigger: "#home-local",
      start: "top 85%"
    },
    y: 30,
    opacity: 0,
    stagger: 0.05,
    duration: 0.8,
    ease: "cubic-bezier(.4,0,.1,1)"
  });

  gsap.from("#home-camp-subtitle", {
    scrollTrigger: {
      trigger: "#home-local",
      start: "top 80%"
    },
    opacity: 0,
    y: 25,
    duration: 1,
  });

});
