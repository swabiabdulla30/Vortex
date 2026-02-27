const fs = require('fs');
const path = require('path');

const pages = [
    'about', 'admin', 'elevate', 'event_registration', 'events',
    'gallery', 'login', 'privacy_policy', 'refund_policy',
    'registration_success', 'signup', 'terms', 'tickets'
];

const dir = __dirname;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    pages.forEach(page => {
        // Replace href="/page" with href="/page.html"
        // Also handles #hash, e.g. href="/page#section" -> href="/page.html#section"
        const regex1 = new RegExp(`href=["\']\/?${page}(#[^"\']*)?["\']`, 'g');
        content = content.replace(regex1, `href="/${page}.html$1"`);

        // Replace window.location.href = '/page'
        const regex2 = new RegExp(`location\\.href\\s*=\\s*["\']\/?${page}(#[^"\']*)?["\']`, 'g');
        content = content.replace(regex2, `location.href = "/${page}.html$1"`);

        // Replace window.location = '/page'
        const regex3 = new RegExp(`location\\s*=\\s*["\']\/?${page}(#[^"\']*)?["\']`, 'g');
        content = content.replace(regex3, `location = "/${page}.html$1"`);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${path.basename(filePath)}`);
    }
}

function walkDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.agent') continue;

        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

walkDir(dir);
console.log('Done modifying extensions.');
