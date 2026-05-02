// ============================================================
// MEGAMANIA 2.0 — GameEngine, InputHandler, UIController
// Main loop, state management, wave/boss logic
// ============================================================

// ---------- InputHandler ----------
class InputHandler {
  constructor() {
    this.keys = {};
    document.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if ([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
    });
    document.addEventListener('keyup', e => { this.keys[e.key] = false; });
    this._initTouch();
  }

  _initTouch() {
    // Map touch button IDs to the keyboard key they simulate
    const bindings = [
      ['touch-left',  'ArrowLeft'],
      ['touch-right', 'ArrowRight'],
      ['touch-fire',  ' '],
    ];
    for (const [id, key] of bindings) {
      const el = document.getElementById(id);
      if (!el) continue;
      const press = e => {
        e.preventDefault();
        this.keys[key] = true;
        el.classList.add('pressed');
      };
      const release = e => {
        e.preventDefault();
        this.keys[key] = false;
        el.classList.remove('pressed');
      };
      el.addEventListener('touchstart',  press,   { passive: false });
      el.addEventListener('touchend',    release, { passive: false });
      el.addEventListener('touchcancel', release, { passive: false });
      // Also support mouse (for desktop testing of touch UI)
      el.addEventListener('mousedown',  press);
      el.addEventListener('mouseup',    release);
      el.addEventListener('mouseleave', release);
    }
    // Prevent context menu on long-press
    document.getElementById('touch-controls')?.addEventListener('contextmenu', e => e.preventDefault());
  }

  down(k) { return !!this.keys[k]; }
  left()  { return this.down('ArrowLeft') || this.down('a') || this.down('A'); }
  right() { return this.down('ArrowRight') || this.down('d') || this.down('D'); }
  fire()  { return this.down(' '); }
}

// ---------- UIController ----------
class UIController {
  constructor() {
    this.els = {
      title:     document.getElementById('screen-title'),
      pause:     document.getElementById('screen-pause'),
      gameover:  document.getElementById('screen-gameover'),
      hud:       document.getElementById('hud'),
      fuel:      document.getElementById('fuel-bar-container'),
      bossHp:    document.getElementById('boss-hp-container'),
      wave:      document.getElementById('wave-announce'),
      powerInd:  document.getElementById('powerup-indicator'),
      score:     document.getElementById('hud-score'),
      level:     document.getElementById('hud-level'),
      lives:     document.getElementById('hud-lives'),
      fuelFill:  document.getElementById('fuel-bar-fill'),
      fuelPct:   document.getElementById('fuel-pct'),
      bossHpFill:document.getElementById('boss-hp-fill'),
      finalScore:document.getElementById('final-score-value'),
      newRecord: document.getElementById('new-record'),
      titleHi:   document.getElementById('title-highscore'),
      goHi:      document.getElementById('gameover-highscore'),
      waveText:  document.getElementById('wave-text'),
      waveSub:   document.getElementById('wave-sub'),
      powIcon:   document.getElementById('powerup-icon'),
      powFill:   document.getElementById('powerup-timer-fill'),
    };
  }
  show(id) { this.els[id]?.classList.add('active'); this.els[id]?.classList.remove('hidden'); }
  hide(id) { this.els[id]?.classList.remove('active'); this.els[id]?.classList.add('hidden'); }
  setScore(v) { this.els.score.textContent = v; }
  setLevel(v) { this.els.level.textContent = v; }
  setLives(n) { this.els.lives.textContent = '♥'.repeat(Math.max(0, n)); }
  setFuel(pct) {
    this.els.fuelFill.style.width = pct + '%';
    this.els.fuelPct.textContent = Math.ceil(pct) + '%';
    if (pct < 25) this.els.fuelFill.style.background = '#ff2020';
    else if (pct < 50) this.els.fuelFill.style.background = '#ffb000';
    else this.els.fuelFill.style.background = '';
  }
  setBossHp(pct) { this.els.bossHpFill.style.width = Math.max(0, pct) + '%'; }
  showBossHp() { this.hide('bossHp'); this.els.bossHp.classList.remove('hidden'); }
  hideBossHp() { this.els.bossHp.classList.add('hidden'); }
  showHUD() { this.els.hud.classList.remove('hidden'); this.els.fuel.classList.remove('hidden'); }
  hideHUD() { this.els.hud.classList.add('hidden'); this.els.fuel.classList.add('hidden'); }
  setHighScore(v) { this.els.titleHi.textContent = v; this.els.goHi.textContent = v; }
  showWave(level, emoji, count) {
    this.els.waveText.textContent = level % 5 === 0 ? '⚠ BOSS FIGHT ⚠' : 'WAVE ' + level;
    this.els.waveSub.textContent = level % 5 === 0 ? 'Prepare-se!' : emoji + ' ×' + count;
    this.els.wave.classList.remove('hidden');
  }
  hideWave() { this.els.wave.classList.add('hidden'); }
  showGameOver(score, hi, isNew) {
    this.els.finalScore.textContent = score;
    this.els.goHi.textContent = hi;
    if (isNew) this.els.newRecord.classList.remove('hidden');
    else this.els.newRecord.classList.add('hidden');
    this.show('gameover');
  }
  showPowerup(type, pct) {
    this.els.powIcon.textContent = type === 'spread' ? '🔥' : '🛡️';
    this.els.powFill.style.width = (pct * 100) + '%';
    this.els.powerInd.classList.remove('hidden');
  }
  hidePowerup() { this.els.powerInd.classList.add('hidden'); }
}

// ---------- GameEngine ----------
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = GAME_W;
    this.canvas.height = GAME_H;
    this.input = new InputHandler();
    this.ui = new UIController();
    this.phase = 'title'; // title | playing | paused | gameover
    this.lastTime = null;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    // Persistent objects
    this.stars = [];
    for (let i = 0; i < 70; i++) this.stars.push(new Star());

    this.highScore = parseInt(localStorage.getItem('megamania_hi') || '0', 10);
    this.ui.setHighScore(this.highScore);

    this._bindEvents();
    this._resetGame();
    this._applyScale();
    window.addEventListener('resize', () => this._applyScale());
    window.addEventListener('orientationchange', () => setTimeout(() => this._applyScale(), 150));
    requestAnimationFrame(t => this._loop(t));
  }

  _applyScale() {
    // Available space (minus safe-area approximation for apps)
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspect = GAME_W / GAME_H; // 4:3

    let w, h;
    if (vw / vh > aspect) {
      // Screen is wider than game: fit by height, letterbox sides
      h = vh;
      w = Math.round(vh * aspect);
    } else {
      // Screen is taller than game: fit by width, letterbox top/bottom
      w = vw;
      h = Math.round(vw / aspect);
    }

    // Apply dimensions directly to the crt-frame
    const frame = document.getElementById('crt-frame');
    frame.style.setProperty('--game-w', w + 'px');
    frame.style.setProperty('--game-h', h + 'px');
    frame.style.width  = w + 'px';
    frame.style.height = h + 'px';
  }

  _bindEvents() {
    document.getElementById('btn-start').addEventListener('click', () => this._startGame());
    document.getElementById('btn-resume').addEventListener('click', () => this._resume());
    document.getElementById('btn-restart').addEventListener('click', () => this._startGame());

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (this.phase === 'title' || this.phase === 'gameover') this._startGame();
      }
      if (e.key === 'p' || e.key === 'P') {
        if (this.phase === 'playing') this._pause();
        else if (this.phase === 'paused') this._resume();
      }
    });
  }

  _resetGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.energy = 100;
    this.player = new Player();
    this.bullets = [];
    this.particles = [];
    this.enemies = [];
    this.kamikazes = [];
    this.powerups = [];
    this.boss = null;
    this.isBossWave = false;
    this.cooldown = 0;
    this.waveTimer = 0;
    this.waveAnnounce = 0;
    this.enemyDir = 1;
    this.zigzagPhase = 0;
  }

  _startGame() {
    Audio.init();
    this._resetGame();
    this.phase = 'playing';
    this.ui.hide('title');
    this.ui.hide('gameover');
    this.ui.showHUD();
    this.ui.setScore(0);
    this.ui.setLevel(1);
    this.ui.setLives(3);
    this.ui.setFuel(100);
    this.ui.hideBossHp();
    this.ui.hidePowerup();
    this._startWave(1);
  }

  _pause() {
    this.phase = 'paused';
    this.ui.show('pause');
  }

  _resume() {
    this.phase = 'playing';
    this.ui.hide('pause');
    this.lastTime = null;
  }

  _gameOver() {
    this.phase = 'gameover';
    this.ui.hideHUD();
    this.ui.hideBossHp();
    this.ui.hidePowerup();
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
    this.enemies = [];
    this.kamikazes = [];
    this.boss = null;
    this.enemyDir = 1;
    this.zigzagPhase = 0;

    const emoji = ENEMY_EMOJIS[(level - 1) % 5];
    const count = 24;
    this.ui.setLevel(level);
    this.ui.showWave(level, emoji, count);
    this.waveAnnounce = 2;

    if (this.isBossWave) {
      this.boss = new Boss(level);
      this.ui.showBossHp();
      this.ui.setBossHp(100);
    } else {
      this._spawnWaveEnemies(level);
    }
  }

  _spawnWaveEnemies(level) {
    const rows = 3, cols = 8;
    const sx = 70, sy = 70;
    const spX = (GAME_W - sx * 2) / (cols - 1);
    const spY = 55;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.enemies.push(new Enemy(sx + c * spX, sy + r * spY, r, c));
      }
    }
    // Add kamikazes from level 3+
    if (level >= 3) {
      const numK = Math.min(Math.floor((level - 2) / 1), 4);
      for (let i = 0; i < numK; i++) {
        this.kamikazes.push(new KamikazeEnemy(100 + Math.random() * (GAME_W - 200)));
      }
    }
  }

  _loseLife() {
    Audio.playerHit();
    this.lives--;
    this.ui.setLives(this.lives);
    this.shakeTimer = 0.3;
    this.shakeIntensity = 8;
    for (let i = 0; i < 18; i++) this.particles.push(new Particle(this.player.x, this.player.y, '#00ffff'));
    if (this.lives <= 0) {
      this._gameOver();
    } else {
      this.player.invTimer = 2.5;
    }
  }

  _addScore(pts) {
    this.score += pts;
    this.ui.setScore(this.score);
  }

  // ---------- Main Loop ----------
  _loop(ts) {
    if (!this.lastTime) this.lastTime = ts;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    const c = this.ctx;

    // Screen shake
    c.save();
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const i = this.shakeIntensity * (this.shakeTimer / 0.3);
      c.translate((Math.random() - 0.5) * i, (Math.random() - 0.5) * i);
    }

    // Clear — deep CRT black with faint green phosphor tint
    c.fillStyle = '#00060000';
    c.fillRect(0, 0, GAME_W, GAME_H);
    c.fillStyle = '#000000';
    c.fillRect(0, 0, GAME_W, GAME_H);
    // Subtle pixel grid
    c.strokeStyle = 'rgba(0,255,65,0.03)';
    c.lineWidth = 1;
    for (let x = 0; x < GAME_W; x += 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, GAME_H); c.stroke(); }
    for (let y = 0; y < GAME_H; y += 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(GAME_W, y); c.stroke(); }

    // Stars always
    for (const s of this.stars) { s.update(dt); s.draw(c); }

    if (this.phase === 'playing') {
      this._update(dt);
      this._draw(c);
    } else if (this.phase === 'paused') {
      this._draw(c);
    } else if (this.phase === 'gameover') {
      this._draw(c);
    }

    c.restore();
    requestAnimationFrame(t => this._loop(t));
  }

  // ---------- Update ----------
  _update(dt) {
    // Wave announce countdown
    if (this.waveAnnounce > 0) {
      this.waveAnnounce -= dt;
      if (this.waveAnnounce <= 0) this.ui.hideWave();
    }

    // Player
    this.player.update(dt, this.input.keys, this.particles);

    // Shooting
    this.cooldown -= dt;
    if (this.input.fire() && this.cooldown <= 0) {
      if (this.player.spreadShot) {
        this.bullets.push(new Bullet(this.player.x, this.player.y - 18, -60, -520));
        this.bullets.push(new Bullet(this.player.x, this.player.y - 18, 0, -520));
        this.bullets.push(new Bullet(this.player.x, this.player.y - 18, 60, -520));
        Audio.spreadLaser();
      } else {
        this.bullets.push(new Bullet(this.player.x, this.player.y - 18));
        Audio.laser();
      }
      this.cooldown = 0.18;
    }

    // Bullets
    for (const b of this.bullets) b.update(dt);
    this.bullets = this.bullets.filter(b => !b.dead);

    // Energy
    this.energy -= 6 * dt;
    this.ui.setFuel(Math.max(0, this.energy));
    if (this.energy <= 0) {
      this.energy = 100;
      this._loseLife();
      if (this.phase !== 'playing') return;
    }

    // Powerup indicator
    if (this.player.powerTimer > 0) {
      const type = this.player.spreadShot ? 'spread' : 'shield';
      this.ui.showPowerup(type, this.player.powerTimer / 8);
    } else {
      this.ui.hidePowerup();
    }

    if (this.isBossWave) {
      this._updateBoss(dt);
    } else {
      this._updateEnemies(dt);
    }

    // PowerUps
    for (const p of this.powerups) p.update(dt);
    this.powerups = this.powerups.filter(p => p.alive);

    // Collisions
    this._checkCollisions();

    // Particles
    this.particles = this.particles.filter(p => p.update(dt));
  }

  _updateEnemies(dt) {
    const alive = this.enemies.filter(e => e.alive);
    const aliveK = this.kamikazes.filter(k => k.alive);

    // Check wave clear
    if (alive.length === 0 && aliveK.length === 0) {
      Audio.levelUp();
      this.energy = 100;
      this.ui.setFuel(100);
      this._startWave(this.level + 1);
      return;
    }

    this.zigzagPhase += dt;
    const speed = 60 + (this.level - 1) * 18;

    // Edge detection
    let minX = GAME_W, maxX = 0;
    for (const e of alive) { minX = Math.min(minX, e.x); maxX = Math.max(maxX, e.x); }
    if (maxX >= GAME_W - 30 || minX <= 30) {
      this.enemyDir *= -1;
      for (const e of alive) e.y += 16;
    }

    for (const e of alive) e.update(dt, this.zigzagPhase, this.enemyDir, speed);

    // Kamikazes
    for (const k of aliveK) k.update(dt, this.player.x);
    this.kamikazes = this.kamikazes.filter(k => k.alive);
  }

  _updateBoss(dt) {
    if (!this.boss || !this.boss.alive) return;
    this.boss.update(dt, this.bullets);
  }

  _checkCollisions() {
    const p = this.player;

    // Player bullets vs enemies
    for (const b of this.bullets) {
      if (b.isEnemy) continue;
      // vs normal enemies
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (aabb(b, e, 6)) {
          b.dead = true;
          e.alive = false;
          this._addScore(10 * this.level);
          Audio.explosion();
          for (let i = 0; i < 10; i++) this.particles.push(new Particle(e.x, e.y, i % 2 === 0 ? '#ffb000' : '#ff00ff'));
          if (Math.random() < 0.1) this.powerups.push(new PowerUp(e.x, e.y));
          break;
        }
      }
      // vs kamikazes
      for (const k of this.kamikazes) {
        if (!k.alive) continue;
        if (aabb(b, k, 6)) {
          b.dead = true;
          k.alive = false;
          this._addScore(25 * this.level);
          Audio.explosion();
          for (let i = 0; i < 12; i++) this.particles.push(new Particle(k.x, k.y, i % 2 === 0 ? '#ff00ff' : '#ffb000'));
          if (Math.random() < 0.15) this.powerups.push(new PowerUp(k.x, k.y));
        }
      }
      // vs boss
      if (this.boss && this.boss.alive && this.boss.entered) {
        if (aabb(b, this.boss, 8)) {
          b.dead = true;
          Audio.bossHit();
          for (let i = 0; i < 4; i++) this.particles.push(new Particle(b.x, b.y, '#ff00ff'));
          if (this.boss.takeDamage(1)) {
            // Boss dead
            this._addScore(500 * this.level);
            Audio.bossDie();
            for (let i = 0; i < 30; i++) this.particles.push(new Particle(this.boss.x, this.boss.y, i % 3 === 0 ? '#ff00ff' : i % 3 === 1 ? '#ffb000' : '#00ffff'));
            for (let i = 0; i < 20; i++) this.particles.push(new Particle(this.boss.x, this.boss.y, '#ffffff'));
            this.ui.hideBossHp();
            this.energy = 100;
            this.ui.setFuel(100);
            setTimeout(() => { if (this.phase === 'playing') this._startWave(this.level + 1); }, 1500);
          } else {
            this.ui.setBossHp((this.boss.hp / this.boss.maxHp) * 100);
          }
        }
      }
    }

    // Filter dead bullets
    this.bullets = this.bullets.filter(b => !b.dead);

    if (p.invTimer > 0) return; // Invincible

    // Enemy bullets vs player
    for (const b of this.bullets) {
      if (!b.isEnemy) continue;
      if (aabb(b, p, 8)) {
        b.dead = true;
        if (p.shield && p.shieldHits > 0) {
          p.shieldHits--;
          Audio.explosion();
          for (let i = 0; i < 6; i++) this.particles.push(new Particle(p.x, p.y, '#00ff41'));
          if (p.shieldHits <= 0) { p.shield = false; p.powerTimer = 0; }
        } else {
          this._loseLife();
          if (this.phase !== 'playing') return;
        }
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);

    // Enemies touching player
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (aabb(p, e, 10)) {
        e.alive = false;
        for (let i = 0; i < 10; i++) this.particles.push(new Particle(e.x, e.y, i % 2 === 0 ? '#ffb000' : '#00ffff'));
        if (p.shield && p.shieldHits > 0) {
          p.shieldHits--;
          Audio.explosion();
          if (p.shieldHits <= 0) { p.shield = false; p.powerTimer = 0; }
        } else {
          this._loseLife();
          if (this.phase !== 'playing') return;
        }
      }
    }

    // Kamikazes touching player
    for (const k of this.kamikazes) {
      if (!k.alive) continue;
      if (aabb(p, k, 8)) {
        k.alive = false;
        for (let i = 0; i < 12; i++) this.particles.push(new Particle(k.x, k.y, i % 2 === 0 ? '#ff00ff' : '#ffb000'));
        if (p.shield && p.shieldHits > 0) {
          p.shieldHits--;
          Audio.explosion();
          if (p.shieldHits <= 0) { p.shield = false; p.powerTimer = 0; }
        } else {
          this._loseLife();
          if (this.phase !== 'playing') return;
        }
      }
    }

    // Boss touching player
    if (this.boss && this.boss.alive && this.boss.entered) {
      if (aabb(p, this.boss, 10)) {
        if (p.shield && p.shieldHits > 0) {
          p.shieldHits = 0; p.shield = false; p.powerTimer = 0;
          Audio.explosion();
        } else {
          this._loseLife();
          if (this.phase !== 'playing') return;
        }
      }
    }

    // Player vs powerups
    for (const pw of this.powerups) {
      if (!pw.alive) continue;
      if (aabb(p, pw, 0)) {
        pw.alive = false;
        Audio.powerup();
        if (pw.type === 'spread') {
          p.spreadShot = true;
          p.shield = false; p.shieldHits = 0;
        } else {
          p.shield = true;
          p.shieldHits = 1;
          p.spreadShot = false;
        }
        p.powerTimer = 8;
        for (let i = 0; i < 8; i++) this.particles.push(new Particle(pw.x, pw.y, i % 2 === 0 ? '#00ff41' : '#ffb000'));
      }
    }
    this.powerups = this.powerups.filter(pw => pw.alive);
  }

  // ---------- Draw ----------
  _draw(c) {
    // Enemies
    if (!this.isBossWave) {
      const emoji = ENEMY_EMOJIS[(this.level - 1) % 5];
      for (const e of this.enemies) e.draw(c, emoji);
      for (const k of this.kamikazes) k.draw(c);
    }

    // Boss
    if (this.boss && this.boss.alive) this.boss.draw(c);

    // Bullets
    for (const b of this.bullets) b.draw(c);

    // PowerUps
    for (const pw of this.powerups) pw.draw(c);

    // Player
    this.player.draw(c);

    // Particles
    for (const p of this.particles) p.draw(c);
  }
}

// ---------- Boot ----------
window.addEventListener('DOMContentLoaded', () => { new GameEngine(); });
