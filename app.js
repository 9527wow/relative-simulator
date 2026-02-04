// ==================== 全局变量 ====================
let currentDifficulty = null;
let currentRelative = null;
let chatHistory = [];
let roundCount = 0;
let isWaiting = false;
let settingsManager = null;

// iflow API 配置
const API_URL = 'https://apis.iflow.cn/v1/chat/completions';
const MODEL = 'tstars2.0';

// 获取API key
function getApiKey() {
    let apiKey = localStorage.getItem('iflow_api_key');
    if (!apiKey) {
        // 如果localStorage中没有API key，显示输入提示
        apiKey = prompt('请输入您的 iFlow API Key：\n\n获取方式：\n1. 访问 https://iflow.cn\n2. 注册/登录账户\n3. 在控制台获取 API Key\n\n请输入您的 API Key：');
        if (apiKey && apiKey.trim()) {
            localStorage.setItem('iflow_api_key', apiKey.trim());
            return apiKey.trim();
        } else {
            throw new Error('API Key 未提供，无法使用 iFlow 服务');
        }
    }
    return apiKey;
}

// ==================== DOM 元素 ====================
const difficultyScreen = document.getElementById('difficulty-screen');
const chatScreen = document.getElementById('chat-screen');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const backBtn = document.getElementById('back-btn');
const currentEmoji = document.getElementById('current-emoji');
const currentRelativeName = document.getElementById('current-relative');
const currentDifficultyText = document.getElementById('current-difficulty');
const loading = document.getElementById('loading');
const resultModal = document.getElementById('result-modal');
const retryBtn = document.getElementById('retry-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const skipApiKeyBtn = document.getElementById('skip-api-key-btn');
const ratingModal = document.getElementById('rating-modal');
const ratingStars = document.getElementById('rating-stars');
const ratingText = document.getElementById('rating-text');
const submitRatingBtn = document.getElementById('submit-rating-btn');
const skipRatingBtn = document.getElementById('skip-rating-btn');

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化设置管理器
    settingsManager = new SettingsManager();

    initializeDifficultySelection();
    initializeChatEvents();
    initializeModalEvents();
    initializeApiKeyModal();
    initializeRatingModal();
    
    // 检查是否首次访问，如果是则显示API key模态框
    checkFirstVisit();
});

// ==================== 首次访问检查 ====================
function checkFirstVisit() {
    const hasVisited = localStorage.getItem('has_visited_app');
    const hasApiKey = localStorage.getItem('iflow_api_key');
    
    // 如果从未访问过，显示API key模态框
    if (!hasVisited) {
        setTimeout(() => {
            apiKeyModal.classList.add('active');
        }, 500);
    }
}

// ==================== API Key 模态框 ====================
function initializeApiKeyModal() {
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            apiKeyInput.classList.add('error');
            apiKeyInput.focus();
            return;
        }
        
        // 验证API key格式
        if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
            apiKeyInput.classList.add('error');
            apiKeyInput.focus();
            return;
        }
        
        // 保存API key
        localStorage.setItem('iflow_api_key', apiKey);
        localStorage.setItem('has_visited_app', 'true');
        apiKeyModal.classList.remove('active');
        apiKeyInput.classList.remove('error');
    });
    
    skipApiKeyBtn.addEventListener('click', () => {
        localStorage.setItem('has_visited_app', 'true');
        apiKeyModal.classList.remove('active');
    });
    
    // 输入框回车键保存
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKeyBtn.click();
        }
    });
    
    // 点击模态框外部关闭
    apiKeyModal.addEventListener('click', (e) => {
        if (e.target === apiKeyModal) {
            skipApiKeyBtn.click();
        }
    });
}

// 获取API key
function getApiKey() {
    let apiKey = localStorage.getItem('iflow_api_key');
    if (!apiKey) {
        // 如果localStorage中没有API key，显示输入提示
        apiKey = prompt('请输入您的 iFlow API Key：\n\n获取方式：\n1. 访问 https://iflow.cn\n2. 注册/登录账户\n3. 在控制台获取 API Key\n\n请输入您的 API Key：');
        if (apiKey && apiKey.trim()) {
            localStorage.setItem('iflow_api_key', apiKey.trim());
            return apiKey.trim();
        } else {
            throw new Error('API Key 未提供，无法使用 iFlow 服务');
        }
    }
    return apiKey;
}

// ==================== 难度选择 ====================
function initializeDifficultySelection() {
    const difficultyCards = document.querySelectorAll('.difficulty-card');

    difficultyCards.forEach(card => {
        card.addEventListener('click', () => {
            const difficulty = card.dataset.difficulty;
            startChat(difficulty);
        });
    });
}

function startChat(difficulty) {
    currentDifficulty = difficulty;
    currentRelative = RELATIVE_CONFIG[difficulty];

    // 更新聊天界面信息
    currentEmoji.textContent = currentRelative.emoji;
    currentRelativeName.textContent = currentRelative.name;
    currentDifficultyText.textContent = `难度：${'⭐'.repeat(getDifficultyLevel(difficulty))} ${getDifficultyText(difficulty)}`;

    // 切换界面
    difficultyScreen.classList.remove('active');
    chatScreen.classList.add('active');

    // 重置状态
    chatHistory = [];
    roundCount = 0;

    // 清空聊天消息
    chatMessages.innerHTML = '';

    // 添加系统消息
    addSystemMessage(`你选择了【${currentRelative.name}】，${currentRelative.description}`);

    // 发送开场问题
    setTimeout(() => {
        sendOpeningQuestion();
    }, 500);
}

function getDifficultyLevel(difficulty) {
    const levels = {
        easy: 1,
        medium: 3,
        hard: 5,
        extreme: 6
    };
    return levels[difficulty] || 1;
}

function getDifficultyText(difficulty) {
    const texts = {
        easy: '简单',
        medium: '中等',
        hard: '困难',
        extreme: '极难'
    };
    return texts[difficulty] || '';
}

// ==================== 聊天事件 ====================
function initializeChatEvents() {
    sendBtn.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserMessage();
        }
    });

    backBtn.addEventListener('click', () => {
        chatScreen.classList.remove('active');
        difficultyScreen.classList.add('active');
        chatMessages.innerHTML = '';
        chatHistory = [];
        roundCount = 0;
    });
}

// ==================== 消息处理 ====================
async function handleUserMessage() {
    const message = userInput.value.trim();

    if (!message || isWaiting) return;

    // 播放发送音效
    if (settingsManager) {
        settingsManager.playSound('send');
    }

    // 添加用户消息
    addUserMessage(message);
    userInput.value = '';

    // 等待 AI 回复
    isWaiting = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '发送中...';

    // 显示"正在输入"提示
    const typingIndicator = addTypingIndicator();

    try {
        const response = await callIFlowAPI(message);
        // 移除"正在输入"提示
        removeTypingIndicator(typingIndicator);
        addRelativeMessage(response);
        roundCount++;

        // 检查是否应该结束对话
        if (shouldEndConversation()) {
            setTimeout(() => {
                showResultModal();
            }, 1500);
        }
    } catch (error) {
        console.error('API 调用失败:', error);
        removeTypingIndicator(typingIndicator);
        addSystemMessage('抱歉，亲戚暂时没空理你，请稍后再试...');
    } finally {
        isWaiting = false;
        sendBtn.disabled = false;
        sendBtn.textContent = '发送';
    }
}

function addUserMessage(content) {
    const messageDiv = createMessageDiv('user', content);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    // 添加到历史记录
    chatHistory.push({
        role: 'user',
        content: content
    });
}

function addRelativeMessage(content) {
    const messageDiv = createMessageDiv('relative', content);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    // 添加到历史记录
    chatHistory.push({
        role: 'assistant',
        content: content
    });
}

function addSystemMessage(content) {
    const messageDiv = createMessageDiv('system', content);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function createMessageDiv(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);

    return messageDiv;
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================== 正在输入提示 ====================
function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message relative typing-indicator';
    typingDiv.id = 'typing-indicator';

    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    dotsDiv.innerHTML = '<span></span><span></span><span></span>';

    const textDiv = document.createElement('div');
    textDiv.className = 'typing-text';
    // 随机显示不同的提示文本
    const tips = [
        '正在思考怎么刁难你...',
        '正在准备扎心问题...',
        '正在搜刮你的隐私...',
        '正在组织语言怼你...'
    ];
    textDiv.textContent = tips[Math.floor(Math.random() * tips.length)];

    typingDiv.appendChild(dotsDiv);
    typingDiv.appendChild(textDiv);

    chatMessages.appendChild(typingDiv);
    scrollToBottom();

    return typingDiv;
}

function removeTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
        typingDiv.parentNode.removeChild(typingDiv);
    }
}

// ==================== API 调用 ====================
async function sendOpeningQuestion() {
    // 显示"正在输入"提示
    const typingIndicator = addTypingIndicator();

    try {
        // 构建消息
        const messages = [
            {
                role: 'system',
                content: currentRelative.systemPrompt
            },
            {
                role: 'user',
                content: '请开始你的表演，用一个问题开场！'
            }
        ];

        const response = await callAPI(messages);
        // 移除"正在输入"提示
        removeTypingIndicator(typingIndicator);
        addRelativeMessage(response);
    } catch (error) {
        console.error('开场问题失败:', error);
        removeTypingIndicator(typingIndicator);
        addSystemMessage('亲戚正在准备中...');
    }
}

async function callIFlowAPI(userMessage) {
    // 构建消息列表
    const messages = [
        {
            role: 'system',
            content: currentRelative.systemPrompt
        },
        ...chatHistory,
        {
            role: 'user',
            content: userMessage
        }
    ];

    const response = await callAPI(messages);
    return response;
}

async function callAPI(messages) {
    try {
        const apiKey = getApiKey();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 0.8,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            throw new Error('API 响应格式错误');
        }
    } catch (error) {
        console.error('API 调用错误:', error);
        throw error;
    }
}

// ==================== 评分机制 ====================
function initializeRatingModal() {
    let selectedRating = 0;
    
    // 星星点击事件
    const stars = ratingStars.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            updateRatingStars(selectedRating);
            updateRatingText(selectedRating);
            updateRatingComment(selectedRating);
            submitRatingBtn.disabled = false;
        });
        
        star.addEventListener('mouseenter', () => {
            updateRatingStars(index + 1);
            updateRatingText(index + 1);
        });
    });
    
    // 鼠标离开星星区域时恢复选中状态
    ratingStars.addEventListener('mouseleave', () => {
        updateRatingStars(selectedRating);
        updateRatingText(selectedRating);
    });
    
    // 提交评分
    submitRatingBtn.addEventListener('click', () => {
        if (selectedRating > 0) {
            saveRating(selectedRating, currentDifficulty);
            ratingModal.classList.remove('active');
            showFinalResultModal();
        }
    });
    
    // 跳过评分
    skipRatingBtn.addEventListener('click', () => {
        ratingModal.classList.remove('active');
        showFinalResultModal();
    });
    
    // 点击模态框外部关闭
    ratingModal.addEventListener('click', (e) => {
        if (e.target === ratingModal) {
            skipRatingBtn.click();
        }
    });
}

function updateRatingStars(rating) {
    const stars = ratingStars.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateRatingText(rating) {
    const texts = {
        0: '请选择评分',
        1: '1星 - 刚起步',
        2: '2星 - 有进步',
        3: '3星 - 还不错',
        4: '4星 - 很棒',
        5: '5星 - 太厉害了'
    };
    ratingText.textContent = texts[rating];
}

function updateRatingComment(rating) {
    const comments = ratingModal.querySelectorAll('.rating-comment');
    comments.forEach((comment, index) => {
        if (index === rating - 1) {
            comment.classList.add('active');
        } else {
            comment.classList.remove('active');
        }
    });
}

function saveRating(rating, difficulty) {
    const ratingData = {
        rating: rating,
        difficulty: difficulty,
        date: new Date().toISOString(),
        roundCount: roundCount
    };
    
    // 保存到localStorage
    let ratings = JSON.parse(localStorage.getItem('session_ratings') || '[]');
    ratings.push(ratingData);
    localStorage.setItem('session_ratings', JSON.stringify(ratings));
    
    // 更新统计数据
    updateRatingStats();
}

function updateRatingStats() {
    let ratings = JSON.parse(localStorage.getItem('session_ratings') || '[]');
    
    // 计算平均评分
    if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        console.log(`平均评分: ${avgRating.toFixed(1)}星 (${ratings.length} 次评分)`);
    }
}

// ==================== 对话控制 ====================
function shouldEndConversation() {
    // 使用设置中的轮数限制
    const roundLimit = settingsManager ? settingsManager.getRoundLimit() : 10;
    return roundCount >= roundLimit;
}

function showResultModal() {
    // 先显示评分模态框
    ratingModal.classList.add('active');
}

function showFinalResultModal() {
    const roundCountSpan = document.getElementById('round-count');
    roundCountSpan.textContent = roundCount;

    const resultMessage = document.getElementById('result-message');
    if (roundCount >= 8) {
        resultMessage.textContent = '太厉害了！你成功应对了所有刁难，是亲戚应对大师！';
    } else if (roundCount >= 5) {
        resultMessage.textContent = '表现不错！你基本能应对亲戚的刁难，继续加油！';
    } else {
        resultMessage.textContent = '还需努力！亲戚的刁难可不是那么容易应对的...';
    }

    resultModal.classList.add('active');
}

// ==================== 模态框事件 ====================
function initializeModalEvents() {
    retryBtn.addEventListener('click', () => {
        resultModal.classList.remove('active');
        chatScreen.classList.remove('active');
        difficultyScreen.classList.add('active');
        chatMessages.innerHTML = '';
        chatHistory = [];
        roundCount = 0;
    });

    closeModalBtn.addEventListener('click', () => {
        resultModal.classList.remove('active');
    });

    // 点击模态框外部关闭
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            resultModal.classList.remove('active');
        }
    });
}
