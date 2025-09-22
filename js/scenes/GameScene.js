// 游戏主场景
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameState = {
            score: 0,
            timeLeft: 180, // 3分钟
            orders: [],
            difficulty: 'medium'
        };
    }

    init(data) {
        // 接收从菜单传来的难度设置
        if (data && data.difficulty) {
            this.gameState.difficulty = data.difficulty;
        }
        console.log(`游戏场景初始化，难度: ${this.gameState.difficulty}`);
    }

    preload() {
        // 这里将来会加载游戏资源
        // 目前使用简单的几何图形代替
    }

    create() {
        // 设置背景色
        this.cameras.main.setBackgroundColor('#F5F5DC');

        // 初始化游戏系统
        this.initializeGameSystems();
        
        // 创建厨房布局
        this.createKitchen();
        
        // 创建玩家
        this.createPlayer();
        
        // 设置输入控制
        this.setupControls();
        
        // 开始游戏计时器
        this.startGameTimer();
        
        // 开始订单系统
        this.startOrderSystem();

        console.log('游戏场景创建完成');
    }

    initializeGameSystems() {
        // 初始化订单系统
        this.orderSystem = new OrderSystem(this, this.gameState.difficulty);
        
        // 初始化评分系统
        this.scoreSystem = new ScoreSystem(this);
        
        // 重置游戏状态
        this.gameState.score = 0;
        this.gameState.timeLeft = gameData.config.gameTime;
        this.gameState.orders = [];
    }

    createKitchen() {
        // 创建厨房布局
        this.kitchen = new Kitchen(this);
        
        // 绘制厨房区域
        this.drawKitchenAreas();
    }

    drawKitchenAreas() {
        const layout = gameData.kitchenLayout;
        
        // 微波炉区域
        layout.microwaves.forEach((microwave, index) => {
            const microwaveRect = this.add.rectangle(microwave.x, microwave.y, 80, 60, 0x8B4513);
            microwaveRect.setStrokeStyle(2, 0x654321);
            
            this.add.text(microwave.x, microwave.y - 40, `微波炉${index + 1}`, {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: '#8B4513'
            }).setOrigin(0.5);
        });

        // 储存区
        const storageRect = this.add.rectangle(layout.storage.x, layout.storage.y, 100, 80, 0x90EE90);
        storageRect.setStrokeStyle(2, 0x228B22);
        this.add.text(layout.storage.x, layout.storage.y - 50, '食材储存', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);

        // 工作台
        const workstationRect = this.add.rectangle(layout.workstation.x, layout.workstation.y, 100, 60, 0xDEB887);
        workstationRect.setStrokeStyle(2, 0xCD853F);
        this.add.text(layout.workstation.x, layout.workstation.y - 40, '组装台', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);

        // 上菜区
        const servingRect = this.add.rectangle(layout.servingArea.x, layout.servingArea.y, 80, 80, 0xFFD700);
        servingRect.setStrokeStyle(2, 0xDAA520);
        this.add.text(layout.servingArea.x, layout.servingArea.y - 50, '上菜区', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);

        // 洗盘子区
        const washRect = this.add.rectangle(layout.washArea.x, layout.washArea.y, 80, 60, 0x87CEEB);
        washRect.setStrokeStyle(2, 0x4682B4);
        this.add.text(layout.washArea.x, layout.washArea.y - 40, '清洗区', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);
    }

    createPlayer() {
        const startPos = gameData.kitchenLayout.playerStart;
        this.player = new Player(this, startPos.x, startPos.y);
    }

    setupControls() {
        // 创建键盘输入
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // 空格键交互
        this.spaceKey.on('down', () => {
            this.handlePlayerInteraction();
        });

        // ESC键返回菜单
        this.input.keyboard.on('keydown-ESC', () => {
            this.pauseGame();
        });
    }

    startGameTimer() {
        // 创建游戏计时器
        this.gameTimer = this.time.addEvent({
            delay: 1000, // 每秒执行一次
            callback: this.updateGameTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateGameTimer() {
        this.gameState.timeLeft--;
        
        if (this.gameState.timeLeft <= 0) {
            this.endGame();
        }
        
        // 更新UI
        this.updateUI();
    }

    startOrderSystem() {
        // 启动订单系统
        this.orderSystem.start();
    }

    handlePlayerInteraction() {
        // 玩家交互逻辑
        if (this.player) {
            this.player.interact();
        }
    }

    pauseGame() {
        // 暂停游戏，显示菜单
        this.scene.pause();
        
        // 创建暂停面板
        const pausePanel = document.createElement('div');
        pausePanel.id = 'pause-panel';
        pausePanel.innerHTML = `
            <div class="panel-content">
                <h2>游戏暂停</h2>
                <div class="buttons">
                    <button id="resume-game">继续游戏</button>
                    <button id="restart-current">重新开始</button>
                    <button id="back-to-menu-pause">返回菜单</button>
                </div>
            </div>
        `;
        
        pausePanel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 150;
        `;

        document.body.appendChild(pausePanel);

        // 添加事件监听
        document.getElementById('resume-game').addEventListener('click', () => {
            document.body.removeChild(pausePanel);
            this.scene.resume();
        });

        document.getElementById('restart-current').addEventListener('click', () => {
            document.body.removeChild(pausePanel);
            this.scene.restart({ difficulty: this.gameState.difficulty });
        });

        document.getElementById('back-to-menu-pause').addEventListener('click', () => {
            document.body.removeChild(pausePanel);
            this.scene.start('MenuScene');
        });
    }

    endGame() {
        console.log('游戏时间结束');
        
        // 停止所有计时器
        if (this.gameTimer) {
            this.gameTimer.destroy();
        }
        
        // 停止订单系统
        this.orderSystem.stop();
        
        // 调用游戏结束处理
        if (window.gameInstance) {
            window.gameInstance.gameOver(this.gameState.score);
        }
    }

    updateUI() {
        // 更新游戏UI
        if (window.gameInstance) {
            window.gameInstance.updateUI(this.gameState);
        }
    }

    update() {
        // 更新玩家
        if (this.player) {
            this.player.update();
        }
        
        // 更新订单系统
        if (this.orderSystem) {
            this.orderSystem.update();
        }
    }

    // 添加分数
    addScore(points) {
        this.gameState.score += points;
        this.updateUI();
    }

    // 添加订单
    addOrder(order) {
        this.gameState.orders.push(order);
        this.updateUI();
    }

    // 完成订单
    completeOrder(orderId) {
        const orderIndex = this.gameState.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            const order = this.gameState.orders[orderIndex];
            this.gameState.orders.splice(orderIndex, 1);
            
            // 计算分数
            const score = this.scoreSystem.calculateOrderScore(order);
            this.addScore(score);
            
            console.log(`订单完成: ${order.recipe.name}, 获得分数: ${score}`);
        }
    }
}