// 主菜单场景
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // 这里可以预加载菜单所需的资源
        // 暂时使用纯色矩形作为按钮
    }

    create() {
        // 设置背景色
        this.cameras.main.setBackgroundColor('#FFF8DC');

        // 游戏标题
        this.add.text(this.scale.width / 2, 150, 'Prepared Cooked', {
            fontSize: '48px',
            fontFamily: 'Courier New',
            color: '#D2691E',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 副标题
        this.add.text(this.scale.width / 2, 200, '预制菜大厨', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#CD853F'
        }).setOrigin(0.5);

        // 最高分显示
        const highScore = gameData.getHighScore();
        this.add.text(this.scale.width / 2, 250, `最高分: ${highScore}`, {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);

        // 难度选择标题
        this.add.text(this.scale.width / 2, 320, '选择难度:', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#D2691E'
        }).setOrigin(0.5);

        // 创建难度按钮
        this.createDifficultyButtons();

        // 游戏说明
        this.add.text(this.scale.width / 2, 600, '按 ESC 键查看游戏说明', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);

        // 版权信息
        this.add.text(this.scale.width / 2, this.scale.height - 50, '基于西贝莜面村菜品 | 像素风烹饪游戏', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#CD853F'
        }).setOrigin(0.5);

        // 键盘监听
        this.input.keyboard.on('keydown-ESC', () => {
            const instructionsPanel = document.getElementById('instructions-panel');
            if (instructionsPanel) {
                instructionsPanel.classList.remove('hidden');
            }
        });
    }

    createDifficultyButtons() {
        const difficulties = [
            { key: 'easy', name: '简单', color: '#90EE90', y: 380 },
            { key: 'medium', name: '中等', color: '#FFD700', y: 440 },
            { key: 'hard', name: '困难', color: '#FF6347', y: 500 }
        ];

        difficulties.forEach(diff => {
            // 创建按钮背景
            const button = this.add.rectangle(this.scale.width / 2, diff.y, 200, 50, 0xFFFFFF);
            button.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(diff.color).color);
            button.setInteractive();

            // 按钮文字
            const buttonText = this.add.text(this.scale.width / 2, diff.y, diff.name, {
                fontSize: '20px',
                fontFamily: 'Courier New',
                color: '#8B4513',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // 难度描述
            let description = '';
            switch (diff.key) {
                case 'easy':
                    description = '订单较少，简单菜品为主';
                    break;
                case 'medium':
                    description = '标准难度，适合新手';
                    break;
                case 'hard':
                    description = '订单频繁，复杂菜品较多';
                    break;
            }

            this.add.text(this.scale.width / 2, diff.y + 25, description, {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: '#CD853F'
            }).setOrigin(0.5);

            // 按钮交互效果
            button.on('pointerover', () => {
                button.setFillStyle(Phaser.Display.Color.HexStringToColor(diff.color).color, 0.3);
                buttonText.setScale(1.1);
            });

            button.on('pointerout', () => {
                button.setFillStyle(0xFFFFFF);
                buttonText.setScale(1);
            });

            button.on('pointerdown', () => {
                button.setFillStyle(Phaser.Display.Color.HexStringToColor(diff.color).color, 0.6);
                buttonText.setScale(0.95);
            });

            button.on('pointerup', () => {
                button.setFillStyle(0xFFFFFF);
                buttonText.setScale(1);
                this.startGame(diff.key);
            });
        });
    }

    startGame(difficulty) {
        console.log(`开始游戏，难度: ${difficulty}`);
        
        // 设置游戏实例的难度
        if (window.gameInstance) {
            window.gameInstance.setDifficulty(difficulty);
        }

        // 切换到游戏场景
        this.scene.start('GameScene', { difficulty: difficulty });
    }
}