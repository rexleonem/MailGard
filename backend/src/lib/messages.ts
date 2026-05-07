export const subjects = [
    "Quick question about the project",
    "Checking in on our previous conversation",
    "Thought you might find this interesting",
    "Follow up: meeting next week?",
    "Feedback on the latest draft",
    "Regarding the upcoming update",
    "A quick update from my side",
    "Discussion about the new proposal",
    "Connecting on the recent news",
    "Information regarding the request"
];

export const bodies = [
    "Hi there, just wanted to follow up and see if you had a chance to look at the latest updates. Let me know when you're free to chat.",
    "Hey! Hope you're having a productive week. I've been thinking about our discussion and had a few more thoughts to share.",
    "Hello, I came across this piece of information today and thought it might be relevant to our current project. What do you think?",
    "Just a quick check-in to ensure we're still on track for the deadline. Let me know if you need anything from my end.",
    "I've attached the latest version of the proposal for your review. Looking forward to hearing your feedback soon.",
    "It was great connecting with you earlier. I'm excited about the possibilities we discussed and will follow up with more details shortly.",
    "Greetings! I wanted to keep you in the loop regarding the progress we've made so far. Things are looking very promising.",
    "Could we schedule a brief call next week to finalize the details? I have some availability on Tuesday and Wednesday afternoons.",
    "Thank you for the quick response. I've noted your suggestions and will incorporate them into the next iteration.",
    "Just wanted to share some positive news from our recent testing phase. Everything is performing better than expected."
];

export function getRandomMessage() {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const body = bodies[Math.floor(Math.random() * bodies.length)];
    
    // Add a randomized sign-off for extra variation
    const signOffs = ["Best regards,", "Thanks,", "Cheers,", "Talk soon,", "Best,"];
    const names = ["Team", "Admin", "Support", "Service", "System"];
    const signOff = `\n\n${signOffs[Math.floor(Math.random() * signOffs.length)]}\n${names[Math.floor(Math.random() * names.length)]}`;
    
    return { subject, body: body + signOff };
}
