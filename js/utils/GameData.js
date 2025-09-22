// 游戏数据管理类
class GameData {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        // 游戏配置
        this.config = {
            gameWidth: 800,
            gameHeight: 600,
            gameTime: 180, // 3分钟 = 180秒
            gridSize: 40, // 网格大小
            gridWidth: 20, // 网格宽度 (800/40)
            gridHeight: 15, // 网格高度 (600/40)
            difficulties: {
                easy: {
                    orderFrequency: 15000, // 15秒一个订单
                    maxOrders: 3,
                    complexityWeight: 0.3 // 30%复杂菜品
                },
                medium: {
                    orderFrequency: 12000, // 12秒一个订单
                    maxOrders: 4,
                    complexityWeight: 0.5 // 50%复杂菜品
                },
                hard: {
                    orderFrequency: 8000, // 8秒一个订单
                    maxOrders: 5,
                    complexityWeight: 0.7 // 70%复杂菜品
                }
            }
        };

        // 食材数据（基于西贝菜品设计）
        this.ingredients = {
            // 肉类 - 解冻时间长
            'lamb_chop': { name: '羊排', emoji: '🐑', defrostTime: 10000, category: 'meat' },
            'beef_ribs': { name: '牛肋排', emoji: '🥩', defrostTime: 12000, category: 'meat' },
            'pork_belly': { name: '五花肉', emoji: '🥓', defrostTime: 8000, category: 'meat' },
            'chicken_breast': { name: '鸡胸肉', emoji: '🐔', defrostTime: 6000, category: 'meat' },
            
            // 蔬菜类 - 解冻时间短
            'cabbage': { name: '白菜', emoji: '🥬', defrostTime: 2000, category: 'vegetable' },
            'potato': { name: '土豆', emoji: '🥔', defrostTime: 3000, category: 'vegetable' },
            'mushroom': { name: '蘑菇', emoji: '🍄', defrostTime: 2500, category: 'vegetable' },
            'onion': { name: '洋葱', emoji: '🧅', defrostTime: 2000, category: 'vegetable' },
            'carrot': { name: '胡萝卜', emoji: '🥕', defrostTime: 3000, category: 'vegetable' },
            
            // 半成品 - 中等解冻时间
            'noodles': { name: '面条', emoji: '🍝', defrostTime: 4000, category: 'semi' },
            'dumpling_skin': { name: '饺子皮', emoji: '🥟', defrostTime: 3000, category: 'semi' },
            'rice': { name: '米饭', emoji: '🍚', defrostTime: 5000, category: 'semi' },
            'sauce': { name: '调料包', emoji: '🧂', defrostTime: 1000, category: 'semi' },
            'cheese': { name: '奶酪', emoji: '🧀', defrostTime: 2000, category: 'semi' }
        };

        // 菜品配方（基于西贝菜品）
        this.recipes = {
            // 简单菜品 (1-2种配料)
            'lamb_noodles': {
                name: '羊肉面',
                ingredients: ['lamb_chop', 'noodles'],
                difficulty: 1,
                baseScore: 100,
                timeLimit: 45000 // 45秒完成
            },
            'potato_beef': {
                name: '土豆炖牛肉',
                ingredients: ['beef_ribs', 'potato'],
                difficulty: 1,
                baseScore: 120,
                timeLimit: 50000
            },
            'mushroom_chicken': {
                name: '蘑菇鸡肉',
                ingredients: ['chicken_breast', 'mushroom'],
                difficulty: 1,
                baseScore: 110,
                timeLimit: 40000
            },
            
            // 中等菜品 (2-3种配料)
            'mixed_vegetables': {
                name: '什锦蔬菜',
                ingredients: ['cabbage', 'carrot', 'mushroom'],
                difficulty: 2,
                baseScore: 150,
                timeLimit: 60000
            },
            'pork_rice_bowl': {
                name: '五花肉盖饭',
                ingredients: ['pork_belly', 'rice', 'onion'],
                difficulty: 2,
                baseScore: 180,
                timeLimit: 55000
            },
            'cheese_chicken': {
                name: '芝士鸡肉',
                ingredients: ['chicken_breast', 'cheese', 'sauce'],
                difficulty: 2,
                baseScore: 160,
                timeLimit: 50000
            },
            
            // 复杂菜品 (3-5种配料)
            'deluxe_noodles': {
                name: '豪华面条',
                ingredients: ['lamb_chop', 'noodles', 'mushroom', 'onion'],
                difficulty: 3,
                baseScore: 250,
                timeLimit: 75000
            },
            'supreme_stew': {
                name: '至尊炖菜',
                ingredients: ['beef_ribs', 'potato', 'carrot', 'cabbage', 'sauce'],
                difficulty: 3,
                baseScore: 300,
                timeLimit: 90000
            },
            'master_combo': {
                name: '大师套餐',
                ingredients: ['pork_belly', 'rice', 'mushroom', 'cheese'],
                difficulty: 3,
                baseScore: 280,
                timeLimit: 80000
            }
        };

        // 厨房布局配置 - 回字形设计
        this.kitchenLayout = {
            // 外圈通道区域 (厨师可行走)
            outerWalkway: { gridX: 1, gridY: 1, gridWidth: 18, gridHeight: 13 },
            // 内圈通道区域 (厨师可行走)  
            innerWalkway: { gridX: 6, gridY: 6, gridWidth: 8, gridHeight: 3 },
            
            playerStart: { gridX: 10, gridY: 7 }, // 内圈通道中央
            
            // 回字形工作台布局 - 外圈
            workstations: [
                // === 外圈上方 ===
                { gridX: 2, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '羊排', ingredientId: 'lamb_chop', id: 'storage_lamb_chop' },
                { gridX: 4, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '牛肋排', ingredientId: 'beef_ribs', id: 'storage_beef_ribs' },
                { gridX: 6, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '五花肉', ingredientId: 'pork_belly', id: 'storage_pork_belly' },
                { gridX: 8, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '鸡胸肉', ingredientId: 'chicken_breast', id: 'storage_chicken_breast' },
                { gridX: 10, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '白菜', ingredientId: 'cabbage', id: 'storage_cabbage' },
                { gridX: 12, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '土豆', ingredientId: 'potato', id: 'storage_potato' },
                { gridX: 14, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '蘑菇', ingredientId: 'mushroom', id: 'storage_mushroom' },
                { gridX: 16, gridY: 2, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '洋葱', ingredientId: 'onion', id: 'storage_onion' },
                
                // === 外圈右侧 ===
                { gridX: 17, gridY: 4, gridWidth: 2, gridHeight: 1, type: 'microwave', name: '微波炉1', id: 'microwave1' },
                { gridX: 17, gridY: 6, gridWidth: 2, gridHeight: 1, type: 'microwave', name: '微波炉2', id: 'microwave2' },
                { gridX: 17, gridY: 8, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_right1' },
                { gridX: 17, gridY: 10, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_right2' },
                
                // === 外圈下方 ===
                { gridX: 16, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'serving', name: '上菜区', id: 'serving' },
                { gridX: 14, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_bottom1' },
                { gridX: 12, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_bottom2' },
                { gridX: 10, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_bottom3' },
                { gridX: 8, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_bottom4' },
                { gridX: 6, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '米饭', ingredientId: 'rice', id: 'storage_rice' },
                { gridX: 4, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '面条', ingredientId: 'noodles', id: 'storage_noodles' },
                { gridX: 2, gridY: 12, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '胡萝卜', ingredientId: 'carrot', id: 'storage_carrot' },
                
                // === 外圈左侧 ===
                { gridX: 1, gridY: 10, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '调料包', ingredientId: 'sauce', id: 'storage_sauce' },
                { gridX: 1, gridY: 8, gridWidth: 2, gridHeight: 1, type: 'ingredient_storage', name: '奶酪', ingredientId: 'cheese', id: 'storage_cheese' },
                { gridX: 1, gridY: 6, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_left1' },
                { gridX: 1, gridY: 4, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_left2' },
                
                // === 内圈工作台 ===
                { gridX: 4, gridY: 5, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner1' },
                { gridX: 6, gridY: 4, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner2' },
                { gridX: 8, gridY: 4, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner3' },
                { gridX: 10, gridY: 4, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner4' },
                { gridX: 12, gridY: 4, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner5' },
                { gridX: 14, gridY: 5, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner6' },
                { gridX: 14, gridY: 7, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner7' },
                { gridX: 12, gridY: 8, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner8' },
                { gridX: 10, gridY: 8, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner9' },
                { gridX: 8, gridY: 8, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner10' },
                { gridX: 6, gridY: 8, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner11' },
                { gridX: 4, gridY: 7, gridWidth: 2, gridHeight: 1, type: 'cooking_counter', name: '料理台', id: 'counter_inner12' }
            ],
            
            // 兼容旧版本的快速访问 (转换为像素坐标)
            microwaves: [
                { x: 16 * 40 + 20, y: 4 * 40 + 20, id: 'microwave1' },
                { x: 16 * 40 + 20, y: 6 * 40 + 20, id: 'microwave2' }
            ],
            workstation: { x: 12 * 40 + 20, y: 12 * 40 + 20, id: 'workstation' },
            servingArea: { x: 8 * 40 + 20, y: 12 * 40 + 20, id: 'serving' }
        };
        
        // 网格转像素坐标的辅助方法
        this.gridToPixel = (gridX, gridY) => {
            return {
                x: gridX * this.config.gridSize + this.config.gridSize / 2,
                y: gridY * this.config.gridSize + this.config.gridSize / 2
            };
        };
        
        // 像素转网格坐标的辅助方法
        this.pixelToGrid = (x, y) => {
            return {
                gridX: Math.floor(x / this.config.gridSize),
                gridY: Math.floor(y / this.config.gridSize)
            };
        };
    }

    // 根据难度获取随机菜品
    getRandomRecipe(difficulty = 'medium') {
        const difficultyConfig = this.config.difficulties[difficulty];
        const recipeKeys = Object.keys(this.recipes);
        
        // 根据复杂度权重选择菜品
        const complexRecipes = recipeKeys.filter(key => this.recipes[key].difficulty >= 2);
        const simpleRecipes = recipeKeys.filter(key => this.recipes[key].difficulty === 1);
        
        const useComplex = Math.random() < difficultyConfig.complexityWeight;
        const selectedRecipes = useComplex ? complexRecipes : simpleRecipes;
        
        if (selectedRecipes.length === 0) {
            return this.recipes[recipeKeys[0]]; // fallback
        }
        
        const randomKey = selectedRecipes[Math.floor(Math.random() * selectedRecipes.length)];
        return { ...this.recipes[randomKey], id: randomKey };
    }

    // 获取食材信息
    getIngredient(ingredientId) {
        return this.ingredients[ingredientId];
    }

    // 获取菜品信息
    getRecipe(recipeId) {
        return this.recipes[recipeId];
    }

    // 保存游戏数据到localStorage
    saveGameData(data) {
        try {
            localStorage.setItem('prepared-cooked-data', JSON.stringify(data));
        } catch (error) {
            console.warn('无法保存游戏数据:', error);
        }
    }

    // 从localStorage加载游戏数据
    loadGameData() {
        try {
            const data = localStorage.getItem('prepared-cooked-data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('无法加载游戏数据:', error);
            return null;
        }
    }

    // 获取最高分
    getHighScore() {
        const data = this.loadGameData();
        return data ? (data.highScore || 0) : 0;
    }

    // 保存最高分
    saveHighScore(score) {
        const data = this.loadGameData() || {};
        if (score > (data.highScore || 0)) {
            data.highScore = score;
            this.saveGameData(data);
            return true; // 新纪录
        }
        return false;
    }
}

// 创建全局游戏数据实例
window.gameData = new GameData();