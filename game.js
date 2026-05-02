// ============================================================
// MEGAMANIA 2.0 — GameEngine (Mobile-First)
// Dynamic canvas, touch input, auto-fire, adaptive layout
// ============================================================

// ---------- InputHandler ----------
class InputHandler {
  constructor() {
    this.keys = {};
    // Touch state
    this.touch = { active: false, targetX: null };
    document.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if ([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
    });
    document.addEventListener('keyup', e => { this.keys[e.key] = false; });
    this._initTouch();
  }

  _initTouch() {
    const setTouch = (clientX) => { this.touch.active = true; this.touch.targetX = clientX; };
    const clearTouch = () => { this.touch.active = false; this.touch.targetX = null; };

    // Track active touch IDs
    const active = {};
    document.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        active[t.identifier] = t.clientX;
        setTouch(t.clientX);
      }
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (active[t.identifier] !== undefined) {
          active[t.identifier] = t.clientX;
          this.touch.targetX = t.clientX;
        }
      }
    }, { passive: false });

    const endTouch = e => {
      e.preventDefault();
      for (const t of e.changedTouches) delete active[t.identifier];
      if (Object.keys(active).length === 0) clearTouch();
      else this.touch.targetX = Object.values(active).at(-1);
    };
    document.addEventListener('touchend',    endTouch, { passive: false });
    document.addEventListener('touchcancel', endTouch, { passive: false });

    // Touch-button wiring (◀ ▶ kept for fallback)
    const btnMap = [['touch-left','ArrowLeft'],['touch-right','ArrowRight']];
    for (const [id, key] of btnMap) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); this.keys[key] = true; el.classList.add('pressed'); }, { passive: false });
      el.addEventListener('touchend',   e => { e.preventDefault(); e.stopPropagation(); this.keys[key] = false; el.classList.remove('pressed'); }, { passive: false });
    }
    document.getElementById('touch-controls')?.addEventListener('contextmenu', e => e.preventDefault());
  }

  left()  { return !!this.keys['ArrowLeft']  || !!this.keys['a'] || !!this.keys['A']; }
  right() { return !!this.keys['ArrowRight'] || !!this.keys['d'] || !!this.keys['D']; }
  fire()  { return !!this.keys[' ']; }
}

// ---------- UIController ----------
class UIController {
  constructor() {
    this.els = {
      title: document.getElementById('screen-title'),
      pause: document.getElementById('screen-pause'),
      gameover: document.getElementById('screen-gameover'),
      hud: document.getElementById('hud'),
      fuel: document.getElementById('fuel-bar-container'),
      bossHp: document.getElementById('boss-hp-container'),
      wave: document.getElementById('wave-announce'),
      powerInd: document.getElementById('powerup-indicator'),
      score: document.getElementById('hud-score'),
      level: document.getElementById('hud-level'),
      lives: document.getElementById('hud-lives'),
      fuelFill: document.getElementById('fuel-bar-fill'),
      fuelPct: document.getElementById('fuel-pct'),
      bossHpFill: document.getElementById('boss-hp-fill'),
      finalScore: document.getElementById('final-score-value'),
      newRecord: document.getElementById('new-record'),
      titleHi: document.getElementById('title-highscore'),
      goHi: document.getElementById('gameover-highscore'),
      waveText: document.getElementById('wave-text'),
      waveSub: document.getElementById('wave-sub'),
      powIcon: document.getElementById('powerup-icon'),
      powFill: document.getElementById('powerup-timer-fill'),
    };
  }
  show(id) { this.els[id]?.classList.add('active'); this.els[id]?.classList.remove('hidden'); }
  hide(id) { this.els[id]?.classList.remove('active'); this.els[id]?.classList.add('hidden'); }
  setScore(v) { if(this.els.score) this.els.score.textContent = v; }
  setLevel(v) { if(this.els.level) this.els.level.textContent = String(v).padStart(2,'0'); }
  setLives(n) { if(this.els.lives) this.els.lives.textContent = '♥'.repeat(Math.max(0,n)); }
  setFuel(pct) {
    if (!this.els.fuelFill) return;
    this.els.fuelFill.style.width = pct + '%';
    if (this.els.fuelPct) this.els.fuelPct.textContent = Math.ceil(pct) + '%';
    this.els.fuelFill.style.background = pct < 25 ? '#ff2020' : pct < 50 ? '#ffb000' : '';
  }
  setBossHp(pct)  { if(this.els.bossHpFill) this.els.bossHpFill.style.width = Math.max(0,pct) + '%'; }
  showBossHp()    { this.els.bossHp?.classList.remove('hidden'); }
  hideBossHp()    { this.els.bossHp?.classList.add('hidden'); }
  showHUD()       { this.els.hud?.classList.remove('hidden'); this.els.fuel?.classList.remove('hidden'); }
  hideHUD()       { this.els.hud?.classList.add('hidden'); this.els.fuel?.classList.add('hidden'); }
  setHighScore(v) { if(this.els.titleHi) this.els.titleHi.textContent = v; if(this.els.goHi) this.els.goHi.textContent = v; }
  showWave(level, emoji, count) {
    if (!this.els.waveText) return;
    this.els.waveText.textContent = level % 5 === 0 ? '⚠ BOSS FIGHT ⚠' : 'WAVE ' + level;
    this.els.waveSub.textContent  = level % 5 === 0 ? 'Prepare-se!'    : emoji + ' ×' + count;
    this.els.wave?.classList.remove('hidden');
  }
  hideWave() { this.els.wave?.classList.add('hidden'); }
  showGameOver(score, hi, isNew) {
    if(this.els.finalScore) this.els.finalScore.textContent = score;
    if(this.els.goHi) this.els.goHi.textContent = hi;
    if(isNew) this.els.newRecord?.classList.remove('hidden');
    else this.els.newRecord?.classList.add('hidden');
    this.show('gameover');
  }
  showPowerup(type, pct) {
    if(this.els.powIcon) this.els.powIcon.textContent = type === 'spread' ? '🔥' : '🛡️';
    if(this.els.powFill) this.els.powFill.style.width = (pct * 100) + '%';
    this.els.powerInd?.classList.remove('hidden');
  }
  hidePowerup() { this.els.powerInd?.classList.add('hidden'); }
}

// ---------- GameEngine ----------
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.input  = new InputHandler();
    this.ui     = new UIController();
    this.phase  = 'title';
    this.lastTime = null;
    this.shakeTimer = 0; this.shakeIntensity = 0;

    this.stars = [];
    this.highScore = parseInt(localStorage.getItem('megamania_hi') || '0', 10);
    this.ui.setHighScore(this.highScore);

    this._resizeCanvas();
    this._buildStars();
    this._bindEvents();
    this._resetGame();

    window.addEventListener('resize', () => { this._resizeCanvas(); this._buildStars(); });
    window.addEventListener('orientationchange', () => setTimeout(() => { this._resizeCanvas(); this._buildStars(); }, 200));

    requestAnimationFrame(t => this._loop(t));
  }

  _resizeCanvas() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    // Set global game dimensions (used by GS(), GSX(), GSY() in entities.js)
    GAME_W = W; GAME_H = H;
    this.canvas.width  = W;
    this.canvas.height = H;
    // Re-reset player if exists so it repositions
    if (this.player) this.player.reset();
  }

  _buildStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) this.stars.push(new Star());
  }

  _bindEvents() {
    document.getElementById('btn-start')?.addEventListener('click',   () => this._startGame());
    document.getElementById('btn-resume')?.addEventListener('click',  () => this._resume());
    document.getElementById('btn-restart')?.addEventListener('click', () => this._startGame());
    document.getElementById('btn-pause-hud')?.addEventListener('click', () => {
      if (this.phase === 'playing') this._pause();
      else if (this.phase === 'paused') this._resume();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (this.phase === 'title' || this.phase === 'gameover')) this._startGame();
      if ((e.key === 'p' || e.key === 'P')) {
        if (this.phase === 'playing') this._pause();
        else if (this.phase === 'paused') this._resume();
      }
    });
  }

  _resetGame() {
    this.score = 0; this.level = 1; this.lives = 3; this.energy = 100;
    this.player    = new Player();
    this.bullets   = []; this.particles = []; this.enemies = [];
    this.kamikazes = []; this.powerups  = [];
    this.boss = null; this.isBossWave = false;
    this.cooldown = 0; this.waveAnnounce = 0;
    this.enemyDir = 1; this.zigzagPhase = 0;
  }

  _startGame() {
    Audio.init();
    this._resetGame();
    this.phase = 'playing';
    this.ui.hide('title'); this.ui.hide('gameover');
    this.ui.showHUD(); this.ui.setScore(0); this.ui.setLevel(1);
    this.ui.setLives(3); this.ui.setFuel(100);
    this.ui.hideBossHp(); this.ui.hidePowerup();
    this._startWave(1);
  }

  _pause()  { this.phase = 'paused';  this.ui.show('pause'); }
  _resume() { this.phase = 'playing'; this.ui.hide('pause'); this.lastTime = null; }

  _gameOver() {
    this.phase = 'gameover';
    this.ui.hideHUD(); this.ui.hideBossHp(); this.ui.hidePowerup();
    let isNew = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('megamania_hi', String(this.highScore));
      this.ui.setHighScore(this.highScore);
      isNew = true;
    }
    this.ui.showGameOver(this.score, this.highScore, isNew);
  }

  _startWave(level) {
    this.level = level;
    this.isBossWave = level % 5 === 0;
    this.enemies = []; this.kamikazes = []; this.boss = null;
    this.enemyDir = 1; this.zigzagPhase = 0;
    const emoji = ENEMY_EMOJIS[(level - 1) % 5];
    this.ui.setLevel(level);
    this.ui.showWave(level, emoji, this._cols() * 3);
    this.waveAnnounce = 2;
    if (this.isBossWave) { this.boss = new Boss(level); this.ui.showBossHp(); this.ui.setBossHp(100); }
    else this._spawnWave(level);
  }

  _cols() {
    // Fewer columns on narrow screens (portrait phones)
    if (GAME_W < 420) return 4;
    if (GAME_W < 600) return 5;
    return 8;
  }

  _spawnWave(level) {
    const COLS = this._cols(), ROWS = 3;
    const sc = GS();
    const ew = 44 * sc, eh = 40 * sc;
    const marginX = GAME_W * 0.06;
    const startY  = GAME_H * 0.1;
    const spX = (GAME_W - marginX * 2) / Math.max(1, COLS - 1);
    const spY = Math.min(eh * 1.5, GAME_H * 0.1);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        this.enemies.push(new Enemy(marginX + c * spX, startY + r * spY, r, c));
    if (level >= 3) {
      const numK = Math.min(Math.floor((level - 2)), 3);
      for (let i = 0; i < numK; i++)
        this.kamikazes.push(new KamikazeEnemy(100 + Math.random() * (GAME_W - 200)));
    }
  }

  _loseLife() {
    Audio.playerHit(); this.lives--; this.ui.setLives(this.lives);
    this.shakeTimer = 0.3; this.shakeIntensity = 8;
    for (let i = 0; i < 18; i++) this.particles.push(new Particle(this.player.x, this.player.y, '#00ffff'));
    if (this.lives <= 0) this._gameOver();
    else this.player.invTimer = 2.5;
  }

  _addScore(pts) { this.score += pts; this.ui.setScore(this.score); }

  // ---------- Main Loop ----------
  _loop(ts) {
    if (!this.lastTime) this.lastTime = ts;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    const c = this.ctx;
    c.save();
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const i = this.shakeIntensity * (this.shakeTimer / 0.3);
      c.translate((Math.random() - 0.5) * i, (Math.random() - 0.5) * i);
    }
    c.fillStyle = '#000'; c.fillRect(0, 0, GAME_W, GAME_H);
    // Pixel grid
    c.strokeStyle = 'rgba(0,255,65,0.025)'; c.lineWidth = 1;
    for (let x = 0; x < GAME_W; x += 8) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,GAME_H); c.stroke(); }
    for (let y = 0; y < GAME_H; y += 8) { c.beginPath(); c.moveTo(0,y); c.lineTo(GAME_W,y); c.stroke(); }
    for (const s of this.stars) { s.update(dt); s.draw(c); }
    if (this.phase === 'playing') { this._update(dt); this._drawGame(c); }
    else if (this.phase === 'paused' || this.phase === 'gameover') this._drawGame(c);
    c.restore();
    requestAnimationFrame(t => this._loop(t));
  }

  // ---------- Update ----------
  _update(dt) {
    if (this.waveAnnounce > 0) { this.waveAnnounce -= dt; if (this.waveAnnounce <= 0) this.ui.hideWave(); }

    this.player.update(dt, this.input.keys, this.input.touch, this.particles);

    // Fire: auto-fire on touch, or spacebar
    this.cooldown -= dt;
    const shouldFire = (this.input.touch.active || this.input.fire()) && this.cooldown <= 0;
    if (shouldFire) {
      const px = this.player.x, py = this.player.y - this.player.h / 2;
      if (this.player.spreadShot) {
        const sp = 60 * GSX();
        this.bullets.push(new Bullet(px, py, -sp, -520 * GSY()));
        this.bullets.push(new Bullet(px, py, 0, -520 * GSY()));
        this.bullets.push(new Bullet(px, py,  sp, -520 * GSY()));
        Audio.spreadLaser();
      } else {
        this.bullets.push(new Bullet(px, py, 0, -520 * GSY()));
        Audio.laser();
      }
      this.cooldown = 0.18;
    }

    for (const b of this.bullets) b.update(dt);
    this.bullets = this.bullets.filter(b => !b.dead);

    this.energy -= 6 * dt; this.ui.setFuel(Math.max(0, this.energy));
    if (this.energy <= 0) { this.energy = 100; this._loseLife(); if (this.phase !== 'playing') return; }

    if (this.player.powerTimer > 0) this.ui.showPowerup(this.player.spreadShot ? 'spread' : 'shield', this.player.powerTimer / 8);
    else this.ui.hidePowerup();

    if (this.isBossWave) this._updateBoss(dt);
    else this._updateEnemies(dt);

    for (const p of this.powerups) p.update(dt);
    this.powerups = this.powerups.filter(p => p.alive);
    this._checkCollisions();
    this.particles = this.particles.filter(p => p.update(dt));
  }

  _updateEnemies(dt) {
    const alive  = this.enemies.filter(e => e.alive);
    const aliveK = this.kamikazes.filter(k => k.alive);
    if (alive.length === 0 && aliveK.length === 0) {
      Audio.levelUp(); this.energy = 100; this.ui.setFuel(100);
      this._startWave(this.level + 1); return;
    }
    this.zigzagPhase += dt;
    const speed = (60 + (this.level - 1) * 18) * GSX();
    let minX = GAME_W, maxX = 0;
    for (const e of alive) { minX = Math.min(minX, e.x); maxX = Math.max(maxX, e.x); }
    const margin = 30 * GS();
    if (maxX >= GAME_W - margin || minX <= margin) {
      this.enemyDir *= -1;
      for (const e of alive) e.y += 16 * GS();
    }
    for (const e of alive) e.update(dt, this.zigzagPhase, this.enemyDir, speed);
    for (const k of aliveK) k.update(dt, this.player.x);
    this.kamikazes = this.kamikazes.filter(k => k.alive);
  }

  _updateBoss(dt) { if (this.boss?.alive) this.boss.update(dt, this.bullets); }

  _checkCollisions() {
    const p = this.player;
    for (const b of this.bullets) {
      if (b.isEnemy) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (aabb(b, e, 6 * GS())) {
          b.dead = true; e.alive = false; this._addScore(10 * this.level);
          Audio.explosion();
          for (let i = 0; i < 10; i++) this.particles.push(new Particle(e.x, e.y, i%2===0?'#ffb000':'#ff00ff'));
          if (Math.random() < 0.1) this.powerups.push(new PowerUp(e.x, e.y));
          break;
        }
      }
      for (const k of this.kamikazes) {
        if (!k.alive) continue;
        if (aabb(b, k, 6 * GS())) {
          b.dead = true; k.alive = false; this._addScore(25 * this.level);
          Audio.explosion();
          for (let i = 0; i < 12; i++) this.particles.push(new Particle(k.x, k.y, i%2===0?'#ff00ff':'#ffb000'));
          if (Math.random() < 0.15) this.powerups.push(new PowerUp(k.x, k.y));
        }
      }
      if (this.boss?.alive && this.boss.entered && aabb(b, this.boss, 8 * GS())) {
        b.dead = true; Audio.bossHit();
        for (let i = 0; i < 4; i++) this.particles.push(new Particle(b.x, b.y, '#ff00ff'));
        if (this.boss.takeDamage(1)) {
          this._addScore(500 * this.level); Audio.bossDie();
          for (let i = 0; i < 30; i++) this.particles.push(new Particle(this.boss.x, this.boss.y, ['#ff00ff','#ffb000','#00ffff'][i%3]));
          this.ui.hideBossHp(); this.energy = 100; this.ui.setFuel(100);
          setTimeout(() => { if (this.phase === 'playing') this._startWave(this.level + 1); }, 1500);
        } else { this.ui.setBossHp((this.boss.hp / this.boss.maxHp) * 100); }
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    if (p.invTimer > 0) return;

    for (const b of this.bullets) {
      if (!b.isEnemy) continue;
      if (aabb(b, p, 8 * GS())) {
        b.dead = true;
        if (p.shield && p.shieldHits > 0) { p.shieldHits--; Audio.explosion(); for(let i=0;i<6;i++) this.particles.push(new Particle(p.x,p.y,'#00ff41')); if(!p.shieldHits){p.shield=false;p.powerTimer=0;} }
        else { this._loseLife(); if (this.phase !== 'playing') return; }
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);

    const hitPlayer = (obj) => {
      if (!obj.alive) return;
      if (!aabb(p, obj, 10 * GS())) return;
      obj.alive = false;
      for (let i=0;i<10;i++) this.particles.push(new Particle(obj.x,obj.y,i%2===0?'#ffb000':'#00ffff'));
      if (p.shield && p.shieldHits > 0) { p.shieldHits--; Audio.explosion(); if(!p.shieldHits){p.shield=false;p.powerTimer=0;} }
      else { this._loseLife(); }
    };
    for (const e of this.enemies) { hitPlayer(e); if (this.phase !== 'playing') return; }
    for (const k of this.kamikazes) { hitPlayer(k); if (this.phase !== 'playing') return; }

    if (this.boss?.alive && this.boss.entered && aabb(p, this.boss, 10 * GS())) {
      if (p.shield && p.shieldHits > 0) { p.shieldHits=0; p.shield=false; p.powerTimer=0; Audio.explosion(); }
      else { this._loseLife(); if (this.phase !== 'playing') return; }
    }

    for (const pw of this.powerups) {
      if (!pw.alive) continue;
      if (aabb(p, pw, 0)) {
        pw.alive = false; Audio.powerup();
        if (pw.type==='spread'){p.spreadShot=true;p.shield=false;p.shieldHits=0;}
        else{p.shield=true;p.shieldHits=1;p.spreadShot=false;}
        p.powerTimer = 8;
        for(let i=0;i<8;i++) this.particles.push(new Particle(pw.x,pw.y,i%2===0?'#00ff41':'#ffb000'));
      }
    }
    this.powerups = this.powerups.filter(pw => pw.alive);
  }

  _drawGame(c) {
    const emoji = ENEMY_EMOJIS[(this.level - 1) % 5];
    if (!this.isBossWave) {
      for (const e of this.enemies) e.draw(c, emoji);
      for (const k of this.kamikazes) k.draw(c);
    }
    if (this.boss?.alive) this.boss.draw(c);
    for (const b of this.bullets) b.draw(c);
    for (const pw of this.powerups) pw.draw(c);
    this.player.draw(c);
    for (const p of this.particles) p.draw(c);
  }
}

// ---------- Boot ----------
window.addEventListener('DOMContentLoaded', () => { new GameEngine(); });
