import { useEffect, useRef } from "react";

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create and inject the game
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
    iframe.srcdoc = GAME_HTML;
    container.appendChild(iframe);

    return () => {
      container.removeChild(iframe);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen bg-background overflow-hidden"
    />
  );
};

export default Index;

const GAME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Ping Pong Master</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'Segoe UI',system-ui,sans-serif}
canvas{display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#ui-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none}
.screen{display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;padding:20px}
.screen.active{display:flex}
h1{font-size:clamp(28px,6vw,56px);color:#0ff;text-shadow:0 0 20px #0ff,0 0 40px #0ff,0 0 80px #08f;margin-bottom:8px;letter-spacing:4px;font-weight:900}
.subtitle{font-size:clamp(12px,2.5vw,18px);color:#ff40ff;text-shadow:0 0 10px #ff40ff;margin-bottom:30px;letter-spacing:6px;text-transform:uppercase}
.btn{background:transparent;border:2px solid #0ff;color:#0ff;padding:12px 40px;font-size:clamp(14px,3vw,20px);cursor:pointer;letter-spacing:3px;text-transform:uppercase;transition:all .2s;border-radius:4px;margin:6px;text-shadow:0 0 8px #0ff;font-weight:700}
.btn:hover,.btn:active{background:#0ff;color:#0a0a1a;box-shadow:0 0 30px #0ff;text-shadow:none}
.btn-secondary{border-color:#ff40ff;color:#ff40ff;text-shadow:0 0 8px #ff40ff}
.btn-secondary:hover,.btn-secondary:active{background:#ff40ff;color:#0a0a1a;box-shadow:0 0 30px #ff40ff}
.difficulty-row{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap;justify-content:center}
.diff-btn{padding:8px 20px;font-size:clamp(11px,2vw,14px)}
.diff-btn.selected{background:#0ff;color:#0a0a1a;text-shadow:none}
.winner-text{font-size:clamp(20px,5vw,40px);color:#ffe04a;text-shadow:0 0 20px #ffe04a,0 0 40px #ffe04a;margin-bottom:20px;font-weight:900}
.controls-hint{font-size:clamp(10px,1.8vw,13px);color:rgba(0,255,255,0.4);margin-top:20px;line-height:1.6}
#pause-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(24px,5vw,48px);color:#0ff;text-shadow:0 0 20px #0ff,0 0 40px #0ff;letter-spacing:8px;display:none;z-index:20;font-weight:900}
</style>
</head>
<body>
<canvas id="gc"></canvas>
<div id="pause-text">PAUSED</div>
<div id="ui-overlay">
  <div class="screen active" id="start-screen">
    <h1>PING PONG</h1>
    <div class="subtitle">Master</div>
    <div class="difficulty-row">
      <button class="btn diff-btn" data-diff="0">Easy</button>
      <button class="btn diff-btn selected" data-diff="1">Medium</button>
      <button class="btn diff-btn" data-diff="2">Hard</button>
    </div>
    <button class="btn" id="play-btn">PLAY</button>
    <div class="controls-hint">Mouse / Touch to move paddle<br>P to pause</div>
  </div>
  <div class="screen" id="end-screen">
    <div class="winner-text" id="winner-text"></div>
    <button class="btn" id="restart-btn">PLAY AGAIN</button>
    <button class="btn btn-secondary" id="menu-btn">MENU</button>
  </div>
</div>

<script>
// ===== AUDIO SYSTEM (Web Audio API) =====
const AudioCtx=window.AudioContext||window.webkitAudioContext;
let actx=null;
function initAudio(){if(!actx)actx=new AudioCtx()}
function playTone(freq,dur,type,vol){
  if(!actx)return;
  const o=actx.createOscillator(),g=actx.createGain();
  o.type=type||'square';o.frequency.value=freq;
  g.gain.setValueAtTime(vol||0.08,actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+dur);
  o.connect(g);g.connect(actx.destination);
  o.start();o.stop(actx.currentTime+dur);
}
function sndHit(){playTone(440,0.08,'square',0.06)}
function sndWall(){playTone(220,0.06,'triangle',0.04)}
function sndScore(){playTone(660,0.15,'sine',0.07);setTimeout(()=>playTone(880,0.15,'sine',0.05),100)}
function sndWin(){playTone(523,0.2,'sine',0.08);setTimeout(()=>playTone(659,0.2,'sine',0.08),150);setTimeout(()=>playTone(784,0.3,'sine',0.08),300)}

// ===== CANVAS SETUP =====
const canvas=document.getElementById('gc');
const ctx=canvas.getContext('2d');
let W,H,scale;

function resize(){
  const ar=4/3;
  const vw=window.innerWidth,vh=window.innerHeight;
  if(vw/vh>ar){H=vh;W=H*ar}else{W=vw;H=W/ar}
  W=Math.floor(W);H=Math.floor(H);
  canvas.width=W;canvas.height=H;
  scale=W/800;
}
resize();
window.addEventListener('resize',resize);

// ===== GAME STATE =====
const WINNING_SCORE=10;
let difficulty=1; // 0=easy,1=med,2=hard
const AI_SPEEDS=[3,5.5,9];
const AI_ERRORS=[50,20,3];

let gameState='menu'; // menu,playing,paused,ended
let shakeX=0,shakeY=0,shakeMag=0;
let playerScore=0,aiScore=0;

// Paddle
const PW=12,PH=80;
let playerY,aiY,aiTargetY;

// Ball
let ballX,ballY,ballVX,ballVY,ballSpeed;
const BALL_R=8,BALL_START_SPEED=5,BALL_MAX_SPEED=12,BALL_ACCEL=0.15;

// Trail
const trail=[];
const MAX_TRAIL=12;

// Particles
const particles=[];

function resetBall(dir){
  ballX=400;ballY=300;
  ballSpeed=BALL_START_SPEED;
  const angle=(Math.random()*0.8-0.4);
  ballVX=Math.cos(angle)*ballSpeed*(dir||1);
  ballVY=Math.sin(angle)*ballSpeed;
  trail.length=0;
}

function resetGame(){
  playerScore=0;aiScore=0;
  playerY=300;aiY=300;aiTargetY=300;
  resetBall(1);
  particles.length=0;
  shakeMag=0;
}

// ===== CONTROLS =====
let mouseY=300;
let touchActive=false;

canvas.addEventListener('mousemove',e=>{
  const rect=canvas.getBoundingClientRect();
  mouseY=((e.clientY-rect.top)/rect.height)*600;
});

canvas.addEventListener('touchstart',e=>{e.preventDefault();touchActive=true;initAudio();
  const rect=canvas.getBoundingClientRect();
  mouseY=((e.touches[0].clientY-rect.top)/rect.height)*600;
},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  mouseY=((e.touches[0].clientY-rect.top)/rect.height)*600;
},{passive:false});
canvas.addEventListener('touchend',()=>{touchActive=false});

document.addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P'){
    if(gameState==='playing'){gameState='paused';document.getElementById('pause-text').style.display='block'}
    else if(gameState==='paused'){gameState='playing';document.getElementById('pause-text').style.display='none'}
  }
});

// ===== PARTICLES =====
function spawnParticles(x,y,color,count){
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=Math.random()*3+1;
    particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,color,size:Math.random()*3+1});
  }
}

// ===== AI LOGIC =====
function updateAI(dt){
  const spd=AI_SPEEDS[difficulty]*dt;
  const err=AI_ERRORS[difficulty];
  // Predict ball position with some error
  if(ballVX>0){
    const timeToReach=(760-ballX)/Math.abs(ballVX);
    aiTargetY=ballY+ballVY*timeToReach+(Math.random()-0.5)*err;
  }
  // Smooth movement
  const diff=aiTargetY-aiY;
  if(Math.abs(diff)>2){
    aiY+=Math.sign(diff)*Math.min(Math.abs(diff),spd);
  }
  aiY=Math.max(PH/2,Math.min(600-PH/2,aiY));
}

// ===== PHYSICS =====
function update(dt){
  if(gameState!=='playing')return;

  // Player paddle
  playerY+=(mouseY-playerY)*0.15*dt;
  playerY=Math.max(PH/2,Math.min(600-PH/2,playerY));

  // AI
  updateAI(dt);

  // Ball movement
  ballX+=ballVX*dt;
  ballY+=ballVY*dt;

  // Trail
  trail.push({x:ballX,y:ballY,life:1});
  if(trail.length>MAX_TRAIL)trail.shift();

  // Wall bounce (top/bottom)
  if(ballY-BALL_R<0){ballY=BALL_R;ballVY=-ballVY;sndWall();spawnParticles(ballX,0,'#0ff',5)}
  if(ballY+BALL_R>600){ballY=600-BALL_R;ballVY=-ballVY;sndWall();spawnParticles(ballX,600,'#0ff',5)}

  // Player paddle collision (left)
  if(ballVX<0&&ballX-BALL_R<40+PW&&ballX-BALL_R>30&&ballY>playerY-PH/2-BALL_R&&ballY<playerY+PH/2+BALL_R){
    const hitPos=(ballY-playerY)/(PH/2); // -1 to 1
    ballSpeed=Math.min(ballSpeed+BALL_ACCEL,BALL_MAX_SPEED);
    const angle=hitPos*Math.PI/3;
    ballVX=Math.cos(angle)*ballSpeed;
    ballVY=Math.sin(angle)*ballSpeed;
    ballX=40+PW+BALL_R;
    sndHit();
    spawnParticles(ballX,ballY,'#0ff',8);
    shakeMag=Math.abs(hitPos)*4+2;
  }

  // AI paddle collision (right)
  if(ballVX>0&&ballX+BALL_R>760-PW&&ballX+BALL_R<770&&ballY>aiY-PH/2-BALL_R&&ballY<aiY+PH/2+BALL_R){
    const hitPos=(ballY-aiY)/(PH/2);
    ballSpeed=Math.min(ballSpeed+BALL_ACCEL,BALL_MAX_SPEED);
    const angle=Math.PI-hitPos*Math.PI/3;
    ballVX=Math.cos(angle)*ballSpeed;
    ballVY=Math.sin(angle)*ballSpeed;
    ballX=760-PW-BALL_R;
    sndHit();
    spawnParticles(ballX,ballY,'#ff40ff',8);
    shakeMag=Math.abs(hitPos)*4+2;
  }

  // Scoring
  if(ballX<0){aiScore++;sndScore();spawnParticles(0,ballY,'#ff40ff',15);checkWin();resetBall(1)}
  if(ballX>800){playerScore++;sndScore();spawnParticles(800,ballY,'#0ff',15);checkWin();resetBall(-1)}

  // Screen shake decay
  if(shakeMag>0){
    shakeX=(Math.random()-0.5)*shakeMag;
    shakeY=(Math.random()-0.5)*shakeMag;
    shakeMag*=0.85;
    if(shakeMag<0.3)shakeMag=0;
  }else{shakeX=0;shakeY=0}

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=0.03*dt;
    if(p.life<=0)particles.splice(i,1);
  }

  // Trail decay
  for(const t of trail)t.life-=0.06*dt;
}

function checkWin(){
  if(playerScore>=WINNING_SCORE||aiScore>=WINNING_SCORE){
    gameState='ended';
    const winner=playerScore>=WINNING_SCORE?'YOU WIN!':'AI WINS!';
    document.getElementById('winner-text').textContent=winner;
    showScreen('end-screen');
    sndWin();
  }
}

// ===== RENDERING =====
function draw(){
  ctx.save();
  ctx.setTransform(scale,0,0,scale,shakeX*scale,shakeY*scale);

  // Background
  ctx.fillStyle='#0a0a1a';
  ctx.fillRect(0,0,800,600);

  // Center line
  ctx.setLineDash([10,10]);
  ctx.strokeStyle='rgba(0,255,255,0.12)';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(400,0);ctx.lineTo(400,600);ctx.stroke();
  ctx.setLineDash([]);

  // Trail
  for(let i=0;i<trail.length;i++){
    const t=trail[i];
    if(t.life<=0)continue;
    const a=t.life*0.4;
    ctx.fillStyle='rgba(0,255,255,'+a+')';
    ctx.beginPath();ctx.arc(t.x,t.y,BALL_R*t.life,0,Math.PI*2);ctx.fill();
  }

  // Ball glow
  const grd=ctx.createRadialGradient(ballX,ballY,0,ballX,ballY,BALL_R*4);
  grd.addColorStop(0,'rgba(0,255,255,0.3)');
  grd.addColorStop(1,'rgba(0,255,255,0)');
  ctx.fillStyle=grd;
  ctx.fillRect(ballX-BALL_R*4,ballY-BALL_R*4,BALL_R*8,BALL_R*8);

  // Ball
  ctx.fillStyle='#0ff';
  ctx.shadowColor='#0ff';ctx.shadowBlur=15;
  ctx.beginPath();ctx.arc(ballX,ballY,BALL_R,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // Player paddle glow
  drawPaddle(40,playerY,'#0ff');
  // AI paddle glow
  drawPaddle(760-PW,aiY,'#ff40ff');

  // Particles
  for(const p of particles){
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  }
  ctx.globalAlpha=1;

  // Score
  ctx.font='bold 60px monospace';
  ctx.textAlign='center';
  ctx.fillStyle='rgba(0,255,255,0.25)';
  ctx.shadowColor='#0ff';ctx.shadowBlur=10;
  ctx.fillText(playerScore,300,70);
  ctx.fillStyle='rgba(255,64,255,0.25)';
  ctx.shadowColor='#ff40ff';
  ctx.fillText(aiScore,500,70);
  ctx.shadowBlur=0;

  ctx.restore();
}

function drawPaddle(x,y,color){
  ctx.fillStyle=color;
  ctx.shadowColor=color;ctx.shadowBlur=20;
  const r=4;
  ctx.beginPath();
  ctx.roundRect(x,y-PH/2,PW,PH,r);
  ctx.fill();
  ctx.shadowBlur=0;
  // Extra glow layer
  ctx.fillStyle=color.replace(')',',0.15)').replace('rgb','rgba').replace('#','');
  // Simpler glow
  ctx.save();
  ctx.globalAlpha=0.1;
  ctx.fillStyle=color;
  ctx.fillRect(x-8,y-PH/2-8,PW+16,PH+16);
  ctx.globalAlpha=1;
  ctx.restore();
}

// ===== UI =====
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  if(id)document.getElementById(id).classList.add('active');
}

document.getElementById('play-btn').addEventListener('click',()=>{initAudio();startGame()});
document.getElementById('restart-btn').addEventListener('click',()=>{initAudio();startGame()});
document.getElementById('menu-btn').addEventListener('click',()=>{showScreen('start-screen');gameState='menu'});

// Difficulty buttons
document.querySelectorAll('.diff-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    difficulty=parseInt(btn.dataset.diff);
  });
});

function startGame(){
  resetGame();
  gameState='playing';
  showScreen(null);
  document.getElementById('pause-text').style.display='none';
}

// ===== GAME LOOP =====
let lastTime=0;
function loop(time){
  const rawDt=(time-lastTime)/16.67; // normalize to ~60fps
  const dt=Math.min(rawDt,3); // cap delta
  lastTime=time;

  if(gameState==='playing')update(dt);
  if(gameState==='playing'||gameState==='paused')draw();

  requestAnimationFrame(loop);
}
requestAnimationFrame(t=>{lastTime=t;requestAnimationFrame(loop)});
</script>
</body>
</html>`;
