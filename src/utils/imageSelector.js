/**
 * Image Selection Utility for Viral Nexus
 * Provides deterministic, relevance-based image selection for link previews
 * 
 * @module imageSelector
 */

// Common English stopwords to filter out
const STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with'
]);

// In-memory cache for selection results
const selectionCache = new Map();

// Score threshold for considering an image relevant
const RELEVANCE_THRESHOLD = 0.1;

// Weights for different scoring components
const WEIGHTS = {
    filename: 0.6,    // URL/filename token overlap with title/keywords
    altText: 0.3,     // Alt text/caption overlap
    keywords: 0.4,    // Explicit keyword tag matches
    resolution: 0.1   // Bonus for higher resolution images
};

/**
 * Normalize and tokenize text for matching
 * @param {string} text - Text to tokenize
 * @returns {Set<string>} Set of normalized tokens
 */
function tokenize(text) {
    if (!text || typeof text !== 'string') return new Set();
    
    return new Set(
        text
            .toLowerCase()
            .replace(/[^\w\s-]/g, ' ') // Remove punctuation except hyphens
            .split(/\s+/)
            .map(token => token.trim())
            .filter(token => token.length > 2 && !STOPWORDS.has(token))
    );
}

/**
 * Calculate Jaccard similarity between two token sets
 * @param {Set<string>} setA - First token set
 * @param {Set<string>} setB - Second token set
 * @returns {number} Similarity score between 0 and 1
 */
function jaccardSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 0;
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Extract tokens from link metadata
 * @param {Object} linkJson - Link metadata object
 * @returns {Set<string>} Combined token set from title and keywords
 */
function extractLinkTokens(linkJson) {
    const tokens = new Set();
    
    // Add title tokens
    if (linkJson.title) {
        tokenize(linkJson.title).forEach(t => tokens.add(t));
    }
    
    // Add keyword tokens
    const keywords = linkJson.keywords || [];
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    keywordArray.forEach(kw => {
        if (kw && typeof kw === 'string') {
            tokenize(kw).forEach(t => tokens.add(t));
        }
    });
    
    return tokens;
}

/**
 * Extract URL path components for matching
 * @param {string} url - Image URL
 * @returns {Set<string>} Tokens from URL path and filename
 */
function extractUrlTokens(url) {
    if (!url || typeof url !== 'string') return new Set();
    
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
        const tokens = new Set();
        
        pathParts.forEach(part => {
            // Extract tokens from each path component
            tokenize(part).forEach(t => tokens.add(t));
            
            // Also split on hyphens and underscores
            part.split(/[-_]/).forEach(subpart => {
                tokenize(subpart).forEach(t => tokens.add(t));
            });
        });
        
        return tokens;
    } catch (e) {
        // If URL parsing fails, just tokenize the whole string
        return tokenize(url);
    }
}

/**
 * Score an image candidate based on relevance to link metadata
 * @param {Object} image - Image candidate object
 * @param {Set<string>} linkTokens - Tokens from link title/keywords
 * @param {Array<string>} keywordArray - Original keyword array for exact matching
 * @returns {number} Relevance score
 */
function scoreImage(image, linkTokens, keywordArray) {
    let score = 0;
    
    // Score component 1: URL/filename overlap
    const urlTokens = extractUrlTokens(image.url || '');
    const filenameScore = jaccardSimilarity(urlTokens, linkTokens);
    score += filenameScore * WEIGHTS.filename;
    
    // Score component 2: Alt text/caption overlap
    const altTokens = new Set();
    if (image.alt) {
        tokenize(image.alt).forEach(t => altTokens.add(t));
    }
    if (image.caption) {
        tokenize(image.caption).forEach(t => altTokens.add(t));
    }
    const altScore = jaccardSimilarity(altTokens, linkTokens);
    score += altScore * WEIGHTS.altText;
    
    // Score component 3: Explicit keyword matches
    let keywordMatches = 0;
    keywordArray.forEach(keyword => {
        const kwTokens = tokenize(keyword);
        const urlMatch = [...kwTokens].some(t => urlTokens.has(t));
        const altMatch = [...kwTokens].some(t => altTokens.has(t));
        if (urlMatch || altMatch) keywordMatches++;
    });
    if (keywordArray.length > 0) {
        score += (keywordMatches / keywordArray.length) * WEIGHTS.keywords;
    }
    
    // Score component 4: Resolution bonus (prefer higher resolution)
    if (image.width && image.height) {
        const pixels = image.width * image.height;
        // Bonus for images > 100k pixels (e.g., 400x250)
        if (pixels > 100000) {
            score += WEIGHTS.resolution;
        }
    }
    
    return score;
}

/**
 * Extract image candidates from various sources
 * @param {Object} linkJson - Link metadata
 * @param {Object} pageMeta - Optional page metadata with scraped images
 * @returns {Array<Object>} Array of image candidates
 */
function extractImageCandidates(linkJson, pageMeta) {
    const candidates = [];
    
    // Source 1: Images from linkJson.images array
    if (linkJson.images && Array.isArray(linkJson.images)) {
        linkJson.images.forEach(img => {
            if (img && img.url) {
                candidates.push({
                    url: img.url,
                    alt: img.alt,
                    caption: img.caption,
                    width: img.width,
                    height: img.height,
                    source: 'linkJson'
                });
            }
        });
    }
    
    // Source 2: og:image and twitter:image from meta tags
    if (linkJson.meta) {
        if (linkJson.meta.ogImage) {
            candidates.push({
                url: linkJson.meta.ogImage,
                source: 'ogImage'
            });
        }
        if (linkJson.meta.twitterImage && linkJson.meta.twitterImage !== linkJson.meta.ogImage) {
            candidates.push({
                url: linkJson.meta.twitterImage,
                source: 'twitterImage'
            });
        }
    }
    
    // Source 3: Page meta images (if provided)
    if (pageMeta && pageMeta.images && Array.isArray(pageMeta.images)) {
        pageMeta.images.forEach(img => {
            if (img && img.url) {
                candidates.push({
                    url: img.url,
                    alt: img.alt,
                    caption: img.caption,
                    width: img.width,
                    height: img.height,
                    source: 'pageMeta'
                });
            }
        });
    }
    
    // Source 4: If link has a thumbnail field (legacy support)
    if (linkJson.thumbnail && typeof linkJson.thumbnail === 'string') {
        candidates.push({
            url: linkJson.thumbnail,
            source: 'thumbnail'
        });
    }
    
    return candidates;
}

/**
 * Get placeholder image URL based on category
 * @param {string} category - Content category
 * @returns {string} Placeholder image URL
 */
function getPlaceholderImage(category) {
    const placeholders = {
        news: 'https://placehold.co/250x150/ff4500/white?text=Breaking+News',
        videos: 'https://placehold.co/250x150/ff4500/white?text=Video',
        products: 'https://placehold.co/250x150/ff4500/white?text=Product',
        tweets: 'https://placehold.co/250x150/ff4500/white?text=Tweet',
        memes: 'https://placehold.co/250x150/ff4500/white?text=Meme',
        tools: 'https://placehold.co/250x150/ff4500/white?text=Tool'
    };
    return placeholders[category] || placeholders.news;
}

/**
 * Select the most relevant preview image for a link using deterministic scoring
 * 
 * @param {Object} linkJson - Link metadata object
 * @param {string} linkJson.url - Link URL (used for caching)
 * @param {string} [linkJson.title] - Link title
 * @param {Array<string>|string} [linkJson.keywords] - Keywords/tags
 * @param {Array<Object>} [linkJson.images] - Array of image objects
 * @param {Object} [linkJson.meta] - Meta tags (ogImage, twitterImage)
 * @param {string} [linkJson.category] - Content category for placeholder
 * @param {Object} [pageMeta] - Optional page metadata with additional images
 * @param {Object} [options] - Selection options
 * @param {boolean} [options.useCache=true] - Whether to use cached results
 * @param {boolean} [options.debug=false] - Enable debug logging
 * 
 * @returns {Object} Selection result
 * @returns {string} result.imageUrl - Selected image URL
 * @returns {string} result.reason - Why this image was selected
 * @returns {number} result.score - Relevance score (if applicable)
 */
function selectPreviewImage(linkJson, pageMeta = null, options = {}) {
    const { useCache = true, debug = false } = options;
    
    // Input validation
    if (!linkJson || typeof linkJson !== 'object') {
        if (debug) console.debug('[imageSelector] Invalid linkJson, using placeholder');
        return {
            imageUrl: getPlaceholderImage('news'),
            reason: 'invalid_input',
            score: 0
        };
    }
    
    // Check cache
    const cacheKey = linkJson.url || JSON.stringify(linkJson);
    if (useCache && selectionCache.has(cacheKey)) {
        const cached = selectionCache.get(cacheKey);
        if (debug) console.debug('[imageSelector] Using cached result:', cached);
        return cached;
    }
    
    // Extract link tokens for matching
    const linkTokens = extractLinkTokens(linkJson);
    const keywords = linkJson.keywords || [];
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    
    // Get all image candidates
    const candidates = extractImageCandidates(linkJson, pageMeta);
    
    if (debug) {
        console.debug('[imageSelector] Link tokens:', Array.from(linkTokens));
        console.debug('[imageSelector] Found candidates:', candidates.length);
    }
    
    // Score all candidates
    const scoredCandidates = candidates.map(img => ({
        ...img,
        score: scoreImage(img, linkTokens, keywordArray)
    }));
    
    // Sort by score (descending), then by URL (lexicographic) for deterministic tie-breaking
    scoredCandidates.sort((a, b) => {
        if (Math.abs(a.score - b.score) < 0.001) {
            // Tie-breaker: lexicographically smallest URL
            return a.url.localeCompare(b.url);
        }
        return b.score - a.score;
    });
    
    if (debug && scoredCandidates.length > 0) {
        console.debug('[imageSelector] Top 3 candidates:', 
            scoredCandidates.slice(0, 3).map(c => ({ url: c.url, score: c.score }))
        );
    }
    
    // Select the best candidate if it meets the threshold
    let result;
    
    if (scoredCandidates.length > 0 && scoredCandidates[0].score >= RELEVANCE_THRESHOLD) {
        result = {
            imageUrl: scoredCandidates[0].url,
            reason: `scored_match (${scoredCandidates[0].source})`,
            score: scoredCandidates[0].score
        };
    } else if (linkJson.meta && linkJson.meta.ogImage) {
        // Fallback 1: og:image
        result = {
            imageUrl: linkJson.meta.ogImage,
            reason: 'fallback_og_image',
            score: 0
        };
    } else if (linkJson.meta && linkJson.meta.twitterImage) {
        // Fallback 2: twitter:image
        result = {
            imageUrl: linkJson.meta.twitterImage,
            reason: 'fallback_twitter_image',
            score: 0
        };
    } else if (candidates.length > 0) {
        // Fallback 3: First available image
        result = {
            imageUrl: candidates[0].url,
            reason: 'fallback_first_image',
            score: 0
        };
    } else {
        // Fallback 4: Category placeholder
        result = {
            imageUrl: getPlaceholderImage(linkJson.category),
            reason: 'fallback_placeholder',
            score: 0
        };
    }
    
    // Cache the result
    if (useCache) {
        selectionCache.set(cacheKey, result);
    }
    
    if (debug) {
        console.debug('[imageSelector] Selected:', result);
    }
    
    return result;
}

/**
 * Clear the selection cache (useful for testing or memory management)
 */
function clearCache() {
    selectionCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getCacheStats() {
    return {
        size: selectionCache.size,
        keys: Array.from(selectionCache.keys())
    };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS environment
    module.exports = {
        selectPreviewImage,
        clearCache,
        getCacheStats,
        // Expose internal functions for testing
        tokenize,
        jaccardSimilarity,
        extractLinkTokens,
        extractUrlTokens,
        scoreImage,
        getPlaceholderImage
    };
}

// Also support browser global (for direct script inclusion)
if (typeof window !== 'undefined') {
    window.imageSelector = {
        selectPreviewImage,
        clearCache,
        getCacheStats
    };
}
