import { Position, Direction, Item } from '../types';
import { MapManager } from '../managers/MapManager';

export class Player extends Phaser.GameObjects.Rectangle {
  private mapManager: MapManager;
  private isMoving: boolean = false;
  private facingDirection: Direction = Direction.DOWN;
  private heldItem: Item | null = null;  // 手持的物品
  private heldItemSprite: Phaser.GameObjects.Container | null = null;  // 手持物品的精灵

  constructor(scene: Phaser.Scene, mapManager: MapManager, gridX: number, gridY: number) {
    const worldPos = mapManager.gridToWorld(gridX, gridY);
    
    // 创建30x30的红色方块作为玩家角色（稍小以适配格子）
    super(scene, worldPos.x, worldPos.y, 30, 30, 0xe74c3c);
    
    this.mapManager = mapManager;
    
    // 添加到场景
    scene.add.existing(this);
    
    // 启用物理
    scene.physics.add.existing(this);
    
    // 设置物理体
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      // 设置较小的碰撞体
      body.setSize(25, 25);
    }
  }

  public tryMove(direction: Direction): void {
    if (this.isMoving) return;

    const currentGrid = this.mapManager.worldToGrid(this.x, this.y);
    let targetGrid = { ...currentGrid };

    // 计算目标网格位置
    switch (direction) {
      case Direction.UP:
        targetGrid.y -= 1;
        break;
      case Direction.DOWN:
        targetGrid.y += 1;
        break;
      case Direction.LEFT:
        targetGrid.x -= 1;
        break;
      case Direction.RIGHT:
        targetGrid.x += 1;
        break;
    }

    // 更新面向方向
    this.facingDirection = direction;

    // 检查目标位置是否可行走
    if (this.mapManager.isWalkable(targetGrid.x, targetGrid.y)) {
      this.moveToGrid(targetGrid.x, targetGrid.y);
    }
  }

  private moveToGrid(gridX: number, gridY: number): void {
    this.isMoving = true;
    const targetPos = this.mapManager.gridToWorld(gridX, gridY);
    
    // 使用补间动画平滑移动到目标位置
    this.scene.tweens.add({
      targets: this,
      x: targetPos.x,
      y: targetPos.y,
      duration: 250,  // 移动时间
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
        // 移动完成后更新手持物品的位置
        this.updateHeldItemPosition();
      }
    });
  }

  public stop(): void {
    // 网格移动模式下不需要手动停止
    // 移动会自动在到达目标格子后停止
  }

  public getPosition(): Position {
    return {
      x: this.x,
      y: this.y
    };
  }

  public getGridPosition(): Position {
    return this.mapManager.worldToGrid(this.x, this.y);
  }

  public getFacingDirection(): Direction {
    return this.facingDirection;
  }

  public isCurrentlyMoving(): boolean {
    return this.isMoving;
  }

  // 获取面向的格子位置
  public getFacingGridPosition(): Position {
    const currentGrid = this.getGridPosition();
    let facingGrid = { ...currentGrid };

    switch (this.facingDirection) {
      case Direction.UP:
        facingGrid.y -= 1;
        break;
      case Direction.DOWN:
        facingGrid.y += 1;
        break;
      case Direction.LEFT:
        facingGrid.x -= 1;
        break;
      case Direction.RIGHT:
        facingGrid.x += 1;
        break;
    }

    return facingGrid;
  }

  // 拾取物品
  public pickUpItem(item: Item): boolean {
    if (this.heldItem) {
      console.log('手中已有物品，无法拾取');
      return false;
    }

    this.heldItem = item;
    this.createHeldItemSprite();
    console.log(`拾取了物品: ${this.getItemDisplayName(item)}`);
    return true;
  }

  // 放下物品
  public dropItem(): Item | null {
    if (!this.heldItem) return null;

    const item = this.heldItem;
    this.heldItem = null;
    
    // 销毁手持物品精灵
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }

    console.log(`放下了物品: ${this.getItemDisplayName(item)}`);
    return item;
  }

  // 获取手持的物品
  public getHeldItem(): Item | null {
    return this.heldItem;
  }

  // 是否持有物品
  public isHoldingItem(): boolean {
    return this.heldItem !== null;
  }

  // 创建手持物品的精灵
  private createHeldItemSprite(): void {
    if (!this.heldItem || this.heldItemSprite) return;

    // 创建容器来显示手持物品
    this.heldItemSprite = this.scene.add.container(0, 0);
    
    // 根据物品类型创建不同的视觉表现
    let color: number;
    let size: number = 15; // 手持物品稍小

    if (this.heldItem.type === 'ingredient') {
      color = this.getIngredientColor(this.heldItem.ingredientType!);
    } else if (this.heldItem.type === 'plate') {
      color = 0xffffff; // 白色碟子
      size = 18;
    } else {
      color = 0x888888;
    }

    // 创建圆形表示
    const circle = this.scene.add.circle(0, 0, size / 2, color);
    circle.setStrokeStyle(1, 0x333333);
    this.heldItemSprite.add(circle);

    // 添加状态指示器
    if (this.heldItem.type === 'ingredient') {
      const stateColor = this.getStateColor(this.heldItem.state);
      const stateIndicator = this.scene.add.circle(size / 2 - 2, -size / 2 + 2, 2, stateColor);
      this.heldItemSprite.add(stateIndicator);
    }

    this.updateHeldItemPosition();
  }

  // 更新手持物品的位置
  private updateHeldItemPosition(): void {
    if (!this.heldItemSprite) return;

    // 物品显示在玩家上方偏右
    this.heldItemSprite.setPosition(this.x + 12, this.y - 12);
  }

  // 更新手持物品状态（如解冻进度）
  public updateHeldItemDisplay(): void {
    if (!this.heldItem || !this.heldItemSprite || this.heldItemSprite.list.length < 2) return;

    // 更新状态指示器
    if (this.heldItem.type === 'ingredient' && this.heldItemSprite.list.length > 1) {
      const stateIndicator = this.heldItemSprite.list[1] as Phaser.GameObjects.Arc;
      stateIndicator.fillColor = this.getStateColor(this.heldItem.state);
    }
  }

  // 获取食材颜色
  private getIngredientColor(ingredientType: string): number {
    switch (ingredientType) {
      case 'huang_mi_gaoou': return 0xFFD700; // 金色
      case 'mantou': return 0xF5DEB3; // 小麦色
      case 'xibei_mianjin': return 0xDEB887; // 淡棕色
      case 'fanqie_niurou': return 0xFF6347; // 番茄红
      case 'rice': return 0xFFFAFA; // 雪白色
      default: return 0x888888;
    }
  }

  // 获取状态颜色 (严格按照PROJECT_GUIDELINES要求)
  private getStateColor(state: string): number {
    switch (state) {
      case 'frozen': return 0x0000FF; // 蓝色
      case 'thawing': return 0xFFFF00; // 黄色
      case 'thawed': return 0xFF0000; // 红色
      case 'ready': return 0x00FF00; // 绿色
      default: return 0x888888;
    }
  }

  // 获取物品显示名称
  private getItemDisplayName(item: Item): string {
    if (item.type === 'ingredient' && item.ingredientType) {
      switch (item.ingredientType) {
        case 'huang_mi_gaoou': return '黄米凉糕';
        case 'mantou': return '小馒头';
        case 'xibei_mianjin': return '西贝面筋';
        case 'fanqie_niurou': return '番茄牛腩';
        case 'rice': return '米饭';
        default: return '未知食材';
      }
    } else if (item.type === 'plate') {
      return '碟子';
    }
    return '未知物品';
  }
}