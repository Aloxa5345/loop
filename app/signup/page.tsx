"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signup } from "@/app/actions/auth";
import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════
   CONSTELLATION CANVAS  (identical to login)
═══════════════════════════════════════════ */
function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const cv = el, ctx = cv.getContext("2d")!;
    let raf: number, t = 0;
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    const N = 70;
    const stars = Array.from({ length: N }, () => ({
      x: Math.random() * cv.width,
      y: Math.random() * cv.height,
      r: .4 + Math.random() * 1.6,
      vx: (Math.random() - .5) * .3,
      vy: (Math.random() - .5) * .3,
      twinkle: Math.random() * Math.PI * 2,
      speed: .5 + Math.random(),
    }));

    let shoot = { x: -200, y: -200, vx: 0, vy: 0, life: 0, max: 0, active: false };
    let shootTimer = 0;
    function spawnShoot() {
      shoot = {
        x: Math.random() * cv.width * .6 + cv.width * .2,
        y: Math.random() * cv.height * .3,
        vx: 4 + Math.random() * 5,
        vy: 2 + Math.random() * 3,
        life: 0, max: 55, active: true,
      };
    }

    function draw() {
      t += .010;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#010810"; ctx.fillRect(0, 0, cv.width, cv.height);

      [
        { x: .2, y: .3, c: "rgba(79,70,229,.07)", r: .35 },
        { x: .8, y: .6, c: "rgba(6,182,212,.06)", r: .3 },
        { x: .55, y: .8, c: "rgba(124,58,237,.05)", r: .28 },
      ].forEach(b => {
        const g = ctx.createRadialGradient(
          b.x * cv.width, b.y * cv.height, 0,
          b.x * cv.width, b.y * cv.height, b.r * cv.width
        );
        g.addColorStop(0, b.c); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      });

      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = cv.width; if (s.x > cv.width) s.x = 0;
        if (s.y < 0) s.y = cv.height; if (s.y > cv.height) s.y = 0;
        const alpha = .3 + .5 * ((Math.sin(t * s.speed + s.twinkle) + 1) / 2);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fill();
      });

      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(99,102,241,${.12 * (1 - d / 120)})`;
            ctx.lineWidth = .6;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      shootTimer++;
      if (shootTimer > 180 && !shoot.active) { shootTimer = 0; spawnShoot(); }
      if (shoot.active) {
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life++;
        const a = shoot.life < 8 ? shoot.life / 8
          : shoot.life > shoot.max - 10 ? (shoot.max - shoot.life) / 10 : 1;
        const tail = ctx.createLinearGradient(
          shoot.x, shoot.y,
          shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12
        );
        tail.addColorStop(0, `rgba(255,255,255,${a * .9})`);
        tail.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = tail; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shoot.x, shoot.y);
        ctx.lineTo(shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12);
        ctx.stroke();
        if (shoot.life >= shoot.max) shoot.active = false;
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ═══════════════════════════════════════════
   PASSWORD STRENGTH
═══════════════════════════════════════════ */
function pwStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "#475569" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak", color: "#ef4444" };
  if (s <= 2) return { score: s, label: "Fair", color: "#f59e0b" };
  if (s <= 3) return { score: s, label: "Good", color: "#22d3ee" };
  return { score: s, label: "Strong", color: "#4ade80" };
}

/* ═══════════════════════════════════════════
   CSS  (same constellation card style)
═══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}

.su2-root{
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  padding:20px 16px; position:relative; overflow:hidden;
  font-family:'Inter',sans-serif;
}

/* ── CARD ── */
.su2-card{
  position:relative; z-index:10;
  width:100%; max-width:460px;
  border-radius:30px; padding:48px 44px 42px;
  background:rgba(6,12,28,.78);
  backdrop-filter:blur(52px); -webkit-backdrop-filter:blur(52px);
  background-clip:padding-box;
  box-shadow:
    0 0 0 1px rgba(99,102,241,.18),
    0 60px 120px rgba(0,0,0,.75),
    0 0 0 1px rgba(255,255,255,.04) inset;
  animation:su2In .75s cubic-bezier(.16,1,.3,1) both;
  overflow:hidden;
}
@keyframes su2In{from{opacity:0;transform:translateY(60px) scale(.93)}to{opacity:1;transform:none}}

/* spinning conic border */
.su2-card::before{
  content:''; position:absolute; inset:-1px; border-radius:31px; z-index:-1;
  background:conic-gradient(
    from var(--su2-angle,0deg),
    #7c3aed 0%,#22d3ee 22%,#4f46e5 44%,#22d3ee 66%,#7c3aed 100%
  );
  animation:su2BorderSpin 7s linear infinite; opacity:.6;
}
@property --su2-angle{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes su2BorderSpin{to{--su2-angle:360deg}}

/* inner bg */
.su2-card::after{
  content:''; position:absolute; inset:1px; border-radius:29px;
  background:rgba(6,12,28,.88); z-index:-1;
}

/* ── LOGO ── */
.su2-logo{
  display:flex; justify-content:center; margin-bottom:26px;
  animation:su2LogoPop .6s .1s cubic-bezier(.16,1,.3,1) both;
}
@keyframes su2LogoPop{from{opacity:0;transform:scale(.65)}to{opacity:1;transform:none}}

/* ── HEADING ── */
.su2-title{
  font-family:'Outfit',sans-serif;
  font-size:26px; font-weight:800; color:#f1f5f9; text-align:center;
  letter-spacing:-.4px; margin-bottom:5px;
  animation:su2FadeUp .5s .15s ease both;
}
@keyframes su2FadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.su2-sub{
  font-size:13px; color:#64748b; text-align:center; margin-bottom:24px; line-height:1.6;
  animation:su2FadeUp .5s .22s ease both;
}

/* features */
.su2-feats{
  display:flex; flex-direction:column; gap:7px; margin-bottom:22px;
}
.su2-feat{
  display:flex; align-items:center; gap:10px;
  font-size:12px; color:#475569;
  animation:su2FeatIn .35s ease both;
}
.su2-feat:nth-child(1){animation-delay:.28s}
.su2-feat:nth-child(2){animation-delay:.35s}
.su2-feat:nth-child(3){animation-delay:.42s}
@keyframes su2FeatIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}
.su2-feat-dot{
  width:6px; height:6px; border-radius:50%; flex-shrink:0;
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  box-shadow:0 0 6px rgba(99,102,241,.7);
}

/* ── ALERTS ── */
.su2-alert{
  border-radius:11px; padding:10px 14px; font-size:13px; margin-bottom:16px;
  display:flex; align-items:center; gap:8px; animation:su2AlertIn .3s ease;
}
@keyframes su2AlertIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.su2-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#fca5a5}

/* ── FIELDS ── */
.su2-field{
  margin-bottom:14px;
  animation:su2FadeUp .4s ease both;
}
.su2-field:nth-child(1){animation-delay:.32s}
.su2-field:nth-child(2){animation-delay:.38s}
.su2-field:nth-child(3){animation-delay:.44s}

.su2-label{
  display:block; font-size:11px; font-weight:700; color:#475569;
  text-transform:uppercase; letter-spacing:.09em; margin-bottom:7px;
}
.su2-wrap{ position:relative; }
.su2-ico{
  position:absolute; left:14px; top:50%; transform:translateY(-50%);
  font-size:14px; color:#64748b; pointer-events:none; transition:.22s;
}
.su2-input{
  width:100%; padding:13px 16px 13px 44px;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.09);
  border-radius:13px; color:#f1f5f9; font-size:14px; font-family:'Inter',sans-serif;
  outline:none; transition:.27s;
}
.su2-input::placeholder{ color:#475569; }
.su2-input:-webkit-autofill,
.su2-input:-webkit-autofill:hover,
.su2-input:-webkit-autofill:focus{
  -webkit-text-fill-color:#f1f5f9 !important;
  -webkit-box-shadow:0 0 0 1000px rgba(6,12,28,.9) inset !important;
  caret-color:#f1f5f9;
}
.su2-input:focus{
  border-color:#7c3aed;
  background:rgba(124,58,237,.09);
  box-shadow:0 0 0 3px rgba(124,58,237,.15), 0 0 22px rgba(124,58,237,.07);
}
.su2-wrap:focus-within .su2-ico{ color:#c084fc; transform:translateY(-50%) scale(1.12); }

/* strength */
.su2-strength{ margin-top:6px; display:flex; align-items:center; gap:8px; }
.su2-bars{ display:flex; gap:4px; flex:1; }
.su2-bar{ height:3px; flex:1; border-radius:2px; background:rgba(255,255,255,.07); transition:.35s; }
.su2-str-lbl{ font-size:11px; font-weight:600; min-width:44px; text-align:right; }

/* ── BUTTON ── */
.su2-btn{
  width:100%; margin-top:6px; padding:15px;
  border:none; border-radius:14px; cursor:pointer;
  font-family:'Outfit',sans-serif;
  font-size:16px; font-weight:800; letter-spacing:.05em; color:#fff;
  background:linear-gradient(90deg,#5b21b6,#7c3aed,#0891b2,#7c3aed,#5b21b6);
  background-size:300% 100%;
  animation:su2BtnGrad 5s linear infinite;
  transition:transform .25s, box-shadow .25s, opacity .2s;
  box-shadow:0 8px 30px rgba(124,58,237,.5), 0 0 0 1px rgba(255,255,255,.09) inset;
  position:relative; overflow:hidden;
}
@keyframes su2BtnGrad{0%{background-position:0%}100%{background-position:300%}}
.su2-btn:hover:not(:disabled){
  transform:translateY(-4px) scale(1.015);
  box-shadow:0 20px 48px rgba(124,58,237,.7), 0 0 0 1px rgba(255,255,255,.14) inset;
}
.su2-btn:active:not(:disabled){ transform:translateY(-1px); }
.su2-btn:disabled{ opacity:.45; cursor:not-allowed; animation:none; background:#7c3aed; }
.su2-btn::after{
  content:''; position:absolute; top:-60%; left:-100%; width:45%; height:220%;
  background:linear-gradient(110deg,transparent,rgba(255,255,255,.22),transparent);
  animation:su2Swipe 2.5s ease-in-out infinite;
}
@keyframes su2Swipe{0%{left:-100%}55%{left:150%}100%{left:150%}}

/* ── LOGIN LINK ── */
.su2-login-row{
  display:flex; align-items:center; justify-content:center;
  gap:6px; margin-top:22px; padding-top:18px;
  border-top:1px solid rgba(255,255,255,.06);
  font-size:13.5px; color:#475569;
  animation:su2FadeUp .4s .55s ease both;
}
.su2-login-link{
  color:#818cf8; font-weight:700; text-decoration:none;
  position:relative; transition:.2s;
  font-family:'Outfit',sans-serif;
}
.su2-login-link::after{
  content:''; position:absolute; left:0; bottom:-1px;
  width:0; height:1px; background:#818cf8; transition:.25s;
}
.su2-login-link:hover{ color:#e2e8f0; }
.su2-login-link:hover::after{ width:100%; }

/* field error */
.su2-field-err{ color:#fca5a5; font-size:12px; margin-top:5px; }

@media(max-width:480px){
  .su2-card{ padding:36px 22px 30px; border-radius:22px; }
  .su2-title{ font-size:22px; }
}
`;

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [pw, setPw] = useState("");
  const str = pwStrength(pw);

  return (
    <>
      <style>{CSS}</style>
      <div className="su2-root">
        <Constellation />

        <div className="su2-card">
          {/* Logo */}
          <div className="su2-logo">
            <Image src="/logo.png" alt="LOOP AI" width={210} height={76} priority
              style={{ height: "auto", filter: "drop-shadow(0 0 22px rgba(124,58,237,.55))" }} />
          </div>

          <h1 className="su2-title">Create your account</h1>
          <p className="su2-sub">Join teams using LOOP AI to understand their customers</p>

          {/* Feature dots */}
          <div className="su2-feats">
            {[
              "AI-powered sentiment & topic analysis",
              "Real-time feedback dashboard",
              "Automated reports sent to your team",
            ].map(f => (
              <div key={f} className="su2-feat">
                <div className="su2-feat-dot" />{f}
              </div>
            ))}
          </div>

          {state?.errors?.general && (
            <div className="su2-alert su2-err">⚠️ {state.errors.general}</div>
          )}

          <form action={action}>
            {/* Name */}
            <div className="su2-field">
              <label className="su2-label" htmlFor="su2-name">Full Name</label>
              <div className="su2-wrap">
                <input id="su2-name" name="name" type="text" autoComplete="name"
                  required className="su2-input" placeholder="Your full name" />
                <span className="su2-ico">👤</span>
              </div>
              {state?.errors?.name && <p className="su2-field-err">⚠️ {state.errors.name}</p>}
            </div>

            {/* Email */}
            <div className="su2-field">
              <label className="su2-label" htmlFor="su2-email">Email Address</label>
              <div className="su2-wrap">
                <input id="su2-email" name="email" type="email" autoComplete="email"
                  required className="su2-input" placeholder="you@company.com" />
                <span className="su2-ico">✉️</span>
              </div>
              {state?.errors?.email && <p className="su2-field-err">⚠️ {state.errors.email}</p>}
            </div>

            {/* Password */}
            <div className="su2-field">
              <label className="su2-label" htmlFor="su2-password">Password</label>
              <div className="su2-wrap">
                <input id="su2-password" name="password" type="password"
                  autoComplete="new-password" required className="su2-input"
                  placeholder="Min 8 characters"
                  onChange={e => setPw(e.target.value)} />
                <span className="su2-ico">🔒</span>
              </div>
              {pw && (
                <div className="su2-strength">
                  <div className="su2-bars">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="su2-bar"
                        style={{ background: i <= str.score ? str.color : undefined }} />
                    ))}
                  </div>
                  <span className="su2-str-lbl" style={{ color: str.color }}>{str.label}</span>
                </div>
              )}
              {state?.errors?.password && <p className="su2-field-err">⚠️ {state.errors.password}</p>}
            </div>

            <button type="submit" disabled={pending} className="su2-btn">
              {pending ? "⏳ Creating account…" : "Create Account →"}
            </button>
          </form>

          {/* Login link */}
          <div className="su2-login-row">
            <span>Already have an account?</span>
            <Link href="/login" className="su2-login-link">Sign In →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
