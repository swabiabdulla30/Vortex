// Event Details Data
// Edit this file to update "About" and "Rules" for events.

const eventDetails = {
    "CODE RED: NIGHT": {
        about: "An intense 24-hour coding marathon where participants will solve real-world problems. Test your endurance, creativity, and coding skills in this overnight hackathon.",
        rules: [
            "Teams must consist of 2-4 members.",
            "Participants must bring their own laptops and chargers.",
            "Use of AI tools is allowed but must be disclosed.",
            "Code plagiarism will lead to immediate disqualification.",
            "Judging criteria: Innovation, Functionality, and Presentation."
        ]
    },
    "DEBUGGING SPRINT": {
        about: "Race against the clock to find and fix bugs in a provided codebase. Speed and accuracy are key in this high-pressure challenge.",
        rules: [
            "Individual participation only.",
            "Access to internet is restricted during the sprint.",
            "Points are awarded for each bug fixed and time taken.",
            "Any attempt to modify the test cases will lead to disqualification."
        ]
    },
    "ALGO MASTERS": {
        about: "A competitive programming contest designed to test your algorithmic thinking and problem-solving skills against the best coders.",
        rules: [
            "Individual participation.",
            "Languages allowed: C++, Java, Python.",
            "No external libraries or pre-written code allowed.",
            "Time limit per problem will be strictly enforced."
        ]
    },
    "REACT DEEP DIVE": {
        about: "A hands-on workshop exploring advanced concepts in React.js, including hooks, state management, and performance optimization.",
        rules: [
            "Participants should have basic knowledge of HTML, CSS, and JS.",
            "Laptop is mandatory.",
            "Software requirements: VS Code, Node.js installed."
        ]
    },
    "TECH TRIVIA": {
        about: "Test your knowledge of the tech world! From history of computing to latest trends, this quiz covers it all.",
        rules: [
            "Teams of 2 members.",
            "No use of mobile phones during the quiz.",
            "The quiz master's decision is final.",
            "There will be 3 rounds: Elimination, Visual, and Rapid Fire."
        ]
    },
    "UI/UX DASH": {
        about: "A rapid prototyping challenge where you design a user interface for a given problem statement within a limited time.",
        rules: [
            "Individual or team of 2.",
            "Tools allowed: Figma, Adobe XD, or Sketch.",
            "Submission must include a working prototype link.",
            "Focus on User Experience and Visual Design."
        ]
    },
    "ELEVATE": {
        about: "A flagship event focusing on career development, soft skills, and industry insights from experts.",
        rules: [
            "Open to all departments.",
            "Registration is mandatory for entry.",
            "Professional attire is recommended."
        ]
    },
    "CYBER DEFENSE": {
        about: "Introduction to ethical hacking and cybersecurity defense mechanisms. Learn how to protect systems from vulnerabilities.",
        rules: [
            "Laptop required (Kali Linux preferred but not mandatory).",
            "Any unauthorized testing on college network is strictly prohibited.",
            "Workshop material is for educational purposes only."
        ]
    },
    "AI FRONTIERS": {
        about: "Explore the cutting-edge of Artificial Intelligence and Generative models. Understand the future of AI technology.",
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
