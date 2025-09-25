import { Item, ItemType, ItemState, ItemLocation } from '../types';

/**
 * 第四阶段：盘子管理器（重新设计）
 * 负责管理盘子的生命周期：初始分布 -> 使用 -> 自动生成脏盘子 -> 洗碗 -> 刷新到桌面
 */
export class PlateManager {
  private scene: Phaser.Scene;
  private plateIdCounter: number = 0;
  private washingPlates: Map<string, Item> = new Map(); // 正在洗碗池中清洗的盘子

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 初始化盘子分布（游戏开始时在桌面放置盘子）
  public initializePlatesOnTables(): void {
    const mapManager = (this.scene as any).mapManager;
    if (!mapManager) return;

    // 在厨房桌面的几个位置放置初始盘子
    const initialPlatePositions = [
      { x: 2, y: 2 },   // 左上角桌面
      { x: 4, y: 2 },   // 左上角桌面
      { x: 15, y: 2 },  // 右上角桌面
      { x: 17, y: 2 },  // 右上角桌面
      { x: 2, y: 12 },  // 左下角桌面
    ];

    initialPlatePositions.forEach(pos => {
      if (mapManager.canPlaceItem(pos.x, pos.y)) {
        const plate: Item = {
          id: `initial_plate_${this.plateIdCounter++}`,
          type: ItemType.PLATE,
          state: ItemState.READY,
          location: ItemLocation.ON_DESK,
          gridPosition: pos
        };
        
        mapManager.placeItem(pos.x, pos.y, plate);
        console.log(`初始盘子放置在位置 (${pos.x}, ${pos.y})`);
      }
    });
  }

  // 在洗碗池中添加脏盘子（自动生成）
  public addDirtyPlateToSink(): void {
    const mapManager = (this.scene as any).mapManager;
    if (!mapManager) return;

    // 检查洗碗池是否已经有物品
    const existingItem = mapManager.getDishwasherItem(18, 1);
    if (existingItem) {
      console.log('洗碗池已有物品，无法添加脏盘子');
      return;
    }

    const dirtyPlate: Item = {
      id: `dirty_plate_${this.plateIdCounter++}`,
      type: ItemType.DIRTY_PLATE,
      state: ItemState.READY,
      location: ItemLocation.IN_DISHWASHER,
      gridPosition: { x: 18, y: 1 } // 洗碗池位置
    };
    
    console.log('脏盘子自动出现在洗碗池中');
    
    // 将脏盘子放入洗碗池
    mapManager.placeDishwasherItem(18, 1, dirtyPlate);
  }

  // 持续洗碗流程（玩家需要持续按住操作键）
  public continuousWashing(): boolean {
    const mapManager = (this.scene as any).mapManager;
    if (!mapManager) return false;
    
    // 检查洗碗池是否有脏盘子
    const dishwasherItem = mapManager.getDishwasherItem(18, 1);
    if (!dishwasherItem || dishwasherItem.type !== ItemType.DIRTY_PLATE) {
      return false;
    }
    
    // 如果是第一次开始洗碗，初始化
    if (!this.washingPlates.has(dishwasherItem.id)) {
      dishwasherItem.state = ItemState.THAWING; // 借用THAWING状态表示正在清洗
      dishwasherItem.washStartTime = this.scene.time.now;
      dishwasherItem.washProgress = 0;
      this.washingPlates.set(dishwasherItem.id, dishwasherItem);
      console.log('开始洗碗，需要持续按住操作键');
    }
    
    return true;
  }

  // 停止洗碗（玩家松开操作键或离开洗碗池）
  public stopWashing(): void {
    const mapManager = (this.scene as any).mapManager;
    if (!mapManager) return;
    
    // 检查洗碗池的盘子
    const dishwasherItem = mapManager.getDishwasherItem(18, 1);
    if (dishwasherItem && this.washingPlates.has(dishwasherItem.id)) {
      // 重置洗碗进度
      dishwasherItem.state = ItemState.READY; // 重置为脏盘子状态
      dishwasherItem.washStartTime = undefined;
      dishwasherItem.washProgress = 0;
      
      // 从洗碗列表中移除
      this.washingPlates.delete(dishwasherItem.id);
      console.log('洗碗中断，进度重置');
    }
  }

  // 更新洗碗进度
  public updateWashing(): void {
    const currentTime = this.scene.time.now;
    const washDuration = 5000; // 5秒洗碗时间
    const mapManager = (this.scene as any).mapManager;
    
    console.log(`正在清洗的盘子数量: ${this.washingPlates.size}`);
    
    this.washingPlates.forEach((plate, plateId) => {
      if (plate.washStartTime) {
        const elapsedTime = currentTime - plate.washStartTime;
        plate.washProgress = Math.min(elapsedTime / washDuration, 1);
        
        console.log(`盘子 ${plateId} 洗碗进度: ${Math.floor(plate.washProgress * 100)}%`);
        
        // 洗碗完成
        if (plate.washProgress >= 1) {
          console.log(`🎉 盘子 ${plateId} 洗碗完成！开始处理...`);
          
          // 从洗碗池移除
          console.log('步骤1: 从洗碗池移除脏盘子...');
          const removed = mapManager?.removeDishwasherItem(18, 1);
          console.log(`洗碗池移除结果: ${removed ? '成功' : '失败'}`);
          
          // 在洗碗池附近的桌面生成干净盘子
          console.log('步骤2: 生成干净盘子...');
          this.spawnCleanPlateNearSink();
          
          // 从正在清洗列表中移除
          console.log('步骤3: 从清洗列表移除...');
          this.washingPlates.delete(plateId);
          console.log(`✅ 洗碗完成处理结束，剩余清洗盘子: ${this.washingPlates.size}`);
        }
      }
    });
  }

  // 在洗碗池附近的桌面生成干净盘子（最近的桌子优先）
  private spawnCleanPlateNearSink(): void {
    const mapManager = (this.scene as any).mapManager;
    if (!mapManager) {
      console.log('MapManager不存在，无法生成干净盘子');
      return;
    }
    
    console.log('开始寻找位置放置干净盘子...');
    
    // 洗碗池附近的桌面位置（按距离排序，最近的优先）
    const nearbyPositions = [
      { x: 17, y: 1 }, // 洗碗池左边（最近）
      { x: 19, y: 1 }, // 洗碗池右边（最近）
      { x: 18, y: 2 }, // 洗碗池下面
      { x: 17, y: 2 }, // 洗碗池左下
      { x: 19, y: 2 }, // 洗碗池右下
      { x: 16, y: 1 }, // 更远的位置
      { x: 20, y: 1 },
      { x: 15, y: 1 }, // 扩展更多位置
      { x: 15, y: 2 },
      { x: 16, y: 2 },
      { x: 20, y: 2 }
    ];
    
    // 找到第一个可用的位置
    for (const pos of nearbyPositions) {
      console.log(`检查位置 (${pos.x}, ${pos.y})...`);
      
      // 检查该位置的地形类型
      const tile = mapManager.getTile(pos.x, pos.y);
      console.log(`位置 (${pos.x}, ${pos.y}) 地形类型: ${tile?.type}`);
      
      // 检查该位置是否已有物品
      const existingItem = mapManager.getItemAt(pos.x, pos.y);
      console.log(`位置 (${pos.x}, ${pos.y}) 已有物品: ${existingItem ? existingItem.type : '无'}`);
      
      if (mapManager.canPlaceItem(pos.x, pos.y)) {
        const cleanPlate: Item = {
          id: `clean_plate_${this.plateIdCounter++}`,
          type: ItemType.PLATE,
          state: ItemState.READY,
          location: ItemLocation.ON_DESK,
          gridPosition: pos
        };
        
        const success = mapManager.placeItem(pos.x, pos.y, cleanPlate);
        console.log(`✅ 干净盘子放置结果: ${success ? '成功' : '失败'} 在位置 (${pos.x}, ${pos.y})`);
        
        // 验证物品是否真的被放置了
        const verifyItem = mapManager.getItemAt(pos.x, pos.y);
        console.log(`🔍 验证: 位置 (${pos.x}, ${pos.y}) 的物品: ${verifyItem ? verifyItem.type : '无'}`);
        
        // 强制重新渲染地图以显示新物品
        console.log('🔄 强制重新渲染地图...');
        mapManager.renderMap();
        
        return;
      } else {
        console.log(`❌ 位置 (${pos.x}, ${pos.y}) 不可放置物品`);
      }
    }
    
    console.log('❌ 洗碗池附近没有空位放置干净盘子');
  }

  // 获取正在清洗的盘子列表
  public getWashingPlates(): Item[] {
    return Array.from(this.washingPlates.values());
  }

  // 获取干净盘子数量（计算桌面上的盘子）
  public getCleanPlateCount(): number {
    const mapManager = (this.scene as any).mapManager;
    if (!mapManager) return 0;
    
    let count = 0;
    // 遍历地图上的所有物品，计算干净盘子数量
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 15; y++) {
        const item = mapManager.getItemAt(x, y);
        if (item && item.type === ItemType.PLATE) {
          count++;
        }
      }
    }
    return count;
  }

  // 获取脏盘子数量（洗碗池中的脏盘子）
  public getDirtyPlateCount(): number {
    const mapManager = (this.scene as any).mapManager;
    if (!mapManager) return 0;
    
    const dishwasherItem = mapManager.getDishwasherItem(18, 1);
    return (dishwasherItem && dishwasherItem.type === ItemType.DIRTY_PLATE) ? 1 : 0;
  }

  // 检查是否可以装盘（桌面上是否有干净盘子）
  public canPlate(): boolean {
    return this.getCleanPlateCount() > 0;
  }

  // 重置盘子管理器
  public reset(): void {
    this.washingPlates.clear();
    this.plateIdCounter = 0;
    // 重新初始化桌面盘子
    this.initializePlatesOnTables();
  }

  // 获取状态信息（用于调试）
  public getStatus(): string {
    return `干净盘子: ${this.getCleanPlateCount()}, 脏盘子: ${this.getDirtyPlateCount()}, 清洗中: ${this.washingPlates.size}`;
  }
}