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
    ctx.globalAlpha = t * 0.8;
    // Retro CRT amber/green engine glow
    ctx.fillStyle = t > 0.5 ? '#ffb000' : '#00ff41';
    ctx.shadowColor = t > 0.5 ? '#ffb000' : '#00ff41';
    ctx.shadowBlur = 4;
    const sz = Math.max(1, Math.floor(this.r * t));
    ctx.fillRect(this.x - sz/2, this.y - sz/2, sz, sz);
    ctx.shadowBlur = 0;
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
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // === PIXEL ART SHIP (8x8 grid, pixel size = 4) ===
    const P = 4; // pixel size
    const C = '#00ffff'; // main body - CRT cyan
    const W = '#ffffff'; // cockpit white
    const D = '#0088aa'; // dark wing
    const E = '#00ff41'; // engine green

    // Pixel map: each [col, row] offset from center
    // Row -5 (tip)
    ctx.fillStyle = C;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 6;
    ctx.fillRect(-P/2, -5*P, P, P);         // tip
    // Row -4
    ctx.fillRect(-P/2, -4*P, P, P);
    // Row -3
    ctx.fillRect(-3*P/2, -3*P, 3*P, P);     // body wide
    // Row -2
    ctx.fillStyle = W;
    ctx.fillRect(-P/2, -2*P, P, P);         // cockpit
    ctx.fillStyle = C;
    ctx.fillRect(-3*P/2, -2*P, P, P);
    ctx.fillRect(P/2, -2*P, P, P);
    // Row -1
    ctx.fillRect(-5*P/2, -P, 5*P, P);       // widest body
    // Row 0
    ctx.fillStyle = D;
    ctx.fillRect(-7*P/2, 0, 3*P, P);        // left wing
    ctx.fillRect(P/2, 0, 3*P, P);           // right wing
    ctx.fillStyle = C;
    ctx.fillRect(-P/2, 0, P, P);            // center
    // Row 1
    ctx.fillStyle = D;
    ctx.fillRect(-9*P/2, P, 2*P, P);        // left wing tip
    ctx.fillRect(5*P/2, P, 2*P, P);         // right wing tip
    ctx.fillStyle = C;
    ctx.fillRect(-P/2, P, P, P);
    // Engine flame (flicker)
    ctx.shadowBlur = 0;
    const flicker = Math.random() > 0.5;
    ctx.fillStyle = flicker ? '#ffb000' : '#00ff41';
    ctx.shadowColor = flicker ? '#ffb000' : '#00ff41';
    ctx.shadowBlur = 8;
    ctx.fillRect(-P/2, 2*P, P, P);
    if (Math.random() > 0.4) ctx.fillRect(-P/2, 3*P, P, P);
    ctx.shadowBlur = 0;

    // Shield (retro box)
    if (this.shield && this.shieldHits > 0) {
      ctx.strokeStyle = '#00ff41';
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.strokeRect(-26, -22, 52, 48);
      ctx.shadowBlur = 0;
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
      // Boss bullet: magenta retro
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(this.x - 3, this.y - 3, 6, 6);
    } else {
      // Player laser: bright green CRT
      ctx.fillStyle = '#00ff41';
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur = 10;
      // Chunky pixel laser
      ctx.fillRect(this.x - 2, this.y - this.h / 2, 4, this.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x - 1, this.y - this.h / 2, 2, 4);
    }
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
    ctx.save();
    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Retro CRT phosphor tint
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fillText(emoji, this.x, this.y);
    ctx.shadowBlur = 0;
    ctx.restore();
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
    ctx.save();
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (this.state === 'dive') {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.85 + Math.random() * 0.15;
    } else {
      ctx.shadowColor = '#ffb000';
      ctx.shadowBlur = 10;
    }
    ctx.fillText('☄️', this.x, this.y);
    ctx.shadowBlur = 0;
    ctx.restore();
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
    ctx.translate(Math.round(this.x), Math.round(this.y));
    const flash = this.flashTimer > 0;
    const P = 4;

    // Retro pixel-block UFO in magenta
    const BC = flash ? '#ffffff' : '#ff00ff'; // body color
    const DC = flash ? '#ffaaff' : '#aa0088'; // dark
    ctx.shadowColor = flash ? '#ffffff' : '#ff00ff';
    ctx.shadowBlur = flash ? 20 : 14;

    // Bottom dish
    ctx.fillStyle = BC;
    ctx.fillRect(-11*P, 0, 22*P, 2*P);
    ctx.fillRect(-9*P, 2*P, 18*P, 2*P);
    // Mid dome
    ctx.fillStyle = DC;
    ctx.fillRect(-7*P, -2*P, 14*P, 2*P);
    ctx.fillRect(-5*P, -4*P, 10*P, 2*P);
    ctx.fillStyle = BC;
    ctx.fillRect(-3*P, -6*P, 6*P, 2*P);
    // Cockpit
    ctx.fillStyle = flash ? '#ffff00' : '#ffb000';
    ctx.fillRect(-P, -4*P, 2*P, 2*P);
    // Lights on dish
    const litColor = Math.floor(Date.now() / 150) % 2 === 0 ? '#ff0000' : '#ff00ff';
    ctx.shadowBlur = 0;
    ctx.fillStyle = litColor;
    for (let i = -4; i <= 4; i += 2) {
      ctx.fillRect(i*P - P/2, P, P, P);
    }
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
    const blink = Math.floor(Date.now() / 200) % 2 === 0;
    ctx.save();
    ctx.translate(this.x, this.y + yOff);
    // Retro blinking pixel border
    const col = this.type === 'spread' ? '#ffb000' : '#00ff41';
    ctx.shadowColor = col;
    ctx.shadowBlur = blink ? 16 : 6;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -14, 28, 28);
    ctx.font = '18px serif';
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
    // Stars in retro CRT tones: mostly dim green, some white, some cyan
    const hue = this.r < 0.8 ? 'rgba(0,255,65,' : this.r < 1.3 ? 'rgba(255,255,255,' : 'rgba(0,220,255,';
    ctx.fillStyle = hue + (0.15 + this.r * 0.18) + ')';
    const sz = Math.max(1, Math.round(this.r));
    ctx.fillRect(Math.round(this.x), Math.round(this.y), sz, sz);
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
