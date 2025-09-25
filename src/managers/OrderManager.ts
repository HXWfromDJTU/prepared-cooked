import { MainScene } from '../scenes/MainScene';
import { 
  Order, 
  OrderStatus, 
  DishType, 
  DishRecipe, 
  IngredientType 
} from '../types';

// 菜品配方数据
const DISH_RECIPES: DishRecipe[] = [
  // 简单菜品 (复杂度1-2)
  {
    dishType: DishType.HUANG_MI_LIANGGAO,
    name: '黄米凉糕',
    ingredients: [IngredientType.HUANG_MI_GAOOU, IngredientType.MANGYUE_SAUCE],
    complexity: 1,
    baseTime: 45,
    difficulty: 'simple'
  },
  {
    dishType: DishType.XIAO_MANTOU,
    name: '小馒头',
    ingredients: [IngredientType.MANTOU],
    complexity: 1,
    baseTime: 30,
    difficulty: 'simple'
  },
  {
    dishType: DishType.XIBEI_MIANJIN_DISH,
    name: '西贝面筋',
    ingredients: [IngredientType.XIBEI_MIANJIN, IngredientType.SEASONING_SAUCE],
    complexity: 2,
    baseTime: 50,
    difficulty: 'simple'
  },
  {
    dishType: DishType.FANQIE_NIUROU_FAN,
    name: '番茄牛腩饭',
    ingredients: [IngredientType.FANQIE_NIUROU, IngredientType.RICE],
    complexity: 2,
    baseTime: 55,
    difficulty: 'simple'
  },
  {
    dishType: DishType.ZICAI_DANHUA_TANG,
    name: '紫菜蛋花汤',
    ingredients: [IngredientType.SOUP_PACK],
    complexity: 1,
    baseTime: 35,
    difficulty: 'simple'
  },
  
  // 中等菜品 (复杂度3)
  {
    dishType: DishType.ZHANGYE_KONGXIN_GUAMIAN,
    name: '张爷爷空心挂面',
    ingredients: [IngredientType.NOODLES, IngredientType.TOPPINGS, IngredientType.SIDE_DISHES],
    complexity: 3,
    baseTime: 75,
    difficulty: 'medium'
  },
  {
    dishType: DishType.NIUDAGU_TAOCAN,
    name: '牛大骨套餐',
    ingredients: [IngredientType.BEEF_BONE, IngredientType.YOUMIAN_YUYU, IngredientType.GREEN_VEG],
    complexity: 3,
    baseTime: 80,
    difficulty: 'medium'
  },
  {
    dishType: DishType.HUANGMEN_JI_MIFAN,
    name: '黄焖鸡米饭',
    ingredients: [IngredientType.BRAISED_CHICKEN, IngredientType.RICE, IngredientType.GREEN_VEG],
    complexity: 3,
    baseTime: 70,
    difficulty: 'medium'
  }
];

export class OrderManager {
  private scene: MainScene;
  private orders: Order[] = [];
  private maxOrders = 4; // 最大订单数量
  private orderIdCounter = 0;
  private lastOrderTime = 0;
  private orderGenerationInterval = 8000; // 8秒生成一个新订单
  
  // 订单时间调节因子
  private difficultyMultiplier = 1.0; // 难度乘数，随游戏进行调整
  private timeMultiplier = 1000; // 将秒转为毫秒

  constructor(scene: MainScene) {
    this.scene = scene;
    this.initializeOrderGeneration();
  }

  // 分析订单的制作进度
  private analyzeOrderProgress(order: Order): {
    requiredIngredients: IngredientType[];
    availableIngredients: IngredientType[];
    missingIngredients: IngredientType[];
    hasPlate: boolean;
    isReadyToCombine: boolean;
    progressText: string;
  } {
    const recipe = this.getRecipeByType(order.dishType);
    if (!recipe) {
      return {
        requiredIngredients: [],
        availableIngredients: [],
        missingIngredients: [],
        hasPlate: false,
        isReadyToCombine: false,
        progressText: '配方未找到'
      };
    }

    const requiredIngredients = [...recipe.ingredients];
    const allItems = this.scene.getItemManager().getAllItems();
    
    // 检查桌面上的盘子
    const availablePlates = allItems.filter(item => 
      item.type === 'plate' && 
      (item.location === 'on_desk' || item.location === 'held_by_player')
    );

    // 检查可用的解冻食材
    const availableIngredients = allItems.filter(item => 
      item.type === 'ingredient' && 
      item.state === 'thawed' &&
      (item.location === 'on_desk' || item.location === 'held_by_player') &&
      requiredIngredients.includes(item.ingredientType!)
    ).map(item => item.ingredientType!);

    // 找出缺少的食材
    const missingIngredients = requiredIngredients.filter(required => {
      const availableCount = availableIngredients.filter(available => available === required).length;
      const requiredCount = requiredIngredients.filter(req => req === required).length;
      return availableCount < requiredCount;
    });

    const hasPlate = availablePlates.length > 0;
    const isReadyToCombine = hasPlate && missingIngredients.length === 0;

    let progressText = '';
    if (isReadyToCombine) {
      progressText = '✅ 可以制作!';
    } else if (!hasPlate) {
      progressText = '🍽️ 需要盘子';
    } else if (missingIngredients.length > 0) {
      const missingNames = missingIngredients.map(ing => this.getIngredientName(ing));
      progressText = `❌ 缺少: ${missingNames.join(', ')}`;
    }

    return {
      requiredIngredients,
      availableIngredients,
      missingIngredients,
      hasPlate,
      isReadyToCombine,
      progressText
    };
  }

  private initializeOrderGeneration(): void {
    // 游戏开始时生成第一个订单
    this.scene.time.delayedCall(2000, () => {
      this.generateRandomOrder();
    });
  }

  update(time: number): void {
    // 更新所有订单的剩余时间
    this.orders.forEach(order => {
      if (order.status === OrderStatus.WAITING) {
        order.remainingTime = Math.max(0, order.totalTime - (time - order.createdAt));
        
        // 检查订单是否超时
        if (order.remainingTime <= 0) {
          order.status = OrderStatus.EXPIRED;
          this.onOrderExpired(order);
        }
      }
    });

    // 超时订单不移除，保持在队列中显示为灰色
    // （根据需求：超时订单保留在原位置，只标记状态）

    // 生成新订单（只计算等待状态的订单数量）
    const waitingOrders = this.orders.filter(order => order.status === OrderStatus.WAITING);
    if (time - this.lastOrderTime > this.orderGenerationInterval && 
        waitingOrders.length < this.maxOrders) {
      this.generateRandomOrder();
      this.lastOrderTime = time;
    }

    // 更新UI
    this.updateOrderQueueUI();
  }

  private generateRandomOrder(): void {
    // 根据游戏进行时间调整难度
    const gameTime = this.scene.time.now;
    const difficultyLevel = Math.floor(gameTime / 60000); // 每分钟增加难度

    // 选择合适的菜品（早期游戏偏向简单菜品）
    let availableRecipes = DISH_RECIPES;
    if (difficultyLevel < 1) {
      availableRecipes = DISH_RECIPES.filter(recipe => recipe.difficulty === 'simple');
    } else if (difficultyLevel < 3) {
      availableRecipes = DISH_RECIPES.filter(recipe => 
        recipe.difficulty === 'simple' || recipe.difficulty === 'medium'
      );
    }

    const recipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
    
    // 计算订单时间（基础时间 + 复杂度加成 + 难度调节）
    const timeMultiplier = Math.max(0.6, 1.2 - (difficultyLevel * 0.1)); // 随时间降低时间限制
    const totalTime = recipe.baseTime * timeMultiplier * this.timeMultiplier;

    const order: Order = {
      id: `order_${++this.orderIdCounter}`,
      dishType: recipe.dishType,
      dishName: recipe.name,
      status: OrderStatus.WAITING,
      totalTime,
      remainingTime: totalTime,
      createdAt: this.scene.time.now,
      baseScore: recipe.complexity * 100 // 基础分数基于复杂度
    };

    // 新订单插入到队列最前面（最左边）
    this.orders.unshift(order);
    console.log(`🆕 新订单生成: ${order.dishName} (${Math.round(totalTime/1000)}秒)`);
    
    // 触发新订单音效或动画
    this.onNewOrder(order);
  }

  private onNewOrder(order: Order): void {
    // 可以在这里添加音效播放
    // this.scene.sound.play('newOrder');
    
    // 在控制台显示新订单信息
    const recipe = this.getRecipeByType(order.dishType);
    if (recipe) {
      console.log(`📝 订单详情: ${recipe.ingredients.map(ing => this.getIngredientName(ing)).join(' + ')}`);
    }
  }

  private onOrderExpired(order: Order): void {
    console.log(`⏰ 订单超时: ${order.dishName}`);
    // 扣除分数或增加惩罚
    this.scene.updateScore(-50); // 扣除50分
    
    // 可以在这里添加失败音效
    // this.scene.sound.play('orderExpired');
  }

  // 完成订单
  completeOrder(dishType: DishType): boolean {
    const orderIndex = this.orders.findIndex(
      order => order.dishType === dishType && order.status === OrderStatus.WAITING
    );

    if (orderIndex === -1) {
      return false; // 没有匹配的订单
    }

    const order = this.orders[orderIndex];
    const timeBonusRatio = order.remainingTime / order.totalTime;
    const timeBonus = Math.floor(timeBonusRatio * 50); // 最多50分时间奖励
    const totalScore = order.baseScore + timeBonus;

    // 增加分数
    this.scene.updateScore(totalScore);

    // 移除完成的订单
    this.orders.splice(orderIndex, 1);

    console.log(`✅ 订单完成: ${order.dishName} (+${totalScore}分)`);
    console.log(`⏱️  剩余时间: ${Math.round(order.remainingTime/1000)}秒 (+${timeBonus}分时间奖励)`);

    return true;
  }

  // 检查是否有匹配的订单
  hasMatchingOrder(dishType: DishType): boolean {
    return this.orders.some(order => 
      order.dishType === dishType && order.status === OrderStatus.WAITING
    );
  }

  // 获取订单配方
  getRecipeByType(dishType: DishType): DishRecipe | undefined {
    return DISH_RECIPES.find(recipe => recipe.dishType === dishType);
  }

  // 获取食材中文名
  private getIngredientName(ingredientType: IngredientType): string {
    const ingredientNames = {
      [IngredientType.HUANG_MI_GAOOU]: '黄米糕坯',
      [IngredientType.MANTOU]: '小馒头',
      [IngredientType.XIBEI_MIANJIN]: '西贝面筋',
      [IngredientType.FANQIE_NIUROU]: '番茄牛腩',
      [IngredientType.RICE]: '米饭',
      [IngredientType.MANGYUE_SAUCE]: '蔓越莓酱',
      [IngredientType.SEASONING_SAUCE]: '调味汁',
      [IngredientType.SOUP_PACK]: '汤包',
      [IngredientType.NOODLES]: '挂面',
      [IngredientType.TOPPINGS]: '浇头',
      [IngredientType.SIDE_DISHES]: '小菜',
      [IngredientType.BEEF_BONE]: '牛大骨',
      [IngredientType.YOUMIAN_YUYU]: '莜面鱼鱼',
      [IngredientType.GREEN_VEG]: '青菜',
      [IngredientType.BRAISED_CHICKEN]: '黄焖鸡'
    };
    return ingredientNames[ingredientType] || ingredientType;
  }

  // 更新订单队列UI（优化版本，避免重复创建DOM元素）
  private updateOrderQueueUI(): void {
    const orderQueue = document.getElementById('order-queue');
    const queueCount = document.getElementById('queue-count');
    
    if (!orderQueue || !queueCount) return;

    // 更新队列数量（显示等待订单数量/总订单数量）
    const waitingCount = this.orders.filter(order => order.status === OrderStatus.WAITING).length;
    queueCount.textContent = `${waitingCount}/${this.orders.length}`;

    // 获取现有的订单卡片
    const existingCards = Array.from(orderQueue.querySelectorAll('.order-card'));
    const existingCardIds = existingCards.map(card => card.id);

    // 处理每个订单
    this.orders.forEach((order, index) => {
      const cardId = `order-${order.id}`;
      let orderCard = document.getElementById(cardId) as HTMLElement;

      // 如果卡片不存在，创建新卡片
      if (!orderCard) {
        orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.id = cardId;
        
        // 新订单插入到最前面
        if (orderQueue.firstChild) {
          orderQueue.insertBefore(orderCard, orderQueue.firstChild);
        } else {
          orderQueue.appendChild(orderCard);
        }
        
        // 新订单动画
        orderCard.classList.add('new-order');
        setTimeout(() => orderCard.classList.remove('new-order'), 500);
      }

      // 更新卡片位置（确保新订单在最前面）
      const currentPosition = Array.from(orderQueue.children).indexOf(orderCard);
      if (currentPosition !== index) {
        if (index === 0) {
          orderQueue.insertBefore(orderCard, orderQueue.firstChild);
        } else {
          const targetElement = orderQueue.children[index];
          if (targetElement) {
            orderQueue.insertBefore(orderCard, targetElement);
          }
        }
      }

      // 更新卡片样式和内容
      this.updateOrderCard(orderCard, order);
    });

    // 移除不再存在的订单卡片
    existingCards.forEach(card => {
      if (!this.orders.some(order => `order-${order.id}` === card.id)) {
        card.remove();
      }
    });
  }

  // 更新单个订单卡片
  private updateOrderCard(orderCard: HTMLElement, order: Order): void {
    // 重置所有状态类
    orderCard.className = 'order-card';

    // 超时订单标记为灰色
    if (order.status === OrderStatus.EXPIRED) {
      orderCard.classList.add('expired');
    } else {
      // 紧急订单标记
      const urgentThreshold = 0.25; // 剩余时间少于25%时标记为紧急
      if (order.remainingTime / order.totalTime < urgentThreshold) {
        orderCard.classList.add('urgent');
      }
    }

    // 计算剩余时间和进度
    let remainingSeconds: number;
    let progressPercent: number;
    let progressClass: string;
    
    if (order.status === OrderStatus.EXPIRED) {
      // 超时订单显示为0秒，进度条为灰色
      remainingSeconds = 0;
      progressPercent = 0;
      progressClass = 'expired';
    } else {
      remainingSeconds = Math.ceil(order.remainingTime / 1000);
      progressPercent = (order.remainingTime / order.totalTime) * 100;
      
      // 进度条颜色
      progressClass = 'good';
      if (progressPercent < 25) {
        progressClass = 'critical';
      } else if (progressPercent < 50) {
        progressClass = 'warning';
      }
    }

    const timerText = order.status === OrderStatus.EXPIRED ? '已超时' : `${remainingSeconds}s`;
    
    // 获取菜品配方信息（简单显示）
    const recipe = this.getRecipeByType(order.dishType);
    let ingredientsHtml = '';
    if (recipe) {
      const ingredientNames = recipe.ingredients.map(ing => this.getIngredientName(ing));
      ingredientsHtml = `
        <div class="order-ingredients">
          <div class="ingredients-label">需要:</div>
          <div class="ingredients-list">${ingredientNames.join(' + ')}</div>
        </div>
      `;
    }
    
    orderCard.innerHTML = `
      <div class="order-dish-name">${order.dishName}</div>
      ${ingredientsHtml}
      <div class="order-timer">${timerText}</div>
      <div class="order-progress">
        <div class="order-progress-bar ${progressClass}" 
             style="width: ${progressPercent}%"></div>
      </div>
    `;
  }

  // 获取当前订单列表（用于调试）
  getCurrentOrders(): Order[] {
    return [...this.orders];
  }

  // 设置难度（用于游戏平衡调节）
  setDifficulty(multiplier: number): void {
    this.difficultyMultiplier = multiplier;
  }
}