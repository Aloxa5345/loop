"use client";

// ThemeProvider — dark mode only, kept for future use
// Currently just provides the sidebar collapse context wrapper
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
