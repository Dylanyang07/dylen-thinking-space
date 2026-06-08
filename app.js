const posts = window.BLOG_POSTS ?? [];

const state = {
  tag: "全部",
  query: "",
};

const app = document.querySelector("#app");
const tagList = document.querySelector("#tagList");
const searchInput = document.querySelector("#searchInput");
const searchPanel = document.querySelector("#searchPanel");
const searchToggle = document.querySelector("#searchToggle");
const themeToggle = document.querySelector("#themeToggle");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function markdownToHtml(markdown) {
  const lines = markdown.trim().split("\n");
  const html = [];
  let listType = null;

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    if (/^- /.test(line)) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\. (.*)$/);
    if (orderedMatch) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${escapeHtml(orderedMatch[2])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  closeList();
  return html.join("");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
}

function getAllTags() {
  return ["全部", ...new Set(posts.flatMap((post) => post.tags))];
}

function renderTags() {
  tagList.innerHTML = getAllTags()
    .map((tag) => {
      const active = tag === state.tag ? " is-active" : "";
      return `<button class="tag-filter${active}" type="button" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
    })
    .join("");
}

function getFilteredPosts() {
  const query = state.query.trim().toLowerCase();
  return posts.filter((post) => {
    const matchesTag = state.tag === "全部" || post.tags.includes(state.tag);
    const haystack = `${post.title} ${post.excerpt} ${post.summary} ${post.tags.join(" ")} ${post.body}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesTag && matchesQuery;
  });
}

function renderHome() {
  const filteredPosts = getFilteredPosts();
  app.innerHTML = `
    <div class="section-heading">
      <h2>第一版面：思考文章</h2>
      <span class="article-count">${filteredPosts.length} 篇文章</span>
    </div>
    ${
      filteredPosts.length
        ? `<div class="post-list">${filteredPosts.map(renderPostCard).join("")}</div>`
        : `<div class="empty-state">没有找到匹配的文章。</div>`
    }
  `;
}

function renderPostCard(post) {
  return `
    <a class="post-card" href="#/post/${post.slug}">
      <div class="post-meta">
        <time datetime="${post.date}">${formatDate(post.date)}</time>
      </div>
      <h3>${escapeHtml(post.title)}</h3>
      <p class="excerpt">${escapeHtml(post.excerpt)}</p>
      <div class="tags">
        ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </a>
  `;
}

function renderPost(slug) {
  const post = posts.find((item) => item.slug === slug);
  if (!post) {
    app.innerHTML = `<div class="empty-state">文章不存在。</div>`;
    return;
  }

  app.innerHTML = `
    <article class="article-view">
      <a class="back-link" href="#/">← 返回首页</a>
      <div class="post-meta">
        <time datetime="${post.date}">${formatDate(post.date)}</time>
        <span>来源：${escapeHtml(post.source)}</span>
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="tags">
        ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <p class="article-summary">${escapeHtml(post.summary)}</p>
      <div class="article-body">${markdownToHtml(post.body)}</div>
    </article>
  `;
}

function renderRoute() {
  renderTags();
  const match = location.hash.match(/^#\/post\/(.+)$/);
  if (match) {
    renderPost(match[1]);
  } else {
    renderHome();
  }
}

tagList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tag]");
  if (!button) return;
  state.tag = button.dataset.tag;
  location.hash = "#/";
  renderRoute();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  location.hash = "#/";
  renderRoute();
});

searchToggle.addEventListener("click", () => {
  searchPanel.classList.toggle("is-open");
  if (searchPanel.classList.contains("is-open")) {
    searchInput.focus();
  }
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("dylen-blog-theme", nextTheme);
});

const savedTheme = localStorage.getItem("dylen-blog-theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
}

window.addEventListener("hashchange", renderRoute);
renderRoute();
