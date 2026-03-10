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
body{background:#e8b730;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'Nunito',sans-serif}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:24px}
.screen.active{display:flex}

h1{
  font-family:'Fredoka One',cursive;
  font-size:clamp(36px,9vw,60px);
  color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,0.15);
  margin-bottom:4px;
}
.subtitle{
  font-size:clamp(12px,2.5vw,16px);
  color:rgba(255,255,255,0.7);
  margin-bottom:24px;letter-spacing:3px;text-transform:uppercase;font-weight:700;
}

.btn{
  background:#fff;border:none;color:#e8b730;padding:14px 48px;
  font-size:clamp(14px,3vw,18px);cursor:pointer;
  letter-spacing:2px;text-transform:uppercase;
  border-radius:50px;margin:6px;font-weight:800;
  box-shadow:0 4px 15px rgba(0,0,0,0.15);
  transition:all .2s ease;font-family:inherit;
}
.btn:hover,.btn:active{transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,0.2)}

.btn-secondary{
  background:rgba(255,255,255,0.2);color:#fff;
  box-shadow:0 4px 12px rgba(0,0,0,0.1);
}
.btn-secondary:hover,.btn-secondary:active{background:rgba(255,255,255,0.3)}

.difficulty-row{display:flex;gap:8px;margin:14px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{
  padding:10px 24px;font-size:clamp(11px,2vw,14px);
  background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3);
  color:rgba(255,255,255,0.8);border-radius:50px;
  box-shadow:none;font-family:inherit;
}
.diff-btn:hover{background:rgba(255,255,255,0.3);box-shadow:none}
.diff-btn.selected{
  background:#fff;border-color:#fff;color:#e8b730;
  box-shadow:0 3px 12px rgba(0,0,0,0.15);
}

.winner-text{
  font-family:'Fredoka One',cursive;
  font-size:clamp(28px,7vw,48px);
  color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,0.15);
  margin-bottom:20px;
}

.controls-hint{font-size:clamp(9px,1.8vw,12px);color:rgba(255,255,255,0.5);margin-top:18px;line-height:1.7;font-weight:600}

#pause-text{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  font-family:'Fredoka One',cursive;
  font-size:clamp(30px,7vw,56px);
  color:rgba(255,255,255,0.6);letter-spacing:8px;display:none;z-index:20;
  text-shadow:3px 3px 0 rgba(0,0,0,0.1);
}
</style>
</head>
<body>
<canvas id="gc"></canvas>
<div id="pause-text">PAUSED</div>
<div id="ui-overlay">
  <div class="screen active" id="start-screen">
    <h1>🏓 PING PONG</h1>
    <div class="subtitle">M A S T E R</div>
    <div class="difficulty-row">
      <button class="btn diff-btn" data-diff="0">Easy</button>
      <button class="btn diff-btn selected" data-diff="1">Medium</button>
      <button class="btn diff-btn" data-diff="2">Hard</button>
    </div>
    <button class="btn" id="play-btn">PLAY</button>
    <div class="controls-hint">Drag to move paddle anywhere &middot; P to pause</div>
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
  const ar=9/16,vw=window.innerWidth,vh=window.innerHeight;
  if(vw/vh>ar){H=vh;W=H*ar}else{W=vw;H=W/ar}
  W=Math.floor(W);H=Math.floor(H);
  canvas.width=W;canvas.height=H;scale=W/450;
}
resize();
window.addEventListener('resize',resize);

// ===== CONSTANTS =====
const GW=450,GH=800,WINNING_SCORE=10;
const PW=70,PH=14,BALL_R=10,BALL_START=5,BALL_MAX=12,BALL_ACCEL=0.15;

// Table boundaries (wide but short-ish)
const TBL_L=25,TBL_R=GW-25,TBL_T=80,TBL_B=GH-80;
const TBL_MID=(TBL_T+TBL_B)/2;

// ===== COLORS =====
const COL_BG='#e8b730';
const COL_TABLE='#e87d5a';
const COL_BORDER='#1a1a1a';
const COL_SHADOW='rgba(0,0,0,0.18)';
const COL_SCORE='rgba(255,230,200,0.3)';

// ===== STATE =====
let difficulty=1;
const AI_SPEEDS=[2.5,4.5,8],AI_ERRORS=[55,20,4];
let gameState='menu',shakeX=0,shakeY=0,shakeMag=0;
let playerScore=0,aiScore=0;

// Paddles: free movement in their half
let playerX=GW/2,playerY=TBL_B-60;
let aiX=GW/2,aiY=TBL_T+60,aiTargetX=GW/2,aiTargetY=TBL_T+60;

let ballX,ballY,ballVX,ballVY,ballSpeed;
let ballInAir=false; // ball is travelling over the net
const trail=[],MAX_TRAIL=12;
const particles=[];

function resetBall(dir){
  ballX=GW/2;ballY=TBL_MID;ballSpeed=BALL_START;
  const a=(Math.random()*0.5-0.25);
  ballVY=Math.cos(a)*ballSpeed*(dir||1);
  ballVX=Math.sin(a)*ballSpeed;
  trail.length=0;ballInAir=false;
}
function resetGame(){
  playerScore=0;aiScore=0;
  playerX=GW/2;playerY=TBL_B-60;
  aiX=GW/2;aiY=TBL_T+60;aiTargetX=GW/2;aiTargetY=TBL_T+60;
  resetBall(1);particles.length=0;shakeMag=0;
}

// ===== CONTROLS (both X and Y) =====
let mouseX=GW/2,mouseY=TBL_B-60;
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  mouseX=((e.clientX-r.left)/r.width)*GW;
  mouseY=((e.clientY-r.top)/r.height)*GH;
});
canvas.addEventListener('touchstart',e=>{e.preventDefault();initAudio();
  const r=canvas.getBoundingClientRect();
  mouseX=((e.touches[0].clientX-r.left)/r.width)*GW;
  mouseY=((e.touches[0].clientY-r.top)/r.height)*GH;
},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();
  const r=canvas.getBoundingClientRect();
  mouseX=((e.touches[0].clientX-r.left)/r.width)*GW;
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
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color,size:Math.random()*3+1.5});
  }
}

// ===== AI =====
function updateAI(dt){
  const spd=AI_SPEEDS[difficulty]*dt,err=AI_ERRORS[difficulty];
  // Predict where ball will arrive
  if(ballVY<0){
    const timeToReach=(aiY-ballY)/Math.max(Math.abs(ballVY),0.5);
    aiTargetX=ballX+ballVX*timeToReach+(Math.random()-0.5)*err;
    // Move forward/back to intercept
    aiTargetY=Math.max(TBL_T+20,Math.min(TBL_MID-30, TBL_T+40+Math.abs(ballVY)*3));
  } else {
    // Ball going away, return to center-ish
    aiTargetX=GW/2+(Math.random()-0.5)*30;
    aiTargetY=TBL_T+70;
  }

  const dx=aiTargetX-aiX,dy=aiTargetY-aiY;
  if(Math.abs(dx)>2)aiX+=Math.sign(dx)*Math.min(Math.abs(dx),spd);
  if(Math.abs(dy)>2)aiY+=Math.sign(dy)*Math.min(Math.abs(dy),spd*0.7);
  aiX=Math.max(TBL_L+PW/2,Math.min(TBL_R-PW/2,aiX));
  aiY=Math.max(TBL_T+15,Math.min(TBL_MID-20,aiY));
}

// ===== PHYSICS =====
function update(dt){
  if(gameState!=='playing')return;

  // Player moves freely in bottom half
  playerX+=(mouseX-playerX)*0.18*dt;
  playerY+=(mouseY-playerY)*0.18*dt;
  playerX=Math.max(TBL_L+PW/2,Math.min(TBL_R-PW/2,playerX));
  playerY=Math.max(TBL_MID+20,Math.min(TBL_B-15,playerY));

  updateAI(dt);

  ballX+=ballVX*dt;
  ballY+=ballVY*dt;

  // Trail
  trail.push({x:ballX,y:ballY,life:1});
  if(trail.length>MAX_TRAIL)trail.shift();

  // Wall bounce (left/right sides of table)
  if(ballX-BALL_R<TBL_L){ballX=TBL_L+BALL_R;ballVX=-ballVX;sndWall();spawnParticles(TBL_L,ballY,'rgba(255,255,255,0.6)',4)}
  if(ballX+BALL_R>TBL_R){ballX=TBL_R-BALL_R;ballVX=-ballVX;sndWall();spawnParticles(TBL_R,ballY,'rgba(255,255,255,0.6)',4)}

  // Player paddle collision (bottom half)
  if(ballVY>0&&ballY+BALL_R>playerY-PH/2&&ballY<playerY+PH/2&&ballX>playerX-PW/2-BALL_R&&ballX<playerX+PW/2+BALL_R){
    const hp=(ballX-playerX)/(PW/2);
    ballSpeed=Math.min(ballSpeed+BALL_ACCEL,BALL_MAX);
    const ang=hp*Math.PI/4;
    ballVX=Math.sin(ang)*ballSpeed;
    ballVY=-Math.cos(ang)*ballSpeed;
    ballY=playerY-PH/2-BALL_R;
    sndHit();spawnParticles(ballX,ballY,'#e84878',8);
    shakeMag=Math.abs(hp)*2+1;
  }

  // AI paddle collision (top half)
  if(ballVY<0&&ballY-BALL_R<aiY+PH/2&&ballY>aiY-PH/2&&ballX>aiX-PW/2-BALL_R&&ballX<aiX+PW/2+BALL_R){
    const hp=(ballX-aiX)/(PW/2);
    ballSpeed=Math.min(ballSpeed+BALL_ACCEL,BALL_MAX);
    const ang=hp*Math.PI/4;
    ballVX=Math.sin(ang)*ballSpeed;
    ballVY=Math.cos(ang)*ballSpeed;
    ballY=aiY+PH/2+BALL_R;
    sndHit();spawnParticles(ballX,ballY,'#2ab89e',8);
    shakeMag=Math.abs(hp)*2+1;
  }

  // Scoring: ball goes past top = player scores, past bottom = AI scores
  if(ballY<TBL_T-30){
    playerScore++;sndScore();spawnParticles(ballX,TBL_T,'#e84878',12);
    checkWin();resetBall(1);
  }
  if(ballY>TBL_B+30){
    aiScore++;sndScore();spawnParticles(ballX,TBL_B,'#2ab89e',12);
    checkWin();resetBall(-1);
  }

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
  for(const t of trail)t.life-=0.06*dt;
}

function checkWin(){
  if(playerScore>=WINNING_SCORE||aiScore>=WINNING_SCORE){
    gameState='ended';
    document.getElementById('winner-text').textContent=playerScore>=WINNING_SCORE?'🎉 YOU WIN!':'🤖 AI WINS!';
    showScreen('end-screen');sndWin();
  }
}

// ===== RENDERING =====
function draw(){
  ctx.save();
  ctx.setTransform(scale,0,0,scale,shakeX*scale,shakeY*scale);

  // Yellow background
  ctx.fillStyle=COL_BG;
  ctx.fillRect(0,0,GW,GH);

  // Table border (black)
  const bp=7;
  ctx.fillStyle=COL_BORDER;
  ctx.beginPath();ctx.roundRect(TBL_L-bp,TBL_T-bp,TBL_R-TBL_L+bp*2,TBL_B-TBL_T+bp*2,14);ctx.fill();

  // Table surface (orange)
  ctx.fillStyle=COL_TABLE;
  ctx.beginPath();ctx.roundRect(TBL_L,TBL_T,TBL_R-TBL_L,TBL_B-TBL_T,8);ctx.fill();

  // Center line (vertical, subtle)
  ctx.fillStyle='rgba(255,220,190,0.22)';
  ctx.fillRect(GW/2-2,TBL_T,4,TBL_B-TBL_T);

  // Net (horizontal white bar at middle)
  ctx.fillStyle='#fff';
  ctx.shadowColor='rgba(0,0,0,0.12)';ctx.shadowBlur=8;ctx.shadowOffsetY=2;
  ctx.fillRect(TBL_L-6,TBL_MID-4,(TBL_R-TBL_L)+12,8);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;

  // Scores on each half
  ctx.font='800 72px Fredoka One,Nunito,sans-serif';ctx.textAlign='center';
  ctx.fillStyle=COL_SCORE;
  ctx.fillText(aiScore,GW/2,TBL_MID-80);
  ctx.fillText(playerScore,GW/2,TBL_MID+100);

  // Labels
  ctx.font='700 13px Nunito,sans-serif';
  ctx.fillStyle='rgba(255,220,190,0.2)';
  ctx.fillText('AI',GW/2,TBL_T+22);
  ctx.fillText('YOU',GW/2,TBL_B-10);

  // Trail
  for(let i=0;i<trail.length;i++){
    const t=trail[i];if(t.life<=0)continue;
    ctx.globalAlpha=t.life*0.12;
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath();ctx.arc(t.x,t.y,BALL_R*t.life*0.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Ball shadow
  ctx.fillStyle=COL_SHADOW;
  ctx.beginPath();ctx.ellipse(ballX+3,ballY+5,BALL_R*0.9,BALL_R*0.6,0,0,Math.PI*2);ctx.fill();

  // Ball
  const bg=ctx.createRadialGradient(ballX-2,ballY-2,1,ballX,ballY,BALL_R);
  bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#ddd');
  ctx.fillStyle=bg;
  ctx.beginPath();ctx.arc(ballX,ballY,BALL_R,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.1)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(ballX,ballY,BALL_R,0,Math.PI*2);ctx.stroke();

  // Paddles (rackets)
  drawRacket(playerX,playerY,'#e84878','#c73060',false);
  drawRacket(aiX,aiY,'#2ab89e','#1e9a82',true);

  // Particles
  for(const p of particles){
    ctx.globalAlpha=p.life*0.7;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  ctx.restore();
}

function drawRacket(x,y,c1,c2,isTop){
  const rw=PW,rh=PH+10,r=10;
  const ry=y-rh/2;

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.13)';
  ctx.beginPath();ctx.roundRect(x-rw/2+3,ry+4,rw,rh,r);ctx.fill();

  // Racket face
  const g=ctx.createLinearGradient(x-rw/2,ry,x+rw/2,ry+rh);
  g.addColorStop(0,c1);g.addColorStop(1,c2);
  ctx.fillStyle=g;
  ctx.beginPath();ctx.roundRect(x-rw/2,ry,rw,rh,r);ctx.fill();

  // Edge highlight
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(x-rw/2,ry,rw,rh,r);ctx.stroke();

  // Handle
  const hw=8,hh=16;
  const hx=isTop?x+rw/2+2:x+rw/2+2;
  const hy=y-hh/2;
  ctx.fillStyle='#8B5E3C';
  ctx.beginPath();ctx.roundRect(hx,hy,hw,hh,3);ctx.fill();
  ctx.fillStyle='#6B4226';
  ctx.beginPath();ctx.roundRect(hx+2,hy+1,hw-4,hh-2,2);ctx.fill();
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
