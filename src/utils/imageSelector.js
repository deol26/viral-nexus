/**
 * Deterministic Image Selector for Link Previews
 * Selects preview images based on scoring algorithm using title/keyword matching
 */

// Common English stop words to exclude from token matching
const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how', 'over'
]);

// Weights for scoring components
const WEIGHTS = {
    filename: 0.6,
    altCaption: 0.3,
    keywordTag: 0.4,
    resolution: 0.05
};

// Minimum score threshold to accept an image
const SCORE_THRESHOLD = 0.05;

// In-memory cache for image selections
const selectionCache = new Map();

/**
 * Normalize text into token set: lowercase, remove punctuation, filter stop words
 * @param {string|string[]} input - Text or array of strings to normalize
 * @returns {Set<string>} Set of normalized tokens
 */
function normalizeTokens(input) {
    if (!input) return new Set();
    
    const text = Array.isArray(input) ? input.join(' ') : String(input);
    const tokens = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(token => token.length > 2 && !STOP_WORDS.has(token));
    
    return new Set(tokens);
}

/**
 * Calculate token overlap between two token sets
 * @param {Set<string>} set1 - First token set
 * @param {Set<string>} set2 - Second token set
 * @returns {number} Overlap ratio (0-1)
 */
function calculateOverlap(set1, set2) {
    if (set1.size === 0 || set2.size === 0) return 0;
    
    const intersection = new Set([...set1].filter(token => set2.has(token)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Extract tokens from URL/filename
 * @param {string} url - Image URL
 * @returns {Set<string>} Tokens from URL path and filename
 */
function extractUrlTokens(url) {
    if (!url) return new Set();
    
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop().split('.')[0]; // Get filename without extension
        return normalizeTokens(pathname + ' ' + filename);
    } catch {
        // If URL parsing fails, try to extract from string directly
        const parts = url.split('/').pop().split('.')[0];
        return normalizeTokens(parts);
    }
}

/**
 * Score a single image candidate
 * @param {Object} image - Image candidate with url, alt, caption, width, height
 * @param {Set<string>} titleTokens - Normalized title tokens
 * @param {Set<string>} keywordTokens - Normalized keyword tokens
 * @returns {number} Score for this image (0-1+)
 */
function scoreImage(image, titleTokens, keywordTokens) {
    if (!image || !image.url) return 0;
    
    let score = 0;
    
    // 1. Filename/URL token overlap with title and keywords (weight 0.6)
    const urlTokens = extractUrlTokens(image.url);
    const combinedTokens = new Set([...titleTokens, ...keywordTokens]);
    const filenameOverlap = calculateOverlap(urlTokens, combinedTokens);
    score += filenameOverlap * WEIGHTS.filename;
    
    // 2. Alt text and caption overlap (weight 0.3)
    const altCaptionTokens = normalizeTokens([image.alt || '', image.caption || ''].join(' '));
    const altOverlap = calculateOverlap(altCaptionTokens, combinedTokens);
    score += altOverlap * WEIGHTS.altCaption;
    
    // 3. Explicit keyword tag match (weight 0.4)
    if (image.keywords && Array.isArray(image.keywords)) {
        const imageKeywordTokens = normalizeTokens(image.keywords);
        const keywordOverlap = calculateOverlap(imageKeywordTokens, keywordTokens);
        score += keywordOverlap * WEIGHTS.keywordTag;
    }
    
    // 4. Small resolution boost for higher quality images (weight 0.05)
    if (image.width && image.height) {
        const pixels = image.width * image.height;
        const normalizedResolution = Math.min(pixels / 1000000, 1); // Normalize to 1MP max
        score += normalizedResolution * WEIGHTS.resolution;
    }
    
    return score;
}

/**
 * Collect candidate images from all available sources
 * @param {Object} linkJson - Link object with images array
 * @param {Object} pageMeta - Optional page metadata with images, ogImage, twitterImage
 * @returns {Array<Object>} Array of candidate images with source tracking
 */
function collectCandidates(linkJson, pageMeta) {
    const candidates = [];
    
    // 1. Images from linkJson.images array (highest priority)
    if (linkJson.images && Array.isArray(linkJson.images)) {
        linkJson.images.forEach(img => {
            if (img && img.url) {
                candidates.push({ ...img, source: 'json-match' });
            }
        });
    }
    
    // 2. Images from pageMeta.images
    if (pageMeta && pageMeta.images && Array.isArray(pageMeta.images)) {
        pageMeta.images.forEach(img => {
            if (img && img.url) {
                candidates.push({ ...img, source: 'page-first' });
            }
        });
    }
    
    // 3. Meta tags (og:image, twitter:image)
    if (linkJson.meta || pageMeta) {
        const meta = linkJson.meta || pageMeta;
        if (meta.ogImage) {
            candidates.push({ url: meta.ogImage, source: 'meta-og' });
        }
        if (meta.twitterImage && meta.twitterImage !== meta.ogImage) {
            candidates.push({ url: meta.twitterImage, source: 'meta-og' });
        }
    }
    
    return candidates;
}

/**
 * Select the best preview image for a link based on scoring algorithm
 * @param {Object} linkJson - Link object with url, title, keywords, images, meta
 * @param {Object} pageMeta - Optional additional page metadata
 * @param {Object} options - Optional configuration { threshold, useCache, isDevelopment }
 * @returns {Object} Selection result with imageUrl, reason, score
 */
function selectPreviewImage(linkJson, pageMeta = null, options = {}) {
    if (!linkJson || typeof linkJson !== 'object') {
        return getPlaceholderResult('Invalid input');
    }
    
    const {
        threshold = SCORE_THRESHOLD,
        useCache = true,
        isDevelopment = false
    } = options;
    
    // Check cache first
    const cacheKey = linkJson.url || JSON.stringify(linkJson);
    if (useCache && selectionCache.has(cacheKey)) {
        const cached = selectionCache.get(cacheKey);
        if (isDevelopment) {
            console.debug('[ImageSelector] Cache hit:', cached);
        }
        return cached;
    }
    
    // Also check localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage && useCache) {
        try {
            const localCacheKey = 'img_select_' + cacheKey;
            const cached = localStorage.getItem(localCacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                selectionCache.set(cacheKey, parsed);
                if (isDevelopment) {
                    console.debug('[ImageSelector] LocalStorage cache hit:', parsed);
                }
                return parsed;
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    }
    
    // Normalize title and keywords into token sets
    const titleTokens = normalizeTokens(linkJson.title || '');
    const keywordTokens = normalizeTokens(linkJson.keywords || []);
    
    // Collect all candidate images
    const candidates = collectCandidates(linkJson, pageMeta);
    
    if (candidates.length === 0) {
        return cacheAndReturn(cacheKey, getPlaceholderResult('No images available'), useCache, isDevelopment);
    }
    
    // Score each candidate
    const scoredCandidates = candidates.map(img => ({
        ...img,
        score: scoreImage(img, titleTokens, keywordTokens)
    }));
    
    // Sort by score (descending), then by URL (lexicographic) for deterministic tie-breaking
    scoredCandidates.sort((a, b) => {
        if (Math.abs(a.score - b.score) < 0.0001) {
            // Tie-breaker: lexicographically smallest URL
            return a.url.localeCompare(b.url);
        }
        return b.score - a.score;
    });
    
    const best = scoredCandidates[0];
    
    // Check if best score meets threshold
    if (best.score >= threshold) {
        const result = {
            imageUrl: best.url,
            reason: best.source,
            score: best.score
        };
        return cacheAndReturn(cacheKey, result, useCache, isDevelopment);
    }
    
    // Fallback logic: try in order of preference
    // 1. Best scored image from linkJson (even if below threshold)
    const jsonImage = scoredCandidates.find(c => c.source === 'json-match');
    if (jsonImage) {
        const result = {
            imageUrl: jsonImage.url,
            reason: 'json-match',
            score: jsonImage.score
        };
        return cacheAndReturn(cacheKey, result, useCache, isDevelopment);
    }
    
    // 2. og/twitter meta image
    const metaImage = scoredCandidates.find(c => c.source === 'meta-og');
    if (metaImage) {
        const result = {
            imageUrl: metaImage.url,
            reason: 'meta-og',
            score: metaImage.score
        };
        return cacheAndReturn(cacheKey, result, useCache, isDevelopment);
    }
    
    // 3. First page image
    const pageImage = scoredCandidates.find(c => c.source === 'page-first');
    if (pageImage) {
        const result = {
            imageUrl: pageImage.url,
            reason: 'page-first',
            score: pageImage.score
        };
        return cacheAndReturn(cacheKey, result, useCache, isDevelopment);
    }
    
    // 4. Default placeholder
    return cacheAndReturn(cacheKey, getPlaceholderResult('No suitable image found'), useCache, isDevelopment);
}

/**
 * Get placeholder result
 * @param {string} message - Debug message
 * @returns {Object} Placeholder result
 */
function getPlaceholderResult(message) {
    return {
        imageUrl: null,
        reason: 'placeholder',
        score: 0,
        message
    };
}

/**
 * Cache result and return it
 * @param {string} cacheKey - Cache key
 * @param {Object} result - Selection result
 * @param {boolean} useCache - Whether to use caching
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {Object} The result
 */
function cacheAndReturn(cacheKey, result, useCache, isDevelopment) {
    if (useCache) {
        selectionCache.set(cacheKey, result);
        
        // Also cache to localStorage on client
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const localCacheKey = 'img_select_' + cacheKey;
                localStorage.setItem(localCacheKey, JSON.stringify(result));
            } catch (e) {
                // Ignore localStorage errors (quota, etc.)
            }
        }
    }
    
    if (isDevelopment) {
        console.debug('[ImageSelector] Selection:', {
            imageUrl: result.imageUrl,
            reason: result.reason,
            score: result.score
        });
    }
    
    return result;
}

/**
 * Clear selection cache (useful for testing or manual refresh)
 */
function clearCache() {
    selectionCache.clear();
    
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('img_select_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            // Ignore localStorage errors
        }
    }
}

// Export for use in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selectPreviewImage,
        clearCache,
        // Export internals for testing
        normalizeTokens,
        calculateOverlap,
        scoreImage,
        extractUrlTokens
    };
}

// Also make available as global in browser
if (typeof window !== 'undefined') {
    window.ImageSelector = {
        selectPreviewImage,
        clearCache,
        // Export internals for testing
        normalizeTokens,
        calculateOverlap,
        scoreImage,
        extractUrlTokens
    };
}

