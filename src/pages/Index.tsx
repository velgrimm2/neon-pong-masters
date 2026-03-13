import { useEffect, useRef } from "react";

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
    iframe.srcdoc = GAME_HTML;
    container.appendChild(iframe);
    return () => { container.removeChild(iframe); };
  }, []);

  return (
    <div ref={containerRef} className="w-screen h-screen bg-background overflow-hidden" />
  );
};

export default Index;

const GAME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Table Tennis</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#1a1a2e;--bg2:#16213e;--surface:rgba(255,255,255,0.06);--surface2:rgba(255,255,255,0.1);
  --text:#e8e8f0;--text2:rgba(232,232,240,0.6);--text3:rgba(232,232,240,0.35);
  --accent:#6c63ff;--accent2:#8b83ff;--accent-glow:rgba(108,99,255,0.3);
  --green:#34d399;--green-bg:rgba(52,211,153,0.12);
  --red:#f87171;--red-bg:rgba(248,113,113,0.12);
  --orange:#fb923c;--orange-bg:rgba(251,146,60,0.12);
  --gold:#fbbf24;--gold-bg:rgba(251,191,36,0.12);
  --cyan:#22d3ee;--cyan-bg:rgba(34,211,238,0.12);
  --purple:#a78bfa;--purple-bg:rgba(167,139,250,0.12);
  --radius:16px;--radius-sm:10px;--radius-full:50px;
  --shadow:0 8px 32px rgba(0,0,0,0.3);--shadow-sm:0 4px 16px rgba(0,0,0,0.2);
  --font:'Plus Jakarta Sans',sans-serif;--font-display:'Outfit',sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:var(--font)}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}

/* Overlay */
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}

/* Screen transitions */
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:20px;max-width:400px;width:92%;opacity:0;transform:translateY(12px) scale(0.97);transition:opacity 0.4s cubic-bezier(0.4,0,0.2,1),transform 0.4s cubic-bezier(0.4,0,0.2,1)}
.screen.active{display:flex;opacity:1;transform:translateY(0) scale(1)}

/* Panel card background */
.panel{background:linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius);padding:28px 24px;box-shadow:var(--shadow);width:100%}

/* Typography */
h1{font-family:var(--font-display);font-size:clamp(28px,7vw,44px);color:var(--text);font-weight:800;margin-bottom:4px;letter-spacing:-0.5px}
.subtitle{font-size:clamp(11px,2.2vw,13px);color:var(--text3);margin-bottom:20px;letter-spacing:4px;text-transform:uppercase;font-weight:700}

/* Buttons */
.btn{background:var(--accent);border:none;color:#fff;padding:14px 36px;font-size:clamp(13px,2.8vw,15px);cursor:pointer;letter-spacing:1.5px;text-transform:uppercase;border-radius:var(--radius-full);margin:5px;font-weight:700;box-shadow:0 4px 20px var(--accent-glow);transition:all 0.25s cubic-bezier(0.4,0,0.2,1);font-family:var(--font);position:relative;overflow:hidden;width:100%;max-width:280px}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px var(--accent-glow);background:var(--accent2)}
.btn:active{transform:translateY(1px) scale(0.98);box-shadow:0 2px 10px var(--accent-glow)}

.btn-secondary{background:var(--surface2);color:var(--text);box-shadow:none}
.btn-secondary:hover{background:rgba(255,255,255,0.15);box-shadow:none;transform:translateY(-1px)}
.btn-secondary:active{background:rgba(255,255,255,0.08);transform:translateY(0)}

.btn-2p{background:var(--cyan);box-shadow:0 4px 20px rgba(34,211,238,0.25)}
.btn-2p:hover{background:#3ee0f0;box-shadow:0 8px 30px rgba(34,211,238,0.35)}

.btn-tournament{background:var(--purple);box-shadow:0 4px 20px rgba(167,139,250,0.25)}
.btn-tournament:hover{background:#b79dff;box-shadow:0 8px 30px rgba(167,139,250,0.35)}

.store-btn{background:linear-gradient(135deg,var(--gold),var(--orange));box-shadow:0 4px 20px rgba(251,191,36,0.25);color:#1a1a2e}
.store-btn:hover{box-shadow:0 8px 30px rgba(251,191,36,0.35)}

/* Mode divider */
.mode-divider{font-size:clamp(10px,1.8vw,12px);color:var(--text3);margin:4px 0;font-weight:700;letter-spacing:3px}

/* Controls hint */
.controls-hint{font-size:clamp(9px,1.7vw,11px);color:var(--text3);margin-top:18px;line-height:1.8;font-weight:600}

/* Difficulty buttons */
.difficulty-row{display:flex;gap:8px;margin:16px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{padding:10px 24px;font-size:clamp(11px,2vw,13px);background:var(--surface);border:2px solid rgba(255,255,255,0.1);color:var(--text2);border-radius:var(--radius-full);box-shadow:none;font-family:var(--font);cursor:pointer;transition:all .2s ease;font-weight:700;width:auto;max-width:none}
.diff-btn:hover{background:var(--surface2);border-color:rgba(255,255,255,0.2);transform:scale(1.05)}
.diff-btn.selected{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 4px 16px var(--accent-glow);transform:scale(1.05)}

/* Winner/Score */
.winner-text{font-family:var(--font-display);font-size:clamp(24px,6vw,40px);color:var(--text);font-weight:800;margin-bottom:14px}
.final-score{font-size:clamp(15px,3.5vw,22px);color:var(--text2);margin-bottom:18px;font-weight:700}

/* Coin display */
.coin-display{display:flex;align-items:center;gap:8px;font-family:var(--font-display);font-size:clamp(16px,3.5vw,22px);color:var(--gold);margin:10px 0}
.coin-icon{font-size:clamp(18px,4vw,24px)}

/* Pause */
#pause-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--font-display);font-size:clamp(28px,6.5vw,48px);color:var(--text);letter-spacing:6px;display:none;z-index:20;text-align:center}
#pause-menu-btn{margin-top:18px;font-family:var(--font);font-size:clamp(13px,2.5vw,16px);padding:12px 32px;border-radius:var(--radius-full);border:none;background:var(--surface2);color:var(--text);cursor:pointer;letter-spacing:2px;font-weight:700;box-shadow:var(--shadow-sm);transition:all 0.2s}
#pause-menu-btn:active{transform:scale(0.95)}
#pause-btn{position:absolute;top:12px;right:12px;z-index:15;width:42px;height:42px;border-radius:50%;background:var(--surface2);border:1px solid rgba(255,255,255,0.1);cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);transition:all 0.2s}
#pause-btn:hover{background:rgba(255,255,255,0.15)}
#pause-btn .bar{width:3px;height:14px;background:var(--text);border-radius:2px;margin:0 2px}

/* Tournament bracket */
.bracket-container{width:100%;max-width:340px;margin:10px auto}
.bracket-round{display:flex;justify-content:space-around;margin:6px 0}
.bracket-match{background:var(--surface);border-radius:var(--radius-sm);padding:8px 12px;min-width:70px;font-size:clamp(9px,1.8vw,11px);font-weight:700;color:var(--text2);border:1.5px solid transparent;transition:all 0.25s}
.bracket-match.current{border-color:var(--accent);background:rgba(108,99,255,0.1);color:var(--accent2)}
.bracket-match.won{border-color:var(--green);background:var(--green-bg);color:var(--green)}
.bracket-match.lost{border-color:var(--red);background:var(--red-bg);color:var(--text3);text-decoration:line-through}
.bracket-match.pending{color:var(--text3)}
.bracket-match .player-name{font-weight:800}
.bracket-match .player-name.you{color:var(--accent2)}
.round-label{font-family:var(--font-display);font-size:clamp(10px,2vw,13px);color:var(--text3);margin:4px 0 2px;letter-spacing:2px}

/* Match intro */
.match-intro-round{font-size:clamp(12px,2.5vw,15px);color:var(--text2);font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
.match-intro-vs{font-family:var(--font-display);font-size:clamp(28px,7vw,44px);color:var(--text);margin:10px 0;font-weight:900}
.match-intro-names{font-size:clamp(14px,3vw,20px);font-weight:800;color:var(--text2);margin:4px 0}

/* Trophy */
.trophy-icon{font-size:clamp(50px,12vw,80px);margin:10px 0}
@keyframes trophy-bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.trophy-anim{animation:trophy-bounce 1s ease-in-out infinite}
.stats-row{display:flex;gap:24px;margin:14px 0;font-size:clamp(12px,2.5vw,15px);font-weight:700;color:var(--text2)}
.stats-row span{display:flex;flex-direction:column;align-items:center;gap:2px}
.stats-row .stat-val{font-family:var(--font-display);font-size:clamp(18px,4vw,28px);color:var(--text)}

/* Confetti */
.confetti-container{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:25}
.confetti{position:absolute;width:8px;height:8px;border-radius:2px}
@keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(360deg);opacity:0}}
.confetti{animation:confetti-fall 2s ease-in forwards}

/* Score animations */
@keyframes score-pop{0%{transform:scale(1)}30%{transform:scale(1.6)}60%{transform:scale(0.9)}100%{transform:scale(1)}}
@keyframes countdown-pop{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes countdown-fade{0%{transform:scale(1);opacity:1}100%{transform:scale(2);opacity:0}}

/* Store */
.store-coin-display{font-family:var(--font-display);font-size:clamp(18px,4vw,24px);color:var(--gold);margin:6px 0;display:flex;align-items:center;justify-content:center;gap:8px}
.store-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:340px;margin:12px auto;max-height:50vh;overflow-y:auto;padding:4px}
.store-grid::-webkit-scrollbar{width:4px}
.store-grid::-webkit-scrollbar-track{background:transparent}
.store-grid::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}

.ability-card{background:var(--surface);border-radius:var(--radius);padding:14px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;border:1.5px solid rgba(255,255,255,0.06);transition:all 0.25s;position:relative}
.ability-card:hover{background:var(--surface2);border-color:rgba(255,255,255,0.12)}
.ability-card.owned{border-color:var(--green);background:var(--green-bg)}
.ability-card.equipped{border-color:var(--accent);background:rgba(108,99,255,0.1);box-shadow:0 0 20px var(--accent-glow)}
.ability-card.locked{opacity:0.45}
.ability-icon{font-size:clamp(26px,5.5vw,34px)}
.ability-name{font-family:var(--font-display);font-size:clamp(10px,2vw,13px);color:var(--text);font-weight:700}
.ability-desc{font-size:clamp(8px,1.6vw,10px);color:var(--text3);line-height:1.4;text-align:center}
.ability-price{display:flex;align-items:center;gap:4px;font-family:var(--font-display);font-size:clamp(11px,2.2vw,14px);color:var(--gold);margin:3px 0}
.ability-status{font-size:clamp(9px,1.8vw,11px);font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px}
.status-owned{color:var(--green);background:var(--green-bg)}
.status-equipped{color:var(--accent2);background:rgba(108,99,255,0.12)}
.ability-btn{font-family:var(--font);font-size:clamp(9px,1.8vw,11px);font-weight:700;padding:6px 16px;border-radius:20px;border:none;cursor:pointer;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s}
.ability-btn.buy{background:var(--gold);color:#1a1a2e;box-shadow:0 2px 10px rgba(251,191,36,0.2)}
.ability-btn.buy:hover{transform:scale(1.05);box-shadow:0 4px 16px rgba(251,191,36,0.3)}
.ability-btn.buy:disabled{opacity:0.35;cursor:not-allowed;transform:none}
.ability-btn.equip{background:var(--accent);color:#fff}
.ability-btn.equip:hover{transform:scale(1.05)}
.ability-btn.unequip{background:var(--surface2);color:var(--text)}
.ability-btn.unequip:hover{transform:scale(1.05)}
.equip-slots{display:flex;gap:10px;margin:10px 0;align-items:center}
.equip-slot{width:44px;height:44px;border-radius:var(--radius-sm);border:2px dashed rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--surface);transition:all 0.2s}
.equip-slot.filled{border-style:solid;border-color:var(--accent);background:rgba(108,99,255,0.08)}
.slots-label{font-size:clamp(10px,2vw,12px);font-weight:700;color:var(--text3);letter-spacing:2px}

/* Coin float animation */
@keyframes coin-float{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-40px) scale(1.2)}}
.coin-float-anim{position:absolute;font-family:var(--font-display);color:var(--gold);animation:coin-float 1.2s ease-out forwards;pointer-events:none;z-index:30;white-space:nowrap}

/* Help screen */
.help-screen{max-height:65vh;overflow-y:auto;width:100%;max-width:360px;padding-right:4px}
.help-screen::-webkit-scrollbar{width:4px}
.help-screen::-webkit-scrollbar-track{background:transparent}
.help-screen::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
.help-section{background:var(--surface);border-radius:var(--radius);padding:14px 16px;margin:8px 0;text-align:left;border:1px solid rgba(255,255,255,0.05)}
.help-section h3{font-family:var(--font-display);font-size:clamp(13px,2.8vw,16px);color:var(--text);margin-bottom:8px;font-weight:700}
.help-section p,.help-section li{font-size:clamp(10px,2vw,12px);color:var(--text2);line-height:1.6;font-weight:600}
.help-section ul{list-style:none;padding:0}
.help-section li{padding:4px 0;display:flex;gap:8px;align-items:flex-start}
.help-section li .emoji{flex-shrink:0;font-size:14px}
.ability-card-help{background:rgba(108,99,255,0.06);border-radius:var(--radius-sm);padding:10px 12px;margin:6px 0;border:1px solid rgba(108,99,255,0.1)}
.ability-card-help .ability-name{font-weight:800;color:var(--accent2);font-size:clamp(11px,2.2vw,13px)}
.ability-card-help .ability-how{font-size:clamp(9px,1.8vw,11px);color:var(--text2);margin-top:3px}

/* Tutorial overlay */
#tutorial-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:50;display:none;align-items:center;justify-content:center;flex-direction:column;padding:16px;overflow-y:auto}
#tutorial-overlay.active{display:flex}
.tut-card{background:linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:var(--radius);padding:24px 20px;max-width:360px;width:92%;max-height:80vh;overflow-y:auto;position:relative;box-shadow:var(--shadow)}
@keyframes tut-fade-in{0%{opacity:0;transform:scale(0.92) translateY(20px)}100%{opacity:1;transform:scale(1) translateY(0)}}
.tut-card{animation:tut-fade-in 0.5s cubic-bezier(0.4,0,0.2,1)}
.tut-title{font-family:var(--font-display);font-size:clamp(20px,5vw,28px);color:var(--text);text-align:center;margin-bottom:4px;font-weight:800}
.tut-sub{font-size:clamp(10px,2vw,12px);color:var(--text3);text-align:center;margin-bottom:16px;font-weight:700;letter-spacing:3px}
.tut-step{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
.tut-step:last-of-type{border-bottom:none}
.tut-step-icon{font-size:clamp(20px,5vw,26px);flex-shrink:0;width:36px;text-align:center}
.tut-step-text{font-size:clamp(11px,2.2vw,13px);color:var(--text2);line-height:1.6;font-weight:600}
.tut-step-text b{color:var(--text)}
.tut-start-btn{font-family:var(--font);font-size:clamp(13px,2.8vw,16px);padding:14px 36px;border-radius:var(--radius-full);border:none;background:var(--accent);color:#fff;cursor:pointer;letter-spacing:2px;font-weight:700;box-shadow:0 4px 20px var(--accent-glow);margin-top:18px;transition:all 0.25s;display:block;margin-left:auto;margin-right:auto;text-transform:uppercase}
.tut-start-btn:active{transform:scale(0.96)}

/* Purchase flash */
@keyframes purchase-flash{0%{opacity:0.6}100%{opacity:0}}
</style>
</head>
<body>
<canvas id="gc"></canvas>
<div id="pause-text">PAUSED<br><button id="pause-menu-btn" onclick="goToMenuFromPause()">MENU</button></div>
<button id="pause-btn" onclick="togglePause()"><span class="bar"></span><span class="bar"></span></button>
<div id="confetti-box" class="confetti-container"></div>
<div id="tutorial-overlay">
  <div class="tut-card">
    <div class="tut-title">🏓 Welcome!</div>
    <div class="tut-sub">QUICK START GUIDE</div>
    <div class="tut-step"><span class="tut-step-icon">👆</span><span class="tut-step-text"><b>Move your paddle</b> by dragging on mobile or moving your mouse on desktop</span></div>
    <div class="tut-step"><span class="tut-step-icon">🏓</span><span class="tut-step-text"><b>Hit the ball</b> past your opponent to score — first to 7 wins!</span></div>
    <div class="tut-step"><span class="tut-step-icon">💨</span><span class="tut-step-text"><b>Swing faster</b> for a faster shot — swipe sideways to add <b>curve spin</b></span></div>
    <div class="tut-step"><span class="tut-step-icon">⚡</span><span class="tut-step-text"><b>Smash shot:</b> Swipe forward fast when hitting. Has a <b>3.5s cooldown</b></span></div>
    <div class="tut-step"><span class="tut-step-icon">🪙</span><span class="tut-step-text">Earn <b>coins</b> by scoring, smashing & rallying. Spend them in the <b>Store</b>!</span></div>
    <div class="tut-step"><span class="tut-step-icon">⏸️</span><span class="tut-step-text">Press <b>P</b> or tap the pause button anytime to pause the game</span></div>
    <button class="tut-start-btn" id="tut-got-it-btn">GOT IT — LET'S PLAY!</button>
  </div>
</div>
<div id="ui-overlay">
  <div class="screen active" id="start-screen">
    <div class="panel">
      <h1>🏓 Ping Pong</h1>
      <div class="subtitle">A R C A D E</div>
      <div class="coin-display" id="menu-coins" style="justify-content:center"><span class="coin-icon">🪙</span><span id="menu-coin-count">0</span></div>
      <button class="btn" id="play-btn">Play</button>
      <button class="btn btn-2p" id="play-2p-btn">2 Player Local</button>
      <button class="btn btn-tournament" id="tournament-btn">🏆 Tournament</button>
      <div style="display:flex;gap:8px;width:100%;max-width:280px;margin:4px auto">
        <button class="btn store-btn" id="store-btn" style="flex:1;padding:12px 0">🛒 Store</button>
        <button class="btn btn-secondary" id="help-btn" style="flex:1;padding:12px 0">❓ Help</button>
      </div>
      <div class="controls-hint">Drag to move paddle · Faster swing = faster ball<br>P2: Arrow keys · P to pause</div>
    </div>
  </div>
  <div class="screen" id="difficulty-screen">
    <div class="panel">
      <h1 style="font-size:clamp(22px,5.5vw,34px)">Select Difficulty</h1>
      <div class="subtitle" id="diff-mode-label">SINGLE PLAYER</div>
      <div class="difficulty-row" style="margin:16px 0">
        <button class="btn diff-btn" data-diff="0">Easy</button>
        <button class="btn diff-btn selected" data-diff="1">Medium</button>
        <button class="btn diff-btn" data-diff="2">Hard</button>
      </div>
      <button class="btn" id="diff-start-btn">Start Game</button>
      <button class="btn btn-secondary" id="diff-back-btn">← Back</button>
    </div>
  </div>
  <div class="screen" id="help-screen">
    <div class="panel" style="padding:20px 16px">
      <h1 style="font-size:clamp(20px,5vw,30px)">How to Play</h1>
      <div class="help-screen">
        <div class="help-section">
          <h3>🎮 Controls</h3>
          <ul>
            <li><span class="emoji">📱</span><span><b>Mobile:</b> Drag to move your paddle in your half</span></li>
            <li><span class="emoji">🖱️</span><span><b>Desktop:</b> Mouse controls. P2 uses Arrow keys</span></li>
            <li><span class="emoji">⏸️</span><span><b>Pause:</b> P key or pause button</span></li>
          </ul>
        </div>
        <div class="help-section">
          <h3>🏓 Scoring</h3>
          <ul>
            <li><span class="emoji">🎯</span><span>Hit the ball past opponent to score</span></li>
            <li><span class="emoji">🏆</span><span>First to 7 points wins</span></li>
            <li><span class="emoji">💨</span><span>Faster swing = faster shot</span></li>
            <li><span class="emoji">↩️</span><span>Swipe sideways for curve spin</span></li>
          </ul>
        </div>
        <div class="help-section">
          <h3>💥 Smash Shots</h3>
          <ul>
            <li><span class="emoji">⚡</span><span>Swipe forward fast for a <b>smash shot</b></span></li>
            <li><span class="emoji">🔥</span><span>Smashes are faster and harder to return</span></li>
            <li><span class="emoji">⏱️</span><span><b>3.5s cooldown</b> — watch the bar indicator</span></li>
          </ul>
        </div>
        <div class="help-section">
          <h3>🪙 Earning Coins</h3>
          <ul>
            <li><span class="emoji">✅</span><span><b>+20</b> per point scored</span></li>
            <li><span class="emoji">💥</span><span><b>+15</b> per smash shot</span></li>
            <li><span class="emoji">🔁</span><span><b>+10</b> every 5-hit rally</span></li>
            <li><span class="emoji">🏆</span><span><b>+50–250</b> tournament progress</span></li>
          </ul>
        </div>
        <div class="help-section">
          <h3>🛒 Abilities</h3>
          <p style="margin-bottom:8px">Buy in Store, equip up to 2:</p>
          <div class="ability-card-help"><div class="ability-name">💥 Power Smash — 500</div><div class="ability-how">+40% smash power with visual effects. 3.5s cooldown.</div></div>
          <div class="ability-card-help"><div class="ability-name">🌀 Curve Boost — 400</div><div class="ability-how">+50% curve spin. Swipe sideways to bend shots.</div></div>
          <div class="ability-card-help"><div class="ability-name">⚡ Speed Boost — 450</div><div class="ability-how">+25% paddle speed. Automatic when equipped.</div></div>
          <div class="ability-card-help"><div class="ability-name">🛡️ Shield Block — 600</div><div class="ability-how">Auto-save one goal per match.</div></div>
          <div class="ability-card-help"><div class="ability-name">🎱 Multi Ball — 800</div><div class="ability-how">15% chance to spawn extra ball on hit.</div></div>
        </div>
      </div>
      <button class="btn btn-secondary" id="help-back-btn" style="margin-top:12px">← Back</button>
    </div>
  </div>
  <div class="screen" id="end-screen">
    <div class="panel">
      <div class="winner-text" id="winner-text"></div>
      <div class="final-score" id="final-score"></div>
      <div class="coin-display" id="end-coins-earned" style="display:none;justify-content:center"><span class="coin-icon">🪙</span> +<span id="end-coin-amount">0</span> earned!</div>
      <button class="btn" id="restart-btn">Play Again</button>
      <button class="btn btn-secondary" id="menu-btn">Menu</button>
    </div>
  </div>
  <div class="screen" id="bracket-screen">
    <div class="panel">
      <h1 style="font-size:clamp(22px,5.5vw,34px)">🏆 Tournament</h1>
      <div class="subtitle" id="bracket-subtitle">QUARTERFINALS</div>
      <div class="bracket-container" id="bracket-container"></div>
      <button class="btn" id="bracket-continue-btn">Next Match</button>
      <button class="btn btn-secondary" id="bracket-menu-btn">← Menu</button>
    </div>
  </div>
  <div class="screen" id="match-intro-screen">
    <div class="panel">
      <div class="match-intro-round" id="match-round-label">QUARTERFINAL</div>
      <div class="match-intro-names" id="match-p1-name">YOU</div>
      <div class="match-intro-vs">VS</div>
      <div class="match-intro-names" id="match-p2-name">OPPONENT</div>
      <button class="btn" id="match-start-btn">Start Match</button>
    </div>
  </div>
  <div class="screen" id="tourney-advance-screen">
    <div class="panel">
      <div class="winner-text">🎉 You Advance!</div>
      <div class="final-score" id="tourney-advance-score"></div>
      <div class="match-intro-round" id="tourney-next-round"></div>
      <div class="coin-display" id="advance-coins-earned" style="display:none;justify-content:center"><span class="coin-icon">🪙</span> +<span id="advance-coin-amount">0</span></div>
      <button class="btn" id="tourney-advance-btn">Continue</button>
    </div>
  </div>
  <div class="screen" id="tourney-win-screen">
    <div class="panel">
      <div class="trophy-icon trophy-anim">🏆</div>
      <div class="winner-text">Champion!</div>
      <div class="final-score" id="tourney-win-score"></div>
      <div class="stats-row" id="tourney-stats" style="justify-content:center"></div>
      <div class="coin-display" id="champ-coins-earned" style="display:none;justify-content:center"><span class="coin-icon">🪙</span> +<span id="champ-coin-amount">0</span></div>
      <button class="btn" id="tourney-replay-btn">Play Again</button>
      <button class="btn btn-secondary" id="tourney-win-menu-btn">Menu</button>
    </div>
  </div>
  <div class="screen" id="tourney-lose-screen">
    <div class="panel">
      <div class="winner-text" style="color:var(--red)">Eliminated</div>
      <div class="final-score" id="tourney-lose-score"></div>
      <div class="match-intro-round" id="tourney-lose-round"></div>
      <div class="coin-display" id="lose-coins-earned" style="display:none;justify-content:center"><span class="coin-icon">🪙</span> +<span id="lose-coin-amount">0</span></div>
      <button class="btn" id="tourney-retry-btn">Retry Tournament</button>
      <button class="btn btn-secondary" id="tourney-lose-menu-btn">Menu</button>
    </div>
  </div>
  <div class="screen" id="store-screen">
    <div class="panel" style="padding:20px 16px">
      <h1 style="font-size:clamp(22px,5.5vw,34px)">🛒 Store</h1>
      <div class="store-coin-display"><span class="coin-icon">🪙</span><span id="store-coin-count">0</span></div>
      <div class="equip-slots" style="justify-content:center"><span class="slots-label">EQUIPPED:</span><div class="equip-slot" id="equip-slot-0"></div><div class="equip-slot" id="equip-slot-1"></div></div>
      <div class="store-grid" id="store-grid"></div>
      <button class="btn btn-secondary" id="store-back-btn">← Back</button>
    </div>
  </div>
</div>

<script>
// ===== AUDIO ENGINE =====
const AudioCtx=window.AudioContext||window.webkitAudioContext;
let actx=null;
function initAudio(){if(!actx){actx=new AudioCtx();masterGain=actx.createGain();masterGain.gain.value=0.6;masterGain.connect(actx.destination)}}
let masterGain=null;
function dst(){return masterGain||actx.destination}

let noiseBuffer=null;
function getNoiseBuffer(){
  if(noiseBuffer)return noiseBuffer;
  if(!actx)return null;
  const len=actx.sampleRate*0.5;
  noiseBuffer=actx.createBuffer(1,len,actx.sampleRate);
  const d=noiseBuffer.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1);
  return noiseBuffer;
}

// Rally intensity factor for audio
let rallyIntensity=0;

// ===== STORE SYSTEM =====
const ABILITIES=[
  {id:'power_smash',name:'Power Smash',desc:'Stronger smash shots (+40% power)',price:500,icon:'💥'},
  {id:'curve_boost',name:'Curve Boost',desc:'Stronger curve shots (+50% spin)',price:400,icon:'🌀'},
  {id:'speed_boost',name:'Speed Boost',desc:'Faster paddle movement (+25%)',price:450,icon:'⚡'},
  {id:'shield_block',name:'Shield Block',desc:'Auto-save one goal per match',price:600,icon:'🛡️'},
  {id:'multi_ball',name:'Multi Ball',desc:'15% chance to spawn extra ball on hit',price:800,icon:'🔮'}
];
const MAX_EQUIP=2;
let storeData={coins:0,owned:[],equipped:[]};
let shieldUsedThisMatch=false;
let matchCoinsEarned=0;
let multiBalls=[];// extra balls for multi-ball ability
let coinAnimations=[];// floating coin text animations

function loadStore(){try{const d=localStorage.getItem('tt_store');if(d){const p=JSON.parse(d);storeData.coins=p.coins||0;storeData.owned=p.owned||[];storeData.equipped=p.equipped||[]}}catch(e){}}
function saveStore(){try{localStorage.setItem('tt_store',JSON.stringify(storeData))}catch(e){}}
function hasAbility(id){return storeData.equipped.includes(id)}
function ownsAbility(id){return storeData.owned.includes(id)}

function earnCoins(amount,reason){
  storeData.coins+=amount;
  matchCoinsEarned+=amount;
  saveStore();
  sndCoinEarn();
}

function buyAbility(id){
  const ab=ABILITIES.find(a=>a.id===id);
  if(!ab||ownsAbility(id)||storeData.coins<ab.price)return false;
  storeData.coins-=ab.price;
  storeData.owned.push(id);
  saveStore();
  sndPurchase();
  return true;
}

function equipAbility(id){
  if(!ownsAbility(id))return;
  if(storeData.equipped.includes(id)){
    storeData.equipped=storeData.equipped.filter(e=>e!==id);
  } else {
    if(storeData.equipped.length>=MAX_EQUIP)storeData.equipped.shift();
    storeData.equipped.push(id);
  }
  saveStore();
}

function renderStore(){
  const grid=document.getElementById('store-grid');
  document.getElementById('store-coin-count').textContent=storeData.coins;
  // Equip slots
  for(let i=0;i<MAX_EQUIP;i++){
    const slot=document.getElementById('equip-slot-'+i);
    if(storeData.equipped[i]){
      const ab=ABILITIES.find(a=>a.id===storeData.equipped[i]);
      slot.textContent=ab?ab.icon:'';
      slot.className='equip-slot filled';
    } else {
      slot.textContent='';
      slot.className='equip-slot';
    }
  }
  let html='';
  ABILITIES.forEach(ab=>{
    const owned=ownsAbility(ab.id);
    const equipped=storeData.equipped.includes(ab.id);
    const canAfford=storeData.coins>=ab.price;
    let cls='ability-card';
    if(equipped)cls+=' equipped';
    else if(owned)cls+=' owned';
    else if(!canAfford)cls+=' locked';
    html+='<div class="'+cls+'">';
    html+='<div class="ability-icon">'+ab.icon+'</div>';
    html+='<div class="ability-name">'+ab.name+'</div>';
    html+='<div class="ability-desc">'+ab.desc+'</div>';
    if(!owned){
      html+='<div class="ability-price"><span class="coin-icon" style="font-size:14px">🪙</span>'+ab.price+'</div>';
      html+='<button class="ability-btn buy" data-buy="'+ab.id+'" '+(canAfford?'':'disabled')+'>BUY</button>';
    } else if(equipped){
      html+='<span class="ability-status status-equipped">EQUIPPED</span>';
      html+='<button class="ability-btn unequip" data-equip="'+ab.id+'">UNEQUIP</button>';
    } else {
      html+='<span class="ability-status status-owned">OWNED</span>';
      html+='<button class="ability-btn equip" data-equip="'+ab.id+'">EQUIP</button>';
    }
    html+='</div>';
  });
  grid.innerHTML=html;
  // Bind buttons
  grid.querySelectorAll('[data-buy]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(buyAbility(btn.dataset.buy))renderStore();
    });
  });
  grid.querySelectorAll('[data-equip]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      equipAbility(btn.dataset.equip);renderStore();
    });
  });
}

function updateMenuCoins(){
  const el=document.getElementById('menu-coin-count');
  if(el)el.textContent=storeData.coins;
}

function showMatchCoins(containerId,amountId){
  const c=document.getElementById(containerId);
  const a=document.getElementById(amountId);
  if(c&&a&&matchCoinsEarned>0){
    c.style.display='flex';
    a.textContent=matchCoinsEarned;
  }
}

function sndPurchase(){
  if(!actx)return;
  const t=actx.currentTime;
  [523,659,784].forEach((f,i)=>{
    const o=actx.createOscillator();o.type='sine';o.frequency.value=f;
    const g=actx.createGain();g.gain.setValueAtTime(0.12,t+i*0.08);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.08+0.2);
    o.connect(g);g.connect(dst());o.start(t+i*0.08);o.stop(t+i*0.08+0.25);
  });
}
function sndCoinEarn(){
  if(!actx)return;
  const t=actx.currentTime;
  const o=actx.createOscillator();o.type='sine';o.frequency.value=1300;
  const g=actx.createGain();g.gain.setValueAtTime(0.06,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.08);
  o.connect(g);g.connect(dst());o.start(t);o.stop(t+0.1);
}



function sndHit(power){
  if(!actx)return;
  const t=actx.currentTime;
  const intensityBoost=1+rallyIntensity*0.4;
  const vol=Math.min(0.6,0.15+power*0.05)*intensityBoost;
  const nb=getNoiseBuffer();if(!nb)return;
  const ns=actx.createBufferSource();ns.buffer=nb;
  const bp=actx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2800+power*200;bp.Q.value=1.5;
  const ng=actx.createGain();ng.gain.setValueAtTime(vol*0.8,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.04);
  ns.connect(bp);bp.connect(ng);ng.connect(dst());ns.start(t);ns.stop(t+0.05);
  const o=actx.createOscillator();o.type='sine';o.frequency.setValueAtTime(280+power*30,t);o.frequency.exponentialRampToValueAtTime(120,t+0.08);
  const g=actx.createGain();g.gain.setValueAtTime(vol*0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
  o.connect(g);g.connect(dst());o.start(t);o.stop(t+0.12);
  const o2=actx.createOscillator();o2.type='triangle';o2.frequency.value=1400+power*100;
  const g2=actx.createGain();g2.gain.setValueAtTime(vol*0.15,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.06);
  o2.connect(g2);g2.connect(dst());o2.start(t);o2.stop(t+0.07);
}

function sndSmash(){
  if(!actx)return;
  const t=actx.currentTime;
  const nb=getNoiseBuffer();if(!nb)return;
  // Louder, deeper smash
  const ns=actx.createBufferSource();ns.buffer=nb;
  const hp=actx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1200;
  const ng=actx.createGain();ng.gain.setValueAtTime(0.65,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.09);
  ns.connect(hp);hp.connect(ng);ng.connect(dst());ns.start(t);ns.stop(t+0.1);
  // Deep sub bass
  const o=actx.createOscillator();o.type='sine';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(35,t+0.2);
  const g=actx.createGain();g.gain.setValueAtTime(0.55,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
  o.connect(g);g.connect(dst());o.start(t);o.stop(t+0.28);
  // Whoosh
  const o2=actx.createOscillator();o2.type='sawtooth';o2.frequency.setValueAtTime(3500,t);o2.frequency.exponentialRampToValueAtTime(300,t+0.15);
  const g2=actx.createGain();g2.gain.setValueAtTime(0.1,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.15);
  o2.connect(g2);g2.connect(dst());o2.start(t);o2.stop(t+0.17);
  // Impact crack
  const o3=actx.createOscillator();o3.type='square';o3.frequency.setValueAtTime(100,t);o3.frequency.exponentialRampToValueAtTime(30,t+0.1);
  const g3=actx.createGain();g3.gain.setValueAtTime(0.2,t);g3.gain.exponentialRampToValueAtTime(0.001,t+0.12);
  o3.connect(g3);g3.connect(dst());o3.start(t);o3.stop(t+0.14);
}

function sndBounce(){
  if(!actx)return;
  const t=actx.currentTime;
  const nb=getNoiseBuffer();if(!nb)return;
  const ns=actx.createBufferSource();ns.buffer=nb;
  const bp=actx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=4000;bp.Q.value=2;
  const ng=actx.createGain();ng.gain.setValueAtTime(0.12,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.02);
  ns.connect(bp);bp.connect(ng);ng.connect(dst());ns.start(t);ns.stop(t+0.03);
  const o=actx.createOscillator();o.type='sine';o.frequency.value=2200;
  const g=actx.createGain();g.gain.setValueAtTime(0.06,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.025);
  o.connect(g);g.connect(dst());o.start(t);o.stop(t+0.03);
}

function sndScore(){
  if(!actx)return;
  const t=actx.currentTime;
  const notes=[880,660];
  notes.forEach((freq,i)=>{
    const o=actx.createOscillator();o.type='sine';o.frequency.value=freq;
    const g=actx.createGain();g.gain.setValueAtTime(0.15,t+i*0.1);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.1+0.2);
    o.connect(g);g.connect(dst());o.start(t+i*0.1);o.stop(t+i*0.1+0.25);
    const o2=actx.createOscillator();o2.type='triangle';o2.frequency.value=freq*2;
    const g2=actx.createGain();g2.gain.setValueAtTime(0.05,t+i*0.1);g2.gain.exponentialRampToValueAtTime(0.001,t+i*0.1+0.15);
    o2.connect(g2);g2.connect(dst());o2.start(t+i*0.1);o2.stop(t+i*0.1+0.18);
  });
}

function sndWin(){
  if(!actx)return;
  const t=actx.currentTime;
  const notes=[523,659,784,1047];
  const durations=[0.15,0.15,0.15,0.35];
  let offset=0;
  notes.forEach((freq,i)=>{
    const o=actx.createOscillator();o.type='sine';o.frequency.value=freq;
    const g=actx.createGain();g.gain.setValueAtTime(0.16,t+offset);g.gain.exponentialRampToValueAtTime(0.001,t+offset+durations[i]+0.1);
    o.connect(g);g.connect(dst());o.start(t+offset);o.stop(t+offset+durations[i]+0.15);
    const o2=actx.createOscillator();o2.type='triangle';o2.frequency.value=freq*2;
    const g2=actx.createGain();g2.gain.setValueAtTime(0.06,t+offset);g2.gain.exponentialRampToValueAtTime(0.001,t+offset+durations[i]);
    o2.connect(g2);g2.connect(dst());o2.start(t+offset);o2.stop(t+offset+durations[i]+0.05);
    if(i===3){
      const o3=actx.createOscillator();o3.type='sine';o3.frequency.value=freq*1.5;
      const g3=actx.createGain();g3.gain.setValueAtTime(0.1,t+offset);g3.gain.exponentialRampToValueAtTime(0.001,t+offset+0.4);
      o3.connect(g3);g3.connect(dst());o3.start(t+offset);o3.stop(t+offset+0.45);
    }
    offset+=durations[i];
  });
}

function sndCountdown(){
  if(!actx)return;
  const t=actx.currentTime;
  const o=actx.createOscillator();o.type='sine';o.frequency.value=660;
  const g=actx.createGain();g.gain.setValueAtTime(0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
  o.connect(g);g.connect(dst());o.start(t);o.stop(t+0.2);
}

function sndCountdownGo(){
  if(!actx)return;
  const t=actx.currentTime;
  const o=actx.createOscillator();o.type='sine';o.frequency.value=1047;
  const g=actx.createGain();g.gain.setValueAtTime(0.18,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
  o.connect(g);g.connect(dst());o.start(t);o.stop(t+0.3);
  const o2=actx.createOscillator();o2.type='triangle';o2.frequency.value=1047*2;
  const g2=actx.createGain();g2.gain.setValueAtTime(0.06,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.2);
  o2.connect(g2);g2.connect(dst());o2.start(t);o2.stop(t+0.25);
}

// ===== CANVAS =====
const canvas=document.getElementById('gc');
const ctx=canvas.getContext('2d');
let W,H,scaleX,scaleY;
const GW=400,GH=600;

function resize(){
  const vw=window.innerWidth,vh=window.innerHeight;
  const ar=GW/GH;
  if(vw/vh>ar){H=vh;W=H*ar}else{W=vw;H=W/ar}
  W=Math.floor(W);H=Math.floor(H);
  canvas.width=W;canvas.height=H;
  scaleX=W/GW;scaleY=H/GH;
}
resize();
window.addEventListener('resize',resize);

// ===== TABLE =====
const TBL_L=40,TBL_R=GW-40,TBL_T=45,TBL_B=GH-45;
const TBL_W=TBL_R-TBL_L,TBL_H=TBL_B-TBL_T;
const NET_Y=(TBL_T+TBL_B)/2;
const TBL_CX=(TBL_L+TBL_R)/2;

// ===== SIZES =====
const PAD_R=34;
const BALL_R=11;

// ===== CONSTANTS =====
const BASE_SPEED=5.5;
const MAX_SPEED=12;
const WINNING_SCORE_1P=11;
const WINNING_SCORE_2P=10;
const SPIN_DECAY=0.985;
const SPIN_CURVE_FORCE=0.16;
const RALLY_SPEED_GAIN=0.06;
const BOUNCE_SPEED_DAMP=0.96;
const ANGLE_JITTER=0.04;
const DIR_SMOOTHING=0.15;
const SMASH_THRESHOLD=7;
const SMASH_SPEED_BOOST=3.5;
const SMASH_COOLDOWN=210; // 3.5 seconds at 60fps

// ===== JUICE STATE =====
let gameMode='1p';
let difficulty=1;
let gameState='menu';
let playerScore=0,opponentScore=0;
let serveSide=1;
let serving=true;
let serveTimer=0;

// Shake
let shakeX=0,shakeY=0,shakeMag=0;
let smashCooldownP1=0,smashCooldownP2=0;
let lastSmashTime=0;

// Slow motion
let slowMoTimer=0;
let slowMoFactor=1;

// Camera zoom
let cameraZoom=1;
let targetZoom=1;

// Countdown
let countdownState=0; // 0=inactive, 3,2,1=counting, -1=GO
let countdownTimer=0;

// Score pop
let scorePop1=0,scorePop2=0; // animation timer for score numbers
let screenPulse=0; // screen pulse on score

// Impact flashes
const impactFlashes=[];

// Speed lines
const speedLines=[];

// Paddle state
let p1Squash=0,p2Squash=0; // squash animation
let p1Glow=0,p2Glow=0; // glow intensity
let p1Recoil=0,p2Recoil=0; // recoil animation
let idleTime=0; // for idle floating

// Ball squash-stretch
let ballSquash=0; // >0 = squashed on hit, decays

// Ball
let ball={x:GW/2,y:0,vx:0,vy:0,speed:BASE_SPEED,active:false,lastHitBy:0,spin:0,bounceHeight:0,bouncePhase:0,rallyHits:0};

const bounceMarks=[];
const trail=[];const MAX_TRAIL=28;
const particles=[];

// Spark particles (brighter, faster)
const sparks=[];

// Player 1 (bottom)
let player={x:GW/2,y:TBL_B+20,prevX:GW/2,prevY:TBL_B+20,vx:0,vy:0};
// Player 2 / AI (top)
let p2={x:GW/2,y:TBL_T-20,prevX:GW/2,prevY:TBL_T-20,vx:0,vy:0,targetX:GW/2,targetY:TBL_T-20};

const AI_PARAMS=[
  {speed:2.5,accuracy:0.55,hitBoost:0.3,missChance:0.12},
  {speed:4.2,accuracy:0.8,hitBoost:0.6,missChance:0.04},
  {speed:6.5,accuracy:0.95,hitBoost:0.9,missChance:0.01}
];

// ===== INPUT =====
let p1InputX=GW/2,p1InputY=TBL_B+20;
let p1RawX=GW/2,p1RawY=TBL_B+20;
let p2InputX=GW/2,p2InputY=TBL_T-20;
let p2RawX=GW/2,p2RawY=TBL_T-20;
let p2Keys={left:false,right:false,up:false,down:false};
let p1TouchId=null,p2TouchId=null;
let p1TouchOffX=0,p1TouchOffY=0,p2TouchOffX=0,p2TouchOffY=0;

function adaptiveLerp(current,target,dt){
  const diff=target-current;
  const absDiff=Math.abs(diff);
  const t=absDiff<2?1:Math.min(1,0.55*dt);
  return current+diff*t;
}

canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  p1InputX=((e.clientX-r.left)/r.width)*GW;
  p1InputY=((e.clientY-r.top)/r.height)*GH;
});
canvas.addEventListener('mousedown',e=>{
  initAudio();
  const r=canvas.getBoundingClientRect();
  p1InputX=((e.clientX-r.left)/r.width)*GW;
  p1InputY=((e.clientY-r.top)/r.height)*GH;
});

canvas.addEventListener('touchstart',e=>{
  e.preventDefault();initAudio();
  const r=canvas.getBoundingClientRect();
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    const gx=((t.clientX-r.left)/r.width)*GW;
    const gy=((t.clientY-r.top)/r.height)*GH;
    if(gameMode==='2p'){
      if(gy<GH/2 && p2TouchId===null){
        p2TouchId=t.identifier;
        p2TouchOffX=p2.x-gx;p2TouchOffY=p2.y-gy;
        p2InputX=p2.x;p2InputY=p2.y;
      } else if(gy>=GH/2 && p1TouchId===null){
        p1TouchId=t.identifier;
        p1TouchOffX=player.x-gx;p1TouchOffY=player.y-gy;
        p1InputX=player.x;p1InputY=player.y;
      }
    } else {
      p1TouchId=t.identifier;
      p1TouchOffX=player.x-gx;p1TouchOffY=player.y-gy;
      p1InputX=player.x;p1InputY=player.y;
    }
  }
},{passive:false});

canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    const gx=((t.clientX-r.left)/r.width)*GW;
    const gy=((t.clientY-r.top)/r.height)*GH;
    if(t.identifier===p1TouchId){p1InputX=gx+p1TouchOffX;p1InputY=gy+p1TouchOffY;p1RawX=gx+p1TouchOffX;p1RawY=gy+p1TouchOffY}
    else if(t.identifier===p2TouchId){p2InputX=gx+p2TouchOffX;p2InputY=gy+p2TouchOffY;p2RawX=gx+p2TouchOffX;p2RawY=gy+p2TouchOffY}
  }
},{passive:false});

canvas.addEventListener('touchend',e=>{
  e.preventDefault();
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    if(t.identifier===p1TouchId){p1TouchId=null;p1TouchOffX=0;p1TouchOffY=0}
    if(t.identifier===p2TouchId){p2TouchId=null;p2TouchOffX=0;p2TouchOffY=0}
  }
},{passive:false});

canvas.addEventListener('touchcancel',e=>{
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    if(t.identifier===p1TouchId){p1TouchId=null;p1TouchOffX=0;p1TouchOffY=0}
    if(t.identifier===p2TouchId){p2TouchId=null;p2TouchOffX=0;p2TouchOffY=0}
  }
});

function togglePause(){
  if(gameState==='playing'){gameState='paused';document.getElementById('pause-text').style.display='block'}
  else if(gameState==='paused'){gameState='playing';document.getElementById('pause-text').style.display='none'}
}
function goToMenuFromPause(){gameState='menu';tournament=null;document.getElementById('pause-text').style.display='none';document.getElementById('pause-btn').style.display='none';showScreen('start-screen');ctx.clearRect(0,0,canvas.width,canvas.height)}

document.addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P')togglePause();
  if(gameMode==='2p'){
    if(e.key==='ArrowLeft')p2Keys.left=true;
    if(e.key==='ArrowRight')p2Keys.right=true;
    if(e.key==='ArrowUp')p2Keys.up=true;
    if(e.key==='ArrowDown')p2Keys.down=true;
  }
});
document.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft')p2Keys.left=false;
  if(e.key==='ArrowRight')p2Keys.right=false;
  if(e.key==='ArrowUp')p2Keys.up=false;
  if(e.key==='ArrowDown')p2Keys.down=false;
});

// ===== PARTICLES =====
function spawnParticles(x,y,color,count,sp){
  const sm=sp||1;
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,s=(Math.random()*2.5+0.8)*sm;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color,size:Math.random()*3+1.5});
  }
}

// Spark burst — bright, fast, directional
function spawnSparks(x,y,color,count,baseAngle,spread){
  for(let i=0;i<count;i++){
    const a=baseAngle+(Math.random()-0.5)*spread;
    const s=Math.random()*5+3;
    sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color,size:Math.random()*2+1});
  }
}

// Impact flash
function addImpactFlash(x,y,radius,color){
  impactFlashes.push({x,y,radius,color,life:1});
}

// Speed lines on smash
function spawnSpeedLines(bx,by,vx,vy,count){
  const angle=Math.atan2(vy,vx);
  for(let i=0;i<count;i++){
    const a=angle+Math.PI+(Math.random()-0.5)*0.6;
    const dist=Math.random()*60+30;
    const ox=bx+Math.cos(a+Math.PI)*dist*(Math.random()*0.5+0.5);
    const oy=by+Math.sin(a+Math.PI)*dist*(Math.random()*0.5+0.5);
    speedLines.push({
      x1:ox,y1:oy,
      x2:ox+Math.cos(a)*40,y2:oy+Math.sin(a)*40,
      life:1,color:'rgba(255,255,200,0.6)'
    });
  }
}

function addBounceMark(x,y){
  bounceMarks.push({x,y,life:1,r:BALL_R});
  sndBounce();
}

// ===== RESET =====
function resetBall(server){
  ball.active=false;
  serving=true;
  serveSide=server;
  serveTimer=0;
  ball.speed=BASE_SPEED;
  ball.vx=0;ball.vy=0;ball.spin=0;
  ball.bounceHeight=0;ball.bouncePhase=0;
  ball.lastHitBy=0;ball.rallyHits=0;
  ballSquash=0;
  if(server===1){
    ball.x=player.x;ball.y=player.y-25;
  } else {
    ball.x=p2.x;ball.y=p2.y+25;
  }
}

function resetGame(){
  playerScore=0;opponentScore=0;
  player.x=GW/2;player.y=TBL_B+20;player.prevX=GW/2;player.prevY=TBL_B+20;player.vx=0;player.vy=0;
  p2.x=GW/2;p2.y=TBL_T-20;p2.prevX=GW/2;p2.prevY=TBL_T-20;p2.vx=0;p2.vy=0;
  p2.targetX=GW/2;p2.targetY=TBL_T-20;
  particles.length=0;trail.length=0;bounceMarks.length=0;sparks.length=0;
  impactFlashes.length=0;speedLines.length=0;
  shakeMag=0;slowMoTimer=0;slowMoFactor=1;
  cameraZoom=1;targetZoom=1;
  p1Squash=0;p2Squash=0;p1Glow=0;p2Glow=0;p1Recoil=0;p2Recoil=0;
  scorePop1=0;scorePop2=0;screenPulse=0;
  rallyIntensity=0;ballSquash=0;idleTime=0;
  p1TouchId=null;p2TouchId=null;
  p2Keys={left:false,right:false,up:false,down:false};
  shieldUsedThisMatch=false;
  matchCoinsEarned=0;
  multiBalls.length=0;
  resetBall(1);
}

// ===== SERVE =====
function doServe(dt){
  serveTimer+=dt*0.016;
  if(serveSide===1){
    ball.x=player.x;ball.y=player.y-25;
    const pSpeed=Math.sqrt(player.vx*player.vx+player.vy*player.vy);
    if(serveTimer>0.6 && pSpeed>1.5){
      serving=false;
      ball.active=true;
      const speedBoost=Math.min(2,pSpeed*0.2);
      ball.speed=Math.min(MAX_SPEED,BASE_SPEED+speedBoost);
      const sideInfluence=player.vx*0.15;
      ball.vx=sideInfluence;
      ball.vy=-(ball.speed);
      const mag=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
      if(mag>0){ball.vx=(ball.vx/mag)*ball.speed;ball.vy=(ball.vy/mag)*ball.speed;}
      ball.spin=player.vx*0.15;
      ball.lastHitBy=1;
      triggerHitEffects(ball.x,ball.y,pSpeed,true,false);
    }
  } else {
    ball.x=p2.x;ball.y=p2.y+25;
    if(gameMode==='2p'){
      const pSpeed=Math.sqrt(p2.vx*p2.vx+p2.vy*p2.vy);
      if(serveTimer>0.6 && pSpeed>1.5){
        serving=false;
        ball.active=true;
        const speedBoost=Math.min(2,pSpeed*0.2);
        ball.speed=Math.min(MAX_SPEED,BASE_SPEED+speedBoost);
        const sideInfluence=p2.vx*0.15;
        ball.vx=sideInfluence;
        ball.vy=ball.speed;
        const mag=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
        if(mag>0){ball.vx=(ball.vx/mag)*ball.speed;ball.vy=(ball.vy/mag)*ball.speed;}
        ball.spin=p2.vx*0.15;
        ball.lastHitBy=-1;
        triggerHitEffects(ball.x,ball.y,pSpeed,false,false);
      }
    } else {
      if(serveTimer>1.0){
        serving=false;
        ball.active=true;
        const p=AI_PARAMS[difficulty];
        ball.speed=Math.min(MAX_SPEED,BASE_SPEED+p.hitBoost);
        ball.vx=(Math.random()-0.5)*0.8;
        ball.vy=ball.speed;
        const mag=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
        if(mag>0){ball.vx=(ball.vx/mag)*ball.speed;ball.vy=(ball.vy/mag)*ball.speed;}
        ball.spin=(Math.random()-0.5)*1.5;
        ball.lastHitBy=-1;
        sndHit(ball.speed);
      }
    }
  }
}

// ===== HIT EFFECTS =====
function triggerHitEffects(x,y,padSpeed,isPlayer,isSmash){
  const isPowerSmash=isSmash&&isPlayer&&hasAbility('power_smash');
  if(isPowerSmash){
    sndSmash();
    shakeMag=Math.min(14,padSpeed*1.3);
    lastSmashTime=performance.now();
    slowMoTimer=12;
    slowMoFactor=0.3;
    targetZoom=1.06;
    addImpactFlash(x,y,50,'rgba(255,255,200,0.9)');
    addImpactFlash(x,y,30,'rgba(255,180,60,0.7)');
    const baseAngle=isPlayer?-Math.PI/2:Math.PI/2;
    spawnSparks(x,y,'#ffff00',20,baseAngle,Math.PI*0.8);
    spawnSparks(x,y,'#ff8800',12,baseAngle,Math.PI*0.6);
    spawnSparks(x,y,'#ffffff',8,baseAngle,Math.PI*0.5);
    const color=isPlayer?'#ff4060':'#00e0e0';
    spawnParticles(x,y,color,15,1.5);
    spawnParticles(x,y,'#ffff00',10,1.2);
    spawnSpeedLines(x,y,ball.vx,ball.vy,10);
    ballSquash=1;
    if(isPlayer){p1Squash=1;p1Glow=1;p1Recoil=1}else{p2Squash=1;p2Glow=1;p2Recoil=1}
  } else {
    sndHit(ball.speed);
    const color=isPlayer?'#e86080':'#2bbfbf';
    const pCount=Math.floor(4+padSpeed*2);
    spawnParticles(x,y,color,pCount,0.5+padSpeed*0.1);
    if(padSpeed>3){
      addImpactFlash(x,y,20+padSpeed*3,'rgba(255,255,255,0.5)');
      spawnSparks(x,y,color,Math.floor(padSpeed*2),isPlayer?-Math.PI/2:Math.PI/2,Math.PI*0.6);
    }
    if(padSpeed>4)shakeMag=Math.min(6,padSpeed*0.6);
    ballSquash=Math.min(1,padSpeed*0.12);
    if(isPlayer){p1Squash=Math.min(1,padSpeed*0.15);if(padSpeed>5)p1Glow=padSpeed*0.1}
    else{p2Squash=Math.min(1,padSpeed*0.15);if(padSpeed>5)p2Glow=padSpeed*0.1}
    if(isPlayer)p1Recoil=Math.min(1,padSpeed*0.1);else p2Recoil=Math.min(1,padSpeed*0.1);
  }
}

// ===== PADDLE HIT =====
function checkPaddleHit(paddle,isPlayer){
  if(isPlayer && ball.vy<0) return false;
  if(!isPlayer && ball.vy>0) return false;

  const dx=ball.x-paddle.x,dy=ball.y-paddle.y;
  const dist=Math.sqrt(dx*dx+dy*dy);
  const hitDist=PAD_R+BALL_R;
  if(dist>hitDist) return false;

  const padSpeed=Math.sqrt(paddle.vx*paddle.vx+paddle.vy*paddle.vy);
  const forwardSpeed=isPlayer?-paddle.vy:paddle.vy;

  const cooldownRef=isPlayer?smashCooldownP1:smashCooldownP2;
  const isSmash=padSpeed>=SMASH_THRESHOLD && forwardSpeed>2 && cooldownRef<=0;

  if(isSmash){
    if(isPlayer)smashCooldownP1=SMASH_COOLDOWN;else smashCooldownP2=SMASH_COOLDOWN;
  }

  ball.rallyHits++;
  rallyIntensity=Math.min(1,ball.rallyHits*0.08);
  const rallyBoost=Math.min(3,ball.rallyHits*RALLY_SPEED_GAIN);
  const speedBoost=Math.min(2,padSpeed*0.15);
  let targetSpeed=BASE_SPEED+speedBoost+rallyBoost;
  let smashBoost=SMASH_SPEED_BOOST;
  if(isSmash&&isPlayer&&hasAbility('power_smash'))smashBoost*=1.4;
  if(isSmash)targetSpeed+=smashBoost;
  ball.speed=Math.min(MAX_SPEED,Math.max(ball.speed,targetSpeed));

  // Coin rewards: smash bonus
  if(isSmash&&isPlayer)earnCoins(15,'Smash!');
  // Rally coin bonus (every 5 rallies)
  if(isPlayer&&ball.rallyHits>0&&ball.rallyHits%5===0)earnCoins(10,'Rally x'+ball.rallyHits);

  // Multi-ball chance
  if(isPlayer&&hasAbility('multi_ball')&&Math.random()<0.15&&multiBalls.length<2){
    multiBalls.push({x:ball.x,y:ball.y,vx:ball.vx*0.8+(Math.random()-0.5)*2,vy:ball.vy*0.9,speed:ball.speed*0.85,life:3,spin:ball.spin*0.5});
    spawnSparks(ball.x,ball.y,'#a855f7',10,isPlayer?-Math.PI/2:Math.PI/2,Math.PI);
  }

  const hitOffsetX=(ball.x-paddle.x)/PAD_R;
  const sideForce=Math.abs(paddle.vx);
  
  const curveMultiplier=(isPlayer&&hasAbility('curve_boost'))?1.5:1;
  let newVX, spinVal;
  if(sideForce<1.0){
    newVX=hitOffsetX*ball.speed*0.04;
    spinVal=0;
  } else if(sideForce<3){
    newVX=paddle.vx*0.10 + hitOffsetX*ball.speed*0.05;
    spinVal=paddle.vx*0.25*curveMultiplier;
  } else if(sideForce<6){
    newVX=paddle.vx*0.20 + hitOffsetX*ball.speed*0.06;
    spinVal=paddle.vx*0.40*curveMultiplier;
  } else {
    newVX=paddle.vx*0.30 + hitOffsetX*ball.speed*0.06;
    spinVal=paddle.vx*0.55*curveMultiplier;
  }
  
  if(isSmash){
    newVX*=0.4;
    spinVal*=0.3;
  }

  newVX+=(Math.random()-0.5)*ball.speed*ANGLE_JITTER;
  const maxVX=ball.speed*(isSmash?0.25:0.5);
  newVX=Math.max(-maxVX,Math.min(maxVX,newVX));
  let newVY=(isPlayer?-1:1)*ball.speed;

  const mag=Math.sqrt(newVX*newVX+newVY*newVY);
  if(mag>0){newVX=(newVX/mag)*ball.speed;newVY=(newVY/mag)*ball.speed;}

  if(isSmash){
    ball.vx=newVX;ball.vy=newVY;
  } else {
    ball.vx=ball.vx*(1-DIR_SMOOTHING)+newVX*DIR_SMOOTHING;
    ball.vy=newVY;
    const mag2=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
    if(mag2>0){ball.vx=(ball.vx/mag2)*ball.speed;ball.vy=(ball.vy/mag2)*ball.speed;}
  }

  ball.spin=spinVal;
  ball.bounceHeight=isSmash?3:8+padSpeed*1.5;
  ball.bouncePhase=0;
  ball.lastHitBy=isPlayer?1:-1;

  if(dist>0&&dist<hitDist){
    const nx=dx/dist,ny=dy/dist;
    const overlap=hitDist-dist+2;
    ball.x+=nx*overlap;
    ball.y+=ny*overlap;
  }

  // Rally zoom
  if(ball.rallyHits>4){
    targetZoom=1+Math.min(0.04,ball.rallyHits*0.005);
  }

  triggerHitEffects(ball.x,ball.y,padSpeed,isPlayer,isSmash);
  return true;
}

// ===== AI =====
function updateAI(dt){
  const p=AI_PARAMS[difficulty];
  let tx=GW/2,ty=TBL_T-20;

  if(ball.active && ball.vy<0){
    const timeToReach=Math.max(0,(p2.y-ball.y)/Math.max(0.5,Math.abs(ball.vy)));
    tx=ball.x+ball.vx*timeToReach;
    tx+=(Math.random()-0.5)*(1-p.accuracy)*80;
    tx=TBL_CX+(tx-TBL_CX)*0.85;
    ty=TBL_T-10+Math.min(30,Math.abs(ball.vy)*2);
    if(Math.random()<p.missChance*0.05){tx+=(Math.random()-0.5)*120}
  } else if(ball.active && ball.vy>0){
    tx=GW/2+(Math.random()-0.5)*30;
    ty=TBL_T-15;
  } else if(!ball.active && serveSide===-1){
    tx=GW/2+(Math.random()-0.5)*40;
    ty=TBL_T-20;
  }

  p2.targetX+=(tx-p2.targetX)*0.08;
  p2.targetY+=(ty-p2.targetY)*0.08;

  const ddx=p2.targetX-p2.x,ddy=p2.targetY-p2.y;
  const dist=Math.sqrt(ddx*ddx+ddy*ddy);
  const spd=p.speed*dt;

  p2.prevX=p2.x;p2.prevY=p2.y;
  if(dist>1){
    p2.x+=Math.sign(ddx)*Math.min(Math.abs(ddx),spd);
    p2.y+=Math.sign(ddy)*Math.min(Math.abs(ddy),spd*0.6);
  }

  p2.x=Math.max(PAD_R,Math.min(GW-PAD_R,p2.x));
  p2.y=Math.max(PAD_R,Math.min(NET_Y-PAD_R-4,p2.y));

  p2.vx=(p2.x-p2.prevX)*p.hitBoost*2;
  p2.vy=(p2.y-p2.prevY)*p.hitBoost*2;
}

function updateP2Human(dt){
  p2.prevX=p2.x;p2.prevY=p2.y;
  const keySpeed=6.5*dt;
  if(p2Keys.left)p2InputX-=keySpeed;
  if(p2Keys.right)p2InputX+=keySpeed;
  if(p2Keys.up)p2InputY-=keySpeed;
  if(p2Keys.down)p2InputY+=keySpeed;
  p2InputX=Math.max(0,Math.min(GW,p2InputX));
  p2InputY=Math.max(0,Math.min(GH,p2InputY));
  p2.x=adaptiveLerp(p2.x,p2InputX,dt);
  p2.y=adaptiveLerp(p2.y,p2InputY,dt);
  p2.x=Math.max(PAD_R,Math.min(GW-PAD_R,p2.x));
  p2.y=Math.max(PAD_R,Math.min(NET_Y-PAD_R-4,p2.y));
  p2.vx=p2.x-p2.prevX;
  p2.vy=p2.y-p2.prevY;
}

// ===== TOURNAMENT =====
const AI_NAMES=['Dragon','Blaze','Shadow','Viper','Thunder','Storm','Phoenix','Hawk','Wolf','Titan','Ace','Fury','Nova','Bolt','Jet','Spike'];
let tournament=null;

function shuffleArray(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

function createTournament(){
  const names=shuffleArray([...AI_NAMES]).slice(0,7);
  const qf=[];
  const opponents=['YOU',names[0],names[1],names[2],names[3],names[4],names[5],names[6]];
  const others=opponents.slice(1);
  shuffleArray(others);
  const seeded=['YOU',...others];
  for(let i=0;i<4;i++){
    qf.push({p1:seeded[i*2],p2:seeded[i*2+1],winner:null,score1:0,score2:0});
  }
  const sf=[{p1:null,p2:null,winner:null,score1:0,score2:0},{p1:null,p2:null,winner:null,score1:0,score2:0}];
  const final_=[{p1:null,p2:null,winner:null,score1:0,score2:0}];
  tournament={bracket:[qf,sf,final_],round:0,matchIdx:-1,stats:{wins:0,totalPoints:0,pointsAgainst:0}};
  for(let i=0;i<4;i++){if(qf[i].p1==='YOU'||qf[i].p2==='YOU'){tournament.matchIdx=i;break}}
}

function getTournamentDifficulty(){return tournament?tournament.round:1}
function getRoundName(round){return['QUARTERFINAL','SEMIFINAL','FINAL'][round]||''}

function getCurrentTourneyMatch(){
  if(!tournament)return null;
  return tournament.bracket[tournament.round][tournament.matchIdx];
}

function getPlayerOpponentName(){
  const m=getCurrentTourneyMatch();
  if(!m)return'???';
  return m.p1==='YOU'?m.p2:m.p1;
}

function simulateAIMatch(p1,p2){
  let s1=0,s2=0;
  while(s1<10&&s2<10||Math.abs(s1-s2)<2){
    if(Math.random()<0.5)s1++;else s2++;
    if(s1>=10&&s2>=10&&Math.abs(s1-s2)>=2)break;
    if((s1>=10||s2>=10)&&Math.abs(s1-s2)>=2)break;
    if(s1>15||s2>15)break;
  }
  return{winner:s1>s2?p1:p2,score1:s1,score2:s2};
}

function advanceTournamentRound(){
  const round=tournament.round;
  const matches=tournament.bracket[round];
  if(round<2){
    const nextMatches=tournament.bracket[round+1];
    for(let i=0;i<matches.length;i+=2){
      const nIdx=Math.floor(i/2);
      nextMatches[nIdx].p1=matches[i].winner;
      nextMatches[nIdx].p2=matches[i+1].winner;
    }
    tournament.round++;
    const nm=tournament.bracket[tournament.round];
    tournament.matchIdx=-1;
    for(let i=0;i<nm.length;i++){if(nm[i].p1==='YOU'||nm[i].p2==='YOU'){tournament.matchIdx=i;break}}
  }
}

function simulateOtherMatches(){
  const matches=tournament.bracket[tournament.round];
  for(let i=0;i<matches.length;i++){
    if(i===tournament.matchIdx)continue;
    if(matches[i].winner)continue;
    const r=simulateAIMatch(matches[i].p1,matches[i].p2);
    matches[i].winner=r.winner;matches[i].score1=r.score1;matches[i].score2=r.score2;
  }
}

function renderBracket(){
  const c=document.getElementById('bracket-container');
  let html='';
  const roundNames=['QUARTERFINALS','SEMIFINALS','FINAL'];
  for(let r=0;r<3;r++){
    html+='<div class="round-label">'+roundNames[r]+'</div><div class="bracket-round">';
    const matches=tournament.bracket[r];
    for(let i=0;i<matches.length;i++){
      const m=matches[i];
      let cls='bracket-match';
      if(r===tournament.round&&i===tournament.matchIdx&&!m.winner)cls+=' current';
      else if(m.winner==='YOU')cls+=' won';
      else if(m.winner&&(m.p1==='YOU'||m.p2==='YOU'))cls+=' lost';
      else if(!m.p1)cls+=' pending';
      const n1=m.p1?(m.p1==='YOU'?'<span class="player-name you">YOU</span>':'<span class="player-name">'+m.p1+'</span>'):'TBD';
      const n2=m.p2?(m.p2==='YOU'?'<span class="player-name you">YOU</span>':'<span class="player-name">'+m.p2+'</span>'):'TBD';
      const score=m.winner?(m.score1+'-'+m.score2):'';
      html+='<div class="'+cls+'">'+n1+' vs '+n2+(score?'<br>'+score:'')+'</div>';
    }
    html+='</div>';
  }
  c.innerHTML=html;
}

function spawnConfetti(){
  const box=document.getElementById('confetti-box');
  box.innerHTML='';
  const colors=['#e86040','#f0c040','#2bbfbf','#9b59b6','#27ae60','#e74c3c','#3498db','#ff6b9d','#ffd700'];
  for(let i=0;i<60;i++){
    const d=document.createElement('div');
    d.className='confetti';
    d.style.left=Math.random()*100+'%';
    d.style.top=Math.random()*30+'%';
    d.style.background=colors[Math.floor(Math.random()*colors.length)];
    d.style.animationDelay=(Math.random()*1.5)+'s';
    d.style.animationDuration=(1.5+Math.random()*1.5)+'s';
    d.style.width=(6+Math.random()*6)+'px';
    d.style.height=(6+Math.random()*6)+'px';
    box.appendChild(d);
  }
  setTimeout(()=>{box.innerHTML=''},4000);
}

function showTournamentBracket(){
  renderBracket();
  document.getElementById('bracket-subtitle').textContent=getRoundName(tournament.round);
  showScreen('bracket-screen');
}

function showMatchIntro(){
  document.getElementById('match-round-label').textContent=getRoundName(tournament.round);
  document.getElementById('match-p1-name').textContent='YOU';
  document.getElementById('match-p2-name').textContent=getPlayerOpponentName();
  showScreen('match-intro-screen');
}

function startTournamentMatch(){
  difficulty=getTournamentDifficulty();
  gameMode='1p';
  resetGame();
  startCountdown();
}

function handleTournamentMatchEnd(playerWon,pScore,oScore){
  const m=getCurrentTourneyMatch();
  if(m.p1==='YOU'){m.score1=pScore;m.score2=oScore;m.winner=playerWon?'YOU':m.p2}
  else{m.score2=pScore;m.score1=oScore;m.winner=playerWon?'YOU':m.p1}
  tournament.stats.totalPoints+=pScore;
  tournament.stats.pointsAgainst+=oScore;

  if(playerWon){
    tournament.stats.wins++;
    simulateOtherMatches();
    if(tournament.round===2){
      document.getElementById('tourney-win-score').textContent=pScore+' - '+oScore;
      document.getElementById('tourney-stats').innerHTML=
        '<span><span class="stat-val">'+tournament.stats.wins+'</span>Wins</span>'+
        '<span><span class="stat-val">'+tournament.stats.totalPoints+'</span>Points</span>'+
        '<span><span class="stat-val">'+tournament.stats.pointsAgainst+'</span>Against</span>';
      showScreen('tourney-win-screen');
      showMatchCoins('champ-coins-earned','champ-coin-amount');
      updateMenuCoins();
      document.getElementById('pause-btn').style.display='none';
      spawnConfetti();sndWin();
    } else {
      document.getElementById('tourney-advance-score').textContent=pScore+' - '+oScore;
      document.getElementById('tourney-next-round').textContent='Next: '+getRoundName(tournament.round+1);
      showScreen('tourney-advance-screen');
      showMatchCoins('advance-coins-earned','advance-coin-amount');
      updateMenuCoins();
      document.getElementById('pause-btn').style.display='none';
      sndWin();
    }
  } else {
    document.getElementById('tourney-lose-score').textContent=pScore+' - '+oScore;
    document.getElementById('tourney-lose-round').textContent='Eliminated in '+getRoundName(tournament.round);
    showScreen('tourney-lose-screen');
    showMatchCoins('lose-coins-earned','lose-coin-amount');
    updateMenuCoins();
    document.getElementById('pause-btn').style.display='none';
    sndScore();
  }
}

// ===== COUNTDOWN =====
function startCountdown(){
  countdownState=3;
  countdownTimer=0;
  gameState='countdown';
  showScreen(null);
  document.getElementById('pause-btn').style.display='flex';
  document.getElementById('pause-text').style.display='none';
}

function updateCountdown(dt){
  countdownTimer+=dt*0.016;
  if(countdownState>0){
    if(countdownTimer>0.8){
      countdownTimer=0;
      countdownState--;
      if(countdownState>0)sndCountdown();
      else{countdownState=-1;sndCountdownGo()}
    }
  } else if(countdownState===-1){
    if(countdownTimer>0.6){
      countdownState=0;
      gameState='playing';
    }
  }
}

function drawCountdown(){
  const sx=scaleX,sy=scaleY;
  ctx.save();
  ctx.setTransform(sx,0,0,sy,0,0);
  // Draw table behind
  drawTable();
  drawPaddle(player.x,player.y,false,0,0,0);
  drawPaddle(p2.x,p2.y,true,0,0,0);
  
  // Countdown text
  let text='';
  let progress=countdownTimer/0.8;
  if(countdownState>0){
    text=countdownState.toString();
  } else if(countdownState===-1){
    text='GO!';
    progress=countdownTimer/0.6;
  }
  
  if(text){
    const scale=progress<0.3?0.3+progress*2.3:1+(1-progress)*0.15;
    const alpha=progress>0.7?1-(progress-0.7)/0.3:1;
    ctx.globalAlpha=alpha;
    ctx.font='900 '+Math.floor(80*scale)+'px Outfit,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=countdownState===-1?'#6c63ff':'#e8e8f0';
    ctx.shadowColor='rgba(0,0,0,0.3)';ctx.shadowBlur=10;
    ctx.fillText(text,GW/2,GH/2);
    ctx.shadowBlur=0;
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

// ===== SCORE =====
function scorePoint(scorer){
  // Shield block ability
  if(scorer===-1&&!shieldUsedThisMatch&&hasAbility('shield_block')){
    shieldUsedThisMatch=true;
    // Block the goal! Flash shield effect
    addImpactFlash(ball.x,GH-20,60,'rgba(100,200,255,0.8)');
    spawnSparks(ball.x,GH-20,'#60c0ff',15,-Math.PI/2,Math.PI*0.8);
    spawnParticles(ball.x,GH-20,'#60c0ff',12,1.5);
    shakeMag=6;
    sndBounce();
    // Bounce ball back
    ball.vy=-Math.abs(ball.vy);
    ball.y=GH-40;
    return;
  }

  if(scorer===1){playerScore++;scorePop1=1;earnCoins(20,'Point!')}else{opponentScore++;scorePop2=1}
  sndScore();
  spawnParticles(ball.x,ball.y,scorer===1?'#d84080':'#20a0a0',15,1.2);
  spawnSparks(ball.x,ball.y,scorer===1?'#ff6090':'#40e0e0',12,scorer===1?-Math.PI/2:Math.PI/2,Math.PI);
  shakeMag=5;
  screenPulse=1;
  rallyIntensity=0;
  targetZoom=1;

  const winScore=gameMode==='2p'?WINNING_SCORE_2P:WINNING_SCORE_1P;
  if((playerScore>=winScore||opponentScore>=winScore)&&Math.abs(playerScore-opponentScore)>=2){
    gameState='ended';
    document.getElementById('pause-btn').style.display='none';

    // Win bonus coins
    if(playerScore>opponentScore){
      let winBonus=50;
      if(tournament){
        winBonus=tournament.round===0?75:tournament.round===1?125:250;
      }
      earnCoins(winBonus,'Victory!');
    }

    if(tournament){
      const playerWon=playerScore>opponentScore;
      handleTournamentMatchEnd(playerWon,playerScore,opponentScore);
      return;
    }

    let winText;
    if(gameMode==='2p'){
      winText=playerScore>opponentScore?'🎉 PLAYER 1 WINS!':'🎉 PLAYER 2 WINS!';
    } else {
      winText=playerScore>opponentScore?'🎉 YOU WIN!':'🤖 AI WINS!';
    }
    document.getElementById('winner-text').textContent=winText;
    document.getElementById('final-score').textContent=playerScore+' - '+opponentScore;
    showScreen('end-screen');
    showMatchCoins('end-coins-earned','end-coin-amount');
    updateMenuCoins();
    if(playerScore>opponentScore)spawnConfetti();
    sndWin();return;
  }

  const total=playerScore+opponentScore;
  serveSide=(total%4<2)?1:-1;
  resetBall(serveSide);
}

// ===== UPDATE =====
function update(dt){
  if(gameState!=='playing')return;

  // Slow motion
  if(slowMoTimer>0){
    slowMoTimer-=1;
    slowMoFactor+=(1-slowMoFactor)*0.08;
    if(slowMoTimer<=0)slowMoFactor=1;
  }
  const sDt=dt*slowMoFactor;

  // Camera zoom smooth
  cameraZoom+=(targetZoom-cameraZoom)*0.06;
  if(Math.abs(cameraZoom-targetZoom)<0.001)cameraZoom=targetZoom;
  // Decay zoom back to 1
  if(targetZoom>1)targetZoom+=(1-targetZoom)*0.02;

  if(smashCooldownP1>0)smashCooldownP1-=sDt;
  if(smashCooldownP2>0)smashCooldownP2-=sDt;

  // Idle time for floating
  idleTime+=sDt*0.02;

  // Decay paddle effects
  p1Squash*=0.85;p2Squash*=0.85;
  p1Glow*=0.92;p2Glow*=0.92;
  p1Recoil*=0.88;p2Recoil*=0.88;
  ballSquash*=0.88;

  // Score pop decay
  scorePop1*=0.9;scorePop2*=0.9;
  screenPulse*=0.92;

  // Player 1 movement (speed boost ability)
  const speedMult=hasAbility('speed_boost')?1.25:1;
  player.prevX=player.x;player.prevY=player.y;
  player.x=adaptiveLerp(player.x,p1InputX,sDt*speedMult);
  player.y=adaptiveLerp(player.y,p1InputY,sDt*speedMult);
  player.x=Math.max(PAD_R,Math.min(GW-PAD_R,player.x));
  player.y=Math.max(NET_Y+PAD_R+4,Math.min(GH-PAD_R,player.y));
  player.vx=player.x-player.prevX;
  player.vy=player.y-player.prevY;

  // Update multi-balls
  for(let i=multiBalls.length-1;i>=0;i--){
    const mb=multiBalls[i];
    mb.x+=mb.vx*sDt;mb.y+=mb.vy*sDt;mb.life-=0.01*sDt;
    if(mb.x<TBL_L+5||mb.x>TBL_R-5)mb.vx*=-0.7;
    if(mb.y<-30||mb.y>GH+30||mb.life<=0){
      if(mb.y<-30)spawnParticles(mb.x,TBL_T,'#a855f7',6,0.8);
      multiBalls.splice(i,1);
    }
  }

  if(gameMode==='2p'){updateP2Human(sDt)}else{updateAI(sDt)}

  if(serving){doServe(sDt);return}

  // Spin curve
  if(Math.abs(ball.spin)>0.005){
    const spinAbs=Math.abs(ball.spin);
    const curvePower=SPIN_CURVE_FORCE * (1 + spinAbs * 0.3);
    const curveForce=ball.spin*curvePower*sDt;
    ball.vx+=curveForce;
    ball.spin*=Math.pow(SPIN_DECAY,sDt);
    if(Math.abs(ball.spin)<0.005)ball.spin=0;
    const maxCurveVX=ball.speed*0.55;
    ball.vx=Math.max(-maxCurveVX,Math.min(maxCurveVX,ball.vx));
    const mag=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
    if(mag>0){ball.vx=(ball.vx/mag)*ball.speed;ball.vy=(ball.vy/mag)*ball.speed;}
  }

  // Move ball
  const steps=ball.speed>7?2:1;
  const subDt=sDt/steps;
  for(let s=0;s<steps;s++){
    ball.x+=ball.vx*subDt;
    ball.y+=ball.vy*subDt;
  }
  
  // Bounce arc
  if(ball.bounceHeight>0.5){
    ball.bouncePhase+=sDt*0.18;
    ball.bounceHeight*=0.985;
  }

  // Trail
  trail.push({x:ball.x,y:ball.y,life:1,speed:ball.speed,spin:ball.spin});
  if(trail.length>MAX_TRAIL)trail.shift();

  // Side boundaries
  if(ball.x-BALL_R<TBL_L){
    ball.x=TBL_L+BALL_R+1;
    ball.vx=Math.abs(ball.vx)*0.7;
    ball.speed*=BOUNCE_SPEED_DAMP;
    ball.spin*=-0.5;
    ball.vy+=(Math.random()-0.5)*ball.speed*ANGLE_JITTER*2;
    const m=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
    if(m>0){ball.vx=(ball.vx/m)*ball.speed;ball.vy=(ball.vy/m)*ball.speed;}
    sndBounce();
    addBounceMark(TBL_L,ball.y);
    spawnParticles(TBL_L,ball.y,'rgba(255,255,255,0.5)',4,0.5);
  }
  if(ball.x+BALL_R>TBL_R){
    ball.x=TBL_R-BALL_R-1;
    ball.vx=-Math.abs(ball.vx)*0.7;
    ball.speed*=BOUNCE_SPEED_DAMP;
    ball.spin*=-0.5;
    ball.vy+=(Math.random()-0.5)*ball.speed*ANGLE_JITTER*2;
    const m=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
    if(m>0){ball.vx=(ball.vx/m)*ball.speed;ball.vy=(ball.vy/m)*ball.speed;}
    sndBounce();
    addBounceMark(TBL_R,ball.y);
    spawnParticles(TBL_R,ball.y,'rgba(255,255,255,0.5)',4,0.5);
  }

  // Paddle collisions
  if(ball.vy>0 && ball.y>NET_Y) checkPaddleHit(player,true);
  if(ball.vy<0 && ball.y<NET_Y) checkPaddleHit(p2,false);

  // Ball past top/bottom — score
  if(ball.y<-30){
    addBounceMark(ball.x,TBL_T);
    scorePoint(1);return;
  }
  if(ball.y>GH+30){
    addBounceMark(ball.x,TBL_B);
    scorePoint(-1);return;
  }

  // Shake decay
  if(shakeMag>0){
    shakeX=(Math.random()-0.5)*shakeMag;
    shakeY=(Math.random()-0.5)*shakeMag;
    shakeMag*=0.82;if(shakeMag<0.2)shakeMag=0;
  } else {shakeX=0;shakeY=0}

  // Particles update
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx*sDt;p.y+=p.vy*sDt;p.life-=0.03*sDt;
    if(p.life<=0)particles.splice(i,1);
  }
  // Sparks update (faster decay)
  for(let i=sparks.length-1;i>=0;i--){
    const s=sparks[i];s.x+=s.vx*sDt;s.y+=s.vy*sDt;s.vx*=0.95;s.vy*=0.95;s.life-=0.05*sDt;
    if(s.life<=0)sparks.splice(i,1);
  }
  // Impact flashes
  for(let i=impactFlashes.length-1;i>=0;i--){
    impactFlashes[i].life-=0.08*sDt;
    if(impactFlashes[i].life<=0)impactFlashes.splice(i,1);
  }
  // Speed lines
  for(let i=speedLines.length-1;i>=0;i--){
    speedLines[i].life-=0.06*sDt;
    if(speedLines[i].life<=0)speedLines.splice(i,1);
  }

  for(const t of trail)t.life-=0.06*sDt;

  for(let i=bounceMarks.length-1;i>=0;i--){
    bounceMarks[i].life-=0.02*sDt;
    bounceMarks[i].r+=0.3*sDt;
    if(bounceMarks[i].life<=0)bounceMarks.splice(i,1);
  }
}

// ===== DRAW =====
function drawTable(){
  // Background
  ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,GW,GH);

  // Table shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath();ctx.roundRect(TBL_L-2+3,TBL_T-2+4,TBL_W+4,TBL_H+4,6);ctx.fill();

  // Table border
  ctx.fillStyle='#2a2a4a';
  ctx.beginPath();ctx.roundRect(TBL_L-8,TBL_T-8,TBL_W+16,TBL_H+16,6);ctx.fill();

  // Table surface
  ctx.fillStyle='#1e3a5f';
  ctx.beginPath();ctx.roundRect(TBL_L,TBL_T,TBL_W,TBL_H,2);ctx.fill();

  // Center line
  ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(GW/2,TBL_T);ctx.lineTo(GW/2,TBL_B);ctx.stroke();

  // Bounce marks
  for(const bm of bounceMarks){
    ctx.globalAlpha=bm.life*0.4;
    ctx.strokeStyle='rgba(108,99,255,0.6)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(bm.x,bm.y,bm.r,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // Net
  ctx.fillStyle='rgba(255,255,255,0.8)';
  ctx.shadowColor='rgba(0,0,0,0.3)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
  ctx.fillRect(TBL_L-8,NET_Y-3,TBL_W+16,6);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
}

function draw(){
  const sx=scaleX,sy=scaleY;
  ctx.save();
  
  // Apply camera zoom centered
  const zoomOffX=GW/2*(1-cameraZoom);
  const zoomOffY=GH/2*(1-cameraZoom);
  ctx.setTransform(sx*cameraZoom,0,0,sy*cameraZoom,(shakeX*sx+zoomOffX*sx),(shakeY*sy+zoomOffY*sy));

  drawTable();

  // Screen pulse overlay
  if(screenPulse>0.01){
    ctx.fillStyle='rgba(255,255,255,'+screenPulse*0.15+')';
    ctx.fillRect(0,0,GW,GH);
  }

  // Scores on table with pop animation
  const s1Scale=1+scorePop1*0.4;
  const s2Scale=1+scorePop2*0.4;
  
  ctx.textAlign='center';ctx.textBaseline='middle';
  
  ctx.save();
  ctx.translate(GW/2,(TBL_T+NET_Y)/2);
  ctx.scale(s2Scale,s2Scale);
  ctx.font='800 60px Outfit,sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.2)';
  ctx.fillText(opponentScore,0,0);
  ctx.restore();
  
  ctx.save();
  ctx.translate(GW/2,(NET_Y+TBL_B)/2);
  ctx.scale(s1Scale,s1Scale);
  ctx.font='800 60px Outfit,sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.2)';
  ctx.fillText(playerScore,0,0);
  ctx.restore();

  // Player labels in 2P mode
  if(gameMode==='2p'){
    ctx.font='700 11px Plus Jakarta Sans,sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillStyle='rgba(108,99,255,0.6)';
    ctx.fillText('PLAYER 1',GW/2,GH-8);
    ctx.fillStyle='rgba(34,211,238,0.6)';
    ctx.fillText('PLAYER 2',GW/2,18);
  }

  // Coin HUD
  ctx.font='800 14px Outfit,sans-serif';ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillStyle='rgba(251,191,36,0.7)';
  ctx.fillText('🪙 '+storeData.coins,8,6);

  // Equipped ability icons
  if(storeData.equipped.length>0){
    ctx.font='14px sans-serif';ctx.textAlign='right';ctx.textBaseline='top';
    const eqText=storeData.equipped.map(id=>{const a=ABILITIES.find(ab=>ab.id===id);return a?a.icon:''}).join(' ');
    ctx.fillText(eqText,GW-8,6);
  }

  // Shield indicator
  if(hasAbility('shield_block')&&!shieldUsedThisMatch){
    ctx.font='600 10px Plus Jakarta Sans,sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillStyle='rgba(96,192,255,0.6)';
    ctx.fillText('🛡️ SHIELD READY',GW/2,GH-4);
  }

  // Multi-balls rendering
  for(const mb of multiBalls){
    ctx.globalAlpha=mb.life*0.7;
    ctx.fillStyle='#a855f7';
    ctx.beginPath();ctx.arc(mb.x,mb.y,BALL_R*0.8,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=mb.life*0.3;
    ctx.fillStyle='#d8b4fe';
    ctx.beginPath();ctx.arc(mb.x-2,mb.y-2,BALL_R*0.4,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Serve indicator
  if(serving){
    ctx.font='600 12px Plus Jakarta Sans,sans-serif';ctx.fillStyle='rgba(255,255,255,0.4)';ctx.textBaseline='alphabetic';ctx.textAlign='center';
    if(serveSide===1){
      ctx.fillText('MOVE TO SERVE',GW/2,TBL_B+22);
    } else {
      if(gameMode==='2p') ctx.fillText('P2 MOVE TO SERVE',GW/2,TBL_T-16);
      else ctx.fillText('AI SERVING...',GW/2,TBL_T-16);
    }
  }

  // Speed lines
  for(const sl of speedLines){
    ctx.globalAlpha=sl.life*0.6;
    ctx.strokeStyle=sl.color;
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(sl.x1,sl.y1);ctx.lineTo(sl.x2,sl.y2);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // Trail
  if(trail.length>1){
    for(let i=1;i<trail.length;i++){
      const t=trail[i];if(t.life<=0)continue;
      const prev=trail[i-1];
      const speedNorm=Math.min(t.speed,MAX_SPEED)/MAX_SPEED;
      const alpha=t.life*0.3*(0.3+speedNorm*0.7);
      ctx.globalAlpha=alpha;
      const spinShift=(t.spin||0)*2;
      const midX=(prev.x+t.x)/2+spinShift;
      const midY=(prev.y+t.y)/2;
      // Trail color shifts with speed
      const r=Math.floor(255-speedNorm*55);
      const g=Math.floor(255-speedNorm*155);
      const b=Math.floor(255-speedNorm*200);
      ctx.strokeStyle='rgb('+r+','+g+','+b+')';
      ctx.lineWidth=BALL_R*t.life*(0.5+speedNorm*0.6);
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.quadraticCurveTo(midX,midY,t.x,t.y);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;

  // Ball
  const bounceScale=ball.bounceHeight>0.5 ? 1+Math.abs(Math.sin(ball.bouncePhase))*ball.bounceHeight*0.015 : 1;
  
  // Ball squash-stretch
  const speedNorm=ball.active?Math.min(ball.speed/MAX_SPEED,1):0;
  const moveAngle=Math.atan2(ball.vy,ball.vx);
  const stretchX=1+speedNorm*0.15-ballSquash*0.3;
  const stretchY=1-speedNorm*0.1+ballSquash*0.2;
  const visualR=BALL_R*bounceScale;
  
  // Ball shadow
  const shadowSpread=1+Math.abs(Math.sin(ball.bouncePhase||0))*(ball.bounceHeight||0)*0.02;
  ctx.fillStyle='rgba(0,0,0,0.15)';
  ctx.beginPath();ctx.ellipse(ball.x+3,ball.y+4,visualR*shadowSpread,visualR*0.4*shadowSpread,0,0,Math.PI*2);ctx.fill();

  // Ball with squash-stretch
  ctx.save();
  ctx.translate(ball.x,ball.y);
  if(ball.active)ctx.rotate(moveAngle);
  ctx.scale(stretchX,stretchY);

  // Motion blur effect at high speed
  if(speedNorm>0.6){
    const blurAlpha=(speedNorm-0.6)*0.4;
    ctx.globalAlpha=blurAlpha;
    ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.beginPath();ctx.ellipse(-visualR*0.3,0,visualR*1.3,visualR*0.8,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }

  const bg=ctx.createRadialGradient(-2,-2,1,0,0,visualR);
  bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#e0e0e0');
  ctx.fillStyle=bg;
  ctx.beginPath();ctx.arc(0,0,visualR,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(0,0,visualR,0,Math.PI*2);ctx.stroke();
  ctx.restore();

  // Impact flashes
  for(const f of impactFlashes){
    ctx.globalAlpha=f.life*0.8;
    const r=f.radius*(1+(1-f.life)*0.5);
    const ig=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
    ig.addColorStop(0,f.color);
    ig.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=ig;
    ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Paddles
  const p1Float=Math.sin(idleTime*2)*1.5;
  const p2Float=Math.sin(idleTime*2+Math.PI)*1.5;
  drawPaddle(player.x,player.y+p1Float,false,p1Squash,p1Glow,p1Recoil);
  drawPaddle(p2.x,p2.y+p2Float,true,p2Squash,p2Glow,p2Recoil);

  // Particles
  for(const p of particles){
    ctx.globalAlpha=p.life*0.7;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  }
  
  // Sparks (brighter, with tail)
  for(const s of sparks){
    ctx.globalAlpha=s.life;
    ctx.strokeStyle=s.color;
    ctx.lineWidth=s.size;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(s.x,s.y);
    ctx.lineTo(s.x-s.vx*2,s.y-s.vy*2);
    ctx.stroke();
    // Bright center
    ctx.fillStyle='#fff';
    ctx.globalAlpha=s.life*0.6;
    ctx.beginPath();ctx.arc(s.x,s.y,s.size*0.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Smash flash overlay
  const smashAge=performance.now()-lastSmashTime;
  if(smashAge<200){
    const flashAlpha=(1-smashAge/200)*0.35;
    ctx.fillStyle='rgba(255,255,200,'+flashAlpha+')';
    ctx.fillRect(0,0,GW,GH);
  }

  // Smash trail — thicker/brighter when recent smash
  if(smashAge<500 && trail.length>1){
    for(let i=1;i<trail.length;i++){
      const t=trail[i];if(t.life<=0)continue;
      const prev=trail[i-1];
      const alpha=t.life*0.5*(1-smashAge/500);
      ctx.globalAlpha=alpha;
      ctx.strokeStyle='rgba(255,240,100,0.6)';
      ctx.lineWidth=BALL_R*t.life*1.4;
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(t.x,t.y);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  // Rally intensity indicator — subtle vignette glow when rally is hot
  if(rallyIntensity>0.3){
    const ri=rallyIntensity-0.3;
    const vg=ctx.createRadialGradient(GW/2,GH/2,GW*0.3,GW/2,GH/2,GW*0.8);
    vg.addColorStop(0,'rgba(255,100,50,0)');
    vg.addColorStop(1,'rgba(255,60,20,'+ri*0.12+')');
    ctx.fillStyle=vg;
    ctx.fillRect(0,0,GW,GH);
  }

  // ===== SMASH COOLDOWN INDICATOR =====
  if(hasAbility('power_smash')&&gameState==='playing'){
    const cdRatio=smashCooldownP1/SMASH_COOLDOWN;
    const barW=60,barH=6;
    const bx=player.x-barW/2;
    const by=player.y+PAD_R+12;
    if(cdRatio>0){
      // Background
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.beginPath();ctx.roundRect(bx,by,barW,barH,3);ctx.fill();
      // Fill (draining)
      const fillW=barW*(1-cdRatio);
      const grad=ctx.createLinearGradient(bx,by,bx+barW,by);
      grad.addColorStop(0,'#ff8800');grad.addColorStop(1,'#ffcc00');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.roundRect(bx,by,fillW,barH,3);ctx.fill();
      // Border
      ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(bx,by,barW,barH,3);ctx.stroke();
    } else {
      // Ready indicator
      ctx.fillStyle='rgba(255,200,0,0.15)';
      ctx.beginPath();ctx.roundRect(bx,by,barW,barH,3);ctx.fill();
      ctx.fillStyle='#ffcc00';
      ctx.beginPath();ctx.roundRect(bx,by,barW,barH,3);ctx.fill();
      // Pulse glow
      const pulse=0.4+Math.sin(performance.now()*0.006)*0.3;
      ctx.shadowColor='#ffcc00';ctx.shadowBlur=8*pulse;
      ctx.fillStyle='rgba(255,204,0,'+pulse+')';
      ctx.beginPath();ctx.roundRect(bx,by,barW,barH,3);ctx.fill();
      ctx.shadowBlur=0;
      // "READY" text
      ctx.fillStyle='rgba(0,0,0,0.8)';ctx.font='bold 5px Arial';ctx.textAlign='center';
      ctx.fillText('SMASH',player.x,by+5);
    }
  }

  ctx.restore();
}

function drawPaddle(x,y,isTop,squash,glow,recoil){
  const faceColor=isTop?'#22d3ee':'#a78bfa';
  const darkColor=isTop?'#0ea5c0':'#7c5fd6';
  const handleAngle=isTop?Math.PI*0.75:Math.PI*1.75;
  
  // Recoil offset
  const recoilDir=isTop?1:-1;
  const ry=y+recoil*6*recoilDir;
  
  // Squash scale
  const scX=1+squash*0.15;
  const scY=1-squash*0.1;
  
  ctx.save();
  ctx.translate(x,ry);
  ctx.scale(scX,scY);
  
  // Glow effect
  if(glow>0.05){
    ctx.globalAlpha=glow*0.4;
    const gg=ctx.createRadialGradient(0,0,PAD_R*0.5,0,0,PAD_R*2);
    gg.addColorStop(0,faceColor);
    gg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gg;
    ctx.beginPath();ctx.arc(0,0,PAD_R*2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
  
  const hLen=20,hWid=7;
  const hx=Math.cos(handleAngle)*PAD_R*0.7;
  const hy=Math.sin(handleAngle)*PAD_R*0.7;
  const hx2=Math.cos(handleAngle)*(PAD_R*0.7+hLen);
  const hy2=Math.sin(handleAngle)*(PAD_R*0.7+hLen);
  
  ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=hWid+2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(hx+1,hy+2);ctx.lineTo(hx2+1,hy2+2);ctx.stroke();
  
  ctx.strokeStyle='#6d4530';ctx.lineWidth=hWid;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx2,hy2);ctx.stroke();
  ctx.strokeStyle='#8b5e3c';ctx.lineWidth=hWid-2;
  ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx2,hy2);ctx.stroke();

  ctx.fillStyle='rgba(0,0,0,0.12)';
  ctx.beginPath();ctx.arc(2,2,PAD_R,0,Math.PI*2);ctx.fill();

  const g=ctx.createRadialGradient(-PAD_R*0.3,-PAD_R*0.3,2,0,0,PAD_R);
  g.addColorStop(0,faceColor);g.addColorStop(1,darkColor);
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(0,0,PAD_R,0,Math.PI*2);ctx.fill();

  ctx.strokeStyle=darkColor;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,PAD_R,0,Math.PI*2);ctx.stroke();

  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.beginPath();ctx.arc(-PAD_R*0.25,-PAD_R*0.25,PAD_R*0.5,0,Math.PI*2);ctx.fill();
  
  ctx.restore();
}

// ===== UI =====
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.remove('active');
    s.style.opacity='0';
    s.style.transform='translateY(12px) scale(0.97)';
  });
  if(id){
    const el=document.getElementById(id);
    el.classList.add('active');
    requestAnimationFrame(()=>{
      el.style.opacity='1';
      el.style.transform='translateY(0) scale(1)';
    });
  }
}
function goToMenu(){tournament=null;updateMenuCoins();showScreen('start-screen');gameState='menu';document.getElementById('pause-btn').style.display='none';ctx.clearRect(0,0,canvas.width,canvas.height)}

let pendingMode='1p';
document.getElementById('play-btn').addEventListener('click',()=>{pendingMode='1p';document.getElementById('diff-mode-label').textContent='SINGLE PLAYER';showScreen('difficulty-screen')});
document.getElementById('play-2p-btn').addEventListener('click',()=>{pendingMode='2p';document.getElementById('diff-mode-label').textContent='2 PLAYER LOCAL';showScreen('difficulty-screen')});
document.getElementById('diff-back-btn').addEventListener('click',()=>{showScreen('start-screen')});
let tutorialPendingStart=false;
function isFirstTime(){return !localStorage.getItem('tt_tutorial_done')}
function markTutorialDone(){localStorage.setItem('tt_tutorial_done','1')}
function showTutorial(){const el=document.getElementById('tutorial-overlay');el.classList.add('active');el.style.display='flex'}
function hideTutorial(){const el=document.getElementById('tutorial-overlay');el.classList.remove('active');el.style.display='none'}
document.getElementById('tut-got-it-btn').addEventListener('click',()=>{markTutorialDone();hideTutorial();resetGame();startCountdown()});
document.getElementById('diff-start-btn').addEventListener('click',()=>{initAudio();tournament=null;gameMode=pendingMode;if(isFirstTime()){showScreen('');showTutorial()}else{resetGame();startCountdown()}});
document.querySelectorAll('.diff-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');difficulty=parseInt(btn.dataset.diff);
  });
});

document.getElementById('restart-btn').addEventListener('click',()=>{initAudio();if(tournament){startTournamentMatch()}else{resetGame();startCountdown()}});
document.getElementById('menu-btn').addEventListener('click',goToMenu);

document.getElementById('store-btn').addEventListener('click',()=>{initAudio();renderStore();showScreen('store-screen')});
document.getElementById('store-back-btn').addEventListener('click',()=>{updateMenuCoins();showScreen('start-screen')});
document.getElementById('help-btn').addEventListener('click',()=>{showScreen('help-screen')});
document.getElementById('help-back-btn').addEventListener('click',()=>{showScreen('start-screen')});

document.getElementById('tournament-btn').addEventListener('click',()=>{
  initAudio();createTournament();showTournamentBracket();
});
document.getElementById('bracket-continue-btn').addEventListener('click',()=>{showMatchIntro()});
document.getElementById('bracket-menu-btn').addEventListener('click',goToMenu);
document.getElementById('match-start-btn').addEventListener('click',()=>{startTournamentMatch()});
document.getElementById('tourney-advance-btn').addEventListener('click',()=>{
  advanceTournamentRound();showTournamentBracket();
});
document.getElementById('tourney-replay-btn').addEventListener('click',()=>{
  createTournament();showTournamentBracket();
});
document.getElementById('tourney-win-menu-btn').addEventListener('click',goToMenu);
document.getElementById('tourney-retry-btn').addEventListener('click',()=>{
  createTournament();showTournamentBracket();
});
document.getElementById('tourney-lose-menu-btn').addEventListener('click',goToMenu);

// Init menu coins display
updateMenuCoins();

// ===== LOOP =====
let lastTime=0;
function loop(time){
  const dt=Math.min((time-lastTime)/16.67,3);lastTime=time;
  if(gameState==='countdown'){updateCountdown(dt);drawCountdown()}
  else if(gameState==='playing'){update(dt);draw()}
  else if(gameState==='paused'){draw()}
  requestAnimationFrame(loop);
}
requestAnimationFrame(t=>{lastTime=t;requestAnimationFrame(loop)});
<\/script>
</body>
</html>`;
