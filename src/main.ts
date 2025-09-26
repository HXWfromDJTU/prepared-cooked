import Phaser from 'phaser';
import { MainScene } from './scenes';
import { MenuScene } from './scenes/MenuScene';

// 游戏配置
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  backgroundColor: '#2c3e50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false
    }
  },
  scene: [MenuScene, MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 全局游戏实例，方便调试
(window as any).game = game;

console.log('《预制菜厨房》第五阶段 启动完成！');
console.log('选择难度开始游戏');