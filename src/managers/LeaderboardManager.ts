/**
 * 第六阶段：本地排行榜系统
 * 使用localStorage保存和管理玩家分数记录
 */

export interface LeaderboardEntry {
  score: number;
  difficulty: 'simple' | 'medium' | 'hard';
  date: string;
  timestamp: number;
}

export class LeaderboardManager {
  private static readonly STORAGE_KEY = 'prepared-cooked-leaderboard';
  private static readonly MAX_ENTRIES = 10; // 保存前10名

  // 添加新分数记录
  public static addScore(score: number, difficulty: 'simple' | 'medium' | 'hard'): void {
    const entry: LeaderboardEntry = {
      score,
      difficulty,
      date: new Date().toLocaleDateString('zh-CN'),
      timestamp: Date.now()
    };

    const leaderboard = this.getLeaderboard();
    leaderboard.push(entry);

    // 按分数降序排序
    leaderboard.sort((a, b) => b.score - a.score);

    // 只保留前N名
    const trimmedLeaderboard = leaderboard.slice(0, this.MAX_ENTRIES);

    // 保存到localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLeaderboard));

    console.log(`📊 新分数已记录: ${score}分 (${difficulty}难度)`);
  }

  // 获取排行榜
  public static getLeaderboard(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('读取排行榜失败:', error);
      return [];
    }
  }

  // 获取指定难度的排行榜
  public static getLeaderboardByDifficulty(difficulty: 'simple' | 'medium' | 'hard'): LeaderboardEntry[] {
    return this.getLeaderboard().filter(entry => entry.difficulty === difficulty);
  }

  // 获取最高分
  public static getHighScore(): number {
    const leaderboard = this.getLeaderboard();
    return leaderboard.length > 0 ? leaderboard[0].score : 0;
  }

  // 获取指定难度的最高分
  public static getHighScoreByDifficulty(difficulty: 'simple' | 'medium' | 'hard'): number {
    const difficultyLeaderboard = this.getLeaderboardByDifficulty(difficulty);
    return difficultyLeaderboard.length > 0 ? difficultyLeaderboard[0].score : 0;
  }

  // 检查是否是新纪录
  public static isNewRecord(score: number, difficulty?: 'simple' | 'medium' | 'hard'): boolean {
    if (difficulty) {
      return score > this.getHighScoreByDifficulty(difficulty);
    } else {
      return score > this.getHighScore();
    }
  }

  // 清除排行榜
  public static clearLeaderboard(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('📊 排行榜已清除');
  }

  // 生成排行榜HTML
  public static generateLeaderboardHTML(difficulty?: 'simple' | 'medium' | 'hard'): string {
    const leaderboard = difficulty
      ? this.getLeaderboardByDifficulty(difficulty)
      : this.getLeaderboard();

    if (leaderboard.length === 0) {
      return '<div class="no-records">暂无记录</div>';
    }

    const difficultyNames = {
      simple: '简单',
      medium: '中等',
      hard: '困难'
    };

    let html = '<div class="leaderboard-list">';

    leaderboard.forEach((entry, index) => {
      const rank = index + 1;
      const medalIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

      html += `
        <div class="leaderboard-entry ${rank <= 3 ? 'top-three' : ''}">
          <span class="rank">${medalIcon}</span>
          <span class="score">${entry.score}分</span>
          <span class="difficulty">${difficultyNames[entry.difficulty]}</span>
          <span class="date">${entry.date}</span>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  // 显示排行榜模态框
  public static showLeaderboard(): void {
    // 创建模态框
    const modal = document.createElement('div');
    modal.id = 'leaderboard-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      max-height: 80%;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #2c3e50;">🏆 排行榜</h2>
        <button id="close-leaderboard" style="
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
        ">关闭</button>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">筛选难度:</label>
        <select id="difficulty-filter" style="
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 100%;
        ">
          <option value="">全部难度</option>
          <option value="simple">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>
      </div>

      <div id="leaderboard-content">
        ${this.generateLeaderboardHTML()}
      </div>

      <style>
        .leaderboard-list {
          margin-top: 15px;
        }
        .leaderboard-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          margin: 8px 0;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .leaderboard-entry.top-three {
          background: linear-gradient(135deg, #fff5cd, #ffeaa0);
          border-color: #f39c12;
        }
        .rank {
          font-weight: bold;
          min-width: 40px;
        }
        .score {
          font-weight: bold;
          color: #27ae60;
          min-width: 60px;
        }
        .difficulty {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          background: #3498db;
          color: white;
          min-width: 50px;
          text-align: center;
        }
        .date {
          font-size: 12px;
          color: #7f8c8d;
          min-width: 80px;
          text-align: right;
        }
        .no-records {
          text-align: center;
          color: #7f8c8d;
          padding: 40px;
          font-style: italic;
        }
      </style>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // 事件监听
    const closeBtn = document.getElementById('close-leaderboard');
    const difficultyFilter = document.getElementById('difficulty-filter') as HTMLSelectElement;
    const leaderboardContent = document.getElementById('leaderboard-content');

    closeBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    difficultyFilter?.addEventListener('change', () => {
      const selectedDifficulty = difficultyFilter.value as 'simple' | 'medium' | 'hard' | '';
      if (leaderboardContent) {
        leaderboardContent.innerHTML = selectedDifficulty
          ? this.generateLeaderboardHTML(selectedDifficulty)
          : this.generateLeaderboardHTML();
      }
    });
  }
}