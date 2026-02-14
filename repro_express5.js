const express = require('express');
const app = express();

console.log("Express Version:", require('express/package.json').version);

try {
    console.log("Testing app.get('*', ...)");
    app.get('*', (req, res) => { });
    console.log("✅ Success with '*' string");
} catch (e) {
    console.error("❌ Failed with '*' string:", e.message);
}

try {
    console.log("Testing app.get(/(.*)/, ...)");
    app.get(/(.*)/, (req, res) => { });
    console.log("✅ Success with regex");
} catch (e) {
    console.error("❌ Failed with regex:", e.message);
}
