// ============================================================
// MEGAMANIA 2.0 — Entities (Mobile-Responsive)
// ============================================================

var GAME_W = 800, GAME_H = 600;
const ENEMY_EMOJIS = ['🍔','🍪','🪨','🎀','💎'];
// Uniform scale vs design size 800x600
function GS()  { return Math.min(GAME_W / 800, GAME_H / 600); }
function GSX() { return GAME_W / 800; }
function GSY() { return GAME_H / 600; }

class Particle {
  constructor(x, y, color) {
    const a = Math.random() * Math.PI * 2, sp = (Math.random() * 130 + 40) * GS();
    this.x = x; this.y = y; this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp;
    this.life = 0.4 + Math.random() * 0.4; this.max = this.life;
    this.r = (Math.random() * 3 + 1) * GS(); this.color = color;
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; return this.life > 0; }
  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life / this.max);
    ctx.fillStyle = this.color;
    const s = Math.max(1, Math.round(this.r));
    ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
    ctx.globalAlpha = 1;
  }
}

class TrailParticle {
  constructor(x, y) {
    const sc = GS();
    this.x = x + (Math.random() - 0.5) * 6 * sc; this.y = y;
    this.vy = (Math.random() * 40 + 20) * sc;
    this.life = 0.2 + Math.random() * 0.15; this.max = this.life;
    this.r = (Math.random() * 2 + 1) * sc;
  }
  update(dt) { this.y += this.vy * dt; this.life -= dt; return this.life > 0; }
  draw(ctx) {
    const t = this.life / this.max;
    ctx.globalAlpha = t * 0.8;
    ctx.fillStyle = t > 0.5 ? '#ffb000' : '#00ff41';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4;
    const s = Math.max(1, Math.floor(this.r * t));
    ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
}

class Player {
  constructor() { this.reset(); }
  reset() {
    const sc = GS();
    this.x = GAME_W / 2; this.y = GAME_H - 60 * sc;
    this.w = 48 * sc; this.h = 36 * sc;
    this.speed = 320 * GSX();
    this.invTimer = 0; this.visible = true;
    this.shield = false; this.shieldHits = 0;
    this.spreadShot = false; this.powerTimer = 0; this.trailTimer = 0;
  }
  update(dt, keys, touch, particles) {
    // Keyboard
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) this.x -= this.speed * dt;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) this.x += this.speed * dt;
    // Touch follow-finger
    if (touch.active && touch.targetX !== null) {
      const dx = touch.targetX - this.x;
      this.x += Math.sign(dx) * Math.min(Math.abs(dx) * 8 * dt, this.speed * dt);
    }
    this.x = Math.max(this.w / 2, Math.min(GAME_W - this.w / 2, this.x));
    if (this.invTimer > 0) { this.invTimer -= dt; this.visible = Math.floor(this.invTimer * 10) % 2 === 0; }
    else this.visible = true;
    if (this.powerTimer > 0) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) { this.spreadShot = false; this.shield = false; this.shieldHits = 0; }
    }
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) { particles.push(new TrailParticle(this.x, this.y + this.h / 2 - 2)); this.trailTimer = 0.03; }
  }
  draw(ctx) {
    if (!this.visible) return;
    ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y));
    const P = Math.max(2, Math.round(4 * GS()));
    ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 6;
    ctx.fillRect(-P/2, -5*P, P, P); ctx.fillRect(-P/2, -4*P, P, P);
    ctx.fillRect(-3*P/2, -3*P, 3*P, P);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-P/2, -2*P, P, P);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(-3*P/2, -2*P, P, P); ctx.fillRect(P/2, -2*P, P, P);
    ctx.fillRect(-5*P/2, -P, 5*P, P);
    ctx.fillStyle = '#0088aa'; ctx.fillRect(-7*P/2, 0, 3*P, P); ctx.fillRect(P/2, 0, 3*P, P);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(-P/2, 0, P, P);
    ctx.fillStyle = '#0088aa'; ctx.fillRect(-9*P/2, P, 2*P, P); ctx.fillRect(5*P/2, P, 2*P, P);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(-P/2, P, P, P);
    ctx.shadowBlur = 0;
    const fl = Math.random() > 0.5;
    ctx.fillStyle = fl ? '#ffb000' : '#00ff41'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    ctx.fillRect(-P/2, 2*P, P, P);
    if (Math.random() > 0.4) ctx.fillRect(-P/2, 3*P, P, P);
    ctx.shadowBlur = 0;
    if (this.shield && this.shieldHits > 0) {
      ctx.strokeStyle = '#00ff41'; ctx.shadowColor = '#00ff41'; ctx.shadowBlur = 10; ctx.lineWidth = 2;
      ctx.strokeRect(-5*P, -6*P, 10*P, 10*P); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, vx, vy) {
    const sc = GS();
    this.x = x; this.y = y;
    this.vx = vx || 0;
    this.vy = vy || -520 * GSY();
    this.w = Math.max(3, 4 * sc); this.h = Math.max(10, 14 * sc);
    this.dead = false; this.isEnemy = false;
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.y < -20 || this.y > GAME_H + 20 || this.x < -20 || this.x > GAME_W + 20) this.dead = true;
  }
  draw(ctx) {
    if (this.isEnemy) {
      ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 10;
      const s = Math.max(4, 6 * GS()); ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
    } else {
      ctx.fillStyle = '#00ff41'; ctx.shadowColor = '#00ff41'; ctx.shadowBlur = 10;
      ctx.fillRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h);
      ctx.fillStyle = '#fff'; ctx.fillRect(this.x - this.w/4, this.y - this.h/2, this.w/2, 3);
    }
    ctx.shadowBlur = 0;
  }
}

class Enemy {
  constructor(x, y, row, col) {
    const sc = GS();
    this.x = x; this.y = y; this.baseX = x; this.row = row; this.col = col;
    this.w = 44 * sc; this.h = 40 * sc; this.alive = true;
  }
  update(dt, phase, dir, speed) {
    this.x += dir * speed * dt;
    this.y += Math.sin(phase * 2 + this.row * 1.2) * 10 * GS() * dt;
  }
  draw(ctx, emoji) {
    if (!this.alive) return;
    ctx.save(); ctx.font = Math.round(30 * GS()) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8;
    ctx.fillText(emoji, this.x, this.y); ctx.shadowBlur = 0; ctx.restore();
  }
}

class KamikazeEnemy {
  constructor(x) {
    const sc = GS();
    this.x = x; this.y = -30; this.w = 40 * sc; this.h = 40 * sc; this.alive = true;
    this.state = 'wait'; this.waitTimer = 1 + Math.random() * 1.5;
    this.targetX = GAME_W / 2; this.vy = 0;
    this.baseY = 60 * sc + Math.random() * 30 * sc; this.enteredY = false;
  }
  update(dt, playerX) {
    if (!this.enteredY) { this.y += 120 * GS() * dt; if (this.y >= this.baseY) { this.y = this.baseY; this.enteredY = true; } return; }
    if (this.state === 'wait') {
      this.x += Math.sin(Date.now() / 300) * 60 * GSX() * dt;
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) { this.state = 'aim'; this.targetX = playerX; }
    } else if (this.state === 'aim') { this.state = 'dive'; this.targetX = playerX; }
    else if (this.state === 'dive') {
      this.x += (this.targetX - this.x) * 3 * dt;
      this.vy += 800 * GSY() * dt; this.y += this.vy * dt;
      if (this.y > GAME_H + 50) this.alive = false;
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save(); ctx.font = Math.round(28 * GS()) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = this.state === 'dive' ? '#ff00ff' : '#ffb000';
    ctx.shadowBlur = this.state === 'dive' ? 20 : 10;
    if (this.state === 'dive') ctx.globalAlpha = 0.85 + Math.random() * 0.15;
    ctx.fillText('☄️', this.x, this.y); ctx.shadowBlur = 0; ctx.restore();
  }
}

class Boss {
  constructor(level) {
    const sc = GS();
    this.x = GAME_W / 2; this.y = -80 * sc; this.targetY = 80 * sc;
    this.w = 90 * sc; this.h = 70 * sc;
    this.maxHp = 30 + level * 10; this.hp = this.maxHp;
    this.alive = true; this.dir = 1;
    this.speed = (100 + level * 8) * GSX();
    this.shootTimer = 0; this.shootInterval = 1.4 - Math.min(level * 0.05, 0.6);
    this.entered = false; this.flashTimer = 0;
  }
  update(dt, bullets) {
    if (!this.entered) {
      this.y += 80 * GSY() * dt;
      if (this.y >= this.targetY) { this.y = this.targetY; this.entered = true; } return;
    }
    this.x += this.dir * this.speed * dt;
    if (this.x > GAME_W - 60 * GS()) this.dir = -1;
    if (this.x < 60 * GS()) this.dir = 1;
    this.y = this.targetY + Math.sin(Date.now() / 600) * 12 * GS();
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.shootInterval;
      for (const a of [-0.4, -0.2, 0, 0.2, 0.4]) {
        const b = new Bullet(this.x, this.y + this.h / 2, Math.sin(a) * 140 * GSX(), 200 * GSY());
        b.isEnemy = true; bullets.push(b);
      }
    }
    if (this.flashTimer > 0) this.flashTimer -= dt;
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y));
    const P = Math.max(3, Math.round(4 * GS())), flash = this.flashTimer > 0;
    const BC = flash ? '#fff' : '#ff00ff', DC = flash ? '#ffaaff' : '#aa0088';
    ctx.shadowColor = flash ? '#fff' : '#ff00ff'; ctx.shadowBlur = flash ? 20 : 14;
    ctx.fillStyle = BC;
    ctx.fillRect(-11*P, 0, 22*P, 2*P); ctx.fillRect(-9*P, 2*P, 18*P, 2*P);
    ctx.fillStyle = DC;
    ctx.fillRect(-7*P, -2*P, 14*P, 2*P); ctx.fillRect(-5*P, -4*P, 10*P, 2*P);
    ctx.fillStyle = BC; ctx.fillRect(-3*P, -6*P, 6*P, 2*P);
    ctx.fillStyle = flash ? '#ffff00' : '#ffb000'; ctx.fillRect(-P, -4*P, 2*P, 2*P);
    ctx.shadowBlur = 0;
    const lit = Math.floor(Date.now() / 150) % 2 === 0 ? '#f00' : '#ff00ff';
    ctx.fillStyle = lit;
    for (let i = -4; i <= 4; i += 2) ctx.fillRect(i*P - P/2, P, P, P);
    ctx.restore();
  }
  takeDamage(n) { this.hp -= n; this.flashTimer = 0.1; if (this.hp <= 0) { this.alive = false; return true; } return false; }
}

class PowerUp {
  constructor(x, y) {
    const sc = GS();
    this.x = x; this.y = y; this.w = 28 * sc; this.h = 28 * sc;
    this.vy = 80 * GSY(); this.alive = true;
    this.type = Math.random() < 0.5 ? 'spread' : 'shield';
    this.bob = Math.random() * Math.PI * 2;
  }
  update(dt) { this.y += this.vy * dt; this.bob += dt * 4; if (this.y > GAME_H + 30) this.alive = false; }
  draw(ctx) {
    if (!this.alive) return;
    const blink = Math.floor(Date.now() / 200) % 2 === 0;
    const yOff = Math.sin(this.bob) * 4 * GS();
    ctx.save(); ctx.translate(this.x, this.y + yOff);
    const col = this.type === 'spread' ? '#ffb000' : '#00ff41';
    ctx.shadowColor = col; ctx.shadowBlur = blink ? 16 : 6;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    const s = 14 * GS(); ctx.strokeRect(-s, -s, s*2, s*2);
    ctx.font = Math.round(18 * GS()) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'spread' ? '🔥' : '🛡️', 0, 0);
    ctx.shadowBlur = 0; ctx.restore();
  }
}

class Star {
  constructor() {
    this.x = Math.random() * GAME_W; this.y = Math.random() * GAME_H;
    this.r = Math.random() * 1.5 + 0.5; this.s = Math.random() * 25 + 8;
  }
  update(dt) { this.y += this.s * GSY() * dt; if (this.y > GAME_H) { this.y = 0; this.x = Math.random() * GAME_W; } }
  draw(ctx) {
    const h = this.r < 0.8 ? 'rgba(0,255,65,' : this.r < 1.3 ? 'rgba(255,255,255,' : 'rgba(0,220,255,';
    ctx.fillStyle = h + (0.15 + this.r * 0.18) + ')';
    const sz = Math.max(1, Math.round(this.r));
    ctx.fillRect(Math.round(this.x), Math.round(this.y), sz, sz);
  }
}

function aabb(a, b, shrink) {
  const s = shrink || 0;
  return a.x - a.w/2 + s < b.x + b.w/2 - s && a.x + a.w/2 - s > b.x - b.w/2 + s &&
         a.y - a.h/2 + s < b.y + b.h/2 - s && a.y + a.h/2 - s > b.y - b.h/2 + s;
}
