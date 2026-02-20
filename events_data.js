// ============================================================
// EVENT DATA — SINGLE SOURCE OF TRUTH
// Edit this file to update event names, images, about, and rules.
// Changes here automatically reflect on the registration page AND tickets.
// ============================================================

const eventDetails = {
    "PUBG": {
        image: "https://image2url.com/r2/default/images/1771322980849-6dd25143-dab6-410b-a737-504b63aceea0.jpeg",
        about: "Squad up and fight your way to the final circle! An intense PUBG Mobile tournament where teams compete to be the last ones standing. Test your strategy, reflexes, and teamwork in this ultimate battle royale showdown.",
        rules: [
            "Teams must consist of 4 members.",
            "PUBG Mobile only — PC version not allowed.",
            "Players must be present in BCA Lab 1 during match time.",
            "No teaming with opponents or usage of emulators.",
            "Any use of hacks or cheats leads to immediate disqualification.",
            "Organizer's decision is final in case of disputes."
        ]
    },
    "TECH HUNT": {
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80",
        about: "Hunt through the web, decode clues, and race your team to the finish! A digital treasure hunt where participants solve tech-themed riddles and puzzles to find the final prize.",
        rules: [
            "Teams of 2 members.",
            "One device per team allowed during the hunt.",
            "Clues must not be shared with other teams.",
            "Any form of cheating leads to disqualification.",
            "Final answer must be submitted through the provided form.",
            "Organizers reserve the right to modify clues if needed."
        ]
    },
    "WEBSITE DESIGNING COMPETITION": {
        image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80",
        about: "Design your way to the top! Participants will create a fully functional and visually stunning website based on a given theme within a limited time. Judged on creativity, design, and technical execution.",
        rules: [
            "Individual or teams of 2 members.",
            "Laptop is mandatory.",
            "Tools allowed: VS Code, Figma, Adobe XD.",
            "No use of premium website builders (e.g., Wix, Squarespace).",
            "Submission must include a working demo link or local preview.",
            "Judging criteria: Design, Functionality, Creativity, and UX."
        ]
    },
    "CO-OP E-FOOTBALL TOURNAMENT": {
        image: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80",
        about: "Kick off, game on, glory awaits! A Co-op eFootball tournament where pairs go head-to-head in competitive matches. Showcase your skills, tactics, and teamwork on the virtual pitch.",
        rules: [
            "Teams of 2 players.",
            "Game: eFootball (latest version) on mobile.",
            "Players must bring their own devices.",
            "Match format: Single elimination rounds.",
            "No external controllers unless pre-approved.",
            "Organizer's decision is final for all match disputes."
        ]
    },
    "DEVIL'S MAP": {
        image: "https://image2url.com/r2/default/images/1771567367713-43840ddf-0d00-429a-b9ae-d5a329392290.jpeg",
        about: "Follow the clues, claim the crown! Devil's Map is a thrilling campus-wide treasure hunt where participants solve riddles and navigate through checkpoints to uncover the final prize.",
        rules: [
            "Teams of 2-3 members.",
            "Each team receives the same starting clue.",
            "Running between zones is allowed but must not disturb other college activities.",
            "Destroying or tampering with clues leads to disqualification.",
            "Mobile phones allowed only for clue lookup, not GPS tracking.",
            "The first team to complete all checkpoints wins."
        ]
    },
    "ELEVATE": {
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80",
        about: "A flagship event focusing on career development, soft skills, and industry insights from experts. Elevate yourself with knowledge, networking, and inspiration.",
        rules: [
            "Open to all departments.",
            "Registration is mandatory for entry.",
            "Professional attire is recommended.",
            "Q&A session will be held after each speaker.",
            "No recording without prior permission from organizers."
        ]
    },
    "CYBER DEFENSE": {
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80",
        about: "Introduction to ethical hacking and cybersecurity defense mechanisms. Learn how to protect systems from vulnerabilities in this hands-on workshop.",
        rules: [
            "Laptop required (Kali Linux preferred but not mandatory).",
            "Any unauthorized testing on college network is strictly prohibited.",
            "Workshop material is for educational purposes only.",
            "Participants must register in advance."
        ]
    },
    "AI FRONTIERS": {
        image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80",
        about: "Explore the cutting-edge of Artificial Intelligence and Generative models. Understand the future of AI technology in this insightful tech talk.",
        rules: [
            "Open to all students.",
            "Q&A session will follow the talk.",
            "Notes and resources will be shared after the session."
        ]
    }
};

// Make it available globally if needed, though script inclusion does this automatically in browser.
if (typeof module !== 'undefined') {
    module.exports = eventDetails;
}
