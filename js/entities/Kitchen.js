// 厨房布局和管理类
class Kitchen {
    constructor(scene) {
        this.scene = scene;
        this.microwaves = [];
        this.storage = null;
        this.workstation = null;
        this.servingArea = null;
        this.washArea = null;
        
        this.init();
    }

    init() {
        const layout = gameData.kitchenLayout;
        
        // 初始化微波炉
        layout.microwaves.forEach((microwaveData, index) => {
            this.microwaves.push({
                ...microwaveData,
                isOccupied: false,
                currentItem: null,
                defrostTimer: null
            });
        });

        // 初始化其他区域
        this.storage = { ...layout.storage, items: this.generateStorageItems() };
        this.workstation = { ...layout.workstation, isOccupied: false };
        this.servingArea = { ...layout.servingArea, completedOrders: [] };
        this.washArea = { ...layout.washArea };
    }

    generateStorageItems() {
        // 生成储存区的食材
        const items = [];
        const ingredientIds = Object.keys(gameData.ingredients);
        
        ingredientIds.forEach(id => {
            items.push({
                id: id,
                ingredient: gameData.getIngredient(id),
                quantity: 10 // 每种食材10个
            });
        });

        return items;
    }

    // 从储存区取食材
    takeFromStorage(ingredientId) {
        const item = this.storage.items.find(item => item.id === ingredientId);
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

    // 获取随机食材
    getRandomIngredient() {
        const availableItems = this.storage.items.filter(item => item.quantity > 0);
        if (availableItems.length === 0) return null;

        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        return this.takeFromStorage(randomItem.id);
    }

    // 使用微波炉
    useMicrowave(microwaveId, item) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave || microwave.isOccupied) {
            return false;
        }

        microwave.isOccupied = true;
        microwave.currentItem = item;

        // 创建解冻计时器
        microwave.defrostTimer = this.scene.time.addEvent({
            delay: item.defrostTime,
            callback: () => {
                this.completeDefrosting(microwaveId);
            },
            callbackScope: this
        });

        console.log(`${item.name} 开始在 ${microwaveId} 中解冻，需要 ${item.defrostTime/1000} 秒`);
        return true;
    }

    // 完成解冻
    completeDefrosting(microwaveId) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave) return;

        console.log(`${microwave.currentItem.name} 在 ${microwaveId} 中解冻完成`);
        
        // 将食材标记为已解冻
        microwave.currentItem.type = 'defrosted_ingredient';
        microwave.currentItem.isReady = true;

        // 可以添加视觉或音效提示
        this.showDefrostComplete(microwave);
    }

    // 从微波炉取出食材
    takeFromMicrowave(microwaveId) {
        const microwave = this.microwaves.find(m => m.id === microwaveId);
        if (!microwave || !microwave.isOccupied || !microwave.currentItem.isReady) {
            return null;
        }

        const item = microwave.currentItem;
        
        // 清空微波炉
        microwave.isOccupied = false;
        microwave.currentItem = null;
        if (microwave.defrostTimer) {
            microwave.defrostTimer.destroy();
            microwave.defrostTimer = null;
        }

        return item;
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
        // 清理所有计时器
        this.microwaves.forEach(microwave => {
            if (microwave.defrostTimer) {
                microwave.defrostTimer.destroy();
            }
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