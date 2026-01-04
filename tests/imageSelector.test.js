/**
 * Unit Tests for imageSelector.js
 * Run this in a browser or Node.js environment
 */

// Import the module (Node.js style) or use browser global
let ImageSelector;
if (typeof require !== 'undefined') {
    ImageSelector = require('../src/utils/imageSelector.js');
} else if (typeof window !== 'undefined' && window.ImageSelector) {
    // In browser, use the global
    ImageSelector = window.ImageSelector;
}

// Test framework - simple assertion utilities
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

function assertEquals(actual, expected, message = '') {
    const match = JSON.stringify(actual) === JSON.stringify(expected);
    if (!match) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}. ${message}`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(`Expected true but got false. ${message}`);
    }
}

function assertGreaterThan(actual, threshold, message = '') {
    if (actual <= threshold) {
        throw new Error(`Expected ${actual} > ${threshold}. ${message}`);
    }
}

function assertNotNull(value, message = '') {
    if (value === null || value === undefined) {
        throw new Error(`Expected non-null value. ${message}`);
    }
}

// Test Suite
test('Exact filename match scores higher', () => {
    const link = {
        url: 'https://example.com/article',
        title: 'Venezuela Crisis Report',
        keywords: ['Venezuela', 'Crisis'],
        images: [
            { url: 'https://example.com/images/venezuela-crisis.jpg', alt: 'Photo' },
            { url: 'https://example.com/images/generic-photo.jpg', alt: 'Generic' }
        ]
    };
    
    const result = ImageSelector.selectPreviewImage(link, null, { useCache: false });
    
    assertNotNull(result.imageUrl);
    assertTrue(result.imageUrl.includes('venezuela-crisis'), 'Should select image with matching filename');
    assertEquals(result.reason, 'json-match');
    assertGreaterThan(result.score, 0.05, 'Score should be above threshold');
});

test('Alt text matching contributes to score', () => {
    const link = {
        url: 'https://example.com/article',
        title: 'AI Technology Breakthrough',
        keywords: ['AI', 'Technology'],
        images: [
            { url: 'https://example.com/images/photo1.jpg', alt: 'Random photo' },
            { url: 'https://example.com/images/photo2.jpg', alt: 'Artificial Intelligence technology lab' }
        ]
    };
    
    const result = ImageSelector.selectPreviewImage(link, null, { useCache: false });
    
    assertNotNull(result.imageUrl);
    assertTrue(result.imageUrl.includes('photo2'), 'Should select image with matching alt text');
});

test('Falls back to meta og:image when no good match', () => {
    const link = {
        url: 'https://example.com/article',
        title: 'Space Exploration',
        keywords: ['Space', 'NASA'],
        meta: {
            ogImage: 'https://example.com/og-image.jpg'
        }
    };
    
    const result = ImageSelector.selectPreviewImage(link, null, { useCache: false });
    
    assertEquals(result.imageUrl, 'https://example.com/og-image.jpg');
    assertEquals(result.reason, 'meta-og');
});

test('Returns placeholder when no images available', () => {
    const link = {
        url: 'https://example.com/article',
        title: 'Test Article',
        keywords: []
    };
    
    const result = ImageSelector.selectPreviewImage(link, null, { useCache: false });
    
    assertEquals(result.imageUrl, null);
    assertEquals(result.reason, 'placeholder');
});

test('Deterministic tie-breaker selects lexicographically smallest URL', () => {
    const link = {
        url: 'https://example.com/article',
        title: 'Random Article',
        keywords: ['Random'],
        images: [
            { url: 'https://example.com/images/zebra.jpg', alt: 'Photo' },
            { url: 'https://example.com/images/aardvark.jpg', alt: 'Photo' }
        ]
    };
    
    const result = ImageSelector.selectPreviewImage(link, null, { useCache: false });
    
    assertNotNull(result.imageUrl);
    assertTrue(result.imageUrl.includes('aardvark'), 'Should select lexicographically first URL in tie');
});

test('Higher resolution images get small boost', () => {
    const link = {
        url: 'https://example.com/article',
        title: 'Test Article',
        keywords: [],
        images: [
            { url: 'https://example.com/small.jpg', width: 100, height: 100 },
            { url: 'https://example.com/large.jpg', width: 1920, height: 1080 }
        ]
    };
    
    const result = ImageSelector.selectPreviewImage(link, null, { useCache: false });
    
    // Higher resolution should win even with same filename relevance
    assertTrue(result.imageUrl.includes('large'), 'Should prefer higher resolution');
});

test('Cache works correctly', () => {
    ImageSelector.clearCache();
    
    const link = {
        url: 'https://example.com/cached-article',
        title: 'Cache Test',
        keywords: ['Test'],
        images: [
            { url: 'https://example.com/image.jpg' }
        ]
    };
    
    const result1 = ImageSelector.selectPreviewImage(link, null, { useCache: true });
    const result2 = ImageSelector.selectPreviewImage(link, null, { useCache: true });
    
    assertEquals(result1.imageUrl, result2.imageUrl, 'Cached result should match first result');
    assertEquals(result1.score, result2.score, 'Cached score should match first score');
});

test('Token normalization removes stop words and punctuation', () => {
    const tokens = ImageSelector.normalizeTokens('The quick brown fox, jumps over the lazy dog!');
    
    assertTrue(!tokens.has('the'), 'Should remove stop word "the"');
    assertTrue(!tokens.has('over'), 'Should remove stop word "over"');
    assertTrue(tokens.has('quick'), 'Should keep content word "quick"');
    assertTrue(tokens.has('brown'), 'Should keep content word "brown"');
    assertTrue(tokens.has('fox'), 'Should keep content word "fox"');
});

test('Calculate overlap works correctly', () => {
    const set1 = new Set(['apple', 'banana', 'orange']);
    const set2 = new Set(['banana', 'orange', 'grape']);
    
    const overlap = ImageSelector.calculateOverlap(set1, set2);
    
    // Intersection: {banana, orange} = 2
    // Union: {apple, banana, orange, grape} = 4
    // Overlap = 2/4 = 0.5
    assertEquals(overlap, 0.5, 'Overlap should be 0.5');
});

test('Extract URL tokens from image filename', () => {
    const tokens1 = ImageSelector.extractUrlTokens('https://example.com/images/space-exploration-nasa.jpg');
    assertTrue(tokens1.has('space'), 'Should extract "space" from URL');
    assertTrue(tokens1.has('exploration'), 'Should extract "exploration" from URL');
    assertTrue(tokens1.has('nasa'), 'Should extract "nasa" from URL');
    
    const tokens2 = ImageSelector.extractUrlTokens('https://cdn.com/tech-ai-robot.png');
    assertTrue(tokens2.has('tech'), 'Should extract "tech" from URL');
    assertTrue(tokens2.has('robot'), 'Should extract "robot" from URL');
});

test('Handles malformed input gracefully', () => {
    // Null input
    const result1 = ImageSelector.selectPreviewImage(null);
    assertEquals(result1.reason, 'placeholder');
    
    // Missing required fields
    const result2 = ImageSelector.selectPreviewImage({});
    assertNotNull(result2);
    
    // Images array with null entries
    const result3 = ImageSelector.selectPreviewImage({
        url: 'https://example.com',
        title: 'Test',
        images: [null, undefined, { url: null }, { url: 'https://example.com/valid.jpg' }]
    }, null, { useCache: false });
    
    assertEquals(result3.imageUrl, 'https://example.com/valid.jpg');
});

test('Priority order: json images > meta > page > placeholder', () => {
    const link = {
        url: 'https://example.com/article',
        title: 'Priority Test',
        keywords: [],
        images: [
            { url: 'https://example.com/json-image.jpg' }
        ],
        meta: {
            ogImage: 'https://example.com/og-image.jpg'
        }
    };
    
    const pageMeta = {
        images: [
            { url: 'https://example.com/page-image.jpg' }
        ]
    };
    
    const result = ImageSelector.selectPreviewImage(link, pageMeta, { useCache: false });
    
    // JSON image should win over meta and page images
    assertTrue(result.imageUrl.includes('json-image'), 'Should prioritize JSON images');
});

// Run all tests
function runTests() {
    console.log('Running Image Selector Tests...\n');
    
    tests.forEach(({ name, fn }) => {
        try {
            fn();
            passed++;
            console.log(`✓ ${name}`);
        } catch (error) {
            failed++;
            console.error(`✗ ${name}`);
            console.error(`  ${error.message}`);
        }
    });
    
    console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
        if (typeof process !== 'undefined') {
            process.exit(1);
        }
        return false;
    }
    return true;
}

// Auto-run tests if in Node.js
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
}

// Export for browser usage
if (typeof window !== 'undefined') {
    window.ImageSelectorTests = { runTests };
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}
