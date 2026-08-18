"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import NotificationBell from "@/components/NotificationBell";

interface Props {
    role: RoleKey;
}

const ROLE_CFG: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
    ADMIN: { icon: "👑", label: "Admin", color: "#c4b5fd", bg: "rgba(124,58,237,.2)", border: "rgba(124,58,237,.3)" },
    ANALYST: { icon: "📊", label: "Analyst", color: "#22d3ee", bg: "rgba(6,182,212,.12)", border: "rgba(6,182,212,.25)" },
    VIEWER: { icon: "👀", label: "Viewer", color: "#94a3b8", bg: "rgba(100,116,139,.12)", border: "rgba(100,116,139,.2)" },
};

export default function Sidebar({ role }: Props) {
    const pathname = usePathname();
    const navRef = useRef<HTMLElement>(null);

    const [collapsed, setCollapsed] = useState(false);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    // ── Restore collapse preference ───────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem("loop-sidebar-collapsed") === "true";
        setCollapsed(saved);
        document.documentElement.style.setProperty("--sidebar-width", saved ? "68px" : "256px");
    }, []);

    // ── Track nav scroll position ─────────────────────────────
    function checkScroll() {
        const el = navRef.current;
        if (!el) return;
        setCanScrollUp(el.scrollTop > 4);
        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    }

    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener("scroll", checkScroll);
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
    }, [collapsed]); // re-check whenever collapse state changes

    // ── Scroll nav programmatically ───────────────────────────
    function scrollNav(dir: "up" | "down") {
        navRef.current?.scrollBy({ top: dir === "up" ? -120 : 120, behavior: "smooth" });
    }

    // ── Toggle sidebar width ──────────────────────────────────
    function toggleCollapse() {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("loop-sidebar-collapsed", String(next));
        document.documentElement.style.setProperty("--sidebar-width", next ? "68px" : "256px");
    }

    const roleCfg = ROLE_CFG[role] ?? ROLE_CFG.VIEWER;

    const links = [
        { href: "/dashboard", icon: "🏠", label: "Dashboard", show: true },
        { href: "/feedback", icon: "💬", label: "Feedback", show: hasPermission(role, "view-feedback") },
        { href: "/upload", icon: "📂", label: "CSV Upload", show: hasPermission(role, "upload-feedback") },
        { href: "/simulated", icon: "🔗", label: "Sample Channels", show: hasPermission(role, "view-simulated") },
        { href: "/ai", icon: "🤖", label: "AI Analysis", show: hasPermission(role, "view-ai") },
        { href: "/analytics", icon: "📊", label: "Analytics", show: hasPermission(role, "view-analytics") },
        { href: "/themes", icon: "🧠", label: "Themes", show: hasPermission(role, "view-analytics") },
        { href: "/ask-loop", icon: "💬", label: "Ask LOOP", show: true },
        { href: "/reports", icon: "📄", label: "Reports", show: hasPermission(role, "view-reports") },
        { href: "/notifications", icon: "bell", label: "Notifications", show: hasPermission(role, "manage-users") },
        { href: "/workspace/members", icon: "👥", label: "Users", show: hasPermission(role, "manage-users") },
        { href: "/workspace", icon: "🏢", label: "Workspace", show: hasPermission(role, "manage-users") },
        { href: "/workspace/settings", icon: "⚙️", label: "Settings", show: hasPermission(role, "workspace-settings") },
    ].filter((l) => l.show);

    // ── Scroll arrow button style ─────────────────────────────
    const arrowBtn = (visible: boolean): React.CSSProperties => ({
        width: "100%",
        height: "24px",
        border: "none",
        background: visible ? "rgba(255,255,255,.04)" : "transparent",
        color: visible ? "#475569" : "transparent",
        cursor: visible ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        borderRadius: "6px",
        transition: ".15s",
        pointerEvents: visible ? "auto" : "none",
        flexShrink: 0,
        marginBottom: "2px",
    });

    return (
        <aside
            className="sidebar"
            style={{
                width: collapsed ? "68px" : "256px",
                transition: "width .28s cubic-bezier(.4,0,.2,1)",
                overflow: "hidden",
            }}
        >
            {/* ── Header: Logo + Collapse toggle ── */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                paddingBottom: "14px",
                borderBottom: "1px solid rgba(255,255,255,.05)",
                minHeight: "52px",
                flexShrink: 0,
            }}>
                {!collapsed && (
                    <div className="logo" style={{ margin: 0, padding: 0, border: "none", flex: 1, justifyContent: "flex-start" }}>
                        <Image
                            src="/logo.png"
                            alt="LOOP AI"
                            width={180}
                            height={66}
                            priority
                            style={{ objectFit: "contain", objectPosition: "left center" }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                    </div>
                )}
                <button
                    type="button"
                    onClick={toggleCollapse}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    style={{
                        width: "28px", height: "28px",
                        border: "1px solid rgba(255,255,255,.1)",
                        borderRadius: "7px",
                        background: "rgba(255,255,255,.04)",
                        color: "#64748b",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", flexShrink: 0, transition: ".2s",
                        marginLeft: collapsed ? "auto" : "8px",
                        marginRight: collapsed ? "auto" : "0",
                    }}
                >
                    {collapsed ? "▶" : "◀"}
                </button>
            </div>

            {/* ── Role badge ── */}
            {collapsed ? (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", fontSize: "18px", flexShrink: 0 }} title={roleCfg.label}>
                    {roleCfg.icon}
                </div>
            ) : (
                <div style={{
                    margin: "0 4px 12px", padding: "6px 12px", borderRadius: "8px",
                    background: roleCfg.bg, border: `1px solid ${roleCfg.border}`,
                    display: "flex", alignItems: "center", gap: "6px",
                    fontSize: "12px", fontWeight: 700, color: roleCfg.color, flexShrink: 0,
                }}>
                    <span>{roleCfg.icon}</span>
                    <span>{roleCfg.label}</span>
                </div>
            )}

            {/* ── ▲ Scroll Up button ── */}
            <button type="button" onClick={() => scrollNav("up")} aria-label="Scroll up" style={arrowBtn(canScrollUp)}>
                ▲
            </button>

            {/* ── Nav (scrollable, no scrollbar) ── */}
            <nav
                ref={navRef}
                className="menu"
                style={{ flex: 1, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}
            >
                {links.map(({ href, icon, label }) => {
                    // Special: notification bell
                    if (icon === "bell") {
                        return collapsed ? (
                            <Link key={href} href={href} title="Notifications" style={{
                                display: "flex", justifyContent: "center", padding: "10px 0",
                                borderRadius: "10px", textDecoration: "none", fontSize: "18px", transition: ".18s",
                            }}>🔔</Link>
                        ) : (
                            <NotificationBell key={href} />
                        );
                    }

                    const active =
                        pathname === href ||
                        (href !== "/feedback" && href !== "/workspace" && pathname.startsWith(href + "/")) ||
                        (href === "/feedback" && (pathname === "/feedback" || (pathname.startsWith("/feedback/") && !pathname.startsWith("/feedback/upload")))) ||
                        (href === "/workspace" && pathname === "/workspace");

                    return collapsed ? (
                        <Link key={href} href={href} className={active ? "active" : ""} title={label} style={{
                            display: "flex", justifyContent: "center", padding: "10px 0",
                            borderRadius: "10px", textDecoration: "none", fontSize: "18px", transition: ".18s",
                        }}>
                            {icon}
                        </Link>
                    ) : (
                        <Link key={href} href={href} className={active ? "active" : ""}>
                            <span style={{ fontSize: "15px", flexShrink: 0 }}>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* ── ▼ Scroll Down button ── */}
            <button type="button" onClick={() => scrollNav("down")} aria-label="Scroll down" style={{ ...arrowBtn(canScrollDown), marginBottom: "6px", marginTop: "2px" }}>
                ▼
            </button>

            {/* ── Logout ── */}
            <div className="menu-logout" style={{ flexShrink: 0 }}>
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    title="Logout"
                    style={collapsed ? { textAlign: "center", fontSize: "18px", padding: "10px 0", width: "100%" } : {}}
                >
                    {collapsed ? "🚪" : "🚪 Logout"}
                </button>
            </div>
        </aside>
    );
}
