import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.crName = data.crName || "CR";
    this.playerName = data.playerName || "YOU";
    const rawEnemyNames = Array.isArray(data.enemyNames)
      ? data.enemyNames
      : (data.enemyName ? [data.enemyName] : []);
    this.enemyNames = [...new Set(rawEnemyNames
      .map((name) => String(name).trim().slice(0, 12))
      .filter(Boolean)
    )];
    this.crGender = data.crGender || "male";
    this.playerGender = data.playerGender || "male";
    this.theme = data.theme || "classroom";
    this.soundOn = data.soundOn !== false;
    this.vibrationOn = data.vibrationOn !== false;
  }

  create() {
    const { width, height } = this.scale;

    this.score = 0;
    this.kills = 0;
    this.level = 1;
    this.wave = 1;
    this.health = 100;
    this.attackCooldown = 0;
    this.dashCooldown = 0;
    this.spawnDelay = 980;
    this.spawnTimer = 0;
    this.powerTimer = 0;
    this.levelTimer = 0;
    this.shieldTime = 0;
    this.freezeTime = 0;
    this.speedTime = 0;
    this.enemies = [];
    this.powerUps = [];
    this.moveVector = new Phaser.Math.Vector2(0, -1);
    this.joy = { active: false, x: 0, y: 0, pointerId: null };
    this.hitPause = false;
    this.footstepTimer = 0;
    this.highScore = Number(localStorage.getItem("crHighScoreV3") || 0);
    this.enemyNameQueue = Phaser.Utils.Array.Shuffle([...this.enemyNames]);
    this.enemySpawnCount = 0;

    this.add.image(width / 2, height / 2, `bg_${this.theme}`).setDisplaySize(width, height);
    this.darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.10).setDepth(5);
    this.createLighting();

    this.createCharacters();
    this.createUI();
    this.createControls();

    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,SHIFT,P");
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys.P.on("down", () => this.pauseGame());

    if (this.soundOn) {
      this.bgMusic = this.sound.add("snd_bg", { volume: 0.08, loop: true });
      this.bgMusic.play();
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.bgMusic) this.bgMusic.stop();
    });
  }

  createLighting() {
    const { width, height } = this.scale;
    this.vignette = this.add.graphics().setDepth(150);
    this.vignette.fillStyle(0x000000, 0.24);
    this.vignette.fillRect(0, 0, width, height);

    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillEllipse(width / 2, height / 2 + 20, 610, 760);
    const mask = maskShape.createGeometryMask();
    mask.invertAlpha = true;
    this.vignette.setMask(mask);

    this.actionGlow = this.add.graphics().setDepth(151);
  }

  createCharacters() {
    const { width, height } = this.scale;

    const crKey = this.crGender === "female" ? "female_cr" : "male_cr";
    const playerKey = `${this.playerGender}_player_idle`;

    this.crShadow = this.add.ellipse(width / 2, height / 2 + 48, 92, 28, 0x000000, 0.38).setDepth(14);
    this.cr = this.add.sprite(width / 2, height / 2, crKey).setDepth(20);
    this.cr.setDisplaySize(96, 122);
    this.cr.radius = 42;
    this.crNameText = this.add.text(this.cr.x, this.cr.y - 88, this.crName, this.nameStyle()).setOrigin(0.5).setDepth(70);

    this.playerShadow = this.add.ellipse(width / 2, height / 2 + 260, 106, 32, 0x000000, 0.42).setDepth(19);
    this.player = this.add.sprite(width / 2, height / 2 + 210, playerKey).setDepth(30);
    this.player.setDisplaySize(108, 138);
    this.player.radius = 44;
    this.playerNameText = this.add.text(this.player.x, this.player.y - 92, this.playerName, this.nameStyle()).setOrigin(0.5).setDepth(70);

    this.tweens.add({
      targets: [this.cr, this.crShadow],
      y: this.cr.y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  nameStyle() {
    return {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    };
  }

  createUI() {
    const { width } = this.scale;

    this.scoreText = this.add.text(20, 20, "Score: 0\nKills: 0", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    }).setDepth(200);

    this.levelText = this.add.text(width / 2, 28, "Level 1", {
      fontSize: "25px",
      color: "#fecaca",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    this.healthBg = this.add.rectangle(width - 170, 38, 250, 20, 0x334155, 10).setDepth(200);
    this.healthBar = this.add.rectangle(width - 295, 38, 250, 20, 0x22c55e, 10).setOrigin(0, 0.5).setDepth(201);

    this.add.text(width - 170, 70, "CR Health", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.pauseBtn = this.add.image(width - 54, 125, "ui_pause").setDisplaySize(46, 46).setInteractive({ useHandCursor: true }).setDepth(220);
    this.pauseBtn.on("pointerdown", () => this.pauseGame());

    this.powerText = this.add.text(width / 2, 70, "", {
      fontSize: "19px",
      color: "#bfdbfe",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);
  }

  createControls() {
    const { width, height } = this.scale;

    this.joyBase = this.add.image(120, height - 135, "ui_joystick_base")
      .setDisplaySize(142, 142)
      .setDepth(210)
      .setInteractive();

    this.joyKnob = this.add.image(120, height - 135, "ui_joystick_knob")
      .setDisplaySize(66, 66)
      .setDepth(211);

    this.slashBtn = this.add.image(width - 110, height - 132, "ui_slash")
      .setDisplaySize(122, 122)
      .setDepth(210)
      .setInteractive({ useHandCursor: true });

    this.dashBtn = this.add.image(width - 110, height - 250, "ui_dash")
      .setDisplaySize(82, 82)
      .setDepth(210)
      .setInteractive({ useHandCursor: true });

    this.slashBtn.on("pointerdown", () => this.areaSlashAttack());
    this.dashBtn.on("pointerdown", () => this.dash());

    this.joyBase.on("pointerdown", (pointer) => {
      this.joy.active = true;
      this.joy.pointerId = pointer.id;
      this.updateJoystick(pointer);
    });

    this.input.on("pointermove", (pointer) => {
      if (this.joy.active && pointer.id === this.joy.pointerId) this.updateJoystick(pointer);
    });

    this.input.on("pointerup", (pointer) => {
      if (this.joy.active && pointer.id === this.joy.pointerId) this.resetJoystick();
    });

    this.input.on("pointerupoutside", () => this.resetJoystick());
  }

  updateJoystick(pointer) {
    const baseX = 120;
    const baseY = this.scale.height - 135;
    const dx = pointer.x - baseX;
    const dy = pointer.y - baseY;
    const dist = Math.min(60, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);

    this.joy.x = Math.cos(angle) * (dist / 60);
    this.joy.y = Math.sin(angle) * (dist / 60);
    this.joyKnob.setPosition(baseX + this.joy.x * 60, baseY + this.joy.y * 60);
  }

  resetJoystick() {
    this.joy.active = false;
    this.joy.pointerId = null;
    this.joy.x = 0;
    this.joy.y = 0;
    this.joyKnob.setPosition(120, this.scale.height - 135);
  }

  update(time, delta) {
    if (this.hitPause) return;
    const dt = delta / 1000;

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.shieldTime = Math.max(0, this.shieldTime - dt);
    this.freezeTime = Math.max(0, this.freezeTime - dt);
    this.speedTime = Math.max(0, this.speedTime - dt);
    this.footstepTimer = Math.max(0, this.footstepTimer - delta);

    this.spawnTimer += delta;
    this.powerTimer += dt;
    this.levelTimer += dt;

    if (this.spawnTimer >= this.spawnDelay) {
      this.spawnTimer = 0;
      this.spawnEnemy(false);
      if (this.level > 3 && Math.random() < 0.25) this.spawnEnemy(false);
    }

    if (this.powerTimer >= 10) {
      this.powerTimer = 0;
      this.spawnPowerUp();
    }

    if (this.levelTimer >= 18) {
      this.levelTimer = 0;
      this.level++;
      this.wave++;
      this.spawnDelay = Math.max(330, this.spawnDelay - 55);
      this.showToast(`Level ${this.level}`);
      if (this.level % 5 === 0) this.spawnEnemy(true);
    }

    this.handleMovement(dt);
    this.handleEnemies(dt);
    this.handlePowerUps();
    this.updateDepths();
    this.updateLabels();
    this.updateUI();
  }

  handleMovement(dt) {
    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) x -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) x += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) y -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) y += 1;

    x += this.joy.x;
    y += this.joy.y;

    const len = Math.sqrt(x * x + y * y);
    if (len > 0) {
      x /= len;
      y /= len;
      this.moveVector.set(x, y);

      const speed = 285 * (this.speedTime > 0 ? 1.35 : 1);
      this.player.x += x * speed * dt;
      this.player.y += y * speed * dt;

      this.player.setTexture(`${this.playerGender}_player_walk`);
      this.player.setFlipX(x < 0);
      if (this.footstepTimer <= 0) {
        this.footstepTimer = 420;
        this.playSound("snd_footstep", 0.12);
      }
    } else {
      this.player.setTexture(`${this.playerGender}_player_idle`);
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, 50, this.scale.width - 50);
    this.player.y = Phaser.Math.Clamp(this.player.y, 135, this.scale.height - 70);

    if (this.keys.SPACE.isDown) this.areaSlashAttack();
    if (this.keys.SHIFT.isDown) this.dash();
  }

  spawnEnemy(isBoss = false) {
    const { width, height } = this.scale;
    const side = Phaser.Math.Between(0, 3);
    let x = 0;
    let y = 0;

    if (side === 0) { x = Phaser.Math.Between(0, width); y = -80; }
    else if (side === 1) { x = width + 80; y = Phaser.Math.Between(100, height - 100); }
    else if (side === 2) { x = Phaser.Math.Between(0, width); y = height + 80; }
    else { x = -80; y = Phaser.Math.Between(100, height - 100); }

    const gender = Math.random() > 0.5 ? "male" : "female";
    const typeRoll = Math.random();
    let type = "normal";
    if (typeRoll > 0.82) type = "fast";
    if (typeRoll < 0.14 && this.level > 2) type = "tank";

    const key = isBoss ? "boss_enemy" : `${gender}_enemy_walk`;
    const enemy = this.add.sprite(x, y, key).setDepth(isBoss ? 27 : 25);
    enemy.gender = gender;
    enemy.type = isBoss ? "boss" : type;
    enemy.isBoss = isBoss;
    enemy.radius = isBoss ? 72 : 42;
    enemy.hp = isBoss ? 8 + this.level : type === "tank" ? 2 : 1;
    enemy.maxHp = enemy.hp;
    enemy.speed = (90 + this.level * 7 + Phaser.Math.Between(0, 35)) * (type === "fast" ? 1.35 : type === "tank" ? 0.72 : 1) * (isBoss ? 0.62 : 1);
    enemy.setDisplaySize(isBoss ? 160 : 92, isBoss ? 190 : 118);
    enemy.shadow = this.add.ellipse(x, y + (isBoss ? 66 : 48), isBoss ? 150 : 92, isBoss ? 42 : 28, 0x000000, 0.42).setDepth(18);

    const chosenName = this.pickEnemyName(isBoss);
    enemy.customName = chosenName;
    const labelText = isBoss
      ? (chosenName ? `Boss ${chosenName}` : "Boss")
      : chosenName;

    if (labelText) {
      enemy.nameText = this.add.text(x, y - (isBoss ? 112 : 76), labelText, {
        fontSize: isBoss ? "21px" : "18px",
        color: isBoss ? "#facc15" : "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(82);
    }

    // enemy.setInteractive({ useHandCursor: true });
    // enemy.on("pointerdown", (pointer) => {
    //   pointer.event?.stopPropagation?.();
    //   this.tapAttackEnemy(enemy);
    // });

    if (isBoss) {
      this.playSound("snd_boss", 0.45);
      this.showToast("BOSS WAVE!");
      this.createBossBar(enemy);
      this.bossEntryEffect();
    }

    this.enemies.push(enemy);
  }


  pickEnemyName(isBoss = false) {
    if (!this.enemyNames || this.enemyNames.length === 0) return "";

    this.enemySpawnCount++;

    // Keep nameless/default enemies mixed with named enemies.
    // Every few spawns intentionally returns blank.
    if (!isBoss && this.enemySpawnCount % 3 === 0) return "";

    // Make sure every name the player added appears at least once.
    if (this.enemyNameQueue.length > 0) {
      return this.enemyNameQueue.shift();
    }

    // After all names appeared once, continue a random mix:
    // about 60% named enemies and 40% nameless default enemies.
    if (!isBoss && Math.random() < 0.40) return "";

    return Phaser.Utils.Array.GetRandom(this.enemyNames);
  }

  createBossBar(enemy) {
    enemy.barBg = this.add.rectangle(enemy.x, enemy.y - 105, 120, 10, 0x111827, 0.9).setDepth(80);
    enemy.bar = this.add.rectangle(enemy.x - 60, enemy.y - 105, 120, 10, 0xfacc15, 1).setOrigin(0, 0.5).setDepth(81);
  }

  bossEntryEffect() {
    if (!this.darkOverlay) return;
    this.darkOverlay.setAlpha(0.35);
    this.cameras.main.shake(360, 0.012);
    this.time.delayedCall(460, () => {
      if (this.darkOverlay) this.darkOverlay.setAlpha(0.10);
    });
  }

  handleEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active || enemy.dying) continue;

      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.cr.x, this.cr.y);
      const freezeMult = this.freezeTime > 0 ? 0.16 : 1;
      enemy.x += Math.cos(angle) * enemy.speed * freezeMult * dt;
      enemy.y += Math.sin(angle) * enemy.speed * freezeMult * dt;
      enemy.setFlipX(Math.cos(angle) < 0);
      if (enemy.shadow) enemy.shadow.setPosition(enemy.x, enemy.y + (enemy.isBoss ? 66 : 48));
      if (enemy.nameText) enemy.nameText.setPosition(enemy.x, enemy.y - (enemy.isBoss ? 112 : 76));

      if (!enemy.isBoss && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 175) {
        enemy.setTexture(`${enemy.gender}_enemy_attack`);
      } else if (!enemy.isBoss) {
        enemy.setTexture(`${enemy.gender}_enemy_walk`);
      }

      if (enemy.barBg) {
        enemy.barBg.setPosition(enemy.x, enemy.y - 105);
        enemy.bar.setPosition(enemy.x - 60, enemy.y - 105);
        enemy.bar.width = Math.max(0, 120 * (enemy.hp / enemy.maxHp));
      }

      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.cr.x, this.cr.y) < enemy.radius + this.cr.radius) {
        this.removeEnemy(enemy);

        if (this.shieldTime > 0) {
          this.score += 8;
          this.showFloatingText("BLOCK", this.cr.x, this.cr.y - 70, "#93c5fd");
          this.playSound("snd_hit", 0.22);
          continue;
        }

        this.health -= enemy.isBoss ? 24 : 12;
        this.cameras.main.shake(130, 0.012);
        this.flashCR();
        this.playSound("snd_damage", 0.35);

        if (this.health <= 0) {
          this.health = 0;
          this.endGame();
          return;
        }
      }
    }
  }

  tapAttackEnemy(enemy) {
    if (!enemy || !enemy.active || enemy.dying) return;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    this.moveVector.set(Math.cos(angle), Math.sin(angle));
    this.player.setFlipX(Math.cos(angle) < 0);
    this.player.setTexture(`${this.playerGender}_player_slash`);

    this.weaponSound(enemy.isBoss);
    this.hitStop(enemy.isBoss ? 55 : 35);

    this.vibrate(enemy.isBoss ? 60 : 35);

    this.playerLunge(angle);
    this.createKnifeSlash(enemy.x, enemy.y, angle, enemy.isBoss ? 96 : 68);
    this.createRedHitEffect(enemy.x, enemy.y, enemy.isBoss ? 28 : 16);
    this.createSlashSparks(enemy.x, enemy.y, angle, enemy.isBoss ? 7 : 4);

    this.time.delayedCall(140, () => {
      if (this.player.active) this.player.setTexture(`${this.playerGender}_player_idle`);
    });

    if (enemy.isBoss) {
      enemy.hp -= 1;
      this.hitEnemy(enemy, angle, true);
      this.updateBossBar(enemy);

      if (enemy.hp <= 0) {
        this.killEnemy(enemy, 180, angle);
      } else {
        this.showFloatingText(`Boss HP ${enemy.hp}`, enemy.x, enemy.y - 70, "#facc15");
      }
      return;
    }

    // Normal enemies die with one tap.
    this.killEnemy(enemy, enemy.type === "fast" ? 30 : enemy.type === "tank" ? 40 : 18, angle);
  }

  areaSlashAttack() {
    if (this.attackCooldown > 0) return;

    this.attackCooldown = 330;
    this.player.setTexture(`${this.playerGender}_player_slash`);
    this.weaponSound(false);

    const angle = Math.atan2(this.moveVector.y, this.moveVector.x);
    const slash = this.add.graphics().setDepth(90);
    slash.fillStyle(0xef4444, 0.20);
    slash.slice(this.player.x, this.player.y, 170, angle - 1.0, angle + 1.0, false);
    slash.fillPath();
    slash.lineStyle(9, 0xffffff, 0.65);
    slash.beginPath();
    slash.arc(this.player.x, this.player.y, 170, angle - 1.0, angle + 1.0);
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 180,
      onComplete: () => slash.destroy(),
    });

    let hit = 0;
    const toHit = [];

    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.dying) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 160 + enemy.radius) {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const dot = (dx / len) * this.moveVector.x + (dy / len) * this.moveVector.y;
        if (dot > -0.35 || dist < 85) toHit.push(enemy);
      }
    }

    for (const enemy of toHit) {
      if (!enemy.active || enemy.dying) continue;
      hit++;
      const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);

      this.createRedHitEffect(enemy.x, enemy.y, enemy.isBoss ? 16 : 10);
      if (enemy.isBoss) {
        enemy.hp -= 1;
        this.hitEnemy(enemy, enemyAngle, true);
        this.updateBossBar(enemy);
        if (enemy.hp <= 0) this.killEnemy(enemy, 180, enemyAngle);
      } else {
        this.killEnemy(enemy, enemy.type === "fast" ? 25 : enemy.type === "tank" ? 35 : 15, enemyAngle);
      }
    }

    if (hit > 0) {
      this.hitStop(35);
      this.time.delayedCall(45, () => this.playSound(hit > 2 ? "snd_heavy_hit" : "snd_hit", 0.34));
      this.cameras.main.shake(100, 0.008);
    }

    this.time.delayedCall(130, () => {
      if (this.player.active) this.player.setTexture(`${this.playerGender}_player_idle`);
    });
  }

  hitEnemy(enemy, angle, heavy = false) {
    if (!enemy || !enemy.active) return;

    enemy.setTint(0xff5555);
    this.cameras.main.shake(heavy ? 120 : 80, heavy ? 0.01 : 0.006);

    this.tweens.add({
      targets: [enemy, enemy.shadow, enemy.nameText].filter(Boolean),
      x: enemy.x + Math.cos(angle) * (heavy ? 28 : 22),
      y: enemy.y + Math.sin(angle) * (heavy ? 28 : 22),
      duration: 80,
      yoyo: true,
      onComplete: () => {
        if (enemy.active) enemy.clearTint();
      },
    });
  }

  killEnemy(enemy, gainedScore, angle) {
    if (!enemy || !enemy.active || enemy.dying) return;

    enemy.dying = true;
    this.kills++;
    this.score += gainedScore;
    this.showFloatingText(`+${gainedScore}`, enemy.x, enemy.y, "#fde68a");
    this.createDeathSmoke(enemy.x, enemy.y);
    this.cameras.main.shake(enemy.isBoss ? 160 : 90, enemy.isBoss ? 0.012 : 0.007);

    this.tweens.add({
      targets: [enemy, enemy.shadow, enemy.nameText].filter(Boolean),
      x: enemy.x + Math.cos(angle) * (enemy.isBoss ? 80 : 55),
      y: enemy.y + Math.sin(angle) * (enemy.isBoss ? 80 : 55),
      angle: enemy.angle + Phaser.Math.Between(-35, 35),
      alpha: 0,
      scaleX: enemy.scaleX * 0.75,
      scaleY: enemy.scaleY * 0.75,
      duration: enemy.isBoss ? 340 : 230,
      ease: "Power2",
      onComplete: () => this.removeEnemy(enemy),
    });
  }

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) this.enemies.splice(index, 1);

    if (enemy.barBg) enemy.barBg.destroy();
    if (enemy.bar) enemy.bar.destroy();
    if (enemy.shadow) enemy.shadow.destroy();
    if (enemy.nameText) enemy.nameText.destroy();
    if (enemy.active) enemy.destroy();
  }

  updateBossBar(enemy) {
    if (enemy.bar && enemy.maxHp) {
      enemy.bar.width = Math.max(0, 120 * (enemy.hp / enemy.maxHp));
    }
  }

  createKnifeSlash(x, y, angle, size = 62) {
    if (this.actionGlow) {
      this.actionGlow.clear();
      this.actionGlow.fillStyle(0xef4444, 0.13);
      this.actionGlow.fillCircle(x, y, size + 48);
      this.time.delayedCall(170, () => this.actionGlow && this.actionGlow.clear());
    }
    const g = this.add.graphics().setDepth(120);
    g.lineStyle(15, 0xffffff, 0.82);
    g.beginPath();
    g.arc(x, y, size, angle - 1.15, angle + 1.15);
    g.strokePath();

    g.lineStyle(6, 0xef4444, 0.92);
    g.beginPath();
    g.arc(x, y, size + 8, angle - 0.9, angle + 0.9);
    g.strokePath();

    this.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 180,
      ease: "Power2",
      onComplete: () => g.destroy(),
    });
  }

  createRedHitEffect(x, y, amount = 12) {
    for (let i = 0; i < amount; i++) {
      const dot = this.add.image(x, y, "red_particle")
        .setDisplaySize(Phaser.Math.Between(7, 15), Phaser.Math.Between(7, 15))
        .setAlpha(0.82)
        .setDepth(110);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(35, 105);

      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 260,
        ease: "Power2",
        onComplete: () => dot.destroy(),
      });
    }
  }

  createDeathSmoke(x, y) {
    for (let i = 0; i < 8; i++) {
      const smoke = this.add.circle(x, y, Phaser.Math.Between(8, 18), 0x111827, 0.35).setDepth(100);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(25, 80);

      this.tweens.add({
        targets: smoke,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 1.8,
        duration: 360,
        onComplete: () => smoke.destroy(),
      });
    }
  }


  weaponSound(heavy = false) {
    this.playSound("snd_whoosh", heavy ? 0.48 : 0.42);
    this.time.delayedCall(42, () => this.playSound(heavy ? "snd_heavy_hit" : "snd_hit", heavy ? 0.42 : 0.35));
    this.time.delayedCall(70, () => this.playSound("snd_damage", heavy ? 0.12 : 0.08));
  }

  hitStop(ms = 35) {
    this.hitPause = true;
    this.time.delayedCall(ms, () => {
      this.hitPause = false;
    });
  }

  playerLunge(angle) {
    this.tweens.add({
      targets: [this.player, this.playerShadow].filter(Boolean),
      x: `+=${Math.cos(angle) * 38}`,
      y: `+=${Math.sin(angle) * 38}`,
      duration: 55,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  createSlashSparks(x, y, angle, amount = 4) {
    for (let i = 0; i < amount; i++) {
      const spark = this.add.image(x, y, "slash_particle")
        .setDisplaySize(Phaser.Math.Between(26, 42), Phaser.Math.Between(26, 42))
        .setAlpha(0.78)
        .setRotation(angle + Phaser.Math.FloatBetween(-0.7, 0.7))
        .setDepth(114);
      const a = angle + Phaser.Math.FloatBetween(-1.0, 1.0);
      const distance = Phaser.Math.Between(30, 95);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(a) * distance,
        y: y + Math.sin(a) * distance,
        alpha: 0,
        scaleX: 0.25,
        scaleY: 0.25,
        duration: 230,
        ease: "Power2",
        onComplete: () => spark.destroy(),
      });
    }
  }

  updateDepths() {
    if (this.cr) this.cr.setDepth(this.cr.y);
    if (this.player) this.player.setDepth(this.player.y);
    if (this.crShadow) this.crShadow.setDepth(this.cr.y - 10);
    if (this.playerShadow) this.playerShadow.setDepth(this.player.y - 10);
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.setDepth(enemy.y);
      if (enemy.shadow) enemy.shadow.setDepth(enemy.y - 10);
      if (enemy.nameText) enemy.nameText.setDepth(enemy.y + 12);
    }
  }

  dash() {
    if (this.dashCooldown > 0) return;

    this.dashCooldown = 950;
    this.player.x += this.moveVector.x * 125;
    this.player.y += this.moveVector.y * 125;
    this.player.x = Phaser.Math.Clamp(this.player.x, 50, this.scale.width - 50);
    this.player.y = Phaser.Math.Clamp(this.player.y, 135, this.scale.height - 70);
    this.cameras.main.shake(60, 0.005);

    const ghost = this.add.sprite(this.player.x - this.moveVector.x * 50, this.player.y - this.moveVector.y * 50, `${this.playerGender}_player_idle`)
      .setDisplaySize(108, 138)
      .setAlpha(0.35)
      .setDepth(18);

    this.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 220,
      onComplete: () => ghost.destroy(),
    });
  }

  spawnPowerUp() {
    const types = ["health", "shield", "freeze", "speed"];
    const type = Phaser.Utils.Array.GetRandom(types);

    const power = this.add.image(
      Phaser.Math.Between(90, this.scale.width - 90),
      Phaser.Math.Between(190, this.scale.height - 230),
      `power_${type}`
    ).setDisplaySize(54, 54).setDepth(22);

    power.type = type;
    power.radius = 35;

    this.tweens.add({
      targets: power,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.powerUps.push(power);
  }

  handlePowerUps() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const power = this.powerUps[i];
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, power.x, power.y);

      if (dist < power.radius + this.player.radius) {
        this.collectPower(power.type, power.x, power.y);
        power.destroy();
        this.powerUps.splice(i, 1);
      }
    }
  }

  collectPower(type, x, y) {
    this.score += 20;
    this.playSound("snd_powerup", 0.38);

    if (type === "health") {
      this.health = Math.min(100, this.health + 25);
      this.showFloatingText("Health +25", x, y, "#86efac");
    }

    if (type === "shield") {
      this.shieldTime = 8;
      this.showFloatingText("Shield", x, y, "#93c5fd");
    }

    if (type === "freeze") {
      this.freezeTime = 5;
      this.showFloatingText("Freeze", x, y, "#67e8f9");
    }

    if (type === "speed") {
      this.speedTime = 7;
      this.showFloatingText("Speed", x, y, "#c4b5fd");
    }
  }

  flashCR() {
    this.cr.setTint(0xffb4b4);
    this.time.delayedCall(130, () => {
      if (this.cr.active) this.cr.clearTint();
    });
  }

  updateLabels() {
    this.crNameText.setPosition(this.cr.x, this.cr.y - 88);
    this.playerNameText.setPosition(this.player.x, this.player.y - 92);
    if (this.crShadow) this.crShadow.setPosition(this.cr.x, this.cr.y + 48);
    if (this.playerShadow) this.playerShadow.setPosition(this.player.x, this.player.y + 50);
  }

  updateUI() {
    this.scoreText.setText(`Score: ${this.score}\nKills: ${this.kills}`);
    this.levelText.setText(`Level ${this.level}  |  Wave ${this.wave}`);

    this.healthBar.width = Math.max(0, 250 * (this.health / 100));

    if (this.health > 55) this.healthBar.setFillStyle(0x22c55e);
    else if (this.health > 25) this.healthBar.setFillStyle(0xf97316);
    else this.healthBar.setFillStyle(0xef4444);

    const powers = [];
    if (this.shieldTime > 0) powers.push(`Shield ${Math.ceil(this.shieldTime)}s`);
    if (this.freezeTime > 0) powers.push(`Freeze ${Math.ceil(this.freezeTime)}s`);
    if (this.speedTime > 0) powers.push(`Speed ${Math.ceil(this.speedTime)}s`);
    this.powerText.setText(powers.join("   "));

    if (this.shieldTime > 0) {
      if (!this.shieldCircle) {
        this.shieldCircle = this.add.circle(this.cr.x, this.cr.y, 62, 0x93c5fd, 0.15)
          .setStrokeStyle(4, 0x93c5fd, 0.75)
          .setDepth(19);
      }
      this.shieldCircle.setPosition(this.cr.x, this.cr.y);
      this.shieldCircle.setVisible(true);
    } else if (this.shieldCircle) {
      this.shieldCircle.setVisible(false);
    }
  }

  showFloatingText(text, x, y, color = "#ffffff") {
    const label = this.add.text(x, y, text, {
      fontSize: "26px",
      color,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(230);

    this.tweens.add({
      targets: label,
      y: y - 58,
      alpha: 0,
      duration: 850,
      onComplete: () => label.destroy(),
    });
  }

  showToast(text) {
    this.showFloatingText(text, this.scale.width / 2, 160, "#facc15");
  }

  vibrate(duration = 30) {
    if (this.vibrationOn && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  playSound(key, volume = 0.3) {
    if (this.soundOn) this.sound.play(key, { volume });
  }

  pauseGame() {
    if (this.bgMusic) this.bgMusic.pause();
    this.scene.pause();
    this.scene.launch("GameOverScene", {
      paused: true,
      score: this.score,
      kills: this.kills,
      level: this.level,
      highScore: this.highScore,
      parentData: {
        crName: this.crName,
        playerName: this.playerName,
        enemyNames: [...this.enemyNames],
        crGender: this.crGender,
        playerGender: this.playerGender,
        theme: this.theme,
        soundOn: this.soundOn,
      vibrationOn: this.vibrationOn,
      },
    });
  }

  endGame() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("crHighScoreV3", String(this.highScore));
    }

    this.scene.start("GameOverScene", {
      paused: false,
      score: this.score,
      kills: this.kills,
      level: this.level,
      highScore: this.highScore,
      parentData: {
        crName: this.crName,
        playerName: this.playerName,
        enemyNames: [...this.enemyNames],
        crGender: this.crGender,
        playerGender: this.playerGender,
        theme: this.theme,
        soundOn: this.soundOn,
      vibrationOn: this.vibrationOn,
      },
    });
  }
}
