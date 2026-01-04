/**
 * Unit Tests for imageSelector.js
 * 
 * This test suite can be run in Node.js or in a browser.
 * To run in Node.js: node tests/imageSelector.test.js
 * To run in browser: Open tests/test-runner.html
 */

// Import the module (Node.js or Browser)
let imageSelector;
if (typeof require !== 'undefined') {
    imageSelector = require('../src/utils/imageSelector.js');
} else if (typeof window !== 'undefined' && window.imageSelector) {
    imageSelector = window.imageSelector;
    // Also expose internal functions for testing
    imageSelector.tokenize = function(text) {
        const STOPWORDS = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
            'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with'
        ]);
        if (!text || typeof text !== 'string') return new Set();
        return new Set(
            text
                .toLowerCase()
                .replace(/[^\w\s-]/g, ' ')
                .split(/\s+/)
                .map(token => token.trim())
                .filter(token => token.length > 2 && !STOPWORDS.has(token))
        );
    };
    imageSelector.jaccardSimilarity = function(setA, setB) {
        if (setA.size === 0 && setB.size === 0) return 0;
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return union.size > 0 ? intersection.size / union.size : 0;
    };
    imageSelector.extractLinkTokens = function(linkJson) {
        const tokens = new Set();
        if (linkJson.title) {
            imageSelector.tokenize(linkJson.title).forEach(t => tokens.add(t));
        }
        const keywords = linkJson.keywords || [];
        const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
        keywordArray.forEach(kw => {
            if (kw && typeof kw === 'string') {
                imageSelector.tokenize(kw).forEach(t => tokens.add(t));
            }
        });
        return tokens;
    };
    imageSelector.extractUrlTokens = function(url) {
        if (!url || typeof url !== 'string') return new Set();
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
            const tokens = new Set();
            pathParts.forEach(part => {
                imageSelector.tokenize(part).forEach(t => tokens.add(t));
                part.split(/[-_]/).forEach(subpart => {
                    imageSelector.tokenize(subpart).forEach(t => tokens.add(t));
                });
            });
            return tokens;
        } catch (e) {
            return imageSelector.tokenize(url);
        }
    };
    imageSelector.scoreImage = function(image, linkTokens, keywordArray) {
        const WEIGHTS = { filename: 0.6, altText: 0.3, keywords: 0.4, resolution: 0.1 };
        let score = 0;
        const urlTokens = imageSelector.extractUrlTokens(image.url || '');
        const filenameScore = imageSelector.jaccardSimilarity(urlTokens, linkTokens);
        score += filenameScore * WEIGHTS.filename;
        const altTokens = new Set();
        if (image.alt) {
            imageSelector.tokenize(image.alt).forEach(t => altTokens.add(t));
        }
        if (image.caption) {
            imageSelector.tokenize(image.caption).forEach(t => altTokens.add(t));
        }
        const altScore = imageSelector.jaccardSimilarity(altTokens, linkTokens);
        score += altScore * WEIGHTS.altText;
        let keywordMatches = 0;
        keywordArray.forEach(keyword => {
            const kwTokens = imageSelector.tokenize(keyword);
            const urlMatch = [...kwTokens].some(t => urlTokens.has(t));
            const altMatch = [...kwTokens].some(t => altTokens.has(t));
            if (urlMatch || altMatch) keywordMatches++;
        });
        if (keywordArray.length > 0) {
            score += (keywordMatches / keywordArray.length) * WEIGHTS.keywords;
        }
        if (image.width && image.height) {
            const pixels = image.width * image.height;
            if (pixels > 100000) {
                score += WEIGHTS.resolution;
            }
        }
        return score;
    };
    imageSelector.getPlaceholderImage = function(category) {
        const placeholders = {
            news: 'https://placehold.co/250x150/ff4500/white?text=Breaking+News',
            videos: 'https://placehold.co/250x150/ff4500/white?text=Video',
            products: 'https://placehold.co/250x150/ff4500/white?text=Product',
            tweets: 'https://placehold.co/250x150/ff4500/white?text=Tweet',
            memes: 'https://placehold.co/250x150/ff4500/white?text=Meme',
            tools: 'https://placehold.co/250x150/ff4500/white?text=Tool'
        };
        return placeholders[category] || placeholders.news;
    };
}

// Test utilities
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

function assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Assertion failed'}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed: expected true');
    }
}

function assertGreaterThan(actual, threshold, message) {
    if (actual <= threshold) {
        throw new Error(`${message || 'Assertion failed'}\n  Expected > ${threshold}, got ${actual}`);
    }
}

function assertLessThan(actual, threshold, message) {
    if (actual >= threshold) {
        throw new Error(`${message || 'Assertion failed'}\n  Expected < ${threshold}, got ${actual}`);
    }
}

// Test Suite
test('tokenize should normalize and split text correctly', () => {
    const result = imageSelector.tokenize('Hello World! This is a TEST.');
    assertTrue(result.has('hello'), 'Should contain "hello"');
    assertTrue(result.has('world'), 'Should contain "world"');
    assertTrue(result.has('test'), 'Should contain "test"');
    assertTrue(!result.has('is'), 'Should not contain stopword "is"');
    assertTrue(!result.has('a'), 'Should not contain stopword "a"');
});

test('tokenize should handle empty input', () => {
    assertEquals(Array.from(imageSelector.tokenize('')).length, 0);
    assertEquals(Array.from(imageSelector.tokenize(null)).length, 0);
    assertEquals(Array.from(imageSelector.tokenize(undefined)).length, 0);
});

test('jaccardSimilarity should calculate correctly', () => {
    const setA = new Set(['hello', 'world']);
    const setB = new Set(['hello', 'universe']);
    const similarity = imageSelector.jaccardSimilarity(setA, setB);
    // Intersection: {hello} = 1, Union: {hello, world, universe} = 3
    // Similarity = 1/3 ≈ 0.333
    assertTrue(Math.abs(similarity - 0.333) < 0.01, `Expected ~0.333, got ${similarity}`);
});

test('jaccardSimilarity should return 0 for empty sets', () => {
    const similarity = imageSelector.jaccardSimilarity(new Set(), new Set());
    assertEquals(similarity, 0);
});

test('extractLinkTokens should extract from title and keywords', () => {
    const linkJson = {
        title: 'Venezuela Breaking News',
        keywords: ['Venezuela', 'Geopolitics', 'Breaking']
    };
    const tokens = imageSelector.extractLinkTokens(linkJson);
    assertTrue(tokens.has('venezuela'), 'Should have venezuela');
    assertTrue(tokens.has('breaking'), 'Should have breaking');
    assertTrue(tokens.has('news'), 'Should have news');
    assertTrue(tokens.has('geopolitics'), 'Should have geopolitics');
});

test('extractUrlTokens should extract from URL path', () => {
    const url = 'https://example.com/images/venezuela-crisis-2026.jpg';
    const tokens = imageSelector.extractUrlTokens(url);
    assertTrue(tokens.has('venezuela'), 'Should extract venezuela');
    assertTrue(tokens.has('crisis'), 'Should extract crisis');
    assertTrue(tokens.has('2026'), 'Should extract 2026');
    assertTrue(tokens.has('images'), 'Should extract images');
});

test('scoreImage should score exact filename match highly', () => {
    const image = {
        url: 'https://example.com/venezuela-news-photo.jpg',
        alt: 'Photo of Venezuelan protest'
    };
    const linkTokens = imageSelector.tokenize('Venezuela Breaking News');
    const keywords = ['Venezuela', 'News'];
    
    const score = imageSelector.scoreImage(image, linkTokens, keywords);
    assertGreaterThan(score, 0.3, 'Score should be > 0.3 for good match');
});

test('scoreImage should score alt text matches', () => {
    const image = {
        url: 'https://example.com/photo123.jpg',
        alt: 'Venezuela crisis protest scene'
    };
    const linkTokens = imageSelector.tokenize('Venezuela Breaking News');
    const keywords = ['Venezuela', 'Crisis'];
    
    const score = imageSelector.scoreImage(image, linkTokens, keywords);
    assertGreaterThan(score, 0.1, 'Score should be > 0.1 for alt text match');
});

test('scoreImage should give bonus for high resolution', () => {
    const lowRes = {
        url: 'https://example.com/photo.jpg',
        width: 100,
        height: 100
    };
    const highRes = {
        url: 'https://example.com/photo.jpg',
        width: 500,
        height: 400
    };
    const linkTokens = new Set(['test']);
    const keywords = [];
    
    const lowScore = imageSelector.scoreImage(lowRes, linkTokens, keywords);
    const highScore = imageSelector.scoreImage(highRes, linkTokens, keywords);
    
    assertTrue(highScore > lowScore, 'High resolution should score better');
});

test('selectPreviewImage should return highest scoring image', () => {
    const linkJson = {
        url: 'https://example.com/article',
        title: 'Venezuela Breaking News',
        keywords: ['Venezuela', 'Politics'],
        images: [
            { url: 'https://example.com/random-cat.jpg', alt: 'Cat picture' },
            { url: 'https://example.com/venezuela-protest-2026.jpg', alt: 'Venezuela protest' },
            { url: 'https://example.com/food.jpg', alt: 'Food photo' }
        ]
    };
    
    const result = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    
    assertTrue(result.imageUrl.includes('venezuela'), 'Should select Venezuela image');
    assertTrue(result.reason.includes('scored_match'), 'Should be a scored match');
    assertGreaterThan(result.score, 0, 'Should have positive score');
});

test('selectPreviewImage should fall back to og:image when no good match', () => {
    const linkJson = {
        url: 'https://example.com/article',
        title: 'Random Article Title',
        keywords: ['Test', 'Example'],
        images: [
            { url: 'https://example.com/unrelated1.jpg', alt: 'Unrelated' },
            { url: 'https://example.com/unrelated2.jpg', alt: 'Also unrelated' }
        ],
        meta: {
            ogImage: 'https://example.com/og-image.jpg'
        }
    };
    
    const result = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    
    assertEquals(result.imageUrl, 'https://example.com/og-image.jpg');
    assertEquals(result.reason, 'fallback_og_image');
});

test('selectPreviewImage should fall back to twitter:image after og:image', () => {
    const linkJson = {
        url: 'https://example.com/article',
        title: 'Random Article',
        keywords: [],
        meta: {
            twitterImage: 'https://example.com/twitter-card.jpg'
        }
    };
    
    const result = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    
    assertEquals(result.imageUrl, 'https://example.com/twitter-card.jpg');
    assertEquals(result.reason, 'fallback_twitter_image');
});

test('selectPreviewImage should fall back to first image when no meta tags', () => {
    const linkJson = {
        url: 'https://example.com/article',
        title: 'Article',
        keywords: [],
        images: [
            { url: 'https://example.com/first.jpg' },
            { url: 'https://example.com/second.jpg' }
        ]
    };
    
    const result = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    
    assertEquals(result.imageUrl, 'https://example.com/first.jpg');
    assertEquals(result.reason, 'fallback_first_image');
});

test('selectPreviewImage should use placeholder when no images available', () => {
    const linkJson = {
        url: 'https://example.com/article',
        title: 'Article',
        keywords: [],
        category: 'news'
    };
    
    const result = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    
    assertTrue(result.imageUrl.includes('placehold'), 'Should use placeholder');
    assertEquals(result.reason, 'fallback_placeholder');
});

test('selectPreviewImage should handle tie-breaking deterministically', () => {
    // When images have similar scores and exceed threshold, should pick lexicographically first
    const linkJson = {
        url: 'https://example.com/article',
        title: 'Test Article about images and photos',
        keywords: ['images', 'photos'],
        images: [
            { url: 'https://example.com/z-photos.jpg', alt: 'photo gallery' },
            { url: 'https://example.com/a-images.jpg', alt: 'image collection' },
            { url: 'https://example.com/m-pictures.jpg', alt: 'pictures set' }
        ]
    };
    
    const result1 = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    const result2 = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    
    assertEquals(result1.imageUrl, result2.imageUrl, 'Should select same image both times (deterministic)');
    // When scores are very close or tied, lexicographic tie-breaker applies
    assertTrue(result1.reason.includes('scored_match'), 'Should be a scored match');
});

test('selectPreviewImage should cache results', () => {
    const linkJson = {
        url: 'https://example.com/test-cache',
        title: 'Test Caching',
        keywords: ['Test'],
        images: [
            { url: 'https://example.com/image.jpg' }
        ]
    };
    
    // Clear cache first
    imageSelector.clearCache();
    
    // First call
    const result1 = imageSelector.selectPreviewImage(linkJson, null, { useCache: true });
    
    // Check cache stats
    const stats = imageSelector.getCacheStats();
    assertEquals(stats.size, 1, 'Cache should have 1 entry');
    
    // Second call should return same object from cache
    const result2 = imageSelector.selectPreviewImage(linkJson, null, { useCache: true });
    assertEquals(result1.imageUrl, result2.imageUrl, 'Should return cached result');
});

test('selectPreviewImage should handle malformed input gracefully', () => {
    const result1 = imageSelector.selectPreviewImage(null);
    assertTrue(result1.imageUrl.includes('placehold'), 'Should use placeholder for null');
    assertEquals(result1.reason, 'invalid_input');
    
    const result2 = imageSelector.selectPreviewImage({});
    assertTrue(result2.imageUrl.includes('placehold'), 'Should use placeholder for empty object');
});

test('selectPreviewImage should support legacy thumbnail field', () => {
    const linkJson = {
        url: 'https://example.com/article',
        title: 'Legacy Article',
        keywords: [],
        thumbnail: 'https://example.com/legacy-thumb.jpg'
    };
    
    const result = imageSelector.selectPreviewImage(linkJson, null, { useCache: false });
    
    assertEquals(result.imageUrl, 'https://example.com/legacy-thumb.jpg');
    assertTrue(result.reason.includes('scored_match') || result.reason.includes('fallback'));
});

test('getPlaceholderImage should return correct placeholders', () => {
    assertEquals(
        imageSelector.getPlaceholderImage('news'),
        'https://placehold.co/250x150/ff4500/white?text=Breaking+News'
    );
    assertEquals(
        imageSelector.getPlaceholderImage('videos'),
        'https://placehold.co/250x150/ff4500/white?text=Video'
    );
    assertEquals(
        imageSelector.getPlaceholderImage('unknown'),
        'https://placehold.co/250x150/ff4500/white?text=Breaking+News'
    );
});

// Run all tests
function runTests() {
    console.log('Running imageSelector tests...\n');
    
    tests.forEach(({ name, fn }) => {
        try {
            fn();
            passed++;
            console.log(`✓ ${name}`);
        } catch (error) {
            failed++;
            console.error(`✗ ${name}`);
            console.error(`  ${error.message}\n`);
        }
    });
    
    console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
        process.exit(1);
    }
}

// Auto-run in Node.js
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
}

// Export for browser
if (typeof window !== 'undefined') {
    window.imageSelectorTests = { tests, runTests };
}
