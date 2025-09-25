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
  // 原有5种基础食材
  HUANG_MI_GAOOU = 'huang_mi_gaoou',     // 黄米糕坯
  MANTOU = 'mantou',                      // 小馒头
  XIBEI_MIANJIN = 'xibei_mianjin',       // 西贝面筋
  FANQIE_NIUROU = 'fanqie_niurou',       // 番茄牛腩
  RICE = 'rice',                          // 米饭
  
  // 扩展食材支持更多菜品
  MANGYUE_SAUCE = 'mangyue_sauce',        // 蔓越莓酱（黄米凉糕用）
  SEASONING_SAUCE = 'seasoning_sauce',    // 调味汁（西贝面筋用）
  SOUP_PACK = 'soup_pack',               // 汤包（紫菜蛋花汤）
  NOODLES = 'noodles',                   // 挂面（张爷爷空心挂面）
  TOPPINGS = 'toppings',                 // 浇头（张爷爷空心挂面）
  SIDE_DISHES = 'side_dishes',           // 小菜（多个菜品通用）
  BEEF_BONE = 'beef_bone',               // 牛大骨（牛大骨套餐）
  YOUMIAN_YUYU = 'youmian_yuyu',         // 莜面鱼鱼
  GREEN_VEG = 'green_veg',               // 青菜（多个菜品通用）
  BRAISED_CHICKEN = 'braised_chicken',    // 黄焖鸡（黄焖鸡米饭）
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
  dishType?: DishType;         // 如果是菜品，指定菜品类型
}

// 菜品类型定义（基于requirement.md中的18种菜品）
export enum DishType {
  // 简单菜品 (复杂度1-2)
  HUANG_MI_LIANGGAO = 'huang_mi_lianggao',         // 01. 黄米凉糕
  XIAO_MANTOU = 'xiao_mantou',                     // 02. 小馒头  
  XIBEI_MIANJIN_DISH = 'xibei_mianjin_dish',       // 03. 西贝面筋
  FANQIE_NIUROU_FAN = 'fanqie_niurou_fan',         // 04. 番茄牛腩饭
  ZICAI_DANHUA_TANG = 'zicai_danhua_tang',         // 05. 紫菜蛋花汤
  
  // 中等菜品 (复杂度3)
  ZHANGYE_KONGXIN_GUAMIAN = 'zhangye_kongxin_guamian', // 06. 张爷爷空心挂面
  NIUDAGU_TAOCAN = 'niudagu_taocan',                // 07. 牛大骨套餐
  HUANGMEN_JI_MIFAN = 'huangmen_ji_mifan',          // 08. 黄焖鸡米饭
}

// 菜品配方定义
export interface DishRecipe {
  dishType: DishType;
  name: string;                    // 菜品中文名
  ingredients: IngredientType[];   // 所需食材列表
  complexity: number;              // 复杂度 (1-5)
  baseTime: number;               // 基础制作时间（秒）
  difficulty: 'simple' | 'medium' | 'hard';  // 难度等级
}

// 订单状态定义
export enum OrderStatus {
  WAITING = 'waiting',    // 等待制作
  EXPIRED = 'expired'     // 已超时
}

// 订单接口定义
export interface Order {
  id: string;                    // 订单唯一标识
  dishType: DishType;           // 需要制作的菜品类型
  dishName: string;             // 菜品中文名
  status: OrderStatus;          // 订单状态
  totalTime: number;            // 总时间限制（毫秒）
  remainingTime: number;        // 剩余时间（毫秒）
  createdAt: number;            // 创建时间戳
  baseScore: number;            // 基础分数
}