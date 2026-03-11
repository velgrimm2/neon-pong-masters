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
body{background:#e8f5e9;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'Nunito',sans-serif}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:24px}
.screen.active{display:flex}
h1{font-family:'Fredoka One',cursive;font-size:clamp(32px,8vw,52px);color:#1b5e20;text-shadow:2px 2px 0 rgba(255,255,255,0.5);margin-bottom:4px}
.subtitle{font-size:clamp(11px,2.2vw,14px);color:rgba(27,94,32,0.5);margin-bottom:20px;letter-spacing:3px;text-transform:uppercase;font-weight:700}
.btn{background:#43a047;border:none;color:#fff;padding:13px 44px;font-size:clamp(13px,2.8vw,17px);cursor:pointer;letter-spacing:2px;text-transform:uppercase;border-radius:50px;margin:6px;font-weight:800;box-shadow:0 4px 15px rgba(67,160,71,0.3);transition:all .2s ease;font-family:inherit}
.btn:hover,.btn:active{transform:translateY(-2px);box-shadow:0 6px 22px rgba(67,160,71,0.4);background:#388e3c}
.btn-secondary{background:rgba(27,94,32,0.12);color:#2e7d32;box-shadow:0 4px 12px rgba(0,0,0,0.06)}
.btn-secondary:hover,.btn-secondary:active{background:rgba(27,94,32,0.2)}
.difficulty-row{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{padding:9px 22px;font-size:clamp(10px,1.9vw,13px);background:rgba(67,160,71,0.1);border:2px solid rgba(67,160,71,0.3);color:rgba(27,94,32,0.6);border-radius:50px;box-shadow:none;font-family:inherit;cursor:pointer}
.diff-btn:hover{background:rgba(67,160,71,0.2);box-shadow:none}
.diff-btn.selected{background:#43a047;border-color:#43a047;color:#fff;box-shadow:0 3px 12px rgba(67,160,71,0.3)}
.winner-text{font-family:'Fredoka One',cursive;font-size:clamp(26px,6.5vw,44px);color:#1b5e20;text-shadow:2px 2px 0 rgba(255,255,255,0.4);margin-bottom:18px}
.final-score{font-size:clamp(16px,4vw,24px);color:rgba(27,94,32,0.5);margin-bottom:20px;font-weight:700}
.controls-hint{font-size:clamp(9px,1.7vw,11px);color:rgba(27,94,32,0.35);margin-top:16px;line-height:1.7;font-weight:600}
#pause-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Fredoka One',cursive;font-size:clamp(28px,6.5vw,50px);color:rgba(27,94,32,0.35);letter-spacing:8px;display:none;z-index:20;text-shadow:2px 2px 0 rgba(255,255,255,0.3)}
</style>
</head>
<body>
<canvas id="gc"></canvas>
<div id="pause-text">PAUSED</div>
<div id="ui-overlay">
  <div class="screen active" id="start-screen">
    <h1>🏓 TABLE TENNIS</h1>
    <div class="subtitle">R E A L I S T I C</div>
    <div class="difficulty-row">
      <button class="btn diff-btn" data-diff="0">Easy</button>
      <button class="btn diff-btn selected" data-diff="1">Medium</button>
      <button class="btn diff-btn" data-diff="2">Hard</button>
    </div>
    <button class="btn" id="play-btn">PLAY</button>
    <div class="controls-hint">Move paddle to hit &middot; Faster swing = faster ball<br>Ball never slows down! &middot; P to pause</div>
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

// ===== TABLE (compact & close) =====
const TBL_L=20,TBL_R=GW-20,TBL_T=50,TBL_B=GH-50;
const TBL_W=TBL_R-TBL_L,TBL_H=TBL_B-TBL_T;
const NET_Y=(TBL_T+TBL_B)/2;
const TBL_CX=(TBL_L+TBL_R)/2;

// ===== SIZES (closer together) =====
const PAD_W=46,PAD_H=34;
const BALL_R=7;

// ===== CONSTANTS =====
const BASE_SPEED=4;
const MAX_SPEED=8;
const WINNING_SCORE=11;
const SPIN_DECAY=0.96;
const SPIN_CURVE_FORCE=0.12;

// ===== STATE =====
let difficulty=1;
let gameState='menu';
let playerScore=0,aiScore=0;
let serveSide=1;
let serving=true;
let serveTimer=0;

// Shake
let shakeX=0,shakeY=0,shakeMag=0;

// Ball
let ball={x:GW/2,y:0,vx:0,vy:0,speed:BASE_SPEED,active:false,lastHitBy:0,spin:0};

// Bounce markers
const bounceMarks=[];

// Trail
const trail=[];const MAX_TRAIL=20;

// Particles
const particles=[];

// Player
let player={x:GW/2,y:TBL_B-35,prevX:GW/2,prevY:TBL_B-35,vx:0,vy:0};
// AI
let ai={x:GW/2,y:TBL_T+35,prevX:GW/2,prevY:TBL_T+35,vx:0,vy:0,targetX:GW/2,targetY:TBL_T+35};

const AI_PARAMS=[
  {speed:2.5,accuracy:0.55,hitBoost:0.3,missChance:0.12},
  {speed:4.2,accuracy:0.8,hitBoost:0.6,missChance:0.04},
  {speed:6.5,accuracy:0.95,hitBoost:0.9,missChance:0.01}
];

// ===== INPUT =====
let inputX=GW/2,inputY=TBL_B-35;

canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  inputX=((e.clientX-r.left)/r.width)*GW;
  inputY=((e.clientY-r.top)/r.height)*GH;
});
canvas.addEventListener('mousedown',e=>{
  initAudio();
  const r=canvas.getBoundingClientRect();
  inputX=((e.clientX-r.left)/r.width)*GW;
  inputY=((e.clientY-r.top)/r.height)*GH;
});
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();initAudio();
  const r=canvas.getBoundingClientRect();
  inputX=((e.touches[0].clientX-r.left)/r.width)*GW;
  inputY=((e.touches[0].clientY-r.top)/r.height)*GH;
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  inputX=((e.touches[0].clientX-r.left)/r.width)*GW;
  inputY=((e.touches[0].clientY-r.top)/r.height)*GH;
},{passive:false});

document.addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P'){
    if(gameState==='playing'){gameState='paused';document.getElementById('pause-text').style.display='block'}
    else if(gameState==='paused'){gameState='playing';document.getElementById('pause-text').style.display='none'}
  }
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
  ball.lastHitBy=0;
  if(server===1){
    ball.x=player.x;ball.y=player.y-20;
  } else {
    ball.x=ai.x;ball.y=ai.y+20;
  }
}

function resetGame(){
  playerScore=0;aiScore=0;
  player.x=GW/2;player.y=TBL_B-35;player.prevX=GW/2;player.prevY=TBL_B-35;player.vx=0;player.vy=0;
  ai.x=GW/2;ai.y=TBL_T+35;ai.prevX=GW/2;ai.prevY=TBL_T+35;ai.vx=0;ai.vy=0;
  particles.length=0;trail.length=0;bounceMarks.length=0;shakeMag=0;
  resetBall(1);
}

// ===== SERVE =====
function doServe(dt){
  serveTimer+=dt*0.016;
  if(serveSide===1){
    ball.x=player.x;ball.y=player.y-20;
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
    ball.x=ai.x;ball.y=ai.y+20;
    if(serveTimer>1.0){
      serving=false;
      ball.active=true;
      const p=AI_PARAMS[difficulty];
      ball.speed=BASE_SPEED+p.hitBoost;
      ball.vx=(Math.random()-0.5)*0.8; // AI also mostly straight
      ball.vy=ball.speed;
      const mag=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);
      if(mag>0){ball.vx=(ball.vx/mag)*ball.speed;ball.vy=(ball.vy/mag)*ball.speed;}
      ball.lastHitBy=-1;
      sndHit(ball.speed);
    }
  }
}

// ===== PADDLE HIT =====
function checkPaddleHit(paddle,isPlayer){
  if(isPlayer && ball.vy<0) return false;
  if(!isPlayer && ball.vy>0) return false;

  const px=paddle.x-PAD_W/2,py=paddle.y-PAD_H/2;
  const cx=Math.max(px,Math.min(ball.x,px+PAD_W));
  const cy=Math.max(py,Math.min(ball.y,py+PAD_H));
  const dx=ball.x-cx,dy=ball.y-cy;
  if(dx*dx+dy*dy>BALL_R*BALL_R) return false;

  const padSpeed=Math.sqrt(paddle.vx*paddle.vx+paddle.vy*paddle.vy);

  // Speed boost — ball never slows down
  const speedBoost=Math.min(4,padSpeed*0.25);
  ball.speed=Math.max(ball.speed, ball.speed+speedBoost);

  // === CENTER BIAS: ball mostly goes straight, only strong side swipes push it out ===
  const hitOffsetX=(ball.x-paddle.x)/(PAD_W/2); // -1 to 1
  
  // Only apply significant sideways force if paddle is moving fast sideways
  const sideForce=Math.abs(paddle.vx);
  let sideMultiplier;
  if(sideForce>4){
    // Strong swipe toward boundary — allow ball to go wide
    sideMultiplier=0.35;
  } else if(sideForce>2){
    // Medium swipe — slight angle
    sideMultiplier=0.15;
  } else {
    // Gentle or no side movement — ball goes mostly straight
    sideMultiplier=0.05;
  }
  
  let newVX=paddle.vx*sideMultiplier + hitOffsetX*ball.speed*0.08;
  let newVY=(isPlayer?-1:1)*ball.speed;

  // Normalize to ball.speed
  const mag=Math.sqrt(newVX*newVX+newVY*newVY);
  if(mag>0){newVX=(newVX/mag)*ball.speed;newVY=(newVY/mag)*ball.speed;}

  ball.vx=newVX;
  ball.vy=newVY;
  ball.lastHitBy=isPlayer?1:-1;

  // Push ball out of paddle
  if(isPlayer){ball.y=paddle.y-PAD_H/2-BALL_R-1}
  else{ball.y=paddle.y+PAD_H/2+BALL_R+1}

  sndHit(ball.speed);
  const color=isPlayer?'#66bb6a':'#ef5350';
  spawnParticles(ball.x,ball.y,color,Math.floor(4+padSpeed*2),0.5+padSpeed*0.1);
  if(padSpeed>4)shakeMag=Math.min(6,padSpeed*0.6);

  return true;
}

// ===== AI =====
function updateAI(dt){
  const p=AI_PARAMS[difficulty];
  let tx=GW/2,ty=TBL_T+35;

  if(ball.active && ball.vy<0){
    const timeToReach=Math.max(0,(ai.y-ball.y)/Math.max(0.5,Math.abs(ball.vy)));
    tx=ball.x+ball.vx*timeToReach;
    tx+=(Math.random()-0.5)*(1-p.accuracy)*80;
    // Clamp AI target to table center region mostly
    tx=TBL_CX+(tx-TBL_CX)*0.85;
    ty=TBL_T+25+Math.min(40,Math.abs(ball.vy)*2.5);
    if(Math.random()<p.missChance*0.05){tx+=(Math.random()-0.5)*120}
  } else if(ball.active && ball.vy>0){
    tx=GW/2+(Math.random()-0.5)*30;
    ty=TBL_T+45;
  } else if(!ball.active && serveSide===-1){
    tx=GW/2+(Math.random()-0.5)*40;
    ty=TBL_T+35;
  }

  ai.targetX+=(tx-ai.targetX)*0.08;
  ai.targetY+=(ty-ai.targetY)*0.08;

  const ddx=ai.targetX-ai.x,ddy=ai.targetY-ai.y;
  const dist=Math.sqrt(ddx*ddx+ddy*ddy);
  const spd=p.speed*dt;

  ai.prevX=ai.x;ai.prevY=ai.y;
  if(dist>1){
    ai.x+=Math.sign(ddx)*Math.min(Math.abs(ddx),spd);
    ai.y+=Math.sign(ddy)*Math.min(Math.abs(ddy),spd*0.6);
  }

  ai.x=Math.max(TBL_L+PAD_W/2,Math.min(TBL_R-PAD_W/2,ai.x));
  ai.y=Math.max(TBL_T+12,Math.min(NET_Y-PAD_H/2-4,ai.y));

  ai.vx=(ai.x-ai.prevX)*p.hitBoost*2;
  ai.vy=(ai.y-ai.prevY)*p.hitBoost*2;
}

// ===== SCORE =====
function scorePoint(scorer){
  if(scorer===1)playerScore++;else aiScore++;
  sndScore();
  spawnParticles(ball.x,ball.y,scorer===1?'#66bb6a':'#ef5350',15,1.2);
  shakeMag=4;

  if((playerScore>=WINNING_SCORE||aiScore>=WINNING_SCORE)&&Math.abs(playerScore-aiScore)>=2){
    gameState='ended';
    const won=playerScore>aiScore;
    document.getElementById('winner-text').textContent=won?'🎉 YOU WIN!':'🤖 AI WINS!';
    document.getElementById('final-score').textContent=playerScore+' - '+aiScore;
    showScreen('end-screen');sndWin();return;
  }

  const total=playerScore+aiScore;
  serveSide=(total%4<2)?1:-1;
  resetBall(serveSide);
}

// ===== UPDATE =====
function update(dt){
  if(gameState!=='playing')return;

  // Player movement
  player.prevX=player.x;player.prevY=player.y;
  player.x+=(inputX-player.x)*0.22*dt;
  player.y+=(inputY-player.y)*0.22*dt;
  player.x=Math.max(TBL_L+PAD_W/2,Math.min(TBL_R-PAD_W/2,player.x));
  player.y=Math.max(NET_Y+PAD_H/2+4,Math.min(TBL_B-12,player.y));
  player.vx=player.x-player.prevX;
  player.vy=player.y-player.prevY;

  updateAI(dt);

  if(serving){doServe(dt);return}

  // Move ball — NO drag, NO friction, NO slowdown
  ball.x+=ball.vx*dt;
  ball.y+=ball.vy*dt;

  // Trail
  trail.push({x:ball.x,y:ball.y,life:1,speed:ball.speed});
  if(trail.length>MAX_TRAIL)trail.shift();

  // === BOUNDARY: ball falls off ONLY if it actually leaves table sides ===
  if(ball.x-BALL_R<TBL_L || ball.x+BALL_R>TBL_R){
    spawnParticles(ball.x,ball.y,'rgba(255,200,100,0.8)',10,1);
    if(ball.lastHitBy===1)scorePoint(-1);
    else scorePoint(1);
    return;
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
        ball.vy*=0.92;
        sndNet();
        spawnParticles(ball.x,NET_Y,'rgba(100,100,100,0.4)',3);
        addBounceMark(ball.x,NET_Y);
      }
    }
  }

  // Paddle collisions
  if(ball.vy>0 && ball.y>NET_Y) checkPaddleHit(player,true);
  if(ball.vy<0 && ball.y<NET_Y) checkPaddleHit(ai,false);

  // Ball past top/bottom
  if(ball.y<TBL_T-25){
    addBounceMark(ball.x,TBL_T);
    scorePoint(1);return;
  }
  if(ball.y>TBL_B+25){
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

  // Bright background
  const bgGrad=ctx.createLinearGradient(0,0,0,GH);
  bgGrad.addColorStop(0,'#c8e6c9');bgGrad.addColorStop(0.5,'#e8f5e9');bgGrad.addColorStop(1,'#c8e6c9');
  ctx.fillStyle=bgGrad;ctx.fillRect(0,0,GW,GH);

  // Table shadow
  ctx.fillStyle='rgba(0,0,0,0.1)';
  ctx.beginPath();ctx.roundRect(TBL_L-2+4,TBL_T-2+5,TBL_W+4,TBL_H+4,8);ctx.fill();

  // Table border
  ctx.fillStyle='#5d4037';
  ctx.beginPath();ctx.roundRect(TBL_L-5,TBL_T-5,TBL_W+10,TBL_H+10,8);ctx.fill();

  // Table surface — bright blue
  const tg=ctx.createLinearGradient(TBL_L,TBL_T,TBL_L,TBL_B);
  tg.addColorStop(0,'#1565c0');tg.addColorStop(0.5,'#1e88e5');tg.addColorStop(1,'#1565c0');
  ctx.fillStyle=tg;ctx.beginPath();ctx.roundRect(TBL_L,TBL_T,TBL_W,TBL_H,4);ctx.fill();

  // Table lines — white
  ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=2;
  ctx.strokeRect(TBL_L+6,TBL_T+6,TBL_W-12,TBL_H-12);
  // Center vertical line
  ctx.beginPath();ctx.moveTo(GW/2,TBL_T+6);ctx.lineTo(GW/2,TBL_B-6);ctx.stroke();

  // Bounce marks
  for(const bm of bounceMarks){
    ctx.globalAlpha=bm.life*0.7;
    ctx.strokeStyle='rgba(255,235,59,0.9)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(bm.x,bm.y,bm.r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.6)';
    ctx.beginPath();ctx.arc(bm.x,bm.y,bm.r*0.5,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // Net
  ctx.fillStyle='rgba(255,255,255,0.95)';
  ctx.shadowColor='rgba(0,0,0,0.15)';ctx.shadowBlur=4;ctx.shadowOffsetY=2;
  ctx.fillRect(TBL_L-8,NET_Y-2.5,TBL_W+16,5);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  // Net posts
  ctx.fillStyle='#9e9e9e';
  ctx.fillRect(TBL_L-10,NET_Y-7,4,14);
  ctx.fillRect(TBL_R+6,NET_Y-7,4,14);
  // Net mesh lines
  ctx.strokeStyle='rgba(180,180,180,0.3)';ctx.lineWidth=0.5;
  for(let x=TBL_L;x<TBL_R;x+=7){ctx.beginPath();ctx.moveTo(x,NET_Y-2.5);ctx.lineTo(x,NET_Y+2.5);ctx.stroke()}

  // Scores
  ctx.font='800 44px Fredoka One,Nunito,sans-serif';ctx.textAlign='center';
  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.fillText(aiScore,GW/2,NET_Y-45);
  ctx.fillText(playerScore,GW/2,NET_Y+65);

  // Labels
  ctx.font='700 10px Nunito,sans-serif';ctx.fillStyle='rgba(255,255,255,0.2)';
  ctx.fillText('AI',GW/2,TBL_T+16);ctx.fillText('YOU',GW/2,TBL_B-6);

  // Serve indicator
  if(serving){
    ctx.font='600 11px Nunito,sans-serif';ctx.fillStyle='rgba(255,255,255,0.55)';
    if(serveSide===1)ctx.fillText('MOVE TO SERVE',GW/2,TBL_B+18);
    else ctx.fillText('AI SERVING...',GW/2,TBL_T-15);
  }

  // Trail
  for(let i=0;i<trail.length;i++){
    const t=trail[i];if(t.life<=0)continue;
    const alpha=t.life*0.18*(Math.min(t.speed,12)/12);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(255,255,200,0.8)';
    const r=BALL_R*t.life*0.5;
    ctx.beginPath();ctx.arc(t.x,t.y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Ball shadow
  ctx.fillStyle='rgba(0,0,0,0.15)';
  ctx.beginPath();ctx.ellipse(ball.x+2,ball.y+3,BALL_R*0.85,BALL_R*0.45,0,0,Math.PI*2);ctx.fill();

  // Ball
  const bg=ctx.createRadialGradient(ball.x-2,ball.y-2,1,ball.x,ball.y,BALL_R);
  bg.addColorStop(0,'#ffffff');bg.addColorStop(0.5,'#ffeb3b');bg.addColorStop(1,'#f9a825');
  ctx.fillStyle=bg;
  ctx.beginPath();ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2);ctx.fill();
  // Ball highlight
  ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.beginPath();ctx.arc(ball.x-1.5,ball.y-2.5,BALL_R*0.3,0,Math.PI*2);ctx.fill();

  // Paddles
  drawPaddle(player.x,player.y,false);
  drawPaddle(ai.x,ai.y,true);

  // Particles
  for(const p of particles){
    ctx.globalAlpha=p.life*0.7;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Speed indicator
  if(ball.active){
    ctx.font='600 9px Nunito,sans-serif';ctx.textAlign='right';
    ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.fillText('Speed: '+ball.speed.toFixed(1),TBL_R-4,TBL_B+16);
  }

  ctx.restore();
}

function drawPaddle(x,y,isAI){
  const color=isAI?'#e53935':'#43a047';
  const dark=isAI?'#c62828':'#2e7d32';
  const rubber=isAI?'#ef5350':'#66bb6a';
  const rw=PAD_W,rh=PAD_H,r=5;

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.12)';
  ctx.beginPath();ctx.roundRect(x-rw/2+2,y-rh/2+2,rw,rh,r);ctx.fill();

  // Paddle face
  const g=ctx.createLinearGradient(x-rw/2,y-rh/2,x+rw/2,y+rh/2);
  g.addColorStop(0,rubber);g.addColorStop(1,color);
  ctx.fillStyle=g;
  ctx.beginPath();ctx.roundRect(x-rw/2,y-rh/2,rw,rh,r);ctx.fill();

  // Rubber texture
  ctx.strokeStyle=dark;ctx.lineWidth=0.4;
  for(let i=0;i<4;i++){
    const ly=y-rh/2+5+i*(rh-10)/3;
    ctx.beginPath();ctx.moveTo(x-rw/2+3,ly);ctx.lineTo(x+rw/2-3,ly);ctx.stroke();
  }

  // Border
  ctx.strokeStyle=dark;ctx.lineWidth=1.2;
  ctx.beginPath();ctx.roundRect(x-rw/2,y-rh/2,rw,rh,r);ctx.stroke();

  // Handle
  ctx.fillStyle='#a1887f';
  const hw=7,hh=14;
  const hy=isAI?y-rh/2-hh+2:y+rh/2-2;
  ctx.beginPath();ctx.roundRect(x-hw/2,hy,hw,hh,3);ctx.fill();
  ctx.fillStyle='#795548';
  ctx.beginPath();ctx.roundRect(x-hw/2+1,hy+2,hw-2,hh-4,2);ctx.fill();
}

// ===== UI =====
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  if(id)document.getElementById(id).classList.add('active');
}
document.getElementById('play-btn').addEventListener('click',()=>{initAudio();startGame()});
document.getElementById('restart-btn').addEventListener('click',()=>{initAudio();startGame()});
document.getElementById('menu-btn').addEventListener('click',()=>{showScreen('start-screen');gameState='menu'});
document.querySelectorAll('.diff-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');difficulty=parseInt(btn.dataset.diff);
  });
});
function startGame(){resetGame();gameState='playing';showScreen(null);document.getElementById('pause-text').style.display='none'}

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
