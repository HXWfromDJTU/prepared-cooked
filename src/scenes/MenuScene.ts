/**
 * 第五阶段：主菜单场景
 * 负责显示游戏标题和难度选择
 */
export class MenuScene extends Phaser.Scene {
  private gameWidth: number = 800;
  private gameHeight: number = 600;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // 设置背景颜色
    this.cameras.main.setBackgroundColor(0x2c3e50);

    // 游戏标题
    const titleText = this.add.text(this.gameWidth / 2, 150, '预制菜厨房', {
      fontSize: '48px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 第五阶段说明
    const stageText = this.add.text(this.gameWidth / 2, 200, '第五阶段：多菜品和难度选择', {
      fontSize: '20px',
      color: '#bdc3c7',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 难度选择标题
    const difficultyTitle = this.add.text(this.gameWidth / 2, 280, '选择难度', {
      fontSize: '32px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 创建难度选择按钮
    this.createDifficultyButton('简单', 'simple', 350, '黄米凉糕 (1种食材)', '30秒一单', 'x1倍分数');
    this.createDifficultyButton('中等', 'medium', 420, '番茄牛腩饭 (2种食材)', '20秒一单', 'x2倍分数');
    this.createDifficultyButton('困难', 'hard', 490, '牛大骨套餐 (3种食材)', '15秒一单', 'x3倍分数');

    // 第六阶段：排行榜按钮
    const leaderboardButton = this.add.rectangle(this.gameWidth / 2, 530, 200, 40, 0xf39c12);
    leaderboardButton.setStrokeStyle(2, 0xecf0f1);
    leaderboardButton.setInteractive({ useHandCursor: true });

    const leaderboardButtonText = this.add.text(this.gameWidth / 2, 530, '🏆 查看排行榜', {
      fontSize: '16px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    leaderboardButton.on('pointerover', () => {
      leaderboardButton.setFillStyle(0xe67e22);
    });

    leaderboardButton.on('pointerout', () => {
      leaderboardButton.setFillStyle(0xf39c12);
    });

    leaderboardButton.on('pointerdown', () => {
      // 动态导入排行榜管理器
      import('../managers/LeaderboardManager').then(({ LeaderboardManager }) => {
        LeaderboardManager.showLeaderboard();
      });
    });

    // 游戏说明
    const instructionText = this.add.text(this.gameWidth / 2, 575, 'WASD移动 | E键交互 | 目标：完成订单获得分数', {
      fontSize: '16px',
      color: '#95a5a6',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  private createDifficultyButton(
    label: string,
    difficulty: 'simple' | 'medium' | 'hard',
    y: number,
    dishInfo: string,
    timeInfo: string,
    scoreInfo: string
  ): void {
    // 按钮背景
    const button = this.add.rectangle(this.gameWidth / 2, y, 500, 60, 0x34495e);
    button.setStrokeStyle(2, 0xecf0f1);
    button.setInteractive({ useHandCursor: true });

    // 按钮标签
    const buttonText = this.add.text(this.gameWidth / 2 - 200, y, label, {
      fontSize: '24px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);

    // 难度信息
    const infoText = this.add.text(this.gameWidth / 2 - 50, y - 8, dishInfo, {
      fontSize: '14px',
      color: '#bdc3c7',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);

    const detailsText = this.add.text(this.gameWidth / 2 - 50, y + 8, `${timeInfo} | ${scoreInfo}`, {
      fontSize: '12px',
      color: '#95a5a6',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);

    // 按钮交互
    button.on('pointerover', () => {
      button.setFillStyle(0x3498db);
      buttonText.setColor('#ffffff');
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x34495e);
      buttonText.setColor('#ecf0f1');
    });

    button.on('pointerdown', () => {
      this.startGame(difficulty);
    });
  }

  private startGame(difficulty: 'simple' | 'medium' | 'hard'): void {
    console.log(`🎮 开始游戏，难度: ${difficulty}`);

    // 将难度信息传递给主场景
    this.scene.start('MainScene', { difficulty });
  }
}