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
    const closeNav = () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menú");
    };

    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });

    mainNav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mainNav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!mainNav.classList.contains("is-open")) return;
      if (header && header.contains(event.target)) return;
      closeNav();
    });
  }

  /* ---------- Scrollspy: highlight active nav link ---------- */
  const sections = Array.from(document.querySelectorAll("main .section, .hero"));
  const navLinks = Array.from(document.querySelectorAll(".main-nav .nav-link"));

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
    syncTabindex(tabs);
  };

  const syncTabindex = (tabNodes) => {
    tabNodes.forEach((t) => {
      t.setAttribute("tabindex", t.classList.contains("is-active") ? "0" : "-1");
    });
  };

  const bindTablistKeys = (tabNodes, onActivate) => {
    if (!tabNodes.length) return;
    syncTabindex(tabNodes);
    tabNodes.forEach((tab, index) => {
      tab.addEventListener("keydown", (event) => {
        const last = tabNodes.length - 1;
        let next = -1;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index === last ? 0 : index + 1;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = last;
        if (next < 0) return;
        event.preventDefault();
        onActivate(tabNodes[next]);
        tabNodes[next].focus();
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateBookTab(tab, { updateHash: true }));
  });
  bindTablistKeys(Array.from(tabs), (tab) => activateBookTab(tab, { updateHash: true }));

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
  const subTabs = Array.from(document.querySelectorAll(".sub-tab"));
  const subPages = document.querySelectorAll(".sub-page");

  const activateSubTab = (tab) => {
    if (!tab) return;
    const target = tab.getAttribute("data-sala");
    subTabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    subPages.forEach((page) => {
      page.classList.toggle("is-active", page.id === `sala-${target}`);
    });
    syncTabindex(subTabs);
  };

  subTabs.forEach((tab) => {
    tab.addEventListener("click", () => activateSubTab(tab));
  });
  bindTablistKeys(subTabs, activateSubTab);

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

  /* ---------- CTA contacto: envía correo vía /api/contact ---------- */
  const ctaContacto = document.getElementById("ctaContacto");
  if (ctaContacto) {
    const originalLabel = ctaContacto.textContent;
    ctaContacto.addEventListener("click", async (event) => {
      event.preventDefault();
      ctaContacto.textContent = "Enviando...";
      ctaContacto.style.pointerEvents = "none";
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Solicitud de información desde la página Visítanos.",
          }),
        });
        if (!response.ok) throw new Error(String(response.status));
        ctaContacto.textContent = "¡Solicitud enviada!";
      } catch {
        ctaContacto.style.pointerEvents = "";
        ctaContacto.textContent = originalLabel;
        window.location.href =
          "mailto:casamuseopulperiaezequielzamor@gmail.com?subject=Solicitar%20informaci%C3%B3n";
      }
    });
  }

  /* ---------- Published articles archive ---------- */
  const articleArchive = document.getElementById("articleArchive");
  const articleSearch = document.getElementById("articleSearch");
  const articleStatus = document.getElementById("articleArchiveStatus");

  if (articleArchive && articleSearch && articleStatus) {
    let publishedArticles = [];

    const createArticleCard = (article) => {
      const card = document.createElement("article");
      card.className = "archive-article";

      const meta = document.createElement("p");
      meta.className = "archive-article-meta";
      meta.textContent = article.category || "Museo";

      const title = document.createElement("h3");
      title.textContent = article.title;

      const excerpt = document.createElement("p");
      excerpt.className = "archive-article-excerpt";
      excerpt.textContent = article.excerpt || "Una historia del archivo de la Casa-Pulpería.";

      const detail = document.createElement("div");
      detail.className = "archive-article-detail";
      detail.id = `article-detail-${article.id}`;
      detail.hidden = true;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "archive-article-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", detail.id);
      toggle.textContent = "Leer artículo";

      let loaded = false;
      toggle.addEventListener("click", async () => {
        if (loaded) {
          const expanded = toggle.getAttribute("aria-expanded") === "true";
          toggle.setAttribute("aria-expanded", String(!expanded));
          toggle.textContent = expanded ? "Leer artículo" : "Cerrar artículo";
          detail.hidden = expanded;
          return;
        }

        toggle.disabled = true;
        toggle.textContent = "Cargando…";
        try {
          const response = await fetch(`/api/articles/${encodeURIComponent(article.id)}`);
          if (!response.ok) throw new Error("No se pudo cargar este artículo.");
          const fullArticle = await response.json();
          renderArticleDetail(detail, fullArticle);
          loaded = true;
          toggle.setAttribute("aria-expanded", "true");
          toggle.textContent = "Cerrar artículo";
          detail.hidden = false;
        } catch {
          toggle.textContent = "No se pudo cargar · reintentar";
        } finally {
          toggle.disabled = false;
        }
      });

      card.append(meta, title, excerpt, toggle, detail);
      return card;
    };

    const renderArticleList = () => {
      const query = articleSearch.value.trim().toLocaleLowerCase("es");
      const matches = publishedArticles.filter((article) =>
        [article.title, article.excerpt, article.category]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(query),
      );
      articleArchive.replaceChildren(...matches.map(createArticleCard));
      articleStatus.textContent = matches.length
        ? `${matches.length} ${matches.length === 1 ? "artículo publicado" : "artículos publicados"}`
        : "No hay artículos publicados que coincidan con la búsqueda.";
    };

    articleSearch.addEventListener("input", renderArticleList);
    fetch("/api/articles")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo consultar el archivo.");
        return response.json();
      })
      .then((articles) => {
        publishedArticles = Array.isArray(articles) ? articles : [];
        renderArticleList();
      })
      .catch(() => {
        articleStatus.textContent = "El archivo de artículos no está disponible en este momento.";
      });
  }

  function renderArticleDetail(container, article) {
    container.replaceChildren();
    const images = [article.cover, article.image2].filter(Boolean);
    if (images.length) {
      const gallery = document.createElement("div");
      gallery.className = "archive-article-images";
      images.forEach((source, index) => {
        const image = document.createElement("img");
        image.src = source;
        image.alt = `Imagen ${index + 1} del artículo ${article.title}`;
        image.loading = "lazy";
        image.decoding = "async";
        gallery.append(image);
      });
      container.append(gallery);
    }
    const copy = document.createElement("div");
    copy.className = "archive-article-copy";
    copy.textContent = article.content || "Este artículo todavía no tiene texto.";
    container.append(copy);
  }
})();
