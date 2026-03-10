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
<title>Ping Pong Master</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a6b3c;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'Nunito',sans-serif}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:24px}
.screen.active{display:flex}

h1{
  font-family:'Fredoka One',cursive;
  font-size:clamp(32px,8vw,52px);
  color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,0.25);
  margin-bottom:4px;
}
.subtitle{
  font-size:clamp(11px,2.2vw,14px);
  color:rgba(255,255,255,0.65);
  margin-bottom:20px;letter-spacing:3px;text-transform:uppercase;font-weight:700;
}

.btn{
  background:#fff;border:none;color:#1a6b3c;padding:13px 44px;
  font-size:clamp(13px,2.8vw,17px);cursor:pointer;
  letter-spacing:2px;text-transform:uppercase;
  border-radius:50px;margin:6px;font-weight:800;
  box-shadow:0 4px 15px rgba(0,0,0,0.2);
  transition:all .2s ease;font-family:inherit;
}
.btn:hover,.btn:active{transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,0.25)}

.btn-secondary{
  background:rgba(255,255,255,0.18);color:#fff;
  box-shadow:0 4px 12px rgba(0,0,0,0.12);
}
.btn-secondary:hover,.btn-secondary:active{background:rgba(255,255,255,0.28)}

.difficulty-row{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{
  padding:9px 22px;font-size:clamp(10px,1.9vw,13px);
  background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);
  color:rgba(255,255,255,0.75);border-radius:50px;
  box-shadow:none;font-family:inherit;
}
.diff-btn:hover{background:rgba(255,255,255,0.25);box-shadow:none}
.diff-btn.selected{
  background:#fff;border-color:#fff;color:#1a6b3c;
  box-shadow:0 3px 12px rgba(0,0,0,0.18);
}

.winner-text{
  font-family:'Fredoka One',cursive;
  font-size:clamp(26px,6.5vw,44px);
  color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,0.2);
  margin-bottom:18px;
}

.final-score{
  font-size:clamp(16px,4vw,24px);
  color:rgba(255,255,255,0.7);
  margin-bottom:20px;font-weight:700;
}

.controls-hint{font-size:clamp(9px,1.7vw,11px);color:rgba(255,255,255,0.4);margin-top:16px;line-height:1.7;font-weight:600}

#pause-text{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  font-family:'Fredoka One',cursive;
  font-size:clamp(28px,6.5vw,50px);
  color:rgba(255,255,255,0.5);letter-spacing:8px;display:none;z-index:20;
  text-shadow:3px 3px 0 rgba(0,0,0,0.15);
}
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
    <div class="controls-hint">Drag paddle to move &middot; Swipe speed = shot power<br>P to pause</div>
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
function sndHit(power){
  const v=Math.min(0.08,0.02+power*0.01);
  const f=400+power*40;
  playTone(f,0.06+power*0.02,'sine',v);
  if(power>3)playTone(f*1.5,0.04,'triangle',v*0.5);
}
function sndBounce(){playTone(800,0.03,'sine',0.04)}
function sndNet(){playTone(150,0.08,'sine',0.03);playTone(120,0.12,'sine',0.02)}
function sndScore(){playTone(700,0.12,'sine',0.06);setTimeout(()=>playTone(900,0.12,'sine',0.04),80)}
function sndWin(){playTone(523,0.18,'sine',0.06);setTimeout(()=>playTone(659,0.18,'sine',0.06),120);setTimeout(()=>playTone(784,0.25,'sine',0.06),240)}

// ===== CANVAS =====
const canvas=document.getElementById('gc');
const ctx=canvas.getContext('2d');
let W,H,scaleX,scaleY;

// Game world coordinates
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

// ===== LOAD ASSETS =====
const paddleImg=new Image();
paddleImg.src='images/paddle.png';
const ballImg=new Image();
ballImg.src='images/ball.png';

// ===== TABLE DIMENSIONS =====
const TBL_L=30,TBL_R=GW-30,TBL_T=70,TBL_B=GH-70;
const TBL_W=TBL_R-TBL_L,TBL_H=TBL_B-TBL_T;
const TBL_MID_Y=(TBL_T+TBL_B)/2;
const NET_Y=TBL_MID_Y;
const NET_H=6;

// ===== PADDLE & BALL SIZES =====
const PAD_W=52,PAD_H=62; // visual size of paddle image
const PAD_HIT_W=46,PAD_HIT_H=40; // collision box (head of racket)
const BALL_R=9;

// ===== PHYSICS CONSTANTS =====
const GRAVITY=0;
const AIR_DRAG=0.997;
const TABLE_FRICTION=0.985;
const BOUNCE_ENERGY_LOSS=0.75;
const NET_ENERGY_LOSS=0.3;
const MIN_BALL_SPEED=1.5;
const MAX_BALL_SPEED=16;
const SPIN_FACTOR=0.35;
const MOMENTUM_TRANSFER=0.6;
const WINNING_SCORE=11;

// ===== STATE =====
let difficulty=1;
let gameState='menu';
let playerScore=0,aiScore=0;
let serveSide=1; // 1=player serves, -1=AI serves
let serveState='ready'; // ready, tossed, playing
let serveTimer=0;

// Shake
let shakeX=0,shakeY=0,shakeMag=0;

// Ball
let ball={x:GW/2,y:TBL_B-100,vx:0,vy:0,spin:0,speed:0,
  bouncedPlayerSide:false,bouncedAISide:false,lastHitBy:0,active:false};
const trail=[],MAX_TRAIL=18;
const particles=[];

// Player paddle
let player={x:GW/2,y:TBL_B-80,prevX:GW/2,prevY:TBL_B-80,vx:0,vy:0};
// AI paddle
let ai={x:GW/2,y:TBL_T+80,prevX:GW/2,prevY:TBL_T+80,vx:0,vy:0,
  targetX:GW/2,targetY:TBL_T+80,reactionTimer:0};

// AI difficulty params
const AI_PARAMS=[
  {speed:2.8,reaction:0.45,accuracy:0.6,hitPower:0.5,missChance:0.15},  // Easy
  {speed:4.5,reaction:0.25,accuracy:0.8,hitPower:0.75,missChance:0.05}, // Medium
  {speed:7,reaction:0.1,accuracy:0.95,hitPower:1.0,missChance:0.01}     // Hard
];

// ===== MOUSE/TOUCH INPUT =====
let inputX=GW/2,inputY=TBL_B-80,inputActive=false;

canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  inputX=((e.clientX-r.left)/r.width)*GW;
  inputY=((e.clientY-r.top)/r.height)*GH;
});
canvas.addEventListener('mousedown',e=>{
  initAudio();inputActive=true;
  const r=canvas.getBoundingClientRect();
  inputX=((e.clientX-r.left)/r.width)*GW;
  inputY=((e.clientY-r.top)/r.height)*GH;
});
canvas.addEventListener('mouseup',()=>{inputActive=false});

canvas.addEventListener('touchstart',e=>{
  e.preventDefault();initAudio();inputActive=true;
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
canvas.addEventListener('touchend',()=>{inputActive=false});

document.addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P'){
    if(gameState==='playing'){gameState='paused';document.getElementById('pause-text').style.display='block'}
    else if(gameState==='paused'){gameState='playing';document.getElementById('pause-text').style.display='none'}
  }
});

// ===== PARTICLES =====
function spawnParticles(x,y,color,count,speedMult){
  const sm=speedMult||1;
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,s=(Math.random()*2.5+0.8)*sm;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color,size:Math.random()*3+1.5});
  }
}

// ===== RESET =====
function resetBall(server){
  ball.active=false;
  serveState='ready';
  serveSide=server;
  serveTimer=0;
  ball.spin=0;
  ball.bouncedPlayerSide=false;
  ball.bouncedAISide=false;
  ball.lastHitBy=0;

  if(server===1){
    ball.x=player.x;ball.y=player.y-30;
    ball.vx=0;ball.vy=0;
  } else {
    ball.x=ai.x;ball.y=ai.y+30;
    ball.vx=0;ball.vy=0;
  }
}

function resetGame(){
  playerScore=0;aiScore=0;
  player.x=GW/2;player.y=TBL_B-80;player.prevX=GW/2;player.prevY=TBL_B-80;player.vx=0;player.vy=0;
  ai.x=GW/2;ai.y=TBL_T+80;ai.prevX=GW/2;ai.prevY=TBL_T+80;ai.vx=0;ai.vy=0;
  ai.targetX=GW/2;ai.targetY=TBL_T+80;
  particles.length=0;trail.length=0;shakeMag=0;
  resetBall(1);
}

// ===== SERVE LOGIC =====
function doServe(dt){
  serveTimer+=dt*0.016;

  if(serveSide===1){
    // Player serve: ball follows paddle until player swipes
    if(serveState==='ready'){
      ball.x=player.x;ball.y=player.y-30;
      ball.vx=0;ball.vy=0;
      // Auto-serve after delay or on fast paddle movement
      const pSpeed=Math.sqrt(player.vx*player.vx+player.vy*player.vy);
      if(serveTimer>1.2||pSpeed>3){
        serveState='playing';
        ball.active=true;
        const power=Math.max(2,Math.min(6,pSpeed*0.7));
        ball.vy=-power;
        ball.vx=player.vx*0.4+(Math.random()-0.5)*0.5;
        ball.spin=player.vx*SPIN_FACTOR*0.5;
        ball.lastHitBy=1;
        ball.bouncedPlayerSide=true;
        ball.bouncedAISide=false;
        sndHit(power);
      }
    }
  } else {
    // AI serve
    if(serveState==='ready'){
      ball.x=ai.x;ball.y=ai.y+30;
      if(serveTimer>0.8){
        serveState='playing';
        ball.active=true;
        const power=2+Math.random()*2*AI_PARAMS[difficulty].hitPower;
        ball.vy=power;
        ball.vx=(Math.random()-0.5)*1.5;
        ball.spin=(Math.random()-0.5)*0.5;
        ball.lastHitBy=-1;
        ball.bouncedAISide=true;
        ball.bouncedPlayerSide=false;
        sndHit(power);
      }
    }
  }
}

// ===== PADDLE-BALL COLLISION =====
function checkPaddleHit(paddle,isPlayer){
  const hitSide=isPlayer?1:-1;
  // Only check if ball is moving toward this paddle
  if(isPlayer && ball.vy<0) return false;
  if(!isPlayer && ball.vy>0) return false;

  // Collision box
  const px=paddle.x-PAD_HIT_W/2, py=paddle.y-PAD_HIT_H/2;
  const pw=PAD_HIT_W, ph=PAD_HIT_H;

  // Circle vs rect collision
  const cx=Math.max(px,Math.min(ball.x,px+pw));
  const cy=Math.max(py,Math.min(ball.y,py+ph));
  const dx=ball.x-cx,dy=ball.y-cy;
  if(dx*dx+dy*dy > BALL_R*BALL_R) return false;

  // Calculate paddle velocity (movement speed)
  const padSpeed=Math.sqrt(paddle.vx*paddle.vx+paddle.vy*paddle.vy);
  const power=Math.max(MIN_BALL_SPEED,Math.min(MAX_BALL_SPEED, padSpeed*MOMENTUM_TRANSFER+2.5));

  // Hit point offset from center (-1 to 1)
  const hpx=(ball.x-paddle.x)/(PAD_HIT_W/2);
  const hpy=(ball.y-paddle.y)/(PAD_HIT_H/2);

  // Direction based on paddle movement + hit offset
  let newVX=paddle.vx*MOMENTUM_TRANSFER+hpx*power*0.4;
  let newVY=(isPlayer?-1:1)*power;

  // Add spin from sideways paddle movement
  ball.spin=paddle.vx*SPIN_FACTOR;

  // Normalize to power
  const mag=Math.sqrt(newVX*newVX+newVY*newVY);
  if(mag>0){newVX=(newVX/mag)*power;newVY=(newVY/mag)*power;}

  ball.vx=newVX;
  ball.vy=newVY;
  ball.speed=power;
  ball.lastHitBy=hitSide;

  // Reset bounce tracking for rally
  if(isPlayer){
    ball.bouncedPlayerSide=false;
    ball.bouncedAISide=false;
  } else {
    ball.bouncedPlayerSide=false;
    ball.bouncedAISide=false;
  }

  // Push ball out of paddle
  if(isPlayer){ball.y=paddle.y-PAD_HIT_H/2-BALL_R-1;}
  else{ball.y=paddle.y+PAD_HIT_H/2+BALL_R+1;}

  // Effects
  sndHit(power);
  const color=isPlayer?'#3b82f6':'#ef4444';
  spawnParticles(ball.x,ball.y,color,Math.floor(4+power*1.5),0.5+power*0.15);
  shakeMag=Math.min(6,power*0.5);

  return true;
}

// ===== AI LOGIC =====
function updateAI(dt){
  const params=AI_PARAMS[difficulty];

  // Update reaction timer
  ai.reactionTimer-=dt*0.016;

  // Predict ball position
  let targetX=GW/2,targetY=TBL_T+80;

  if(ball.active && ball.vy<0){
    // Ball coming toward AI
    const timeToReach=Math.max(0,(ai.y-ball.y)/Math.max(1,Math.abs(ball.vy)));
    targetX=ball.x+ball.vx*timeToReach+(Math.random()-0.5)*(1-params.accuracy)*80;
    targetY=TBL_T+40+Math.min(60,Math.abs(ball.vy)*4);

    // Sometimes miss on purpose
    if(Math.random()<params.missChance&&ai.reactionTimer<=0){
      targetX+=(Math.random()-0.5)*120;
      ai.reactionTimer=0.5;
    }
  } else if(ball.active && ball.vy>0){
    // Ball going away, position strategically
    targetX=GW/2+(Math.random()-0.5)*40;
    targetY=TBL_T+70;
  } else if(!ball.active && serveSide===-1){
    // AI serving position
    targetX=GW/2+(Math.random()-0.5)*60;
    targetY=TBL_T+60;
  }

  // Add reaction delay
  if(ai.reactionTimer>0){
    targetX=ai.targetX;targetY=ai.targetY;
  } else {
    ai.targetX=targetX;ai.targetY=targetY;
  }

  // Move toward target
  const dx=targetX-ai.x,dy=targetY-ai.y;
  const dist=Math.sqrt(dx*dx+dy*dy);
  const spd=params.speed*dt;

  if(dist>2){
    const moveX=Math.sign(dx)*Math.min(Math.abs(dx),spd);
    const moveY=Math.sign(dy)*Math.min(Math.abs(dy),spd*0.7);
    ai.prevX=ai.x;ai.prevY=ai.y;
    ai.x+=moveX;
    ai.y+=moveY;
  }

  // Clamp to AI half
  ai.x=Math.max(TBL_L+PAD_HIT_W/2,Math.min(TBL_R-PAD_HIT_W/2,ai.x));
  ai.y=Math.max(TBL_T+15,Math.min(NET_Y-PAD_HIT_H/2-5,ai.y));

  // Calculate velocity
  ai.vx=(ai.x-ai.prevX)*params.hitPower;
  ai.vy=(ai.y-ai.prevY)*params.hitPower;
}

// ===== SCORING =====
function scorePoint(scorer){
  if(scorer===1)playerScore++;
  else aiScore++;
  sndScore();
  spawnParticles(ball.x,ball.y,scorer===1?'#3b82f6':'#ef4444',15,1.2);
  shakeMag=4;

  if(playerScore>=WINNING_SCORE||aiScore>=WINNING_SCORE){
    // Deuce rule (must win by 2 after 10-10)
    if(Math.abs(playerScore-aiScore)>=2||Math.max(playerScore,aiScore)>=WINNING_SCORE&&Math.abs(playerScore-aiScore)>=2){
      gameState='ended';
      const won=playerScore>aiScore;
      document.getElementById('winner-text').textContent=won?'🎉 YOU WIN!':'🤖 AI WINS!';
      document.getElementById('final-score').textContent=playerScore+' - '+aiScore;
      showScreen('end-screen');sndWin();
      return;
    }
  }

  // Alternate serve every 2 points
  const totalPoints=playerScore+aiScore;
  serveSide=(totalPoints%4<2)?1:-1;
  resetBall(serveSide);
}

// ===== MAIN UPDATE =====
function update(dt){
  if(gameState!=='playing')return;

  // Update player paddle
  player.prevX=player.x;player.prevY=player.y;
  const lerpFactor=0.2*dt;
  player.x+=(inputX-player.x)*lerpFactor;
  player.y+=(inputY-player.y)*lerpFactor;

  // Clamp player to bottom half
  player.x=Math.max(TBL_L+PAD_HIT_W/2,Math.min(TBL_R-PAD_HIT_W/2,player.x));
  player.y=Math.max(NET_Y+PAD_HIT_H/2+5,Math.min(TBL_B-15,player.y));

  // Calculate player paddle velocity
  player.vx=(player.x-player.prevX);
  player.vy=(player.y-player.prevY);

  // Update AI
  updateAI(dt);

  // Serve logic
  if(!ball.active){
    doServe(dt);
    return;
  }

  // ===== BALL PHYSICS =====
  // Apply spin to vx
  ball.vx+=ball.spin*0.02*dt;
  ball.spin*=0.995; // spin decay

  // Air drag
  ball.vx*=Math.pow(AIR_DRAG,dt);
  ball.vy*=Math.pow(AIR_DRAG,dt);

  // Move ball
  ball.x+=ball.vx*dt;
  ball.y+=ball.vy*dt;

  ball.speed=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);

  // Trail
  trail.push({x:ball.x,y:ball.y,life:1,speed:ball.speed});
  if(trail.length>MAX_TRAIL)trail.shift();

  // ===== TABLE BOUNCE =====
  // Side walls
  if(ball.x-BALL_R<TBL_L){
    ball.x=TBL_L+BALL_R;
    ball.vx=Math.abs(ball.vx)*BOUNCE_ENERGY_LOSS;
    ball.spin*=-0.5;
    sndBounce();
    spawnParticles(TBL_L,ball.y,'rgba(255,255,255,0.5)',3);
  }
  if(ball.x+BALL_R>TBL_R){
    ball.x=TBL_R-BALL_R;
    ball.vx=-Math.abs(ball.vx)*BOUNCE_ENERGY_LOSS;
    ball.spin*=-0.5;
    sndBounce();
    spawnParticles(TBL_R,ball.y,'rgba(255,255,255,0.5)',3);
  }

  // Net collision
  if(Math.abs(ball.y-NET_Y)<NET_H/2+BALL_R && ball.speed>0.5){
    const prevY=ball.y-ball.vy*dt;
    if((prevY<NET_Y&&ball.y>=NET_Y)||(prevY>NET_Y&&ball.y<=NET_Y)){
      // Ball hits net
      if(ball.speed<2.5){
        // Ball stopped by net
        ball.vy*=-NET_ENERGY_LOSS;
        ball.vx*=0.5;
        ball.y=ball.vy>0?NET_Y+NET_H/2+BALL_R:NET_Y-NET_H/2-BALL_R;
        sndNet();
        spawnParticles(ball.x,NET_Y,'#ffffff',6);
        // Point to other side
        if(ball.lastHitBy===1)scorePoint(-1);
        else scorePoint(1);
        return;
      } else {
        // Ball clips net but goes over (reduced speed)
        ball.vy*=0.85;
        ball.vx*=0.9;
        sndNet();
        spawnParticles(ball.x,NET_Y,'rgba(255,255,255,0.4)',3);
      }
    }
  }

  // ===== PADDLE COLLISIONS =====
  // Player paddle (ball moving down in player half)
  if(ball.vy>0 && ball.y>NET_Y){
    checkPaddleHit(player,true);
  }
  // AI paddle (ball moving up in AI half)
  if(ball.vy<0 && ball.y<NET_Y){
    checkPaddleHit(ai,false);
  }

  // ===== TABLE SURFACE BOUNCE (not implemented as 3D, simulated) =====
  // We simulate bounces by tracking if ball has bounced on each side

  // ===== SCORING: Ball goes off table =====
  // Ball past top edge
  if(ball.y<TBL_T-40){
    scorePoint(1); // Player scores
    return;
  }
  // Ball past bottom edge
  if(ball.y>TBL_B+40){
    scorePoint(-1); // AI scores
    return;
  }
  // Ball goes off sides far
  if(ball.x<TBL_L-50||ball.x>TBL_R+50){
    if(ball.lastHitBy===1)scorePoint(-1);
    else scorePoint(1);
    return;
  }

  // ===== TABLE FRICTION (ball slows when on table surface) =====
  if(ball.speed<MIN_BALL_SPEED&&ball.active){
    // Ball too slow, dies
    if(ball.y<NET_Y){scorePoint(1)}
    else{scorePoint(-1)}
    return;
  }

  // ===== SHAKE DECAY =====
  if(shakeMag>0){
    shakeX=(Math.random()-0.5)*shakeMag;
    shakeY=(Math.random()-0.5)*shakeMag;
    shakeMag*=0.85;
    if(shakeMag<0.2)shakeMag=0;
  } else {shakeX=0;shakeY=0}

  // ===== PARTICLES =====
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.life-=0.03*dt;
    if(p.life<=0)particles.splice(i,1);
  }
  for(const t of trail)t.life-=0.07*dt;
}

// ===== RENDERING =====
function draw(){
  const sx=scaleX,sy=scaleY;
  ctx.save();
  ctx.setTransform(sx,0,0,sy,shakeX*sx,shakeY*sy);

  // Background (dark green felt)
  const bgGrad=ctx.createLinearGradient(0,0,0,GH);
  bgGrad.addColorStop(0,'#145a30');
  bgGrad.addColorStop(0.5,'#1a6b3c');
  bgGrad.addColorStop(1,'#145a30');
  ctx.fillStyle=bgGrad;
  ctx.fillRect(0,0,GW,GH);

  // Table shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.roundRect(TBL_L-3+5,TBL_T-3+6,TBL_W+6,TBL_H+6,10);
  ctx.fill();

  // Table border (dark wood)
  const bp=6;
  ctx.fillStyle='#2c1810';
  ctx.beginPath();ctx.roundRect(TBL_L-bp,TBL_T-bp,TBL_W+bp*2,TBL_H+bp*2,10);ctx.fill();

  // Table surface (dark blue - official table color)
  const tableGrad=ctx.createLinearGradient(TBL_L,TBL_T,TBL_L,TBL_B);
  tableGrad.addColorStop(0,'#0d3b66');
  tableGrad.addColorStop(0.5,'#114a80');
  tableGrad.addColorStop(1,'#0d3b66');
  ctx.fillStyle=tableGrad;
  ctx.beginPath();ctx.roundRect(TBL_L,TBL_T,TBL_W,TBL_H,5);ctx.fill();

  // Table lines
  ctx.strokeStyle='rgba(255,255,255,0.5)';
  ctx.lineWidth=2;
  // Border line
  ctx.strokeRect(TBL_L+8,TBL_T+8,TBL_W-16,TBL_H-16);
  // Center line (vertical)
  ctx.beginPath();
  ctx.moveTo(GW/2,TBL_T+8);ctx.lineTo(GW/2,TBL_B-8);
  ctx.stroke();

  // Net
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.shadowColor='rgba(0,0,0,0.2)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
  ctx.fillRect(TBL_L-10,NET_Y-NET_H/2,TBL_W+20,NET_H);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  // Net posts
  ctx.fillStyle='#888';
  ctx.fillRect(TBL_L-12,NET_Y-8,5,16);
  ctx.fillRect(TBL_R+7,NET_Y-8,5,16);
  // Net mesh pattern
  ctx.strokeStyle='rgba(200,200,200,0.3)';ctx.lineWidth=0.5;
  for(let x=TBL_L;x<TBL_R;x+=8){
    ctx.beginPath();ctx.moveTo(x,NET_Y-NET_H/2);ctx.lineTo(x,NET_Y+NET_H/2);ctx.stroke();
  }

  // Scores
  ctx.font='800 52px Fredoka One,Nunito,sans-serif';
  ctx.textAlign='center';
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.fillText(aiScore,GW/2,NET_Y-60);
  ctx.fillText(playerScore,GW/2,NET_Y+80);

  // Labels
  ctx.font='700 11px Nunito,sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.fillText('AI',GW/2,TBL_T+20);
  ctx.fillText('YOU',GW/2,TBL_B-8);

  // Serve indicator
  if(!ball.active){
    ctx.font='600 12px Nunito,sans-serif';
    ctx.fillStyle='rgba(255,255,255,0.5)';
    if(serveSide===1){
      ctx.fillText('YOUR SERVE',GW/2,TBL_B+25);
    } else {
      ctx.fillText('AI SERVE',GW/2,TBL_T-20);
    }
  }

  // ===== TRAIL =====
  for(let i=0;i<trail.length;i++){
    const t=trail[i];if(t.life<=0)continue;
    const alpha=t.life*0.1*(Math.min(t.speed,10)/10);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(255,255,200,0.6)';
    const r=BALL_R*t.life*0.4;
    ctx.beginPath();ctx.arc(t.x,t.y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // ===== BALL SHADOW =====
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.beginPath();ctx.ellipse(ball.x+2,ball.y+4,BALL_R*0.9,BALL_R*0.5,0,0,Math.PI*2);ctx.fill();

  // ===== BALL =====
  if(ballImg.complete&&ballImg.naturalWidth>0){
    const bs=BALL_R*2.4;
    ctx.drawImage(ballImg,ball.x-bs/2,ball.y-bs/2,bs,bs);
  } else {
    const bg=ctx.createRadialGradient(ball.x-2,ball.y-2,1,ball.x,ball.y,BALL_R);
    bg.addColorStop(0,'#fff');bg.addColorStop(1,'#ddd');
    ctx.fillStyle=bg;
    ctx.beginPath();ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2);ctx.fill();
  }

  // ===== PADDLES =====
  drawPaddle(player.x,player.y,false);
  drawPaddle(ai.x,ai.y,true);

  // ===== PARTICLES =====
  for(const p of particles){
    ctx.globalAlpha=p.life*0.7;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  ctx.restore();
}

function drawPaddle(x,y,isAI){
  if(paddleImg.complete&&paddleImg.naturalWidth>0){
    ctx.save();
    ctx.translate(x,y);
    if(isAI)ctx.rotate(Math.PI); // Flip AI paddle
    ctx.drawImage(paddleImg,-PAD_W/2,-PAD_H/2,PAD_W,PAD_H);
    ctx.restore();
  } else {
    // Fallback drawn paddle
    const color=isAI?'#ef4444':'#3b82f6';
    const dark=isAI?'#dc2626':'#2563eb';
    const rw=PAD_HIT_W,rh=PAD_HIT_H,r=8;
    const ry=y-rh/2;

    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.beginPath();ctx.roundRect(x-rw/2+3,ry+3,rw,rh,r);ctx.fill();

    // Paddle face
    const g=ctx.createLinearGradient(x-rw/2,ry,x+rw/2,ry+rh);
    g.addColorStop(0,color);g.addColorStop(1,dark);
    ctx.fillStyle=g;
    ctx.beginPath();ctx.roundRect(x-rw/2,ry,rw,rh,r);ctx.fill();

    // Handle
    ctx.fillStyle='#8B5E3C';
    const hw=7,hh=18;
    const hy=isAI?y-rh/2-hh+4:y+rh/2-4;
    ctx.beginPath();ctx.roundRect(x-hw/2,hy,hw,hh,3);ctx.fill();
  }
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
