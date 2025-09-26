import { MainScene } from '../scenes/MainScene';
import { Order, OrderStatus } from '../types';

/**
 * 第六阶段：贾老板催促系统
 * 根据订单等待时间和游戏状态催促玩家
 */
export class BossJiaManager {
  private scene: MainScene;
  private bossContainer: Phaser.GameObjects.Container | null = null;
  private bossSprite: Phaser.GameObjects.Rectangle | null = null;
  private bossText: Phaser.GameObjects.Text | null = null;
  private dialogueText: Phaser.GameObjects.Text | null = null;
  private lastUrgeTime: number = 0;
  private urgeInterval: number = 10000; // 10秒催促一次
  private currentMood: 'happy' | 'neutral' | 'angry' | 'furious' = 'neutral';

  // 贾老板台词库
  private dialogues = {
    happy: [
      "👍 做得不错！继续保持！",
      "😊 客人很满意，加油！",
      "🎉 效率很高，很好！"
    ],
    neutral: [
      "🤔 注意订单时间啊",
      "⏰ 客人在等着呢",
      "💼 保持专注，加油"
    ],
    angry: [
      "😠 动作快一点！",
      "⏰ 订单都快超时了！",
      "🔥 客人要等急了！"
    ],
    furious: [
      "😡 太慢了！这样会丢客人的！",
      "💥 赶紧的！不能再拖了！",
      "🌪️ 这个效率客人都跑光了！"
    ]
  };

  constructor(scene: MainScene) {
    this.scene = scene;
    this.createBossUI();
  }

  // 创建贾老板UI
  private createBossUI(): void {
    // 创建贾老板容器（屏幕右侧）
    this.bossContainer = this.scene.add.container(650, 100);

    // 贾老板头像（简单的矩形占位符）
    this.bossSprite = this.scene.add.rectangle(0, 0, 80, 80, 0x8b4513);
    this.bossSprite.setStrokeStyle(3, 0x2c3e50);

    // 贾老板名称
    this.bossText = this.scene.add.text(0, -50, '贾老板', {
      fontSize: '16px',
      color: '#2c3e50',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 对话框背景
    const dialogueBox = this.scene.add.rectangle(0, 80, 140, 60, 0xf8f9fa);
    dialogueBox.setStrokeStyle(2, 0x2c3e50);

    // 对话文本
    this.dialogueText = this.scene.add.text(0, 80, '欢迎来到预制菜厨房！', {
      fontSize: '10px',
      color: '#2c3e50',
      fontFamily: 'Arial',
      wordWrap: { width: 130 }
    }).setOrigin(0.5);

    // 添加到容器
    this.bossContainer.add([this.bossSprite, this.bossText, dialogueBox, this.dialogueText]);

    console.log('🏢 贾老板已上岗！');
  }

  // 更新贾老板状态
  public update(time: number): void {
    // 定期检查游戏状态并催促
    if (time - this.lastUrgeTime > this.urgeInterval) {
      this.checkGameStateAndUrge();
      this.lastUrgeTime = time;
    }
  }

  // 检查游戏状态并催促
  private checkGameStateAndUrge(): void {
    const orderManager = this.scene.getOrderManager();
    const orders = orderManager.getCurrentOrders();

    // 分析订单情况
    const waitingOrders = orders.filter(order => order.status === OrderStatus.WAITING);
    const urgentOrders = waitingOrders.filter(order => {
      const timeRatio = order.remainingTime / order.totalTime;
      return timeRatio < 0.3; // 剩余时间少于30%为紧急
    });

    const expiredOrders = orders.filter(order => order.status === OrderStatus.EXPIRED);

    // 根据情况更新心情和对话
    this.updateMoodAndSpeak(waitingOrders.length, urgentOrders.length, expiredOrders.length);
  }

  // 更新心情和说话
  private updateMoodAndSpeak(waitingCount: number, urgentCount: number, expiredCount: number): void {
    let newMood: 'happy' | 'neutral' | 'angry' | 'furious' = 'neutral';

    // 根据订单情况决定心情
    if (expiredCount > 2 || urgentCount > 3) {
      newMood = 'furious';
    } else if (expiredCount > 0 || urgentCount > 1) {
      newMood = 'angry';
    } else if (waitingCount === 0) {
      newMood = 'happy';
    } else {
      newMood = 'neutral';
    }

    // 更新心情和外观
    if (newMood !== this.currentMood) {
      this.currentMood = newMood;
      this.updateBossAppearance();
    }

    // 说话
    this.speak();
  }

  // 更新贾老板外观
  private updateBossAppearance(): void {
    if (!this.bossSprite) return;

    const colors = {
      happy: 0x27ae60,    // 绿色 - 开心
      neutral: 0x8b4513,  // 棕色 - 正常
      angry: 0xe67e22,    // 橙色 - 生气
      furious: 0xe74c3c   // 红色 - 暴怒
    };

    this.bossSprite.setFillStyle(colors[this.currentMood]);

    // 添加表情动画
    this.scene.tweens.add({
      targets: this.bossSprite,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    // 更新UI界面
    this.updateBossUI();
  }

  // 更新贾老板UI界面
  private updateBossUI(): void {
    const bossPanel = document.getElementById('boss-jia-panel');
    const bossMood = document.getElementById('boss-mood');

    if (!bossPanel || !bossMood) return;

    // 移除所有心情类
    bossPanel.classList.remove('happy', 'neutral', 'angry', 'furious');

    // 添加当前心情类
    bossPanel.classList.add(this.currentMood);

    // 更新心情显示
    const moodEmojis = {
      happy: '😊',
      neutral: '😐',
      angry: '😠',
      furious: '😡'
    };

    const moodNames = {
      happy: '开心',
      neutral: '普通',
      angry: '生气',
      furious: '暴怒'
    };

    bossMood.textContent = `心情: ${moodEmojis[this.currentMood]} ${moodNames[this.currentMood]}`;
  }

  // 说话
  private speak(): void {
    if (!this.dialogueText) return;

    const currentDialogues = this.dialogues[this.currentMood];
    const randomDialogue = currentDialogues[Math.floor(Math.random() * currentDialogues.length)];

    this.dialogueText.setText(randomDialogue);

    // 对话框弹出动画
    this.scene.tweens.add({
      targets: this.dialogueText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });

    // 更新UI中的对话
    this.showDialogueInUI(randomDialogue);

    console.log(`🏢 贾老板: ${randomDialogue}`);
  }

  // 在UI中显示对话
  private showDialogueInUI(dialogue: string): void {
    const dialogueElement = document.getElementById('boss-dialogue');
    if (!dialogueElement) return;

    dialogueElement.textContent = dialogue;
    dialogueElement.style.display = 'block';

    // 3秒后隐藏对话
    setTimeout(() => {
      dialogueElement.style.display = 'none';
    }, 3000);
  }

  // 手动催促（订单超时时调用）
  public urgeForExpiredOrder(): void {
    this.currentMood = 'angry';
    this.updateBossAppearance();

    if (this.dialogueText) {
      this.dialogueText.setText('😤 又有订单超时了！要抓紧啊！');

      // 强烈抖动动画
      this.scene.tweens.add({
        targets: this.bossContainer,
        x: 650 + 5,
        duration: 50,
        yoyo: true,
        repeat: 6,
        ease: 'Power2'
      });
    }
  }

  // 鼓励（完成订单时调用）
  public encourageForCompletedOrder(score: number): void {
    if (score > 150) {
      this.currentMood = 'happy';
      this.updateBossAppearance();

      if (this.dialogueText) {
        this.dialogueText.setText('🎉 太棒了！这就是我要的效率！');
      }
    }
  }

  // 销毁贾老板UI
  public destroy(): void {
    if (this.bossContainer) {
      this.bossContainer.destroy();
      this.bossContainer = null;
    }
  }

  // 获取当前心情（用于调试）
  public getCurrentMood(): string {
    return this.currentMood;
  }
}