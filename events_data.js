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
        slots: 100,
        prize: "₹500",
        fee: "₹10 per player",
        about: "<strong>🎮 PUBG Mobile Tournament (Livik Map)</strong><br><br><strong>📌 Tournament Details:</strong><br>Map: Erangel(normal)<br>Mode: Squad (TPP)<br>Total Teams: 25<br>Total Players: 100<br>Registration Fee: ₹10 per player<br>Total Prize Pool: ₹500<br>Duration: 2 Hours",
        rules: [
            "<strong>👥 Team Rules</strong><br>1. Each team must have exactly 4 players.<br>2. No player can join more than one team.<br>3. No team changes after room ID is shared.<br>4. All players must be online 10 minutes before start.<br>5. If a player is absent, the team must play with remaining players (no delay).",
            "<strong>🎯 Match Rules</strong><br>1. Map: Erangel(normal)<br>2. Mode: Squad – TPP<br>3. Only one official match will be conducted.<br>4. Custom room ID & password will be shared 10 minutes before match.<br>5. Match will start at scheduled time (No waiting for late players).<br>6. Any use of hacks, glitches, or unfair play will result in immediate disqualification.",
            "<strong>❌ Disqualification circumstances</strong><br>1. No hacking or third-party tools.<br>2. No teaming between squads.<br>3. No abusive language in chat or voice.<br>4. Emulator players not allowed (if mobile-only event).<br>5. Organizers' decision is final.",
            "<strong>📶 Technical Rules</strong><br>1. Players are responsible for their own internet connection.<br>2. No restart for personal internet issues.<br>3. If server error happens from organizer side, match will be restarted."
        ]
    },
    "TECH HUNT": {
        image: "https://image2url.com/r2/default/images/1771869172242-e128a3e7-34be-47d7-af3f-2fc32eb7c147.jpeg",
        date: "Mar 06, 2026",
        venue: "Lab",
        slots: 30,
        prize: "₹200",
        fee: "₹10 per participant",
        about: "Tech Hunt is an exciting online puzzle challenge where participants are given a website filled with hidden clues and challenges. Players must carefully explore the website, solve puzzles, and find the correct extension or link to unlock the next level. Each level becomes more challenging, testing your logic, observation, and problem-solving skills. The participant who successfully completes the hunt in the shortest time wins the cash prize.",
        rules: [
            "Participants must register before the event starts.",
            "Only registered participants are allowed to compete.",
            "Use of unfair means or malpractice will lead to disqualification.",
            "Follow all instructions given by the organizers.",
            "Mobile phones are not allowed during the event.",
            "Organizer's decision will be final."
        ]
    },
    "WEBSITE DESIGNING COMPETITION": {
        image: "https://image2url.com/r2/default/images/1771863896078-ef98fc6d-f9d8-41ef-89d5-cac3231e8f7c.jpeg",
        date: "Mar 06, 2026",
        venue: "Lab",
        slots: 30,
        prize: " 200",
        fee: "₹10 per participant",
        about: "The Web-Designing is a creative event where participants showcase their web development and design skills. Participants will be given a theme or topic, and they must design a visually appealing, user-friendly website within the given time. The event focuses on creativity, layout design, responsiveness, and overall presentation. This competition provides a great platform to demonstrate your technical and creative abilities.",
        rules: [
            "Only registered participants are allowed to compete.",
            "Individual participation only  .",
            "The website must be created during the competition time.",
            "Pre-made templates or copied designs are not allowed.",
            "Participants may use HTML, CSS, JavaScript, or any AI tools.",
            "Internet usage rules will be informed before the event.",
            "Submission must be completed within the given time limit.",
            "Judging will be based on design, creativity, responsiveness, and functionality.",
            "Any form of plagiarism will result in immediate disqualification.",
            "Organizer's decision will be final."
        ]
    },
    "CO-OP E-FOOTBALL": {
        image: "https://image2url.com/r2/default/images/1771995899025-6821ca81-aa54-4566-b29d-4fab70571c09.jpeg",
        date: "Mar 06, 2026",
        venue: "Seminar Hall",
        slots: 16,
        prize: "₹200",
        fee: "₹20 per team",
        about: "The E-Football Tournament is a competitive virtual football gaming event where teams of 2 players compete in head-to-head matches to showcase strategy, coordination, and football gaming skills. With 16 teams already formed before the event, players will face off in knockout rounds to advance and ultimately win the prize. The competition promotes fair play, sportsmanship, and an exciting gaming experience for all participants.",
        rules: [
            "<strong>🔹 Registration & Team Details</strong><br>Entry Fee: ₹20 per team (2 players)<br>Cash Prize: ₹200<br>Total Teams: 16 (Teams must be pre-formed before the event)<br>Only registered teams are eligible to participate.",
            "<strong>🔹 Match Structure & Format</strong><br>Matches are team vs team and follow a knockout format.<br>Each team chooses players and formation before match start.<br>Match Time: 8 Mins | Team Strength: Unlimited | Player Form: Random | Subs: 6 | Extra Time: On | Penalties: On<br>Winners of each round advance to the next stage until finals.",
            "<strong>🔹 Fair Play & Conduct</strong><br>No cheating, hacks, or unfair tools are allowed in any match.<br>Unsportsmanlike behavior (abusive language, intentional disconnects) may lead to disqualification.<br>Respect all participants and follow organizer instructions.<br>❗ If a disconnection occurs during the game, the match should be resumed and played for the remaining time only.",
            "<strong>🔹 Technical Requirements</strong><br>Participants must bring their own device with the game installed and updated.<br>Make sure the device is charged and ready for play.<br>Organizers are not responsible for internet issues or device malfunctions.",
            "<strong>🔹 Match Results & Prize</strong><br>Match results will be recorded and announced by the organizers.<br>In case of ties (if applicable), tie-breaking rules set by the organizers will apply.<br>Cash prize is awarded to the winning team after final match results are verified.",
            "<strong>🔹 Organizer's Authority</strong><br>All decisions by the organizers are final and binding.<br>Participants must cooperate with referees and event officials."
        ]
    },
    "DEVIL'S MAP": {
        image: "https://image2url.com/r2/default/images/1771567367713-43840ddf-0d00-429a-b9ae-d5a329392290.jpeg",
        date: "Mar 05, 2026",
        venue: "Drawing Hall",
        slots: 20,
        prize: "₹300",
        fee: "₹20 per head",
        about: "Follow the clues, claim the crown! Devil's Map is a thrilling campus-wide treasure hunt where participants solve riddles and navigate through checkpoints to uncover the final prize.",
        rules: [
            "Teams must contain 5 members.",
            "Each team receives the same starting clue.",
            "Running between zones is allowed but must not disturb other college activities.",
            "Destroying or tampering with clues leads to disqualification.",
            "Mobile phones are not allowed during the event.",
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

// Friendly-name aliases — match exact card display names
eventDetails["TECH HUNT"] = eventDetails["TECH HUNT"];
eventDetails["Tech Hunt"] = eventDetails["TECH HUNT"];
eventDetails["WEBSITE DESIGNING COMPETITION"] = eventDetails["WEBSITE DESIGNING COMPETITION"];
eventDetails["Web-Designing"] = eventDetails["WEBSITE DESIGNING COMPETITION"];
eventDetails["WEB-DESIGNING"] = eventDetails["WEBSITE DESIGNING COMPETITION"];
eventDetails["CO-OP E-FOOTBALL"] = eventDetails["CO-OP E-FOOTBALL"];
eventDetails["Co-op E-Football"] = eventDetails["CO-OP E-FOOTBALL"];
eventDetails["DEVIL'S MAP"] = eventDetails["DEVIL'S MAP"];
eventDetails["Devil's Map"] = eventDetails["DEVIL'S MAP"];

if (typeof module !== 'undefined') {
    module.exports = eventDetails;
}
