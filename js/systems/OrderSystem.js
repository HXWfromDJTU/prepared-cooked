// 订单系统类
class OrderSystem {
    constructor(scene, difficulty = 'medium') {
        this.scene = scene;
        this.difficulty = difficulty;
        this.orders = [];
        this.orderIdCounter = 0;
        this.isRunning = false;
        this.orderTimer = null;
        this.maxOrders = gameData.config.difficulties[difficulty].maxOrders;
        this.orderFrequency = gameData.config.difficulties[difficulty].orderFrequency;
        
        console.log(`订单系统初始化，难度: ${difficulty}`);
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.scheduleNextOrder();
        
        console.log('订单系统启动');
    }

    stop() {
        this.isRunning = false;
        
        if (this.orderTimer) {
            this.orderTimer.destroy();
            this.orderTimer = null;
        }
        
        // 清理所有订单的计时器
        this.orders.forEach(order => {
            if (order.timeoutTimer) {
                order.timeoutTimer.destroy();
            }
        });
        
        console.log('订单系统停止');
    }

    scheduleNextOrder() {
        if (!this.isRunning) return;
        
        // 如果订单数量已达上限，延迟生成新订单
        if (this.orders.length >= this.maxOrders) {
            this.orderTimer = this.scene.time.addEvent({
                delay: 2000, // 2秒后再检查
                callback: this.scheduleNextOrder,
                callbackScope: this
            });
            return;
        }

        // 生成新订单
        this.generateOrder();
        
        // 安排下一个订单
        this.orderTimer = this.scene.time.addEvent({
            delay: this.orderFrequency,
            callback: this.scheduleNextOrder,
            callbackScope: this
        });
    }

    generateOrder() {
        // 获取随机菜品
        const recipe = gameData.getRandomRecipe(this.difficulty);
        if (!recipe) return;

        const order = {
            id: ++this.orderIdCounter,
            recipe: recipe,
            createdAt: Date.now(),
            deadline: Date.now() + recipe.timeLimit,
            status: 'pending', // pending, completed, expired
            customer: this.generateCustomer()
        };

        this.orders.push(order);
        
        // 设置订单超时计时器
        order.timeoutTimer = this.scene.time.addEvent({
            delay: recipe.timeLimit,
            callback: () => this.expireOrder(order.id),
            callbackScope: this
        });

        // 通知游戏场景有新订单
        if (this.scene.addOrder) {
            this.scene.addOrder(order);
        }

        console.log(`新订单生成: ${recipe.name} (ID: ${order.id})`);
        this.showNewOrderNotification(order);
    }

    generateCustomer() {
        const customerNames = [
            '张先生', '李女士', '王同学', '赵老师', '陈医生',
            '刘工程师', '杨经理', '周律师', '吴教授', '郑主任'
        ];
        
        return {
            name: customerNames[Math.floor(Math.random() * customerNames.length)],
            patience: Math.random() * 0.3 + 0.7 // 70%-100%的耐心
        };
    }

    showNewOrderNotification(order) {
        // 在屏幕上显示新订单通知
        const notification = this.scene.add.container(this.scene.scale.width - 150, 100);
        
        // 背景
        const bg = this.scene.add.rectangle(0, 0, 280, 80, 0xFFFFFF);
        bg.setStrokeStyle(3, 0xD2691E);
        
        // 文字
        const titleText = this.scene.add.text(0, -20, '新订单!', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#D2691E',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const dishText = this.scene.add.text(0, 0, order.recipe.name, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#8B4513'
        }).setOrigin(0.5);
        
        const customerText = this.scene.add.text(0, 20, `客户: ${order.customer.name}`, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#CD853F'
        }).setOrigin(0.5);

        notification.add([bg, titleText, dishText, customerText]);

        // 动画效果
        notification.setAlpha(0);
        this.scene.tweens.add({
            targets: notification,
            alpha: 1,
            x: this.scene.scale.width - 150,
            duration: 500,
            ease: 'Back.easeOut'
        });

        // 3秒后消失
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => {
                this.scene.tweens.add({
                    targets: notification,
                    alpha: 0,
                    x: this.scene.scale.width + 150,
                    duration: 500,
                    onComplete: () => {
                        notification.destroy();
                    }
                });
            }
        });
    }

    // 完成订单
    completeOrder(orderId, completedDish) {
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            console.log(`订单 ${orderId} 未找到`);
            return false;
        }

        const order = this.orders[orderIndex];
        
        // 检查菜品是否匹配
        if (completedDish.recipe.id !== order.recipe.id) {
            console.log('菜品不匹配订单要求');
            return false;
        }

        // 标记订单完成
        order.status = 'completed';
        order.completedAt = Date.now();

        // 清理计时器
        if (order.timeoutTimer) {
            order.timeoutTimer.destroy();
        }

        // 从订单列表移除
        this.orders.splice(orderIndex, 1);

        // 通知游戏场景订单完成
        if (this.scene.completeOrder) {
            this.scene.completeOrder(orderId);
        }

        console.log(`订单完成: ${order.recipe.name} (ID: ${orderId})`);
        this.showOrderCompleteNotification(order);
        
        return true;
    }

    // 订单过期
    expireOrder(orderId) {
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) return;

        const order = this.orders[orderIndex];
        order.status = 'expired';
        
        // 从订单列表移除
        this.orders.splice(orderIndex, 1);

        console.log(`订单过期: ${order.recipe.name} (ID: ${orderId})`);
        this.showOrderExpiredNotification(order);

        // 可能扣分或其他惩罚
        this.handleOrderExpired(order);
    }

    handleOrderExpired(order) {
        // 订单过期的处理逻辑
        // 可以扣分、降低客户满意度等
        console.log(`客户 ${order.customer.name} 对过期订单不满意`);
    }

    showOrderCompleteNotification(order) {
        // 显示订单完成通知
        const notification = this.scene.add.text(
            this.scene.scale.width / 2, 
            this.scene.scale.height / 2 - 100, 
            `订单完成!\n${order.recipe.name}\n客户: ${order.customer.name}`, 
            {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#90EE90',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5);

        // 动画效果
        this.scene.tweens.add({
            targets: notification,
            y: notification.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                notification.destroy();
            }
        });
    }

    showOrderExpiredNotification(order) {
        // 显示订单过期通知
        const notification = this.scene.add.text(
            this.scene.scale.width / 2, 
            this.scene.scale.height / 2 - 100, 
            `订单过期!\n${order.recipe.name}\n客户: ${order.customer.name}`, 
            {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#FF6347',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5);

        // 动画效果
        this.scene.tweens.add({
            targets: notification,
            y: notification.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                notification.destroy();
            }
        });
    }

    // 获取当前所有订单
    getCurrentOrders() {
        return this.orders.filter(order => order.status === 'pending');
    }

    // 获取特定订单
    getOrder(orderId) {
        return this.orders.find(order => order.id === orderId);
    }

    // 检查是否有匹配的订单
    findMatchingOrder(dishRecipeId) {
        return this.orders.find(order => 
            order.status === 'pending' && order.recipe.id === dishRecipeId
        );
    }

    // 更新订单系统（每帧调用）
    update() {
        // 更新订单剩余时间等
        const currentTime = Date.now();
        
        this.orders.forEach(order => {
            if (order.status === 'pending') {
                const timeLeft = Math.max(0, order.deadline - currentTime);
                order.timeLeft = Math.ceil(timeLeft / 1000); // 转换为秒
            }
        });
    }

    // 获取订单统计信息
    getStats() {
        return {
            totalOrders: this.orderIdCounter,
            currentOrders: this.orders.length,
            maxOrders: this.maxOrders,
            difficulty: this.difficulty
        };
    }
}