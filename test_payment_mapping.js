const eventDetails = require('./events_data.js');

function getAmount(eventName) {
    let amount = 59000; // Default Membership
    const type = 'event';

    if (type === 'event' && eventName) {
        const cleanName = eventName.trim().toUpperCase();

        // 1. Direct key match (uppercase)
        let details = eventDetails[cleanName];

        // 2. Case-insensitive search through all keys if not found
        if (!details) {
            const foundKey = Object.keys(eventDetails).find(k => k.toUpperCase() === cleanName);
            if (foundKey) details = eventDetails[foundKey];
        }

        // 3. Fallback to check nested name property if keys don't match
        if (!details) {
            details = Object.values(eventDetails).find(e => e.name && e.name.toUpperCase() === cleanName);
        }

        if (details && details.fee) {
            const feeMatch = details.fee.match(/₹(\d+)/);
            if (feeMatch && feeMatch[1]) {
                amount = parseInt(feeMatch[1]) * 100;
            } else {
                amount = 100;
            }
        } else {
            amount = 100;
        }
    }
    return amount;
}

const testCases = [
    { name: "BGMI", expected: 1000 },
    { name: "bgmi", expected: 1000 },
    { name: "Web-Designing", expected: 1000 },
    { name: "WEB-DESIGNING", expected: 1000 },
    { name: "WEBSITE DESIGNING COMPETITION", expected: 1000 },
    { name: "TECH HUNT", expected: 1000 },
    { name: "Tech Hunt", expected: 1000 },
    { name: "Devil's Map", expected: 2000 },
    { name: "DEVIL'S MAP", expected: 2000 },
    { name: "Co-op E-Football", expected: 2000 },
    { name: "CO-OP E-FOOTBALL", expected: 2000 },
    { name: "NON_EXISTENT", expected: 100 }
];

console.log("Starting Verification Tests...\n");
let passed = 0;

testCases.forEach(tc => {
    const actual = getAmount(tc.name);
    const result = actual === tc.expected ? "PASS" : "FAIL";
    console.log(`[${result}] Event: "${tc.name}" -> Expected: ${tc.expected}, Actual: ${actual}`);
    if (actual === tc.expected) passed++;
});

console.log(`\nVerification Summary: ${passed}/${testCases.length} tests passed.`);
if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
