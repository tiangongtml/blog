const blogPosts = window.blogPosts;

// =========================================================================
// 1. Client-Side Router
// =========================================================================
class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('hashchange', () => this.handleRouting());
    window.addEventListener('load', () => this.handleRouting());
  }

  on(path, handler) {
    this.routes[path] = handler;
  }

  handleRouting() {
    const hash = window.location.hash || '#/';
    const path = hash.slice(1);

    // Dynamic Route Matching for article detail (e.g. /article/:id)
    let matchedHandler = null;
    let params = [];

    // Reset scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Track active navigation links
    this.updateActiveNav(path);

    // Check static routes
    if (this.routes[path]) {
      matchedHandler = this.routes[path];
    } else {
      // Check dynamic routes
      for (const routePath in this.routes) {
        const routeParamRegex = routePath.replace(/:[^\s/]+/g, '([\\w-]+)');
        const regex = new RegExp(`^${routeParamRegex}$`);
        const match = path.match(regex);
        if (match) {
          matchedHandler = this.routes[routePath];
          params = match.slice(1);
          break;
        }
      }
    }

    const appView = document.getElementById('app-view');

    // Smooth transition between views
    appView.classList.remove('fade-in');
    void appView.offsetWidth; // Trigger reflow to restart animation

    if (matchedHandler) {
      matchedHandler(...params);
    } else {
      this.render404();
    }

    appView.classList.add('fade-in');

    // Bind listeners to dynamically rendered elements
    initDynamicInteractions();
  }

  updateActiveNav(path) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const routeAttr = link.getAttribute('data-route');
      if (
        (path === '/' && routeAttr === 'home') ||
        (path.startsWith('/blog') && routeAttr === 'blog') ||
        (path.startsWith('/article') && routeAttr === 'blog') ||
        (path.startsWith('/about') && routeAttr === 'about') ||
        (path.startsWith('/contact') && routeAttr === 'contact')
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Toggle reading progress bar visibility
    const progressContainer = document.getElementById('reading-progress-container');
    if (path.startsWith('/article') && progressContainer) {
      progressContainer.style.display = 'block';
      updateReadingProgress();
    } else if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }

  render404() {
    const appView = document.getElementById('app-view');
    appView.innerHTML = `
      <div class="view-container empty-state">
        <h3>404 - 页面未找到</h3>
        <p>您访问的页面似乎已飘散在数字星空之中。</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 2rem;">返回首页</a>
      </div>
    `;
  }
}

const router = new Router();

// =========================================================================
// 2. View Rendering Functions
// =========================================================================

// Home View
router.on('/', () => {
  const appView = document.getElementById('app-view');
  const featuredPosts = blogPosts.filter(p => p.featured);

  let featuredGridHTML = featuredPosts.map(post => renderPostCard(post)).join('');

  appView.innerHTML = `
    <div class="view-container">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-tag">Aesthetics & Engineering</div>
        <h1 class="hero-title">探索智能的<span class="gradient-text">边界</span>与<br>高并发架构之美</h1>
        <p class="hero-description">我是 Bright，天津工业大学硕士在读（27届毕业）。这里是我记录关于 AI Agent 应用开发、测试开发与后端高并发工程实践的个人空间。</p>
        <div class="hero-cta">
          <a href="#/blog" class="btn btn-primary">浏览文章</a>
          <a href="#/about" class="btn btn-secondary">关于我</a>
        </div>
      </section>

      <!-- Featured Posts Section -->
      <section>
        <div class="section-header">
          <h2 class="section-title">精选文章</h2>
          <a href="#/blog" class="section-link">
            全部文章 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
        <div class="posts-grid">
          ${featuredGridHTML}
        </div>
      </section>

      <!-- Newsletter Section -->
      <section class="newsletter-banner">
        <h2 class="newsletter-title">订阅我的 Newsletter</h2>
        <p class="newsletter-desc">订阅我的博客，当有新文章发布时，您将在第一时间收到邮件推送。谢绝垃圾邮件。</p>
        <form class="newsletter-form" id="newsletter-form">
          <input type="email" placeholder="您的电子邮箱地址..." class="search-input" required>
          <button type="submit" class="btn btn-primary">订阅</button>
        </form>
      </section>
    </div>
  `;

  // Bind newsletter handler
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('🎉 订阅成功！感谢您的关注。');
      form.reset();
    });
  }
});

// Blog Catalog View
router.on('/blog', () => {
  renderBlogPage();
});

// Article Detail View
router.on('/article/:id', (id) => {
  const appView = document.getElementById('app-view');
  const postIndex = blogPosts.findIndex(p => p.id === id);

  if (postIndex === -1) {
    router.render404();
    return;
  }

  const post = blogPosts[postIndex];
  const nextPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const prevPost = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  appView.innerHTML = `
    <div class="view-container">
      <article class="article-body-layout">
        <header class="article-header">
          <span class="article-category">${post.tags[0] || '博客'}</span>
          <h1 class="article-title">${post.title}</h1>
          <p class="article-subtitle">${post.subtitle}</p>
          <div class="article-meta-info">
            <span>📅 ${post.date}</span>
            <span>⏱️ ${post.readTime}</span>
          </div>
        </header>

        <div class="article-cover-container">
          <img src="${post.cover}" alt="${post.title}" class="article-cover">
        </div>

        <div class="article-content">
          ${post.content}
        </div>

        <nav class="article-navigation">
          ${prevPost ? `
            <a href="#/article/${prevPost.id}" class="article-nav-btn prev">
              <span class="nav-btn-label">← 上一篇</span>
              <span class="nav-btn-title">${prevPost.title}</span>
            </a>
          ` : '<div></div>'}
          
          ${nextPost ? `
            <a href="#/article/${nextPost.id}" class="article-nav-btn next">
              <span class="nav-btn-label">下一篇 →</span>
              <span class="nav-btn-title">${nextPost.title}</span>
            </a>
          ` : '<div></div>'}
        </nav>
      </article>
    </div>
  `;
});

// About View
router.on('/about', () => {
  const appView = document.getElementById('app-view');
  appView.innerHTML = `
    <div class="view-container">
      <div class="about-grid">
        <!-- Sticky Avatar Sidebar -->
        <aside class="profile-sidebar">
          <div class="profile-sticky-card">
            <h2 class="profile-name">Bright</h2>
            <p class="profile-title">AI应用开发 / 后端 / 测开</p>
            <p class="profile-bio">天津工业大学硕士在读（2027届毕业）。曾实习于联想（测开）、长城汽车（后端研发）及雷科（AI应用）。致力于构建高并发、可扩展且具备智能体的系统工程。</p>
            <div class="profile-socials">
              <a href="https://github.com" class="social-icon-link" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
              <a href="https://twitter.com" class="social-icon-link" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>
        </aside>

        <!-- Main About Description -->
        <main class="about-content">
          <section class="about-bio-section">
            <h3>关于我</h3>
            <div class="about-bio-text">
              <p>你好！我是 Bright，目前是天津工业大学在读硕士研究生（2027年毕业）。我专注于 AI Agent（智能体）、高并发后端系统架构以及自动化测试开发领域。</p>
              <p>我热爱将最前沿的 AI 技术（如大语言模型、RAG 系统、多智能体协同）应用到实际工程中。在多段行业领军企业（联想、长城汽车研发中心、雷科）的实习经历中，我沉淀了深厚的后端微服务设计、自动化质量保证以及大模型应用开发经验。</p>
            </div>
          </section>

          <!-- Core Skills Grid -->
          <section class="about-bio-section">
            <h3>核心技能</h3>
            <div class="skills-grid">
              <div class="skill-card">
                <div class="skill-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/></svg>
                </div>
                <h4 class="skill-title">AI 应用 & Agent</h4>
                <p class="skill-desc">熟悉大语言模型集成，基于 LangChain/Flowise 搭建 RAG 知识库与多智能体协同（Agent）工作流。</p>
              </div>
              <div class="skill-card">
                <div class="skill-icon">
                  <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
                </div>
                <h4 class="skill-title">后端服务研发</h4>
                <p class="skill-desc">精通 Go/Java/Python 后端开发，熟练使用 Spring Boot, Gin 等框架，掌握高并发、微服务架构与 Redis/MySQL 调优。</p>
              </div>
              <div class="skill-card">
                <div class="skill-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                </div>
                <h4 class="skill-title">测试开发 & QA</h4>
                <p class="skill-desc">熟悉自动化测试理论与工程实践。掌握 Pytest、Selenium 等测试工具，具备 CI/CD 自动化流水线集成能力。</p>
              </div>
            </div>
          </section>

          <!-- Timeline -->
          <section class="about-bio-section">
            <h3>履历与里程碑</h3>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-meta">
                  <span class="timeline-date">2024.09 - 至今</span>
                  <span class="timeline-place">天津工业大学</span>
                </div>
                <h4 class="timeline-title">计算机科学与技术 · 硕士在读</h4>
                <p class="timeline-desc">攻读硕士学位（预计2027年毕业），主攻分布式系统与智能体协同方向，打下了深厚的计算机理论与系统工程底子。</p>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-meta">
                  <span class="timeline-date">实习经历</span>
                  <span class="timeline-place">雷科防务 / AI应用实验室</span>
                </div>
                <h4 class="timeline-title">AI 应用开发工程师（实习）</h4>
                <p class="timeline-desc">负责大模型智能体（Agent）及检索增强生成（RAG）系统的研发。搭建基于企业知识库的自动化问答流，优化 Prompt 结构及向量召回率，提升智能助手回复准确度。</p>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-meta">
                  <span class="timeline-date">实习经历</span>
                  <span class="timeline-place">长城汽车研发中心</span>
                </div>
                <h4 class="timeline-title">后端开发工程师（实习）</h4>
                <p class="timeline-desc">参与车联网核心微服务后端的模块开发与性能调优。使用 Go 语言进行大并发数据接收服务重构，设计分布式缓存策略，降低数据库负载，保证高并发数据流的稳定性。</p>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-meta">
                  <span class="timeline-date">实习经历</span>
                  <span class="timeline-place">联想集团</span>
                </div>
                <h4 class="timeline-title">测试开发工程师（实习）</h4>
                <p class="timeline-desc">负责联想核心云服务模块的自动化测试框架搭建与脚本编写。使用 Python + Pytest 实现了接口自动化覆盖率提升 30%，分析测试瓶颈，搭建 CI/CD 自动构建部署链条。</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  `;
});

// Contact View
router.on('/contact', () => {
  const appView = document.getElementById('app-view');
  appView.innerHTML = `
    <div class="view-container">
      <div class="contact-layout">
        <!-- Contact Information -->
        <div class="contact-info-panel">
          <h2>让我们建立<br><span class="accent-text">连接</span></h2>
          <p class="contact-info-desc">如果您有任何有趣的项目构想、合作意向，或者想找人探讨 AI Agent 及后端高并发工程技术，欢迎随时给我留言。</p>
          
          <div class="contact-details">
            <div class="contact-detail-item">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </div>
              <div class="detail-text">
                <h4>电子邮箱</h4>
                <p><a href="mailto:2116176486@qq.com">2116176486@qq.com</a></p>
              </div>
            </div>
            <div class="contact-detail-item">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </div>
              <div class="detail-text">
                <h4>工作地点</h4>
                <p>中国 · 天津 / 远程办公</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Form Card -->
        <div class="contact-form-container">
          <form id="contact-form">
            <div class="form-group">
              <input type="text" id="contact-name" class="form-input" placeholder=" " required autocomplete="off">
              <label for="contact-name" class="form-label">您的姓名</label>
            </div>
            
            <div class="form-group">
              <input type="email" id="contact-email" class="form-input" placeholder=" " required autocomplete="off">
              <label for="contact-email" class="form-label">您的邮箱</label>
            </div>
            
            <div class="form-group">
              <textarea id="contact-message" class="form-input" placeholder=" " required autocomplete="off"></textarea>
              <label for="contact-message" class="form-label">您的留言信息</label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-submit">发送留言</button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Bind Form Submission
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('✉️ 留言发送成功！我将在 24 小时内回复您。');
      form.reset();
    });
  }
});

// =========================================================================
// 3. Helper Render Components
// =========================================================================
function renderPostCard(post) {
  return `
    <div class="card-perspective">
      <article class="blog-card" data-tilt>
        <div class="card-img-wrapper">
          <img src="${post.cover}" alt="${post.title}" class="card-img" loading="lazy">
          <span class="card-badge">${post.tags[0] || '开发'}</span>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span>📅 ${post.date}</span>
            <span>⏱️ ${post.readTime}</span>
          </div>
          <a href="#/article/${post.id}" class="card-title">${post.title}</a>
          <p class="card-desc">${post.summary}</p>
          <div class="card-footer">
            <div class="card-tags">
              ${post.tags.map(tag => `<span class="card-tag">#${tag}</span>`).join('')}
            </div>
            <a href="#/article/${post.id}" class="read-more-link">
              阅读 
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>
      </article>
    </div>
  `;
}

// Blog Page Rendering (Includes search and tags filter logic)
let blogSearchQuery = '';
let blogActiveTag = '全部';

function renderBlogPage() {
  const appView = document.getElementById('app-view');

  // Extract all unique tags
  const allTags = ['全部', ...new Set(blogPosts.flatMap(p => p.tags))];

  // Filter posts based on search query and tag selection
  const filteredPosts = blogPosts.filter(post => {
    const matchesTag = blogActiveTag === '全部' || post.tags.includes(blogActiveTag);
    const matchesSearch = post.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      post.subtitle.toLowerCase().includes(blogSearchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const cardsGridHTML = filteredPosts.length > 0
    ? filteredPosts.map(post => renderPostCard(post)).join('')
    : `<div class="empty-state">
         <h3>没有找到符合条件的文章</h3>
         <p>试着换个搜索词或点击其他标签分类吧。</p>
       </div>`;

  const tagsHTML = allTags.map(tag => `
    <li>
      <button class="filter-btn ${blogActiveTag === tag ? 'active' : ''}" data-tag="${tag}">
        ${tag}
      </button>
    </li>
  `).join('');

  appView.innerHTML = `
    <div class="view-container">
      <header class="section-header" style="margin-bottom: 3rem;">
        <h1 class="section-title" style="font-size: 2.25rem;">深邃思想的数字索引</h1>
      </header>

      <!-- Search & Filters Container -->
      <div class="catalog-controls">
        <div class="search-box-wrapper">
          <input type="text" id="blog-search" class="search-input" placeholder="搜索文章标题、内容..." value="${blogSearchQuery}">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        
        <ul class="filter-tags">
          ${tagsHTML}
        </ul>
      </div>

      <!-- Articles Grid -->
      <div class="posts-grid" id="blog-posts-grid">
        ${cardsGridHTML}
      </div>
    </div>
  `;

  // Bind catalog events
  const searchInput = document.getElementById('blog-search');
  if (searchInput) {
    // Focus search input if search is active
    if (blogSearchQuery) {
      searchInput.focus();
      // Move cursor to end
      searchInput.setSelectionRange(blogSearchQuery.length, blogSearchQuery.length);
    }

    searchInput.addEventListener('input', (e) => {
      blogSearchQuery = e.target.value;
      updateBlogGrid();
    });
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      blogActiveTag = e.target.getAttribute('data-tag');
      // Re-render full page to update button states cleanly
      renderBlogPage();
    });
  });
}

function updateBlogGrid() {
  const gridContainer = document.getElementById('blog-posts-grid');
  if (!gridContainer) return;

  const filteredPosts = blogPosts.filter(post => {
    const matchesTag = blogActiveTag === '全部' || post.tags.includes(blogActiveTag);
    const matchesSearch = post.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      post.subtitle.toLowerCase().includes(blogSearchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  gridContainer.innerHTML = filteredPosts.length > 0
    ? filteredPosts.map(post => renderPostCard(post)).join('')
    : `<div class="empty-state">
         <h3>没有找到符合条件的文章</h3>
         <p>试着换个搜索词或点击其他标签分类吧。</p>
       </div>`;

  initDynamicInteractions();
}

// =========================================================================
// 4. Core Ambient & Interactive Physics
// =========================================================================

// Custom Cursor Easing
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let cursorOuter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let cursorDot = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  // Ambient Glow tracks the mouse with coordinates
  const orb1 = document.getElementById('orb-1');
  const orb2 = document.getElementById('orb-2');
  if (orb1 && orb2) {
    // Eased motion of glow spheres
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const xPct = (e.clientX / winWidth - 0.5) * 60;
    const yPct = (e.clientY / winHeight - 0.5) * 60;

    orb1.style.transform = `translate(${xPct}px, ${yPct}px)`;
    orb2.style.transform = `translate(${-xPct}px, ${-yPct}px)`;
  }
});

function animateCursor() {
  // Lerp for outer cursor ring
  cursorOuter.x += (mouse.x - cursorOuter.x) * 0.12;
  cursorOuter.y += (mouse.y - cursorOuter.y) * 0.12;

  // Dot cursor has a faster response
  cursorDot.x += (mouse.x - cursorDot.x) * 0.25;
  cursorDot.y += (mouse.y - cursorDot.y) * 0.25;

  const cursorEl = document.getElementById('custom-cursor');
  const cursorDotEl = document.getElementById('custom-cursor-dot');

  if (cursorEl) {
    cursorEl.style.left = `${cursorOuter.x}px`;
    cursorEl.style.top = `${cursorOuter.y}px`;
  }
  if (cursorDotEl) {
    cursorDotEl.style.left = `${cursorDot.x}px`;
    cursorDotEl.style.top = `${cursorDot.y}px`;
  }

  requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);

// Add custom cursor states (clicking & hovered)
window.addEventListener('mousedown', () => {
  const cursorEl = document.getElementById('custom-cursor');
  if (cursorEl) cursorEl.classList.add('clicking');
});
window.addEventListener('mouseup', () => {
  const cursorEl = document.getElementById('custom-cursor');
  if (cursorEl) cursorEl.classList.remove('clicking');
});

// Card 3D Tilt Effect & Cursor Hover Events
function initDynamicInteractions() {
  const interactiveElements = document.querySelectorAll('a, button, input, textarea, .filter-btn, .blog-card');
  const cursorEl = document.getElementById('custom-cursor');

  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (cursorEl) cursorEl.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      if (cursorEl) cursorEl.classList.remove('hovered');
    });
  });

  // Tilt effect for cards
  const cards = document.querySelectorAll('[data-tilt]');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Limit tilt to maximum of 8 degrees for elegance
      const rotateX = -(y / (rect.height / 2)) * 8;
      const rotateY = (x / (rect.width / 2)) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  });
}

// Reading Progress calculator
function updateReadingProgress() {
  const bar = document.getElementById('reading-progress-bar');
  if (!bar) return;

  const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = height > 0 ? (winScroll / height) * 100 : 0;

  bar.style.width = scrolled + '%';
}
window.addEventListener('scroll', updateReadingProgress);

// =========================================================================
// 5. Theme Switching Logic
// =========================================================================
const themeToggle = document.getElementById('theme-toggle');

// Initialize Theme
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-theme');
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');

  // Show theme change toast
  showToast(isLight ? '💡 已切换为明亮模式' : '🌙 已切换为深色模式');
});

// =========================================================================
// 6. Mobile Drawer Overlay Navigation
// =========================================================================
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

if (mobileToggle && navMenu) {
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    mobileToggle.classList.toggle('active');

    // Animate hamburger lines
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    const line3 = document.getElementById('line3');

    if (navMenu.classList.contains('open')) {
      line1.setAttribute('x1', '18'); line1.setAttribute('y1', '6'); line1.setAttribute('x2', '6'); line1.setAttribute('y2', '18');
      line2.style.opacity = '0';
      line3.setAttribute('x1', '6'); line3.setAttribute('y1', '6'); line3.setAttribute('x2', '18'); line3.setAttribute('y2', '18');
    } else {
      line1.setAttribute('x1', '3'); line1.setAttribute('y1', '12'); line1.setAttribute('x2', '21'); line1.setAttribute('y2', '12');
      line2.style.opacity = '1';
      line3.setAttribute('x1', '3'); line3.setAttribute('y1', '18'); line3.setAttribute('x2', '21'); line3.setAttribute('y2', '18');
    }
  });

  // Close menu on navigation link clicks
  const links = navMenu.querySelectorAll('a');
  links.forEach(l => {
    l.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        mobileToggle.click();
      }
    });
  });
}

// =========================================================================
// 7. Toast Notification Handler
// =========================================================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove toast after 4s
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}
