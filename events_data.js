// ============================================================
// EVENT DATA — SINGLE SOURCE OF TRUTH
// Edit this file to update event names, images, about, and rules.
// Changes here automatically reflect on the registration page AND tickets.
// ============================================================

const eventDetails = {
    "PUBG": {
        image: "https://image2url.com/r2/default/images/1771322980849-6dd25143-dab6-410b-a737-504b63aceea0.jpeg",
        date: "Mar 05, 2026",
        venue: "Seminar Hall",
        slots: 48,
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
        image: "https://image2url.com/r2/default/images/1771869172242-e128a3e7-34be-47d7-af3f-2fc32eb7c147.jpeg",
        date: "Mar 06, 2026",
        venue: "Lab",
        slots: 30,
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
        image: "https://image2url.com/r2/default/images/1771863896078-ef98fc6d-f9d8-41ef-89d5-cac3231e8f7c.jpeg",
        date: "Mar 06, 2026",
        venue: "Lab",
        slots: 30,
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
    "CO-OP E-FOOTBALL": {
        image: "https://image2url.com/r2/default/images/1771995899025-6821ca81-aa54-4566-b29d-4fab70571c09.jpeg",
        date: "Mar 06, 2026",
        venue: "Seminar Hall",
        slots: 16,
        about: "The E-Football Tournament is a competitive virtual football gaming event where teams of 2 players compete in head-to-head matches to showcase strategy, coordination, and football gaming skills. With 16 teams already formed before the event, players will face off in knockout rounds to advance and ultimately win the ₹200 cash prize. The competition promotes fair play, sportsmanship, and an exciting gaming experience for all participants.",
        rules: [
            "<strong>🔹 Registration & Team Details</strong><br>Entry Fee: ₹20 per team (2 players)<br>Cash Prize: ₹200<br>Total Teams: 16 (Teams must be pre-formed before the event)<br>Only registered teams are eligible to participate.",
            "<strong>🔹 Match Structure & Format</strong><br>Matches are 1v1 team vs team and follow a knockout format.<br>Each team chooses players and formation before match start.<br>Match duration and settings will be set by the organizers.<br>Winners of each round advance to the next stage until finals.",
            "<strong>🔹 Fair Play & Conduct</strong><br>No cheating, hacks, or unfair tools are allowed in any match.<br>Unsportsmanlike behavior (abusive language, intentional disconnects) may lead to disqualification.<br>Respect all participants and follow organizer instructions.",
            "<strong>🔹 Technical Requirements</strong><br>Participants must bring their own device with the game installed and updated.<br>Make sure the device is charged and ready for play.<br>Organizers are not responsible for internet issues or device malfunctions.",
            "<strong>🔹 Match Results & Prize</strong><br>Match results will be recorded and announced by the organizers.<br>In case of ties (if applicable), tie-breaking rules set by the organizers will apply.<br>Cash prize is awarded to the winning team after final match results are verified.",
            "<strong>🔹 Organizer’s Authority</strong><br>All decisions by the organizers are final and binding.<br>Participants must cooperate with referees and event officials."
        ]
    },
    "DEVIL'S MAP": {
        image: "https://image2url.com/r2/default/images/1771567367713-43840ddf-0d00-429a-b9ae-d5a329392290.jpeg",
        date: "Mar 05, 2026",
        venue: "Drawing Hall",
        slots: 20,
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
