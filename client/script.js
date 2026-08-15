(function () {
  "use strict";

  /* ---------- Header shadow on scroll ---------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  mainNav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Scrollspy: highlight active nav link ---------- */
  const sections = Array.from(document.querySelectorAll("main .section, .hero"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((section) => section.id && spy.observe(section));

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Book / Salas tabs ---------- */
  const tabs = document.querySelectorAll(".book-tab");
  const pages = document.querySelectorAll(".book-page");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-sala");

      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });

      pages.forEach((page) => {
        page.classList.toggle("is-active", page.id === `tab-${target}`);
      });
    });
  });

  /* ---------- Sub-tabs (nested inside book pages) ---------- */
  const subTabs = document.querySelectorAll(".sub-tab");
  const subPages = document.querySelectorAll(".sub-page");

  subTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-sala");

      subTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });

      subPages.forEach((page) => {
        page.classList.toggle("is-active", page.id === `sala-${target}`);
      });
    });
  });

  /* ---------- Timeline accordion ---------- */
  const timelineItems = document.querySelectorAll(".timeline-item");
  timelineItems.forEach((item) => {
    const toggle = item.querySelector(".timeline-toggle");
    toggle.addEventListener("click", () => {
      const isOpen = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", String(!isOpen));
    });
  });
  // Open the first timeline entry by default
  if (timelineItems.length) {
    timelineItems[0].setAttribute("data-open", "true");
  }

  /* ---------- Demo CTA: contact button ---------- */
  const ctaContacto = document.getElementById("ctaContacto");
  if (ctaContacto) {
    ctaContacto.addEventListener("click", (e) => {
      e.preventDefault();
      ctaContacto.textContent = "¡Gracias! (demo sin backend)";
      ctaContacto.style.pointerEvents = "none";
    });
  }

})();
