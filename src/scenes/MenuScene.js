import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.crGender = "male";
    this.playerGender = "male";
    this.theme = "classroom";
    this.soundOn = localStorage.getItem("crSoundOn") !== "false";
    this.vibrationOn = localStorage.getItem("crVibrationOn") !== "false";
    this.enemyNames = [];

    const { width, height } = this.scale;

    this.bg = this.add.image(width / 2, height / 2, "bg_classroom").setDisplaySize(width, height).setAlpha(0.55);
    this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.48);

    this.add.text(width / 2, 68, "CR কে বাঁচাও", {
      fontSize: "50px",
      color: "#fecaca",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(width / 2, 113, "", {
      fontSize: "19px",
      color: "#cbd5e1",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, 164, "CR Name(editable)", this.labelStyle()).setOrigin(0.5);
    this.crInput = this.add.dom(width / 2, 203).createFromHTML(
      '<input class="game-input" name="crName" maxlength="12" value="CR" placeholder="CR Name">'
    );

    this.add.text(width / 2, 260, "Player Name(editable)", this.labelStyle()).setOrigin(0.5);
    this.playerInput = this.add.dom(width / 2, 299).createFromHTML(
      '<input class="game-input" name="playerName" maxlength="12" value="YOU" placeholder="Player Name">'
    );

    this.add.text(width / 2, 356, "Enemy Names (Optional,click + to add more)", this.labelStyle()).setOrigin(0.5);
    this.enemyInput = this.add.dom(315, 395).createFromHTML(
      '<input class="game-input" style="width:330px" name="enemyName" maxlength="12" value="" placeholder="Type name, then press +">'
    );
    this.addNameBtn = this.makeButton(570, 395, "+", () => this.addEnemyName(), 70);
    this.clearNameBtn = this.makeButton(650, 395, "Clear", () => this.clearEnemyNames(), 92);

    this.nameListText = this.add.text(width / 2, 443, "No names added — nameless enemies will still appear", {
      fontSize: "17px",
      color: "#cbd5e1",
      fontStyle: "bold",
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const enemyNode = this.enemyInput.getChildByName("enemyName");
    if (enemyNode) {
      enemyNode.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.addEnemyName();
        }
      });
    }

    this.add.text(width / 2, 500, "CR Gender", this.labelStyle()).setOrigin(0.5);
    this.crMaleBtn = this.makeButton(235, 548, "Male CR", () => this.setCRGender("male"));
    this.crFemaleBtn = this.makeButton(485, 548, "Female CR", () => this.setCRGender("female"));

    this.add.text(width / 2, 613, "Player Gender", this.labelStyle()).setOrigin(0.5);
    this.playerMaleBtn = this.makeButton(235, 661, "Male Player", () => this.setPlayerGender("male"));
    this.playerFemaleBtn = this.makeButton(485, 661, "Female Player", () => this.setPlayerGender("female"));

    this.add.text(width / 2, 725, "Background", this.labelStyle()).setOrigin(0.5);
    this.classBtn = this.makeButton(155, 773, "Classroom", () => this.setTheme("classroom"), 160);
    this.campusBtn = this.makeButton(360, 773, "Campus", () => this.setTheme("campus"), 150);
    this.examBtn = this.makeButton(565, 773, "Exam Hall", () => this.setTheme("exam"), 170);

    this.soundBtn = this.makeButton(230, 846, this.soundOn ? "Sound: ON" : "Sound: OFF", () => {
      this.soundOn = !this.soundOn;
      localStorage.setItem("crSoundOn", String(this.soundOn));
      this.soundBtn.text.setText(this.soundOn ? "Sound: ON" : "Sound: OFF");
      this.playClick();
    }, 220);

    this.vibrationBtn = this.makeButton(490, 846, this.vibrationOn ? "Vibration: ON" : "Vibration: OFF", () => {
      this.vibrationOn = !this.vibrationOn;
      localStorage.setItem("crVibrationOn", String(this.vibrationOn));
      this.vibrationBtn.text.setText(this.vibrationOn ? "Vibration: ON" : "Vibration: OFF");
      this.playClick();
      if (this.vibrationOn && navigator.vibrate) navigator.vibrate(25);
    }, 245);

    this.startBtn = this.makeButton(width / 2, 930, "START GAME", () => this.startGame(), 430, true);

    this.installBtn = this.makeButton(width / 2, 1015, "INSTALL APP", () => this.installApp(), 310);
    this.updateInstallButton();

    window.addEventListener("cr-pwa-ready", () => this.updateInstallButton());
    window.addEventListener("cr-pwa-installed", () => this.updateInstallButton());

    this.add.text(width / 2, height - 112, "Names added with + will spawn mixed with nameless default enemies\nMobile: tap enemy / joystick / slash / dash", {
      fontSize: "18px",
      color: "#94a3b8",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 8,
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.refreshButtons();
    this.refreshNameList();
  }

  labelStyle() {
    return {
      fontSize: "21px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    };
  }

  makeButton(x, y, label, callback, w = 220, primary = false) {
    const bg = this.add.rectangle(x, y, w, 56, primary ? 0xef4444 : 0x1e293b, 18)
      .setStrokeStyle(2, primary ? 0xfca5a5 : 0x475569, 0.75)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontSize: primary ? "27px" : label === "+" ? "30px" : "18px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const run = () => {
      this.playClick();
      callback();
    };

    bg.on("pointerdown", run);
    text.setInteractive({ useHandCursor: true }).on("pointerdown", run);

    return { bg, text };
  }

  addEnemyName() {
    const node = this.enemyInput.getChildByName("enemyName");
    const name = (node?.value || "").trim().slice(0, 12);
    if (!name) return;

    const exists = this.enemyNames.some((item) => item.toLowerCase() === name.toLowerCase());
    if (!exists) this.enemyNames.push(name);
    if (node) node.value = "";
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
    this.nameListText.setText(`Added (${this.enemyNames.length}): ${preview}${extra}\nNamed + nameless enemies will spawn mixed`);
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
    if (this.soundOn) this.sound.play("snd_click", { volume: 0.45 });
  }


  updateInstallButton() {
    if (!this.installBtn) return;

    const isStandalone = window.crIsInstalled || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
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

    const isStandalone = window.crIsInstalled || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
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
    if (this.menuMessage) this.menuMessage.destroy();

    this.menuMessage = this.add.text(this.scale.width / 2, 1082, message, {
      fontSize: "18px",
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
    });
  }
}
