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
        const config = gameData.config;
        
        // 绘制网格线
        this.drawGridLines();
        
        // 绘制回字形通道区域
        this.drawWalkwayAreas(layout, config);
        
        // 绘制网格化工作台
        layout.workstations.forEach((station, index) => {
            this.drawGridWorkstation(station);
        });
        
        // 绘制单独的组装台
        if (layout.workstation) {
            this.drawSingleWorkstation(layout.workstation);
        }
        
        // 添加厨房标题
        this.add.text(config.gameWidth / 2, 30, '西贝莜面村 - 预制菜厨房', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#8B4513',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    // 绘制回字形通道区域
    drawWalkwayAreas(layout, config) {
        // 绘制外圈通道（浅色地板）
        const outerPixel = gameData.gridToPixel(layout.outerWalkway.gridX, layout.outerWalkway.gridY);
        const outerFloor = this.add.rectangle(
            outerPixel.x + (layout.outerWalkway.gridWidth * config.gridSize) / 2 - config.gridSize / 2,
            outerPixel.y + (layout.outerWalkway.gridHeight * config.gridSize) / 2 - config.gridSize / 2,
            layout.outerWalkway.gridWidth * config.gridSize,
            layout.outerWalkway.gridHeight * config.gridSize,
            0xF5DEB3, 0.2
        );
        outerFloor.setStrokeStyle(1, 0xDEB887);
        
        // 绘制内圈通道（更浅色地板）
        const innerPixel = gameData.gridToPixel(layout.innerWalkway.gridX, layout.innerWalkway.gridY);
        const innerFloor = this.add.rectangle(
            innerPixel.x + (layout.innerWalkway.gridWidth * config.gridSize) / 2 - config.gridSize / 2,
            innerPixel.y + (layout.innerWalkway.gridHeight * config.gridSize) / 2 - config.gridSize / 2,
            layout.innerWalkway.gridWidth * config.gridSize,
            layout.innerWalkway.gridHeight * config.gridSize,
            0xFFFACD, 0.3
        );
        innerFloor.setStrokeStyle(1, 0xF0E68C);
        
        // 添加通道标识
        this.add.text(outerPixel.x + 20, outerPixel.y + 20, '外圈通道', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#8B7355',
            alpha: 0.7
        });
        
        this.add.text(innerPixel.x + 20, innerPixel.y + 20, '内圈通道', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#8B7355',
            alpha: 0.7
        });
    }

    // 绘制网格线
    drawGridLines() {
        const config = gameData.config;
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xCCCCCC, 0.5);

        // 绘制垂直线
        for (let x = 0; x <= config.gridWidth; x++) {
            const pixelX = x * config.gridSize;
            graphics.moveTo(pixelX, 0);
            graphics.lineTo(pixelX, config.gameHeight);
        }

        // 绘制水平线
        for (let y = 0; y <= config.gridHeight; y++) {
            const pixelY = y * config.gridSize;
            graphics.moveTo(0, pixelY);
            graphics.lineTo(config.gameWidth, pixelY);
        }

        graphics.strokePath();
    }

    // 绘制网格化工作台
    drawGridWorkstation(station) {
        const pixel = gameData.gridToPixel(station.gridX, station.gridY);
        const config = gameData.config;
        
        // 计算工作台的像素尺寸
        const width = station.gridWidth * config.gridSize;
        const height = station.gridHeight * config.gridSize;
        
        // 根据工作台类型选择颜色
        let color, strokeColor, textColor;
        switch (station.type) {
            case 'ingredient_storage':
                color = 0x90EE90; // 浅绿色
                strokeColor = 0x228B22;
                textColor = '#006400';
                break;
            case 'microwave':
                color = 0xFFB6C1; // 浅粉色
                strokeColor = 0xFF69B4;
                textColor = '#8B008B';
                break;
            case 'cooking_counter':
                color = 0xDEB887; // 浅棕色 - 料理台
                strokeColor = 0xCD853F;
                textColor = '#8B4513';
                break;
            case 'workstation':
                color = 0x87CEEB; // 天蓝色 (保留兼容性)
                strokeColor = 0x4682B4;
                textColor = '#191970';
                break;
            case 'serving':
                color = 0xFFD700; // 金色
                strokeColor = 0xFFA500;
                textColor = '#B8860B';
                break;
            default:
                color = 0xDDDDDD;
                strokeColor = 0x999999;
                textColor = '#333333';
        }
        
        // 绘制工作台矩形
        const rect = this.add.rectangle(
            pixel.x + width / 2 - config.gridSize / 2,
            pixel.y + height / 2 - config.gridSize / 2,
            width - 4, // 留一点边距
            height - 4,
            color,
            0.8
        );
        rect.setStrokeStyle(2, strokeColor);
        
        // 添加工作台标签
        const fontSize = station.gridWidth > 1 ? '10px' : '8px';
        this.add.text(
            pixel.x + width / 2 - config.gridSize / 2,
            pixel.y + height / 2 - config.gridSize / 2,
            station.name,
            {
                fontSize: fontSize,
                fontFamily: 'Courier New',
                color: textColor,
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // 为食材存储区域显示数量
        if (station.type === 'ingredient_storage' && station.ingredientId) {
            const storageInfo = this.kitchen.getStorageInfo(station.ingredientId);
            if (storageInfo) {
                this.add.text(
                    pixel.x + width / 2 - config.gridSize / 2,
                    pixel.y + height / 2 - config.gridSize / 2 + 12,
                    `x${storageInfo.quantity}`,
                    {
                        fontSize: '8px',
                        fontFamily: 'Courier New',
                        color: textColor,
                        align: 'center'
                    }
                ).setOrigin(0.5);
            }
        }
        
        // 为料理台添加特殊图标
        if (station.type === 'cooking_counter') {
            this.addCookingCounterIcon(station, pixel, width, height);
        }
    }

    // 为料理台添加图标
    addCookingCounterIcon(station, pixel, width, height) {
        const centerX = pixel.x + width / 2 - gameData.config.gridSize / 2;
        const centerY = pixel.y + height / 2 - gameData.config.gridSize / 2;
        
        // 添加简单的料理台图标 - 小圆点表示可放置食材
        const icon = this.add.circle(centerX + 15, centerY - 8, 3, 0x8B4513, 0.6);
        icon.setStrokeStyle(1, 0x654321);
    }
    
    drawWorkstation(station) {
        // 根据工作台类型选择颜色
        const colors = {
            meat_storage: { bg: 0xFFB6C1, border: 0xDC143C, text: '#8B0000' },
            vegetable_storage: { bg: 0x90EE90, border: 0x228B22, text: '#006400' },
            semi_storage: { bg: 0xF0E68C, border: 0xDAA520, text: '#B8860B' },
            microwave: { bg: 0x8B4513, border: 0x654321, text: '#FFFFFF' },
            workstation: { bg: 0xDEB887, border: 0xCD853F, text: '#8B4513' },
            serving: { bg: 0xFFD700, border: 0xDAA520, text: '#8B4513' },

            prep: { bg: 0xD3D3D3, border: 0x696969, text: '#2F4F4F' }
        };
        
        const color = colors[station.type] || colors.prep;
        
        // 绘制工作台背景
        const stationRect = this.add.rectangle(
            station.x, station.y, 
            station.width, station.height, 
            color.bg
        );
        stationRect.setStrokeStyle(3, color.border);
        
        // 添加工作台标签
        this.add.text(station.x, station.y - station.height/2 - 15, station.name, {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: color.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 为食材存储区域添加类别图标
        if (station.type.includes('storage')) {
            this.addStorageIcon(station);
        }
        
        // 为微波炉添加特殊标识
        if (station.type === 'microwave') {
            this.addMicrowaveIcon(station);
        }
    }
    
    addStorageIcon(station) {
        const iconSize = 20;
        let iconColor = 0x666666;
        let iconText = '?';
        
        switch(station.category) {
            case 'meat':
                iconColor = 0xDC143C;
                iconText = '🥩';
                break;
            case 'vegetable':
                iconColor = 0x228B22;
                iconText = '🥬';
                break;
            case 'semi':
                iconColor = 0xDAA520;
                iconText = '📦';
                break;
        }
        
        // 简单的图标背景
        const iconBg = this.add.circle(station.x, station.y, iconSize/2, iconColor, 0.3);
        iconBg.setStrokeStyle(2, iconColor);
        
        // 图标文字（使用emoji或简单字符）
        this.add.text(station.x, station.y, iconText, {
            fontSize: '16px',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
    
    addMicrowaveIcon(station) {
        // 微波炉门
        const door = this.add.rectangle(station.x - 15, station.y, 25, 35, 0x2F4F4F, 0.8);
        door.setStrokeStyle(2, 0x000000);
        
        // 微波炉窗口
        const window = this.add.circle(station.x - 15, station.y - 5, 8, 0x87CEEB, 0.6);
        window.setStrokeStyle(1, 0x4682B4);
        
        // 控制面板
        const panel = this.add.rectangle(station.x + 15, station.y, 15, 30, 0x696969);
        panel.setStrokeStyle(1, 0x2F4F4F);
    }

    // 绘制单独的组装台
    drawSingleWorkstation(workstation) {
        const size = 60; // 组装台尺寸
        
        // 绘制组装台背景
        const rect = this.add.rectangle(
            workstation.x,
            workstation.y,
            size,
            size,
            0xDEB887, // 浅褐色
            0.8
        );
        rect.setStrokeStyle(3, 0xCD853F); // 深褐色边框
        
        // 添加组装台标签
        this.add.text(
            workstation.x,
            workstation.y,
            '组装台',
            {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: '#8B4513',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
    }

    createPlayer() {
        const startGrid = gameData.kitchenLayout.playerStart;
        const startPixel = gameData.gridToPixel(startGrid.gridX, startGrid.gridY);
        this.player = new Player(this, startPixel.x, startPixel.y);
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
            
            // 更新游戏状态中的订单信息
            this.gameState.orders = this.orderSystem.getCurrentOrders();
        }
        
        // 实时更新UI（包括进度条）
        this.updateUI();
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