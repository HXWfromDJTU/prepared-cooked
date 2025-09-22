// 厨房布局和管理类
class Kitchen {
    constructor(scene) {
        this.scene = scene;
        this.microwaves = [];
        this.storage = null;
        this.workstation = null;
        this.servingArea = null;

        this.init();
    }

    init() {
        const layout = gameData.kitchenLayout;
        
        // 初始化微波炉 - 增强状态管理
        layout.microwaves.forEach((microwaveData, index) => {
            this.microwaves.push({
                ...microwaveData,
                isOccupied: false,
                currentItem: null,
                defrostTimer: null,
                status: 'idle', // idle, working, completed
                remainingTime: 0,
                totalTime: 0,
                progressBar: null
            });
        });

        // 初始化分散的食材存储
        this.storageAreas = this.generateStorageItems();
        
        // 初始化料理台存储
        this.cookingCounters = {};
        
        // 初始化其他区域
        this.workstation = { ...layout.workstation, isOccupied: false };
        this.servingArea = { ...layout.servingArea, completedOrders: [] };

        
        // 初始化组装台物品数组
        this.workstationItems = [];
    }

    generateStorageItems() {
        // 为每个具体食材生成存储区域
        const storageItems = {};
        
        const ingredientIds = Object.keys(gameData.ingredients);
        
        ingredientIds.forEach(id => {
            const ingredient = gameData.getIngredient(id);
            storageItems[id] = {
                id: id,
                ingredient: ingredient,
                quantity: 15 // 每种食材15个
            };
        });

        return storageItems;
    }

    // 从指定食材存储区取食材
    takeFromStorage(ingredientId) {
        if (!this.storageAreas[ingredientId]) {
            return null;
        }
        
        const item = this.storageAreas[ingredientId];
        if (item && item.quantity > 0) {
            item.quantity--;
            return {
                id: ingredientId,
                ...item.ingredient,
                type: 'raw_ingredient'
            };
        }
        return null;
    }
    
    // 获取指定食材的存储信息
    getStorageInfo(ingredientId) {
        return this.storageAreas[ingredientId] || null;
    }

    // 获取随机食材
    getRandomIngredient() {
        const ingredientIds = Object.keys(this.storageAreas);
        const availableIngredients = ingredientIds.filter(id => 
            this.storageAreas[id] && this.storageAreas[id].quantity > 0
        );
        
        if (availableIngredients.length === 0) return null;

        const randomId = availableIngredients[Math.floor(Math.random() * availableIngredients.length)];
        return this.takeFromStorage(randomId);
    }

    // 使用微波炉
    useMicrowave(microwaveId, item) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave || microwave.status !== 'idle') {
            return false;
        }

        // 设置微波炉状态
        microwave.isOccupied = true;
        microwave.currentItem = item;
        microwave.status = 'working';
        microwave.totalTime = item.defrostTime;
        microwave.remainingTime = item.defrostTime;

        // 创建进度条UI
        this.createMicrowaveProgressBar(microwave);

        // 创建解冻计时器 - 每100ms更新一次
        microwave.defrostTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                this.updateMicrowaveProgress(microwaveId);
            },
            callbackScope: this,
            loop: true
        });

        console.log(`${item.name} 开始在 ${microwaveId} 中解冻，需要 ${item.defrostTime/1000} 秒`);
        return true;
    }
    
    // 创建微波炉进度条
    createMicrowaveProgressBar(microwave) {
        const x = microwave.x;
        const y = microwave.y - 60;
        
        // 背景条
        microwave.progressBg = this.scene.add.rectangle(x, y, 80, 8, 0x333333);
        microwave.progressBg.setStrokeStyle(1, 0x666666);
        
        // 进度条
        microwave.progressBar = this.scene.add.rectangle(x - 38, y, 4, 6, 0x00FF00);
        microwave.progressBar.setOrigin(0, 0.5);
        
        // 时间文本
        microwave.timeText = this.scene.add.text(x, y - 20, '', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#8B4513',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 食材名称文本
        microwave.itemText = this.scene.add.text(x, y + 15, microwave.currentItem.name, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);
    }
    
    // 更新微波炉进度
    updateMicrowaveProgress(microwaveId) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave || microwave.status !== 'working') {
            return;
        }
        
        microwave.remainingTime -= 100;
        
        if (microwave.remainingTime <= 0) {
            // 解冻完成
            this.completeDefrosting(microwaveId);
        } else {
            // 更新进度条和时间显示
            const progress = 1 - (microwave.remainingTime / microwave.totalTime);
            const progressWidth = 76 * progress; // 76 = 80 - 4 (padding)
            
            if (microwave.progressBar) {
                microwave.progressBar.width = progressWidth;
            }
            
            if (microwave.timeText) {
                const seconds = Math.ceil(microwave.remainingTime / 1000);
                microwave.timeText.setText(`${seconds}s`);
            }
        }
    }

    // 完成解冻
    completeDefrosting(microwaveId) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave) return;

        console.log(`${microwave.currentItem.name} 在 ${microwaveId} 中解冻完成`);
        
        // 停止计时器
        if (microwave.defrostTimer) {
            microwave.defrostTimer.destroy();
            microwave.defrostTimer = null;
        }
        
        // 更新微波炉状态
        microwave.status = 'completed';
        microwave.remainingTime = 0;
        
        // 将食材标记为已解冻，保留原始信息
        microwave.currentItem = {
            ...microwave.currentItem,
            type: 'defrosted_ingredient',
            isReady: true,
            originalId: microwave.currentItem.id, // 保留原始食材ID
            originalName: microwave.currentItem.name // 保留原始名称
        };

        // 更新进度条显示为完成状态
        if (microwave.progressBar) {
            microwave.progressBar.width = 76;
            microwave.progressBar.setFillStyle(0xFFD700); // 金色表示完成
        }
        
        if (microwave.timeText) {
            microwave.timeText.setText('完成!');
            microwave.timeText.setColor('#FFD700');
        }

        // 显示完成效果
        this.showDefrostComplete(microwave);
    }

    // 从微波炉取出食材
    takeFromMicrowave(microwaveId) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave || microwave.status !== 'completed' || !microwave.currentItem.isReady) {
            return null;
        }

        const item = microwave.currentItem;
        
        // 清理UI元素
        this.clearMicrowaveUI(microwave);
        
        // 重置微波炉状态
        microwave.isOccupied = false;
        microwave.currentItem = null;
        microwave.status = 'idle';
        microwave.remainingTime = 0;
        microwave.totalTime = 0;
        
        if (microwave.defrostTimer) {
            microwave.defrostTimer.destroy();
            microwave.defrostTimer = null;
        }

        console.log(`从 ${microwaveId} 取出 ${item.name}`);
        return item;
    }
    
    // 清理微波炉UI元素
    clearMicrowaveUI(microwave) {
        if (microwave.progressBg) {
            microwave.progressBg.destroy();
            microwave.progressBg = null;
        }
        if (microwave.progressBar) {
            microwave.progressBar.destroy();
            microwave.progressBar = null;
        }
        if (microwave.timeText) {
            microwave.timeText.destroy();
            microwave.timeText = null;
        }
        if (microwave.itemText) {
            microwave.itemText.destroy();
            microwave.itemText = null;
        }
    }

    // 显示解冻完成效果
    showDefrostComplete(microwave) {
        // 在微波炉上方显示完成提示
        const completeText = this.scene.add.text(microwave.x, microwave.y - 80, '解冻完成!', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 闪烁效果
        this.scene.tweens.add({
            targets: completeText,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                completeText.destroy();
            }
        });

        // 微波炉颜色变化提示
        const microwaveRect = this.scene.add.rectangle(microwave.x, microwave.y, 80, 60, 0xFFD700, 0.5);
        this.scene.tweens.add({
            targets: microwaveRect,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                microwaveRect.destroy();
            }
        });
    }

    // 在工作台组装菜品
    assembleAtWorkstation(ingredients, recipe) {
        if (this.workstation.isOccupied) {
            return false;
        }

        // 检查是否有所需的所有食材
        const requiredIngredients = recipe.ingredients;
        const hasAllIngredients = requiredIngredients.every(reqId => 
            ingredients.some(ing => ing.id === reqId && ing.type === 'defrosted_ingredient')
        );

        if (!hasAllIngredients) {
            console.log('缺少必要的食材');
            return false;
        }

        // 开始组装
        this.workstation.isOccupied = true;
        
        // 组装时间（可以根据菜品复杂度调整）
        const assembleTime = recipe.difficulty * 2000; // 2秒 * 难度等级

        this.scene.time.addEvent({
            delay: assembleTime,
            callback: () => {
                this.completeAssembly(recipe);
            },
            callbackScope: this
        });

        console.log(`开始组装 ${recipe.name}，需要 ${assembleTime/1000} 秒`);
        return true;
    }

    // 完成组装
    completeAssembly(recipe) {
        this.workstation.isOccupied = false;
        
        const finishedDish = {
            name: recipe.name,
            type: 'finished_dish',
            recipe: recipe,
            completedAt: Date.now()
        };

        console.log(`${recipe.name} 组装完成`);
        return finishedDish;
    }

    // 上菜
    serveDish(dish) {
        this.servingArea.completedOrders.push({
            dish: dish,
            servedAt: Date.now()
        });

        console.log(`${dish.name} 已上菜`);
        return true;
    }

    // 获取微波炉状态
    getMicrowaveStatus(microwaveId) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave) return null;

        return {
            isOccupied: microwave.isOccupied,
            currentItem: microwave.currentItem,
            isReady: microwave.currentItem ? microwave.currentItem.isReady : false
        };
    }

    // 获取所有微波炉状态
    getAllMicrowaveStatus() {
        return this.microwaves.map(microwave => ({
            id: microwave.id,
            isOccupied: microwave.isOccupied,
            currentItem: microwave.currentItem,
            isReady: microwave.currentItem ? microwave.currentItem.isReady : false
        }));
    }

    // 清理厨房（游戏结束时调用）
    cleanup() {
        // 清理所有计时器和UI元素
        this.microwaves.forEach(microwave => {
            if (microwave.defrostTimer) {
                microwave.defrostTimer.destroy();
            }
            // 清理微波炉UI元素
            this.clearMicrowaveUI(microwave);
        });

        // 重置状态
        this.init();
    }

    // 更新厨房状态（每帧调用）
    update() {
        // 这里可以添加需要每帧更新的逻辑
        // 比如检查微波炉状态、更新UI等
    }
}