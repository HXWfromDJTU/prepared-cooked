// 食材系统类
class Food {
    constructor(scene) {
        this.scene = scene;
        this.ingredients = new Map(); // 存储所有食材实例
        this.recipes = new Map(); // 存储所有菜品配方
        
        this.init();
    }

    init() {
        // 初始化食材数据
        this.loadIngredients();
        this.loadRecipes();
    }

    loadIngredients() {
        // 从游戏数据加载食材
        Object.entries(gameData.ingredients).forEach(([id, data]) => {
            this.ingredients.set(id, {
                id: id,
                ...data,
                instances: [] // 存储该食材的所有实例
            });
        });
    }

    loadRecipes() {
        // 从游戏数据加载菜品配方
        Object.entries(gameData.recipes).forEach(([id, data]) => {
            this.recipes.set(id, {
                id: id,
                ...data
            });
        });
    }

    // 创建食材实例
    createIngredient(ingredientId, x, y) {
        const ingredientData = this.ingredients.get(ingredientId);
        if (!ingredientData) {
            console.error(`未找到食材: ${ingredientId}`);
            return null;
        }

        const ingredient = new IngredientInstance(this.scene, x, y, ingredientData);
        ingredientData.instances.push(ingredient);
        
        return ingredient;
    }

    // 获取食材信息
    getIngredientData(ingredientId) {
        return this.ingredients.get(ingredientId);
    }

    // 获取菜品配方
    getRecipe(recipeId) {
        return this.recipes.get(recipeId);
    }

    // 检查是否可以制作某个菜品
    canMakeRecipe(recipeId, availableIngredients) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;

        return recipe.ingredients.every(requiredId => 
            availableIngredients.some(ingredient => 
                ingredient.id === requiredId && ingredient.type === 'defrosted_ingredient'
            )
        );
    }

    // 根据可用食材推荐菜品
    suggestRecipes(availableIngredients) {
        const suggestions = [];
        
        this.recipes.forEach(recipe => {
            if (this.canMakeRecipe(recipe.id, availableIngredients)) {
                suggestions.push(recipe);
            }
        });

        return suggestions.sort((a, b) => b.baseScore - a.baseScore); // 按分数排序
    }

    // 获取食材的解冻时间
    getDefrostTime(ingredientId) {
        const ingredient = this.ingredients.get(ingredientId);
        return ingredient ? ingredient.defrostTime : 0;
    }

    // 获取食材的类别
    getIngredientCategory(ingredientId) {
        const ingredient = this.ingredients.get(ingredientId);
        return ingredient ? ingredient.category : 'unknown';
    }

    // 清理所有食材实例
    cleanup() {
        this.ingredients.forEach(ingredientData => {
            ingredientData.instances.forEach(instance => {
                if (instance.sprite) {
                    instance.sprite.destroy();
                }
            });
            ingredientData.instances = [];
        });
    }
}

// 食材实例类
class IngredientInstance {
    constructor(scene, x, y, ingredientData) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.ingredientData = ingredientData;
        this.state = 'raw'; // raw, defrosting, defrosted
        this.defrostProgress = 0;
        this.defrostTimer = null;
        
        this.create();
    }

    create() {
        // 根据食材类别选择颜色
        let color;
        switch (this.ingredientData.category) {
            case 'meat':
                color = 0x8B4513; // 棕色
                break;
            case 'vegetable':
                color = 0x90EE90; // 浅绿色
                break;
            case 'semi':
                color = 0xDEB887; // 浅棕色
                break;
            default:
                color = 0xFFFFFF; // 白色
        }

        // 创建食材精灵
        this.sprite = this.scene.add.circle(this.x, this.y, 15, color);
        this.sprite.setStrokeStyle(2, 0x000000);

        // 添加食材名称
        this.nameText = this.scene.add.text(this.x, this.y - 25, this.ingredientData.name, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);

        // 状态指示器
        this.stateText = this.scene.add.text(this.x, this.y + 25, this.getStateText(), {
            fontSize: '8px',
            fontFamily: 'Courier New',
            color: '#D2691E'
        }).setOrigin(0.5);
    }

    getStateText() {
        switch (this.state) {
            case 'raw':
                return '生食材';
            case 'defrosting':
                return `解冻中 ${Math.round(this.defrostProgress * 100)}%`;
            case 'defrosted':
                return '已解冻';
            default:
                return '';
        }
    }

    // 开始解冻
    startDefrosting() {
        if (this.state !== 'raw') return false;

        this.state = 'defrosting';
        this.defrostProgress = 0;

        // 创建解冻计时器
        this.defrostTimer = this.scene.time.addEvent({
            delay: 100, // 每100ms更新一次进度
            callback: this.updateDefrostProgress,
            callbackScope: this,
            repeat: this.ingredientData.defrostTime / 100 - 1
        });

        return true;
    }

    updateDefrostProgress() {
        this.defrostProgress += 100 / this.ingredientData.defrostTime;
        
        if (this.defrostProgress >= 1) {
            this.completeDefrosting();
        } else {
            this.updateStateDisplay();
        }
    }

    completeDefrosting() {
        this.state = 'defrosted';
        this.defrostProgress = 1;
        
        // 改变外观表示解冻完成
        this.sprite.setFillStyle(0xFFD700); // 金色表示完成
        
        this.updateStateDisplay();
        
        // 播放完成效果
        this.showDefrostCompleteEffect();
    }

    showDefrostCompleteEffect() {
        // 闪烁效果
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 200,
            yoyo: true,
            repeat: 2
        });

        // 完成文字提示
        const completeText = this.scene.add.text(this.x, this.y - 40, '解冻完成!', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: completeText,
            y: completeText.y - 20,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                completeText.destroy();
            }
        });
    }

    updateStateDisplay() {
        if (this.stateText) {
            this.stateText.setText(this.getStateText());
        }
    }

    // 获取食材数据
    getData() {
        return {
            id: this.ingredientData.id,
            name: this.ingredientData.name,
            category: this.ingredientData.category,
            state: this.state,
            defrostProgress: this.defrostProgress,
            type: this.state === 'defrosted' ? 'defrosted_ingredient' : 'raw_ingredient'
        };
    }

    // 移动食材
    moveTo(x, y) {
        this.x = x;
        this.y = y;
        
        if (this.sprite) {
            this.sprite.setPosition(x, y);
        }
        if (this.nameText) {
            this.nameText.setPosition(x, y - 25);
        }
        if (this.stateText) {
            this.stateText.setPosition(x, y + 25);
        }
    }

    // 销毁食材实例
    destroy() {
        if (this.defrostTimer) {
            this.defrostTimer.destroy();
        }
        
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.nameText) {
            this.nameText.destroy();
        }
        if (this.stateText) {
            this.stateText.destroy();
        }
    }

    // 更新（每帧调用）
    update() {
        // 这里可以添加需要每帧更新的逻辑
        if (this.state === 'defrosting') {
            this.updateStateDisplay();
        }
    }
}