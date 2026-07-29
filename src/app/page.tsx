"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─────────── palette ─────────── */
const INK = "#1a1815", INK2 = "#4a453c", MUTE = "#8a8272", PAPER = "#faf7f1", SURF = "#fffdf8";
const TERRA = "#e0431e", GREEN = "#3f7a2e", BLUE = "#2d4ea2", MAG = "#b8195f", AMBER = "#f2a007", AMBER2 = "#f2b208", LIME = "#8fc93a";
const serif = "'Instrument Serif', Georgia, serif";

/* ─────────── data ─────────── */
const STEPS = [
  { num: "01", color: TERRA, title: "Tell us how your day actually runs", body: "Nine questions on sleep, appetite, temperature and travel. Two minutes, no food diary, no calorie maths." },
  { num: "02", color: BLUE, title: "We read your constitution", body: "Vata, pitta, kapha — cross-checked against protein, fibre and micronutrient targets so tradition and the numbers agree." },
  { num: "03", color: GREEN, title: "Your week fills itself in", body: "Twenty-one meals, one shopping list, leftovers designed in. Late meeting Thursday? That night cooks in twelve minutes." },
  { num: "04", color: AMBER, title: "Cook it in twenty-five minutes", body: "One pan, one board, one pot. Steps written the way you cook, not the way a magazine writes." },
  { num: "05", color: MAG, title: "The week balances itself", body: "Macros tally as you go and the six tastes fill in across the week, so nothing stays missing for long." },
];
const MEAL_COLORS = [AMBER2, GREEN, TERRA, BLUE, MAG, LIME, AMBER];
const TASTES = [
  { name: "Sweet", color: AMBER2, full: 88 },
  { name: "Sour", color: MAG, full: 72 },
  { name: "Salty", color: MUTE, full: 64 },
  { name: "Pungent", color: TERRA, full: 80 },
  { name: "Bitter", color: GREEN, full: 34 },
  { name: "Astringent", color: BLUE, full: 70 },
];
const IMG = "https://images.unsplash.com/";
const FOOD = ["photo-1743674453123-93356ade2891", "photo-1743525700011-afac212694d7", "photo-1767114915989-c6ab3c8fc42e", "photo-1742281257707-0c7f7e5ca9c6", "photo-1734770931927-6410f9a64832"];
const HERO_IMGS = [
  ["photo-1743674453123-93356ade2891", "photo-1743525700011-afac212694d7"],
  ["photo-1767114915989-c6ab3c8fc42e", "photo-1742281257707-0c7f7e5ca9c6"],
  ["photo-1734770931927-6410f9a64832", "photo-1546069901-ba9599a7e63c"],
];
const WEEK = [
  { day: "Monday", color: AMBER2, meal: "Khichdi with roasted squash", time: "22 min", taste: "Sweet-led", tint: "rgba(242,178,8,.16)", ink: "#6b4c04", note: "Ghee, cumin, moong. The reset meal — starts the week gently." },
  { day: "Tuesday", color: GREEN, meal: "Methi dal, red rice, cucumber raita", time: "24 min", taste: "Bitter", tint: "rgba(63,122,46,.13)", ink: "#2c5620", note: "Bitter greens early in the week, while your appetite is sharpest." },
  { day: "Wednesday", color: MAG, meal: "Tamarind chana, millet", time: "19 min", taste: "Sour", tint: "rgba(184,25,95,.12)", ink: "#7d0f3f", note: "Cooks double. Half of it becomes Thursday, so Thursday takes 12 minutes." },
  { day: "Thursday", color: TERRA, meal: "Upma with peanuts & curry leaf", time: "12 min", taste: "Pungent", tint: "rgba(224,67,30,.12)", ink: "#8c2410", note: "Your calendar said late meeting, so the plan said twelve minutes." },
  { day: "Friday", color: BLUE, meal: "Coconut sambar, appam", time: "26 min", taste: "Astringent", tint: "rgba(45,78,162,.12)", ink: "#1d3470", note: "The long one, on the night you have time for it." },
  { day: "Saturday", color: LIME, meal: "Beetroot poriyal, curd rice", time: "18 min", taste: "Sweet", tint: "rgba(143,201,58,.16)", ink: "#42611a", note: "Cooling, light, and it clears the vegetable drawer before the shop." },
  { day: "Sunday", color: AMBER, meal: "Whatever you feel like", time: "0 min", taste: "Off-plan", tint: "rgba(26,24,21,.07)", ink: INK2, note: "One night a week the app stays shut. Nothing is forbidden here." },
].map((d, i) => ({ ...d, img: `${IMG}${FOOD[i % FOOD.length]}?auto=format&fit=crop&w=600&h=400&q=70` }));

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const kicker = (color = MUTE): React.CSSProperties => ({ fontSize: 12, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color });

export default function HomePage() {
  const [st, setSt] = useState({ p: 0, scale: 1, wp: 0, weekSpan: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const weekRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const compute = () => {
      const el = stageRef.current;
      const ih = window.innerHeight;
      let p = 0;
      if (el) { const r = el.getBoundingClientRect(); const span = r.height - ih; p = span > 0 ? clamp(-r.top / span, 0, 1) : 0; }
      const scale = clamp((ih - 56) / 744, 0.42, 1);
      let wp = 0;
      const w = weekRef.current;
      if (w) { const wr = w.getBoundingClientRect(); const ws = wr.height - ih; wp = ws > 0 ? clamp(-wr.top / ws, 0, 1) : 0; }
      const vw = window.innerWidth;
      const cardW = Math.min(330, vw * 0.72);
      const railW = 8 * (cardW + 22) + vw * 0.05;
      const weekSpan = Math.max(0, railW - vw + vw * 0.05);
      setSt((prev) =>
        Math.abs(p - prev.p) > 0.002 || Math.abs(scale - prev.scale) > 0.004 || Math.abs(wp - prev.wp) > 0.002 || weekSpan !== prev.weekSpan
          ? { p, scale, wp, weekSpan } : prev);
    };
    // ponytail: compute straight in the handler — two rect reads, and the
    // threshold in setSt already stops needless re-renders. No rAF throttle:
    // rAF is paused whenever the tab isn't painting, which froze the pin.
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    compute();
    return () => { window.removeEventListener("scroll", compute); window.removeEventListener("resize", compute); };
  }, []);

  /* derived (renderVals) */
  const { p, scale, wp, weekSpan } = st;
  const raw = p * 5;
  const active = Math.min(4, Math.floor(raw));
  const local = clamp(raw - active, 0, 1);
  const entryZoom = p < 0.07 ? 1.13 - 0.13 * ease(p / 0.07) : p > 0.94 ? 1 - 0.06 * ease((p - 0.94) / 0.06) : 1;
  const phoneScale = scale * entryZoom;
  const phoneBoxH = Math.round(744 * scale);
  const qIndex = active === 0 ? Math.min(9, 1 + Math.floor(local * 8)) : 9;
  const qPct = Math.round((qIndex / 9) * 100);
  const filled = active < 2 ? 0 : active > 2 ? 21 : Math.round(local * 21);
  const weekX = -Math.round(wp * weekSpan);
  const weekPct = Math.round(wp * 100);
  const pane = (i: number) => ({ o: i === active ? 1 : 0, t: i === active ? "translateY(0px) scale(1)" : i < active ? "translateY(-14px) scale(.985)" : "translateY(14px) scale(.985)" });
  const paneStyle = (i: number): React.CSSProperties => ({ position: "absolute", inset: 0, padding: "8px 20px 20px", opacity: pane(i).o, transform: pane(i).t, transition: "opacity .45s ease, transform .6s cubic-bezier(.2,.8,.2,1)", pointerEvents: "none" });

  const paperCard: React.CSSProperties = { borderRadius: 20, border: "1px solid rgba(26,24,21,.1)" };

  return (
    <div className="sat-landing" style={{ background: PAPER, color: INK, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: "clip" }}>

      {/* ── NAV ─────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "20px 5vw", background: "rgba(250,247,241,.72)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: serif, fontSize: 25, letterSpacing: "-.01em" }}>
          <span style={{ width: 11, height: 11, borderRadius: 999, background: TERRA }} />Sattvic
        </span>
        <div style={{ display: "flex", gap: 34, fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", color: INK2 }} className="sat-nav-links">
          <a href="#stage">How it works</a><a href="#tastes">Six tastes</a><a href="#week">The week</a><a href="#build">The build</a>
        </div>
        <Link href="/dosha?journey=1" className="sat-lift-sm sat-pill-dark" style={{ fontSize: 13, fontWeight: 600, background: INK, color: PAPER, borderRadius: 999, padding: "12px 22px", whiteSpace: "nowrap", transition: "background .45s ease, transform .45s ease" }}>Plan my week</Link>
      </div>

      {/* ── HERO — the long take ─────────────────── */}
      <div style={{ position: "relative", height: "100vh", minHeight: 600, overflow: "hidden", background: "#141110", perspective: 900, perspectiveOrigin: "50% 48%" }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
          {HERO_IMGS.map((pair, gi) => (
            <div key={gi} className="sat-dolly" style={{ position: "absolute", left: "50%", top: "50%", width: 260, height: 330, margin: "-165px 0 0 -130px", transformStyle: "preserve-3d", animation: "sat-dolly 16s linear infinite", animationDelay: `${gi * -5.33}s` }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, overflow: "hidden", transform: "translateX(-330px) rotateY(36deg)", background: "#efe7d8" }}>
                <img decoding="async" width={520} height={660} src={`${IMG}${pair[0]}?auto=format&fit=crop&w=520&q=68`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, overflow: "hidden", transform: "translateX(330px) rotateY(-36deg)", background: "#efe7d8" }}>
                <img decoding="async" width={520} height={660} src={`${IMG}${pair[1]}?auto=format&fit=crop&w=520&q=68`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(72% 62% at 50% 48%, transparent 26%, rgba(20,17,16,.94) 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 6vw", color: PAPER }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(250,247,241,.55)" }}>Ayurveda × modern nutrition</div>
          <div style={{ position: "relative", width: "100%", height: "clamp(120px,17vh,190px)", marginTop: 18 }}>
            {["Monday is decided.", "So is Thursday.", "And Sunday lunch."].map((line, i) => (
              <div key={i} className="sat-hline" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: serif, fontSize: "clamp(40px,6.2vw,96px)", lineHeight: 1, letterSpacing: "-.035em", animation: "sat-line 16s ease-in-out infinite", animationDelay: `${i * -5.33}s` }}>{line}</div>
            ))}
          </div>
          <p style={{ fontSize: 17.5, lineHeight: 1.6, color: "rgba(250,247,241,.72)", margin: "6px 0 0", maxWidth: "42ch" }}>Nine questions tonight. Twenty-one meals by morning.</p>
          <a href="#stage" className="sat-lift" style={{ marginTop: 30, fontSize: 14, fontWeight: 600, background: TERRA, color: "#fff", borderRadius: 999, padding: "17px 34px", whiteSpace: "nowrap", boxShadow: "0 16px 40px rgba(224,67,30,.34)" }}>See how it works</a>
        </div>
        <div className="sat-cue" style={{ position: "absolute", left: 0, right: 0, bottom: 26, display: "flex", justifyContent: "center", fontSize: 10.5, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(250,247,241,.55)", animation: "sat-cue 2.6s ease-in-out infinite" }}>Scroll</div>
      </div>

      {/* ── SPICE MARQUEE ────────────────────────── */}
      <div style={{ background: INK, color: PAPER, padding: "15px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div className="sat-marq-row" style={{ display: "inline-flex", gap: 42, fontSize: 12.5, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", animation: "sat-marq 38s linear infinite", paddingRight: 42 }}>
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "inline-flex", gap: 42 }}>
              <span>Turmeric</span><span style={{ color: AMBER2 }}>●</span><span>Cumin</span><span style={{ color: TERRA }}>●</span><span>Coriander</span><span style={{ color: LIME }}>●</span><span>Tamarind</span><span style={{ color: MAG }}>●</span><span>Fenugreek</span><span style={{ color: BLUE }}>●</span><span>Ghee</span><span style={{ color: AMBER2 }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── PRODUCT STAGE — pinned phone flow ────── */}
      <div id="stage" />
      <div ref={stageRef} style={{ position: "relative", height: "480vh", background: "linear-gradient(180deg,#faf7f1 0%,#fffdf8 22%,#fffdf8 78%,#faf7f1 100%)" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", alignItems: "center", gap: "5vw", padding: "0 5vw", maxWidth: 1500, margin: "0 auto" }} className="sat-stage-grid">

          {/* left — steps */}
          <div style={{ minWidth: 0 }}>
            <div style={kicker()}>How it works</div>
            <div style={{ position: "relative", height: "min(300px,42vh)", marginTop: 18 }}>
              {STEPS.map((s, i) => (
                <div key={s.num} style={{ position: "absolute", inset: 0, opacity: i === active ? 1 : 0, transform: i === active ? "translateY(0px)" : i < active ? "translateY(-22px)" : "translateY(22px)", transition: "opacity .55s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".14em", color: s.color }}>{s.num}</div>
                  <div style={{ fontFamily: serif, fontSize: "clamp(32px,3.4vw,50px)", lineHeight: 1.02, letterSpacing: "-.03em", marginTop: 10, maxWidth: "20ch" }}>{s.title}</div>
                  <p style={{ fontSize: 16, lineHeight: 1.65, color: INK2, margin: "16px 0 0", maxWidth: "36ch" }}>{s.body}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              {STEPS.map((s, i) => (
                <span key={s.num} style={{ height: 3, width: i === active ? 34 : 14, borderRadius: 999, background: i === active ? s.color : "rgba(26,24,21,.16)", transition: "width .5s ease, background .5s ease" }} />
              ))}
            </div>
          </div>

          {/* right — phone */}
          <div style={{ minWidth: 0, display: "flex", justifyContent: "center", alignItems: "center", height: phoneBoxH }}>
            <div style={{ position: "relative", boxSizing: "border-box", flex: "none", width: 360, height: 744, transform: `scale(${phoneScale.toFixed(3)})`, transformOrigin: "center", borderRadius: 46, background: INK, padding: 11, boxShadow: "0 40px 90px rgba(26,24,21,.24)" }}>
              <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, background: SURF, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 10px", fontSize: 11, fontWeight: 600, color: MUTE }}>
                  <span>9:41</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: GREEN }} />Sattvic</span>
                </div>
                <div style={{ flex: 1, position: "relative", minHeight: 0 }}>

                  {/* screen 0 — quiz */}
                  <div style={paneStyle(0)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>Question {qIndex} of 9<span style={{ color: TERRA }}>2 min</span></div>
                    <div style={{ height: 4, borderRadius: 999, background: "rgba(26,24,21,.1)", marginTop: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${qPct}%`, background: TERRA, transition: "width .5s ease" }} /></div>
                    <div style={{ fontFamily: serif, fontSize: 27, lineHeight: 1.12, letterSpacing: "-.02em", marginTop: 24 }}>How&rsquo;s your appetite most days?</div>
                    <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                      <div style={{ border: "1px solid rgba(26,24,21,.12)", borderRadius: 18, padding: "14px 16px", fontSize: 14, color: INK2 }}>Sharp — I get hangry fast</div>
                      <div style={{ border: `1.5px solid ${TERRA}`, background: "rgba(224,67,30,.07)", borderRadius: 18, padding: "14px 16px", fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>Irregular — skips, then big <span style={{ color: TERRA }}>✓</span></div>
                      <div style={{ border: "1px solid rgba(26,24,21,.12)", borderRadius: 18, padding: "14px 16px", fontSize: 14, color: INK2 }}>Steady and slow to build</div>
                    </div>
                    <div style={{ marginTop: 22, fontSize: 12.5, color: MUTE, lineHeight: 1.6 }}>No calorie logging. No food diary. Nine questions, once a season.</div>
                  </div>

                  {/* screen 1 — dosha */}
                  <div style={paneStyle(1)}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>Your reading</div>
                    <div style={{ fontFamily: serif, fontSize: 29, lineHeight: 1.08, letterSpacing: "-.02em", marginTop: 10 }}>Vata-led, pitta second</div>
                    <div style={{ display: "grid", gap: 16, marginTop: 26 }}>
                      {[{ n: "Vata", v: 46, c: BLUE, a: active >= 1 ? 46 : 0, d: 0 }, { n: "Pitta", v: 34, c: TERRA, a: active >= 1 ? 34 : 0, d: 0.1 }, { n: "Kapha", v: 20, c: GREEN, a: active >= 1 ? 20 : 0, d: 0.2 }].map((b) => (
                        <div key={b.n}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600 }}><span>{b.n}</span><span>{b.v}%</span></div>
                          <div style={{ height: 9, borderRadius: 999, background: "rgba(26,24,21,.08)", marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${b.a}%`, borderRadius: 999, background: b.c, transition: `width .9s cubic-bezier(.2,.8,.2,1) ${b.d}s` }} /></div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 24, borderRadius: 20, background: "rgba(45,78,162,.07)", padding: 16, fontSize: 13, lineHeight: 1.6, color: INK2 }}>Warm, moist, grounding food. Cross-checked against 92g protein and 30g fibre a day — tradition and the numbers have to agree.</div>
                  </div>

                  {/* screen 2 — week grid */}
                  <div style={{ ...paneStyle(2), padding: "8px 16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>This week<span style={{ color: GREEN }}>{filled}/21 set</span></div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginTop: 12 }}>
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (<div key={i} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em", color: MUTE }}>{d}</div>))}
                      {Array.from({ length: 21 }).map((_, i) => {
                        const on = i < filled;
                        return <div key={i} style={{ height: 26, borderRadius: 8, background: on ? MEAL_COLORS[i % 7] : "rgba(26,24,21,.06)", opacity: on ? 1 : 0.55, transform: `scale(${on ? 1 : 0.86})`, transition: `opacity .4s ease ${(i % 7) * 22}ms, transform .5s cubic-bezier(.2,.8,.2,1) ${(i % 7) * 22}ms` }} />;
                      })}
                    </div>
                    <div style={{ marginTop: 18, borderRadius: 20, border: "1px solid rgba(26,24,21,.1)", padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>Thursday · late meeting</div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>Upma with peanuts &amp; curry leaf</div>
                      <div style={{ fontSize: 12.5, color: MUTE, marginTop: 4 }}>12 min · uses Wednesday&rsquo;s chana</div>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: "7px 12px", background: "rgba(63,122,46,.1)", color: "#2c5620" }}>One shopping list</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: "7px 12px", background: "rgba(242,178,8,.16)", color: "#6b4c04" }}>Leftovers designed in</span>
                    </div>
                  </div>

                  {/* screen 3 — recipe */}
                  <div style={paneStyle(3)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>Tuesday dinner<span style={{ color: TERRA }}>24 min</span></div>
                    <div style={{ fontFamily: serif, fontSize: 27, lineHeight: 1.1, letterSpacing: "-.02em", marginTop: 10 }}>Methi dal, red rice, cucumber raita</div>
                    <div style={{ display: "grid", gap: 11, marginTop: 20 }}>
                      {[["1", "Rice on. Set a 22-minute timer — everything else fits inside it.", true], ["2", "Toor dal + turmeric in the pressure cooker, 3 whistles.", true], ["3", "Ghee, cumin, garlic, methi leaves. Wilt, then fold the dal in.", true], ["4", "Grate cucumber into yoghurt, salt, roasted cumin.", false]].map(([n, txt, done]) => (
                        <div key={n as string} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <span style={{ flex: "none", width: 22, height: 22, borderRadius: 999, background: done ? INK : "rgba(26,24,21,.12)", color: done ? SURF : INK2, fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center" }}>{n as string}</span>
                          <span style={{ fontSize: 13.5, lineHeight: 1.55, color: done ? INK2 : MUTE }}>{txt as string}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 20, borderRadius: 18, background: "rgba(224,67,30,.07)", padding: "14px 16px", fontSize: 12.5, lineHeight: 1.6, color: INK2 }}>One pan, one board, one pot. Written the way you cook, not the way a magazine writes.</div>
                  </div>

                  {/* screen 4 — balance */}
                  <div style={paneStyle(4)}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>Week in balance</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                      {[["94", "g", "Protein"], ["33", "g", "Fibre"], ["5", "/6", "Tastes"]].map(([v, u, l]) => (
                        <div key={l} style={{ flex: 1, borderRadius: 18, border: "1px solid rgba(26,24,21,.1)", padding: 12 }}>
                          <div style={{ fontFamily: serif, fontSize: 26, lineHeight: 1 }}>{v}<span style={{ fontSize: 14 }}>{u}</span></div>
                          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: MUTE, marginTop: 2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 20, fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>Six tastes this week</div>
                    <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
                      {TASTES.map((t, i) => (
                        <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ flex: "none", width: 9, height: 9, borderRadius: 999, background: t.color }} />
                          <span style={{ flex: "none", width: 74, fontSize: 12, fontWeight: 600 }}>{t.name}</span>
                          <span style={{ flex: 1, height: 7, borderRadius: 999, background: "rgba(26,24,21,.08)", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${active >= 4 ? t.full : 0}%`, borderRadius: 999, background: t.color, transition: `width .8s cubic-bezier(.2,.8,.2,1) ${i * 70}ms` }} /></span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 18, borderRadius: 18, background: "rgba(63,122,46,.09)", padding: "14px 16px", fontSize: 12.5, lineHeight: 1.6, color: "#2c5620" }}>Bitter is short this week. Next week opens with methi and karela — nothing stays missing for long.</div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CASE STUDY ───────────────────────────── */}
      <div id="build" style={{ padding: "13vh 5vw 0", maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "clamp(32px,5vw,80px)", alignItems: "start" }}>
          <div>
            <div data-reveal style={kicker()}>One decision, shown</div>
            <h2 data-reveal data-reveal-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: "clamp(34px,4.6vw,74px)", lineHeight: 0.98, letterSpacing: "-.035em", margin: "16px 0 0", maxWidth: "20ch" }}>Nine questions, not thirty-two.</h2>
          </div>
          <div data-reveal data-reveal-delay="140" style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: "56ch" }}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: INK2, margin: 0 }}>The first prototype asked thirty-two questions, because a proper dosha reading wants them. Eleven of nineteen testers quit before question twenty — and the ones who finished told us the answers felt like homework they&rsquo;d get wrong.</p>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: INK2, margin: 0 }}>So the quiz keeps only the nine questions that changed the output, and the rest is inferred from what you cook and skip. Accuracy of the first plan dropped four points. Completion went from 42% to 91%.</p>
            <div style={{ display: "flex", gap: 34, flexWrap: "wrap", marginTop: 4 }}>
              {[["91%", "finish the quiz", TERRA], ["23min", "median cook", INK], ["78%", "still on plan Friday", INK]].map(([fig, lab, col]) => (
                <div key={lab}>
                  <div style={{ fontFamily: serif, fontSize: 46, lineHeight: 1, color: col }}>{(fig as string).replace("min", "")}{(fig as string).includes("min") && <span style={{ fontSize: 26 }}>min</span>}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase", color: MUTE, marginTop: 4 }}>{lab}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SIX TASTES ───────────────────────────── */}
      <div id="tastes" style={{ padding: "12vh 5vw 0", maxWidth: 1500, margin: "0 auto" }}>
        <div data-reveal style={kicker()}>Six tastes</div>
        <h2 data-reveal data-reveal-delay="80" style={{ fontFamily: serif, fontWeight: 400, fontSize: "clamp(38px,5.4vw,86px)", lineHeight: 0.98, letterSpacing: "-.035em", margin: "16px 0 0", maxWidth: "24ch" }}>Balance isn&rsquo;t a mood. It&rsquo;s an inventory.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginTop: 48 }}>
          {[
            { label: "Sweet", name: "Rice, ghee,\ndates", bg: "linear-gradient(160deg,#ffd15c,#f2a007)", color: INK, delay: "" },
            { label: "Pungent", name: "Chilli, ginger,\nmustard", bg: "linear-gradient(160deg,#ff7f56,#d8341c)", color: "#fff", delay: "70" },
            { label: "Bitter", name: "Methi, karela,\ngreens", bg: "linear-gradient(160deg,#8fd06a,#3f7a2e)", color: "#fff", delay: "140" },
            { label: "Sour", name: "Tamarind, lime,\nyoghurt", bg: "linear-gradient(160deg,#e4467f,#a01351)", color: "#fff", delay: "210" },
            { label: "Astringent", name: "Chana, pomegranate,\nturmeric", bg: "linear-gradient(160deg,#5f80d8,#2d4ea2)", color: "#fff", delay: "280" },
            { label: "Salty", name: "Rock salt, sesame,\npickle", bg: SURF, color: INK, delay: "350", border: true },
          ].map((c) => (
            <div key={c.label} data-reveal data-reveal-delay={c.delay || undefined} className="sat-taste" style={{ background: c.bg, color: c.color, border: c.border ? "1px solid rgba(26,24,21,.1)" : undefined, borderRadius: 28, padding: 26, minHeight: 230, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>{c.label}</span>
              <span style={{ fontFamily: serif, fontSize: 27, lineHeight: 1.16, whiteSpace: "pre-line" }}>{c.name}</span>
            </div>
          ))}
        </div>
        <p data-reveal style={{ margin: "26px 0 0", fontSize: 16.5, lineHeight: 1.7, color: INK2, maxWidth: "62ch" }}>Most plans track one number. Sattvic tracks six tastes alongside the macros — and rebalances whichever one your week is short on.</p>
      </div>

      {/* ── WEEK RAIL — pinned horizontal ─────────── */}
      <div id="week" />
      <div ref={weekRef} style={{ position: "relative", height: "340vh", marginTop: "13vh" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ padding: "0 5vw", maxWidth: 1500, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            <div style={kicker()}>The week</div>
            <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: "clamp(34px,4.4vw,70px)", lineHeight: 0.98, letterSpacing: "-.035em", margin: "12px 0 0" }}>Twenty-one meals. One list.</h2>
          </div>
          <div style={{ marginTop: "clamp(20px,4vh,44px)", overflow: "visible" }}>
            <div style={{ display: "flex", gap: 22, paddingLeft: "5vw", transform: `translate3d(${weekX}px,0,0)`, willChange: "transform" }}>
              {WEEK.map((d) => (
                <div key={d.day} style={{ flex: "none", width: "min(330px,72vw)", borderRadius: 30, background: SURF, border: "1px solid rgba(26,24,21,.09)", padding: "clamp(16px,2.4vh,24px)", boxShadow: "0 18px 44px rgba(26,24,21,.07)" }}>
                  <div style={{ height: "clamp(84px,14vh,150px)", borderRadius: 20, overflow: "hidden", background: "#efe7d8", marginBottom: "clamp(12px,2vh,20px)" }}>
                    <img decoding="async" loading="lazy" width={600} height={400} src={d.img} alt={d.meal} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: MUTE }}>{d.day}</span>
                    <span style={{ width: 12, height: 12, borderRadius: 999, background: d.color }} />
                  </div>
                  <div style={{ fontFamily: serif, fontSize: "clamp(23px,3.4vh,31px)", lineHeight: 1.1, letterSpacing: "-.02em", marginTop: "clamp(12px,2vh,20px)" }}>{d.meal}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "clamp(12px,2vh,18px)" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: "7px 12px", background: "rgba(26,24,21,.06)" }}>{d.time}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: "7px 12px", background: d.tint, color: d.ink }}>{d.taste}</span>
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: INK2, margin: "clamp(12px,2vh,18px) 0 0" }}>{d.note}</p>
                </div>
              ))}
              <div style={{ flex: "none", width: "min(330px,72vw)", borderRadius: 30, background: INK, color: PAPER, padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: MUTE }}>Sunday night</span>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 31, lineHeight: 1.1, letterSpacing: "-.02em" }}>One list, 34 items, two shops.</div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(250,247,241,.7)", margin: "16px 0 0" }}>Grouped by aisle, priced, and it already knows what&rsquo;s in your cupboard.</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 5vw", maxWidth: 1500, margin: "clamp(16px,3vh,34px) auto 0", width: "100%", boxSizing: "border-box" }}>
            <div style={{ height: 3, borderRadius: 999, background: "rgba(26,24,21,.1)", overflow: "hidden", maxWidth: 280 }}>
              <div style={{ height: "100%", width: `${weekPct}%`, borderRadius: 999, background: TERRA }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATEMENT + FULL-BLEED PLATE ─────────── */}
      <div style={{ padding: "14vh 5vw", maxWidth: 1500, margin: "0 auto", display: "flex", justifyContent: "center" }}>
        <div data-swell style={{ maxWidth: "26ch", textAlign: "center", fontFamily: serif, fontSize: "clamp(40px,6.4vw,104px)", lineHeight: 0.98, letterSpacing: "-.035em", willChange: "transform" }}>Twenty-one decisions, <span style={{ fontStyle: "italic", color: TERRA }}>gone.</span></div>
      </div>
      <div style={{ padding: "0 5vw", maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ height: "min(78vh,720px)", borderRadius: 40, overflow: "hidden", background: "#efe7d8", boxShadow: "0 30px 70px rgba(26,24,21,.14)" }}>
          <img data-zoom decoding="async" loading="lazy" width={1400} height={900} src={`${IMG}photo-1734770931927-6410f9a64832?auto=format&fit=crop&w=1400&q=72`} alt="A table laid with many plates of South Asian food" style={{ width: "100%", height: "100%", objectFit: "cover", willChange: "transform" }} />
        </div>
      </div>

      {/* ── CTA (amber panel, no pricing) ────────── */}
      <div style={{ padding: "13vh 5vw 0", maxWidth: 1500, margin: "0 auto" }}>
        <div data-reveal style={{ position: "relative", overflow: "hidden", borderRadius: 44, background: "linear-gradient(140deg,#fff0c9,#ffd15c 48%,#f2a007)", padding: "clamp(38px,5vw,76px)", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
          <div style={{ flex: "1 1 440px", minWidth: 0 }}>
            <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: "clamp(38px,5.2vw,80px)", lineHeight: 0.96, letterSpacing: "-.035em", margin: 0 }}>Dinner stops<br />being a decision.</h2>
            <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: "clamp(20px,2.2vw,29px)", lineHeight: 1.35, margin: "20px 0 0", maxWidth: "26ch", color: "#4a3a15" }}>Two minutes now, and your week is planned before you&rsquo;re hungry.</p>
          </div>
          <div style={{ flex: "0 1 360px", minWidth: 0, background: SURF, borderRadius: 30, padding: 32, boxShadow: "0 26px 60px rgba(120,80,10,.18)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: MUTE }}>What you get</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, margin: "20px 0 0", fontSize: 14.5, color: INK2 }}>
              <span>Weekly plan + shopping list</span><span>Dosha profile, re-read each season</span><span>Macros and six-taste tracking</span><span>Free to use — no calorie shaming</span>
            </div>
            <Link href="/dosha?journey=1" className="sat-lift sat-pill-dark" style={{ display: "block", textAlign: "center", marginTop: 26, fontSize: 14, fontWeight: 600, background: INK, color: PAPER, borderRadius: 999, padding: "17px 20px" }}>Plan my week</Link>
          </div>
        </div>
      </div>

      {/* ── TWO DOORS ────────────────────────────── */}
      <div style={{ padding: "13vh 5vw 0", maxWidth: 1500, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
        <div data-reveal style={{ borderRadius: 34, background: SURF, border: "1px solid rgba(26,24,21,.1)", padding: "clamp(26px,3vw,44px)", display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: MUTE }}>If you came to eat</span>
          <span style={{ fontFamily: serif, fontSize: "clamp(28px,3vw,42px)", lineHeight: 1.04, letterSpacing: "-.03em" }}>Plan this week in two minutes.</span>
          <Link href="/dosha?journey=1" className="sat-lift" style={{ alignSelf: "flex-start", marginTop: 8, fontSize: 14, fontWeight: 600, background: TERRA, color: "#fff", borderRadius: 999, padding: "16px 30px", whiteSpace: "nowrap" }}>Take the quiz</Link>
        </div>
        <div data-reveal data-reveal-delay="90" style={{ borderRadius: 34, background: INK, color: PAPER, padding: "clamp(26px,3vw,44px)", display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(250,247,241,.55)" }}>If you came to hire</span>
          <span style={{ fontFamily: serif, fontSize: "clamp(28px,3vw,42px)", lineHeight: 1.04, letterSpacing: "-.03em" }}>Research, prototypes and the cuts I made.</span>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(250,247,241,.7)", margin: 0 }}>Nineteen testers, four quiz versions, one feature removed the week before launch.</p>
          <a href="#build" className="sat-lift" style={{ alignSelf: "flex-start", marginTop: 4, fontSize: 14, fontWeight: 600, background: PAPER, color: INK, borderRadius: 999, padding: "16px 30px", whiteSpace: "nowrap" }}>Read the case study</a>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between", padding: "9vh 5vw", maxWidth: 1500, margin: "0 auto", fontSize: 12.5, fontWeight: 500, color: MUTE }}>
        <span>Sattvic · Bengaluru</span>
        <div style={{ display: "flex", gap: 26 }}><a href="#stage">Quiz</a><Link href="/recipes">Recipes</Link><Link href="/dashboard">Dashboard</Link><a href="#build">Case study</a></div>
      </div>
    </div>
  );
}
