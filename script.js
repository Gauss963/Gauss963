document.querySelectorAll(".section, .hero-copy, .hero-panel, .content-card, .list-card, .cv-section, .feature-card").forEach((element) => {
  element.setAttribute("data-reveal", "");
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.01,
    rootMargin: "0px 0px 120px 0px"
  }
);

document.querySelectorAll("[data-reveal]").forEach((element) => {
  observer.observe(element);
});

const articleArchiveRoot = document.querySelector("#articles-archive");
const homeLatestLink = document.querySelector("[data-home-latest-link]");
const homeLatestMeta = document.querySelector("[data-home-latest-meta]");
const homeLatestSummary = document.querySelector("[data-home-latest-summary]");

function getSortedArticles() {
  const articles = Array.isArray(window.ARTICLE_INDEX) ? [...window.ARTICLE_INDEX] : [];

  articles.sort((left, right) => {
    if (left.date === right.date) {
      return left.title.localeCompare(right.title);
    }
    return right.date.localeCompare(left.date);
  });

  return articles;
}

function renderHomeLatestArticle() {
  if (!homeLatestLink || !homeLatestMeta || !homeLatestSummary) {
    return;
  }

  const articles = getSortedArticles();
  const latestArticle = articles[0];

  if (!latestArticle) {
    return;
  }

  homeLatestLink.href = latestArticle.href;
  homeLatestLink.textContent = latestArticle.title;
  homeLatestMeta.textContent = latestArticle.meta
    ? `Posted on ${latestArticle.date} · ${latestArticle.meta}`
    : `Posted on ${latestArticle.date}`;
  homeLatestSummary.textContent = latestArticle.summary;
}

function renderArticlesArchive() {
  if (!articleArchiveRoot) {
    return;
  }

  const articles = getSortedArticles();

  if (articles.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "page-summary";
    emptyState.textContent = "No published articles were found in the archive data.";
    articleArchiveRoot.replaceChildren(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();

  articles.forEach((item) => {
    const entry = document.createElement("article");
    entry.className = "news-entry";

    const date = document.createElement("p");
    date.className = "timeline-date";
    date.textContent = item.date;

    const heading = document.createElement("h2");
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.title;
    heading.append(link);

    const summary = document.createElement("p");
    summary.textContent = item.summary;

    entry.append(date, heading, summary);
    fragment.append(entry);
  });

  articleArchiveRoot.replaceChildren(fragment);

  const latestArticle = articles[0];
  const latestPostLink = document.querySelector("[data-latest-post]");
  if (latestPostLink && latestArticle) {
    latestPostLink.href = latestArticle.href;
    latestPostLink.setAttribute("aria-label", `Open latest post: ${latestArticle.title}`);
  }

  const totalCount = articles.length;
  const researchCount = articles.filter((item) => item.categories.includes("research")).length;
  const translationCount = articles.filter((item) => item.categories.includes("translation")).length;
  const personalCount = articles.filter((item) => item.categories.includes("personal")).length;

  const totalNode = document.querySelector("[data-articles-total]");
  const researchNode = document.querySelector("[data-articles-research]");
  const personalNode = document.querySelector("[data-articles-personal]");
  const translationNode = document.querySelector("[data-articles-translation]");

  if (totalNode) {
    totalNode.textContent = String(totalCount);
  }

  if (researchNode) {
    researchNode.textContent = String(researchCount);
  }

  if (personalNode) {
    personalNode.textContent = String(personalCount);
  }

  if (translationNode) {
    translationNode.textContent = String(translationCount);
  }
}

renderHomeLatestArticle();
renderArticlesArchive();

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}
