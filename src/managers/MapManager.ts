import { GridTile, TileType, Position, IngredientType, Item, ItemType, ItemState } from '../types';

export class MapManager {
  private gridWidth: number = 20;   // 网格宽度（格子数量）
  private gridHeight: number = 15;  // 网格高度（格子数量）
  private tileSize: number = 40;    // 每个格子的像素大小
  private tiles: GridTile[][] = [];
  private scene: Phaser.Scene;
  private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map(); // 管理物品精灵

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeGrid();
  }

  private initializeGrid(): void {
    // 正确理解：默认所有格子为可行走的地面（厨师只能在地面行走）
    for (let x = 0; x < this.gridWidth; x++) {
      this.tiles[x] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        this.tiles[x][y] = {
          x,
          y,
          type: TileType.FLOOR,    // 默认为地面
          isWalkable: true,       // 厨师可以在地面行走
          canPlaceItems: false    // 地面不能放置物品
        };
      }
    }

    // 放置桌面（障碍物 - 不能踩，但可从旁边操作）
    this.createDesks();
    
    // 放置功能设备（障碍物 - 不能踩，但可从旁边交互）
    this.placeFunctionalEquipment();

    // 放置食材存储格（障碍物 - 不能踩，但可从旁边获取食材）
    this.placeIngredients();
  }

  private createDesks(): void {
    // 桌面是障碍物！厨师不能踩上去，但可以从旁边放置/拿取物品
    // 设计原则：每个桌面周围至少有一面是地面，确保可以接触
    
    // 左上桌面区域 (3x2)
    this.setTile(2, 2, TileType.DESK, false, true);
    this.setTile(3, 2, TileType.DESK, false, true);
    this.setTile(4, 2, TileType.DESK, false, true);
    this.setTile(2, 3, TileType.DESK, false, true);
    this.setTile(3, 3, TileType.DESK, false, true);
    this.setTile(4, 3, TileType.DESK, false, true);
    
    // 右上桌面区域 (3x2) - 重新设计以配合洗碗池
    this.setTile(15, 2, TileType.DESK, false, true);
    this.setTile(16, 2, TileType.DESK, false, true);
    this.setTile(17, 2, TileType.DESK, false, true); // 洗碗池左下方桌面
    this.setTile(15, 3, TileType.DESK, false, true);
    this.setTile(16, 3, TileType.DESK, false, true);
    this.setTile(17, 3, TileType.DESK, false, true);
    
    // 洗碗池专用桌面区域 - 确保洗碗池附近有足够的桌面
    this.setTile(17, 1, TileType.DESK, false, true); // 洗碗池左边
    this.setTile(19, 1, TileType.DESK, false, true); // 洗碗池右边
    this.setTile(18, 2, TileType.DESK, false, true); // 洗碗池下面
    
    // 左下桌面区域 (3x2)
    this.setTile(2, 11, TileType.DESK, false, true);
    this.setTile(3, 11, TileType.DESK, false, true);
    this.setTile(4, 11, TileType.DESK, false, true);
    this.setTile(2, 12, TileType.DESK, false, true);
    this.setTile(3, 12, TileType.DESK, false, true);
    this.setTile(4, 12, TileType.DESK, false, true);
    
    // 右下桌面区域 (3x2)
    this.setTile(15, 11, TileType.DESK, false, true);
    this.setTile(16, 11, TileType.DESK, false, true);
    this.setTile(17, 11, TileType.DESK, false, true);
    this.setTile(15, 12, TileType.DESK, false, true);
    this.setTile(16, 12, TileType.DESK, false, true);
    this.setTile(17, 12, TileType.DESK, false, true);

    // 中央工作岛 (2x2，四面都可以接触）
    this.setTile(9, 6, TileType.DESK, false, true);
    this.setTile(10, 6, TileType.DESK, false, true);
    this.setTile(9, 7, TileType.DESK, false, true);
    this.setTile(10, 7, TileType.DESK, false, true);
  }

  private placeFunctionalEquipment(): void {
    // 设备是障碍物！厨师不能踩上去，但可以从旁边交互
    // 设计原则：每个设备周围至少有一面是地面，确保可以交互
    
    // 微波炉 (左上角，底部和右侧有地面可以接近)
    this.setTile(1, 1, TileType.MICROWAVE, false, false);
    
    // 第四阶段：洗碗池 (右上角，紫色矩形，底部和左侧有地面可以接近)
    this.setTile(18, 1, TileType.DISHWASHER, false, false);
    
    // 出餐口 (右下角，顶部和左侧有地面可以接近)
    this.setTile(18, 13, TileType.SERVING, false, false);
  }

  private placeIngredients(): void {
    // 食材存储格是障碍物！厨师不能踩上去，但可以从旁边获取食材
    // 设计原则：每个食材格周围至少有一面是地面，确保可以获取
    
    // 左侧食材区域
    this.setTile(0, 5, TileType.INGREDIENT, false, false, IngredientType.HUANG_MI_GAOOU);
    this.setTile(0, 6, TileType.INGREDIENT, false, false, IngredientType.MANTOU);
    this.setTile(0, 7, TileType.INGREDIENT, false, false, IngredientType.XIBEI_MIANJIN);
    this.setTile(0, 8, TileType.INGREDIENT, false, false, IngredientType.FANQIE_NIUROU);
    this.setTile(0, 9, TileType.INGREDIENT, false, false, IngredientType.RICE);
    
    // 右侧食材区域
    this.setTile(19, 5, TileType.INGREDIENT, false, false, IngredientType.MANGYUE_SAUCE);
    this.setTile(19, 6, TileType.INGREDIENT, false, false, IngredientType.SEASONING_SAUCE);
    this.setTile(19, 7, TileType.INGREDIENT, false, false, IngredientType.SOUP_PACK);
    this.setTile(19, 8, TileType.INGREDIENT, false, false, IngredientType.NOODLES);
    this.setTile(19, 9, TileType.INGREDIENT, false, false, IngredientType.TOPPINGS);
  }

  private setTile(x: number, y: number, type: TileType, isWalkable: boolean, canPlaceItems: boolean, ingredientType?: IngredientType): void {
    if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
      this.tiles[x][y] = {
        x,
        y,
        type,
        isWalkable,
        canPlaceItems,
        ingredientType
      };
    }
  }

  public renderMap(): void {
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const tile = this.tiles[x][y];
        const pixelX = x * this.tileSize + this.tileSize / 2;
        const pixelY = y * this.tileSize + this.tileSize / 2;

        let color: number;
        let strokeColor: number = 0x34495e;

        switch (tile.type) {
          case TileType.FLOOR:
            color = 0xecf0f1; // 浅灰色地面
            break;
          case TileType.DESK:
            color = 0xbdc3c7; // 深灰色桌面
            break;
          case TileType.MICROWAVE:
            color = 0x3498db; // 蓝色微波炉
            break;
          case TileType.DISHWASHER:
            color = 0x8e44ad; // 紫色洗碗池（第四阶段要求）
            break;
          case TileType.SERVING:
            color = 0xf39c12; // 橙色出餐口
            break;
          case TileType.INGREDIENT:
            color = 0x9b59b6; // 紫色食材存储格
            break;
          default:
            color = 0x95a5a6;
        }

        const rect = this.scene.add.rectangle(pixelX, pixelY, this.tileSize - 2, this.tileSize - 2, color);
        rect.setStrokeStyle(1, strokeColor);

        // 添加设备和食材标签
        if (tile.type !== TileType.FLOOR && tile.type !== TileType.DESK) {
          let label: string;
          switch (tile.type) {
            case TileType.MICROWAVE:
              label = '微波';
              break;
            case TileType.DISHWASHER:
              label = '洗碗';
              break;
            case TileType.SERVING:
              label = '出餐';
              break;
            case TileType.INGREDIENT:
              label = this.getIngredientLabel(tile.ingredientType);
              break;
            default:
              label = '';
          }
          if (label) {
            this.scene.add.text(pixelX, pixelY, label, {
              fontSize: '8px',
              color: '#2c3e50'
            }).setOrigin(0.5);
          }
        }

        // 渲染桌面和洗碗池中的物品
        if (tile.item && (tile.type === TileType.DESK || tile.type === TileType.DISHWASHER)) {
          this.renderItemOnTile(tile.item, pixelX, pixelY);
        }
      }
    }
  }

  // 渲染桌面上的物品
  private renderItemOnTile(item: Item, pixelX: number, pixelY: number): void {
    let itemColor: number;
    let itemLabel: string;

    switch (item.type) {
      case 'plate':
        itemColor = 0xf8f9fa; // 白色盘子
        itemLabel = '盘';
        break;
      case 'ingredient':
        // 根据食材状态显示不同颜色
        switch (item.state) {
          case 'frozen':
            itemColor = 0x3498db; // 蓝色冷冻
            break;
          case 'thawing':
            itemColor = 0xf39c12; // 橙色解冻中
            break;
          case 'thawed':
            itemColor = 0x27ae60; // 绿色已解冻
            break;
          default:
            itemColor = 0x95a5a6; // 灰色默认
        }
        itemLabel = this.getIngredientShortName(item.ingredientType);
        break;
      case 'dish':
        itemColor = 0xe74c3c; // 红色完成菜品
        itemLabel = '菜';
        break;
      case 'dirty_plate':
        itemColor = 0x8b4513; // 棕色脏盘子
        itemLabel = '脏';
        break;
      default:
        itemColor = 0x95a5a6;
        itemLabel = '?';
    }

    // 绘制物品圆形
    const itemCircle = this.scene.add.circle(pixelX, pixelY, 12, itemColor);
    itemCircle.setStrokeStyle(2, 0x2c3e50);

    // 添加物品标签
    this.scene.add.text(pixelX, pixelY, itemLabel, {
      fontSize: '10px',
      color: '#2c3e50',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  // 获取食材简短名称
  private getIngredientShortName(ingredientType?: any): string {
    if (!ingredientType) return '?';
    
    const shortNames: { [key: string]: string } = {
      'huang_mi_gaoou': '糕',
      'mantou': '馒',
      'xibei_mianjin': '筋',
      'fanqie_niurou': '牛',
      'rice': '饭'
    };
    
    return shortNames[ingredientType] || '?';
  }

  private getIngredientLabel(ingredientType?: IngredientType): string {
    if (!ingredientType) return '';
    
    switch (ingredientType) {
      case IngredientType.HUANG_MI_GAOOU:
        return '糕坯';
      case IngredientType.MANTOU:
        return '馒头';
      case IngredientType.XIBEI_MIANJIN:
        return '面筋';
      case IngredientType.FANQIE_NIUROU:
        return '牛腩';
      case IngredientType.RICE:
        return '米饭';
      case IngredientType.MANGYUE_SAUCE:
        return '蔓越莓';
      case IngredientType.SEASONING_SAUCE:
        return '调味汁';
      case IngredientType.SOUP_PACK:
        return '汤包';
      case IngredientType.NOODLES:
        return '挂面';
      case IngredientType.TOPPINGS:
        return '浇头';
      default:
        return '';
    }
  }

  // 网格坐标转世界坐标
  public gridToWorld(gridX: number, gridY: number): Position {
    return {
      x: gridX * this.tileSize + this.tileSize / 2,
      y: gridY * this.tileSize + this.tileSize / 2
    };
  }

  // 世界坐标转网格坐标
  public worldToGrid(worldX: number, worldY: number): Position {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize)
    };
  }

  // 获取指定位置的格子
  public getTile(gridX: number, gridY: number): GridTile | null {
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return null;
    }
    return this.tiles[gridX][gridY];
  }

  // 检查位置是否可行走
  public isWalkable(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile ? tile.isWalkable : false;
  }

  // 检查位置是否可以放置物品
  public canPlaceItem(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile ? (tile.canPlaceItems && !tile.item) : false;
  }

  // 在格子上放置物品
  public placeItem(gridX: number, gridY: number, item: Item): boolean {
    if (!this.canPlaceItem(gridX, gridY)) return false;
    
    const tile = this.getTile(gridX, gridY);
    if (!tile) return false;

    tile.item = item;
    return true;
  }

  // 从格子上移除物品
  public removeItem(gridX: number, gridY: number): Item | null {
    const tile = this.getTile(gridX, gridY);
    if (!tile || !tile.item) return null;

    const item = tile.item;
    tile.item = undefined;
    return item;
  }

  // 获取格子上的物品
  public getItemAt(gridX: number, gridY: number): Item | null {
    const tile = this.getTile(gridX, gridY);
    return tile?.item || null;
  }

  // 检查格子是否为桌面
  public isDesk(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile?.type === TileType.DESK || false;
  }

  // 检查格子是否为微波炉
  public isMicrowave(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile?.type === TileType.MICROWAVE || false;
  }

  // 获取微波炉中的物品
  public getMicrowaveItem(gridX: number, gridY: number): Item | null {
    if (!this.isMicrowave(gridX, gridY)) return null;
    return this.getItemAt(gridX, gridY);
  }

  // 在微波炉中放置物品
  public placeMicrowaveItem(gridX: number, gridY: number, item: Item): boolean {
    if (!this.isMicrowave(gridX, gridY)) return false;
    const tile = this.getTile(gridX, gridY);
    if (!tile || tile.item) return false; // 微波炉已有物品

    tile.item = item;
    return true;
  }

  // 从微波炉中移除物品
  public removeMicrowaveItem(gridX: number, gridY: number): Item | null {
    if (!this.isMicrowave(gridX, gridY)) return null;
    return this.removeItem(gridX, gridY);
  }

  // 第四阶段：检查格子是否为洗碗池
  public isDishwasher(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile?.type === TileType.DISHWASHER || false;
  }

  // 第四阶段：获取洗碗池中的物品
  public getDishwasherItem(gridX: number, gridY: number): Item | null {
    if (!this.isDishwasher(gridX, gridY)) return null;
    return this.getItemAt(gridX, gridY);
  }

  // 第四阶段：在洗碗池中放置物品
  public placeDishwasherItem(gridX: number, gridY: number, item: Item): boolean {
    if (!this.isDishwasher(gridX, gridY)) return false;
    const tile = this.getTile(gridX, gridY);
    if (!tile || tile.item) return false; // 洗碗池已有物品

    tile.item = item;
    return true;
  }

  // 第四阶段：从洗碗池中移除物品
  public removeDishwasherItem(gridX: number, gridY: number): Item | null {
    if (!this.isDishwasher(gridX, gridY)) return null;
    return this.removeItem(gridX, gridY);
  }

  // 安全的物品精灵管理
  private createItemSprite(item: Item, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    console.log('🎨 渲染物品精灵:', {
      type: item.type,
      state: item.state,
      id: item.id,
      position: `(${Math.round(x/40)}, ${Math.round(y/40)})`
    });

    let color: number;
    let size: number = 20;

    switch (item.type) {
      case ItemType.PLATE:
        color = 0xf8f9fa; // 白色盘子
        break;
      case ItemType.DIRTY_PLATE:
        color = 0x8b4513; // 棕色脏盘子
        break;
      case ItemType.INGREDIENT:
        switch (item.state) {
          case ItemState.FROZEN: color = 0x3498db; break;  // 蓝色冷冻
          case ItemState.THAWING: color = 0xf39c12; break; // 橙色解冻中
          case ItemState.THAWED: color = 0xe74c3c; break;  // 红色已解冻
          default: color = 0x95a5a6; break;
        }
        break;
      case ItemType.DISH:
        color = 0x27ae60; // 绿色完成菜品
        size = 25;
        break;
      default:
        color = 0x95a5a6;
    }

    const circle = this.scene.add.circle(0, 0, size/2, color);
    circle.setStrokeStyle(2, 0x2c3e50);
    container.add(circle);

    // 添加简单标识
    const text = this.scene.add.text(0, 0, this.getItemLabel(item), {
      fontSize: '8px',
      color: '#2c3e50'
    }).setOrigin(0.5);
    container.add(text);

    return container;
  }

  private getItemLabel(item: Item): string {
    switch (item.type) {
      case ItemType.PLATE: return '盘';
      case ItemType.DIRTY_PLATE: return '脏';
      case ItemType.INGREDIENT: return '材';
      case ItemType.DISH: return '菜';
      default: return '?';
    }
  }

  // 安全更新物品显示
  public safeUpdateItemDisplay(gridX: number, gridY: number): void {
    const posKey = `${gridX}-${gridY}`;
    const item = this.getItemAt(gridX, gridY);

    // 清除旧的精灵
    if (this.itemSprites.has(posKey)) {
      this.itemSprites.get(posKey)?.destroy();
      this.itemSprites.delete(posKey);
    }

    // 如果有新物品，创建精灵
    if (item) {
      const worldPos = this.gridToWorld(gridX, gridY);
      const sprite = this.createItemSprite(item, worldPos.x, worldPos.y);
      this.itemSprites.set(posKey, sprite);
    }
  }

  // 清除所有物品精灵（保留地图和玩家）
  public clearAllItemSprites(): void {
    this.itemSprites.forEach(sprite => sprite.destroy());
    this.itemSprites.clear();
  }

  // 安全的完整物品渲染
  public safeRenderAllItems(): void {
    // 先清除所有旧的物品精灵
    this.clearAllItemSprites();

    // 重新渲染所有物品
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const tile = this.tiles[x][y];
        if (tile.item && (tile.type === TileType.DESK || tile.type === TileType.DISHWASHER)) {
          this.safeUpdateItemDisplay(x, y);
        }
      }
    }
  }
}