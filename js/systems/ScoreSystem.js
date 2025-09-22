// 评分系统类
class ScoreSystem {
    constructor(scene) {
        this.scene = scene;
        this.totalScore = 0;
        this.completedOrders = 0;
        this.expiredOrders = 0;
        this.perfectOrders = 0; // 完美时间内完成的订单
        this.comboCount = 0; // 连击数
        this.maxCombo = 0; // 最大连击数
        this.lastOrderTime = 0;
        this.comboTimeWindow = 10000; // 10秒内完成下一单才算连击
        
        console.log('评分系统初始化');
    }

    // 计算订单完成分数
    calculateOrderScore(order) {
        if (!order || !order.recipe) return 0;

        const recipe = order.recipe;
        let score = recipe.baseScore || 100;
        
        // 时间奖励计算
        const timeBonus = this.calculateTimeBonus(order);
        score += timeBonus;
        
        // 连击奖励
        const comboBonus = this.calculateComboBonus();
        score += comboBonus;
        
        // 难度奖励
        const difficultyBonus = this.calculateDifficultyBonus(recipe);
        score += difficultyBonus;

        // 更新统计
        this.updateOrderStats(order, timeBonus > 0);
        
        const finalScore = Math.round(score);
        console.log(`订单评分: 基础${recipe.baseScore} + 时间${timeBonus} + 连击${comboBonus} + 难度${difficultyBonus} = ${finalScore}`);
        
        return finalScore;
    }

    // 计算时间奖励
    calculateTimeBonus(order) {
        const completionTime = order.completedAt - order.createdAt;
        const timeLimit = order.recipe.timeLimit;
        const perfectTime = timeLimit * 0.5; // 50%时间内完成算完美
        const goodTime = timeLimit * 0.75; // 75%时间内完成算良好

        if (completionTime <= perfectTime) {
            // 完美时间奖励
            return Math.round(order.recipe.baseScore * 0.5); // 50%奖励
        } else if (completionTime <= goodTime) {
            // 良好时间奖励
            return Math.round(order.recipe.baseScore * 0.25); // 25%奖励
        } else if (completionTime <= timeLimit) {
            // 及时完成，无奖励但也无惩罚
            return 0;
        } else {
            // 超时完成，扣分
            return -Math.round(order.recipe.baseScore * 0.2); // 扣20%
        }
    }

    // 计算连击奖励
    calculateComboBonus() {
        if (this.comboCount <= 1) return 0;
        
        // 连击奖励递增：2连击=10分，3连击=25分，4连击=45分...
        const bonus = Math.round(Math.pow(this.comboCount - 1, 2) * 5);
        return Math.min(bonus, 200); // 最大连击奖励200分
    }

    // 计算难度奖励
    calculateDifficultyBonus(recipe) {
        // 根据菜品难度给予额外分数
        const difficultyMultiplier = {
            1: 0,    // 简单菜品无额外奖励
            2: 0.1,  // 中等菜品10%奖励
            3: 0.25  // 困难菜品25%奖励
        };

        const multiplier = difficultyMultiplier[recipe.difficulty] || 0;
        return Math.round(recipe.baseScore * multiplier);
    }

    // 更新订单统计
    updateOrderStats(order, isPerfectTiming) {
        this.completedOrders++;
        
        if (isPerfectTiming) {
            this.perfectOrders++;
        }

        // 更新连击
        const currentTime = Date.now();
        if (this.lastOrderTime > 0 && (currentTime - this.lastOrderTime) <= this.comboTimeWindow) {
            this.comboCount++;
        } else {
            this.comboCount = 1; // 重置连击
        }
        
        this.maxCombo = Math.max(this.maxCombo, this.comboCount);
        this.lastOrderTime = currentTime;

        // 显示连击效果
        if (this.comboCount > 1) {
            this.showComboEffect();
        }
    }

    // 订单过期处理
    handleOrderExpired(order) {
        this.expiredOrders++;
        this.comboCount = 0; // 重置连击
        
        // 可能的扣分
        const penalty = Math.round(order.recipe.baseScore * 0.1); // 扣10%分数
        this.totalScore = Math.max(0, this.totalScore - penalty);
        
        console.log(`订单过期扣分: ${penalty}`);
        this.showPenaltyEffect(penalty);
    }

    // 显示连击效果
    showComboEffect() {
        const comboText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 - 50,
            `${this.comboCount} 连击!`,
            {
                fontSize: '24px',
                fontFamily: 'Courier New',
                color: '#FFD700',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // 动画效果
        comboText.setScale(0);
        this.scene.tweens.add({
            targets: comboText,
            scale: 1.5,
            duration: 300,
            ease: 'Back.easeOut',
            yoyo: true,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: comboText,
                    alpha: 0,
                    y: comboText.y - 50,
                    duration: 1000,
                    onComplete: () => {
                        comboText.destroy();
                    }
                });
            }
        });
    }

    // 显示扣分效果
    showPenaltyEffect(penalty) {
        const penaltyText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            `-${penalty}`,
            {
                fontSize: '20px',
                fontFamily: 'Courier New',
                color: '#FF6347',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // 动画效果
        this.scene.tweens.add({
            targets: penaltyText,
            y: penaltyText.y - 50,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                penaltyText.destroy();
            }
        });
    }

    // 显示分数获得效果
    showScoreGain(score, x, y) {
        const scoreText = this.scene.add.text(x || this.scene.scale.width / 2, y || this.scene.scale.height / 2, `+${score}`, {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#90EE90',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 上浮动画
        this.scene.tweens.add({
            targets: scoreText,
            y: scoreText.y - 40,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => {
                scoreText.destroy();
            }
        });
    }

    // 添加分数
    addScore(points) {
        this.totalScore += points;
        this.showScoreGain(points);
        
        // 更新UI
        if (this.scene.updateUI) {
            this.scene.updateUI();
        }
    }

    // 获取当前分数
    getScore() {
        return this.totalScore;
    }

    // 获取游戏统计
    getGameStats() {
        return {
            totalScore: this.totalScore,
            completedOrders: this.completedOrders,
            expiredOrders: this.expiredOrders,
            perfectOrders: this.perfectOrders,
            maxCombo: this.maxCombo,
            currentCombo: this.comboCount,
            accuracy: this.completedOrders > 0 ? 
                Math.round((this.completedOrders / (this.completedOrders + this.expiredOrders)) * 100) : 0,
            perfectRate: this.completedOrders > 0 ? 
                Math.round((this.perfectOrders / this.completedOrders) * 100) : 0
        };
    }

    // 计算最终评级
    calculateFinalRating() {
        const stats = this.getGameStats();
        let rating = 'D';
        
        // 基于分数和统计数据计算评级
        if (stats.totalScore >= 2000 && stats.accuracy >= 90 && stats.perfectRate >= 70) {
            rating = 'S';
        } else if (stats.totalScore >= 1500 && stats.accuracy >= 80 && stats.perfectRate >= 50) {
            rating = 'A';
        } else if (stats.totalScore >= 1000 && stats.accuracy >= 70 && stats.perfectRate >= 30) {
            rating = 'B';
        } else if (stats.totalScore >= 500 && stats.accuracy >= 60) {
            rating = 'C';
        }
        
        return rating;
    }

    // 显示最终统计
    showFinalStats() {
        const stats = this.getGameStats();
        const rating = this.calculateFinalRating();
        
        console.log('游戏结束统计:');
        console.log(`最终分数: ${stats.totalScore}`);
        console.log(`完成订单: ${stats.completedOrders}`);
        console.log(`过期订单: ${stats.expiredOrders}`);
        console.log(`完美订单: ${stats.perfectOrders}`);
        console.log(`最大连击: ${stats.maxCombo}`);
        console.log(`准确率: ${stats.accuracy}%`);
        console.log(`完美率: ${stats.perfectRate}%`);
        console.log(`最终评级: ${rating}`);
        
        return { stats, rating };
    }

    // 重置评分系统
    reset() {
        this.totalScore = 0;
        this.completedOrders = 0;
        this.expiredOrders = 0;
        this.perfectOrders = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.lastOrderTime = 0;
        
        console.log('评分系统重置');
    }

    // 保存分数记录
    saveScoreRecord(difficulty) {
        const record = {
            score: this.totalScore,
            difficulty: difficulty,
            stats: this.getGameStats(),
            rating: this.calculateFinalRating(),
            timestamp: Date.now()
        };

        // 保存到localStorage
        try {
            const existingRecords = JSON.parse(localStorage.getItem('prepared-cooked-scores') || '[]');
            existingRecords.push(record);
            
            // 只保留最近20条记录
            if (existingRecords.length > 20) {
                existingRecords.splice(0, existingRecords.length - 20);
            }
            
            localStorage.setItem('prepared-cooked-scores', JSON.stringify(existingRecords));
            console.log('分数记录已保存');
        } catch (error) {
            console.warn('无法保存分数记录:', error);
        }
    }
}