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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#141b2d;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'Inter',system-ui,sans-serif}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:24px}
.screen.active{display:flex}

h1{
  font-size:clamp(32px,7vw,64px);
  font-weight:900;
  background:linear-gradient(135deg,#4a9eff,#f0803c);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
  margin-bottom:4px;letter-spacing:1px;
}
.subtitle{
  font-size:clamp(11px,2.2vw,15px);
  color:rgba(255,255,255,0.35);
  margin-bottom:28px;letter-spacing:5px;text-transform:uppercase;font-weight:600;
}

.btn{
  background:linear-gradient(135deg,#4a9eff,#3578de);
  border:none;color:#fff;padding:13px 44px;
  font-size:clamp(13px,2.8vw,17px);cursor:pointer;
  letter-spacing:2px;text-transform:uppercase;
  border-radius:12px;margin:6px;font-weight:700;
  box-shadow:0 4px 20px rgba(74,158,255,0.3);
  transition:all .2s ease;font-family:inherit;
}
.btn:hover,.btn:active{transform:translateY(-1px);box-shadow:0 6px 28px rgba(74,158,255,0.45)}

.btn-secondary{
  background:linear-gradient(135deg,#2a3450,#1e2740);
  box-shadow:0 4px 15px rgba(0,0,0,0.3);
}
.btn-secondary:hover,.btn-secondary:active{box-shadow:0 6px 22px rgba(0,0,0,0.4)}

.difficulty-row{display:flex;gap:6px;margin:14px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{
  padding:9px 22px;font-size:clamp(10px,1.8vw,13px);
  background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);
  color:rgba(255,255,255,0.5);border-radius:10px;
  box-shadow:none;font-family:inherit;
}
.diff-btn:hover{background:rgba(255,255,255,0.1);box-shadow:none}
.diff-btn.selected{
  background:linear-gradient(135deg,#4a9eff,#3578de);
  border-color:transparent;color:#fff;
  box-shadow:0 3px 14px rgba(74,158,255,0.3);
}

.winner-text{
  font-size:clamp(22px,5.5vw,44px);font-weight:900;
  background:linear-gradient(135deg,#ffd764,#f0803c);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;margin-bottom:20px;
}

.controls-hint{font-size:clamp(9px,1.6vw,12px);color:rgba(255,255,255,0.2);margin-top:22px;line-height:1.7;font-weight:400}

#pause-text{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  font-size:clamp(26px,5.5vw,52px);font-weight:900;
  color:rgba(255,255,255,0.15);letter-spacing:10px;display:none;z-index:20;
}
</style>
</head>
<body>
<canvas id="gc"></canvas>
<div id="pause-text">PAUSED</div>
<div id="ui-overlay">
  <div class="screen active" id="start-screen">
    <h1>PING PONG</h1>
    <div class="subtitle">M A S T E R</div>
    <div class="difficulty-row">
      <button class="btn diff-btn" data-diff="0">Easy</button>
      <button class="btn diff-btn selected" data-diff="1">Medium</button>
      <button class="btn diff-btn" data-diff="2">Hard</button>
    </div>
    <button class="btn" id="play-btn">PLAY</button>
    <div class="controls-hint">Mouse or Touch to move paddle &middot; P to pause</div>
  </div>
  <div class="screen" id="end-screen">
    <div class="winner-text" id="winner-text"></div>
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
function sndHit(){playTone(520,0.06,'sine',0.05)}
function sndWall(){playTone(280,0.04,'sine',0.03)}
function sndScore(){playTone(700,0.12,'sine',0.06);setTimeout(()=>playTone(900,0.12,'sine',0.04),80)}
function sndWin(){playTone(523,0.18,'sine',0.06);setTimeout(()=>playTone(659,0.18,'sine',0.06),120);setTimeout(()=>playTone(784,0.25,'sine',0.06),240)}

// ===== CANVAS =====
const canvas=document.getElementById('gc');
const ctx=canvas.getContext('2d');
let W,H,scale;

function resize(){
  const ar=4/3,vw=window.innerWidth,vh=window.innerHeight;
  if(vw/vh>ar){H=vh;W=H*ar}else{W=vw;H=W/ar}
  W=Math.floor(W);H=Math.floor(H);
  canvas.width=W;canvas.height=H;scale=W/800;
}
resize();
window.addEventListener('resize',resize);

// ===== CONSTANTS =====
const GW=800,GH=600,WINNING_SCORE=10;
const PW=14,PH=85,BALL_R=9,BALL_START=5,BALL_MAX=12,BALL_ACCEL=0.15;
const PAD_X_L=35,PAD_X_R=GW-35-PW;

// ===== COLORS =====
const COL_BG1='#141b2d',COL_BG2='#1a2340';
const COL_PLAYER='#4a9eff',COL_PLAYER2='#2d6fd6';
const COL_AI='#f0803c',COL_AI2='#d4602a';
const COL_BALL='#ffffff',COL_BALL_GLOW='rgba(255,255,255,0.08)';
const COL_LINE='rgba(255,255,255,0.04)';
const COL_SCORE_P='rgba(74,158,255,0.18)',COL_SCORE_A='rgba(240,128,60,0.18)';

// ===== STATE =====
let difficulty=1;
const AI_SPEEDS=[3,5.5,9],AI_ERRORS=[55,22,4];
let gameState='menu',shakeX=0,shakeY=0,shakeMag=0;
let playerScore=0,aiScore=0;
let playerY=300,aiY=300,aiTargetY=300;
let ballX,ballY,ballVX,ballVY,ballSpeed;
const trail=[],MAX_TRAIL=14;
const particles=[];

function resetBall(dir){
  ballX=400;ballY=300;ballSpeed=BALL_START;
  const a=(Math.random()*0.7-0.35);
  ballVX=Math.cos(a)*ballSpeed*(dir||1);
  ballVY=Math.sin(a)*ballSpeed;
  trail.length=0;
}
function resetGame(){
  playerScore=0;aiScore=0;playerY=300;aiY=300;aiTargetY=300;
  resetBall(1);particles.length=0;shakeMag=0;
}

// ===== CONTROLS =====
let mouseY=300;
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  mouseY=((e.clientY-r.top)/r.height)*GH;
});
canvas.addEventListener('touchstart',e=>{e.preventDefault();initAudio();
  const r=canvas.getBoundingClientRect();
  mouseY=((e.touches[0].clientY-r.top)/r.height)*GH;
},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();
  const r=canvas.getBoundingClientRect();
  mouseY=((e.touches[0].clientY-r.top)/r.height)*GH;
},{passive:false});
document.addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P'){
    if(gameState==='playing'){gameState='paused';document.getElementById('pause-text').style.display='block'}
    else if(gameState==='paused'){gameState='playing';document.getElementById('pause-text').style.display='none'}
  }
});

// ===== PARTICLES =====
function spawnParticles(x,y,color,count){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,s=Math.random()*2.5+0.8;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color,size:Math.random()*2.5+1});
  }
}

// ===== AI =====
function updateAI(dt){
  const spd=AI_SPEEDS[difficulty]*dt,err=AI_ERRORS[difficulty];
  if(ballVX>0){
    const t=(PAD_X_R-ballX)/Math.max(Math.abs(ballVX),0.1);
    aiTargetY=ballY+ballVY*t+(Math.random()-0.5)*err;
  }
  const diff=aiTargetY-aiY;
  if(Math.abs(diff)>2)aiY+=Math.sign(diff)*Math.min(Math.abs(diff),spd);
  aiY=Math.max(PH/2,Math.min(GH-PH/2,aiY));
}

// ===== PHYSICS =====
function update(dt){
  if(gameState!=='playing')return;

  // Player
  playerY+=(mouseY-playerY)*0.14*dt;
  playerY=Math.max(PH/2,Math.min(GH-PH/2,playerY));

  updateAI(dt);

  ballX+=ballVX*dt;
  ballY+=ballVY*dt;

  // Trail
  trail.push({x:ballX,y:ballY,life:1});
  if(trail.length>MAX_TRAIL)trail.shift();

  // Wall bounce
  if(ballY-BALL_R<0){ballY=BALL_R;ballVY=-ballVY;sndWall();spawnParticles(ballX,0,'rgba(255,255,255,0.5)',4)}
  if(ballY+BALL_R>GH){ballY=GH-BALL_R;ballVY=-ballVY;sndWall();spawnParticles(ballX,GH,'rgba(255,255,255,0.5)',4)}

  // Player paddle
  if(ballVX<0&&ballX-BALL_R<PAD_X_L+PW&&ballX-BALL_R>PAD_X_L-5&&ballY>playerY-PH/2-BALL_R&&ballY<playerY+PH/2+BALL_R){
    const hp=(ballY-playerY)/(PH/2);
    ballSpeed=Math.min(ballSpeed+BALL_ACCEL,BALL_MAX);
    const ang=hp*Math.PI/3;
    ballVX=Math.cos(ang)*ballSpeed;ballVY=Math.sin(ang)*ballSpeed;
    ballX=PAD_X_L+PW+BALL_R;
    sndHit();spawnParticles(ballX,ballY,COL_PLAYER,6);
    shakeMag=Math.abs(hp)*3+1.5;
  }

  // AI paddle
  if(ballVX>0&&ballX+BALL_R>PAD_X_R&&ballX+BALL_R<PAD_X_R+PW+5&&ballY>aiY-PH/2-BALL_R&&ballY<aiY+PH/2+BALL_R){
    const hp=(ballY-aiY)/(PH/2);
    ballSpeed=Math.min(ballSpeed+BALL_ACCEL,BALL_MAX);
    const ang=Math.PI-hp*Math.PI/3;
    ballVX=Math.cos(ang)*ballSpeed;ballVY=Math.sin(ang)*ballSpeed;
    ballX=PAD_X_R-BALL_R;
    sndHit();spawnParticles(ballX,ballY,COL_AI,6);
    shakeMag=Math.abs(hp)*3+1.5;
  }

  // Scoring
  if(ballX<0){aiScore++;sndScore();spawnParticles(0,ballY,COL_AI,10);checkWin();resetBall(1)}
  if(ballX>GW){playerScore++;sndScore();spawnParticles(GW,ballY,COL_PLAYER,10);checkWin();resetBall(-1)}

  // Shake decay
  if(shakeMag>0){
    shakeX=(Math.random()-0.5)*shakeMag;shakeY=(Math.random()-0.5)*shakeMag;
    shakeMag*=0.82;if(shakeMag<0.25)shakeMag=0;
  }else{shakeX=0;shakeY=0}

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=0.028*dt;
    if(p.life<=0)particles.splice(i,1);
  }
  for(const t of trail)t.life-=0.055*dt;
}

function checkWin(){
  if(playerScore>=WINNING_SCORE||aiScore>=WINNING_SCORE){
    gameState='ended';
    document.getElementById('winner-text').textContent=playerScore>=WINNING_SCORE?'YOU WIN!':'AI WINS!';
    showScreen('end-screen');sndWin();
  }
}

// ===== RENDERING =====
function draw(){
  ctx.save();
  ctx.setTransform(scale,0,0,scale,shakeX*scale,shakeY*scale);

  // Background gradient
  const bgGrad=ctx.createLinearGradient(0,0,0,GH);
  bgGrad.addColorStop(0,COL_BG1);bgGrad.addColorStop(1,COL_BG2);
  ctx.fillStyle=bgGrad;ctx.fillRect(0,0,GW,GH);

  // Subtle grid
  ctx.strokeStyle='rgba(255,255,255,0.015)';ctx.lineWidth=1;
  for(let i=0;i<GW;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,GH);ctx.stroke()}
  for(let i=0;i<GH;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(GW,i);ctx.stroke()}

  // Center line
  ctx.setLineDash([8,12]);ctx.strokeStyle=COL_LINE;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(400,0);ctx.lineTo(400,GH);ctx.stroke();
  ctx.setLineDash([]);

  // Center circle
  ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(400,300,60,0,Math.PI*2);ctx.stroke();

  // Trail
  for(let i=0;i<trail.length;i++){
    const t=trail[i];if(t.life<=0)continue;
    ctx.globalAlpha=t.life*0.2;
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath();ctx.arc(t.x,t.y,BALL_R*t.life*0.7,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Ball soft glow
  const bg=ctx.createRadialGradient(ballX,ballY,0,ballX,ballY,BALL_R*5);
  bg.addColorStop(0,'rgba(255,255,255,0.1)');bg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=bg;ctx.fillRect(ballX-BALL_R*5,ballY-BALL_R*5,BALL_R*10,BALL_R*10);

  // Ball
  ctx.fillStyle=COL_BALL;
  ctx.shadowColor='rgba(255,255,255,0.4)';ctx.shadowBlur=12;
  ctx.beginPath();ctx.arc(ballX,ballY,BALL_R,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // Paddles
  drawPaddle(PAD_X_L,playerY,COL_PLAYER,COL_PLAYER2);
  drawPaddle(PAD_X_R,aiY,COL_AI,COL_AI2);

  // Particles
  for(const p of particles){
    ctx.globalAlpha=p.life*0.7;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Scores
  ctx.font='700 56px Inter,system-ui,sans-serif';ctx.textAlign='center';
  ctx.fillStyle=COL_SCORE_P;ctx.fillText(playerScore,300,72);
  ctx.fillStyle=COL_SCORE_A;ctx.fillText(aiScore,500,72);

  // Score labels
  ctx.font='600 11px Inter,system-ui,sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.1)';ctx.letterSpacing='2px';
  ctx.fillText('YOU',300,92);ctx.fillText('AI',500,92);

  ctx.restore();
}

function drawPaddle(x,y,c1,c2){
  const r=7;
  const g=ctx.createLinearGradient(x,y-PH/2,x,y+PH/2);
  g.addColorStop(0,c1);g.addColorStop(1,c2);
  ctx.fillStyle=g;
  ctx.shadowColor=c1;ctx.shadowBlur=16;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.beginPath();ctx.roundRect(x,y-PH/2,PW,PH,r);ctx.fill();
  ctx.shadowBlur=0;
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
</script>
</body>
</html>`;
