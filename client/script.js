(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- Header shadow on scroll ---------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });

    mainNav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menú");
      });
    });
  }

  /* ---------- Scrollspy: highlight active nav link ---------- */
  const sections = Array.from(document.querySelectorAll("main .section, .hero"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        const href = `#${id}`;
        if (!navLinks.some((link) => link.getAttribute("href") === href)) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === href);
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

  const pageMatches = (page, target) =>
    page.id === `tab-${target}` || page.id === `sala-${target}` || page.id === target;

  const activateBookTab = (tab, { updateHash } = { updateHash: false }) => {
    if (!tab) return;
    const target = tab.getAttribute("data-sala");

    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });

    let activePage = null;
    pages.forEach((page) => {
      const on = pageMatches(page, target);
      page.classList.toggle("is-active", on);
      if (on) activePage = page;
    });

    if (updateHash && activePage && activePage.id && history.replaceState) {
      history.replaceState(null, "", `#${activePage.id}`);
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateBookTab(tab, { updateHash: true }));
  });

  const applyBookHash = () => {
    const id = (location.hash || "").replace(/^#/, "");
    if (!id) return;
    const page = document.getElementById(id);
    if (!page || !page.classList.contains("book-page")) return;
    const target = page.id.replace(/^tab-/, "").replace(/^sala-/, "");
    const tab =
      document.querySelector(`.book-tab[data-sala="${target}"]`) ||
      document.querySelector(`.book-tab[aria-controls="${page.id}"]`);
    activateBookTab(tab);
  };

  applyBookHash();
  window.addEventListener("hashchange", applyBookHash);

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
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const isOpen = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", String(!isOpen));
    });
  });
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
