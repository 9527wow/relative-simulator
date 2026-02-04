// ==================== 烟花效果管理器 ====================
class FireworksManager {
    constructor() {
        this.container = null;
        this.isEnabled = true;
        this.lastFirework = 0;
        this.fireworkInterval = 800; // 毫秒
        this.colors = ['red', 'gold', 'orange', 'pink', 'purple', 'white'];

        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.container = document.getElementById('fireworks-container');
        if (!this.container) {
            console.warn('Fireworks container not found');
            return;
        }

        // 监听设置变化
        this.loadSettings();
        this.startFireworks();
    }

    loadSettings() {
        const enabled = localStorage.getItem('fireworks-enabled');
        if (enabled !== null) {
            this.isEnabled = enabled === 'true';
        }
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        localStorage.setItem('fireworks-enabled', enabled);
    }

    startFireworks() {
        if (!this.isEnabled) return;

        // 立即创建一个烟花
        this.createFirework();

        // 定期创建烟花
        setInterval(() => {
            if (this.isEnabled) {
                this.createFirework();
            }
        }, this.fireworkInterval);
    }

    createFirework() {
        if (!this.container || !this.isEnabled) return;

        // 随机位置
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * (window.innerHeight * 0.6); // 上半部分

        // 创建爆炸中心
        const center = document.createElement('div');
        center.className = `firework ${this.getRandomColor()}`;
        center.style.left = x + 'px';
        center.style.top = y + 'px';
        this.container.appendChild(center);

        // 创建粒子
        const particleCount = 12 + Math.floor(Math.random() * 8); // 12-20个粒子
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle(x, y);
            this.container.appendChild(particle);

            // 移除粒子
            setTimeout(() => {
                particle.remove();
            }, 1500);
        }

        // 移除中心
        setTimeout(() => {
            center.remove();
        }, 100);
    }

    createParticle(x, y) {
        const particle = document.createElement('div');
        const color = this.getRandomColor();

        particle.className = `firework ${color}`;

        // 随机方向和距离
        const angle = (Math.PI * 2 * Math.random());
        const distance = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        return particle;
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    // 创建大型烟花庆祝效果
    createCelebration() {
        if (!this.isEnabled) return;

        // 立即创建多个烟花
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createFirework();
            }, i * 200);
        }
    }
}

// ==================== 初始化 ====================
let fireworksManager = null;

// 等待页面加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        fireworksManager = new FireworksManager();
    });
} else {
    fireworksManager = new FireworksManager();
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FireworksManager;
}
