// The closed-shop backdrop: twinkling stars, a floating moon, drifting clouds, a warm glow where
// the sun will come up, and now and then a shooting star. Pure CSS, so it costs nothing to run and
// stops by itself for visitors who asked their device for less motion (see globals.css).
// Star positions are worked out from the index, so the server and the browser draw the same sky.

const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 61.803) % 100,
  y: (i * 38.197 * 1.7) % 74,
  size: 1 + (i % 4 === 0 ? 1.5 : i % 3 === 0 ? 0.8 : 0),
  d: 2.4 + (i % 6) * 0.65,
  delay: (i % 9) * 0.55,
}));

export default function NightSky({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* sky, deepest at the top */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#080b18_0%,#111833_48%,#251a2f_82%,#3b2022_100%)]" />
      {/* the glow of the coming morning */}
      <div className="kg-dawn absolute -bottom-1/3 left-1/2 h-2/3 w-[140%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(closest-side,rgba(214,62,10,0.55),rgba(214,62,10,0.12)_60%,transparent)]" />

      {STARS.map((s, i) => (
        <span key={i} className="kg-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, ["--d" as string]: `${s.d}s`, ["--delay" as string]: `${s.delay}s` }} />
      ))}
      <span className="kg-shooting" style={{ left: "78%", top: "12%" }} />

      <div className="kg-cloud" style={{ top: "22%", width: compact ? 150 : 260, height: compact ? 36 : 54, ["--d" as string]: "80s", ["--delay" as string]: "-20s" }} />
      <div className="kg-cloud" style={{ top: "52%", width: compact ? 200 : 340, height: compact ? 44 : 66, ["--d" as string]: "110s", ["--delay" as string]: "-70s", background: "rgba(214, 120, 90, 0.10)" }} />

      {/* the moon */}
      <div className={`kg-moon absolute ${compact ? "right-6 top-6 h-14 w-14" : "right-[10%] top-[12%] h-24 w-24 sm:h-28 sm:w-28"}`}>
        <div className="kg-moon-glow absolute -inset-8 rounded-full bg-[radial-gradient(closest-side,rgba(255,236,179,0.5),transparent)]" />
        <svg viewBox="0 0 100 100" className="relative h-full w-full drop-shadow-[0_0_14px_rgba(255,236,179,0.55)]">
          <defs>
            <radialGradient id="kg-moon-fill" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#fff8dc" />
              <stop offset="100%" stopColor="#f3d98b" />
            </radialGradient>
          </defs>
          <path d="M66 10a42 42 0 1 0 24 62A34 34 0 0 1 66 10z" fill="url(#kg-moon-fill)" />
          <circle cx="42" cy="58" r="4" fill="#e6c870" opacity=".55" />
          <circle cx="52" cy="76" r="2.6" fill="#e6c870" opacity=".5" />
          <circle cx="32" cy="40" r="2.2" fill="#e6c870" opacity=".45" />
        </svg>
      </div>

      {/* a quiet skyline along the bottom */}
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full text-[#0a0d1a] sm:h-24">
        <path fill="currentColor" d="M0 120V74h60V54h44v20h40V36h56v38h50V60h70v14h46V44h64v30h56V58h60v16h48V30h52v44h54V62h66v12h52V48h58v26h64V56h48v18h60V40h54v34h56V64h60v10h50V50h48v24h60v46z" />
      </svg>
    </div>
  );
}
