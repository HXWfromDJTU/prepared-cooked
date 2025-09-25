import { InputManager } from '../managers/InputManager';
import { MapManager } from '../managers/MapManager';
import { ItemManager } from '../managers/ItemManager';
import { OrderManager } from '../managers/OrderManager';
import { PlateManager } from '../managers/PlateManager';
import { Player } from '../entities/Player';
import { TileType, IngredientType, ItemType, ItemLocation, DishType, ItemState } from '../types';

export class MainScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private mapManager!: MapManager;
  private itemManager!: ItemManager;
  private orderManager!: OrderManager;
  private plateManager!: PlateManager; // 第四阶段：盘子管理器
  private player!: Player;
  private gameWidth: number = 800;
  private gameHeight: number = 600;
  private lastMoveTime: number = 0;
  private moveDelay: number = 200; // 移动输入间隔，防止过于灵敏
  private score: number = 0;
  private microwaveProgressUI: Phaser.GameObjects.Container | null = null; // 微波炉进度条UI
  private dishwasherProgressUI: Phaser.GameObjects.Container | null = null; // 第四阶段：洗碗池进度条UI
  
  // 第三阶段：游戏时间和结束逻辑
  private gameTimeLimit: number = 180000; // 3分钟 = 180秒 = 180000毫秒
  private gameStartTime: number = 0;
  private gameTimeRemaining: number = 180000;
  private isGameActive: boolean = true;
  private gameEndUI: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // MVP-1阶段不需要加载任何资源，使用纯色几何图形
  }

  create(): void {
    // 设置世界边界
    this.physics.world.setBounds(0, 0, this.gameWidth, this.gameHeight);

    // 创建地图管理器
    this.mapManager = new MapManager(this);
    
    // 创建物品管理器
    this.itemManager = new ItemManager(this);
    
    // 创建订单管理器
    this.orderManager = new OrderManager(this);
    
    // 第四阶段：创建盘子管理器
    this.plateManager = new PlateManager(this);
    
    // 渲染地图
    this.mapManager.renderMap();
    
    // 初始化桌面盘子
    this.plateManager.initializePlatesOnTables();

    // 在安全的地面位置创建玩家角色（起始位置：网格坐标7,7 - 确保是地面）
    this.player = new Player(this, this.mapManager, 7, 7);

    // 初始化输入管理器
    this.inputManager = new InputManager(this);

    // 创建一些初始碟子在桌面上
    this.createInitialPlates();
    
    // 创建初始的预制菜在桌面上
    this.createInitialPreparedFood();

    // 添加UI文本显示控制说明和状态
    this.createUI();
    
    // 第三阶段：启动游戏计时
    this.startGameTimer();

    console.log('MVP-3: 主场景创建完成');
    console.log('- 使用 WASD 或方向键移动');
    console.log('- 使用 空格键 与面向的设备交互');
    console.log('- 游戏时长：3分钟');
  }

  update(): void {
    const currentTime = this.time.now;
    
    // 第三阶段：检查游戏是否结束
    if (this.isGameActive) {
      this.updateGameTimer(currentTime);
      
      // 更新物品系统（解冻进度等）
      this.itemManager.updateThawing();
      
      // 第四阶段：更新盘子管理系统（洗碗进度等）
      this.plateManager.updateWashing();
      
      // 更新订单系统
      this.orderManager.update(currentTime);
      
      // 更新微波炉进度条UI
      this.updateMicrowaveUI();
      
      // 第四阶段：更新洗碗池进度条UI
      this.updateDishwasherUI();
      
      // 更新玩家手持物品显示状态
      this.player.updateHeldItemDisplay();
      
      // 处理玩家移动（网格移动需要防抖）
      if (currentTime - this.lastMoveTime > this.moveDelay) {
        const direction = this.inputManager.getMovementDirection();
        if (direction && !this.player.isCurrentlyMoving()) {
          this.player.tryMove(direction);
          this.lastMoveTime = currentTime;
        }
      }

      // 处理交互按键
      if (this.inputManager.isInteractPressed()) {
        this.handleInteraction();
      }
      
      // 检查持续洗碗状态
      this.handleContinuousWashing();
    } else {
      // 游戏结束后，只处理重新开始按键
      if (this.inputManager.isRestartPressed()) {
        this.restartGame();
      }
    }
  }

  private handleInteraction(): void {
    const facingGrid = this.player.getFacingGridPosition();
    const facingTile = this.mapManager.getTile(facingGrid.x, facingGrid.y);
    
    if (!facingTile) return;

    // 根据面向的设备类型进行交互
    switch (facingTile.type) {
      case TileType.MICROWAVE:
        this.handleMicrowaveInteraction(facingGrid);
        break;
      case TileType.DISHWASHER:
        this.handleDishwasherInteraction(facingGrid);
        break;
      case TileType.SERVING:
        this.handleServingInteraction();
        break;
      case TileType.DESK:
        this.handleDeskInteraction(facingGrid);
        break;
      case TileType.INGREDIENT:
        this.handleIngredientInteraction(facingTile.ingredientType!, facingGrid);
        break;
      default:
        console.log('这里没有可以交互的设备');
    }
  }

  // 处理微波炉交互
  private handleMicrowaveInteraction(microwaveGrid: { x: number; y: number }): void {
    const heldItem = this.player.getHeldItem();
    const microwaveItem = this.itemManager.getItemAtPosition(microwaveGrid.x, microwaveGrid.y);

    if (heldItem && !microwaveItem) {
      // 玩家手里有物品，微波炉空着 - 放入微波炉
      if (heldItem.type === ItemType.INGREDIENT) {
        this.player.dropItem();
        this.itemManager.putInMicrowave(heldItem.id, microwaveGrid);
        this.mapManager.placeMicrowaveItem(microwaveGrid.x, microwaveGrid.y, heldItem);
        this.showInteractionFeedback(`放入微波炉：${this.getItemName(heldItem)}`, microwaveGrid);
      } else {
        this.showInteractionFeedback('只能放入食材到微波炉', microwaveGrid);
      }
    } else if (!heldItem && microwaveItem) {
      // 玩家手里没物品，微波炉有物品 - 从微波炉取出
      this.itemManager.takeFromMicrowave(microwaveItem.id);
      this.player.pickUpItem(microwaveItem);
      this.mapManager.removeMicrowaveItem(microwaveGrid.x, microwaveGrid.y);
      this.showInteractionFeedback(`取出：${this.getItemName(microwaveItem)}`, microwaveGrid);
    } else if (heldItem && microwaveItem) {
      this.showInteractionFeedback('微波炉已有物品', microwaveGrid);
    } else {
      this.showInteractionFeedback('微波炉是空的', microwaveGrid);
    }
  }


  // 处理桌面交互
  private handleDeskInteraction(deskGrid: { x: number; y: number }): void {
    const heldItem = this.player.getHeldItem();
    const deskItem = this.mapManager.getItemAt(deskGrid.x, deskGrid.y);

    if (heldItem && !deskItem) {
      // 玩家手里有物品，桌面空着 - 放置物品
      const droppedItem = this.player.dropItem()!;
      this.itemManager.moveItem(droppedItem.id, ItemLocation.ON_DESK, deskGrid);
      this.mapManager.placeItem(deskGrid.x, deskGrid.y, droppedItem);
      this.showInteractionFeedback(`放置：${this.getItemName(droppedItem)}`, deskGrid);
    } else if (!heldItem && deskItem) {
      // 玩家手里没物品，桌面有物品 - 拾取物品
      this.player.pickUpItem(deskItem);
      this.itemManager.moveItem(deskItem.id, ItemLocation.PLAYER_HAND);
      this.mapManager.removeItem(deskGrid.x, deskGrid.y);
      this.showInteractionFeedback(`拾取：${this.getItemName(deskItem)}`, deskGrid);
    } else if (heldItem && deskItem) {
      // 第四阶段：检查是否需要盘子进行装盘
      if (heldItem.type === ItemType.INGREDIENT && heldItem.state === ItemState.THAWED && 
          deskItem.type === ItemType.PLATE) {
        // 解冻食材 + 盘子 = 装盘
        if (!this.plateManager.canPlate()) {
          this.showInteractionFeedback('没有干净盘子可用！', deskGrid);
          return;
        }

        // 直接使用桌面上的盘子进行组合
        if (this.itemManager.addIngredientToPlate(deskItem.id, heldItem.id)) {
          const plate = this.itemManager.getItem(deskItem.id);
          
          // 更新玩家手持物品
          this.player.dropItem();
          this.player.pickUpItem(plate!);
          this.mapManager.removeItem(deskGrid.x, deskGrid.y);
          
          // 根据盘子状态显示反馈
          if (plate?.type === ItemType.DISH) {
            this.showInteractionFeedback(`菜品完成：${this.getItemName(plate)}`, deskGrid);
          } else {
            const ingredientName = this.getIngredientName(heldItem?.ingredientType);
            this.showInteractionFeedback(`食材已添加：${ingredientName}`, deskGrid);
          }
        } else {
          this.showInteractionFeedback('无法添加食材', deskGrid);
        }
      }
      // 尝试将食材添加到盘子上（允许自由装盘）
      else if ((heldItem.type === ItemType.PLATE && deskItem.type === ItemType.INGREDIENT) ||
               (deskItem.type === ItemType.PLATE && heldItem.type === ItemType.INGREDIENT)) {
        const plateId = heldItem.type === ItemType.PLATE ? heldItem.id : deskItem.id;
        const ingredientId = heldItem.type === ItemType.INGREDIENT ? heldItem.id : deskItem.id;
        const ingredient = this.itemManager.getItem(ingredientId);
        
        // 检查食材状态并给出具体提示
        if (ingredient?.state === ItemState.FROZEN) {
          const ingredientName = this.getIngredientName(ingredient.ingredientType);
          this.showInteractionFeedback(`${ingredientName}未解冻，不能放到盘子上`, deskGrid);
          return;
        } else if (ingredient?.state === ItemState.THAWING) {
          const ingredientName = this.getIngredientName(ingredient.ingredientType);
          this.showInteractionFeedback(`${ingredientName}正在解冻中，请等待完成`, deskGrid);
          return;
        } else if (ingredient?.state !== ItemState.THAWED) {
          const ingredientName = this.getIngredientName(ingredient?.ingredientType);
          this.showInteractionFeedback(`${ingredientName}状态异常，无法装盘`, deskGrid);
          return;
        }
        
        // 使用新的渐进式组合方法（允许自由装盘）
        if (this.itemManager.addIngredientToPlate(plateId, ingredientId)) {
          const plate = this.itemManager.getItem(plateId);
          
          // 更新玩家手持物品
          this.player.dropItem();
          this.player.pickUpItem(plate!);
          this.mapManager.removeItem(deskGrid.x, deskGrid.y);
          
          // 根据盘子状态显示反馈
          if (plate?.type === ItemType.DISH) {
            this.showInteractionFeedback(`菜品完成：${this.getItemName(plate)}`, deskGrid);
          } else {
            const ingredientName = this.getIngredientName(ingredient?.ingredientType);
            this.showInteractionFeedback(`食材已添加：${ingredientName}`, deskGrid);
          }
        } else {
          this.showInteractionFeedback('无法添加食材到盘子', deskGrid);
        }
      } else {
        // 根据具体情况给出详细的提示
        this.showDetailedCombinationFeedback(heldItem, deskItem, deskGrid);
      }
    } else {
      this.showInteractionFeedback('桌面是空的', deskGrid);
    }
  }

  // 处理上菜交互
  private handleServingInteraction(): void {
    const heldItem = this.player.getHeldItem();
    
    if (!heldItem) {
      this.showInteractionFeedback('手里没有物品可以上菜', { x: 18, y: 13 });
      return;
    }

    // 上菜任何物品，出餐口"吞掉"物品
    const itemToServe = this.player.dropItem()!;
    
    // 检查是否为完成的菜品且匹配订单
    if (heldItem.type === ItemType.DISH && heldItem.dishType && 
        this.orderManager.hasMatchingOrder(heldItem.dishType)) {
      // 上菜成功
      const orderCompleted = this.orderManager.completeOrder(heldItem.dishType);
      if (orderCompleted) {
        this.showServeResult('✅ 订单完成！', true);
        // 20秒后生成脏盘子到洗碗池
        this.scheduleDelayedDirtyPlate(20000);
      }
    } else {
      // 上错菜，扣分
      this.updateScore(-50); // 扣除50分
      this.showServeResult('❌ 上错菜！(-50分)', false);
      
      // 如果上错的菜品包含盘子，3秒后生成脏盘子到洗碗池
      if (this.itemContainsPlate(itemToServe)) {
        this.scheduleDelayedDirtyPlate(3000);
      }
    }
    
    // 物品被出餐口"吞掉"，不需要返还给玩家
  }

  // 第四阶段：处理洗碗池交互（只处理放入脏盘子）
  private handleDishwasherInteraction(dishwasherGrid: { x: number; y: number }): void {
    const heldItem = this.player.getHeldItem();
    const dishwasherItem = this.mapManager.getDishwasherItem(dishwasherGrid.x, dishwasherGrid.y);

    // 情况1：玩家手里有脏盘子，想放入洗碗池
    if (heldItem && heldItem.type === ItemType.DIRTY_PLATE && !dishwasherItem) {
      const dirtyPlate = this.player.dropItem()!;
      this.mapManager.placeDishwasherItem(dishwasherGrid.x, dishwasherGrid.y, dirtyPlate);
      this.showInteractionFeedback('脏盘子放入洗碗池', dishwasherGrid);
      return;
    }

    // 情况2：洗碗池是空的
    if (!dishwasherItem) {
      this.showInteractionFeedback('洗碗池是空的', dishwasherGrid);
      return;
    }

    // 情况3：其他情况
    if (heldItem && dishwasherItem) {
      this.showInteractionFeedback('洗碗池已有物品', dishwasherGrid);
      return;
    }

    if (heldItem && heldItem.type !== ItemType.DIRTY_PLATE) {
      this.showInteractionFeedback('只能放入脏盘子', dishwasherGrid);
      return;
    }

    // 情况4：洗碗池有脏盘子，但这里不处理洗碗（由handleContinuousWashing处理）
    if (!heldItem && dishwasherItem && dishwasherItem.type === ItemType.DIRTY_PLATE) {
      this.showInteractionFeedback('按住操作键开始洗碗', dishwasherGrid);
      return;
    }
  }

  // 处理持续洗碗逻辑
  private handleContinuousWashing(): void {
    const facingGrid = this.player.getFacingGridPosition();
    const facingTile = this.mapManager.getTile(facingGrid.x, facingGrid.y);
    
    // 检查是否面向洗碗池
    if (facingTile && facingTile.type === TileType.DISHWASHER) {
      const dishwasherItem = this.mapManager.getDishwasherItem(facingGrid.x, facingGrid.y);
      const heldItem = this.player.getHeldItem();
      
      // 只有空手且洗碗池有脏盘子时才能洗碗
      if (!heldItem && dishwasherItem && dishwasherItem.type === ItemType.DIRTY_PLATE) {
        if (this.inputManager.isInteractHeld()) {
          // 持续按住操作键，继续洗碗
          this.plateManager.continuousWashing();
        } else {
          // 没有按住操作键，停止洗碗
          this.plateManager.stopWashing();
        }
      }
    } else {
      // 不面向洗碗池，停止洗碗
      this.plateManager.stopWashing();
    }
  }

  // 处理食材获取交互
  private handleIngredientInteraction(ingredientType: IngredientType, ingredientGrid: { x: number; y: number }): void {
    if (this.player.isHoldingItem()) {
      this.showInteractionFeedback('手中已有物品，无法拾取食材', ingredientGrid);
      return;
    }

    // 创建新的冷冻食材
    const ingredient = this.itemManager.createIngredient(ingredientType, ItemLocation.PLAYER_HAND);
    this.player.pickUpItem(ingredient);
    
    const ingredientName = this.getIngredientName(ingredientType);
    this.showInteractionFeedback(`获取：${ingredientName}（冷冻）`, ingredientGrid);
  }

  private showInteractionFeedback(deviceName: string, gridPos: { x: number; y: number }): void {
    const worldPos = this.mapManager.gridToWorld(gridPos.x, gridPos.y);
    
    // 显示交互反馈文字
    const feedbackText = this.add.text(worldPos.x, worldPos.y - 30, `✓ ${deviceName}`, {
      fontSize: '14px',
      color: '#27ae60',
      backgroundColor: '#ffffff',
      padding: { x: 6, y: 2 }
    }).setOrigin(0.5);

    // 1秒后淡出并销毁文字
    this.tweens.add({
      targets: feedbackText,
      alpha: 0,
      y: worldPos.y - 50,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        feedbackText.destroy();
      }
    });
  }

  // 检查物品是否包含盘子
  private itemContainsPlate(item: any): boolean {
    // 如果是盘子本身
    if (item.type === ItemType.PLATE) return true;
    
    // 如果是菜品（菜品通常是用盘子装的）
    if (item.type === ItemType.DISH) return true;
    
    // 如果是有items数组的盘子（装了食材的盘子）
    if (item.items && Array.isArray(item.items)) return true;
    
    return false;
  }

  // 延迟生成脏盘子到洗碗池
  private scheduleDelayedDirtyPlate(delay: number): void {
    this.time.delayedCall(delay, () => {
      this.plateManager.addDirtyPlateToSink();
      console.log(`${delay/1000}秒后，脏盘子出现在洗碗池`);
    });
  }

  // 根据具体情况给出详细的组合反馈
  private showDetailedCombinationFeedback(heldItem: any, deskItem: any, deskGrid: { x: number; y: number }): void {
    // 情况1: 两个都是食材
    if (heldItem.type === ItemType.INGREDIENT && deskItem.type === ItemType.INGREDIENT) {
      this.showInteractionFeedback('食材不能直接组合，需要先用盘子', deskGrid);
      return;
    }
    
    // 情况2: 两个都是盘子
    if (heldItem.type === ItemType.PLATE && deskItem.type === ItemType.PLATE) {
      this.showInteractionFeedback('不能将盘子放在另一个盘子上', deskGrid);
      return;
    }
    
    // 情况3: 两个都是菜品
    if (heldItem.type === ItemType.DISH && deskItem.type === ItemType.DISH) {
      this.showInteractionFeedback('不能将菜品放在另一个菜品上', deskGrid);
      return;
    }
    
    // 情况4: 菜品和食材
    if ((heldItem.type === ItemType.DISH && deskItem.type === ItemType.INGREDIENT) ||
        (heldItem.type === ItemType.INGREDIENT && deskItem.type === ItemType.DISH)) {
      this.showInteractionFeedback('已完成的菜品不能再添加食材', deskGrid);
      return;
    }
    
    // 情况5: 菜品和盘子
    if ((heldItem.type === ItemType.DISH && deskItem.type === ItemType.PLATE) ||
        (heldItem.type === ItemType.PLATE && deskItem.type === ItemType.DISH)) {
      this.showInteractionFeedback('已完成的菜品不需要额外的盘子', deskGrid);
      return;
    }
    
    // 情况6: 脏盘子相关
    if (heldItem.type === ItemType.DIRTY_PLATE || deskItem.type === ItemType.DIRTY_PLATE) {
      this.showInteractionFeedback('脏盘子需要先到洗碗池清洗', deskGrid);
      return;
    }
    
    // 情况7: 其他未知组合
    const heldItemName = this.getItemName(heldItem);
    const deskItemName = this.getItemName(deskItem);
    this.showInteractionFeedback(`${heldItemName}和${deskItemName}无法组合`, deskGrid);
  }

  private createUI(): void {
    // 实时更新玩家状态和分数，通过操作DOM元素而非游戏内文本
    this.time.addEvent({
      delay: 100,
      callback: () => {
        // 更新分数
        const scoreElement = document.getElementById('score-display');
        if (scoreElement) {
          scoreElement.textContent = `分数: ${this.score}`;
        }
        
        // 第四阶段：更新盘子数量显示
        const cleanPlatesElement = document.getElementById('clean-plates');
        if (cleanPlatesElement) {
          cleanPlatesElement.textContent = `干净盘子: ${this.plateManager.getCleanPlateCount()}`;
        }
        
        const dirtyPlatesElement = document.getElementById('dirty-plates');
        if (dirtyPlatesElement) {
          dirtyPlatesElement.textContent = `脏盘子: ${this.plateManager.getDirtyPlateCount()}`;
        }
        
        // 更新游戏计时器（在createUI中调用，所以这里也需要更新）
        if (this.isGameActive) {
          this.updateTimerUI();
        }
        
        // 更新玩家状态
        const playerGrid = this.player.getGridPosition();
        const facingGrid = this.player.getFacingGridPosition();
        const facingTile = this.mapManager.getTile(facingGrid.x, facingGrid.y);
        const heldItem = this.player.getHeldItem();
        
        // 更新位置信息
        const positionElement = document.getElementById('position-info');
        if (positionElement) {
          positionElement.textContent = `位置: (${playerGrid.x}, ${playerGrid.y})`;
        }
        
        // 更新面向信息
        const facingElement = document.getElementById('facing-info');
        if (facingElement) {
          facingElement.textContent = `面向: ${this.getDirectionText(this.player.getFacingDirection())}`;
        }
        
        // 更新面向格子信息
        const facingTileElement = document.getElementById('facing-tile-info');
        if (facingTileElement) {
          facingTileElement.textContent = `面向格子: ${facingTile ? this.getTileTypeText(facingTile.type) : '边界外'}`;
        }
        
        // 更新手持物品信息
        const heldItemElement = document.getElementById('held-item-info');
        if (heldItemElement) {
          heldItemElement.innerHTML = this.getDetailedHeldItemInfo(heldItem);
        }
      },
      loop: true
    });
  }

  private getDirectionText(direction: any): string {
    switch (direction) {
      case 'up': return '↑ 上';
      case 'down': return '↓ 下';
      case 'left': return '← 左';
      case 'right': return '→ 右';
      default: return '?';
    }
  }

  private getTileTypeText(tileType: TileType): string {
    switch (tileType) {
      case TileType.FLOOR: return '地面';
      case TileType.DESK: return '桌面';
      case TileType.MICROWAVE: return '微波炉';
      case TileType.DISHWASHER: return '洗碗池';
      case TileType.SERVING: return '出餐口';
      case TileType.INGREDIENT: return '食材';
      default: return '未知';
    }
  }

  private getIngredientName(ingredientType?: IngredientType | string): string {
    if (!ingredientType) return '未知食材';
    
    // 处理字符串类型的ingredientType
    const typeKey = typeof ingredientType === 'string' ? ingredientType : ingredientType;
    
    const names: { [key: string]: string } = {
      'HUANG_MI_GAOOU': '黄米糕坯',
      'huang_mi_gaoou': '黄米糕坯',
      'MANTOU': '小馒头',
      'mantou': '小馒头',
      'XIBEI_MIANJIN': '西贝面筋',
      'xibei_mianjin': '西贝面筋',
      'FANQIE_NIUROU': '番茄牛腩',
      'fanqie_niurou': '番茄牛腩',
      'RICE': '米饭',
      'rice': '米饭',
      'MANGYUE_SAUCE': '蔓越莓酱',
      'mangyue_sauce': '蔓越莓酱',
      'SEASONING_SAUCE': '调味汁',
      'seasoning_sauce': '调味汁',
      'SOUP_PACK': '汤包',
      'soup_pack': '汤包',
      'NOODLES': '挂面',
      'noodles': '挂面',
      'TOPPINGS': '浇头',
      'toppings': '浇头',
      'SIDE_DISHES': '小菜',
      'side_dishes': '小菜',
      'BEEF_BONE': '牛大骨',
      'beef_bone': '牛大骨',
      'YOUMIAN_YUYU': '莜面鱼鱼',
      'youmian_yuyu': '莜面鱼鱼',
      'GREEN_VEG': '青菜',
      'green_veg': '青菜',
      'BRAISED_CHICKEN': '黄焖鸡',
      'braised_chicken': '黄焖鸡'
    };
    
    return names[typeKey] || '未知食材';
  }

  // 第三阶段：游戏计时器相关方法
  private startGameTimer(): void {
    this.gameStartTime = this.time.now;
    this.gameTimeRemaining = this.gameTimeLimit;
    console.log('🎮 游戏开始！时间限制：3分钟');
  }

  private updateGameTimer(currentTime: number): void {
    const elapsedTime = currentTime - this.gameStartTime;
    this.gameTimeRemaining = Math.max(0, this.gameTimeLimit - elapsedTime);
    
    // 更新倒计时UI
    this.updateTimerUI();
    
    // 检查游戏是否结束
    if (this.gameTimeRemaining <= 0 && this.isGameActive) {
      this.endGame();
    }
  }

  private updateTimerUI(): void {
    const timerElement = document.getElementById('game-timer');
    if (timerElement) {
      const minutes = Math.floor(this.gameTimeRemaining / 60000);
      const seconds = Math.floor((this.gameTimeRemaining % 60000) / 1000);
      timerElement.textContent = `时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // 时间紧张时改变颜色
      if (this.gameTimeRemaining < 30000) { // 最后30秒
        timerElement.style.color = '#e74c3c';
      } else if (this.gameTimeRemaining < 60000) { // 最后1分钟
        timerElement.style.color = '#f39c12';
      } else {
        timerElement.style.color = '#27ae60';
      }
    }
  }

  private endGame(): void {
    this.isGameActive = false;
    console.log('🏁 游戏结束！');
    console.log(`📊 最终分数：${this.score}`);
    
    // 显示游戏结束界面
    this.showGameEndUI();
  }

  private showGameEndUI(): void {
    // 创建游戏结束遮罩
    const gameEndOverlay = document.createElement('div');
    gameEndOverlay.id = 'game-end-overlay';
    gameEndOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.5s ease-out;
    `;

    // 创建结算面板
    const endPanel = document.createElement('div');
    endPanel.style.cssText = `
      background-color: #34495e;
      border: 3px solid #3498db;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      color: #ecf0f1;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
      animation: slideInUp 0.5s ease-out;
    `;

    // 计算星级评价
    const stars = this.calculateStars(this.score);
    const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    endPanel.innerHTML = `
      <h2 style="color: #3498db; margin: 0 0 20px 0; font-size: 24px;">🏁 游戏结束！</h2>
      <div style="font-size: 48px; color: #e74c3c; margin: 20px 0;">${this.score}</div>
      <div style="font-size: 18px; margin: 10px 0;">最终分数</div>
      <div style="font-size: 32px; margin: 20px 0;">${starDisplay}</div>
      <div style="font-size: 14px; color: #bdc3c7; margin: 20px 0;">
        ${this.getScoreComment(this.score)}
      </div>
      <button id="restart-btn" style="
        background-color: #27ae60;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        border-radius: 8px;
        cursor: pointer;
        margin: 10px;
        transition: background-color 0.3s;
      ">🔄 重新开始</button>
      <button id="menu-btn" style="
        background-color: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        border-radius: 8px;
        cursor: pointer;
        margin: 10px;
        transition: background-color 0.3s;
      ">📋 主菜单</button>
    `;

    // 添加按钮事件
    gameEndOverlay.appendChild(endPanel);
    document.body.appendChild(gameEndOverlay);

    // 重新开始按钮
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.restartGame();
      });
      restartBtn.addEventListener('mouseenter', () => {
        restartBtn.style.backgroundColor = '#2ecc71';
      });
      restartBtn.addEventListener('mouseleave', () => {
        restartBtn.style.backgroundColor = '#27ae60';
      });
    }

    // 主菜单按钮（暂时也是重新开始）
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        this.restartGame();
      });
      menuBtn.addEventListener('mouseenter', () => {
        menuBtn.style.backgroundColor = '#7f8c8d';
      });
      menuBtn.addEventListener('mouseleave', () => {
        menuBtn.style.backgroundColor = '#95a5a6';
      });
    }

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideInUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  private calculateStars(score: number): number {
    if (score >= 800) return 3;
    if (score >= 400) return 2;
    if (score >= 100) return 1;
    return 0;
  }

  private getScoreComment(score: number): string {
    if (score >= 1000) return '🏆 预制菜大师！完美的厨房管理！';
    if (score >= 800) return '👨‍🍳 优秀厨师！效率很高！';
    if (score >= 600) return '👍 不错的表现！继续努力！';
    if (score >= 400) return '😊 还可以，多练习会更好！';
    if (score >= 200) return '🤔 需要提高效率哦！';
    return '😅 多熟悉一下流程吧！';
  }

  private restartGame(): void {
    // 移除游戏结束UI
    const overlay = document.getElementById('game-end-overlay');
    if (overlay) {
      overlay.remove();
    }

    // 重置游戏状态
    this.score = 0;
    this.isGameActive = true;
    this.gameTimeRemaining = this.gameTimeLimit;
    this.gameStartTime = this.time.now;

    // 重置订单管理器
    this.orderManager = new OrderManager(this);

    // 重置物品管理器
    this.itemManager = new ItemManager(this);

    // 第四阶段：重置盘子管理器
    this.plateManager.reset();

    // 重新渲染地图和初始物品
    this.mapManager.renderMap();
    this.createInitialPlates();
    this.createInitialPreparedFood();

    // 重置玩家位置
    this.player.resetToGridPosition(7, 7);

    console.log('🔄 游戏重新开始！');
  }

  // 获取物品名称
  private getItemName(item: any): string {
    if (item.type === 'ingredient' && item.ingredientType) {
      const baseName = this.getIngredientName(item.ingredientType);
      switch (item.state) {
        case 'frozen': return `${baseName}（冷冻）`;
        case 'thawing': 
          // 显示解冻进度百分比
          const percentage = item.thawProgress ? Math.floor(item.thawProgress * 100) : 0;
          return `${baseName}（解冻中 ${percentage}%）`;
        case 'thawed': return `${baseName}（已解冻）`;
        default: return baseName;
      }
    } else if (item.type === 'plate') {
      return '碟子';
    } else if (item.type === 'dish') {
      return `完成的${this.getIngredientName(item.ingredientType)}`;
    }
    return '未知物品';
  }

  // 显示上菜结果
  private showServeResult(message: string, success: boolean): void {
    const servingPos = this.mapManager.gridToWorld(18, 13);
    const color = success ? '#27ae60' : '#e74c3c';
    
    const feedbackText = this.add.text(servingPos.x, servingPos.y - 40, message, {
      fontSize: '12px',
      color: color,
      backgroundColor: '#ffffff',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: feedbackText,
      alpha: 0,
      y: servingPos.y - 70,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        feedbackText.destroy();
      }
    });
  }

  // 创建初始碟子
  private createInitialPlates(): void {
    // 在几个桌面上放置碟子
    const platePositions = [
      { x: 2, y: 2 },   // 左上桌面
      { x: 15, y: 2 },  // 右上桌面
      { x: 9, y: 6 }    // 中央工作岛
    ];

    platePositions.forEach(pos => {
      if (this.mapManager.canPlaceItem(pos.x, pos.y)) {
        const plate = this.itemManager.createPlate(ItemLocation.ON_DESK, pos);
        this.mapManager.placeItem(pos.x, pos.y, plate);
      }
    });
  }

  // 创建初始预制菜
  private createInitialPreparedFood(): void {
    // 在桌面上放置一些初始的冷冻预制菜（蓝色方块）
    const foodPositions = [
      { x: 3, y: 2, type: IngredientType.HUANG_MI_GAOOU },  // 左上桌面 - 黄米凉糕
      { x: 16, y: 2, type: IngredientType.MANTOU },         // 右上桌面 - 小馒头
      { x: 10, y: 6, type: IngredientType.FANQIE_NIUROU },  // 中央工作岛 - 番茄牛腩
      { x: 3, y: 11, type: IngredientType.RICE },           // 左下桌面 - 米饭
    ];

    foodPositions.forEach(pos => {
      if (this.mapManager.canPlaceItem(pos.x, pos.y)) {
        const ingredient = this.itemManager.createIngredient(pos.type, ItemLocation.ON_DESK, pos);
        this.mapManager.placeItem(pos.x, pos.y, ingredient);
      }
    });

    console.log('在桌面上放置了4个初始预制菜（冷冻状态）');
  }

  // 更新微波炉进度条UI
  private updateMicrowaveUI(): void {
    const microwavePos = { x: 1, y: 1 }; // 微波炉位置
    
    // 检查微波炉是否有物品
    const microwaveItem = this.itemManager.getItemAtPosition(microwavePos.x, microwavePos.y);
    
    if (microwaveItem && microwaveItem.state === 'thawing') {
      // 有物品在解冻，显示/更新进度条
      if (this.microwaveProgressUI) {
        // 销毁旧的进度条
        this.microwaveProgressUI.destroy();
      }
      
      // 创建新的进度条
      this.microwaveProgressUI = this.itemManager.renderMicrowaveUI(microwavePos.x, microwavePos.y);
    } else {
      // 没有物品在解冻，隐藏进度条
      if (this.microwaveProgressUI) {
        this.microwaveProgressUI.destroy();
        this.microwaveProgressUI = null;
      }
    }
  }

  // 第四阶段：更新洗碗池进度条UI
  private updateDishwasherUI(): void {
    // 查找正在清洗的盘子
    const washingPlates = this.plateManager.getWashingPlates();
    
    if (washingPlates.length > 0 && !this.dishwasherProgressUI) {
      // 创建进度条UI
      const dishwasherPos = this.mapManager.gridToWorld(18, 1);
      this.dishwasherProgressUI = this.add.container(dishwasherPos.x, dishwasherPos.y - 30);
      
      // 背景条
      const bgBar = this.add.rectangle(0, 0, 60, 8, 0x7f8c8d);
      this.dishwasherProgressUI.add(bgBar);
      
      // 进度条（紫色）
      const progressBar = this.add.rectangle(-30, 0, 0, 6, 0x8e44ad);
      progressBar.setOrigin(0, 0.5);
      this.dishwasherProgressUI.add(progressBar);
      
      // 标签
      const label = this.add.text(0, -15, '洗碗中...', {
        fontSize: '10px',
        color: '#2c3e50'
      }).setOrigin(0.5);
      this.dishwasherProgressUI.add(label);
    }
    
    if (this.dishwasherProgressUI && washingPlates.length > 0) {
      // 更新进度条
      const plate = washingPlates[0];
      const progress = plate.washProgress || 0;
      const progressBar = this.dishwasherProgressUI.list[1] as Phaser.GameObjects.Rectangle;
      progressBar.width = 60 * progress;
      
      // 更新标签
      const label = this.dishwasherProgressUI.list[2] as Phaser.GameObjects.Text;
      const remainingTime = Math.ceil((1 - progress) * 3);
      label.setText(`洗碗中... ${remainingTime}s`);
    }
    
    if (this.dishwasherProgressUI && washingPlates.length === 0) {
      // 销毁进度条UI
      this.dishwasherProgressUI.destroy();
      this.dishwasherProgressUI = null;
    }
  }

  // 更新分数（供OrderManager调用）
  updateScore(points: number): void {
    this.score += points;
    console.log(`分数变化: ${points > 0 ? '+' : ''}${points} (总分: ${this.score})`);
  }

  // 获取ItemManager实例（供OrderManager调用）
  getItemManager(): ItemManager {
    return this.itemManager;
  }


  // 获取详细的手持物品信息
  private getDetailedHeldItemInfo(heldItem: any): string {
    if (!heldItem) {
      return '手持物品: 无';
    }

    let itemInfo = `手持物品: ${this.getItemName(heldItem)}`;

    // 如果是盘子，显示盘子上的食材
    if (heldItem.type === 'plate') {
      const plateIngredients = this.getPlateIngredients(heldItem);
      if (plateIngredients.length > 0) {
        const ingredientNames = plateIngredients.map(ing => this.getIngredientDisplayName(ing));
        itemInfo += `<br><span style="color: #3498db; font-size: 11px;">盘子上有: ${ingredientNames.join(' + ')}</span>`;
        
        // 检查是否可以组成某个菜品
        const possibleDish = this.checkPossibleDish(plateIngredients);
        if (possibleDish) {
          itemInfo += `<br><span style="color: #27ae60; font-size: 11px;">✅ 可制作: ${possibleDish}</span>`;
        } else {
          itemInfo += `<br><span style="color: #95a5a6; font-size: 11px;">💡 可继续添加食材</span>`;
        }
      } else {
        itemInfo += `<br><span style="color: #95a5a6; font-size: 11px;">空盘子</span>`;
      }
    }
    // 如果是食材，显示食材状态
    else if (heldItem.type === 'ingredient') {
      const stateText = this.getIngredientStateText(heldItem.state);
      const stateColor = heldItem.state === 'thawed' ? '#27ae60' : 
                        heldItem.state === 'thawing' ? '#f39c12' : '#3498db';
      itemInfo += `<br><span style="color: ${stateColor}; font-size: 11px;">状态: ${stateText}</span>`;
      
      if (heldItem.state === 'thawing' && heldItem.thawProgress !== undefined) {
        const progress = Math.round(heldItem.thawProgress * 100);
        itemInfo += `<br><span style="color: #f39c12; font-size: 11px;">解冻进度: ${progress}%</span>`;
      }
    }
    // 如果是完成的菜品
    else if (heldItem.type === 'dish') {
      itemInfo += `<br><span style="color: #27ae60; font-size: 11px;">✅ 已完成的菜品</span>`;
      itemInfo += `<br><span style="color: #e74c3c; font-size: 11px;">🚚 可送到出餐口</span>`;
    }

    return itemInfo;
  }

  // 获取盘子上的食材列表
  private getPlateIngredients(plate: any): any[] {
    // 根据Item接口，组合物品存储在items字段中
    if (plate.items && Array.isArray(plate.items)) {
      return plate.items.filter((item: any) => item.type === 'ingredient');
    }
    return [];
  }

  // 检查食材组合是否能制作某个菜品
  private checkPossibleDish(ingredients: any[]): string | null {
    if (ingredients.length === 0) return null;
    
    // 获取所有订单的配方
    const currentOrders = this.orderManager.getCurrentOrders();
    for (const order of currentOrders) {
      const recipe = this.orderManager.getRecipeByType(order.dishType);
      if (recipe && this.ingredientsMatch(ingredients, recipe.ingredients)) {
        return recipe.name;
      }
    }
    return null;
  }

  // 检查食材是否匹配配方
  private ingredientsMatch(plateIngredients: any[], requiredIngredients: any[]): boolean {
    if (plateIngredients.length !== requiredIngredients.length) return false;
    
    const plateTypes = plateIngredients.map(ing => ing.ingredientType || ing).sort();
    const requiredTypes = requiredIngredients.sort();
    
    return JSON.stringify(plateTypes) === JSON.stringify(requiredTypes);
  }

  // 获取食材显示名称
  private getIngredientDisplayName(ingredient: any): string {
    const type = ingredient.ingredientType || ingredient;
    return this.getIngredientName(type);
  }


  // 获取食材状态文字
  private getIngredientStateText(state: string): string {
    const states: { [key: string]: string } = {
      'frozen': '冷冻',
      'thawing': '解冻中',
      'thawed': '已解冻'
    };
    return states[state] || state;
  }
}