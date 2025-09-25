import { Direction } from '../types';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };
  private spaceKey: Phaser.Input.Keyboard.Key;
  private rKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      w: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.spaceKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.rKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  public getMovementDirection(): Direction | null {
    // 检查方向键和WASD键
    if (this.cursors.up?.isDown || this.wasdKeys.w.isDown) return Direction.UP;
    if (this.cursors.down?.isDown || this.wasdKeys.s.isDown) return Direction.DOWN;
    if (this.cursors.left?.isDown || this.wasdKeys.a.isDown) return Direction.LEFT;
    if (this.cursors.right?.isDown || this.wasdKeys.d.isDown) return Direction.RIGHT;
    return null;
  }

  public isMoving(): boolean {
    return (this.cursors.up?.isDown || this.wasdKeys.w.isDown) ||
           (this.cursors.down?.isDown || this.wasdKeys.s.isDown) ||
           (this.cursors.left?.isDown || this.wasdKeys.a.isDown) ||
           (this.cursors.right?.isDown || this.wasdKeys.d.isDown);
  }

  public isInteractPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }

  public isInteractHeld(): boolean {
    return this.spaceKey.isDown;
  }

  public isRestartPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.rKey);
  }
}