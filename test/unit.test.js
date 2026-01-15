
const assert = require('assert');
const sanitize = require('../backend/utils/sanitize');

console.log('--- Running Sanitization Unit Test ---');

const tests = {
    'should strip simple script tags': {
        input: '<script>alert("xss");</script>',
        expected: ''
    },
    'should handle img onerror payload': {
        input: '<img src=x onerror=alert(1)>',
        expected: '<img src="x">'
    },
    'should handle svg onload payload': {
        input: '<svg/onload=alert(1)>',
        expected: '<svg></svg>'
    },
    'should handle href javascript payload': {
        input: '<a href="javascript:alert(1)">Click me</a>',
        expected: '<a>Click me</a>' // Corrected expectation
    },
    'should allow plain text': {
        input: 'This is a clean sentence.',
        expected: 'This is a clean sentence.'
    },
    'should handle mixed content': {
        input: 'Hello <b onclick=alert(1)>world</b>!',
        expected: 'Hello <b>world</b>!'
    },
    'should handle unclosed tags': {
        input: 'Here is an <img> tag.',
        expected: 'Here is an <img> tag.'
    }
};

let passed = 0;
let failed = 0;

for (const testName in tests) {
    const { input, expected } = tests[testName];
    const actual = sanitize(input);

    try {
        assert.strictEqual(actual, expected, `Test Failed: ${testName}`);
        console.log(`[PASS] ${testName}`);
        passed++;
    } catch (error) {
        console.error(`[FAIL] ${testName}`);
        console.error(`  - Input:    '${input}'`);
        console.error(`  - Expected: '${expected}'`);
        console.error(`  - Actual:   '${actual}'`);
        failed++;
    }
}

console.log(`\n--- Test Summary ---`);
console.log(`Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
    process.exit(1); // Exit with error code if any test fails
}

process.exit(0); // Exit with success
