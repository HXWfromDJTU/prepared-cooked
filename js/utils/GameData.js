// 游戏数据管理类
class GameData {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        // 游戏配置
        this.config = {
            gameWidth: 1024,
            gameHeight: 768,
            gameTime: 180, // 3分钟 = 180秒
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
            'lamb_chop': { name: '羊排', defrostTime: 10000, category: 'meat' },
            'beef_ribs': { name: '牛肋排', defrostTime: 12000, category: 'meat' },
            'pork_belly': { name: '五花肉', defrostTime: 8000, category: 'meat' },
            'chicken_breast': { name: '鸡胸肉', defrostTime: 6000, category: 'meat' },
            
            // 蔬菜类 - 解冻时间短
            'cabbage': { name: '白菜', defrostTime: 2000, category: 'vegetable' },
            'potato': { name: '土豆', defrostTime: 3000, category: 'vegetable' },
            'mushroom': { name: '蘑菇', defrostTime: 2500, category: 'vegetable' },
            'onion': { name: '洋葱', defrostTime: 2000, category: 'vegetable' },
            'carrot': { name: '胡萝卜', defrostTime: 3000, category: 'vegetable' },
            
            // 半成品 - 中等解冻时间
            'noodles': { name: '面条', defrostTime: 4000, category: 'semi' },
            'dumpling_skin': { name: '饺子皮', defrostTime: 3000, category: 'semi' },
            'rice': { name: '米饭', defrostTime: 5000, category: 'semi' },
            'sauce': { name: '调料包', defrostTime: 1000, category: 'semi' },
            'cheese': { name: '奶酪', defrostTime: 2000, category: 'semi' }
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

        // 厨房布局配置
        this.kitchenLayout = {
            microwaves: [
                { x: 200, y: 300, id: 'microwave1' },
                { x: 300, y: 300, id: 'microwave2' }
            ],
            storage: { x: 100, y: 200, id: 'storage' },
            workstation: { x: 500, y: 300, id: 'workstation' },
            servingArea: { x: 700, y: 200, id: 'serving' },
            washArea: { x: 400, y: 500, id: 'wash' },
            playerStart: { x: 400, y: 400 }
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