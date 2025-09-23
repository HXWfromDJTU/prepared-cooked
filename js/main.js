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
        // 确保gameData已经加载
        if (!window.gameData) {
            console.error('GameData not loaded yet, retrying...');
            setTimeout(() => this.setupGame(), 100);
            return;
        }
        
        // 设置游戏说明面板事件
        this.setupInstructions();
        
        // 创建Phaser游戏配置
        const config = {
            type: Phaser.AUTO,
            width: window.gameData.config.gameWidth,
            height: window.gameData.config.gameHeight,
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
        const isNewRecord = window.gameData.saveHighScore(finalScore);
        
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
                    <p>最高分: ${window.gameData.getHighScore()}</p>
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

        // 获取当前存在的订单元素
        const existingOrders = Array.from(ordersList.querySelectorAll('.order-item'));
        const existingOrderIds = existingOrders.map(el => parseInt(el.getAttribute('data-order-id')));
        const currentOrderIds = orders.map(order => order.id);

        // 移除已完成或过期的订单
        existingOrders.forEach(orderElement => {
            const orderId = parseInt(orderElement.getAttribute('data-order-id'));
            if (!currentOrderIds.includes(orderId)) {
                // 添加消失动画
                orderElement.style.transition = 'all 0.3s ease-out';
                orderElement.style.transform = 'translateX(100%)';
                orderElement.style.opacity = '0';
                setTimeout(() => {
                    if (orderElement.parentNode) {
                        orderElement.parentNode.removeChild(orderElement);
                    }
                }, 300);
            }
        });

        // 更新或添加订单
        orders.forEach((order, index) => {
            let orderElement = ordersList.querySelector(`[data-order-id="${order.id}"]`);
            
            const timeLeft = Math.max(0, Math.ceil((order.deadline - Date.now()) / 1000));
            const totalTime = Math.ceil(order.recipe.timeLimit / 1000);
            const timeProgress = Math.max(0, (timeLeft / totalTime) * 100);
            
            if (!orderElement) {
                // 创建新订单元素
                orderElement = document.createElement('div');
                orderElement.className = 'order-item';
                orderElement.setAttribute('data-order-id', order.id);
                
                const ingredients = order.recipe.ingredients.map(id => window.gameData.getIngredient(id).name).join(', ');
                
                orderElement.innerHTML = `
                    <div class="dish-name">${order.recipe.name}</div>
                    <div class="ingredients">${ingredients}</div>
                    <div class="timer-section">
                        <span class="customer-name">客户: ${order.customer.name}</span>
                        <span class="timer">${timeLeft}s</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${timeProgress}%"></div>
                    </div>
                `;

                // 添加出现动画
                orderElement.style.opacity = '0';
                orderElement.style.transform = 'translateX(-100%)';
                ordersList.appendChild(orderElement);
                
                // 触发动画
                setTimeout(() => {
                    orderElement.style.transition = 'all 0.3s ease-out';
                    orderElement.style.opacity = '1';
                    orderElement.style.transform = 'translateX(0)';
                }, 10);
            } else {
                // 更新现有订单的时间和进度条
                const timerElement = orderElement.querySelector('.timer');
                const progressBar = orderElement.querySelector('.progress-bar');
                
                if (timerElement) {
                    timerElement.textContent = `${timeLeft}s`;
                }
                
                if (progressBar) {
                    progressBar.style.width = `${timeProgress}%`;
                }
            }

            // 重置样式类
            orderElement.className = 'order-item';
            const progressBar = orderElement.querySelector('.progress-bar');
            progressBar.className = 'progress-bar';

            // 根据剩余时间设置紧急程度样式
            if (timeLeft < 10) {
                // 非常紧急 - 红色闪烁
                orderElement.classList.add('critical');
                progressBar.classList.add('critical');
            } else if (timeLeft < 20) {
                // 紧急 - 橙色脉冲
                orderElement.classList.add('urgent');
                progressBar.classList.add('urgent');
            }

            // 添加客户耐心度指示
            const patienceLevel = order.customer.patience || 1;
            if (patienceLevel < 0.5) {
                orderElement.style.boxShadow = '0 0 15px rgba(220, 20, 60, 0.6)';
            } else {
                orderElement.style.boxShadow = '';
            }
        });
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    new PreparedCookedGame();
});