// 玩家角色类
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.speed = 150;
        this.carryingItem = null; // 当前携带的物品
        this.interactionRange = 50; // 交互范围
        
        this.create();
    }

    create() {
        // 创建玩家精灵（使用简单的圆形代替）
        this.sprite = this.scene.add.circle(this.x, this.y, 20, 0xFF6347);
        this.sprite.setStrokeStyle(2, 0xDC143C);
        
        // 添加物理体
        this.scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        
        // 玩家标识文字
        this.nameText = this.scene.add.text(this.x, this.y - 35, '厨师', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);

        // 携带物品显示
        this.carryingText = this.scene.add.text(this.x, this.y + 35, '', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#D2691E'
        }).setOrigin(0.5);
    }

    update() {
        this.handleMovement();
        this.updateUI();
    }

    handleMovement() {
        const cursors = this.scene.cursors;
        const wasd = this.scene.wasd;
        
        let velocityX = 0;
        let velocityY = 0;

        // 检查移动输入
        if (cursors.left.isDown || wasd.A.isDown) {
            velocityX = -this.speed;
        } else if (cursors.right.isDown || wasd.D.isDown) {
            velocityX = this.speed;
        }

        if (cursors.up.isDown || wasd.W.isDown) {
            velocityY = -this.speed;
        } else if (cursors.down.isDown || wasd.S.isDown) {
            velocityY = this.speed;
        }

        // 设置速度
        this.sprite.body.setVelocity(velocityX, velocityY);
        
        // 更新位置
        this.x = this.sprite.x;
        this.y = this.sprite.y;
    }

    updateUI() {
        // 更新文字位置
        this.nameText.setPosition(this.x, this.y - 35);
        this.carryingText.setPosition(this.x, this.y + 35);
        
        // 更新携带物品显示
        if (this.carryingItem) {
            this.carryingText.setText(`携带: ${this.carryingItem.name}`);
        } else {
            this.carryingText.setText('');
        }
    }

    interact() {
        // 检查附近可交互的对象
        const nearbyObject = this.findNearbyInteractable();
        
        if (nearbyObject) {
            this.handleInteraction(nearbyObject);
        } else {
            console.log('附近没有可交互的对象');
        }
    }

    findNearbyInteractable() {
        const layout = gameData.kitchenLayout;
        
        // 检查各个功能区域
        const areas = [
            { ...layout.storage, type: 'storage', name: '食材储存' },
            { ...layout.workstation, type: 'workstation', name: '组装台' },
            { ...layout.servingArea, type: 'serving', name: '上菜区' },
            { ...layout.washArea, type: 'wash', name: '清洗区' },
            ...layout.microwaves.map((m, i) => ({ ...m, type: 'microwave', name: `微波炉${i + 1}` }))
        ];

        for (let area of areas) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, area.x, area.y);
            if (distance <= this.interactionRange) {
                return area;
            }
        }

        return null;
    }

    handleInteraction(object) {
        console.log(`与 ${object.name} 交互`);

        switch (object.type) {
            case 'storage':
                this.interactWithStorage();
                break;
            case 'microwave':
                this.interactWithMicrowave(object);
                break;
            case 'workstation':
                this.interactWithWorkstation();
                break;
            case 'serving':
                this.interactWithServingArea();
                break;
            case 'wash':
                this.interactWithWashArea();
                break;
        }
    }

    interactWithStorage() {
        if (this.carryingItem) {
            console.log('手上已有物品，无法取新的食材');
            return;
        }

        // 随机选择一个食材
        const ingredientIds = Object.keys(gameData.ingredients);
        const randomId = ingredientIds[Math.floor(Math.random() * ingredientIds.length)];
        const ingredient = gameData.getIngredient(randomId);

        this.carryingItem = {
            id: randomId,
            name: ingredient.name,
            type: 'raw_ingredient',
            defrostTime: ingredient.defrostTime,
            category: ingredient.category
        };

        console.log(`取得食材: ${ingredient.name}`);
        this.showInteractionFeedback(`取得: ${ingredient.name}`, 0x90EE90);
    }

    interactWithMicrowave(microwave) {
        if (!this.carryingItem) {
            console.log('手上没有食材可以解冻');
            return;
        }

        if (this.carryingItem.type !== 'raw_ingredient') {
            console.log('只能解冻生食材');
            return;
        }

        // 开始解冻过程
        console.log(`开始解冻: ${this.carryingItem.name}`);
        this.startDefrosting(microwave);
    }

    startDefrosting(microwave) {
        const item = this.carryingItem;
        this.carryingItem = null; // 放入微波炉，手上清空

        // 创建解冻计时器
        const defrostTimer = this.scene.time.addEvent({
            delay: item.defrostTime,
            callback: () => {
                // 解冻完成
                console.log(`${item.name} 解冻完成`);
                this.showInteractionFeedback(`${item.name} 解冻完成!`, 0xFFD700);
                
                // 可以在这里添加解冻完成的视觉效果
                // 暂时直接让玩家可以取回
                if (!this.carryingItem) {
                    this.carryingItem = {
                        ...item,
                        type: 'defrosted_ingredient'
                    };
                }
            },
            callbackScope: this
        });

        this.showInteractionFeedback(`解冻中: ${item.name}`, 0xFFA500);
    }

    interactWithWorkstation() {
        if (!this.carryingItem || this.carryingItem.type !== 'defrosted_ingredient') {
            console.log('需要解冻后的食材才能组装');
            return;
        }

        // 这里应该实现菜品组装逻辑
        // 暂时简化为直接完成一个菜品
        console.log(`在工作台组装: ${this.carryingItem.name}`);
        
        // 模拟组装成菜品
        this.carryingItem = {
            name: `${this.carryingItem.name}料理`,
            type: 'finished_dish',
            baseScore: 100
        };

        this.showInteractionFeedback('菜品组装完成!', 0x90EE90);
    }

    interactWithServingArea() {
        if (!this.carryingItem || this.carryingItem.type !== 'finished_dish') {
            console.log('需要完成的菜品才能上菜');
            return;
        }

        // 上菜
        console.log(`上菜: ${this.carryingItem.name}`);
        
        // 添加分数
        if (this.scene.addScore) {
            this.scene.addScore(this.carryingItem.baseScore || 50);
        }

        this.carryingItem = null;
        this.showInteractionFeedback('上菜成功!', 0xFFD700);
    }

    interactWithWashArea() {
        if (this.carryingItem) {
            console.log('清洗物品');
            this.carryingItem = null;
            this.showInteractionFeedback('物品已清洗', 0x87CEEB);
        } else {
            console.log('没有物品需要清洗');
        }
    }

    showInteractionFeedback(message, color = 0xFFFFFF) {
        // 显示交互反馈
        const feedbackText = this.scene.add.text(this.x, this.y - 60, message, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: `#${color.toString(16).padStart(6, '0')}`
        }).setOrigin(0.5);

        // 动画效果
        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                feedbackText.destroy();
            }
        });
    }

    // 获取当前携带的物品
    getCarryingItem() {
        return this.carryingItem;
    }

    // 设置携带的物品
    setCarryingItem(item) {
        this.carryingItem = item;
    }

    // 清空携带的物品
    clearCarryingItem() {
        this.carryingItem = null;
    }
}