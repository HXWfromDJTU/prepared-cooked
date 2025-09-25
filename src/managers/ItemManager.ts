import { Item, ItemType, ItemState, ItemLocation, IngredientType, Position, DishType } from '../types';

export class ItemManager {
  private scene: Phaser.Scene;
  private items: Map<string, Item> = new Map();
  private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private nextItemId: number = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 创建食材
  public createIngredient(ingredientType: IngredientType, location: ItemLocation, gridPosition?: Position): Item {
    const item: Item = {
      id: `item_${this.nextItemId++}`,
      type: ItemType.INGREDIENT,
      ingredientType,
      state: ItemState.FROZEN,
      location,
      gridPosition,
      thawProgress: 0
    };

    this.items.set(item.id, item);
    this.createItemSprite(item);
    return item;
  }

  // 创建碟子
  public createPlate(location: ItemLocation, gridPosition?: Position): Item {
    const item: Item = {
      id: `item_${this.nextItemId++}`,
      type: ItemType.PLATE,
      state: ItemState.READY,
      location,
      gridPosition
    };

    this.items.set(item.id, item);
    this.createItemSprite(item);
    return item;
  }

  // 获取物品
  public getItem(itemId: string): Item | undefined {
    return this.items.get(itemId);
  }

  // 移动物品到新位置
  public moveItem(itemId: string, newLocation: ItemLocation, newGridPosition?: Position): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    // 更新物品位置
    item.location = newLocation;
    item.gridPosition = newGridPosition;

    // 更新精灵位置
    this.updateItemSpritePosition(item);
    return true;
  }

  // 开始解冻
  public startThawing(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || item.type !== ItemType.INGREDIENT || item.state !== ItemState.FROZEN) {
      return false;
    }

    item.state = ItemState.THAWING;
    item.thawStartTime = this.scene.time.now;
    item.thawProgress = 0;

    console.log(`开始解冻 ${this.getIngredientName(item.ingredientType!)}`);
    return true;
  }

  // 更新解冻进度（只有在微波炉中的食材才能继续解冻）
  public updateThawing(): void {
    const thawDuration = 5000; // 5秒解冻时间

    this.items.forEach(item => {
      // 重要修复：只有在微波炉中的解冻食材才能继续解冻进度
      if (item.state === ItemState.THAWING && 
          item.location === ItemLocation.IN_MICROWAVE && 
          item.thawStartTime) {
        
        const elapsed = this.scene.time.now - item.thawStartTime;
        item.thawProgress = Math.min(elapsed / thawDuration, 1);

        if (item.thawProgress >= 1) {
          item.state = ItemState.THAWED;
          console.log(`${this.getIngredientName(item.ingredientType!)} 解冻完成`);
        }

        // 更新精灵显示
        this.updateItemSprite(item);
      }
      // 不在微波炉中的解冻食材保持当前解冻进度，不再继续解冻
    });
  }

  // 移除物品
  public removeItem(itemId: string): void {
    const item = this.items.get(itemId);
    if (item) {
      // 移除精灵
      const sprite = this.itemSprites.get(itemId);
      if (sprite) {
        sprite.destroy();
        this.itemSprites.delete(itemId);
      }
      
      // 移除物品
      this.items.delete(itemId);
    }
  }

  // 创建物品精灵
  private createItemSprite(item: Item): void {
    const container = this.scene.add.container(0, 0);
    
    // 根据物品类型创建不同的视觉表现
    let color: number;
    let size: number = 20;

    switch (item.type) {
      case ItemType.INGREDIENT:
        color = this.getIngredientColor(item.ingredientType!);
        break;
      case ItemType.PLATE:
        color = 0xffffff; // 白色碟子
        size = 25;
        break;
      case ItemType.DISH:
        color = this.getIngredientColor(item.ingredientType!);
        size = 28; // 菜品稍大
        break;
      default:
        color = 0x888888;
    }

    // 创建物品的圆形表示
    const circle = this.scene.add.circle(0, 0, size / 2, color);
    circle.setStrokeStyle(2, 0x333333);
    container.add(circle);

    // 添加状态指示器
    if (item.type === ItemType.INGREDIENT) {
      const stateIndicator = this.scene.add.circle(size / 2 - 3, -size / 2 + 3, 3, this.getStateColor(item.state));
      container.add(stateIndicator);
    } else if (item.type === ItemType.DISH) {
      // 菜品添加白色碟子边框
      const plateBase = this.scene.add.circle(0, 0, size / 2 + 2, 0xffffff);
      plateBase.setStrokeStyle(2, 0x333333);
      container.addAt(plateBase, 0); // 放在底层
      
      // 添加完成状态指示器
      const readyIndicator = this.scene.add.circle(size / 2 - 3, -size / 2 + 3, 3, 0x00FF00); // 绿色表示完成
      container.add(readyIndicator);
    }

    this.itemSprites.set(item.id, container);
    this.updateItemSpritePosition(item);
  }

  // 更新物品精灵
  private updateItemSprite(item: Item): void {
    const container = this.itemSprites.get(item.id);
    if (!container || container.list.length === 0) return;

    // 更新状态指示器颜色
    if (item.type === ItemType.INGREDIENT && container.list.length > 1) {
      const stateIndicator = container.list[1] as Phaser.GameObjects.Arc;
      stateIndicator.fillColor = this.getStateColor(item.state);
    }
  }

  // 更新物品精灵位置
  private updateItemSpritePosition(item: Item): void {
    const container = this.itemSprites.get(item.id);
    if (!container) return;

    switch (item.location) {
      case ItemLocation.PLAYER_HAND:
        // 物品在玩家手中时，位置会在Player类中处理
        container.setVisible(false); // 暂时隐藏，稍后在Player中显示
        break;
      
      case ItemLocation.ON_DESK:
      case ItemLocation.IN_MICROWAVE:
        if (item.gridPosition) {
          const worldPos = this.gridToWorld(item.gridPosition.x, item.gridPosition.y);
          container.setPosition(worldPos.x, worldPos.y - 10); // 稍微偏上显示
          container.setVisible(true);
        }
        break;

      case ItemLocation.NOWHERE:
        container.setVisible(false);
        break;
    }
  }

  // 网格坐标转世界坐标（暂时使用固定值，后续从MapManager获取）
  private gridToWorld(gridX: number, gridY: number): Position {
    const tileSize = 40;
    return {
      x: gridX * tileSize + tileSize / 2,
      y: gridY * tileSize + tileSize / 2
    };
  }

  // 获取食材颜色
  private getIngredientColor(ingredientType: IngredientType): number {
    switch (ingredientType) {
      case IngredientType.HUANG_MI_GAOOU: return 0xFFD700; // 金色
      case IngredientType.MANTOU: return 0xF5DEB3; // 小麦色
      case IngredientType.XIBEI_MIANJIN: return 0xDEB887; // 淡棕色
      case IngredientType.FANQIE_NIUROU: return 0xFF6347; // 番茄红
      case IngredientType.RICE: return 0xFFFAFA; // 雪白色
      // 新增食材颜色
      case IngredientType.MANGYUE_SAUCE: return 0x8B0000; // 深红色蔓越莓酱
      case IngredientType.SEASONING_SAUCE: return 0x8B4513; // 棕色调味汁
      case IngredientType.SOUP_PACK: return 0x4682B4; // 钢蓝色汤包
      case IngredientType.NOODLES: return 0xF0E68C; // 卡其色挂面
      case IngredientType.TOPPINGS: return 0xD2691E; // 巧克力色浇头
      case IngredientType.SIDE_DISHES: return 0x90EE90; // 淡绿色小菜
      case IngredientType.BEEF_BONE: return 0xA0522D; // 棕黄色牛大骨
      case IngredientType.YOUMIAN_YUYU: return 0xDDA0DD; // 梅花色莜面鱼鱼
      case IngredientType.GREEN_VEG: return 0x32CD32; // 青绿色蔬菜
      case IngredientType.BRAISED_CHICKEN: return 0xCD853F; // 秘鲁棕黄焖鸡
      default: return 0x888888;
    }
  }

  // 获取状态颜色 (严格按照PROJECT_GUIDELINES要求)
  private getStateColor(state: ItemState): number {
    switch (state) {
      case ItemState.FROZEN: return 0x0000FF; // 蓝色
      case ItemState.THAWING: return 0xFFFF00; // 黄色
      case ItemState.THAWED: return 0xFF0000; // 红色
      case ItemState.READY: return 0x00FF00; // 绿色（碟子等）
      default: return 0x888888;
    }
  }

  // 获取食材名称
  private getIngredientName(ingredientType: IngredientType): string {
    switch (ingredientType) {
      case IngredientType.HUANG_MI_GAOOU: return '黄米糕坯';
      case IngredientType.MANTOU: return '小馒头';
      case IngredientType.XIBEI_MIANJIN: return '西贝面筋';
      case IngredientType.FANQIE_NIUROU: return '番茄牛腩';
      case IngredientType.RICE: return '米饭';
      // 新增食材名称
      case IngredientType.MANGYUE_SAUCE: return '蔓越莓酱';
      case IngredientType.SEASONING_SAUCE: return '调味汁';
      case IngredientType.SOUP_PACK: return '汤包';
      case IngredientType.NOODLES: return '挂面';
      case IngredientType.TOPPINGS: return '浇头';
      case IngredientType.SIDE_DISHES: return '小菜';
      case IngredientType.BEEF_BONE: return '牛大骨';
      case IngredientType.YOUMIAN_YUYU: return '莜面鱼鱼';
      case IngredientType.GREEN_VEG: return '青菜';
      case IngredientType.BRAISED_CHICKEN: return '黄焖鸡';
      default: return '未知食材';
    }
  }

  // 获取在特定位置的物品
  public getItemAtPosition(gridX: number, gridY: number): Item | undefined {
    for (const item of this.items.values()) {
      if (item.gridPosition?.x === gridX && item.gridPosition?.y === gridY && 
          (item.location === ItemLocation.ON_DESK || item.location === ItemLocation.IN_MICROWAVE)) {
        return item;
      }
    }
    return undefined;
  }

  // 将物品放入微波炉并开始解冻
  public putInMicrowave(itemId: string, gridPosition: Position): boolean {
    const item = this.items.get(itemId);
    if (!item || item.type !== ItemType.INGREDIENT) return false;

    // 更新物品位置
    item.location = ItemLocation.IN_MICROWAVE;
    item.gridPosition = gridPosition;

    const thawDuration = 5000; // 5秒解冻时间，与updateThawing保持一致

    if (item.state === ItemState.FROZEN) {
      // 全新开始解冻
      item.state = ItemState.THAWING;
      item.thawStartTime = this.scene.time.now;
      item.thawProgress = 0;
      console.log(`将 ${this.getIngredientName(item.ingredientType!)} 放入微波炉开始解冻`);
    } else if (item.state === ItemState.THAWING) {
      // 重要修复：继续之前的解冻进度
      const currentProgress = item.thawProgress || 0;
      // 调整开始时间，使得已有进度能够正确计算
      item.thawStartTime = this.scene.time.now - (currentProgress * thawDuration);
      
      const percentage = Math.floor(currentProgress * 100);
      console.log(`将 ${this.getIngredientName(item.ingredientType!)} 放入微波炉继续解冻 (从${percentage}%继续)`);
    } else if (item.state === ItemState.THAWED) {
      // 已完全解冻的食材
      console.log(`将已解冻的 ${this.getIngredientName(item.ingredientType!)} 放入微波炉`);
    }

    // 更新精灵位置
    this.updateItemSpritePosition(item);
    return true;
  }

  // 从微波炉取出物品
  public takeFromMicrowave(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || item.location !== ItemLocation.IN_MICROWAVE) return false;

    // 生成状态文本，包含解冻进度
    let statusText: string;
    if (item.state === ItemState.THAWED) {
      statusText = '已解冻 100%';
    } else if (item.state === ItemState.THAWING && item.thawProgress !== undefined) {
      const percentage = Math.floor(item.thawProgress * 100);
      statusText = `解冻中 ${percentage}% - 进度已停止`;
    } else {
      statusText = '未解冻';
    }
    
    console.log(`从微波炉取出 ${this.getIngredientName(item.ingredientType!)} (${statusText})`);

    // 更新物品位置为玩家手中（重要：这会导致解冻进度停止）
    item.location = ItemLocation.PLAYER_HAND;
    item.gridPosition = undefined;

    // 更新精灵位置
    this.updateItemSpritePosition(item);
    return true;
  }

  // 获取微波炉中物品的解冻进度文本
  public getMicrowaveProgressText(itemId: string): string {
    const item = this.items.get(itemId);
    if (!item || item.location !== ItemLocation.IN_MICROWAVE) return '';

    if (item.state === ItemState.THAWED) {
      return '解冻完成';
    } else if (item.state === ItemState.THAWING && item.thawProgress !== undefined) {
      const percentage = Math.floor(item.thawProgress * 100);
      return `解冻中 ${percentage}%`;
    } else {
      return '未开始解冻';
    }
  }

  // 渲染微波炉解冻进度UI
  public renderMicrowaveUI(gridX: number, gridY: number): Phaser.GameObjects.Container | null {
    // 查找在此微波炉中的物品
    let microwaveItem: Item | null = null;
    for (const item of this.items.values()) {
      if (item.location === ItemLocation.IN_MICROWAVE && 
          item.gridPosition?.x === gridX && 
          item.gridPosition?.y === gridY) {
        microwaveItem = item;
        break;
      }
    }

    if (!microwaveItem) return null;

    // 创建进度UI容器
    const worldPos = this.gridToWorld(gridX, gridY);
    const container = this.scene.add.container(worldPos.x, worldPos.y);

    // 进度条背景
    const progressBg = this.scene.add.rectangle(0, -25, 30, 6, 0x333333);
    container.add(progressBg);

    // 进度条
    const progress = microwaveItem.thawProgress || 0;
    const progressBar = this.scene.add.rectangle(-15 + (progress * 15), -25, progress * 30, 4, 0xFFD700);
    container.add(progressBar);

    // 进度文字
    const progressText = this.scene.add.text(0, -35, this.getMicrowaveProgressText(microwaveItem.id), {
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(progressText);

    return container;
  }

  // 停止物品解冻（当从微波炉取出时）
  public stopThawing(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || item.state !== ItemState.THAWING) return false;

    // 保持当前解冻进度，但停止继续解冻
    // 物品状态保持为THAWING，但不会继续更新进度
    console.log(`停止解冻 ${this.getIngredientName(item.ingredientType!)} (进度: ${Math.floor((item.thawProgress || 0) * 100)}%)`);
    return true;
  }

  // 将食材添加到盘子上（支持渐进式组合）
  public addIngredientToPlate(plateId: string, ingredientId: string): boolean {
    const plate = this.items.get(plateId);
    const ingredient = this.items.get(ingredientId);
    
    if (!plate || plate.type !== ItemType.PLATE || 
        !ingredient || ingredient.type !== ItemType.INGREDIENT ||
        ingredient.state !== ItemState.THAWED) {
      return false;
    }

    // 初始化盘子的items数组（如果还没有）
    if (!plate.items) {
      plate.items = [];
    }

    // 将食材添加到盘子上
    plate.items.push(ingredient);
    
    // 从独立物品列表中移除食材
    this.removeItem(ingredientId);
    
    console.log(`将 ${this.getIngredientName(ingredient.ingredientType!)} 放入盘子`);
    
    // 检查是否可以自动组成完整菜品
    this.checkAndCreateDishFromPlate(plate);
    
    return true;
  }

  // 检查盘子上的食材是否能组成完整菜品，如果可以则自动转换
  private checkAndCreateDishFromPlate(plate: Item): boolean {
    if (!plate.items || plate.items.length === 0) return false;
    
    const ingredientTypes = plate.items.map(item => item.ingredientType!);
    const dishType = this.getDishTypeFromIngredients(ingredientTypes);
    
    if (dishType) {
      // 转换为完成的菜品
      plate.type = ItemType.DISH;
      plate.dishType = dishType;
      console.log(`自动组装完成：${this.getDishName(dishType)}`);
      return true;
    }
    
    return false;
  }

  // 获取菜品中文名
  private getDishName(dishType: DishType): string {
    const dishNames = {
      [DishType.HUANG_MI_LIANGGAO]: '黄米凉糕',
      [DishType.XIAO_MANTOU]: '小馒头',
      [DishType.XIBEI_MIANJIN_DISH]: '西贝面筋',
      [DishType.FANQIE_NIUROU_FAN]: '番茄牛腩饭',
      [DishType.ZICAI_DANHUA_TANG]: '紫菜蛋花汤',
      [DishType.ZHANGYE_KONGXIN_GUAMIAN]: '张爷爷空心挂面',
      [DishType.NIUDAGU_TAOCAN]: '牛大骨套餐',
      [DishType.HUANGMEN_JI_MIFAN]: '黄焖鸡米饭'
    };
    return dishNames[dishType] || '未知菜品';
  }

  // 创建组合菜品（支持多食材） - 保留原方法用于直接创建
  public createDish(plateId: string, ...ingredientIds: string[]): Item | null {
    const plate = this.items.get(plateId);
    if (!plate || plate.type !== ItemType.PLATE) {
      return null;
    }

    // 验证所有食材都存在且已解冻
    const ingredients: Item[] = [];
    for (const ingredientId of ingredientIds) {
      const ingredient = this.items.get(ingredientId);
      if (!ingredient || 
          ingredient.type !== ItemType.INGREDIENT || 
          ingredient.state !== ItemState.THAWED) {
        return null;
      }
      ingredients.push(ingredient);
    }

    // 根据食材组合确定菜品类型
    const dishType = this.getDishTypeFromIngredients(ingredients.map(i => i.ingredientType!));
    if (!dishType) {
      console.log('无法识别的菜品组合');
      return null;
    }

    // 创建新的菜品
    const dish: Item = {
      id: `dish_${this.nextItemId++}`,
      type: ItemType.DISH,
      dishType: dishType,
      state: ItemState.READY,
      location: ItemLocation.PLAYER_HAND,
      items: [plate, ...ingredients] // 包含碟子和所有食材
    };

    // 移除原有的碟子和食材
    this.removeItem(plateId);
    ingredients.forEach(ingredient => this.removeItem(ingredient.id));

    // 添加新菜品
    this.items.set(dish.id, dish);
    this.createItemSprite(dish);

    console.log(`组装完成：${this.getDishNameByType(dishType)}`);
    return dish;
  }

  // 尝试上菜（包含失败机制）
  public serveItem(itemId: string): { success: boolean; message: string; score: number } {
    const item = this.items.get(itemId);
    if (!item) {
      return { success: false, message: '没有物品可以上菜', score: 0 };
    }

    let result = { success: false, message: '', score: 0 };

    if (item.type === ItemType.DISH && item.state === ItemState.READY) {
      // 成功上菜
      result = {
        success: true,
        message: `成功上菜：${this.getDishName(item.ingredientType!)}`,
        score: 100
      };
    } else if (item.type === ItemType.INGREDIENT) {
      if (item.state === ItemState.FROZEN) {
        result = {
          success: false,
          message: `上菜失败：${this.getIngredientName(item.ingredientType!)} 还是冷冻状态`,
          score: -20
        };
      } else if (item.state === ItemState.THAWING) {
        result = {
          success: false,
          message: `上菜失败：${this.getIngredientName(item.ingredientType!)} 还在解冻中`,
          score: -15
        };
      } else if (item.state === ItemState.THAWED) {
        result = {
          success: false,
          message: `上菜失败：${this.getIngredientName(item.ingredientType!)} 需要装到碟子里`,
          score: -10
        };
      }
    } else if (item.type === ItemType.PLATE) {
      result = {
        success: false,
        message: '上菜失败：空碟子没有食物',
        score: -5
      };
    } else {
      result = {
        success: false,
        message: '上菜失败：未知物品类型',
        score: -10
      };
    }

    // 无论成功失败，都移除物品
    this.removeItem(itemId);
    
    console.log(result.message + (result.score > 0 ? ` (+${result.score}分)` : ` (${result.score}分)`));
    return result;
  }

  // 检查物品是否可以组合
  public canCombineItems(item1Id: string, item2Id: string): boolean {
    const item1 = this.items.get(item1Id);
    const item2 = this.items.get(item2Id);
    
    if (!item1 || !item2) return false;

    // 检查是否是碟子+解冻食材的组合
    return (item1.type === ItemType.PLATE && item2.type === ItemType.INGREDIENT && item2.state === ItemState.THAWED) ||
           (item2.type === ItemType.PLATE && item1.type === ItemType.INGREDIENT && item1.state === ItemState.THAWED);
  }

  // 根据食材组合确定菜品类型
  private getDishTypeFromIngredients(ingredientTypes: IngredientType[]): DishType | null {
    const sortedIngredients = ingredientTypes.sort();
    
    // 简单菜品 (1-2个食材)
    if (this.arraysEqual(sortedIngredients, [IngredientType.HUANG_MI_GAOOU, IngredientType.MANGYUE_SAUCE])) {
      return DishType.HUANG_MI_LIANGGAO;
    }
    if (this.arraysEqual(sortedIngredients, [IngredientType.MANTOU])) {
      return DishType.XIAO_MANTOU;
    }
    if (this.arraysEqual(sortedIngredients, [IngredientType.SEASONING_SAUCE, IngredientType.XIBEI_MIANJIN])) {
      return DishType.XIBEI_MIANJIN_DISH;
    }
    if (this.arraysEqual(sortedIngredients, [IngredientType.FANQIE_NIUROU, IngredientType.RICE])) {
      return DishType.FANQIE_NIUROU_FAN;
    }
    if (this.arraysEqual(sortedIngredients, [IngredientType.SOUP_PACK])) {
      return DishType.ZICAI_DANHUA_TANG;
    }
    
    // 中等菜品 (3个食材)
    if (this.arraysEqual(sortedIngredients, [IngredientType.NOODLES, IngredientType.SIDE_DISHES, IngredientType.TOPPINGS])) {
      return DishType.ZHANGYE_KONGXIN_GUAMIAN;
    }
    if (this.arraysEqual(sortedIngredients, [IngredientType.BEEF_BONE, IngredientType.GREEN_VEG, IngredientType.YOUMIAN_YUYU])) {
      return DishType.NIUDAGU_TAOCAN;
    }
    if (this.arraysEqual(sortedIngredients, [IngredientType.BRAISED_CHICKEN, IngredientType.GREEN_VEG, IngredientType.RICE])) {
      return DishType.HUANGMEN_JI_MIFAN;
    }
    
    return null; // 无法识别的组合
  }

  // 数组比较辅助函数
  private arraysEqual(a: IngredientType[], b: IngredientType[]): boolean {
    return a.length === b.length && a.sort().every((val, index) => val === b.sort()[index]);
  }

  // 根据菜品类型获取菜品名称
  private getDishNameByType(dishType: DishType): string {
    switch (dishType) {
      case DishType.HUANG_MI_LIANGGAO: return '黄米凉糕';
      case DishType.XIAO_MANTOU: return '小馒头';
      case DishType.XIBEI_MIANJIN_DISH: return '西贝面筋';
      case DishType.FANQIE_NIUROU_FAN: return '番茄牛腩饭';
      case DishType.ZICAI_DANHUA_TANG: return '紫菜蛋花汤';
      case DishType.ZHANGYE_KONGXIN_GUAMIAN: return '张爷爷空心挂面';
      case DishType.NIUDAGU_TAOCAN: return '牛大骨套餐';
      case DishType.HUANGMEN_JI_MIFAN: return '黄焖鸡米饭';
      default: return '未知菜品';
    }
  }

  // 获取菜品名称（旧版本兼容）
  private getDishName(ingredientType: IngredientType): string {
    switch (ingredientType) {
      case IngredientType.HUANG_MI_GAOOU: return '黄米凉糕';
      case IngredientType.MANTOU: return '蒸小馒头';
      case IngredientType.XIBEI_MIANJIN: return '炒西贝面筋';
      case IngredientType.FANQIE_NIUROU: return '番茄牛腩盖饭';
      case IngredientType.RICE: return '白米饭';
      default: return '未知菜品';
    }
  }

  // 获取所有物品（用于调试）
  public getAllItems(): Item[] {
    return Array.from(this.items.values());
  }
}