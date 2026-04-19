/* Wait for fonts before running any canvas draws */
document.fonts.ready.then(() => {
  initSnake();
  initPong();
  initTTT();
});

/* Hangman and Math Blitz are DOM-based, init immediately */
initHangman();
initMathBlitz();


/* ══════════════════════════════════════════
   SNAKE
══════════════════════════════════════════ */
function initSnake() {
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  const GRID = 20;
  const COLS = canvas.width / GRID;
  const ROWS = canvas.height / GRID;
  let snake, dir, nextDir, food, score, interval, running, waiting;

  function startSnake() {
    if (interval) clearInterval(interval);
    running = false;
    waiting = true;
    score = 0;
    document.getElementById('snakeScore').textContent = 0;
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++)
        ctx.fillRect(x * GRID + 9, y * GRID + 9, 2, 2);
    ctx.fillStyle = '#3df5b0';
    ctx.font = 'bold 24px Syne';
    ctx.textAlign = 'center';
    ctx.fillText('Press any arrow key to begin', canvas.width / 2, canvas.height / 2);
  }
  window.startSnake = startSnake;

  function launchSnake() {
    waiting = false;
    snake = [{ x: 5, y: 5 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    running = true;
    placeFood();
    interval = setInterval(tickSnake, 100);
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
  }

  function tickSnake() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
      clearInterval(interval);
      running = false;
      drawSnake();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff4d6d';
      ctx.font = 'bold 36px Syne';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 16);
      ctx.fillStyle = '#888';
      ctx.font = '16px Space Mono';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 18);
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      document.getElementById('snakeScore').textContent = score;
      placeFood();
    } else {
      snake.pop();
    }
    drawSnake();
  }

  function drawSnake() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++)
        ctx.fillRect(x * GRID + 9, y * GRID + 9, 2, 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.fillRect(food.x * GRID + 2, food.y * GRID + 2, GRID - 4, GRID - 4);
    ctx.shadowBlur = 0;
    snake.forEach((seg, i) => {
      const t = i / snake.length;
      ctx.fillStyle = i === 0 ? '#3df5b0' : `hsl(${150 - t * 30}, 80%, ${55 - t * 15}%)`;
      ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
    });
  }

  document.addEventListener('keydown', e => {
    const map = {
      'ArrowUp': { x: 0, y: -1 }, 'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 }, 'ArrowRight': { x: 1, y: 0 }
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    if (waiting) { nextDir = d; launchSnake(); return; }
    if (!running) return;
    if (!(d.x === -dir.x && d.y === -dir.y)) nextDir = d;
  });

  startSnake();
}


/* ══════════════════════════════════════════
   HANGMAN
══════════════════════════════════════════ */
function initHangman() {
  const WORDS = [
    'javascript', 'python', 'hangman', 'keyboard', 'algorithm', 'function', 'variable',
    'developer', 'internet', 'browser', 'terminal', 'software', 'hardware', 'network',
    'database', 'security', 'protocol', 'compiler', 'elephant', 'adventure', 'symphony',
    'philosophy', 'architect', 'democracy', 'evolution', 'marathon', 'paragraph',
    'telescope', 'hurricane', 'chocolate', 'waterfall', 'satellite', 'universe',
    'quantum', 'rhythm', 'sphinx', 'cryptic', 'journey', 'mystery', 'abstract',
    'fractal', 'silicon', 'voltage', 'circuit', 'polygon', 'eclipse', 'galaxy',
    'hydrogen', 'nitrogen', 'calcium', 'tsunami', 'volcano', 'plateau', 'canyon',
    'fossil', 'amber', 'coral', 'whale', 'falcon', 'jaguar', 'panda', 'koala',
    'penguin', 'dolphin', 'octopus', 'lobster', 'sparrow', 'vulture',
    'cobra', 'mamba', 'condor', 'parrot', 'iguana', 'gecko', 'toucan', 'meerkat'
  ];
  const PARTS = ['hm-head', 'hm-body', 'hm-larm', 'hm-rarm', 'hm-lleg', 'hm-rleg'];
  let word, guessed, wrong, maxWrong, active;

  function resetHangmanUI() {
    PARTS.forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById('hm-word').innerHTML =
      '<div style="font-family:Space Mono,monospace;font-size:0.8rem;color:#555;">Press New Word to begin</div>';
    document.getElementById('hm-chances-num').textContent = '—';
    document.getElementById('hm-wrong-letters').innerHTML = '—';
    document.getElementById('hm-message').textContent = '';
    document.getElementById('hm-input').disabled = true;
    document.getElementById('hm-input').value = '';
    active = false;
  }

  function startHangman() {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
    guessed = new Set();
    wrong = 0;
    maxWrong = word.length < 10 ? word.length + 2 : word.length + 4;
    maxWrong = Math.min(maxWrong, 6);
    active = true;
    PARTS.forEach(id => document.getElementById(id).style.display = 'none');
    render();
    document.getElementById('hm-message').textContent = '';
    document.getElementById('hm-input').disabled = false;
    document.getElementById('hm-input').value = '';
  }
  window.startHangman = startHangman;

  function render() {
    const wordDiv = document.getElementById('hm-word');
    wordDiv.innerHTML = word.split('').map(ch =>
      `<div class="letter-box">${guessed.has(ch) ? ch : ''}</div>`
    ).join('');
    document.getElementById('hm-chances-num').textContent = maxWrong - wrong;
    const wrongLetters = [...guessed].filter(c => !word.includes(c));
    document.getElementById('hm-wrong-letters').innerHTML =
      wrongLetters.length ? wrongLetters.map(c => `<span class="wrong">${c}</span>`).join(' ') : '—';
    PARTS.forEach((id, i) => {
      document.getElementById(id).style.display = i < wrong ? '' : 'none';
    });
  }

  function hmGuess() {
    const input = document.getElementById('hm-input');
    const letter = input.value.trim().toLowerCase();
    input.value = '';
    if (!active || !letter || !/^[a-z]$/.test(letter) || !word) return;
    if (guessed.has(letter)) { showMsg('Already guessed!', '#888'); return; }
    guessed.add(letter);
    if (!word.includes(letter)) wrong++;
    render();
    const won = word.split('').every(c => guessed.has(c));
    if (won) {
      showMsg('🎉 You got it!', '#3df5b0');
      input.disabled = true;
    } else if (wrong >= maxWrong) {
      render();
      showMsg(`💀 The word was: ${word}`, '#ff4d6d');
      input.disabled = true;
    } else {
      showMsg('', '');
    }
    input.focus();
  }
  window.hmGuess = hmGuess;

  function showMsg(txt, color) {
    const el = document.getElementById('hm-message');
    el.textContent = txt;
    el.style.color = color;
  }

  document.getElementById('hm-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') hmGuess();
  });

  resetHangmanUI();
}


/* ══════════════════════════════════════════
   PING PONG
══════════════════════════════════════════ */
function initPong() {
  const canvas = document.getElementById('pongCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD_W = 12, PAD_H = 80, BALL_R = 8, SPEED = 1.75;
  const MAX_SPEED = 6.25;
  let lScore, rScore, lY, rY, rYTarget, bx, by, bdx, bdy, keys, animId, running, cpuOn;
  cpuOn = false;

  function toggleCPU() {
    cpuOn = !cpuOn;
    document.getElementById('cpuToggle').textContent = '🤖 CPU: ' + (cpuOn ? 'ON' : 'OFF');
    document.getElementById('pongHint').textContent = cpuOn
      ? 'W/S — your paddle (left)'
      : 'W/S — left \u00a0|\u00a0 \u2191/\u2193 — right';
  }
  window.toggleCPU = toggleCPU;

  function drawIdle() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.roundRect(20, H / 2 - PAD_H / 2, PAD_W, PAD_H, 4); ctx.fill();
    ctx.fillStyle = cpuOn ? '#3df5b0' : '#7b8cff';
    ctx.beginPath(); ctx.roundRect(W - 20 - PAD_W, H / 2 - PAD_H / 2, PAD_W, PAD_H, 4); ctx.fill();
    ctx.fillStyle = '#2a2a2a';
    ctx.font = 'bold 24px Syne';
    ctx.textAlign = 'center';
    ctx.fillText('Press W or ↑ to begin', W / 2, H / 2);
  }

  function startPong() {
    cancelAnimationFrame(animId);
    running = false;
    lScore = 0; rScore = 0;
    lY = H / 2 - PAD_H / 2; rY = H / 2 - PAD_H / 2; rYTarget = rY;
    keys = {};
    drawIdle();
  }
  window.startPong = startPong;

  function launchPong() {
    bx = W / 2; by = H / 2;
    bdx = SPEED * (Math.random() > 0.5 ? 1 : -1);
    bdy = SPEED * (Math.random() > 0.5 ? 1 : -1);
    running = true;
    animId = requestAnimationFrame(tickPong);
  }

  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    if (!running && ['w', 'W', 'ArrowUp'].includes(e.key)) launchPong();
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  function tickCPU() {
    if (bdx > 0) {
      rYTarget = by - PAD_H / 2 + (Math.sin(bx * 0.05) * 12);
    } else {
      rYTarget = H / 2 - PAD_H / 2;
    }
    rYTarget = Math.max(0, Math.min(H - PAD_H, rYTarget));
    rY += (rYTarget - rY) * 0.06;
  }

  function tickPong() {
    if (!running) return;
    if (keys['w'] || keys['W']) lY = Math.max(0, lY - 6);
    if (keys['s'] || keys['S']) lY = Math.min(H - PAD_H, lY + 6);
    if (cpuOn) {
      tickCPU();
    } else {
      if (keys['ArrowUp'])   rY = Math.max(0, rY - 6);
      if (keys['ArrowDown']) rY = Math.min(H - PAD_H, rY + 6);
    }
    bx += bdx; by += bdy;
    if (by - BALL_R < 0) { by = BALL_R; bdy *= -1; }
    if (by + BALL_R > H) { by = H - BALL_R; bdy *= -1; }
    if (bx - BALL_R < PAD_W + 20 && bx > 20 && by > lY && by < lY + PAD_H) {
      bx = PAD_W + 20 + BALL_R;
      bdx = Math.abs(bdx) * 1.05;
      bdy += (by - (lY + PAD_H / 2)) * 0.1;
    }
    if (bx + BALL_R > W - PAD_W - 20 && bx < W - 20 && by > rY && by < rY + PAD_H) {
      bx = W - PAD_W - 20 - BALL_R;
      bdx = -Math.abs(bdx) * 1.05;
      bdy += (by - (rY + PAD_H / 2)) * 0.1;
    }
    if (bx < 0) { rScore++; resetBall(-1); }
    else if (bx > W) { lScore++; resetBall(1); }
    const spd = Math.sqrt(bdx * bdx + bdy * bdy);
    if (spd > MAX_SPEED) { bdx = bdx / spd * MAX_SPEED; bdy = bdy / spd * MAX_SPEED; }
    drawPong();
    animId = requestAnimationFrame(tickPong);
  }

  function resetBall(dir) {
    bx = W / 2; by = H / 2;
    bdx = SPEED * dir;
    bdy = SPEED * (Math.random() > 0.5 ? 1 : -1);
  }

  function drawPong() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2a2a2a';
    ctx.font = 'bold 64px Syne';
    ctx.textAlign = 'center';
    ctx.fillText(lScore, W / 4, 80);
    ctx.fillText(rScore, W * 3 / 4, 80);
    if (cpuOn) {
      ctx.fillStyle = '#444';
      ctx.font = '11px Space Mono';
      ctx.fillText('CPU', W * 3 / 4, 100);
    }
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.roundRect(20, lY, PAD_W, PAD_H, 4); ctx.fill();
    ctx.fillStyle = cpuOn ? '#3df5b0' : '#7b8cff';
    ctx.beginPath(); ctx.roundRect(W - 20 - PAD_W, rY, PAD_W, PAD_H, 4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(bx, by, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    if (lScore >= 7 || rScore >= 7) {
      running = false;
      cancelAnimationFrame(animId);
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      const label = lScore >= 7 ? (cpuOn ? 'You Win!' : 'Left Player Wins!') : (cpuOn ? 'CPU Wins!' : 'Right Player Wins!');
      ctx.fillStyle = lScore >= 7 ? '#ff4d6d' : (cpuOn ? '#3df5b0' : '#7b8cff');
      ctx.font = 'bold 40px Syne';
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, H / 2 - 12);
      ctx.fillStyle = '#888';
      ctx.font = '14px Space Mono';
      ctx.fillText('Press Start to play again', W / 2, H / 2 + 24);
    }
  }

  startPong();
}


/* ══════════════════════════════════════════
   TIC TAC TOE
══════════════════════════════════════════ */
function initTTT() {
  const canvas = document.getElementById('tttCanvas');
  const ctx = canvas.getContext('2d');
  const SIZE = 256, CELL = SIZE / 3, GAP = 8;
  let board, current, gameOver, scoreX = 0, scoreO = 0, active;
  const WINS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  function startTTT() {
    board = Array(9).fill('');
    current = 'X';
    gameOver = false;
    active = false;
    setStatus('Press Start — then click a square', '#555');
    drawBoard(null);
  }
  window.startTTT = startTTT;

  function drawBoard(winCells) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 9; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const x = col * CELL + GAP / 2;
      const y = row * CELL + GAP / 2;
      const w = CELL - GAP;
      const h = CELL - GAP;
      const isWinner = winCells && winCells.includes(i);

      ctx.fillStyle = isWinner ? '#1a2e1a' : '#1a1a1a';
      roundRect(x, y, w, h, 10); ctx.fill();
      ctx.strokeStyle = isWinner ? '#3df5b0' : '#2a2a2a';
      ctx.lineWidth = 1.5;
      roundRect(x, y, w, h, 10); ctx.stroke();

      if (board[i] === 'X') {
        const pad = 18;
        ctx.strokeStyle = '#7b8cff';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + pad, y + pad); ctx.lineTo(x + w - pad, y + h - pad);
        ctx.moveTo(x + w - pad, y + pad); ctx.lineTo(x + pad, y + h - pad);
        ctx.stroke();
      } else if (board[i] === 'O') {
        const cx = x + w / 2, cy = y + h / 2, r = w / 2 - 16;
        ctx.strokeStyle = '#ff4d6d';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  canvas.addEventListener('click', e => {
    if (gameOver) return;
    if (!active) { active = true; setStatus("Player X's turn", '#7b8cff'); }
    const rect = canvas.getBoundingClientRect();
    const scaleX = SIZE / rect.width, scaleY = SIZE / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(cx / CELL), row = Math.floor(cy / CELL);
    const i = row * 3 + col;
    if (i < 0 || i > 8 || board[i]) return;
    board[i] = current;
    const win = checkWin();
    if (win) {
      gameOver = true;
      if (current === 'X') { scoreX++; document.getElementById('tttX').textContent = scoreX; }
      else { scoreO++; document.getElementById('tttO').textContent = scoreO; }
      drawBoard(win);
      setStatus(`Player ${current} wins! 🎉`, current === 'X' ? '#7b8cff' : '#ff4d6d');
      return;
    }
    if (board.every(c => c)) {
      gameOver = true;
      drawBoard(null);
      setStatus("It's a draw!", '#888');
      return;
    }
    current = current === 'X' ? 'O' : 'X';
    setStatus(`Player ${current}'s turn`, current === 'X' ? '#7b8cff' : '#ff4d6d');
    drawBoard(null);
  });

  function checkWin() {
    for (const [a, b, c] of WINS)
      if (board[a] && board[a] === board[b] && board[b] === board[c]) return [a, b, c];
    return null;
  }

  function setStatus(txt, color) {
    const el = document.getElementById('ttt-status');
    el.textContent = txt;
    el.style.color = color;
  }

  startTTT();
}


/* ══════════════════════════════════════════
   MATH BLITZ
══════════════════════════════════════════ */
function initMathBlitz() {
  const TIME_LIMIT = 5000;
  let answer, streak, best, timerStart, timerRaf, active;
  best = 0;

  function resetMathBlitz() {
    cancelAnimationFrame(timerRaf);
    active = false;
    document.getElementById('mb-bar-wrap').style.display = 'none';
    document.getElementById('mb-bar').style.width = '100%';
    document.getElementById('mb-question').innerHTML = '<span class="mb-idle">Press Start to begin</span>';
    document.getElementById('mb-input-row').style.display = 'none';
    document.getElementById('mb-input').disabled = true;
    document.getElementById('mb-input').value = '';
    document.getElementById('mb-feedback').textContent = '';
    document.getElementById('mb-streak').style.display = 'none';
    document.getElementById('mb-streak-num').textContent = '0';
  }

  function startMathBlitz() {
    streak = 0;
    active = true;
    document.getElementById('mb-streak').style.display = '';
    document.getElementById('mb-streak-num').textContent = 0;
    setFeedback('', '');
    nextQuestion();
  }
  window.startMathBlitz = startMathBlitz;
  window.resetMathBlitz = resetMathBlitz;

  function nextQuestion() {
    const q = generateQuestion();
    document.getElementById('mb-question').textContent = q + ' = ?';
    document.getElementById('mb-input-row').style.display = 'flex';
    document.getElementById('mb-bar-wrap').style.display = '';
    const input = document.getElementById('mb-input');
    input.value = '';
    input.disabled = false;
    input.focus();
    startTimer();
  }

  function generateQuestion() {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, q;
    switch (op) {
      case '+':
        a = rand(10, 99); b = rand(10, 99);
        answer = a + b; q = `${a} + ${b}`; break;
      case '-':
        a = rand(20, 99); b = rand(10, a);
        answer = a - b; q = `${a} − ${b}`; break;
      case '×':
        a = rand(2, 12); b = rand(2, 12);
        answer = a * b; q = `${a} × ${b}`; break;
      case '÷':
        b = rand(2, 12); answer = rand(2, 12);
        a = b * answer;
        q = `${a} ÷ ${b}`; break;
    }
    return q;
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function startTimer() {
    cancelAnimationFrame(timerRaf);
    timerStart = performance.now();
    tickTimer();
  }

  function tickTimer() {
    const elapsed = performance.now() - timerStart;
    const pct = Math.max(0, 1 - elapsed / TIME_LIMIT);
    const bar = document.getElementById('mb-bar');
    bar.style.width = (pct * 100) + '%';
    bar.style.background = pct > 0.4 ? '#ff9f43' : '#ff4d6d';
    if (elapsed >= TIME_LIMIT) { endGame("⏱ Time's up!"); return; }
    timerRaf = requestAnimationFrame(tickTimer);
  }

  function mbSubmit() {
    if (!active) return;
    const val = parseInt(document.getElementById('mb-input').value, 10);
    if (isNaN(val)) return;
    cancelAnimationFrame(timerRaf);
    if (val === answer) {
      streak++;
      if (streak > best) {
        best = streak;
        document.getElementById('mb-best').textContent = best;
      }
      document.getElementById('mb-streak-num').textContent = streak;
      setFeedback('✓ Correct!', '#3df5b0');
      setTimeout(nextQuestion, 400);
    } else {
      endGame(`✗ Wrong — answer was ${answer}`);
    }
  }
  window.mbSubmit = mbSubmit;

  function endGame(reason) {
    active = false;
    cancelAnimationFrame(timerRaf);
    document.getElementById('mb-bar').style.width = '0%';
    document.getElementById('mb-input').disabled = true;
    document.getElementById('mb-input-row').style.display = 'none';
    document.getElementById('mb-question').textContent = `Streak: ${streak}`;
    setFeedback(reason, '#ff4d6d');
  }

  function setFeedback(txt, color) {
    const el = document.getElementById('mb-feedback');
    el.textContent = txt;
    el.style.color = color;
  }

  document.getElementById('mb-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') mbSubmit();
  });

  resetMathBlitz();
}
