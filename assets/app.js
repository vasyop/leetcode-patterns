/**
 * The book viewer.
 *
 * Everything the site knows about the book comes from `content/manifest.json`,
 * which `scripts/publish-book.mjs` (in the authoring repo) regenerates on every
 * publish. Markdown files are fetched on demand and rendered client side, so
 * adding, renaming or deleting a chapter needs no change here.
 */
(() => {
    'use strict';

    const CONTENT = 'content/';
    const STORE_THEME = 'lcp:theme';
    const STORE_ROUTE = 'lcp:route';

    const $ = (id) => document.getElementById(id);
    const el = {
        doc: $('doc'),
        chapterList: $('chapter-list'),
        sidebar: $('sidebar'),
        bookMeta: $('book-meta'),
        outline: $('outline'),
        outlineList: $('outline-list'),
        pager: $('pager'),
        footNote: $('foot-note'),
        progress: $('progress-bar'),
        scrim: $('scrim'),
        menuBtn: $('menu-btn'),
        themeBtn: $('theme-btn'),
        palette: $('palette'),
        paletteField: $('palette-field'),
        paletteResults: $('palette-results'),
        paletteCount: $('palette-count'),
        searchTrigger: $('search-trigger'),
        searchKbd: $('search-kbd'),
    };

    /** @type {{title: string, pages: Page[], generated: string}} */
    let book = null;
    /** @type {Map<string, Page>} route -> page */
    const byRoute = new Map();
    /** @type {Map<string, string>} route -> raw markdown */
    const rawCache = new Map();
    let currentRoute = null;
    let spy = null;

    /* ------------------------------------------------------------- theme */

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem(STORE_THEME, theme);
        } catch {
            /* private mode */
        }
    }

    el.themeBtn.addEventListener('click', () => {
        applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });

    /* ------------------------------------------------------------ routing */

    // "#/04-depth-first-search-dfs#some-heading" -> { route, hash }
    function parseLocation() {
        const raw = location.hash.replace(/^#\/?/, '');
        const cut = raw.indexOf('#');
        const route = cut === -1 ? raw : raw.slice(0, cut);
        const hash = cut === -1 ? '' : raw.slice(cut + 1);
        return { route: decodeURIComponent(route.replace(/\/+$/, '')), hash: decodeURIComponent(hash) };
    }

    const routeHref = (route, hash) => `#/${route}${hash ? `#${hash}` : ''}`;

    // a markdown href, relative to the page it appears on, as a viewer route
    function resolveDocHref(href, fromRoute) {
        const dir = fromRoute.includes('/') ? fromRoute.slice(0, fromRoute.lastIndexOf('/') + 1) : '';
        let target;
        try {
            target = new URL(href, `doc:/${dir}`);
        } catch {
            return null;
        }
        const path = target.pathname.replace(/^\/+/, '');
        if (!/\.md$/i.test(path)) {
            return null;
        }
        // byRoute keys the landing page under "README"; its own route is ""
        const route = path.replace(/\.md$/i, '');
        if (!byRoute.has(route)) {
            return null;
        }
        return routeHref(route === 'README' ? '' : route, target.hash.replace(/^#/, ''));
    }

    /* ------------------------------------------------------------ sidebar */

    // unlisted pages (animations a chapter links to) stay out of the contents
    const contents = () => book.pages.filter((p) => p.listed);

    function renderSidebar() {
        const chapters = contents();

        el.chapterList.innerHTML = '';
        for (const page of chapters) {
            const li = document.createElement('li');
            li.dataset.route = page.route;
            li.innerHTML = `<a class="chapter-link" href="${routeHref(page.route)}">
                <span class="chapter-num">${page.number ?? '·'}</span>
                <span class="chapter-name"></span>
            </a>`;
            li.querySelector('.chapter-name').textContent = page.title;
            el.chapterList.append(li);
        }

        const words = book.pages.reduce((sum, p) => sum + (p.words || 0), 0);
        const numbered = chapters.filter((p) => p.number !== null).length;
        el.bookMeta.textContent = `${numbered} chapters · ${Math.round(words / 1000)}k words`;
    }

    // the open chapter grows an inline list of its own headings
    function markActiveChapter(route, headings) {
        for (const li of el.sidebar.querySelectorAll('li[data-route]')) {
            const active = li.dataset.route === route;
            li.querySelector('.chapter-link').classList.toggle('active', active);
            li.querySelector('.chapter-subs')?.remove();
            if (!active || !headings.length) {
                continue;
            }
            const subs = document.createElement('ul');
            subs.className = 'chapter-subs';
            for (const h of headings) {
                const item = document.createElement('li');
                item.className = `lvl-${h.level}`;
                const a = document.createElement('a');
                a.href = routeHref(route, h.id);
                a.textContent = h.text;
                a.dataset.spy = h.id;
                item.append(a);
                subs.append(item);
            }
            li.append(subs);
        }
    }

    /* ------------------------------------------------------------ markdown */

    const slugify = (text) =>
        text
            .toLowerCase()
            .replace(/[`*_~]/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 80) || 'section';

    const COPY_ICON = `<svg class="clip" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg><svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

    function enhanceCode(root) {
        for (const code of root.querySelectorAll('pre > code')) {
            const pre = code.parentElement;
            const wrap = document.createElement('div');
            wrap.className = 'code-block';
            pre.replaceWith(wrap);
            wrap.append(pre);

            const tag = [...code.classList].find((c) => c.startsWith('language-'));
            const lang = tag ? tag.slice(9).toLowerCase() : '';
            const known = lang && window.hljs?.getLanguage(lang);

            if (known) {
                code.className = `language-${lang}`;
                try {
                    code.innerHTML = window.hljs.highlight(code.textContent, { language: lang, ignoreIllegals: true }).value;
                } catch {
                    /* leave it plain */
                }
            }
            if (!lang) {
                // an indented block with no language: an ASCII diagram, not source
                wrap.classList.add('is-diagram');
            } else if (lang !== 'ts' && lang !== 'typescript') {
                // the book is written in TypeScript, so only other languages get a label
                const label = document.createElement('span');
                label.className = 'code-lang';
                label.textContent = lang;
                wrap.append(label);
            }

            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.type = 'button';
            btn.title = 'Copy';
            btn.setAttribute('aria-label', 'Copy code');
            btn.innerHTML = COPY_ICON;
            btn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code.textContent);
                    btn.classList.add('done');
                    setTimeout(() => btn.classList.remove('done'), 1400);
                } catch {
                    /* clipboard blocked */
                }
            });
            wrap.append(btn);
        }
    }

    function enhanceHeadings(root, route) {
        const used = new Set();
        const headings = [];
        for (const h of root.querySelectorAll('h2, h3, h4')) {
            let id = slugify(h.textContent);
            for (let n = 2; used.has(id); n++) {
                id = `${slugify(h.textContent)}-${n}`;
            }
            used.add(id);
            h.id = id;
            h.classList.add('heading-anchor');
            const a = document.createElement('a');
            a.className = 'anchor';
            a.href = routeHref(route, id);
            a.textContent = '#';
            a.setAttribute('aria-label', `Link to “${h.textContent}”`);
            h.prepend(a);
            const level = Number(h.tagName[1]);
            if (level <= 3) {
                headings.push({ id, level, text: h.textContent.replace(/^#/, '') });
            }
        }
        return headings;
    }

    function enhanceLinks(root, route) {
        for (const a of root.querySelectorAll('a[href]')) {
            if (a.classList.contains('anchor')) {
                continue;
            }
            const href = a.getAttribute('href');
            if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                continue;
            }
            if (href.startsWith('#')) {
                a.setAttribute('href', routeHref(route, href.slice(1)));
                continue;
            }
            const resolved = resolveDocHref(href, route);
            if (resolved) {
                a.setAttribute('href', resolved);
            }
        }
    }

    /* --------------------------------------------------------- page loading */

    async function fetchRaw(page) {
        if (rawCache.has(page.route)) {
            return rawCache.get(page.route);
        }
        const response = await fetch(CONTENT + page.path, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        rawCache.set(page.route, text);
        return text;
    }

    function renderPager(index) {
        const list = contents();
        const at = list.findIndex((p) => p.route === index);
        el.pager.innerHTML = '';
        if (at === -1) {
            return;
        }
        const add = (page, dir) => {
            if (!page) {
                return;
            }
            const a = document.createElement('a');
            a.href = routeHref(page.route);
            a.className = dir;
            a.innerHTML = `<span class="dir">${dir === 'prev' ? '← Previous' : 'Next →'}</span><span class="name"></span>`;
            a.querySelector('.name').textContent = page.title;
            el.pager.append(a);
        };
        add(list[at - 1], 'prev');
        add(list[at + 1], 'next');
    }

    function renderOutline(headings, route) {
        el.outlineList.innerHTML = '';
        for (const h of headings) {
            const li = document.createElement('li');
            li.className = `lvl-${h.level}`;
            const a = document.createElement('a');
            a.href = routeHref(route, h.id);
            a.textContent = h.text;
            a.dataset.spy = h.id;
            li.append(a);
            el.outlineList.append(li);
        }
        el.outline.style.visibility = headings.length ? '' : 'hidden';
    }

    // highlight whichever heading the reader is currently under
    function startScrollSpy(headings) {
        spy?.disconnect();
        if (!headings.length) {
            return;
        }
        const seen = new Map();
        spy = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    seen.set(entry.target.id, entry.isIntersecting ? entry.boundingClientRect.top : Infinity);
                }
                const visible = headings.map((h) => h.id).filter((id) => seen.get(id) !== Infinity && seen.has(id));
                const active = visible[0] ?? null;
                for (const a of document.querySelectorAll('[data-spy]')) {
                    a.classList.toggle('current', a.dataset.spy === active);
                }
            },
            { rootMargin: '-84px 0px -70% 0px', threshold: 0 },
        );
        for (const h of headings) {
            const node = document.getElementById(h.id);
            if (node) {
                spy.observe(node);
            }
        }
    }

    function showError(route, error) {
        el.doc.innerHTML = '';
        const box = document.createElement('div');
        box.innerHTML = `<h1>Page not found</h1><p>Nothing is published at <code></code>.</p><p><a href="#/">Back to the contents</a></p>`;
        box.querySelector('code').textContent = route || '/';
        if (error) {
            const why = document.createElement('p');
            why.style.color = 'var(--text-faint)';
            why.textContent = String(error.message || error);
            box.append(why);
        }
        el.doc.append(box);
        el.pager.innerHTML = '';
        renderOutline([], '');
        markActiveChapter(null, []);
    }

    let renderToken = 0;

    async function show({ route, hash }) {
        const token = ++renderToken;
        const page = byRoute.get(route || 'README');
        currentRoute = route;

        if (!page) {
            showError(route, null);
            return;
        }

        document.title = route ? `${page.title} · ${book.title}` : book.title;
        el.doc.setAttribute('aria-busy', 'true');

        let markdown;
        try {
            markdown = await fetchRaw(page);
        } catch (error) {
            if (token === renderToken) {
                showError(route, error);
            }
            return;
        }
        if (token !== renderToken) {
            return; // the reader moved on while this was in flight
        }

        el.doc.innerHTML = window.marked.parse(markdown);
        el.doc.setAttribute('aria-busy', 'false');
        el.doc.classList.remove('fade-in');
        void el.doc.offsetWidth;
        el.doc.classList.add('fade-in');

        const headings = enhanceHeadings(el.doc, route);
        enhanceLinks(el.doc, route);
        enhanceCode(el.doc);

        renderOutline(headings, route);
        markActiveChapter(page.route, headings);
        renderPager(page.route);
        startScrollSpy(headings);

        el.footNote.textContent = page.words
            ? `${page.words.toLocaleString()} words · about ${Math.max(1, Math.round(page.words / 220))} min read`
            : '';

        try {
            localStorage.setItem(STORE_ROUTE, route);
        } catch {
            /* private mode */
        }

        if (hash) {
            document.getElementById(hash)?.scrollIntoView();
        } else {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
        closeDrawer();
    }

    /* -------------------------------------------------------------- search */

    /** @type {{route: string, title: string, heading: string, id: string, text: string}[]} */
    let index = null;
    let indexing = null;
    let results = [];
    let selected = 0;

    // one entry per heading, holding the prose that follows it
    function sectionsOf(page, markdown) {
        const lines = markdown.split(/\r?\n/); // the book is authored on Windows
        const sections = [];
        let heading = '';
        let id = '';
        let buffer = [];
        let fenced = false;

        const flush = () => {
            const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
            if (text || heading) {
                sections.push({ route: page.route, title: page.title, heading, id, text });
            }
            buffer = [];
        };

        for (const line of lines) {
            if (/^\s*```/.test(line)) {
                fenced = !fenced;
                continue;
            }
            const match = !fenced && /^(#{1,4})\s+(.*)$/.exec(line);
            if (match) {
                flush();
                heading = match[2].trim();
                id = match[1].length === 1 ? '' : slugify(heading);
                continue;
            }
            buffer.push(line.replace(/[`*_>]/g, ''));
        }
        flush();
        return sections;
    }

    async function buildIndex() {
        if (index) {
            return index;
        }
        if (!indexing) {
            indexing = Promise.all(
                book.pages.map(async (page) => {
                    try {
                        return sectionsOf(page, await fetchRaw(page));
                    } catch {
                        return [];
                    }
                }),
            ).then((all) => {
                index = all.flat();
                return index;
            });
        }
        return indexing;
    }

    function search(query) {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.length || !index) {
            return [];
        }
        const phrase = query.toLowerCase().trim();
        const scored = [];

        for (const entry of index) {
            const heading = entry.heading.toLowerCase();
            const title = entry.title.toLowerCase();
            const body = entry.text.toLowerCase();
            const hay = `${title} ${heading} ${body}`;
            if (!terms.every((t) => hay.includes(t))) {
                continue;
            }
            let score = 0;
            if (title.includes(phrase)) score += 60;
            if (heading.includes(phrase)) score += 40;
            if (body.includes(phrase)) score += 14;
            for (const term of terms) {
                if (title.includes(term)) score += 10;
                if (heading.includes(term)) score += 7;
                score += Math.min(6, (body.split(term).length - 1) * 1.5);
            }
            scored.push({ entry, score, at: body.indexOf(terms[0]) });
        }
        return scored.sort((a, b) => b.score - a.score).slice(0, 30);
    }

    const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

    function highlight(text, terms) {
        let html = escapeHtml(text);
        for (const term of [...new Set(terms)].sort((a, b) => b.length - a.length)) {
            const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            html = html.replace(new RegExp(`(${safe})(?![^<]*>)`, 'gi'), '<mark>$1</mark>');
        }
        return html;
    }

    function renderResults(query) {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        el.paletteResults.innerHTML = '';
        selected = 0;

        if (!query.trim()) {
            el.paletteResults.innerHTML = `<p class="palette-empty">Type to search every chapter.</p>`;
            el.paletteCount.textContent = '';
            return;
        }
        if (!results.length) {
            el.paletteResults.innerHTML = `<p class="palette-empty">No matches for “${escapeHtml(query)}”.</p>`;
            el.paletteCount.textContent = '0 results';
            return;
        }

        for (const [i, hit] of results.entries()) {
            const { entry, at } = hit;
            const from = Math.max(0, at - 60);
            const snippet = (from ? '…' : '') + entry.text.slice(from, from + 190) + (entry.text.length > from + 190 ? '…' : '');
            const a = document.createElement('a');
            a.className = `result${i === 0 ? ' sel' : ''}`;
            a.href = routeHref(entry.route, entry.id);
            a.innerHTML = `<span class="result-top">
                <span class="result-title">${highlight(entry.heading || entry.title, terms)}</span>
                <span class="result-where"></span>
            </span>
            <span class="result-snip">${highlight(snippet, terms)}</span>`;
            a.querySelector('.result-where').textContent = entry.title;
            a.addEventListener('click', closePalette);
            a.addEventListener('mousemove', () => select(i));
            el.paletteResults.append(a);
        }
        el.paletteCount.textContent = `${results.length} result${results.length === 1 ? '' : 's'}`;
    }

    function select(i) {
        const nodes = [...el.paletteResults.querySelectorAll('.result')];
        if (!nodes.length) {
            return;
        }
        selected = (i + nodes.length) % nodes.length;
        nodes.forEach((n, k) => n.classList.toggle('sel', k === selected));
        nodes[selected].scrollIntoView({ block: 'nearest' });
    }

    async function openPalette() {
        el.palette.hidden = false;
        document.body.style.overflow = 'hidden';
        el.paletteField.value = '';
        el.paletteResults.innerHTML = `<p class="palette-empty">Indexing the book…</p>`;
        el.paletteField.focus();
        await buildIndex();
        if (!el.palette.hidden && !el.paletteField.value) {
            renderResults('');
        }
    }

    function closePalette() {
        el.palette.hidden = true;
        document.body.style.overflow = '';
    }

    el.searchTrigger.addEventListener('click', openPalette);
    el.palette.addEventListener('click', (event) => {
        if (event.target.hasAttribute('data-close')) {
            closePalette();
        }
    });

    let debounce;
    el.paletteField.addEventListener('input', () => {
        clearTimeout(debounce);
        const query = el.paletteField.value;
        debounce = setTimeout(async () => {
            await buildIndex();
            results = search(query);
            renderResults(query);
        }, 90);
    });

    el.paletteField.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            select(selected + 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            select(selected - 1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            el.paletteResults.querySelectorAll('.result')[selected]?.click();
        } else if (event.key === 'Escape') {
            closePalette();
        }
    });

    /* ------------------------------------------------------ chrome & events */

    function openDrawer() {
        el.sidebar.classList.add('open');
        el.scrim.hidden = false;
        el.menuBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
        el.sidebar.classList.remove('open');
        el.scrim.hidden = true;
        el.menuBtn.setAttribute('aria-expanded', 'false');
    }

    el.menuBtn.addEventListener('click', () => (el.sidebar.classList.contains('open') ? closeDrawer() : openDrawer()));
    el.scrim.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (event) => {
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
        if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            el.palette.hidden ? openPalette() : closePalette();
            return;
        }
        if (event.key === '/' && !typing && el.palette.hidden) {
            event.preventDefault();
            openPalette();
            return;
        }
        if (event.key === 'Escape') {
            closePalette();
            closeDrawer();
            return;
        }
        if (typing || !el.palette.hidden || event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        // j/k and the arrows page through chapters
        const step = event.key === 'ArrowRight' || event.key === 'j' ? 1 : event.key === 'ArrowLeft' || event.key === 'k' ? -1 : 0;
        if (step) {
            const list = book ? contents() : [];
            const at = list.findIndex((p) => p.route === (currentRoute || 'README'));
            const next = list[at + step];
            if (at !== -1 && next) {
                location.hash = routeHref(next.route);
            }
        }
    });

    const onScroll = () => {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        el.progress.style.width = `${height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    window.addEventListener('hashchange', () => show(parseLocation()));

    /* ---------------------------------------------------------------- boot */

    if (navigator.platform?.includes('Mac') || /Mac|iPhone|iPad/.test(navigator.userAgent)) {
        el.searchKbd.textContent = '⌘K';
    }

    async function boot() {
        try {
            const response = await fetch(`${CONTENT}manifest.json`, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`manifest: ${response.status}`);
            }
            book = await response.json();
        } catch (error) {
            el.doc.innerHTML = `<h1>The book failed to load</h1><p>Could not read <code>content/manifest.json</code>.</p>`;
            el.doc.append(Object.assign(document.createElement('p'), { textContent: String(error), style: 'color:var(--text-faint)' }));
            return;
        }

        for (const page of book.pages) {
            byRoute.set(page.route || 'README', page);
        }
        document.title = book.title;
        renderSidebar();

        if (!location.hash) {
            let last = null;
            try {
                last = localStorage.getItem(STORE_ROUTE);
            } catch {
                /* private mode */
            }
            if (last && byRoute.has(last)) {
                history.replaceState(null, '', routeHref(last));
            }
        }
        await show(parseLocation());
        onScroll();
    }

    // marked and highlight.js are deferred too, and defer keeps document order
    boot();
})();
