import { GridTile, TileType, Position, IngredientType, Item } from '../types';

export class MapManager {
  private gridWidth: number = 20;   // 网格宽度（格子数量）
  private gridHeight: number = 15;  // 网格高度（格子数量）
  private tileSize: number = 40;    // 每个格子的像素大小
  private tiles: GridTile[][] = [];
  private scene: Phaser.Scene;

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
    
    // 右上桌面区域 (3x2)
    this.setTile(15, 2, TileType.DESK, false, true);
    this.setTile(16, 2, TileType.DESK, false, true);
    this.setTile(17, 2, TileType.DESK, false, true);
    this.setTile(15, 3, TileType.DESK, false, true);
    this.setTile(16, 3, TileType.DESK, false, true);
    this.setTile(17, 3, TileType.DESK, false, true);
    
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
    
    // 洗碗池 (右上角，底部和左侧有地面可以接近)
    this.setTile(18, 1, TileType.SINK, false, false);
    
    // 出餐口 (右下角，顶部和左侧有地面可以接近)
    this.setTile(18, 13, TileType.SERVING, false, false);
  }

  private placeIngredients(): void {
    // 食材存储格是障碍物！厨师不能踩上去，但可以从旁边获取食材
    // 设计原则：每个食材格周围至少有一面是地面，确保可以获取
    
    // 第一行：基础食材
    this.setIngredientTile(5, 1, IngredientType.HUANG_MI_GAOOU);    // 黄米糕坯
    this.setIngredientTile(7, 1, IngredientType.MANTOU);            // 小馒头
    this.setIngredientTile(9, 1, IngredientType.XIBEI_MIANJIN);     // 西贝面筋
    this.setIngredientTile(11, 1, IngredientType.FANQIE_NIUROU);    // 番茄牛腩
    this.setIngredientTile(13, 1, IngredientType.RICE);             // 米饭
    this.setIngredientTile(15, 1, IngredientType.SOUP_PACK);        // 汤包
    
    // 第二行：辅助食材
    this.setIngredientTile(5, 13, IngredientType.MANGYUE_SAUCE);    // 蔓越莓酱
    this.setIngredientTile(7, 13, IngredientType.SEASONING_SAUCE);  // 调味汁
    this.setIngredientTile(9, 13, IngredientType.NOODLES);          // 挂面
    this.setIngredientTile(11, 13, IngredientType.TOPPINGS);        // 浇头
    this.setIngredientTile(13, 13, IngredientType.SIDE_DISHES);     // 小菜
    this.setIngredientTile(15, 13, IngredientType.GREEN_VEG);       // 青菜
    
    // 第三行：主要肉类
    this.setIngredientTile(1, 7, IngredientType.BEEF_BONE);         // 牛大骨
    this.setIngredientTile(3, 7, IngredientType.YOUMIAN_YUYU);      // 莜面鱼鱼
    this.setIngredientTile(17, 7, IngredientType.BRAISED_CHICKEN);  // 黄焖鸡
  }

  private setTile(x: number, y: number, type: TileType, isWalkable: boolean, canPlaceItems: boolean): void {
    if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
      this.tiles[x][y].type = type;
      this.tiles[x][y].isWalkable = isWalkable;
      this.tiles[x][y].canPlaceItems = canPlaceItems;
    }
  }

  private setIngredientTile(x: number, y: number, ingredientType: IngredientType): void {
    if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
      this.tiles[x][y].type = TileType.INGREDIENT;
      this.tiles[x][y].isWalkable = false;
      this.tiles[x][y].canPlaceItems = false;
      this.tiles[x][y].ingredientType = ingredientType;
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
          case TileType.SINK:
            color = 0x1abc9c; // 青色洗碗池
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
            case TileType.SINK:
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
      }
    }
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
      // 新增食材标签
      case IngredientType.MANGYUE_SAUCE:
        return '莓酱';
      case IngredientType.SEASONING_SAUCE:
        return '调料';
      case IngredientType.SOUP_PACK:
        return '汤包';
      case IngredientType.NOODLES:
        return '挂面';
      case IngredientType.TOPPINGS:
        return '浇头';
      case IngredientType.SIDE_DISHES:
        return '小菜';
      case IngredientType.BEEF_BONE:
        return '牛骨';
      case IngredientType.YOUMIAN_YUYU:
        return '鱼鱼';
      case IngredientType.GREEN_VEG:
        return '青菜';
      case IngredientType.BRAISED_CHICKEN:
        return '焖鸡';
      default:
        return '食材';
    }
  }

  public worldToGrid(worldX: number, worldY: number): Position {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize)
    };
  }

  public gridToWorld(gridX: number, gridY: number): Position {
    return {
      x: gridX * this.tileSize + this.tileSize / 2,
      y: gridY * this.tileSize + this.tileSize / 2
    };
  }

  public isWalkable(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return false;
    }
    return this.tiles[gridX][gridY].isWalkable;
  }

  public getTile(gridX: number, gridY: number): GridTile | null {
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return null;
    }
    return this.tiles[gridX][gridY];
  }

  public getTileSize(): number {
    return this.tileSize;
  }

  public getGridSize(): { width: number; height: number } {
    return {
      width: this.gridWidth,
      height: this.gridHeight
    };
  }

  // 检查格子是否可以放置物品
  public canPlaceItem(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    if (!tile) return false;
    
    // 只有桌面可以放置物品，且该格子上没有其他物品
    return tile.canPlaceItems && !tile.item;
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

  // 从微波炉中取出物品
  public removeMicrowaveItem(gridX: number, gridY: number): Item | null {
    if (!this.isMicrowave(gridX, gridY)) return null;
    return this.removeItem(gridX, gridY);
  }
}