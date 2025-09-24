import { Item, ItemType, ItemState, ItemLocation, IngredientType, Position } from '../types';

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

  // 更新解冻进度
  public updateThawing(): void {
    const thawDuration = 5000; // 5秒解冻时间

    this.items.forEach(item => {
      if (item.state === ItemState.THAWING && item.thawStartTime) {
        const elapsed = this.scene.time.now - item.thawStartTime;
        item.thawProgress = Math.min(elapsed / thawDuration, 1);

        if (item.thawProgress >= 1) {
          item.state = ItemState.THAWED;
          console.log(`${this.getIngredientName(item.ingredientType!)} 解冻完成`);
        }

        // 更新精灵显示
        this.updateItemSprite(item);
      }
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
      default: return 0x888888;
    }
  }

  // 获取状态颜色
  private getStateColor(state: ItemState): number {
    switch (state) {
      case ItemState.FROZEN: return 0x87CEEB; // 天蓝色
      case ItemState.THAWING: return 0xFFD700; // 金色
      case ItemState.THAWED: return 0x32CD32; // 绿色
      case ItemState.READY: return 0x32CD32; // 绿色
      default: return 0x888888;
    }
  }

  // 获取食材名称
  private getIngredientName(ingredientType: IngredientType): string {
    switch (ingredientType) {
      case IngredientType.HUANG_MI_GAOOU: return '黄米凉糕';
      case IngredientType.MANTOU: return '小馒头';
      case IngredientType.XIBEI_MIANJIN: return '西贝面筋';
      case IngredientType.FANQIE_NIUROU: return '番茄牛腩';
      case IngredientType.RICE: return '米饭';
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

    // 如果是冷冻食材，开始解冻
    if (item.state === ItemState.FROZEN) {
      item.state = ItemState.THAWING;
      item.thawStartTime = this.scene.time.now;
      item.thawProgress = 0;
      console.log(`将 ${this.getIngredientName(item.ingredientType!)} 放入微波炉开始解冻`);
    } else {
      console.log(`将 ${this.getIngredientName(item.ingredientType!)} 放入微波炉`);
    }

    // 更新精灵位置
    this.updateItemSpritePosition(item);
    return true;
  }

  // 从微波炉取出物品
  public takeFromMicrowave(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || item.location !== ItemLocation.IN_MICROWAVE) return false;

    const statusText = item.state === ItemState.THAWED ? '已解冻' : 
                      item.state === ItemState.THAWING ? '解冻中' : '未解冻';
    
    console.log(`从微波炉取出 ${this.getIngredientName(item.ingredientType!)} (${statusText})`);

    // 更新物品位置为玩家手中
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

  // 创建组合菜品（碟子+食材）
  public createDish(plateId: string, ingredientId: string): Item | null {
    const plate = this.items.get(plateId);
    const ingredient = this.items.get(ingredientId);
    
    if (!plate || !ingredient || 
        plate.type !== ItemType.PLATE || 
        ingredient.type !== ItemType.INGREDIENT || 
        ingredient.state !== ItemState.THAWED) {
      return null;
    }

    // 创建新的菜品
    const dish: Item = {
      id: `dish_${this.nextItemId++}`,
      type: ItemType.DISH,
      ingredientType: ingredient.ingredientType,
      state: ItemState.READY,
      location: ItemLocation.PLAYER_HAND,
      items: [plate, ingredient] // 包含碟子和食材
    };

    // 移除原有的碟子和食材
    this.removeItem(plateId);
    this.removeItem(ingredientId);

    // 添加新菜品
    this.items.set(dish.id, dish);
    this.createItemSprite(dish);

    console.log(`组装完成：${this.getDishName(dish.ingredientType!)}`);
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

  // 获取菜品名称
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