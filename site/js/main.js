/* ============================================================
   AMARA am See — interactions
   GSAP + ScrollTrigger + SplitText + Lenis
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;
const isDesktop = () => window.matchMedia("(min-width: 841px)").matches;

/* ------------------------------------------------------------
   Reduced motion: show everything, no scroll hijacking
   ------------------------------------------------------------ */
if (prefersReduced) {
  document.body.classList.add("no-anim");
  const pre = document.getElementById("preloader");
  if (pre) pre.remove();
} else {
  init();
}

function init() {
  /* ----------------------------------------------------------
     Smooth scroll (Lenis) driven by GSAP's ticker
     ---------------------------------------------------------- */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links -> smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      if (menuOpen) toggleMenu(false);
      lenis.scrollTo(target, { offset: id === "#book" ? -window.innerHeight * 0.2 : 0 });
    });
  });

  /* ----------------------------------------------------------
     Split text (wait for fonts so line breaks are correct)
     ---------------------------------------------------------- */
  let heroSplits = [];
  let manifestoSplit = null;

  const buildSplits = () => {
    heroSplits = [...document.querySelectorAll(".split-lines")].map(
      (el) => new SplitText(el, { type: "lines", mask: "lines", linesClass: "line" })
    );
    heroSplits.forEach((s) => gsap.set(s.lines, { yPercent: 115 }));

    document.querySelectorAll(".reveal-lines").forEach((el) => {
      const s = new SplitText(el, { type: "lines", mask: "lines", linesClass: "line" });
      gsap.from(s.lines, {
        yPercent: 115,
        duration: 1.1,
        stagger: 0.09,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    manifestoSplit = new SplitText("#manifesto", { type: "words", wordsClass: "word" });
    gsap.to(manifestoSplit.words, {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: {
        trigger: "#manifesto",
        start: "top 78%",
        end: "bottom 45%",
        scrub: 0.4,
      },
    });
  };

  /* ----------------------------------------------------------
     Preloader -> hero intro
     ---------------------------------------------------------- */
  const startIntro = () => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.to("#preloader", {
      clipPath: "inset(0 0 100% 0)",
      duration: 1.05,
      ease: "power4.inOut",
      onComplete: () => document.getElementById("preloader").remove(),
    })
      .from(".hero__img", { scale: 1.25, duration: 1.9, ease: "power3.out" }, "-=0.55")
      .to(".hero__title .line", { yPercent: 0, duration: 1.25, stagger: 0.11 }, "-=1.55")
      .to(".hero__eyebrow .line", { yPercent: 0, duration: 1 }, "-=1.05")
      .to(".hero__note .line", { yPercent: 0, duration: 1, stagger: 0.08 }, "-=0.95")
      .from(".header", { y: -30, opacity: 0, duration: 0.9 }, "-=0.9")
      .from(".booking", { y: 40, opacity: 0, duration: 0.9 }, "-=0.75")
      .from(".hero__scroll", { opacity: 0, duration: 0.8 }, "-=0.6");
  };

  // fake-but-honest loading counter: advances while hero image loads
  const counter = { v: 0 };
  const countEl = document.getElementById("loadCount");
  const heroImg = document.querySelector(".hero__img");
  gsap.set("#preloader", { clipPath: "inset(0 0 0% 0)" });

  let introStarted = false;
  const run = () => {
    if (introStarted) return;
    introStarted = true;
    document.fonts.ready.then(() => {
      buildSplits();
      gsap.to(counter, {
        v: 100,
        duration: 1.4,
        ease: "power2.inOut",
        onUpdate: () => (countEl.textContent = Math.round(counter.v)),
        onComplete: startIntro,
      });
    });
  };

  if (heroImg.complete) run();
  else {
    heroImg.addEventListener("load", run);
    heroImg.addEventListener("error", run);
    setTimeout(run, 4000); // never trap the user on the loader
  }

  /* ----------------------------------------------------------
     Header: solid once past the hero
     ---------------------------------------------------------- */
  const header = document.getElementById("header");
  ScrollTrigger.create({
    trigger: "#hero",
    start: "bottom top+=80",
    onEnter: () => header.classList.add("is-solid"),
    onLeaveBack: () => header.classList.remove("is-solid"),
  });

  /* ----------------------------------------------------------
     Hero parallax on scroll
     ---------------------------------------------------------- */
  gsap.to(".hero__img", {
    yPercent: 16,
    scale: 1.06,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero__content", {
    yPercent: -22,
    opacity: 0.25,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ----------------------------------------------------------
     Generic reveals
     ---------------------------------------------------------- */
  document.querySelectorAll(".reveal").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.05,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  /* clip reveals (images unveil bottom-up while de-zooming) */
  document.querySelectorAll(".clip-reveal").forEach((el) => {
    const img = el.querySelector("img");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: "top 82%" },
      defaults: { duration: 1.4, ease: "power4.inOut" },
    });
    tl.to(el, { clipPath: "inset(0 0 0% 0)" }).to(img, { scale: 1 }, 0);
  });

  /* floating images parallax (data-speed) */
  document.querySelectorAll("[data-speed]").forEach((el) => {
    const speed = parseFloat(el.dataset.speed);
    gsap.to(el, {
      y: () => speed * window.innerHeight,
      ease: "none",
      scrollTrigger: {
        trigger: el.closest("section") || el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });

  /* dine sticky image inner parallax */
  const dineImg = document.querySelector("[data-speed-inner]");
  if (dineImg) {
    gsap.fromTo(
      dineImg,
      { yPercent: -12 },
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: { trigger: ".dine", start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  }

  /* bathe full-bleed parallax */
  gsap.fromTo(
    "#batheImg",
    { yPercent: -12 },
    {
      yPercent: 4,
      ease: "none",
      scrollTrigger: { trigger: ".bathe", start: "top bottom", end: "bottom top", scrub: true },
    }
  );

  /* stat counters */
  document.querySelectorAll(".stat__num").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate: () => (el.textContent = Math.round(obj.v)),
    });
  });

  /* ----------------------------------------------------------
     Rooms — pinned horizontal scroll (desktop only)
     ---------------------------------------------------------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 841px)", () => {
    const track = document.getElementById("roomsTrack");
    const bar = document.getElementById("roomsBar");
    const getDistance = () => track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".rooms",
        start: "top top",
        end: () => "+=" + getDistance(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => (bar.style.width = self.progress * 100 + "%"),
      },
    });
    return () => tween.scrollTrigger && tween.scrollTrigger.kill();
  });

  /* ----------------------------------------------------------
     Days — floating image preview follows the cursor
     ---------------------------------------------------------- */
  if (isFinePointer) {
    const preview = document.getElementById("daysPreview");
    const previewImg = document.getElementById("daysPreviewImg");
    const list = document.getElementById("daysList");
    const xTo = gsap.quickTo(preview, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(preview, "y", { duration: 0.5, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    list.querySelectorAll(".days__item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        previewImg.src = item.dataset.img;
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" });
        gsap.fromTo(previewImg, { scale: 1.25 }, { scale: 1, duration: 0.8, ease: "power3.out" });
      });
    });
    list.addEventListener("mouseleave", () =>
      gsap.to(preview, { opacity: 0, scale: 0.92, duration: 0.35, ease: "power3.in" })
    );
    gsap.set(preview, { scale: 0.92 });
  }

  /* ----------------------------------------------------------
     Gallery marquee — drifts on its own, accelerates with scroll
     ---------------------------------------------------------- */
  const row = document.querySelector(".gallery__row");
  if (row) {
    let pos = 0;
    let extra = 0;
    const setX = gsap.quickSetter(row, "x", "px");
    const half = () => row.scrollWidth / 2;

    lenis.on("scroll", (e) => {
      extra += e.velocity * 0.9;
    });

    gsap.ticker.add((_, delta) => {
      extra *= 0.92; // friction
      const vel = gsap.utils.clamp(-14, 14, extra);
      pos -= (0.55 + vel) * (delta / 16.7);
      const h = half();
      if (h > 0) pos = gsap.utils.wrap(-h, 0, pos); // seamless loop
      setX(pos);
    });
  }

  /* ----------------------------------------------------------
     Fullscreen menu
     ---------------------------------------------------------- */
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  const menuImage = document.getElementById("menuImage");
  let menuOpen = false;

  const menuTl = gsap.timeline({ paused: true });
  menuTl
    .set(menu, { visibility: "visible" })
    .to(".menu__bg", { clipPath: "inset(0 0 0% 0)", duration: 0.85, ease: "power4.inOut" })
    .fromTo(
      ".menu__link",
      { yPercent: 130 },
      { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "power4.out" },
      "-=0.35"
    )
    .fromTo(".menu__media", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.6")
    .fromTo(".menu__foot", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.5");

  function toggleMenu(open) {
    menuOpen = open;
    document.body.classList.toggle("menu-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    menu.classList.toggle("is-open", open);
    if (open) {
      lenis.stop();
      menuTl.timeScale(1).play();
    } else {
      lenis.start();
      menuTl.timeScale(1.6).reverse();
    }
  }
  burger.addEventListener("click", () => toggleMenu(!menuOpen));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) toggleMenu(false);
  });

  // swap the menu preview image on link hover
  document.querySelectorAll(".menu__link").forEach((link) => {
    link.addEventListener("mouseenter", () => {
      if (menuImage.src === link.dataset.img) return;
      gsap.to(menuImage, {
        opacity: 0,
        duration: 0.18,
        onComplete: () => {
          menuImage.src = link.dataset.img;
          gsap.fromTo(menuImage, { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" });
        },
      });
    });
  });

  /* ----------------------------------------------------------
     Custom cursor + magnetic elements (desktop only)
     ---------------------------------------------------------- */
  if (isFinePointer) {
    const cursor = document.getElementById("cursor");
    const label = document.getElementById("cursorLabel");
    const cx = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3" });

    let cursorShown = false;
    window.addEventListener("mousemove", (e) => {
      if (!cursorShown) {
        cursorShown = true;
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        gsap.to(cursor, { opacity: 1, duration: 0.3 });
      }
      cx(e.clientX);
      cy(e.clientY);
    });

    const labels = { view: "View", drag: "Scroll", link: "" };
    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        const kind = el.dataset.cursor;
        cursor.classList.add("is-" + kind);
        label.textContent = labels[kind] || "";
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-link", "is-view", "is-drag");
        label.textContent = "";
      });
    });

    // magnetic buttons
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: 0.4,
          ease: "power3.out",
        });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* scroll hint */
  document.getElementById("scrollHint").addEventListener("click", () => {
    lenis.scrollTo(".manifesto");
  });

  /* keep ScrollTrigger honest after images settle */
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
