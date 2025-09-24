import { InputManager } from '../managers/InputManager';
import { MapManager } from '../managers/MapManager';
import { ItemManager } from '../managers/ItemManager';
import { Player } from '../entities/Player';
import { TileType, IngredientType, ItemType, ItemLocation } from '../types';

export class MainScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private mapManager!: MapManager;
  private itemManager!: ItemManager;
  private player!: Player;
  private gameWidth: number = 800;
  private gameHeight: number = 600;
  private lastMoveTime: number = 0;
  private moveDelay: number = 200; // 移动输入间隔，防止过于灵敏
  private score: number = 0;

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
    
    // 渲染地图
    this.mapManager.renderMap();

    // 在安全的地面位置创建玩家角色（起始位置：网格坐标7,7 - 确保是地面）
    this.player = new Player(this, this.mapManager, 7, 7);

    // 初始化输入管理器
    this.inputManager = new InputManager(this);

    // 创建一些初始碟子在桌面上
    this.createInitialPlates();

    // 添加UI文本显示控制说明和状态
    this.createUI();

    console.log('MVP-1: 主场景创建完成');
    console.log('- 使用 WASD 或方向键移动');
    console.log('- 使用 空格键 与面向的设备交互');
  }

  update(): void {
    const currentTime = this.time.now;
    
    // 更新物品系统（解冻进度等）
    this.itemManager.updateThawing();
    
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
      case TileType.SINK:
        console.log('洗碗池功能暂未实现');
        this.showInteractionFeedback('洗碗池（暂未实现）', facingGrid);
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
      // 尝试组合物品（碟子+解冻食材）
      if (this.itemManager.canCombineItems(heldItem.id, deskItem.id)) {
        const plateId = heldItem.type === ItemType.PLATE ? heldItem.id : deskItem.id;
        const ingredientId = heldItem.type === ItemType.INGREDIENT ? heldItem.id : deskItem.id;
        
        const dish = this.itemManager.createDish(plateId, ingredientId);
        if (dish) {
          this.player.dropItem();
          this.player.pickUpItem(dish);
          this.mapManager.removeItem(deskGrid.x, deskGrid.y);
          this.showInteractionFeedback(`组装完成：${this.getItemName(dish)}`, deskGrid);
        }
      } else {
        this.showInteractionFeedback('无法组合这些物品', deskGrid);
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

    // 玩家放下手里的物品并尝试上菜
    const itemToServe = this.player.dropItem()!;
    const result = this.itemManager.serveItem(itemToServe.id);
    
    // 更新分数
    this.score += result.score;
    
    this.showServeResult(result.message, result.success);
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
          heldItemElement.textContent = `手持物品: ${heldItem ? this.getItemName(heldItem) : '无'}`;
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
      case TileType.SINK: return '洗碗池';
      case TileType.SERVING: return '出餐口';
      case TileType.INGREDIENT: return '食材';
      default: return '未知';
    }
  }

  private getIngredientName(ingredientType?: IngredientType): string {
    if (!ingredientType) return '未知食材';
    
    switch (ingredientType) {
      case IngredientType.HUANG_MI_GAOOU: return '黄米凉糕';
      case IngredientType.MANTOU: return '小馒头';
      case IngredientType.XIBEI_MIANJIN: return '西贝面筋';
      case IngredientType.FANQIE_NIUROU: return '番茄牛腩';
      case IngredientType.RICE: return '米饭';
      default: return '未知食材';
    }
  }

  // 获取物品名称
  private getItemName(item: any): string {
    if (item.type === 'ingredient' && item.ingredientType) {
      const baseName = this.getIngredientName(item.ingredientType);
      switch (item.state) {
        case 'frozen': return `${baseName}（冷冻）`;
        case 'thawing': return `${baseName}（解冻中）`;
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
}