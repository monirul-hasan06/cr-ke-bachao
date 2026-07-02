import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 70, "Loading CR কে বাঁচাও...", {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const bg = this.add.rectangle(width / 2, height / 2, 460, 28, 0x1e293b, 1);
    const bar = this.add.rectangle(width / 2 - 230, height / 2, 0, 28, 0xef4444, 1).setOrigin(0, 0.5);

    this.load.on("progress", (value) => {
      bar.width = 460 * value;
    });

    this.load.image("male_cr", "assets/characters/male_cr_idle.png");
    this.load.image("female_cr", "assets/characters/female_cr_idle.png");

    this.load.image("male_player_idle", "assets/characters/male_player_idle.png");
    this.load.image("male_player_walk", "assets/characters/male_player_walk.png");
    this.load.image("male_player_slash", "assets/characters/male_player_slash.png");
    this.load.image("female_player_idle", "assets/characters/female_player_idle.png");
    this.load.image("female_player_walk", "assets/characters/female_player_walk.png");
    this.load.image("female_player_slash", "assets/characters/female_player_slash.png");

    this.load.image("male_enemy_walk", "assets/characters/male_enemy_walk.png");
    this.load.image("male_enemy_attack", "assets/characters/male_enemy_attack.png");
    this.load.image("female_enemy_walk", "assets/characters/female_enemy_walk.png");
    this.load.image("female_enemy_attack", "assets/characters/female_enemy_attack.png");
    this.load.image("boss_enemy", "assets/characters/boss_enemy.png");

    this.load.image("bg_classroom", "assets/backgrounds/classroom.png");
    this.load.image("bg_campus", "assets/backgrounds/campus.png");
    this.load.image("bg_exam", "assets/backgrounds/exam_hall.png");

    this.load.image("ui_joystick_base", "assets/ui/joystick_base.png");
    this.load.image("ui_joystick_knob", "assets/ui/joystick_knob.png");
    this.load.image("ui_slash", "assets/ui/slash_button.png");
    this.load.image("ui_dash", "assets/ui/dash_button.png");
    this.load.image("ui_pause", "assets/ui/pause_button.png");
    this.load.image("red_particle", "assets/ui/red_particle.png");

    this.load.image("power_health", "assets/ui/power_health.png");
    this.load.image("power_shield", "assets/ui/power_shield.png");
    this.load.image("power_freeze", "assets/ui/power_freeze.png");
    this.load.image("power_speed", "assets/ui/power_speed.png");

    this.load.audio("snd_whoosh", "assets/sounds/slash_whoosh.wav");
    this.load.audio("snd_hit", "assets/sounds/slash_hit.wav");
    this.load.audio("snd_heavy_hit", "assets/sounds/heavy_hit.wav");
    this.load.audio("snd_damage", "assets/sounds/damage.wav");
    this.load.audio("snd_powerup", "assets/sounds/powerup.wav");
    this.load.audio("snd_boss", "assets/sounds/boss_warning.wav");
    this.load.audio("snd_click", "assets/sounds/button_click.wav");
    this.load.audio("snd_footstep", "assets/sounds/footstep.wav");
    this.load.audio("snd_bg", "assets/sounds/bg_music.wav");
  }

  create() {
    this.scene.start("MenuScene");
  }
}
