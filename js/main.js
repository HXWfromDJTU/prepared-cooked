// 游戏主入口文件
class PreparedCookedGame {
    constructor() {
        this.game = null;
        this.currentDifficulty = 'medium';
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGame());
        } else {
            this.setupGame();
        }
    }

    setupGame() {
        // 设置游戏说明面板事件
        this.setupInstructions();
        
        // 创建Phaser游戏配置
        const config = {
            type: Phaser.AUTO,
            width: gameData.config.gameWidth,
            height: gameData.config.gameHeight,
            parent: 'game-canvas',
            backgroundColor: '#FFF8DC',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [MenuScene, GameScene]
        };

        // 创建游戏实例
        this.game = new Phaser.Game(config);
        
        // 设置全局游戏引用
        window.gameInstance = this;
        
        console.log('Prepared Cooked 游戏初始化完成!');
    }

    setupInstructions() {
        const instructionsPanel = document.getElementById('instructions-panel');
        const closeButton = document.getElementById('close-instructions');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                instructionsPanel.classList.add('hidden');
                this.startGame();
            });
        }

        // 键盘事件监听
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                if (instructionsPanel.classList.contains('hidden')) {
                    instructionsPanel.classList.remove('hidden');
                } else {
                    instructionsPanel.classList.add('hidden');
                }
            }
        });
    }

    startGame() {
        // 开始游戏，切换到游戏场景
        if (this.game && this.game.scene) {
            this.game.scene.start('GameScene', { difficulty: this.currentDifficulty });
        }
    }

    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        console.log(`难度设置为: ${difficulty}`);
    }

    // 游戏结束处理
    gameOver(finalScore) {
        console.log(`游戏结束! 最终分数: ${finalScore}`);
        
        // 检查是否创造新纪录
        const isNewRecord = gameData.saveHighScore(finalScore);
        
        if (isNewRecord) {
            console.log('恭喜！创造了新纪录！');
        }

        // 显示游戏结束界面
        this.showGameOverScreen(finalScore, isNewRecord);
    }

    showGameOverScreen(score, isNewRecord) {
        // 创建游戏结束面板
        const gameOverPanel = document.createElement('div');
        gameOverPanel.id = 'game-over-panel';
        gameOverPanel.innerHTML = `
            <div class="panel-content">
                <h2>游戏结束</h2>
                <div class="score-display">
                    <h3>最终分数: ${score}</h3>
                    ${isNewRecord ? '<p class="new-record">🎉 新纪录！</p>' : ''}
                    <p>最高分: ${gameData.getHighScore()}</p>
                </div>
                <div class="buttons">
                    <button id="restart-game">再来一局</button>
                    <button id="back-to-menu">返回菜单</button>
                </div>
            </div>
        `;
        
        // 添加样式
        gameOverPanel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 200;
        `;

        document.body.appendChild(gameOverPanel);

        // 添加事件监听
        document.getElementById('restart-game').addEventListener('click', () => {
            document.body.removeChild(gameOverPanel);
            this.startGame();
        });

        document.getElementById('back-to-menu').addEventListener('click', () => {
            document.body.removeChild(gameOverPanel);
            this.game.scene.start('MenuScene');
        });
    }

    // 更新UI显示
    updateUI(gameState) {
        // 更新分数
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = gameState.score || 0;
        }

        // 更新时间
        const timeElement = document.getElementById('time');
        if (timeElement && gameState.timeLeft !== undefined) {
            const minutes = Math.floor(gameState.timeLeft / 60);
            const seconds = gameState.timeLeft % 60;
            timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // 更新订单列表
        this.updateOrdersList(gameState.orders || []);
    }

    updateOrdersList(orders) {
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) return;

        ordersList.innerHTML = '';

        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            const timeLeft = Math.max(0, Math.ceil((order.deadline - Date.now()) / 1000));
            const ingredients = order.recipe.ingredients.map(id => gameData.getIngredient(id).name).join(', ');
            
            orderElement.innerHTML = `
                <div class="dish-name">${order.recipe.name}</div>
                <div class="ingredients">${ingredients}</div>
                <div class="timer">${timeLeft}s</div>
            `;

            // 根据剩余时间改变颜色
            if (timeLeft < 10) {
                orderElement.style.borderColor = '#DC143C';
                orderElement.style.backgroundColor = '#FFE4E1';
            } else if (timeLeft < 20) {
                orderElement.style.borderColor = '#FF8C00';
                orderElement.style.backgroundColor = '#FFF8DC';
            }

            ordersList.appendChild(orderElement);
        });
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    new PreparedCookedGame();
});