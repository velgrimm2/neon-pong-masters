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
body{background:#1a6b3c;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'Nunito',sans-serif}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:24px}
.screen.active{display:flex}
h1{font-family:'Fredoka One',cursive;font-size:clamp(32px,8vw,52px);color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,0.25);margin-bottom:4px}
.subtitle{font-size:clamp(11px,2.2vw,14px);color:rgba(255,255,255,0.65);margin-bottom:20px;letter-spacing:3px;text-transform:uppercase;font-weight:700}
.btn{background:#fff;border:none;color:#1a6b3c;padding:13px 44px;font-size:clamp(13px,2.8vw,17px);cursor:pointer;letter-spacing:2px;text-transform:uppercase;border-radius:50px;margin:6px;font-weight:800;box-shadow:0 4px 15px rgba(0,0,0,0.2);transition:all .2s ease;font-family:inherit}
.btn:hover,.btn:active{transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,0.25)}
.btn-secondary{background:rgba(255,255,255,0.18);color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.12)}
.btn-secondary:hover,.btn-secondary:active{background:rgba(255,255,255,0.28)}
.difficulty-row{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{padding:9px 22px;font-size:clamp(10px,1.9vw,13px);background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);color:rgba(255,255,255,0.75);border-radius:50px;box-shadow:none;font-family:inherit}
.diff-btn:hover{background:rgba(255,255,255,0.25);box-shadow:none}
.diff-btn.selected{background:#fff;border-color:#fff;color:#1a6b3c;box-shadow:0 3px 12px rgba(0,0,0,0.18)}
.winner-text{font-family:'Fredoka One',cursive;font-size:clamp(26px,6.5vw,44px);color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,0.2);margin-bottom:18px}
.final-score{font-size:clamp(16px,4vw,24px);color:rgba(255,255,255,0.7);margin-bottom:20px;font-weight:700}
.controls-hint{font-size:clamp(9px,1.7vw,11px);color:rgba(255,255,255,0.4);margin-top:16px;line-height:1.7;font-weight:600}
#pause-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Fredoka One',cursive;font-size:clamp(28px,6.5vw,50px);color:rgba(255,255,255,0.5);letter-spacing:8px;display:none;z-index:20;text-shadow:3px 3px 0 rgba(0,0,0,0.15)}
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
const GW=400,GH=700;

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
const TBL_L=30,TBL_R=GW-30,TBL_T=70,TBL_B=GH-70;
const TBL_W=TBL_R-TBL_L,TBL_H=TBL_B-TBL_T;
const NET_Y=(TBL_T+TBL_B)/2;

// ===== SIZES =====
const PAD_W=50,PAD_H=38;
const BALL_R=8;

// ===== CONSTANTS =====
const BASE_SPEED=4;
const WINNING_SCORE=11;

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
let ball={x:GW/2,y:0,vx:0,vy:0,speed:BASE_SPEED,active:false,lastHitBy:0};

// Bounce markers (visual circles that appear where ball bounces)
const bounceMarks=[];

// Trail
const trail=[];const MAX_TRAIL=20;

// Particles
const particles=[];

// Player
let player={x:GW/2,y:TBL_B-50,prevX:GW/2,prevY:TBL_B-50,vx:0,vy:0};
// AI
let ai={x:GW/2,y:TBL_T+50,prevX:GW/2,prevY:TBL_T+50,vx:0,vy:0,targetX:GW/2,targetY:TBL_T+50};

const AI_PARAMS=[
  {speed:2.5,accuracy:0.55,hitBoost:0.3,missChance:0.12},
  {speed:4.2,accuracy:0.8,hitBoost:0.6,missChance:0.04},
  {speed:6.5,accuracy:0.95,hitBoost:0.9,missChance:0.01}
];

// ===== INPUT =====
let inputX=GW/2,inputY=TBL_B-50;

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
  ball.vx=0;ball.vy=0;
  ball.lastHitBy=0;
  if(server===1){
    ball.x=player.x;ball.y=player.y-25;
  } else {
    ball.x=ai.x;ball.y=ai.y+25;
  }
}

function resetGame(){
  playerScore=0;aiScore=0;
  player.x=GW/2;player.y=TBL_B-50;player.prevX=GW/2;player.prevY=TBL_B-50;player.vx=0;player.vy=0;
  ai.x=GW/2;ai.y=TBL_T+50;ai.prevX=GW/2;ai.prevY=TBL_T+50;ai.vx=0;ai.vy=0;
  particles.length=0;trail.length=0;bounceMarks.length=0;shakeMag=0;
  resetBall(1);
}

// ===== SERVE =====
function doServe(dt){
  serveTimer+=dt*0.016;
  if(serveSide===1){
    // Ball sticks to player paddle; when player moves fast enough, ball launches
    ball.x=player.x;ball.y=player.y-25;
    const pSpeed=Math.sqrt(player.vx*player.vx+player.vy*player.vy);
    if(serveTimer>0.6 && pSpeed>1.5){
      serving=false;
      ball.active=true;
      // Ball goes in the direction the player is moving the paddle
      const angle=Math.atan2(player.vy,player.vx);
      // But mostly upward
      const speedBoost=Math.min(3,pSpeed*0.3);
      ball.speed=BASE_SPEED+speedBoost;
      ball.vx=player.vx*0.3;
      ball.vy=-(ball.speed);
      ball.lastHitBy=1;
      sndHit(ball.speed);
      spawnParticles(ball.x,ball.y,'#4fc3f7',6,0.6);
    }
  } else {
    // AI serve
    ball.x=ai.x;ball.y=ai.y+25;
    if(serveTimer>1.0){
      serving=false;
      ball.active=true;
      const p=AI_PARAMS[difficulty];
      ball.speed=BASE_SPEED+p.hitBoost;
      ball.vx=(Math.random()-0.5)*1.5;
      ball.vy=ball.speed;
      ball.lastHitBy=-1;
      sndHit(ball.speed);
    }
  }
}

// ===== PADDLE HIT =====
function checkPaddleHit(paddle,isPlayer){
  // Only if ball moving toward paddle
  if(isPlayer && ball.vy<0) return false;
  if(!isPlayer && ball.vy>0) return false;

  const px=paddle.x-PAD_W/2,py=paddle.y-PAD_H/2;
  const cx=Math.max(px,Math.min(ball.x,px+PAD_W));
  const cy=Math.max(py,Math.min(ball.y,py+PAD_H));
  const dx=ball.x-cx,dy=ball.y-cy;
  if(dx*dx+dy*dy>BALL_R*BALL_R) return false;

  // Paddle speed
  const padSpeed=Math.sqrt(paddle.vx*paddle.vx+paddle.vy*paddle.vy);

  // The faster you move the paddle, the slightly faster the ball goes
  // Ball NEVER slows down - only maintains or increases
  const speedBoost=Math.min(4,padSpeed*0.25);
  ball.speed=Math.max(ball.speed, ball.speed+speedBoost);

  // Direction: ball goes where player pushes it
  // Mostly straight but angled by paddle movement
  const hitOffsetX=(ball.x-paddle.x)/(PAD_W/2); // -1 to 1
  let newVX=paddle.vx*0.4 + hitOffsetX*ball.speed*0.35;
  let newVY=(isPlayer?-1:1)*ball.speed;

  // Normalize to ball.speed
  const mag=Math.sqrt(newVX*newVX+newVY*newVY);
  if(mag>0){newVX=(newVX/mag)*ball.speed;newVY=(newVY/mag)*ball.speed;}

  ball.vx=newVX;
  ball.vy=newVY;
  ball.lastHitBy=isPlayer?1:-1;

  // Push ball out
  if(isPlayer){ball.y=paddle.y-PAD_H/2-BALL_R-1}
  else{ball.y=paddle.y+PAD_H/2+BALL_R+1}

  // Effects
  sndHit(ball.speed);
  const color=isPlayer?'#4fc3f7':'#ff7043';
  spawnParticles(ball.x,ball.y,color,Math.floor(4+padSpeed*2),0.5+padSpeed*0.1);
  if(padSpeed>4)shakeMag=Math.min(6,padSpeed*0.6);

  return true;
}

// ===== AI =====
function updateAI(dt){
  const p=AI_PARAMS[difficulty];
  let tx=GW/2,ty=TBL_T+50;

  if(ball.active && ball.vy<0){
    // Ball coming: predict where it will be
    const timeToReach=Math.max(0,(ai.y-ball.y)/Math.max(0.5,Math.abs(ball.vy)));
    tx=ball.x+ball.vx*timeToReach;
    tx+=(Math.random()-0.5)*(1-p.accuracy)*100;
    ty=TBL_T+30+Math.min(50,Math.abs(ball.vy)*3);
    // Chance to deliberately miss
    if(Math.random()<p.missChance*0.05){tx+=(Math.random()-0.5)*150}
  } else if(ball.active && ball.vy>0){
    tx=GW/2+(Math.random()-0.5)*40;
    ty=TBL_T+60;
  } else if(!ball.active && serveSide===-1){
    tx=GW/2+(Math.random()-0.5)*50;
    ty=TBL_T+50;
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
  ai.y=Math.max(TBL_T+15,Math.min(NET_Y-PAD_H/2-5,ai.y));

  ai.vx=(ai.x-ai.prevX)*p.hitBoost*2;
  ai.vy=(ai.y-ai.prevY)*p.hitBoost*2;
}

// ===== SCORE =====
function scorePoint(scorer){
  if(scorer===1)playerScore++;else aiScore++;
  sndScore();
  spawnParticles(ball.x,ball.y,scorer===1?'#4fc3f7':'#ff7043',15,1.2);
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
  player.y=Math.max(NET_Y+PAD_H/2+5,Math.min(TBL_B-15,player.y));
  player.vx=player.x-player.prevX;
  player.vy=player.y-player.prevY;

  updateAI(dt);

  // Serve
  if(serving){doServe(dt);return}

  // Move ball (NO drag, NO friction, NO slowdown ever)
  ball.x+=ball.vx*dt;
  ball.y+=ball.vy*dt;

  // Trail
  trail.push({x:ball.x,y:ball.y,life:1,speed:ball.speed});
  if(trail.length>MAX_TRAIL)trail.shift();

  // === BOUNDARY CHECK: ball falls off if it leaves table sides ===
  // Ball CAN go slightly off the side but if it goes past table edges, it's out
  if(ball.x-BALL_R<TBL_L || ball.x+BALL_R>TBL_R){
    // Ball fell off the side!
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
        // Ball stopped by net
        ball.vy*=-0.3;ball.vx*=0.3;
        ball.y=ball.vy>0?NET_Y+4+BALL_R:NET_Y-4-BALL_R;
        sndNet();spawnParticles(ball.x,NET_Y,'#fff',6);
        if(ball.lastHitBy===1)scorePoint(-1);else scorePoint(1);
        return;
      } else {
        // Ball clips net
        ball.vy*=0.92;
        sndNet();
        spawnParticles(ball.x,NET_Y,'rgba(255,255,255,0.4)',3);
        addBounceMark(ball.x,NET_Y);
      }
    }
  }

  // Paddle collisions
  if(ball.vy>0 && ball.y>NET_Y) checkPaddleHit(player,true);
  if(ball.vy<0 && ball.y<NET_Y) checkPaddleHit(ai,false);

  // Ball goes past top = player scores (ball fell on opponent's side and out)
  if(ball.y<TBL_T-30){
    addBounceMark(ball.x,TBL_T);
    scorePoint(1);return;
  }
  // Ball goes past bottom = AI scores
  if(ball.y>TBL_B+30){
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
  const bgGrad=ctx.createLinearGradient(0,0,0,GH);
  bgGrad.addColorStop(0,'#145a30');bgGrad.addColorStop(0.5,'#1a6b3c');bgGrad.addColorStop(1,'#145a30');
  ctx.fillStyle=bgGrad;ctx.fillRect(0,0,GW,GH);

  // Table shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath();ctx.roundRect(TBL_L-3+5,TBL_T-3+6,TBL_W+6,TBL_H+6,10);ctx.fill();

  // Table border
  ctx.fillStyle='#2c1810';
  ctx.beginPath();ctx.roundRect(TBL_L-6,TBL_T-6,TBL_W+12,TBL_H+12,10);ctx.fill();

  // Table surface
  const tg=ctx.createLinearGradient(TBL_L,TBL_T,TBL_L,TBL_B);
  tg.addColorStop(0,'#0d3b66');tg.addColorStop(0.5,'#114a80');tg.addColorStop(1,'#0d3b66');
  ctx.fillStyle=tg;ctx.beginPath();ctx.roundRect(TBL_L,TBL_T,TBL_W,TBL_H,5);ctx.fill();

  // Table lines
  ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=2;
  ctx.strokeRect(TBL_L+8,TBL_T+8,TBL_W-16,TBL_H-16);
  ctx.beginPath();ctx.moveTo(GW/2,TBL_T+8);ctx.lineTo(GW/2,TBL_B-8);ctx.stroke();

  // Bounce marks (visual feedback)
  for(const bm of bounceMarks){
    ctx.globalAlpha=bm.life*0.6;
    ctx.strokeStyle='rgba(255,255,100,0.8)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(bm.x,bm.y,bm.r,0,Math.PI*2);ctx.stroke();
    // Inner ring
    ctx.strokeStyle='rgba(255,255,255,0.5)';
    ctx.beginPath();ctx.arc(bm.x,bm.y,bm.r*0.5,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // Net
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.shadowColor='rgba(0,0,0,0.2)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
  ctx.fillRect(TBL_L-10,NET_Y-3,TBL_W+20,6);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.fillStyle='#888';
  ctx.fillRect(TBL_L-12,NET_Y-8,5,16);
  ctx.fillRect(TBL_R+7,NET_Y-8,5,16);
  ctx.strokeStyle='rgba(200,200,200,0.3)';ctx.lineWidth=0.5;
  for(let x=TBL_L;x<TBL_R;x+=8){ctx.beginPath();ctx.moveTo(x,NET_Y-3);ctx.lineTo(x,NET_Y+3);ctx.stroke()}

  // Scores
  ctx.font='800 52px Fredoka One,Nunito,sans-serif';ctx.textAlign='center';
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.fillText(aiScore,GW/2,NET_Y-60);
  ctx.fillText(playerScore,GW/2,NET_Y+80);

  // Labels
  ctx.font='700 11px Nunito,sans-serif';ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.fillText('AI',GW/2,TBL_T+20);ctx.fillText('YOU',GW/2,TBL_B-8);

  // Serve indicator
  if(serving){
    ctx.font='600 12px Nunito,sans-serif';ctx.fillStyle='rgba(255,255,255,0.5)';
    if(serveSide===1)ctx.fillText('MOVE TO SERVE',GW/2,TBL_B+25);
    else ctx.fillText('AI SERVING...',GW/2,TBL_T-20);
  }

  // Trail
  for(let i=0;i<trail.length;i++){
    const t=trail[i];if(t.life<=0)continue;
    const alpha=t.life*0.15*(Math.min(t.speed,12)/12);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(255,255,200,0.7)';
    const r=BALL_R*t.life*0.5;
    ctx.beginPath();ctx.arc(t.x,t.y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Ball shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.beginPath();ctx.ellipse(ball.x+2,ball.y+4,BALL_R*0.9,BALL_R*0.5,0,0,Math.PI*2);ctx.fill();

  // Ball (drawn, not image)
  const bg=ctx.createRadialGradient(ball.x-2,ball.y-2,1,ball.x,ball.y,BALL_R);
  bg.addColorStop(0,'#ffffff');bg.addColorStop(0.6,'#f5f5f5');bg.addColorStop(1,'#cccccc');
  ctx.fillStyle=bg;
  ctx.beginPath();ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2);ctx.fill();
  // Ball highlight
  ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.beginPath();ctx.arc(ball.x-2,ball.y-3,BALL_R*0.35,0,Math.PI*2);ctx.fill();

  // Paddles (drawn)
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
    ctx.font='600 10px Nunito,sans-serif';ctx.textAlign='right';
    ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.fillText('Speed: '+ball.speed.toFixed(1),TBL_R-5,TBL_B+22);
  }

  ctx.restore();
}

function drawPaddle(x,y,isAI){
  const color=isAI?'#e74c3c':'#2980b9';
  const dark=isAI?'#c0392b':'#1f6dad';
  const rubber=isAI?'#ff6b6b':'#5dade2';
  const rw=PAD_W,rh=PAD_H,r=6;

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.15)';
  ctx.beginPath();ctx.roundRect(x-rw/2+3,y-rh/2+3,rw,rh,r);ctx.fill();

  // Paddle face
  const g=ctx.createLinearGradient(x-rw/2,y-rh/2,x+rw/2,y+rh/2);
  g.addColorStop(0,rubber);g.addColorStop(1,color);
  ctx.fillStyle=g;
  ctx.beginPath();ctx.roundRect(x-rw/2,y-rh/2,rw,rh,r);ctx.fill();

  // Rubber texture lines
  ctx.strokeStyle=dark;ctx.lineWidth=0.5;
  for(let i=0;i<5;i++){
    const ly=y-rh/2+6+i*(rh-12)/4;
    ctx.beginPath();ctx.moveTo(x-rw/2+4,ly);ctx.lineTo(x+rw/2-4,ly);ctx.stroke();
  }

  // Edge border
  ctx.strokeStyle=dark;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(x-rw/2,y-rh/2,rw,rh,r);ctx.stroke();

  // Handle
  ctx.fillStyle='#8B5E3C';
  const hw=8,hh=16;
  const hy=isAI?y-rh/2-hh+3:y+rh/2-3;
  ctx.beginPath();ctx.roundRect(x-hw/2,hy,hw,hh,3);ctx.fill();
  // Handle grip
  ctx.fillStyle='#6d4c2a';
  ctx.beginPath();ctx.roundRect(x-hw/2+1,hy+3,hw-2,hh-6,2);ctx.fill();
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
