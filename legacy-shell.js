(function () {
  if (document.querySelector(".site-header")) return;

  const body = document.body;
  if (!body) return;

  body.classList.add("legacy-themed");

  document.querySelectorAll(".theme-toggle-checkbox, .theme-toggle-button").forEach((element) => {
    element.remove();
  });

  const pageShell = document.createElement("div");
  pageShell.className = "page-shell legacy-page-shell";

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="brand">
      <a href="index.html" class="brand-mark" aria-label="National Taiwan University home">
        <img src="images/logo/NTU-logo.svg" alt="National Taiwan University logo" class="brand-logo" />
      </a>
      <div>
        <p class="eyebrow">National Taiwan University</p>
        <a href="index.html" class="brand-name">Gauss Chang</a>
      </div>
    </div>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav id="site-nav" class="site-nav" aria-label="Primary navigation">
      <a href="index.html">Home</a>
      <a href="CV.html">CV</a>
      <a href="Projects.html">Projects</a>
      <a href="Articles.html">Articles</a>
      <a href="index.html#contact">Contact</a>
      <span aria-hidden="true">|</span>
      <a href="https://www.ntu.edu.tw" target="_blank" rel="noopener noreferrer">NTU</a>
    </nav>
  `;

  const navPath = window.location.pathname.split("/").pop() || "index.html";
  header.querySelectorAll(".site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.includes("#")) return;
    if (href === navPath) {
      link.setAttribute("aria-current", "page");
    }
  });

  if (!header.querySelector('[aria-current="page"]')) {
    const articlesLink = Array.from(header.querySelectorAll(".site-nav a")).find((link) => link.getAttribute("href") === "Articles.html");
    if (articlesLink) {
      articlesLink.setAttribute("aria-current", "page");
    }
  }

  const main = document.createElement("main");

  const contentRoot =
    document.querySelector(".page") ||
    document.querySelector(".container") ||
    document.querySelector("#conteiner") ||
    body.querySelector("main") ||
    body.querySelector("article") ||
    body.querySelector("div");

  if (contentRoot) {
    contentRoot.classList.add("legacy-content-shell");
    main.appendChild(contentRoot);
  }

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `<p>© 2026 Gauss Chang.</p><a href="index.html">Home</a>`;

  pageShell.appendChild(header);
  pageShell.appendChild(main);
  pageShell.appendChild(footer);

  body.appendChild(pageShell);

  const navToggle = pageShell.querySelector(".nav-toggle");
  const siteNav = pageShell.querySelector(".site-nav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }
})();
