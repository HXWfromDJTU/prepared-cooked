// 游戏类型定义

export interface GameConfig {
  width: number;
  height: number;
  fps: number;
}

export interface Position {
  x: number;
  y: number;
}

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

export enum TileType {
  FLOOR = 'floor',           // 可行走的地面
  DESK = 'desk',            // 普通桌面（可放置物品）
  MICROWAVE = 'microwave',   // 微波炉
  SINK = 'sink',            // 洗碗池
  SERVING = 'serving',      // 出餐口
  INGREDIENT = 'ingredient'  // 食材存储格
}

// 食材类型定义（根据requirement.md中的菜品）
export enum IngredientType {
  HUANG_MI_GAOOU = 'huang_mi_gaoou',     // 黄米凉糕
  MANTOU = 'mantou',                      // 小馒头
  XIBEI_MIANJIN = 'xibei_mianjin',       // 西贝面筋
  FANQIE_NIUROU = 'fanqie_niurou',       // 番茄牛腩
  RICE = 'rice'                          // 米饭
}

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  isWalkable: boolean;
  canPlaceItems: boolean;
  ingredientType?: IngredientType;  // 如果是食材格，指定食材类型
  item?: Item;  // 放置在此格子上的物品
}

// 物品类型定义
export enum ItemType {
  INGREDIENT = 'ingredient',  // 食材
  PLATE = 'plate',           // 碟子
  DISH = 'dish'              // 完成的菜品（食材+碟子）
}

// 物品状态定义
export enum ItemState {
  FROZEN = 'frozen',          // 冷冻状态
  THAWING = 'thawing',        // 解冻中
  THAWED = 'thawed',          // 已解冻
  READY = 'ready'             // 准备就绪（碟子等）
}

// 物品位置定义
export enum ItemLocation {
  PLAYER_HAND = 'player_hand',    // 玩家手中
  ON_DESK = 'on_desk',           // 在桌面上
  IN_MICROWAVE = 'in_microwave',  // 在微波炉中
  NOWHERE = 'nowhere'            // 无位置（已被消耗）
}

// 物品接口
export interface Item {
  id: string;                    // 唯一标识
  type: ItemType;               // 物品类型
  ingredientType?: IngredientType; // 如果是食材，指定食材类型
  state: ItemState;             // 物品状态
  location: ItemLocation;       // 物品位置
  gridPosition?: Position;      // 如果在格子上，记录格子坐标
  thawProgress?: number;        // 解冻进度 (0-1)
  thawStartTime?: number;       // 解冻开始时间
  items?: Item[];              // 如果是组合物品（如碟子+食材）
}