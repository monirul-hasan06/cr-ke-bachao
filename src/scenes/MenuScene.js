import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.crGender = "male";
    this.playerGender = "male";
    this.theme = "classroom";
    this.soundOn = localStorage.getItem("crSoundOn") !== "false";
    this.vibrationOn = localStorage.getItem("crVibrationOn") !== "false";
    this.musicOn = localStorage.getItem("crMusicOn") !== "false";
    this.menuMusicKey = "music_bg";
    this.enemyNames = [];

    this.bg = this.add
      .image(width / 2, height / 2, "bg_classroom")
      .setDisplaySize(width, height)
      .setAlpha(0.55);

    this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.52);

    this.add.text(width / 2, 54, "CR কে বাঁচাও", {
      fontSize: "46px",
      color: "#fecaca",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(width / 2, 126, "CR Name (editable)", this.labelStyle()).setOrigin(0.5);

    this.crInput = this.add.dom(width / 2, 163).createFromHTML(
      '<input class="game-input" name="crName" maxlength="12" value="CR" placeholder="CR Name">'
    );

    this.add.text(width / 2, 214, "Player Name (editable)", this.labelStyle()).setOrigin(0.5);

    this.playerInput = this.add.dom(width / 2, 251).createFromHTML(
      '<input class="game-input" name="playerName" maxlength="12" value="YOU" placeholder="Player Name">'
    );

    this.add.text(
      width / 2,
      303,
      "Enemy Names (Optional, click + to add more)",
      this.labelStyle()
    ).setOrigin(0.5);

    this.enemyInput = this.add.dom(300, 342).createFromHTML(
      '<input class="game-input" style="width:315px" name="enemyName" maxlength="12" value="" placeholder="Type name, then press +">'
    );

    this.addNameBtn = this.makeButton(555, 342, "+", () => this.addEnemyName(), 70);
    this.clearNameBtn = this.makeButton(638, 342, "Clear", () => this.clearEnemyNames(), 95);

    this.nameListText = this.add.text(
      width / 2,
      390,
      "No names added — nameless enemies will still appear",
      {
        fontSize: "15px",
        color: "#cbd5e1",
        fontStyle: "bold",
        align: "center",
        stroke: "#000000",
        strokeThickness: 3,
      }
    ).setOrigin(0.5);

    const enemyNode = this.enemyInput.getChildByName("enemyName");

    if (enemyNode) {
      enemyNode.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.addEnemyName();
        }
      });
    }

    this.add.text(width / 2, 438, "CR Gender", this.labelStyle()).setOrigin(0.5);

    this.crMaleBtn = this.makeButton(245, 482, "Male CR", () => this.setCRGender("male"), 205);
    this.crFemaleBtn = this.makeButton(475, 482, "Female CR", () => this.setCRGender("female"), 205);

    this.add.text(width / 2, 534, "Player Gender", this.labelStyle()).setOrigin(0.5);

    this.playerMaleBtn = this.makeButton(245, 578, "Male Player", () => this.setPlayerGender("male"), 205);
    this.playerFemaleBtn = this.makeButton(475, 578, "Female Player", () => this.setPlayerGender("female"), 205);

    this.add.text(width / 2, 630, "Background", this.labelStyle()).setOrigin(0.5);

    this.classBtn = this.makeButton(160, 674, "Classroom", () => this.setTheme("classroom"), 160);
    this.campusBtn = this.makeButton(360, 674, "Campus", () => this.setTheme("campus"), 150);
    this.examBtn = this.makeButton(560, 674, "Exam Hall", () => this.setTheme("exam"), 170);

    this.soundBtn = this.makeButton(
      230,
      748,
      this.soundOn ? "Sound: ON" : "Sound: OFF",
      () => {
        this.soundOn = !this.soundOn;
        localStorage.setItem("crSoundOn", String(this.soundOn));
        this.soundBtn.text.setText(this.soundOn ? "Sound: ON" : "Sound: OFF");
        this.playClick();
      },
      230
    );

    this.vibrationBtn = this.makeButton(
      490,
      748,
      this.vibrationOn ? "Vibration: ON" : "Vibration: OFF",
      () => {
        this.vibrationOn = !this.vibrationOn;
        localStorage.setItem("crVibrationOn", String(this.vibrationOn));
        this.vibrationBtn.text.setText(this.vibrationOn ? "Vibration: ON" : "Vibration: OFF");
        this.playClick();

        if (this.vibrationOn && navigator.vibrate) {
          navigator.vibrate(25);
        }
      },
      250
    );

    this.musicBtn = this.makeButton(
      width / 2,
      818,
      this.musicOn ? "Music: ON" : "Music: OFF",
      () => {
        this.musicOn = !this.musicOn;
        localStorage.setItem("crMusicOn", String(this.musicOn));
        this.musicBtn.text.setText(this.musicOn ? "Music: ON" : "Music: OFF");
        this.playClick();

        if (this.musicOn) {
          this.startMenuMusic();
        } else {
          this.stopMenuMusic();
        }
      },
      245
    );

    this.startBtn = this.makeButton(
      width / 2,
      895,
      "START GAME",
      () => this.startGame(),
      430,
      true
    );

    this.installBtn = this.makeButton(
      width / 2,
      972,
      "INSTALL APP",
      () => this.installApp(),
      310
    );

    this.updateInstallButton();

    this.add.text(width / 2, 1045, "Made by ", {
      fontSize: "18px",
      color: "#cbd5e1",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(1, 0.5).setDepth(300);

    const techCanvixLink = this.add.text(width / 2, 1045, "TechCanvix", {
      fontSize: "18px",
      color: "#22c55e",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(300).setInteractive({ useHandCursor: true });

    techCanvixLink.on("pointerdown", () => {
      window.open("https://www.facebook.com/techcanvix", "_blank");
    });

    window.addEventListener("cr-pwa-ready", () => this.updateInstallButton());
    window.addEventListener("cr-pwa-installed", () => this.updateInstallButton());

    this.add.text(
      width / 2,
      height - 58,
      "Names added with + will spawn mixed with nameless default enemies\nMobile: joystick / slash / dash",
      {
        fontSize: "15px",
        color: "#94a3b8",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 6,
        stroke: "#000000",
        strokeThickness: 3,
      }
    ).setOrigin(0.5);

    this.refreshButtons();
    this.refreshNameList();

    if (this.musicOn) {
      this.time.delayedCall(300, () => {
        this.startMenuMusic();
      });
    }
  }

  labelStyle() {
    return {
      fontSize: "19px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    };
  }

  makeButton(x, y, label, callback, w = 220, primary = false) {
    const bg = this.add
      .rectangle(x, y, w, 54, primary ? 0xef4444 : 0x1e293b, 16)
      .setStrokeStyle(2, primary ? 0xfca5a5 : 0x475569, 0.8)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontSize: primary ? "25px" : label === "+" ? "30px" : "17px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);

    const run = () => {
      this.playClick();
      callback();
    };

    bg.on("pointerdown", run);
    text.setInteractive({ useHandCursor: true }).on("pointerdown", run);

    return { bg, text };
  }

  startMenuMusic() {
    if (!this.musicOn) return;

    if (!this.cache.audio.exists(this.menuMusicKey)) {
      console.warn(`Music not loaded: ${this.menuMusicKey}`);
      this.showMenuMessage("Music file not loaded");
      return;
    }

    const existingMusic = this.sound.get(this.menuMusicKey);

    if (existingMusic && existingMusic.isPlaying) {
      this.bgMusic = existingMusic;
      return;
    }

    this.bgMusic = this.sound.add(this.menuMusicKey, {
      volume: 0.18,
      loop: true,
    });

    this.bgMusic.play();
  }

  stopMenuMusic() {
    const existingMusic = this.sound.get(this.menuMusicKey);

    if (existingMusic) {
      existingMusic.stop();
      existingMusic.destroy();
    }

    if (this.bgMusic) {
      this.bgMusic = null;
    }
  }

  addEnemyName() {
    const node = this.enemyInput.getChildByName("enemyName");
    const name = (node?.value || "").trim().slice(0, 12);

    if (!name) return;

    const exists = this.enemyNames.some(
      (item) => item.toLowerCase() === name.toLowerCase()
    );

    if (!exists) {
      this.enemyNames.push(name);
    }

    if (node) {
      node.value = "";
    }

    this.refreshNameList();
  }

  clearEnemyNames() {
    this.enemyNames = [];
    this.refreshNameList();
  }

  refreshNameList() {
    if (!this.nameListText) return;

    if (this.enemyNames.length === 0) {
      this.nameListText.setText("No names added — nameless enemies will still appear");
      return;
    }

    const preview = this.enemyNames.slice(0, 5).join(", ");
    const extra = this.enemyNames.length > 5 ? ` +${this.enemyNames.length - 5} more` : "";

    this.nameListText.setText(
      `Added (${this.enemyNames.length}): ${preview}${extra}\nNamed + nameless enemies will spawn mixed`
    );
  }

  setCRGender(gender) {
    this.crGender = gender;
    this.refreshButtons();
  }

  setPlayerGender(gender) {
    this.playerGender = gender;
    this.refreshButtons();
  }

  setTheme(theme) {
    this.theme = theme;
    this.bg.setTexture(`bg_${theme}`).setAlpha(0.55);
    this.refreshButtons();
  }

  refreshButtons() {
    const active = 0xef4444;
    const normal = 0x1e293b;

    this.crMaleBtn.bg.setFillStyle(this.crGender === "male" ? active : normal);
    this.crFemaleBtn.bg.setFillStyle(this.crGender === "female" ? active : normal);

    this.playerMaleBtn.bg.setFillStyle(this.playerGender === "male" ? active : normal);
    this.playerFemaleBtn.bg.setFillStyle(this.playerGender === "female" ? active : normal);

    this.classBtn.bg.setFillStyle(this.theme === "classroom" ? active : normal);
    this.campusBtn.bg.setFillStyle(this.theme === "campus" ? active : normal);
    this.examBtn.bg.setFillStyle(this.theme === "exam" ? active : normal);
  }

  playClick() {
    if (this.soundOn) {
      this.sound.play("snd_click", { volume: 0.45 });
    }
  }

  updateInstallButton() {
    if (!this.installBtn) return;

    const isStandalone =
      window.crIsInstalled ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);

    const hasPrompt = Boolean(window.crDeferredInstallPrompt);

    if (isStandalone) {
      this.installBtn.text.setText("APP INSTALLED");
      this.installBtn.bg.setAlpha(0.55);
      return;
    }

    this.installBtn.text.setText("INSTALL APP");
    this.installBtn.bg.setAlpha(hasPrompt ? 1 : 0.88);
  }

  async installApp() {
    this.playClick();

    const isStandalone =
      window.crIsInstalled ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);

    if (isStandalone) {
      this.showMenuMessage("Already installed");
      return;
    }

    if (!window.crRequestInstall || !window.crDeferredInstallPrompt) {
      this.showMenuMessage("Deploy to HTTPS, then tap Install App");
      return;
    }

    const result = await window.crRequestInstall();

    if (result === "accepted") {
      this.showMenuMessage("Installing app...");
    } else {
      this.showMenuMessage("Install cancelled");
    }

    this.updateInstallButton();
  }

  showMenuMessage(message) {
    if (this.menuMessage) {
      this.menuMessage.destroy();
    }

    this.menuMessage = this.add.text(this.scale.width / 2, 1098, message, {
      fontSize: "17px",
      color: "#e2e8f0",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(300);

    this.time.delayedCall(2300, () => {
      if (this.menuMessage) {
        this.menuMessage.destroy();
        this.menuMessage = null;
      }
    });
  }

  startGame() {
    this.addEnemyName();

    const crNode = this.crInput.getChildByName("crName");
    const playerNode = this.playerInput.getChildByName("playerName");

    const crName = (crNode?.value || "CR").trim().slice(0, 12) || "CR";
    const playerName = (playerNode?.value || "YOU").trim().slice(0, 12) || "YOU";

    this.scene.start("GameScene", {
      crName,
      playerName,
      enemyNames: [...this.enemyNames],
      crGender: this.crGender,
      playerGender: this.playerGender,
      theme: this.theme,
      soundOn: this.soundOn,
      vibrationOn: this.vibrationOn,
      musicOn: this.musicOn,
    });
  }
}