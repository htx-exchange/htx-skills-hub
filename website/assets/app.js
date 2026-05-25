// HTX Skill Hub — frontend logic

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ========== Home page ==========
  function renderHome() {
    const wrap = $('#filter-bar');
    if (!wrap) return;

    window.HTX_CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-tab' + (cat.id === 'all' ? ' active' : '');
      btn.dataset.cat = cat.id;
      btn.innerHTML = `${cat.label}<span class="count">${cat.count()}</span>`;
      btn.addEventListener('click', () => {
        $$('.filter-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        renderGrid(cat.id);
      });
      wrap.appendChild(btn);
    });

    renderGrid('all');
    renderFaq();
  }

  function renderFaq() {
    const root = document.getElementById('faq-list');
    if (!root || !window.HTX_FAQS) return;
    root.innerHTML = '';
    window.HTX_FAQS.forEach((item, i) => {
      const el = document.createElement('details');
      el.className = 'faq-item';
      if (i === 0) el.open = true;
      el.innerHTML = `
        <summary class="faq-q">
          <span>${item.q}</span>
          <span class="faq-icon"></span>
        </summary>
        <div class="faq-a">${item.a}</div>
      `;
      root.appendChild(el);
    });
  }

  function renderGrid(cat) {
    const grid = $('#skill-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const list = cat === 'all'
      ? window.HTX_SKILLS
      : window.HTX_SKILLS.filter(s => s.category === cat);

    list.forEach(s => {
      const card = document.createElement('a');
      card.className = 'capability-card';
      card.href = `skill.html?slug=${encodeURIComponent(s.slug)}`;
      card.innerHTML = `
        <div class="capability-head">
          <div class="capability-icon">${s.icon}</div>
          <div class="capability-title-wrap">
            <div class="capability-title">${s.name}</div>
          </div>
        </div>
        <div class="capability-desc">${s.desc}</div>
      `;
      grid.appendChild(card);
    });
  }

  // ========== Detail page ==========
  function renderDetail() {
    const wrap = $('#detail-wrap');
    if (!wrap) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const skill = window.HTX_SKILLS.find(s => s.slug === slug);

    if (!skill) {
      wrap.innerHTML = `
        <div class="breadcrumb"><a href="index.html">← 全部技能</a></div>
        <h1>未找到对应技能</h1>
        <p>Slug "<code>${slug || ''}</code>" 不在技能目录中。</p>`;
      return;
    }

    document.title = `${skill.name} · HTX AI 技能中心`;

    const ghUrl = `${window.GITHUB_BASE}/${skill.slug}`;
    const tags = (skill.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    const scenarios = skill.scenarios || [];
    const catLabel = categoryLabel(skill.category);
    const stats = getSkillStats(skill);

    const scenarioBubbles = scenarios.map(t => `
      <div class="bubble">
        <span class="bubble-avatar">👤</span>
        <span class="bubble-text">&ldquo;${t}&rdquo;</span>
      </div>`).join('');

    const related = window.HTX_SKILLS
      .filter(s => s.slug !== skill.slug && s.category === skill.category)
      .slice(0, 4);
    const relatedHtml = related.length
      ? related.map(r => `<a class="related-card" href="skill.html?slug=${r.slug}">
          <span class="icon">${r.icon}</span>
          <div>
            <b>${r.name}</b>
            <small>${(r.desc || '').slice(0, 28)}…</small>
          </div>
        </a>`).join('')
      : '<p style="color: var(--Text-L3);">—</p>';

    wrap.innerHTML = `
      <div class="breadcrumb">
        <a href="index.html">全部技能</a> ·
        <a href="index.html#${skill.category}">${catLabel}</a> ·
        <span>${skill.name}</span>
      </div>

      <header class="d-hero">
        <div class="d-hero-left">
          <div class="d-hero-icon">${skill.icon}</div>
          <div class="d-hero-meta">
            <div class="d-hero-tag">${catLabel}</div>
            <h1 class="d-hero-title">${skill.name}</h1>
            <p class="d-hero-desc">${skill.desc}</p>
          </div>
        </div>
        <div class="d-hero-right">
          <div class="d-install">
            <div class="d-install-label">一行命令安装</div>
            <div class="d-install-cmd">
              <code>${skill.install}</code>
              <button class="copy-btn" data-copy="${skill.install}">复制</button>
            </div>
            <a class="d-install-link" href="${ghUrl}" target="_blank" rel="noopener">在 GitHub 查看源码 →</a>
          </div>
        </div>
      </header>

      <section class="d-stats">
        ${stats.map(s => `
        <div class="d-stat">
          <div class="d-stat-icon">${s.icon}</div>
          <div><div class="d-stat-label">${s.label}</div><div class="d-stat-value">${s.value}</div></div>
        </div>`).join('')}
      </section>

      ${scenarios.length ? `
      <section class="d-block">
        <h2 class="d-block-title">典型用户问法</h2>
        <p class="d-block-sub">向你的 AI Agent 说出以下任意一句，它都会自动选用本技能完成任务。</p>
        <div class="d-bubbles">${scenarioBubbles}</div>
      </section>` : ''}

      <section class="d-block">
        <h2 class="d-block-title">三步上手</h2>
        <div class="d-steps">
          <div class="d-step">
            <div class="d-step-num">1</div>
            <div class="d-step-body">
              <div class="d-step-title">安装技能</div>
              <div class="d-step-desc">在 AI Agent 终端执行安装命令，约 5 秒即可完成。</div>
            </div>
          </div>
          <div class="d-step">
            <div class="d-step-num">2</div>
            <div class="d-step-body">
              <div class="d-step-title">用自然语言提问</div>
              <div class="d-step-desc">直接用中文告诉 AI Agent 你想做什么，无需记忆任何命令。</div>
            </div>
          </div>
          <div class="d-step">
            <div class="d-step-num">3</div>
            <div class="d-step-body">
              <div class="d-step-title">AI 自动执行</div>
              <div class="d-step-desc">AI 调用本技能拉取 HTX 实时数据，并返回结构化结果。</div>
            </div>
          </div>
        </div>
      </section>

      <section class="d-block">
        <h2 class="d-block-title">标签</h2>
        <div class="tag-cloud">${tags}</div>
      </section>

      <section class="d-block">
        <h2 class="d-block-title">相关技能</h2>
        <div class="related-grid">${relatedHtml}</div>
      </section>

      <section class="d-block">
        <h2 class="d-block-title">完整文档</h2>
        <div class="d-cta">
          <p class="d-block-sub">SKILL.md / README / 参考资料——全部在 GitHub 上。</p>
          <div class="d-cta-row">
            <a class="btn btn-primary" href="${ghUrl}" target="_blank" rel="noopener">在 GitHub 查看</a>
            <a class="btn btn-secondary" href="${ghUrl}/SKILL.md" target="_blank" rel="noopener">README</a>
            <a class="btn btn-secondary" href="https://www.npmjs.com/package/@sheerl/htx-cli" target="_blank" rel="noopener">NPM 包</a>
          </div>
        </div>
      </section>
    `;

    $$('.copy-btn').forEach(b => {
      b.addEventListener('click', e => {
        e.preventDefault();
        navigator.clipboard.writeText(b.dataset.copy);
        const orig = b.textContent;
        b.textContent = '已复制 ✓';
        setTimeout(() => (b.textContent = orig), 1400);
      });
    });
  }

  function categoryLabel(c) {
    const m = window.HTX_CATEGORIES.find(x => x.id === c);
    return m ? m.label : c;
  }

  function getSkillStats(skill) {
    const tags = skill.tags || [];
    const isTrading = tags.includes('下单') || tags.includes('合约下单') || tags.includes('高风险');
    const isAccount = skill.auth && !isTrading;
    const isAnalyst = skill.category === 'analyst';

    const stats = [
      {
        icon: skill.auth ? '🔐' : '🌐',
        label: '权限',
        value: skill.auth ? '需要 API Key' : '无需授权',
      },
      {
        icon: '💻',
        label: '运行环境',
        value: '本地运行 / 数据不出本机',
      },
    ];

    if (isTrading) {
      stats.push({ icon: '🔒', label: '下单操作', value: '强制人工确认' });
    } else if (isAccount) {
      stats.push({ icon: '🛡️', label: '资金划转', value: '强制人工确认' });
    } else if (isAnalyst) {
      stats.push({ icon: '🧮', label: '计算', value: '本地、开源、可审计' });
    } else {
      stats.push({ icon: '⚡', label: '数据时效', value: '实时 REST 拉取' });
    }

    return stats;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHome();
    renderDetail();
  });
})();
