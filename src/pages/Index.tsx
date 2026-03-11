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
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f0c040;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'Nunito',sans-serif}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:24px}
.screen.active{display:flex}
h1{font-family:'Fredoka One',cursive;font-size:clamp(32px,8vw,52px);color:#5a3a1a;text-shadow:2px 2px 0 rgba(255,255,255,0.4);margin-bottom:4px}
.subtitle{font-size:clamp(11px,2.2vw,14px);color:rgba(90,58,26,0.5);margin-bottom:20px;letter-spacing:3px;text-transform:uppercase;font-weight:700}
.btn{background:#e86040;border:none;color:#fff;padding:13px 44px;font-size:clamp(13px,2.8vw,17px);cursor:pointer;letter-spacing:2px;text-transform:uppercase;border-radius:50px;margin:6px;font-weight:800;box-shadow:0 4px 15px rgba(232,96,64,0.3);transition:all .2s ease;font-family:inherit}
.btn:hover,.btn:active{transform:translateY(-2px);box-shadow:0 6px 22px rgba(232,96,64,0.4);background:#d04030}
.btn-secondary{background:rgba(90,58,26,0.12);color:#5a3a1a;box-shadow:0 4px 12px rgba(0,0,0,0.06)}
.btn-secondary:hover,.btn-secondary:active{background:rgba(90,58,26,0.2)}
.btn-2p{background:#2bbfbf;box-shadow:0 4px 15px rgba(43,191,191,0.3)}
.btn-2p:hover,.btn-2p:active{background:#209e9e;box-shadow:0 6px 22px rgba(43,191,191,0.4)}
.difficulty-row{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{padding:9px 22px;font-size:clamp(10px,1.9vw,13px);background:rgba(232,96,64,0.1);border:2px solid rgba(232,96,64,0.3);color:rgba(90,58,26,0.6);border-radius:50px;box-shadow:none;font-family:inherit;cursor:pointer}
.diff-btn:hover{background:rgba(232,96,64,0.2);box-shadow:none}
.diff-btn.selected{background:#e86040;border-color:#e86040;color:#fff;box-shadow:0 3px 12px rgba(232,96,64,0.3)}
.winner-text{font-family:'Fredoka One',cursive;font-size:clamp(26px,6.5vw,44px);color:#5a3a1a;text-shadow:2px 2px 0 rgba(255,255,255,0.4);margin-bottom:18px}
.final-score{font-size:clamp(16px,4vw,24px);color:rgba(90,58,26,0.5);margin-bottom:20px;font-weight:700}
.controls-hint{font-size:clamp(9px,1.7vw,11px);color:rgba(90,58,26,0.35);margin-top:16px;line-height:1.7;font-weight:600}
.mode-divider{font-size:clamp(11px,2vw,14px);color:rgba(90,58,26,0.3);margin:8px 0;font-weight:800;letter-spacing:4px}
#pause-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Fredoka One',cursive;font-size:clamp(28px,6.5vw,50px);color:rgba(90,58,26,0.5);letter-spacing:8px;display:none;z-index:20;text-shadow:2px 2px 0 rgba(255,255,255,0.3);text-align:center}
#pause-menu-btn{margin-top:18px;font-family:'Fredoka One',cursive;font-size:clamp(14px,3vw,20px);padding:10px 32px;border-radius:14px;border:3px solid #c07828;background:linear-gradient(135deg,#f0c060,#e8a040);color:#5a3a1a;cursor:pointer;letter-spacing:2px;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.15s}
#pause-menu-btn:active{transform:scale(0.95)}
#pause-btn{position:absolute;top:10px;right:10px;z-index:15;width:40px;height:40px;border-radius:50%;background:#e8a040;border:3px solid #c07828;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
#pause-btn .bar{width:4px;height:16px;background:#6d3a0a;border-radius:2px;margin:0 2px}
</style>
</head>
<body>
<canvas id="gc"></canvas>
<div id="pause-text">PAUSED<br><button id="pause-menu-btn" onclick="goToMenuFromPause()">MENU</button></div>
<button id="pause-btn" onclick="togglePause()"><span class="bar"></span><span class="bar"></span></button>
<div id="ui-overlay">
  <div class="screen active" id="start-screen">
    <h1>🏓 TABLE TENNIS</h1>
    <div class="subtitle">R E A L I S T I C</div>
    <div class="difficulty-row">
      <button class="btn diff-btn" data-diff="0">Easy</button>
      <button class="btn diff-btn selected" data-diff="1">Medium</button>
      <button class="btn diff-btn" data-diff="2">Hard</button>
    </div>
    <button class="btn" id="play-btn">SINGLE PLAYER</button>
    <div class="mode-divider">— OR —</div>
    <button class="btn btn-2p" id="play-2p-btn">2 PLAYER LOCAL</button>
    <div class="controls-hint">Move paddle to hit &middot; Faster swing = faster ball<br>P2: Arrow keys on desktop &middot; P to pause</div>
  </div>
  <div class="screen" id="end-screen">
    <div class="winner-text" id="winner-text"></div>
    <div class="final-score" id="final-score"></div>
    <button class="btn" id="restart-btn">PLAY AGAIN</button>
    <button class="btn btn-secondary" id="menu-btn">MENU</button>
  </div>
</div>

<script>
// ===== AUDIO =====
const AudioCtx=window.AudioContext||window.webkitAudioContext;
let actx=null;
function initAudio(){if(!actx)actx=new AudioCtx()}
function playTone(freq,dur,type,vol){
  if(!actx)return;
  const o=actx.createOscillator(),g=actx.createGain();
  o.type=type||'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(vol||0.05,actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+dur);
  o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+dur);
}
function sndHit(power){const v=Math.min(0.08,0.02+power*0.008);playTone(400+power*50,0.06,'sine',v);if(power>5)playTone(600+power*30,0.04,'triangle',v*0.5)}
function sndSmash(){playTone(250,0.12,'sawtooth',0.10);playTone(500,0.08,'square',0.06);setTimeout(()=>playTone(180,0.1,'triangle',0.05),30)}
function sndBounce(){playTone(900,0.025,'sine',0.05)}
function sndNet(){playTone(150,0.08,'sine',0.03);playTone(120,0.12,'sine',0.02)}
function sndScore(){playTone(700,0.12,'sine',0.06);setTimeout(()=>playTone(900,0.12,'sine',0.04),80)}
function sndWin(){playTone(523,0.18,'sine',0.06);setTimeout(()=>playTone(659,0.18,'sine',0.06),120);setTimeout(()=>playTone(784,0.25,'sine',0.06),240)}

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
const TBL_L=40,TBL_R=GW-40,TBL_T=100,TBL_B=GH-100;
const TBL_W=TBL_R-TBL_L,TBL_H=TBL_B-TBL_T;
const NET_Y=(TBL_T+TBL_B)/2;
const TBL_CX=(TBL_L+TBL_R)/2;

// ===== SIZES =====
const PAD_R=34;
const BALL_R=11;

// ===== CONSTANTS =====
const BASE_SPEED=5.5;
const MAX_SPEED=11;
const WINNING_SCORE_1P=11;
const WINNING_SCORE_2P=10;
const SPIN_DECAY=0.985; // slower decay = longer curve
const SPIN_CURVE_FORCE=0.16; // stronger lateral pull
const RALLY_SPEED_GAIN=0.06; // speed increase per hit during rally
const BOUNCE_SPEED_DAMP=0.96; // slow down slightly on table/wall bounce
const ANGLE_JITTER=0.04; // small random angle offset on bounce
const DIR_SMOOTHING=0.15; // smooth direction blend factor
const SMASH_THRESHOLD=7; // paddle speed to trigger smash
const SMASH_SPEED_BOOST=3.5; // extra speed on smash
const SMASH_COOLDOWN=90; // frames (~1.5s at 60fps)

// ===== STATE =====
let gameMode='1p'; // '1p' or '2p'
let difficulty=1;
let gameState='menu';
let playerScore=0,opponentScore=0;
let serveSide=1;
let serving=true;
let serveTimer=0;

// Shake
let shakeX=0,shakeY=0,shakeMag=0;
let smashCooldownP1=0,smashCooldownP2=0;
let lastSmashTime=0; // for visual flash

// Ball
let ball={x:GW/2,y:0,vx:0,vy:0,speed:BASE_SPEED,active:false,lastHitBy:0,spin:0,bounceHeight:0,bouncePhase:0,rallyHits:0};

// Bounce markers
const bounceMarks=[];

// Trail
const trail=[];const MAX_TRAIL=20;

// Particles
const particles=[];

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
// Player 1 input (mouse or bottom-half touch)
let p1InputX=GW/2,p1InputY=TBL_B+20;
// Player 2 input (top-half touch)
let p2InputX=GW/2,p2InputY=TBL_T-20;
// P2 arrow key state
let p2Keys={left:false,right:false,up:false,down:false};
// Touch tracking
let p1TouchId=null,p2TouchId=null;

// Mouse → always controls P1
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

// Multi-touch
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();initAudio();
  const r=canvas.getBoundingClientRect();
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    const gx=((t.clientX-r.left)/r.width)*GW;
    const gy=((t.clientY-r.top)/r.height)*GH;
    if(gameMode==='2p'){
      if(gy<GH/2 && p2TouchId===null){
        p2TouchId=t.identifier;p2InputX=gx;p2InputY=gy;
      } else if(gy>=GH/2 && p1TouchId===null){
        p1TouchId=t.identifier;p1InputX=gx;p1InputY=gy;
      }
    } else {
      p1TouchId=t.identifier;p1InputX=gx;p1InputY=gy;
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
    if(t.identifier===p1TouchId){p1InputX=gx;p1InputY=gy}
    else if(t.identifier===p2TouchId){p2InputX=gx;p2InputY=gy}
  }
},{passive:false});

canvas.addEventListener('touchend',e=>{
  e.preventDefault();
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    if(t.identifier===p1TouchId)p1TouchId=null;
    if(t.identifier===p2TouchId)p2TouchId=null;
  }
},{passive:false});

canvas.addEventListener('touchcancel',e=>{
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    if(t.identifier===p1TouchId)p1TouchId=null;
    if(t.identifier===p2TouchId)p2TouchId=null;
  }
});

function togglePause(){
  if(gameState==='playing'){gameState='paused';document.getElementById('pause-text').style.display='block'}
  else if(gameState==='paused'){gameState='playing';document.getElementById('pause-text').style.display='none'}
}
function goToMenuFromPause(){gameState='menu';document.getElementById('pause-text').style.display='none';document.getElementById('pause-btn').style.display='none';showScreen('start-screen')}

// Keyboard: P to pause, Arrow keys for P2 in 2P mode
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

// ===== BOUNCE MARK =====
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
  particles.length=0;trail.length=0;bounceMarks.length=0;shakeMag=0;
  p1TouchId=null;p2TouchId=null;
  p2Keys={left:false,right:false,up:false,down:false};
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
      sndHit(ball.speed);
      spawnParticles(ball.x,ball.y,'#66bb6a',6,0.6);
    }
  } else {
    ball.x=p2.x;ball.y=p2.y+25;
    if(gameMode==='2p'){
      // P2 human serve — same logic, needs movement
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
        sndHit(ball.speed);
        spawnParticles(ball.x,ball.y,'#66bb6a',6,0.6);
      }
    } else {
      // AI serve
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

// ===== PADDLE HIT (circle vs circle) =====
function checkPaddleHit(paddle,isPlayer){
  // Directional guard: only check if ball moving toward paddle
  if(isPlayer && ball.vy<0) return false;
  if(!isPlayer && ball.vy>0) return false;

  const dx=ball.x-paddle.x,dy=ball.y-paddle.y;
  const dist=Math.sqrt(dx*dx+dy*dy);
  const hitDist=PAD_R+BALL_R;
  if(dist>hitDist) return false;

  const padSpeed=Math.sqrt(paddle.vx*paddle.vx+paddle.vy*paddle.vy);
  const forwardSpeed=isPlayer?-paddle.vy:paddle.vy; // how fast toward opponent

  // Detect SMASH
  const cooldownRef=isPlayer?smashCooldownP1:smashCooldownP2;
  const isSmash=padSpeed>=SMASH_THRESHOLD && forwardSpeed>2 && cooldownRef<=0;

  if(isSmash){
    if(isPlayer)smashCooldownP1=SMASH_COOLDOWN;else smashCooldownP2=SMASH_COOLDOWN;
  }

  // Rally speed increase, capped
  ball.rallyHits++;
  const rallyBoost=Math.min(3,ball.rallyHits*RALLY_SPEED_GAIN);
  const speedBoost=Math.min(2,padSpeed*0.15);
  let targetSpeed=BASE_SPEED+speedBoost+rallyBoost;
  if(isSmash)targetSpeed+=SMASH_SPEED_BOOST;
  ball.speed=Math.min(MAX_SPEED,Math.max(ball.speed,targetSpeed));

  // Hit offset for angle control
  const hitOffsetX=(ball.x-paddle.x)/PAD_R;
  const sideForce=Math.abs(paddle.vx);
  
  let newVX, spinVal;
  if(sideForce<1.0){
    // Dead-straight shot
    newVX=hitOffsetX*ball.speed*0.04;
    spinVal=0;
  } else if(sideForce<3){
    // Light curve
    const sideMultiplier=0.10;
    newVX=paddle.vx*sideMultiplier + hitOffsetX*ball.speed*0.05;
    spinVal=paddle.vx*0.25;
  } else if(sideForce<6){
    // Medium curve
    const sideMultiplier=0.20;
    newVX=paddle.vx*sideMultiplier + hitOffsetX*ball.speed*0.06;
    spinVal=paddle.vx*0.40;
  } else {
    // Heavy curve — strong swipe
    const sideMultiplier=0.30;
    newVX=paddle.vx*sideMultiplier + hitOffsetX*ball.speed*0.06;
    spinVal=paddle.vx*0.55;
  }
  
  // Smash: sharper forward angle (less side deviation)
  if(isSmash){
    newVX*=0.4; // flatten angle — ball goes more straight
    spinVal*=0.3;
  }

  // Add small jitter for variety
  newVX+=(Math.random()-0.5)*ball.speed*ANGLE_JITTER;

  const maxVX=ball.speed*(isSmash?0.25:0.5);
  newVX=Math.max(-maxVX,Math.min(maxVX,newVX));
  let newVY=(isPlayer?-1:1)*ball.speed;

  // Normalize to exact speed
  const mag=Math.sqrt(newVX*newVX+newVY*newVY);
  if(mag>0){newVX=(newVX/mag)*ball.speed;newVY=(newVY/mag)*ball.speed;}

  // Smooth direction blend (skip smoothing on smash for instant snap)
  if(isSmash){
    ball.vx=newVX;ball.vy=newVY;
  } else {
    ball.vx=ball.vx*(1-DIR_SMOOTHING)+newVX*DIR_SMOOTHING;
    ball.vy=newVY;
    const mag2=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
    if(mag2>0){ball.vx=(ball.vx/mag2)*ball.speed;ball.vy=(ball.vy/mag2)*ball.speed;}
  }

  ball.spin=spinVal;
  ball.bounceHeight=isSmash?3:8+padSpeed*1.5; // smash = low arc
  ball.bouncePhase=0;
  ball.lastHitBy=isPlayer?1:-1;

  // Push ball fully outside paddle to prevent sticking
  if(dist>0&&dist<hitDist){
    const nx=dx/dist,ny=dy/dist;
    const overlap=hitDist-dist+2;
    ball.x+=nx*overlap;
    ball.y+=ny*overlap;
  }

  // Effects
  if(isSmash){
    sndSmash();
    shakeMag=Math.min(10,padSpeed*1.0);
    lastSmashTime=performance.now();
    const color=isPlayer?'#ff4060':'#00e0e0';
    spawnParticles(ball.x,ball.y,color,15,1.5);
    spawnParticles(ball.x,ball.y,'#ffff00',8,1.0);
  } else {
    sndHit(ball.speed);
    const color=isPlayer?'#e86080':'#2bbfbf';
    spawnParticles(ball.x,ball.y,color,Math.floor(4+padSpeed*2),0.5+padSpeed*0.1);
    if(padSpeed>4)shakeMag=Math.min(6,padSpeed*0.6);
  }

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

// ===== P2 HUMAN =====
function updateP2Human(dt){
  p2.prevX=p2.x;p2.prevY=p2.y;

  // Arrow keys (desktop)
  const keySpeed=5*dt;
  if(p2Keys.left)p2InputX-=keySpeed;
  if(p2Keys.right)p2InputX+=keySpeed;
  if(p2Keys.up)p2InputY-=keySpeed;
  if(p2Keys.down)p2InputY+=keySpeed;
  p2InputX=Math.max(0,Math.min(GW,p2InputX));
  p2InputY=Math.max(0,Math.min(GH,p2InputY));

  // Smooth interpolation
  p2.x+=(p2InputX-p2.x)*0.28*dt;
  p2.y+=(p2InputY-p2.y)*0.28*dt;

  // Clamp to top half
  p2.x=Math.max(PAD_R,Math.min(GW-PAD_R,p2.x));
  p2.y=Math.max(PAD_R,Math.min(NET_Y-PAD_R-4,p2.y));

  p2.vx=p2.x-p2.prevX;
  p2.vy=p2.y-p2.prevY;
}

// ===== SCORE =====
function scorePoint(scorer){
  if(scorer===1)playerScore++;else opponentScore++;
  sndScore();
  spawnParticles(ball.x,ball.y,scorer===1?'#d84080':'#20a0a0',15,1.2);
  shakeMag=4;

  const winScore=gameMode==='2p'?WINNING_SCORE_2P:WINNING_SCORE_1P;
  if((playerScore>=winScore||opponentScore>=winScore)&&Math.abs(playerScore-opponentScore)>=2){
    gameState='ended';
    let winText;
    if(gameMode==='2p'){
      winText=playerScore>opponentScore?'🎉 PLAYER 1 WINS!':'🎉 PLAYER 2 WINS!';
    } else {
      winText=playerScore>opponentScore?'🎉 YOU WIN!':'🤖 AI WINS!';
    }
    document.getElementById('winner-text').textContent=winText;
    document.getElementById('final-score').textContent=playerScore+' - '+opponentScore;
    showScreen('end-screen');document.getElementById('pause-btn').style.display='none';sndWin();return;
  }

  const total=playerScore+opponentScore;
  serveSide=(total%4<2)?1:-1;
  resetBall(serveSide);
}

// ===== UPDATE =====
function update(dt){
  if(gameState!=='playing')return;

  // Smash cooldown decay
  if(smashCooldownP1>0)smashCooldownP1-=dt;
  if(smashCooldownP2>0)smashCooldownP2-=dt;

  // Player 1 movement
  player.prevX=player.x;player.prevY=player.y;
  player.x+=(p1InputX-player.x)*0.28*dt;
  player.y+=(p1InputY-player.y)*0.28*dt;
  player.x=Math.max(PAD_R,Math.min(GW-PAD_R,player.x));
  player.y=Math.max(NET_Y+PAD_R+4,Math.min(GH-PAD_R,player.y));
  player.vx=player.x-player.prevX;
  player.vy=player.y-player.prevY;

  // P2: AI or human
  if(gameMode==='2p'){updateP2Human(dt)}else{updateAI(dt)}

  if(serving){doServe(dt);return}

  // Spin — smooth curve: apply lateral acceleration that fades over time
  if(Math.abs(ball.spin)>0.005){
    // Quadratic-feel curve: stronger at start, eases out
    const spinAbs=Math.abs(ball.spin);
    const curvePower=SPIN_CURVE_FORCE * (1 + spinAbs * 0.3); // stronger spin = more pull
    const curveForce=ball.spin*curvePower*dt;
    ball.vx+=curveForce;
    // Gradual decay — spin fades smoothly
    ball.spin*=Math.pow(SPIN_DECAY,dt);
    if(Math.abs(ball.spin)<0.005)ball.spin=0;
    // Clamp lateral speed so curve doesn't go crazy
    const maxCurveVX=ball.speed*0.55;
    ball.vx=Math.max(-maxCurveVX,Math.min(maxCurveVX,ball.vx));
    // Re-normalize to maintain consistent speed
    const mag=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
    if(mag>0){ball.vx=(ball.vx/mag)*ball.speed;ball.vy=(ball.vy/mag)*ball.speed;}
  }

  // Move ball (sub-step for smoother collision at high speed)
  const steps=ball.speed>7?2:1;
  const subDt=dt/steps;
  for(let s=0;s<steps;s++){
    ball.x+=ball.vx*subDt;
    ball.y+=ball.vy*subDt;
  }
  
  // Bounce arc
  if(ball.bounceHeight>0.5){
    ball.bouncePhase+=dt*0.18;
    ball.bounceHeight*=0.985;
  }

  // Trail
  trail.push({x:ball.x,y:ball.y,life:1,speed:ball.speed,spin:ball.spin});
  if(trail.length>MAX_TRAIL)trail.shift();

  // Side boundaries: 95% bounce, 5% fall off
  if(ball.x-BALL_R<TBL_L){
    if(Math.random()<0.05){
      spawnParticles(ball.x,ball.y,'rgba(255,200,100,0.8)',10,1);
      if(ball.lastHitBy===1)scorePoint(-1);else scorePoint(1);
      return;
    } else {
      ball.x=TBL_L+BALL_R+1; // prevent sticking
      ball.vx=Math.abs(ball.vx)*0.7;
      ball.speed*=BOUNCE_SPEED_DAMP; // reduce speed on wall bounce
      ball.spin*=-0.5;
      // Add slight angle jitter
      ball.vy+=(Math.random()-0.5)*ball.speed*ANGLE_JITTER*2;
      const m=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
      if(m>0){ball.vx=(ball.vx/m)*ball.speed;ball.vy=(ball.vy/m)*ball.speed;}
      sndBounce();
      addBounceMark(TBL_L,ball.y);
      spawnParticles(TBL_L,ball.y,'rgba(255,255,255,0.5)',4,0.5);
    }
  }
  if(ball.x+BALL_R>TBL_R){
    if(Math.random()<0.05){
      spawnParticles(ball.x,ball.y,'rgba(255,200,100,0.8)',10,1);
      if(ball.lastHitBy===1)scorePoint(-1);else scorePoint(1);
      return;
    } else {
      ball.x=TBL_R-BALL_R-1; // prevent sticking
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
  }

  // Net collision
  if(Math.abs(ball.y-NET_Y)<4+BALL_R){
    const prevY=ball.y-ball.vy*dt;
    if((prevY<NET_Y&&ball.y>=NET_Y)||(prevY>NET_Y&&ball.y<=NET_Y)){
      if(ball.speed<3){
        ball.vy*=-0.3;ball.vx*=0.3;
        ball.y=ball.vy>0?NET_Y+4+BALL_R:NET_Y-4-BALL_R;
        sndNet();spawnParticles(ball.x,NET_Y,'#aaa',6);
        if(ball.lastHitBy===1)scorePoint(-1);else scorePoint(1);
        return;
      } else {
        ball.speed*=0.94; // net slows ball more noticeably
        ball.vy*=0.92;
        // Re-normalize
        const m=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
        if(m>0){ball.vx=(ball.vx/m)*ball.speed;ball.vy=(ball.vy/m)*ball.speed;}
        sndNet();
        spawnParticles(ball.x,NET_Y,'rgba(100,100,100,0.4)',3);
        addBounceMark(ball.x,NET_Y);
      }
    }
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
    shakeMag*=0.85;if(shakeMag<0.2)shakeMag=0;
  } else {shakeX=0;shakeY=0}

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=0.03*dt;
    if(p.life<=0)particles.splice(i,1);
  }
  for(const t of trail)t.life-=0.06*dt;

  // Bounce marks decay
  for(let i=bounceMarks.length-1;i>=0;i--){
    bounceMarks[i].life-=0.02*dt;
    bounceMarks[i].r+=0.3*dt;
    if(bounceMarks[i].life<=0)bounceMarks.splice(i,1);
  }
}

// ===== DRAW =====
function draw(){
  const sx=scaleX,sy=scaleY;
  ctx.save();
  ctx.setTransform(sx,0,0,sy,shakeX*sx,shakeY*sy);

  // Background
  ctx.fillStyle='#f0c040';ctx.fillRect(0,0,GW,GH);

  // Table shadow
  ctx.fillStyle='rgba(0,0,0,0.15)';
  ctx.beginPath();ctx.roundRect(TBL_L-2+3,TBL_T-2+4,TBL_W+4,TBL_H+4,6);ctx.fill();

  // Table border
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath();ctx.roundRect(TBL_L-8,TBL_T-8,TBL_W+16,TBL_H+16,6);ctx.fill();

  // Table surface
  ctx.fillStyle='#f07050';
  ctx.beginPath();ctx.roundRect(TBL_L,TBL_T,TBL_W,TBL_H,2);ctx.fill();

  // Center line
  ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(GW/2,TBL_T);ctx.lineTo(GW/2,TBL_B);ctx.stroke();

  // Bounce marks
  for(const bm of bounceMarks){
    ctx.globalAlpha=bm.life*0.5;
    ctx.strokeStyle='rgba(255,255,255,0.7)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(bm.x,bm.y,bm.r,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // Net
  ctx.fillStyle='#ffffff';
  ctx.shadowColor='rgba(0,0,0,0.2)';ctx.shadowBlur=4;ctx.shadowOffsetY=2;
  ctx.fillRect(TBL_L-8,NET_Y-4,TBL_W+16,8);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;

  // Scores on table
  ctx.font='800 60px Fredoka One,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,255,255,0.2)';
  ctx.fillText(opponentScore,GW/2,(TBL_T+NET_Y)/2);
  ctx.fillText(playerScore,GW/2,(NET_Y+TBL_B)/2);

  // Player labels in 2P mode
  if(gameMode==='2p'){
    ctx.font='700 11px Nunito,sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillStyle='rgba(216,64,128,0.6)';
    ctx.fillText('PLAYER 1',GW/2,GH-8);
    ctx.fillStyle='rgba(43,191,191,0.6)';
    ctx.fillText('PLAYER 2',GW/2,18);
  }

  // Serve indicator
  if(serving){
    ctx.font='600 12px Nunito,sans-serif';ctx.fillStyle='rgba(255,255,255,0.5)';ctx.textBaseline='alphabetic';
    if(serveSide===1){
      ctx.fillText('MOVE TO SERVE',GW/2,TBL_B+22);
    } else {
      if(gameMode==='2p') ctx.fillText('P2 MOVE TO SERVE',GW/2,TBL_T-16);
      else ctx.fillText('AI SERVING...',GW/2,TBL_T-16);
    }
  }

  // Trail
  if(trail.length>1){
    for(let i=1;i<trail.length;i++){
      const t=trail[i];if(t.life<=0)continue;
      const prev=trail[i-1];
      const alpha=t.life*0.25*(Math.min(t.speed,MAX_SPEED)/MAX_SPEED);
      ctx.globalAlpha=alpha;
      const spinShift=(t.spin||0)*2;
      const midX=(prev.x+t.x)/2+spinShift;
      const midY=(prev.y+t.y)/2;
      ctx.strokeStyle='rgba(255,255,255,0.5)';
      ctx.lineWidth=BALL_R*t.life*0.7;
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.quadraticCurveTo(midX,midY,t.x,t.y);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;

  // Ball bounce visual
  const bounceScale=ball.bounceHeight>0.5 ? 1+Math.abs(Math.sin(ball.bouncePhase))*ball.bounceHeight*0.015 : 1;
  const visualR=BALL_R*bounceScale;
  
  // Ball shadow
  const shadowSpread=1+Math.abs(Math.sin(ball.bouncePhase||0))*(ball.bounceHeight||0)*0.02;
  ctx.fillStyle='rgba(0,0,0,0.15)';
  ctx.beginPath();ctx.ellipse(ball.x+3,ball.y+4,visualR*shadowSpread,visualR*0.4*shadowSpread,0,0,Math.PI*2);ctx.fill();

  // Ball
  const bg=ctx.createRadialGradient(ball.x-2,ball.y-2,1,ball.x,ball.y,visualR);
  bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#e0e0e0');
  ctx.fillStyle=bg;
  ctx.beginPath();ctx.arc(ball.x,ball.y,visualR,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(ball.x,ball.y,visualR,0,Math.PI*2);ctx.stroke();

  // Paddles
  drawPaddle(player.x,player.y,false);
  drawPaddle(p2.x,p2.y,true);

  // Particles
  for(const p of particles){
    ctx.globalAlpha=p.life*0.7;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Smash flash overlay
  const smashAge=performance.now()-lastSmashTime;
  if(smashAge<150){
    const flashAlpha=(1-smashAge/150)*0.25;
    ctx.fillStyle='rgba(255,255,200,'+flashAlpha+')';
    ctx.fillRect(0,0,GW,GH);
  }

  // Smash trail — thicker/brighter when recent smash
  if(smashAge<400 && trail.length>1){
    for(let i=1;i<trail.length;i++){
      const t=trail[i];if(t.life<=0)continue;
      const prev=trail[i-1];
      const alpha=t.life*0.5*(1-smashAge/400);
      ctx.globalAlpha=alpha;
      ctx.strokeStyle='rgba(255,240,100,0.6)';
      ctx.lineWidth=BALL_R*t.life*1.2;
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(t.x,t.y);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  ctx.restore();
}

function drawPaddle(x,y,isTop){
  const faceColor=isTop?'#20a0a0':'#d84080';
  const darkColor=isTop?'#188080':'#b03068';
  const handleAngle=isTop?Math.PI*0.75:Math.PI*1.75;
  
  const hLen=20,hWid=7;
  const hx=x+Math.cos(handleAngle)*PAD_R*0.7;
  const hy=y+Math.sin(handleAngle)*PAD_R*0.7;
  const hx2=x+Math.cos(handleAngle)*(PAD_R*0.7+hLen);
  const hy2=y+Math.sin(handleAngle)*(PAD_R*0.7+hLen);
  
  ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=hWid+2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(hx+1,hy+2);ctx.lineTo(hx2+1,hy2+2);ctx.stroke();
  
  ctx.strokeStyle='#6d4530';ctx.lineWidth=hWid;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx2,hy2);ctx.stroke();
  ctx.strokeStyle='#8b5e3c';ctx.lineWidth=hWid-2;
  ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx2,hy2);ctx.stroke();

  ctx.fillStyle='rgba(0,0,0,0.12)';
  ctx.beginPath();ctx.arc(x+2,y+2,PAD_R,0,Math.PI*2);ctx.fill();

  const g=ctx.createRadialGradient(x-PAD_R*0.3,y-PAD_R*0.3,2,x,y,PAD_R);
  g.addColorStop(0,faceColor);g.addColorStop(1,darkColor);
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(x,y,PAD_R,0,Math.PI*2);ctx.fill();

  ctx.strokeStyle=darkColor;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x,y,PAD_R,0,Math.PI*2);ctx.stroke();

  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.beginPath();ctx.arc(x-PAD_R*0.25,y-PAD_R*0.25,PAD_R*0.5,0,Math.PI*2);ctx.fill();
}

// ===== UI =====
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  if(id)document.getElementById(id).classList.add('active');
}
document.getElementById('play-btn').addEventListener('click',()=>{initAudio();gameMode='1p';startGame()});
document.getElementById('play-2p-btn').addEventListener('click',()=>{initAudio();gameMode='2p';startGame()});
document.getElementById('restart-btn').addEventListener('click',()=>{initAudio();startGame()});
document.getElementById('menu-btn').addEventListener('click',()=>{showScreen('start-screen');gameState='menu';document.getElementById('pause-btn').style.display='none'});
document.querySelectorAll('.diff-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');difficulty=parseInt(btn.dataset.diff);
  });
});
function startGame(){resetGame();gameState='playing';showScreen(null);document.getElementById('pause-text').style.display='none';document.getElementById('pause-btn').style.display='flex'}

// ===== LOOP =====
let lastTime=0;
function loop(time){
  const dt=Math.min((time-lastTime)/16.67,3);lastTime=time;
  if(gameState==='playing')update(dt);
  if(gameState==='playing'||gameState==='paused')draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(t=>{lastTime=t;requestAnimationFrame(loop)});
<\/script>
</body>
</html>`;
