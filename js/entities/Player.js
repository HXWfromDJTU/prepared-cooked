// 玩家角色类
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.gridX = Math.floor(x / gameData.config.gridSize);
        this.gridY = Math.floor(y / gameData.config.gridSize);
        this.speed = 150;
        this.carryingItem = null; // 当前携带的物品
        this.interactionRange = 50; // 交互范围
        this.isMoving = false; // 是否正在移动
        this.moveKeys = {}; // 按键状态跟踪
        
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
        if (this.isMoving) return; // 如果正在移动，不处理新的移动输入

        const cursors = this.scene.cursors;
        const wasd = this.scene.wasd;
        
        let targetGridX = this.gridX;
        let targetGridY = this.gridY;
        let shouldMove = false;

        // 检查按键状态变化（只在按键刚按下时移动）
        if ((cursors.left.isDown || wasd.A.isDown) && !this.moveKeys.left) {
            targetGridX = Math.max(0, this.gridX - 1);
            shouldMove = true;
            this.moveKeys.left = true;
        } else if ((cursors.right.isDown || wasd.D.isDown) && !this.moveKeys.right) {
            targetGridX = Math.min(gameData.config.gridWidth - 1, this.gridX + 1);
            shouldMove = true;
            this.moveKeys.right = true;
        } else if ((cursors.up.isDown || wasd.W.isDown) && !this.moveKeys.up) {
            targetGridY = Math.max(0, this.gridY - 1);
            shouldMove = true;
            this.moveKeys.up = true;
        } else if ((cursors.down.isDown || wasd.S.isDown) && !this.moveKeys.down) {
            targetGridY = Math.min(gameData.config.gridHeight - 1, this.gridY + 1);
            shouldMove = true;
            this.moveKeys.down = true;
        }

        // 重置按键状态
        if (!cursors.left.isDown && !wasd.A.isDown) this.moveKeys.left = false;
        if (!cursors.right.isDown && !wasd.D.isDown) this.moveKeys.right = false;
        if (!cursors.up.isDown && !wasd.W.isDown) this.moveKeys.up = false;
        if (!cursors.down.isDown && !wasd.S.isDown) this.moveKeys.down = false;

        if (shouldMove && (targetGridX !== this.gridX || targetGridY !== this.gridY)) {
            this.moveToGrid(targetGridX, targetGridY);
        }
    }

    // 移动到指定网格位置
    moveToGrid(targetGridX, targetGridY) {
        if (this.isMoving) return;

        // 检查目标位置是否在允许的通道内
        if (!this.isValidWalkwayPosition(targetGridX, targetGridY)) {
            console.log('无法移动到该位置，不在通道内');
            return;
        }

        this.isMoving = true;
        this.gridX = targetGridX;
        this.gridY = targetGridY;

        const targetPixel = gameData.gridToPixel(targetGridX, targetGridY);
        
        // 使用Phaser的补间动画进行平滑移动
        this.scene.tweens.add({
            targets: this.sprite,
            x: targetPixel.x,
            y: targetPixel.y,
            duration: 200, // 200ms移动时间
            ease: 'Power2',
            onComplete: () => {
                this.isMoving = false;
                this.x = this.sprite.x;
                this.y = this.sprite.y;
            }
        });
    }

    // 检查位置是否在允许的通道内
    isValidWalkwayPosition(gridX, gridY) {
        const layout = gameData.kitchenLayout;
        
        // 检查是否在外圈通道内
        const inOuterWalkway = (
            gridX >= layout.outerWalkway.gridX && 
            gridX < layout.outerWalkway.gridX + layout.outerWalkway.gridWidth &&
            gridY >= layout.outerWalkway.gridY && 
            gridY < layout.outerWalkway.gridY + layout.outerWalkway.gridHeight
        );
        
        // 检查是否在内圈通道内
        const inInnerWalkway = (
            gridX >= layout.innerWalkway.gridX && 
            gridX < layout.innerWalkway.gridX + layout.innerWalkway.gridWidth &&
            gridY >= layout.innerWalkway.gridY && 
            gridY < layout.innerWalkway.gridY + layout.innerWalkway.gridHeight
        );
        
        // 检查是否与工作台重叠
        const onWorkstation = layout.workstations.some(station => 
            gridX >= station.gridX && 
            gridX < station.gridX + station.gridWidth &&
            gridY >= station.gridY && 
            gridY < station.gridY + station.gridHeight
        );
        
        // 只有在通道内且不与工作台重叠的位置才能移动
        return (inOuterWalkway || inInnerWalkway) && !onWorkstation;
    }

    updateUI() {
        // 更新文字位置
        this.nameText.setPosition(this.x, this.y - 35);
        this.carryingText.setPosition(this.x, this.y + 35);
        
        // 更新携带物品显示
        if (this.carryingItem) {
            const ingredient = gameData.getIngredient(this.carryingItem.originalId || this.carryingItem.id);
            const emoji = ingredient ? ingredient.emoji : '🍽️';
            this.carryingText.setText(`${emoji} ${this.carryingItem.name}`);
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
        
        // 检查玩家当前网格位置是否与工作台重叠或相邻
        for (let station of layout.workstations) {
            const stationPixel = gameData.gridToPixel(station.gridX, station.gridY);
            
            // 检查玩家是否在工作台的交互范围内（相邻网格）
            const gridDistance = Math.abs(this.gridX - station.gridX) + Math.abs(this.gridY - station.gridY);
            
            if (gridDistance <= 2) { // 允许在相邻2格内交互
                return {
                    x: stationPixel.x,
                    y: stationPixel.y,
                    gridX: station.gridX,
                    gridY: station.gridY,
                    gridWidth: station.gridWidth,
                    gridHeight: station.gridHeight,
                    type: station.type,
                    name: station.name,
                    ingredientId: station.ingredientId,
                    id: station.id
                };
            }
        }

        // 检查单独的工作台（组装台）
        const workstation = layout.workstation;
        if (workstation) {
            const workstationGridPos = gameData.pixelToGrid(workstation.x, workstation.y);
            const gridDistance = Math.abs(this.gridX - workstationGridPos.gridX) + Math.abs(this.gridY - workstationGridPos.gridY);
            
            if (gridDistance <= 2) {
                return {
                    x: workstation.x,
                    y: workstation.y,
                    gridX: workstationGridPos.gridX,
                    gridY: workstationGridPos.gridY,
                    type: 'workstation',
                    name: '组装台',
                    id: workstation.id
                };
            }
        }

        return null;
    }

    handleInteraction(object) {
        console.log(`与 ${object.name} 交互`);

        switch (object.type) {
            case 'ingredient_storage':
                this.interactWithIngredientStorage(object);
                break;
            case 'microwave':
                this.interactWithMicrowave(object);
                break;
            case 'workstation':
                this.interactWithWorkstation();
                break;
            case 'cooking_counter':
                this.interactWithCookingCounter(object);
                break;
            case 'serving':
                this.interactWithServingArea();
                break;
            default:
                console.log(`未知的交互对象类型: ${object.type}`);
        }
    }

    // 与具体食材存储区域交互
    interactWithIngredientStorage(storageArea) {
        if (this.carryingItem) {
            console.log('手上已有物品，无法取新的食材');
            return;
        }

        // 从指定食材存储区域取食材
        const item = this.scene.kitchen.takeFromStorage(storageArea.ingredientId);
        
        if (item) {
            this.carryingItem = item;
            console.log(`从${storageArea.name}存储区取得食材: ${item.name}`);
            this.showInteractionFeedback(`取得: ${item.name}`, 0x90EE90);
        } else {
            console.log(`${storageArea.name}存储区已空`);
            this.showInteractionFeedback(`${storageArea.name}已空`, 0xFF6347);
        }
    }
    


    interactWithMicrowave(microwave) {
        const microwaveStatus = this.scene.kitchen.getMicrowaveStatus(microwave.id);
        
        if (!microwaveStatus) {
            console.log('微波炉状态异常');
            return;
        }
        
        // 如果微波炉已完成解冻，优先取出食材
        if (microwaveStatus.isReady && microwaveStatus.currentItem) {
            if (this.carryingItem) {
                console.log('手上已有物品，无法取出解冻好的食材');
                this.showInteractionFeedback('手上已满', 0xFF6347);
                return;
            }
            
            // 取出解冻好的食材
            const defrostedItem = this.scene.kitchen.takeFromMicrowave(microwave.id);
            if (defrostedItem) {
                this.carryingItem = defrostedItem;
                console.log(`取出解冻好的食材: ${defrostedItem.name}`);
                this.showInteractionFeedback(`取出: ${defrostedItem.name}`, 0xFFD700);
            }
            return;
        }
        
        // 如果微波炉正在工作，显示状态
        if (microwaveStatus.isOccupied && !microwaveStatus.isReady) {
            console.log(`微波炉正在解冻: ${microwaveStatus.currentItem.name}`);
            this.showInteractionFeedback('正在解冻中...', 0xFFA500);
            return;
        }
        
        // 如果微波炉空闲，可以放入食材
        if (!this.carryingItem) {
            console.log('手上没有食材可以解冻');
            this.showInteractionFeedback('需要食材', 0xFF6347);
            return;
        }

        if (this.carryingItem.type !== 'raw_ingredient') {
            console.log('只能解冻生食材');
            this.showInteractionFeedback('只能解冻生食材', 0xFF6347);
            return;
        }

        // 开始解冻过程
        if (this.scene.kitchen.useMicrowave(microwave.id, this.carryingItem)) {
            console.log(`开始解冻: ${this.carryingItem.name}`);
            this.showInteractionFeedback(`开始解冻: ${this.carryingItem.name}`, 0x90EE90);
            this.carryingItem = null; // 清空手上的物品
        } else {
            console.log('微波炉使用失败');
            this.showInteractionFeedback('微波炉忙碌', 0xFF6347);
        }
    }



    interactWithWorkstation() {
        if (!this.carryingItem) {
            // 如果没有携带物品，检查是否可以取走已完成的菜品
            if (this.scene.kitchen && this.scene.kitchen.workstationItems && this.scene.kitchen.workstationItems.length > 0) {
                const finishedDish = this.scene.kitchen.workstationItems.find(item => item.type === 'finished_dish');
                if (finishedDish) {
                    this.carryingItem = finishedDish;
                    this.scene.kitchen.removeItemFromWorkstation(finishedDish);
                    this.showInteractionFeedback(`取走: ${finishedDish.name}`, 0xFFD700);
                    return;
                }
            }
            console.log('组装台上没有可取的物品');
            return;
        }

        // 组装台现在可以直接处理解冻后的食材
        if (this.carryingItem.type !== 'defrosted_ingredient' && this.carryingItem.type !== 'prepared_ingredient') {
            console.log('需要解冻后的食材才能组装');
            this.showInteractionFeedback('需要解冻后的食材', 0xFF6B6B);
            return;
        }

        // 如果是解冻后的食材，直接转换为准备好的食材
        if (this.carryingItem.type === 'defrosted_ingredient') {
            this.carryingItem = {
                ...this.carryingItem,
                type: 'prepared_ingredient',
                name: `已处理的${this.carryingItem.originalName || this.carryingItem.name}`,
                originalId: this.carryingItem.originalId || this.carryingItem.id,
                originalName: this.carryingItem.originalName || this.carryingItem.name
            };
        }

        // 将食材添加到组装台
        this.scene.kitchen.addItemToWorkstation(this.carryingItem);
        this.showInteractionFeedback(`添加食材: ${this.carryingItem.originalName || this.carryingItem.name}`, 0x87CEEB);
        
        this.carryingItem = null;

        // 检查是否可以完成某个菜品
        this.checkRecipeCompletion();
    }

    checkRecipeCompletion() {
        if (!this.scene.kitchen.workstationItems || this.scene.kitchen.workstationItems.length === 0) {
            return;
        }

        // 获取当前组装台上的食材ID列表
        const currentIngredients = this.scene.kitchen.workstationItems
            .filter(item => item.type === 'prepared_ingredient')
            .map(item => item.originalId)
            .sort();

        // 检查所有菜品配方
        const recipes = window.gameData.recipes;
        for (const [recipeId, recipe] of Object.entries(recipes)) {
            const requiredIngredients = [...recipe.ingredients].sort();
            
            // 检查食材是否完全匹配
            if (this.arraysEqual(currentIngredients, requiredIngredients)) {
                // 找到匹配的配方，制作菜品
                this.createDish(recipeId, recipe);
                return;
            }
        }

        // 显示当前食材状态
        const ingredientNames = this.scene.kitchen.workstationItems
            .filter(item => item.type === 'prepared_ingredient')
            .map(item => item.originalName || item.name);
        
        if (ingredientNames.length > 0) {
            this.showInteractionFeedback(`当前食材: ${ingredientNames.join(', ')}`, 0x87CEEB);
        }
    }

    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    createDish(recipeId, recipe) {
        // 清除组装台上的食材
        this.scene.kitchen.workstationItems = this.scene.kitchen.workstationItems.filter(item => item.type !== 'prepared_ingredient');
        this.scene.kitchen.updateWorkstationDisplay();
        
        // 创建完成的菜品
        const finishedDish = {
            name: recipe.name,
            type: 'finished_dish',
            recipeId: recipeId,
            baseScore: recipe.baseScore,
            difficulty: recipe.difficulty
        };

        // 将菜品放到组装台上
        this.scene.kitchen.addItemToWorkstation(finishedDish);
        
        this.showInteractionFeedback(`制作完成: ${recipe.name}!`, 0xFFD700);
        console.log(`成功制作菜品: ${recipe.name}`);
    }

    // 与料理台交互
    interactWithCookingCounter(counter) {
        // 初始化料理台存储
        if (!this.scene.kitchen.cookingCounters) {
            this.scene.kitchen.cookingCounters = {};
        }
        
        if (!this.scene.kitchen.cookingCounters[counter.id]) {
            this.scene.kitchen.cookingCounters[counter.id] = {
                items: [],
                maxItems: 4 // 每个料理台最多放4个物品
            };
        }
        
        const counterData = this.scene.kitchen.cookingCounters[counter.id];
        
        if (!this.carryingItem) {
            // 如果没有携带物品，尝试从料理台取物品
            if (counterData.items.length > 0) {
                // 优先取完成的菜品
                const finishedDish = counterData.items.find(item => item.type === 'finished_dish');
                if (finishedDish) {
                    this.carryingItem = finishedDish;
                    counterData.items = counterData.items.filter(item => item !== finishedDish);
                    this.showInteractionFeedback(`取走: ${finishedDish.name}`, 0xFFD700);
                    return;
                }
                
                // 否则取最后放置的物品
                this.carryingItem = counterData.items.pop();
                this.showInteractionFeedback(`取走: ${this.carryingItem.name}`, 0xDEB887);
            } else {
                this.showInteractionFeedback('料理台是空的', 0x999999);
            }
            return;
        }

        // 如果携带物品，尝试放置到料理台
        if (counterData.items.length >= counterData.maxItems) {
            this.showInteractionFeedback('料理台已满', 0xFF6347);
            return;
        }

        // 料理台可以放置任何物品
        let placedItem = null;
        let feedbackMessage = '';
        let feedbackColor = 0x87CEEB;
        
        if (this.carryingItem.type === 'defrosted_ingredient') {
            // 解冻后的食材放置时转换为已处理状态
            placedItem = {
                ...this.carryingItem,
                type: 'prepared_ingredient',
                name: `已处理的${this.carryingItem.originalName || this.carryingItem.name}`,
                originalId: this.carryingItem.originalId || this.carryingItem.id,
                originalName: this.carryingItem.originalName || this.carryingItem.name
            };
            feedbackMessage = `处理食材: ${placedItem.originalName}`;
            feedbackColor = 0x90EE90;
            
        } else if (this.carryingItem.type === 'prepared_ingredient') {
            // 已处理的食材直接放置
            placedItem = this.carryingItem;
            feedbackMessage = `放置: ${placedItem.originalName || placedItem.name}`;
            feedbackColor = 0x87CEEB;
            
        } else {
            // 其他任何物品都可以放置（原始食材、碟子等）
            placedItem = this.carryingItem;
            feedbackMessage = `放置: ${placedItem.name}`;
            feedbackColor = 0xDEB887;
        }
        
        // 放置物品到料理台
        counterData.items.push(placedItem);
        this.showInteractionFeedback(feedbackMessage, feedbackColor);
        this.carryingItem = null;
        
        // 检查是否可以组装菜品（只有已处理的食材才能参与组装）
        this.checkCounterRecipeCompletion(counter.id, counterData);
    }

    // 检查料理台上是否可以完成菜品
    checkCounterRecipeCompletion(counterId, counterData) {
        const currentIngredients = counterData.items
            .filter(item => item.type === 'prepared_ingredient')
            .map(item => item.originalId)
            .sort();

        if (currentIngredients.length === 0) return;

        // 检查所有菜品配方
        const recipes = window.gameData.recipes;
        for (const [recipeId, recipe] of Object.entries(recipes)) {
            const requiredIngredients = [...recipe.ingredients].sort();
            
            // 检查食材是否完全匹配
            if (this.arraysEqual(currentIngredients, requiredIngredients)) {
                // 找到匹配的配方，制作菜品
                this.createDishOnCounter(counterId, counterData, recipeId, recipe);
                return;
            }
        }

        // 显示当前食材状态
        const ingredientNames = counterData.items
            .filter(item => item.type === 'prepared_ingredient')
            .map(item => item.originalName || item.name);
        
        if (ingredientNames.length > 0) {
            this.showInteractionFeedback(`当前食材: ${ingredientNames.join(', ')}`, 0x87CEEB);
        }
    }

    // 在料理台上制作菜品
    createDishOnCounter(counterId, counterData, recipeId, recipe) {
        // 清除料理台上的食材
        counterData.items = counterData.items.filter(item => item.type !== 'prepared_ingredient');
        
        // 创建完成的菜品
        const finishedDish = {
            name: recipe.name,
            type: 'finished_dish',
            recipeId: recipeId,
            baseScore: recipe.baseScore,
            difficulty: recipe.difficulty
        };

        // 将菜品放到料理台上
        counterData.items.push(finishedDish);
        
        this.showInteractionFeedback(`制作完成: ${recipe.name}!`, 0xFFD700);
        console.log(`在料理台 ${counterId} 成功制作菜品: ${recipe.name}`);
    }

    interactWithServingArea() {
        if (!this.carryingItem || this.carryingItem.type !== 'finished_dish') {
            console.log('需要完成的菜品才能上菜');
            this.showInteractionFeedback('需要完成的菜品', 0xFF6347);
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