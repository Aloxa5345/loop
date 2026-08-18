import Image from "next/image";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <>
            <style>{`
            /* ════════════════════════════════════════
               LOOP FOOTER — v2 UNIQUE DESIGN
               ════════════════════════════════════════ */
            .lf2 {
                position: relative;
                background: #020817;
                overflow: hidden;
                font-family: 'Inter', sans-serif;
            }

            /* SVG wave separator at the top */
            .lf2-wave {
                display: block;
                width: 100%;
                line-height: 0;
                margin-bottom: -2px;
            }

            /* Subtle noise texture overlay */
            .lf2::before {
                content: '';
                position: absolute;
                inset: 0;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                pointer-events: none;
                opacity: .5;
            }

            /* Glowing radial behind content */
            .lf2::after {
                content: '';
                position: absolute;
                width: 900px; height: 400px;
                border-radius: 50%;
                background: radial-gradient(ellipse, rgba(79,70,229,.08) 0%, transparent 65%);
                bottom: -100px; left: 50%;
                transform: translateX(-50%);
                pointer-events: none;
            }

            /* ── INNER WRAPPER ── */
            .lf2-inner {
                position: relative;
                z-index: 1;
                max-width: 1280px;
                margin: 0 auto;
                padding: 52px 48px 0;
            }

            /* ── TOP ROW — 4 columns ── */
            .lf2-cols {
                display: grid;
                grid-template-columns: 1.8fr 1fr 1fr 1fr;
                gap: 40px;
                padding-bottom: 40px;
                border-bottom: 1px solid rgba(255,255,255,.05);
            }

            /* Brand column */
            .lf2-brand-logo {
                display: block;
                margin-bottom: 14px;
            }
            .lf2-brand-desc {
                font-size: 13px;
                color: #334155;
                line-height: 1.7;
                margin-bottom: 20px;
                max-width: 260px;
            }

            /* Tech badges */
            .lf2-tech {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .lf2-tech-badge {
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: .05em;
                text-transform: uppercase;
                background: rgba(255,255,255,.05);
                border: 1px solid rgba(255,255,255,.08);
                color: #64748b;
                white-space: nowrap;
            }

            /* Section columns */
            .lf2-col-title {
                font-size: 11px;
                font-weight: 700;
                color: #f1f5f9;
                text-transform: uppercase;
                letter-spacing: .1em;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .lf2-col-title::after {
                content: '';
                flex: 1;
                height: 1px;
                background: rgba(255,255,255,.06);
            }
            .lf2-links {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .lf2-link {
                font-size: 13px;
                color: #475569;
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: .18s;
                padding: 2px 0;
            }
            .lf2-link:hover { color: #22d3ee; transform: translateX(3px); }
            .lf2-link-dot {
                width: 4px; height: 4px;
                border-radius: 50%;
                background: #334155;
                flex-shrink: 0;
                transition: .18s;
            }
            .lf2-link:hover .lf2-link-dot { background: #06b6d4; box-shadow: 0 0 6px rgba(6,182,212,.6); }

            /* ── STATS ROW ── */
            .lf2-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1px;
                background: rgba(255,255,255,.05);
                border-radius: 16px;
                overflow: hidden;
                margin: 32px 0;
            }
            .lf2-stat {
                background: rgba(255,255,255,.025);
                padding: 18px 20px;
                text-align: center;
                transition: .2s;
            }
            .lf2-stat:hover { background: rgba(255,255,255,.05); }
            .lf2-stat-val {
                font-size: 22px;
                font-weight: 900;
                letter-spacing: -.5px;
                line-height: 1;
                margin-bottom: 4px;
                background: linear-gradient(90deg,#22d3ee,#818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .lf2-stat-lbl {
                font-size: 10px;
                color: #334155;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: .07em;
            }

            /* ── BOTTOM BAR ── */
            .lf2-bottom {
                position: relative;
                z-index: 1;
                border-top: 1px solid rgba(255,255,255,.04);
                padding: 18px 48px;
                max-width: 1280px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
            }
            .lf2-copy {
                font-size: 12px;
                color: #1e293b;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .lf2-copy-sep { color: #0f172a; }
            .lf2-status {
                display: flex;
                align-items: center;
                gap: 7px;
                font-size: 11px;
                color: #1e293b;
            }
            .lf2-status-dot {
                width: 7px; height: 7px;
                border-radius: 50%;
                background: #4ade80;
                box-shadow: 0 0 8px rgba(74,222,128,.7);
                animation: lf2Pulse 2s ease-in-out infinite;
            }
            @keyframes lf2Pulse {
                0%,100% { opacity:1; transform:scale(1); }
                50%      { opacity:.4; transform:scale(.8); }
            }
            .lf2-made {
                font-size: 11px;
                color: #0f172a;
            }
            .lf2-made span { color: #1e3a5f; }

            /* ── RESPONSIVE ── */
            @media (max-width: 1024px) {
                .lf2-cols { grid-template-columns: 1fr 1fr; }
                .lf2-stats { grid-template-columns: repeat(2,1fr); }
            }
            @media (max-width: 640px) {
                .lf2-inner { padding: 36px 20px 0; }
                .lf2-cols  { grid-template-columns: 1fr; gap: 28px; }
                .lf2-stats { grid-template-columns: repeat(2,1fr); }
                .lf2-bottom { padding: 16px 20px; flex-direction:column; align-items:flex-start; }
            }
            `}</style>

            <footer className="lf2">

                {/* Wave separator */}
                <svg className="lf2-wave" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z"
                        fill="rgba(255,255,255,0.03)" />
                </svg>

                {/* Main content */}
                <div className="lf2-inner">

                    {/* 4-column grid */}
                    <div className="lf2-cols">

                        {/* ── Brand ── */}
                        <div>
                            <div className="lf2-brand-logo">
                                <Image
                                    src="/logo.png"
                                    alt="LOOP AI"
                                    width={160}
                                    height={58}
                                    style={{ height: "auto", objectFit: "contain" }}
                                />
                            </div>
                            <p className="lf2-brand-desc">
                                AI-powered customer feedback intelligence. Collect, classify, and act on what your customers actually want.
                            </p>
                            <div className="lf2-tech">
                                {["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Gemini AI", "Zod"].map(t => (
                                    <span key={t} className="lf2-tech-badge">{t}</span>
                                ))}
                            </div>
                        </div>

                        {/* ── Product ── */}
                        <div>
                            <div className="lf2-col-title">Product</div>
                            <div className="lf2-links">
                                {[
                                    { href: "/dashboard", label: "Dashboard" },
                                    { href: "/feedback", label: "Feedback Inbox" },
                                    { href: "/ai", label: "AI Analysis" },
                                    { href: "/analytics", label: "Analytics" },
                                    { href: "/themes", label: "Themes" },
                                    { href: "/ask-loop", label: "Ask LOOP" },
                                ].map(({ href, label }) => (
                                    <a key={href} href={href} className="lf2-link">
                                        <span className="lf2-link-dot" />
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* ── Tools ── */}
                        <div>
                            <div className="lf2-col-title">Tools</div>
                            <div className="lf2-links">
                                {[
                                    { href: "/upload", label: "CSV Upload" },
                                    { href: "/simulated", label: "Sample Channels" },
                                    { href: "/reports", label: "Reports" },
                                    { href: "/notifications", label: "Notifications" },
                                    { href: "/workspace/members", label: "Team Members" },
                                    { href: "/workspace/settings", label: "Settings" },
                                ].map(({ href, label }) => (
                                    <a key={href} href={href} className="lf2-link">
                                        <span className="lf2-link-dot" />
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* ── Platform ── */}
                        <div>
                            <div className="lf2-col-title">Platform</div>
                            <div className="lf2-links">
                                {[
                                    { href: "/signup", label: "Create Account" },
                                    { href: "/login", label: "Sign In" },
                                    { href: "/workspace", label: "Workspaces" },
                                    { href: "/dashboard", label: "Dashboard" },
                                ].map(({ href, label }) => (
                                    <a key={href} href={href} className="lf2-link">
                                        <span className="lf2-link-dot" />
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="lf2-stats">
                        {[
                            { val: "4", lbl: "AI Features" },
                            { val: "17+", lbl: "Channels" },
                            { val: "3", lbl: "User Roles" },
                            { val: "∞", lbl: "Insights" },
                        ].map(({ val, lbl }) => (
                            <div key={lbl} className="lf2-stat">
                                <div className="lf2-stat-val">{val}</div>
                                <div className="lf2-stat-lbl">{lbl}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="lf2-bottom">
                    <div className="lf2-copy">
                        <span>© {year} LOOP</span>
                        <span className="lf2-copy-sep">·</span>
                        <span>All rights reserved</span>
                    </div>
                    <div className="lf2-status">
                        <span className="lf2-status-dot" />
                        <span>All systems operational</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
