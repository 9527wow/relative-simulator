// ==================== 设置管理 ====================
class SettingsManager {
    constructor() {
        this.settings = {
            theme: localStorage.getItem('theme') || 'light',
            fireworks: localStorage.getItem('fireworks') !== 'false',
            animations: localStorage.getItem('animations') !== 'false',
            particles: localStorage.getItem('particles') !== 'false',
            sound: localStorage.getItem('sound') === 'true',
            roundLimit: parseInt(localStorage.getItem('roundLimit')) || 10
        };

        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
        this.loadSettingsToUI();
    }

    bindEvents() {
        // 设置按钮
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.toggleSettings();
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            this.closeSettings();
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('settings-panel');
            const btn = document.getElementById('settings-btn');
            if (!panel.contains(e.target) && !btn.contains(e.target) && panel.classList.contains('active')) {
                this.closeSettings();
            }
        });

        // 主题切换
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.theme = e.target.value;
                this.saveSettings();
                this.applyTheme();
            });
        });

        // 动画开关
        document.getElementById('animation-toggle').addEventListener('change', (e) => {
            this.settings.animations = e.target.checked;
            this.saveSettings();
            this.applyAnimationSettings();
        });

        // 粒子效果开关
        document.getElementById('particles-toggle').addEventListener('change', (e) => {
            this.settings.particles = e.target.checked;
            this.saveSettings();
            this.applyParticleSettings();
        });

        // 烟花效果开关
        document.getElementById('fireworks-toggle').addEventListener('change', (e) => {
            this.settings.fireworks = e.target.checked;
            this.saveSettings();
            this.applyFireworkSettings();
        });

        // 音效开关
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });

        // 轮数限制
        document.getElementById('round-limit').addEventListener('change', (e) => {
            this.settings.roundLimit = parseInt(e.target.value);
            this.saveSettings();
        });
    }

    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        panel.classList.toggle('active');
    }

    closeSettings() {
        const panel = document.getElementById('settings-panel');
        panel.classList.remove('active');
    }

    loadSettingsToUI() {
        // 加载主题
        document.querySelector(`input[name="theme"][value="${this.settings.theme}"]`).checked = true;

        // 加载开关
        document.getElementById('fireworks-toggle').checked = this.settings.fireworks;
        document.getElementById('animation-toggle').checked = this.settings.animations;
        document.getElementById('particles-toggle').checked = this.settings.particles;
        document.getElementById('sound-toggle').checked = this.settings.sound;

        // 加载轮数限制
        document.getElementById('round-limit').value = this.settings.roundLimit;

        // 应用设置
        this.applyFireworkSettings();
        this.applyAnimationSettings();
        this.applyParticleSettings();
    }

    applyTheme() {
        const body = document.body;

        // 移除所有主题类
        body.classList.remove('dark-mode', 'light-mode', 'auto-mode');

        if (this.settings.theme === 'auto') {
            // 跟随系统
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                body.classList.add('dark-mode');
            }
        } else if (this.settings.theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.add('light-mode');
        }
    }

    applyAnimationSettings() {
        if (this.settings.animations) {
            document.body.style.setProperty('--enable-animations', '1');
        } else {
            document.body.style.setProperty('--enable-animations', '0');
        }
    }

    applyParticleSettings() {
        const decorations = document.querySelectorAll('.spring-decoration');
        decorations.forEach(decoration => {
            decoration.style.display = this.settings.particles ? 'block' : 'none';
        });
    }

    applyFireworkSettings() {
        if (window.fireworksManager) {
            window.fireworksManager.setEnabled(this.settings.fireworks);
        }
        localStorage.setItem('fireworks-enabled', this.settings.fireworks);
    }

    saveSettings() {
        localStorage.setItem('theme', this.settings.theme);
        localStorage.setItem('fireworks', this.settings.fireworks);
        localStorage.setItem('animations', this.settings.animations);
        localStorage.setItem('particles', this.settings.particles);
        localStorage.setItem('sound', this.settings.sound);
        localStorage.setItem('roundLimit', this.settings.roundLimit);
    }

    saveSettings() {
        localStorage.setItem('theme', this.settings.theme);
        localStorage.setItem('animations', this.settings.animations);
        localStorage.setItem('particles', this.settings.particles);
        localStorage.setItem('sound', this.settings.sound);
        localStorage.setItem('roundLimit', this.settings.roundLimit);
    }

    getRoundLimit() {
        return this.settings.roundLimit;
    }

    isSoundEnabled() {
        return this.settings.sound;
    }

    playSound(type) {
        if (!this.isSoundEnabled()) return;

        // 这里可以添加音效
        // const audio = new Audio(`sounds/${type}.mp3`);
        // audio.play();
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}
