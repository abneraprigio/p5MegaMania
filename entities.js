// ============================================================
// MEGAMANIA 2.0 — Entity Classes
// Player, Bullet, Enemy, KamikazeEnemy, Boss, PowerUp, Particle
// ============================================================

const GAME_W = 800, GAME_H = 600;
const ENEMY_EMOJIS = ['🍔','🍪','🪨','🎀','💎'];

// ---------- Particle ----------
class Particle {
  constructor(x, y, color) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 130 + 40;
    this.x = x; this.y = y;
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.life = 0.4 + Math.random() * 0.4;
    this.max = this.life;
    this.r = Math.random() * 3 + 1;
    this.color = color;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }
  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life / this.max);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------- Engine Trail Particle ----------
class TrailParticle {
  constructor(x, y) {
    this.x = x + (Math.random() - 0.5) * 6;
    this.y = y;
    this.vy = Math.random() * 40 + 20;
    this.life = 0.2 + Math.random() * 0.15;
    this.max = this.life;
    this.r = Math.random() * 2 + 1;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }
  draw(ctx) {
    const t = this.life / this.max;
    ctx.globalAlpha = t * 0.7;
    ctx.fillStyle = t > 0.5 ? '#ffdd00' : '#ff6600';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * t, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------- Player ----------
class Player {
  constructor() { this.reset(); }

  reset() {
    this.x = GAME_W / 2;
    this.y = GAME_H - 55;
    this.w = 48; this.h = 36;
    this.speed = 320;
    this.invTimer = 0;
    this.visible = true;
    this.shield = false;
    this.shieldHits = 0;
    this.spreadShot = false;
    this.powerTimer = 0;
    this.trailTimer = 0;
  }

  update(dt, keys, particles) {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.x -= this.speed * dt;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) this.x += this.speed * dt;
    this.x = Math.max(this.w / 2, Math.min(GAME_W - this.w / 2, this.x));

    if (this.invTimer > 0) {
      this.invTimer -= dt;
      this.visible = Math.floor(this.invTimer * 10) % 2 === 0;
    } else {
      this.visible = true;
    }

    if (this.powerTimer > 0) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) {
        this.spreadShot = false;
        this.shield = false;
        this.shieldHits = 0;
      }
    }

    // Engine trail
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      particles.push(new TrailParticle(this.x, this.y + this.h / 2 - 2));
      this.trailTimer = 0.03;
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    // Body
    ctx.fillStyle = '#00cfff';
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(-11, 8); ctx.lineTo(11, 8);
    ctx.closePath(); ctx.fill();
    // Wings
    ctx.fillStyle = '#0077cc';
    ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(-23, 15); ctx.lineTo(-9, 10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(11, 2); ctx.lineTo(23, 15); ctx.lineTo(9, 10); ctx.closePath(); ctx.fill();
    // Cockpit
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(0, -6, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Flame
    const f = Math.random();
    ctx.fillStyle = f > 0.5 ? '#ff8800' : '#ffdd00';
    ctx.beginPath(); ctx.moveTo(-5, 10); ctx.lineTo(5, 10); ctx.lineTo(0, 20 + f * 6); ctx.closePath(); ctx.fill();
    // Shield bubble
    if (this.shield && this.shieldHits > 0) {
      ctx.strokeStyle = 'rgba(0,229,160,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,229,160,0.08)';
      ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- Bullet ----------
class Bullet {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y;
    this.vx = vx || 0;
    this.vy = vy || -520;
    this.w = 4; this.h = 14;
    this.dead = false;
    this.isEnemy = false;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -20 || this.y > GAME_H + 20 || this.x < -20 || this.x > GAME_W + 20) this.dead = true;
  }
  draw(ctx) {
    if (this.isEnemy) {
      ctx.fillStyle = '#ff4466';
      ctx.shadowColor = '#ff2244';
    } else {
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
    }
    ctx.shadowBlur = 8;
    ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    ctx.shadowBlur = 0;
  }
}

// ---------- Enemy (Zigzag) ----------
class Enemy {
  constructor(x, y, row, col) {
    this.x = x; this.y = y;
    this.baseX = x;
    this.row = row; this.col = col;
    this.w = 44; this.h = 40;
    this.alive = true;
  }
  update(dt, phase, dir, speed) {
    this.x += dir * speed * dt;
    this.y += Math.sin(phase * 2 + this.row * 1.2) * 10 * dt;
  }
  draw(ctx, emoji) {
    if (!this.alive) return;
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, this.x, this.y);
  }
}

// ---------- Kamikaze Enemy ----------
class KamikazeEnemy {
  constructor(x) {
    this.x = x;
    this.y = -30;
    this.w = 40; this.h = 40;
    this.alive = true;
    this.state = 'wait'; // wait -> aim -> dive
    this.waitTimer = 1 + Math.random() * 1.5;
    this.targetX = GAME_W / 2;
    this.vy = 0;
    this.baseY = 60 + Math.random() * 30;
    this.enteredY = false;
  }
  update(dt, playerX) {
    if (!this.enteredY) {
      this.y += 120 * dt;
      if (this.y >= this.baseY) { this.y = this.baseY; this.enteredY = true; }
      return;
    }
    if (this.state === 'wait') {
      this.x += Math.sin(Date.now() / 300) * 60 * dt;
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.state = 'aim';
        this.targetX = playerX;
      }
    } else if (this.state === 'aim') {
      // Flash red then dive
      this.state = 'dive';
      this.targetX = playerX;
    } else if (this.state === 'dive') {
      const dx = this.targetX - this.x;
      this.x += dx * 3 * dt;
      this.vy += 800 * dt;
      this.y += this.vy * dt;
      if (this.y > GAME_H + 50) this.alive = false;
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (this.state === 'dive') {
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 16;
    }
    ctx.fillText('☄️', this.x, this.y);
    ctx.shadowBlur = 0;
  }
}

// ---------- Boss ----------
class Boss {
  constructor(level) {
    this.x = GAME_W / 2;
    this.y = -80;
    this.targetY = 80;
    this.w = 90; this.h = 70;
    this.maxHp = 30 + level * 10;
    this.hp = this.maxHp;
    this.alive = true;
    this.dir = 1;
    this.speed = 100 + level * 8;
    this.shootTimer = 0;
    this.shootInterval = 1.4 - Math.min(level * 0.05, 0.6);
    this.entered = false;
    this.flashTimer = 0;
  }
  update(dt, bullets) {
    // Enter animation
    if (!this.entered) {
      this.y += 80 * dt;
      if (this.y >= this.targetY) { this.y = this.targetY; this.entered = true; }
      return;
    }
    // Movement
    this.x += this.dir * this.speed * dt;
    if (this.x > GAME_W - 60) this.dir = -1;
    if (this.x < 60) this.dir = 1;
    this.y = this.targetY + Math.sin(Date.now() / 600) * 12;
    // Shoot fan pattern
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.shootInterval;
      const angles = [-0.4, -0.2, 0, 0.2, 0.4];
      for (const a of angles) {
        const b = new Bullet(this.x, this.y + this.h / 2, Math.sin(a) * 140, 200);
        b.isEnemy = true;
        b.w = 6; b.h = 6;
        bullets.push(b);
      }
    }
    if (this.flashTimer > 0) this.flashTimer -= dt;
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    // UFO body
    const flash = this.flashTimer > 0;
    ctx.fillStyle = flash ? '#fff' : '#aa22ff';
    ctx.beginPath(); ctx.ellipse(0, 0, 45, 22, 0, 0, Math.PI * 2); ctx.fill();
    // Dome
    ctx.fillStyle = flash ? '#ffaaff' : '#dd66ff';
    ctx.beginPath(); ctx.ellipse(0, -12, 22, 18, 0, Math.PI, 0); ctx.fill();
    // Cockpit
    ctx.fillStyle = '#ffee55';
    ctx.beginPath(); ctx.ellipse(0, -18, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
    // Lights
    ctx.fillStyle = '#ff4444';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * 16, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Glow
    ctx.shadowColor = '#aa22ff';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = 'rgba(170,34,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 47, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  takeDamage(n) {
    this.hp -= n;
    this.flashTimer = 0.1;
    if (this.hp <= 0) { this.alive = false; return true; }
    return false;
  }
}

// ---------- PowerUp ----------
class PowerUp {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 28; this.h = 28;
    this.vy = 80;
    this.alive = true;
    this.type = Math.random() < 0.5 ? 'spread' : 'shield';
    this.bob = Math.random() * Math.PI * 2;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.bob += dt * 4;
    if (this.y > GAME_H + 30) this.alive = false;
  }
  draw(ctx) {
    if (!this.alive) return;
    const yOff = Math.sin(this.bob) * 4;
    ctx.save();
    ctx.translate(this.x, this.y + yOff);
    // Glow
    ctx.shadowColor = this.type === 'spread' ? '#ffaa00' : '#00e5a0';
    ctx.shadowBlur = 14;
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'spread' ? '🔥' : '🛡️', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ---------- Star ----------
class Star {
  constructor() {
    this.x = Math.random() * GAME_W;
    this.y = Math.random() * GAME_H;
    this.r = Math.random() * 1.5 + 0.5;
    this.s = Math.random() * 25 + 8;
  }
  update(dt) {
    this.y += this.s * dt;
    if (this.y > GAME_H) { this.y = 0; this.x = Math.random() * GAME_W; }
  }
  draw(ctx) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + this.r * 0.2})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- AABB collision ----------
function aabb(a, b, shrink) {
  const s = shrink || 0;
  return a.x - a.w/2 + s < b.x + b.w/2 - s &&
         a.x + a.w/2 - s > b.x - b.w/2 + s &&
         a.y - a.h/2 + s < b.y + b.h/2 - s &&
         a.y + a.h/2 - s > b.y - b.h/2 + s;
}
