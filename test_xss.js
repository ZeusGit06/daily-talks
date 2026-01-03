
// Mocking the escapeHtml function from public/script.js
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg/onload=alert(1)>',
    'javascript:alert(1)',
    '\';alert(1);//',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<body onload=alert(1)>',
    '<a href="javascript:alert(1)">Click me</a>',
    '"><script>alert(1)</script>',
    '\'><script>alert(1)</script>'
];

console.log("Running XSS Sanitization Tests...\n");

let passed = 0;
let failed = 0;

payloads.forEach((payload, index) => {
    const escaped = escapeHtml(payload);
    const isSafe = !escaped.includes('<') && !escaped.includes('>') && !escaped.includes('"') && !escaped.includes("'");

    // Additional check: ensure it doesn't decode back to HTML in a way that executes
    // For this simple test, we just check if the dangerous characters are replaced.

    console.log(`Test #${index + 1}:`);
    console.log(`  Input:    ${payload}`);
    console.log(`  Output:   ${escaped}`);

    if (isSafe) {
        console.log(`  Result:   PASS ✅`);
        passed++;
    } else {
        console.log(`  Result:   FAIL ❌ (Dangerous characters found)`);
        failed++;
    }
    console.log('---------------------------------------------------');
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) {
    process.exit(1);
}
