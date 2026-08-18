"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════
   CONSTELLATION CANVAS
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

    // shooting star
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

      // bg
      ctx.fillStyle = "#010810";
      ctx.fillRect(0, 0, cv.width, cv.height);

      // nebula clouds
      [
        { x: .2, y: .3, c: "rgba(79,70,229,.07)", r: .35 },
        { x: .8, y: .6, c: "rgba(6,182,212,.06)", r: .3 },
        { x: .5, y: .8, c: "rgba(124,58,237,.05)", r: .28 },
      ].forEach(b => {
        const g = ctx.createRadialGradient(b.x * cv.width, b.y * cv.height, 0, b.x * cv.width, b.y * cv.height, b.r * cv.width);
        g.addColorStop(0, b.c); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      });

      // move & draw stars
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = cv.width; if (s.x > cv.width) s.x = 0;
        if (s.y < 0) s.y = cv.height; if (s.y > cv.height) s.y = 0;
        const alpha = .3 + .5 * ((Math.sin(t * s.speed + s.twinkle) + 1) / 2);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fill();
      });

      // constellation lines between near stars
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(99,102,241,${.12 * (1 - d / 120)})`;
            ctx.lineWidth = .6;
            ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y); ctx.stroke();
          }
        }
      }

      // shooting star
      shootTimer++;
      if (shootTimer > 180 && !shoot.active) { shootTimer = 0; spawnShoot(); }
      if (shoot.active) {
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life++;
        const a = shoot.life < 8 ? shoot.life / 8 : shoot.life > shoot.max - 10 ? (shoot.max - shoot.life) / 10 : 1;
        const tail = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12);
        tail.addColorStop(0, `rgba(255,255,255,${a * .9})`);
        tail.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = tail; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y);
        ctx.lineTo(shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12); ctx.stroke();
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
   TYPEWRITER
═══════════════════════════════════════════ */
function useTypewriter(words: string[], speed = 75, pause = 2000) {
  const [text, setText] = useState("");
  const [wi, setWi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[wi];
    const id = setTimeout(() => {
      if (!del) {
        setText(word.slice(0, ci + 1));
        if (ci + 1 === word.length) setTimeout(() => setDel(true), pause);
        else setCi(c => c + 1);
      } else {
        setText(word.slice(0, ci - 1));
        if (ci - 1 === 0) { setDel(false); setWi(w => (w + 1) % words.length); setCi(0); }
        else setCi(c => c - 1);
      }
    }, del ? speed / 2 : speed);
    return () => clearTimeout(id);
  }, [text, ci, del, wi, words, speed, pause]);
  return text;
}

/* ═══════════════════════════════════════════
   CSS
═══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}

.cs-root{
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  padding:20px 16px; position:relative; overflow:hidden;
  font-family:'Inter',sans-serif;
}

/* ── CARD ── */
.cs-card{
  position:relative; z-index:10;
  width:100%; max-width:440px;
  border-radius:30px; padding:52px 44px 44px;
  background:rgba(6,12,28,.78);
  backdrop-filter:blur(52px); -webkit-backdrop-filter:blur(52px);
  border:1px solid transparent;
  /* gradient border trick */
  background-clip:padding-box;
  box-shadow:
    0 0 0 1px rgba(99,102,241,.18),
    0 60px 120px rgba(0,0,0,.75),
    0 0 80px rgba(79,70,229,.07),
    0 0 0 1px rgba(255,255,255,.04) inset;
  animation:csIn .75s cubic-bezier(.16,1,.3,1) both;
  overflow:hidden;
}
@keyframes csIn{from{opacity:0;transform:translateY(60px) scale(.93)}to{opacity:1;transform:none}}

/* animated glow border */
.cs-card::before{
  content:''; position:absolute; inset:-1px; border-radius:31px; z-index:-1;
  background:conic-gradient(
    from var(--cs-angle,0deg),
    #4f46e5 0%,#22d3ee 22%,#7c3aed 44%,#22d3ee 66%,#4f46e5 100%
  );
  animation:csBorderSpin 7s linear infinite; opacity:.6;
}
@property --cs-angle{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes csBorderSpin{to{--cs-angle:360deg}}

/* inner bg */
.cs-card::after{
  content:''; position:absolute; inset:1px; border-radius:29px;
  background:rgba(6,12,28,.88); z-index:-1;
}

/* ── LOGO ── */
.cs-logo{
  display:flex; justify-content:center; margin-bottom:30px;
  animation:csLogo .6s .1s cubic-bezier(.16,1,.3,1) both;
}
@keyframes csLogo{from{opacity:0;transform:scale(.65)}to{opacity:1;transform:none}}

/* ── HEADLINE ── */
.cs-tw-wrap{
  text-align:center; min-height:40px; margin-bottom:6px;
  animation:csFadeUp .5s .15s ease both;
}
@keyframes csFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.cs-tw{
  font-family:'Outfit',sans-serif;
  font-size:27px; font-weight:800; letter-spacing:-.4px;
  background:linear-gradient(100deg,#f1f5f9 20%,#a5b4fc 55%,#67e8f9);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.cs-cursor{
  display:inline-block; width:2px; height:26px;
  background:#67e8f9; margin-left:3px; vertical-align:middle;
  animation:csBlink .7s step-end infinite;
}
@keyframes csBlink{0%,100%{opacity:1}50%{opacity:0}}

.cs-sub{
  font-size:13px; color:#64748b; text-align:center; margin-bottom:28px; line-height:1.6;
  animation:csFadeUp .5s .22s ease both;
}

/* ── ALERTS ── */
.cs-alert{
  border-radius:11px; padding:10px 14px; font-size:13px; margin-bottom:16px;
  display:flex; align-items:center; gap:8px; animation:csAlertIn .3s ease;
}
@keyframes csAlertIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.cs-ok {background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.2);color:#a5f3fc}
.cs-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#fca5a5}

/* ── FIELDS ── */
.cs-field{
  margin-bottom:16px;
  animation:csFadeUp .4s ease both;
}
.cs-field:nth-child(1){animation-delay:.3s}
.cs-field:nth-child(2){animation-delay:.37s}

.cs-label{
  display:block; font-size:11px; font-weight:700; color:#64748b;
  text-transform:uppercase; letter-spacing:.09em; margin-bottom:8px;
}
.cs-wrap{ position:relative; }
.cs-ico{
  position:absolute; left:14px; top:50%; transform:translateY(-50%);
  font-size:14px; color:#64748b; pointer-events:none; transition:.22s;
}
.cs-input{
  width:100%; padding:14px 16px 14px 46px;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.09);
  border-radius:13px; color:#f1f5f9; font-size:14px; font-family:'Inter',sans-serif;
  outline:none; transition:.27s;
}
.cs-input::placeholder{ color:#475569; }
.cs-input:-webkit-autofill,
.cs-input:-webkit-autofill:hover,
.cs-input:-webkit-autofill:focus{
  -webkit-text-fill-color:#f1f5f9 !important;
  -webkit-box-shadow:0 0 0 1000px rgba(6,12,28,.9) inset !important;
  caret-color:#f1f5f9;
}
.cs-input:focus{
  border-color:#6366f1;
  background:rgba(99,102,241,.09);
  box-shadow:0 0 0 3px rgba(99,102,241,.15), 0 0 22px rgba(99,102,241,.07);
}
.cs-wrap:focus-within .cs-ico{ color:#818cf8; transform:translateY(-50%) scale(1.12); }

/* ── BUTTON ── */
.cs-btn{
  width:100%; margin-top:6px; padding:15px;
  border:none; border-radius:14px; cursor:pointer;
  font-family:'Outfit',sans-serif;
  font-size:16px; font-weight:800; letter-spacing:.05em; color:#fff;
  background:linear-gradient(90deg,#312e81,#4f46e5,#0891b2,#4f46e5,#312e81);
  background-size:300% 100%;
  animation:csBtnGrad 5s linear infinite;
  transition:transform .25s, box-shadow .25s, opacity .2s;
  box-shadow:0 8px 30px rgba(79,70,229,.5), 0 0 0 1px rgba(255,255,255,.09) inset;
  position:relative; overflow:hidden;
}
@keyframes csBtnGrad{0%{background-position:0%}100%{background-position:300%}}
.cs-btn:hover:not(:disabled){
  transform:translateY(-4px) scale(1.015);
  box-shadow:0 20px 48px rgba(79,70,229,.7), 0 0 0 1px rgba(255,255,255,.14) inset;
}
.cs-btn:active:not(:disabled){ transform:translateY(-1px); }
.cs-btn:disabled{ opacity:.45; cursor:not-allowed; animation:none; background:#4f46e5; }
.cs-btn::after{
  content:''; position:absolute; top:-60%; left:-100%; width:45%; height:220%;
  background:linear-gradient(110deg,transparent,rgba(255,255,255,.22),transparent);
  animation:csSwipe 2.5s ease-in-out infinite;
}
@keyframes csSwipe{0%{left:-100%}55%{left:150%}100%{left:150%}}

/* ── SIGNUP LINK ── */
.cs-signup-row{
  display:flex; align-items:center; justify-content:center;
  gap:6px; margin-top:22px; padding-top:18px;
  border-top:1px solid rgba(255,255,255,.06);
  font-size:13.5px; color:#64748b;
  animation:csFadeUp .4s .5s ease both;
}
.cs-signup-link{
  color:#818cf8; font-weight:700; text-decoration:none;
  position:relative; transition:.2s;
  font-family:'Outfit',sans-serif;
}
.cs-signup-link::after{
  content:''; position:absolute; left:0; bottom:-1px;
  width:0; height:1px; background:#818cf8; transition:.25s;
}
.cs-signup-link:hover{ color:#e2e8f0; }
.cs-signup-link:hover::after{ width:100%; }

@media(max-width:480px){
  .cs-card{ padding:36px 22px 30px; border-radius:22px; }
  .cs-tw{ font-size:22px; }
}
`;

/* ═══════════════════════════════════════════
   LOGIN FORM
═══════════════════════════════════════════ */
function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const registered = sp.get("registered");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const typeText = useTypewriter([
    "Welcome back",
    "Sign in to LOOP AI",
    "Your insights await",
    "Know your customers",
  ], 75, 2000);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: fd.get("email"), password: fd.get("password"), redirect: false,
    });
    setPending(false);
    if (res?.error) setError("Invalid email or password.");
    else { router.push("/dashboard"); router.refresh(); }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cs-root">
        <Constellation />

        <div className="cs-card">
          {/* Logo */}
          <div className="cs-logo">
            <Image src="/logo.png" alt="LOOP AI" width={210} height={76} priority
              style={{ height: "auto", filter: "drop-shadow(0 0 22px rgba(99,102,241,.55))" }} />
          </div>

          {/* Typewriter */}
          <div className="cs-tw-wrap">
            <span className="cs-tw">{typeText}</span>
            <span className="cs-cursor" aria-hidden />
          </div>
          <p className="cs-sub">Enter your credentials to continue</p>

          {registered && <div className="cs-alert cs-ok">✅ Account created — sign in below.</div>}
          {error && <div className="cs-alert cs-err">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="cs-field">
              <label className="cs-label" htmlFor="cs-email">Email Address</label>
              <div className="cs-wrap">
                <input id="cs-email" name="email" type="email" autoComplete="email"
                  required className="cs-input" placeholder="you@company.com" />
                <span className="cs-ico">✉️</span>
              </div>
            </div>

            <div className="cs-field">
              <label className="cs-label" htmlFor="cs-pass">Password</label>
              <div className="cs-wrap">
                <input id="cs-pass" name="password" type="password"
                  autoComplete="current-password" required
                  className="cs-input" placeholder="••••••••" />
                <span className="cs-ico">🔑</span>
              </div>
            </div>

            <button type="submit" disabled={pending} className="cs-btn">
              {pending ? "⏳ Signing in…" : "Sign In →"}
            </button>
          </form>

          {/* Sign Up link */}
          <div className="cs-signup-row">
            <span>Don&apos;t have an account?</span>
            <Link href="/signup" className="cs-signup-link">Sign Up →</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
