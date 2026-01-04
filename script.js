// User experience script for Viral Nexus – JSON file backed

const state = {
    links: [],
    filtered: [],
    keywords: [],
    category: 'all',
    search: '',
    visible: 6,
    darkMode: false
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadLinksFromJSON();
    setupEventListeners();
    applyFilters();
    renderKeywordHeatmap();
    updateCategoryStats();
    applyDarkMode(state.darkMode); // Initialize dark mode UI
});

async function loadLinksFromJSON() {
    try {
        console.log('Loading links from links.json...');
        const response = await fetch('links.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load links.json: ${response.status}`);
        }
        
        state.links = await response.json();
        state.keywords = buildKeywordsFromLinks(state.links);
        console.log(`Loaded ${state.links.length} viral links`);
    } catch (error) {
        console.error('Error loading links:', error);
        document.getElementById('link-list').innerHTML = `
            <div class="error" style="padding: 2rem; text-align: center; background: #ff4444; color: white; border-radius: 8px;">
                <h3>⚠️ Failed to load viral content</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p style="margin-top: 1rem;">
                    Make sure links.json exists in the same folder as index.html.<br>
                    If you're using GitHub Pages, wait 2-5 minutes for deployment.
                </p>
            </div>
        `;
    }
}

function setupEventListeners() {
    document.getElementById('search-btn').addEventListener('click', () => {
        state.search = document.getElementById('search-bar').value.trim();
        applyFilters();
    });

    document.getElementById('search-bar').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            state.search = e.target.value.trim();
            applyFilters();
        }
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.category = btn.dataset.category;
            applyFilters();
        });
    });

    document.getElementById('load-more').addEventListener('click', () => {
        state.visible += 5;
        renderLinks();
    });

    const darkToggle = document.getElementById('dark-mode-toggle');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            state.darkMode = !state.darkMode;
            applyDarkMode(state.darkMode);
        });
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => alert('Demo login - Connect your auth provider here.'));
    }

    const subscribeBtn = document.getElementById('subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            const email = document.getElementById('digest-email').value.trim();
            if (!email) {
                alert('Enter an email to subscribe.');
                return;
            }
            alert(`Subscribed ${email} to the Viral Digest (demo).`);
            document.getElementById('digest-email').value = '';
        });
    }
}

function applyFilters() {
    const query = state.search.toLowerCase();
    state.filtered = state.links.filter(link => {
        const matchesCategory = state.category === 'all' || link.category === state.category;
        const haystack = [link.title, link.description, link.source, (link.keywords || []).join(' ')]
            .join(' ')
            .toLowerCase();
        const matchesSearch = haystack.includes(query);
        return matchesCategory && matchesSearch;
    });
    state.visible = Math.min(6, state.filtered.length || 6);
    renderLinks();
}

function renderLinks() {
    const list = document.getElementById('link-list');
    list.innerHTML = '';

    if (!state.filtered.length) {
        list.innerHTML = '<p class="empty">No results yet. Try another category or keyword.</p>';
        document.getElementById('load-more').style.display = 'none';
        return;
    }

    const subset = state.filtered.slice(0, state.visible);
    subset.forEach((link, index) => {
        const rank = index + 1;
        const item = document.createElement('div');
        item.className = 'link-item';
        item.dataset.category = link.category;
        const thumbnail = getRelevantThumbnail(link);
        item.innerHTML = `
            <div class="link-rank">${rank}</div>
            <div class="link-thumbnail">
                <img src="${thumbnail}" alt="${link.title}" loading="lazy" onerror="this.src='${getPlaceholderImage(link.category)}'">
            </div>
            <div class="link-content">
                <h3 class="link-title"><a href="${link.url}" target="_blank" rel="noopener">${link.title}</a></h3>
                <div class="link-meta">
                    <span class="link-source">${link.source || 'Unknown'}</span>
                    <span class="link-time">• ${formatTimeAgo(link.createdAt)}</span>
                    <span class="link-score">• ⭐ ${link.viralScore || 0}/100</span>
                    <span class="link-clicks">• ${(link.clicks || 0).toLocaleString()} clicks</span>
                </div>
                <p class="link-description">${link.description || ''}</p>
                <div class="link-keywords">${(link.keywords || []).map(k => `<span class="keyword" data-keyword="${k}">${k}</span>`).join('')}</div>
            </div>
        `;
        list.appendChild(item);
    });

    list.querySelectorAll('.keyword').forEach(tag => {
        tag.addEventListener('click', (e) => {
            state.search = e.target.dataset.keyword;
            document.getElementById('search-bar').value = state.search;
            applyFilters();
        });
    });

    const loadMoreBtn = document.getElementById('load-more');
    loadMoreBtn.style.display = state.filtered.length > state.visible ? 'block' : 'none';
}

function getRelevantThumbnail(link) {
    // If link has a custom thumbnail, use it
    if (link.thumbnail) {
        return link.thumbnail;
    }
    
    // Get the primary keyword or first keyword
    const keyword = link.keywords && link.keywords.length > 0 
        ? link.keywords[0] 
        : link.title || link.category;
    
    // Use Picsum with a deterministic ID based on keyword for consistency
    // This ensures same keyword always gets same image
    const keywordHash = keyword.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    const imageId = (keywordHash % 1000) + 1; // Range 1-1000
    
    return `https://picsum.photos/id/${imageId}/250/150`;
}

function formatTimeAgo(dateInput) {
    if (!dateInput) return 'just now';
    const ts = new Date(dateInput).getTime();
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins || 1} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function renderKeywordHeatmap() {
    const heatmap = document.getElementById('keyword-heatmap');
    if (!heatmap) return;
    const sorted = [...state.keywords].sort((a, b) => b.usage - a.usage).slice(0, 12);
    heatmap.innerHTML = sorted.map((kw, i) => {
        const size = i < 3 ? 'large' : i < 7 ? 'medium' : 'small';
        return `<span class="heatmap-keyword ${size}" data-keyword="${kw.name}">${kw.name}</span>`;
    }).join('');

    heatmap.querySelectorAll('.heatmap-keyword').forEach(node => {
        node.addEventListener('click', (e) => {
            state.search = e.target.dataset.keyword;
            document.getElementById('search-bar').value = state.search;
            applyFilters();
        });
    });
}

function updateCategoryStats() {
    const counts = state.links.reduce((acc, link) => {
        acc[link.category] = (acc[link.category] || 0) + 1;
        return acc;
    }, {});
    const total = state.links.length || 1;
    document.querySelectorAll('#category-stats li').forEach(li => {
        const text = li.firstChild.textContent.trim().toLowerCase();
        const key = text.split(' ')[0];
        const val = counts[key] || 0;
        const pct = Math.round((val / total) * 100);
        const span = li.querySelector('.stat-count');
        if (span) span.textContent = `${pct}%`;
    });
}

function applyDarkMode(on) {
    document.body.classList.toggle('dark-mode', on);
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.textContent = on ? '☀️' : '🌙';
}

function buildKeywordsFromLinks(links) {
    const map = new Map();
    links.forEach(link => {
        (link.keywords || []).forEach(term => {
            const key = term.trim();
            if (!key) return;
            const existing = map.get(key) || { id: `kw-${map.size + 1}`, name: key, usage: 0, synonyms: [] };
            existing.usage += 1;
            map.set(key, existing);
        });
    });
    return Array.from(map.values()).sort((a, b) => b.usage - a.usage);
}

function getPlaceholderImage(category) {
    const placeholders = {
        news: 'https://placehold.co/250x150/ff4500/white?text=Breaking+News',
        videos: 'https://placehold.co/250x150/ff4500/white?text=Video',
        products: 'https://placehold.co/250x150/ff4500/white?text=Product',
        tweets: 'https://placehold.co/250x150/ff4500/white?text=Tweet',
        memes: 'https://placehold.co/250x150/ff4500/white?text=Meme'
    };
    return placeholders[category] || placeholders.news;
}
