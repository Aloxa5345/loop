export interface SeedRecord {
    content: string;
    customerLabel: string;
}

export const supportTickets: SeedRecord[] = [
    { content: "Unable to login to my account. Getting an invalid credentials error every time.", customerLabel: "John" },
    { content: "Payment failed during checkout. My card was charged but the order didn't go through.", customerLabel: "Sarah" },
    { content: "Dashboard is loading very slowly. It takes more than 30 seconds to load.", customerLabel: "David" },
    { content: "Password reset email is not arriving. I have checked my spam folder as well.", customerLabel: "Emma" },
    { content: "Export button is missing from the reports section. I need to download my data.", customerLabel: "Alex" },
    { content: "Two-factor authentication is not sending the OTP to my phone number.", customerLabel: "Michael" },
    { content: "I cannot upload files larger than 5MB. The system keeps rejecting them.", customerLabel: "Jessica" },
    { content: "My account was locked after three failed login attempts. Please help me unlock it.", customerLabel: "Ryan" },
    { content: "The mobile app crashes every time I try to open the analytics section.", customerLabel: "Sophia" },
    { content: "Notifications are not showing up even after enabling them in settings.", customerLabel: "Daniel" },
    { content: "Data sync between mobile and web is inconsistent. Different numbers are showing.", customerLabel: "Olivia" },
    { content: "I am getting a 500 internal server error when trying to save my profile.", customerLabel: "James" },
    { content: "The search functionality is returning irrelevant results for my queries.", customerLabel: "Ava" },
    { content: "My subscription was cancelled automatically without any notice or email.", customerLabel: "William" },
    { content: "Charts on the analytics page are not rendering on my browser at all.", customerLabel: "Isabella" },
    { content: "I cannot add new team members to my workspace. The invite button does nothing.", customerLabel: "Ethan" },
    { content: "The filter options in the feedback list are not working correctly.", customerLabel: "Mia" },
    { content: "Dark mode is not saving my preference. It resets to light mode on every refresh.", customerLabel: "Noah" },
    { content: "CSV import failed with a generic error. No details were provided to me.", customerLabel: "Charlotte" },
    { content: "The dashboard shows incorrect totals. Numbers do not match the actual data.", customerLabel: "Liam" },
    { content: "I cannot delete old feedback records. The delete button is not responding.", customerLabel: "Amelia" },
    { content: "API rate limiting is too aggressive. We are hitting limits within minutes.", customerLabel: "Benjamin" },
    { content: "The date picker component is broken on mobile devices in the submission form.", customerLabel: "Harper" },
    { content: "Reports are generating with wrong date ranges even when I set them manually.", customerLabel: "Lucas" },
    { content: "Session expires too quickly. I get logged out every 10 minutes while working.", customerLabel: "Evelyn" },
];
