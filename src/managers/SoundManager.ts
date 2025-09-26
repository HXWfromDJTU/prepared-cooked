/**
 * 第六阶段：基础音效系统
 * 使用Web Audio API创建简单的音效
 */

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private isSoundEnabled: boolean = true;

  constructor() {
    this.initializeAudioContext();
  }

  // 初始化音频上下文
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('无法初始化音频上下文:', error);
      this.isSoundEnabled = false;
    }
  }

  // 播放成功音效（订单完成）
  public playSuccess(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 成功音效：上升的音调
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.type = 'sine';
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('播放成功音效失败:', error);
    }
  }

  // 播放失败音效（订单超时）
  public playError(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 失败音效：下降的音调
      oscillator.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      oscillator.frequency.setValueAtTime(261.63, ctx.currentTime + 0.15); // C4

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.type = 'sawtooth';
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('播放失败音效失败:', error);
    }
  }

  // 播放点击音效
  public playClick(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.type = 'square';
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.warn('播放点击音效失败:', error);
    }
  }

  // 播放新订单音效
  public playNewOrder(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 新订单音效：温和的提示音
      oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
      oscillator.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.type = 'triangle';
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      console.warn('播放新订单音效失败:', error);
    }
  }

  // 播放拾取物品音效
  public playPickup(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.type = 'sine';
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.warn('播放拾取音效失败:', error);
    }
  }

  // 播放放置物品音效
  public playPlace(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.type = 'sine';
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.warn('播放放置音效失败:', error);
    }
  }

  // 播放游戏开始音效
  public playGameStart(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;

      // 播放一系列上升的音符
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = ctx.currentTime + index * 0.1;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.type = 'triangle';
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      });
    } catch (error) {
      console.warn('播放游戏开始音效失败:', error);
    }
  }

  // 播放游戏结束音效
  public playGameEnd(): void {
    if (!this.canPlaySound()) return;

    try {
      const ctx = this.audioContext!;

      // 播放一系列下降的音符
      const notes = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4

      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = ctx.currentTime + index * 0.2;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.type = 'triangle';
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch (error) {
      console.warn('播放游戏结束音效失败:', error);
    }
  }

  // 检查是否可以播放声音
  private canPlaySound(): boolean {
    return this.isSoundEnabled && this.audioContext !== null;
  }

  // 切换音效开关
  public toggleSound(): boolean {
    this.isSoundEnabled = !this.isSoundEnabled;
    console.log(`音效${this.isSoundEnabled ? '开启' : '关闭'}`);
    return this.isSoundEnabled;
  }

  // 设置音效开关
  public setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
  }

  // 获取音效状态
  public isSoundOn(): boolean {
    return this.isSoundEnabled;
  }

  // 恢复音频上下文（用于用户交互后激活）
  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('音频上下文已恢复');
      }).catch(error => {
        console.warn('恢复音频上下文失败:', error);
      });
    }
  }
}