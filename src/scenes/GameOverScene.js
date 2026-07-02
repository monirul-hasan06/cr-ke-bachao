import Phaser from "phaser";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.paused = data.paused || false;
    this.score = data.score || 0;
    this.kills = data.kills || 0;
    this.level = data.level || 1;
    this.highScore = data.highScore || Number(localStorage.getItem("crHighScore") || 0);
    this.parentData = data.parentData || {};
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.84);

    this.add.text(width / 2, 250, this.paused ? "Paused" : "Game Over", {
      fontSize: "58px",
      color: this.paused ? "#bfdbfe" : "#fecaca",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(width / 2, 405, `Score: ${this.score}\nKills: ${this.kills}\nLevel: ${this.level}\nHigh Score: ${this.highScore}`, {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 14,
    }).setOrigin(0.5);

    if (this.paused) {
      this.makeButton(width / 2, 640, "RESUME", () => {
        this.scene.stop();
        const game = this.scene.get("GameScene");
        this.scene.resume("GameScene");
        if (game.bgMusic) game.bgMusic.resume();
      });

      this.makeButton(width / 2, 735, "MAIN MENU", () => {
        this.scene.stop("GameScene");
        this.scene.start("MenuScene");
      }, 0x1e293b);
      return;
    }

    this.makeButton(width / 2, 660, "RESTART", () => {
      this.scene.start("GameScene", this.parentData);
    });

    this.makeButton(width / 2, 755, "MAIN MENU", () => {
      this.scene.start("MenuScene");
    }, 0x1e293b);
  }

  makeButton(x, y, label, callback, color = 0xef4444) {
    const bg = this.add.rectangle(x, y, 380, 68, color, 20).setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    bg.on("pointerdown", callback);
    text.setInteractive({ useHandCursor: true }).on("pointerdown", callback);
  }
}
