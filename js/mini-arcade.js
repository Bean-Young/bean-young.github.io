document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('signalDropCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const panel = document.getElementById('signalDropPanel');
  const isZh = document.documentElement.lang.startsWith('zh');
  const startScreen = document.getElementById('signalStartScreen');
  const pauseScreen = document.getElementById('signalPauseScreen');
  const endScreen = document.getElementById('signalEndScreen');
  const hud = document.getElementById('signalHud');
  const startBtn = document.getElementById('signalStartBtn');
  const restartBtn = document.getElementById('signalRestartBtn');
  const pauseBtn = document.getElementById('signalPauseBtn');
  const resumeBtn = document.getElementById('signalResumeBtn');
  const scoreDisplay = document.getElementById('signalScore');
  const gatesDisplay = document.getElementById('signalGates');
  const timeDisplay = document.getElementById('signalTime');
  const finalScoreDisplay = document.getElementById('signalFinalScore');
  const finalGatesDisplay = document.getElementById('signalGatesPassed');
  const message = document.getElementById('signalMessage');

  let messageTimer = null;
  let animationFrame = null;
  let lastTimestamp = 0;
  let state = { running: false, paused: false, score: 0, passed: 0, time: 0 };
  let ball = null;
  let gates = [];
  let guide = { x: 0 };
  const keys = { left: false, right: false };

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function resetBoard() {
    const width = canvas.width;
    const height = canvas.height;
    guide.x = width / 2;
    ball = { x: width / 2, y: 36, vx: 0, vy: 0, radius: Math.max(8, Math.round(width / 72)) };
    const gateWidth = Math.max(84, Math.min(168, width * 0.2));
    gates = [
      { y: height * 0.28, x: width * 0.18, width: gateWidth, multiplier: 2, passed: false, hit: false },
      { y: height * 0.51, x: width * 0.56, width: gateWidth, multiplier: 3, passed: false, hit: false },
      { y: height * 0.74, x: width * 0.34, width: gateWidth, multiplier: 4, passed: false, hit: false }
    ];
  }

  function resize() {
    const width = Math.max(320, Math.floor(panel.clientWidth || canvas.parentElement.clientWidth || 760));
    canvas.width = width;
    canvas.height = width <= 430 ? Math.max(320, width) : Math.min(400, Math.round(width / 2));
    canvas.style.setProperty('height', `${canvas.height}px`, 'important');
    if (!ball || !state.running) resetBoard();
    draw();
  }

  function draw() {
    const width = canvas.width;
    const height = canvas.height;
    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, '#12243b');
    background.addColorStop(1, '#08111f');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(103, 211, 231, 0.09)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    gates.forEach((gate) => {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(24, gate.y);
      ctx.lineTo(width - 24, gate.y);
      ctx.stroke();

      const gateColor = gate.hit ? '#65d39a' : 'rgba(103, 211, 231, 0.72)';
      ctx.fillStyle = gate.hit ? 'rgba(101, 211, 154, 0.23)' : 'rgba(103, 211, 231, 0.16)';
      roundedRect(gate.x, gate.y - 12, gate.width, 24, 6);
      ctx.fill();
      ctx.strokeStyle = gateColor;
      ctx.lineWidth = 2;
      roundedRect(gate.x, gate.y - 12, gate.width, 24, 6);
      ctx.stroke();
      ctx.fillStyle = gateColor;
      ctx.font = '700 12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${gate.multiplier}`, gate.x + gate.width / 2, gate.y);
    });

    const guideY = height - 32;
    const guideWidth = Math.max(86, Math.min(150, width * 0.18));
    const guideX = Math.max(18 + guideWidth / 2, Math.min(width - 18 - guideWidth / 2, guide.x));
    const guideGradient = ctx.createLinearGradient(guideX - guideWidth / 2, guideY, guideX + guideWidth / 2, guideY);
    guideGradient.addColorStop(0, '#3183d4');
    guideGradient.addColorStop(0.5, '#67d3e7');
    guideGradient.addColorStop(1, '#3183d4');
    ctx.strokeStyle = guideGradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(guideX - guideWidth / 2, guideY);
    ctx.lineTo(guideX + guideWidth / 2, guideY);
    ctx.stroke();
    ctx.lineCap = 'butt';

    if (!ball) return;
    const glow = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, ball.radius * 2.6);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.35, 'rgba(103, 211, 231, 0.98)');
    glow.addColorStop(1, 'rgba(103, 211, 231, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9fbff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#67d3e7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  function updateHud() {
    scoreDisplay.textContent = state.score;
    gatesDisplay.textContent = `${state.passed}/3`;
    timeDisplay.textContent = `${Math.floor(state.time)}${isZh ? '秒' : 's'}`;
  }

  function showMessage(text, color) {
    window.clearTimeout(messageTimer);
    message.textContent = text;
    message.style.borderColor = `${color}88`;
    message.classList.add('is-visible');
    messageTimer = window.setTimeout(() => message.classList.remove('is-visible'), 850);
  }

  function startGame() {
    resetBoard();
    state = { running: true, paused: false, score: 0, passed: 0, time: 0 };
    startScreen.hidden = true;
    pauseScreen.hidden = true;
    endScreen.hidden = true;
    hud.hidden = false;
    updateHud();
    lastTimestamp = performance.now();
    canvas.focus({ preventScroll: true });
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(loop);
  }

  function setPaused(paused) {
    if (!state.running || state.paused === paused) return;
    state.paused = paused;
    pauseScreen.hidden = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    if (paused) resumeBtn.focus({ preventScroll: true });
    else {
      lastTimestamp = performance.now();
      canvas.focus({ preventScroll: true });
    }
  }

  function endGame() {
    state.running = false;
    finalScoreDisplay.textContent = state.score;
    finalGatesDisplay.textContent = state.passed;
    hud.hidden = true;
    endScreen.hidden = false;
    message.classList.remove('is-visible');
    restartBtn.focus({ preventScroll: true });
  }

  function loop(timestamp) {
    if (!state.running) return;
    if (state.paused) {
      lastTimestamp = timestamp;
      animationFrame = requestAnimationFrame(loop);
      return;
    }

    const delta = Math.min(40, timestamp - lastTimestamp);
    lastTimestamp = timestamp;
    state.time += delta / 1000;
    const guideSpeed = Math.max(0.24, canvas.width / 2800) * delta;
    if (keys.left) guide.x -= guideSpeed;
    if (keys.right) guide.x += guideSpeed;
    guide.x = Math.max(30, Math.min(canvas.width - 30, guide.x));

    ball.vy += 0.00062 * delta;
    ball.vx += (guide.x - ball.x) * 0.000025 * delta;
    ball.vx *= 0.996;
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;
    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
      ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
      ball.vx *= -0.72;
    }

    gates.forEach((gate) => {
      if (gate.passed || ball.y < gate.y - ball.radius) return;
      gate.passed = true;
      if (ball.x >= gate.x && ball.x <= gate.x + gate.width) {
        gate.hit = true;
        state.passed += 1;
        state.score += gate.multiplier * 100;
        showMessage(`+${gate.multiplier * 100}`, '#65d39a');
      } else {
        showMessage(isZh ? '信号偏移' : 'Signal drift', '#f4c95d');
      }
    });

    if (ball.y > canvas.height + ball.radius) endGame();
    updateHud();
    draw();
    if (state.running) animationFrame = requestAnimationFrame(loop);
  }

  function moveGuide(event) {
    const rect = canvas.getBoundingClientRect();
    guide.x = Math.max(30, Math.min(canvas.width - 30, (event.clientX - rect.left) * canvas.width / rect.width));
  }

  canvas.addEventListener('pointermove', (event) => {
    if (!state.running || state.paused) return;
    moveGuide(event);
  });
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (!state.running || state.paused) return;
    moveGuide(event);
  });
  window.addEventListener('keydown', (event) => {
    if (!state.running || panel.hidden) return;
    if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      setPaused(!state.paused);
    } else if (!state.paused && event.key === 'ArrowLeft') {
      keys.left = true;
      event.preventDefault();
    } else if (!state.paused && event.key === 'ArrowRight') {
      keys.right = true;
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') keys.left = false;
    if (event.key === 'ArrowRight') keys.right = false;
  });
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', () => setPaused(true));
  resumeBtn.addEventListener('click', () => setPaused(false));
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
  });

  window.signalDropGame = { pause: () => setPaused(true), resize };

  const choices = Array.from(document.querySelectorAll('[data-game-choice]'));
  const panels = {
    defense: document.getElementById('codeDefensePanel'),
    signal: panel
  };

  function activateGame(game) {
    const isSignal = game === 'signal';
    window.codeDefenseBattle?.pause();
    window.signalDropGame?.pause();
    panels.defense.hidden = isSignal;
    panels.signal.hidden = !isSignal;
    choices.forEach((choice) => {
      const active = choice.dataset.gameChoice === game;
      choice.classList.toggle('is-active', active);
      choice.setAttribute('aria-selected', String(active));
      choice.tabIndex = active ? 0 : -1;
    });
    if (isSignal) requestAnimationFrame(resize);
    else requestAnimationFrame(() => window.codeDefenseBattle?.resize());
  }

  choices.forEach((choice) => {
    choice.addEventListener('click', () => activateGame(choice.dataset.gameChoice));
  });
  resize();
});
