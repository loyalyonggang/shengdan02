const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
const particleCount = 2000; // 增加粒子数量以适应更大的树

// 3D 投影参数 - 调整以放大树
const fov = 350; // 增大视场，相当于拉近镜头
const viewDistance = 400; // 减小视距
let angleX = 0;
let angleY = 0;

// 调整画布大小
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // 只有当 TextParticle 类定义后才调用
    if (typeof initTextParticles === 'function' && typeof TextParticle === 'function') {
        initTextParticles();
    }
}

// --- 顶部文字粒子系统 ---
let textParticles = [];
class TextParticle {
    constructor(x, y, isPurple) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        // 再次增加粒子大小，让文字更饱满清晰
        this.size = Math.random() * 1.5 + 2; // 2 ~ 3.5px
        
        if (isPurple) {
            // 紫色高亮
            this.color = '#d000ff';
        } else {
            // 金色/白色随机
            this.color = Math.random() > 0.4 ? '#f1c40f' : '#ffffff'; 
        }
        
        this.angle = Math.random() * Math.PI * 2;
        this.velocity = Math.random() * 0.03 + 0.01;
    }

    update() {
        // 大幅减小震动幅度，几乎静止，只保留微弱的呼吸感
        this.angle += this.velocity;
        this.x = this.baseX + Math.cos(this.angle) * 0.3; 
        this.y = this.baseY + Math.sin(this.angle) * 0.3;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initTextParticles() {
    textParticles = [];
    
    // 计算天数
    const startDate = new Date('2025-12-04T00:00:00');
    const now = new Date();
    startDate.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = now - startDate;
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // 分段绘制以区分颜色
    const prefix = "今天是相识的第 ";
    const number = days.toString();
    const suffix = " 天";

    // 离屏 Canvas
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = width;
    offCanvas.height = 200; // 只使用顶部区域

    // 移动端适配：进一步加大字号
    let fontSize = 60;
    if (width < 600) {
        fontSize = Math.min(42, Math.floor(width / 10)); 
    }

    // 设置字体
    offCtx.font = `bold ${fontSize}px "Zcool KuaiLe", cursive`;
    offCtx.textBaseline = 'middle';
    // 测量宽度以居中
    const prefixWidth = offCtx.measureText(prefix).width;
    const numberWidth = offCtx.measureText(number).width;
    const suffixWidth = offCtx.measureText(suffix).width;
    const totalWidth = prefixWidth + numberWidth + suffixWidth;

    let currentX = (width - totalWidth) / 2;
    const textY = 80;

    // 1. 绘制前缀 (白色)
    offCtx.fillStyle = 'white';
    offCtx.shadowColor = "white";
    offCtx.shadowBlur = 5;
    offCtx.fillText(prefix, currentX, textY);
    currentX += prefixWidth;

    // 2. 绘制数字 (用纯蓝色标记，稍后识别替换为紫色粒子)
    offCtx.fillStyle = '#0000ff';
    offCtx.shadowColor = "#0000ff";
    offCtx.fillText(number, currentX, textY);
    currentX += numberWidth;

    // 3. 绘制后缀 (白色)
    offCtx.fillStyle = 'white';
    offCtx.shadowColor = "white";
    offCtx.fillText(suffix, currentX, textY);
    
    offCtx.shadowBlur = 0;

    // 获取像素数据
    const textData = offCtx.getImageData(0, 0, width, 200);
    
    // 采样间隔
    const gap = 2; 

    for (let y = 0; y < 200; y += gap) {
        for (let x = 0; x < width; x += gap) {
            const index = (y * width + x) * 4;
            const r = textData.data[index];
            const g = textData.data[index + 1];
            const b = textData.data[index + 2];
            const alpha = textData.data[index + 3];
            
            if (alpha > 128) {
                // 如果蓝色分量高且红色分量低，说明是数字部分，标记为紫色
                const isNumber = (b > 200 && r < 100);
                textParticles.push(new TextParticle(x, y, isNumber));
            }
        }
    }
}

// 确保字体加载后再初始化文字
document.fonts.ready.then(() => {
    // 再次检查定义
    if (typeof initTextParticles === 'function' && typeof TextParticle === 'function') {
        initTextParticles();
    }
});


// 粒子类
class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * 300 - 150; // 调整初始分布范围
    }

    reset() {
        this.angle = Math.random() * Math.PI * 2;
        this.radiusScale = Math.random();
        this.y = 150; // 底部开始位置调整
        this.speed = Math.random() * 0.6 + 0.3; // 速度稍快
        
        const rand = Math.random();
        if (rand > 0.95) this.color = '#ffff00';
        else if (rand > 0.9) this.color = '#ff0000';
        else if (rand > 0.85) this.color = '#ffffff';
        else this.color = `hsl(${120 + Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`;
        
        this.size = Math.random() * 2 + 1.5; // 粒子稍大
        this.x = 0;
        this.z = 0;
    }

    update() {
        this.y -= this.speed;
        this.angle += 0.02;

        // 调整树的高度参数
        const treeHeight = 350; 
        const topY = -200; 
        const normalizedY = (this.y - topY) / treeHeight;
        
        // 移动端适配树的宽度
        let maxRadius = 180;
        if (width < 600) {
            maxRadius = 140; // 移动端树变窄一点
        }

        const spread = this.radiusScale * 30; 
        
        let currentRadius = normalizedY * maxRadius + spread;
        if (currentRadius < 0) currentRadius = 0;

        this.x = Math.cos(this.angle) * currentRadius;
        this.z = Math.sin(this.angle) * currentRadius;

        if (this.y < topY) {
            this.reset();
        }
    }

    draw() {
        const rotationSpeed = 0.005;
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        
        let x1 = this.x * cosY - this.z * sinY;
        let z1 = this.z * cosY + this.x * sinY;

        const scale = fov / (viewDistance + z1);
        const x2d = x1 * scale + width / 2;
        
        // 调整垂直位置
        let yOffset = -20;
        if (width < 600) {
            yOffset = -60; // 移动端整体上移，留出更多底部空间
        }
        const y2d = this.y * scale + height / 2 + yOffset; 

        const alpha = (scale - 0.2) * 1.5;
        if (alpha <= 0) return;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x2d, y2d, this.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// 初始化粒子
function init() {
    particles = []; // 清空旧粒子
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
        for (let j = 0; j < Math.random() * 500; j++) {
            particles[i].update();
        }
    }
}

// 动画循环
function animate() {
    ctx.clearRect(0, 0, width, height);
    angleY += 0.005;

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    textParticles.forEach(p => {
        p.update();
        p.draw();
    });

    drawStar();
    requestAnimationFrame(animate);
}

function drawStar() {
    const starY = -205; // 配合树顶位置
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    
    let x1 = 0;
    let z1 = 0;
    
    const scale = fov / (viewDistance + z1);
    const x2d = x1 * scale + width / 2;
    const y2d = starY * scale + height / 2 - 20;

    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffff00';
    
    ctx.beginPath();
    ctx.arc(x2d, y2d, 12 * scale, 0, Math.PI * 2); // 星星变大
    ctx.fill();
    ctx.shadowBlur = 0;
}


// 音乐控制逻辑
const bgMusic = document.getElementById('bgMusic');
const musicControl = document.getElementById('musicControl');
let isPlaying = false;

function toggleMusic() {
    if (isPlaying) {
        bgMusic.pause();
        musicControl.classList.remove('music-playing');
    } else {
        bgMusic.play().then(() => {
            musicControl.classList.add('music-playing');
        }).catch(err => {
            console.log("播放失败", err);
        });
    }
    isPlaying = !isPlaying;
}

musicControl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
});

// 自动播放尝试
window.addEventListener('load', () => {
    bgMusic.play().then(() => {
        isPlaying = true;
        musicControl.classList.add('music-playing');
    }).catch(err => {
        console.log("自动播放被拦截，等待交互");
        // 如果自动播放失败，添加一次性点击监听
        document.addEventListener('click', function initAudio() {
            if (!isPlaying) {
                bgMusic.play().then(() => {
                    isPlaying = true;
                    musicControl.classList.add('music-playing');
                    document.removeEventListener('click', initAudio);
                });
            }
        }, { once: true });
    });
});


// 打字机效果逻辑
const letterText = `亲爱的二妞：
圣诞快乐！🎄
在这个飘雪的季节，想把最温暖的祝福送给你。
认识你是我最大的幸运，你的笑容像圣诞树上的彩灯一样闪耀，照亮了我的世界。✨
希望未来的每一个圣诞节，都能陪在你身边，看雪花落下，听钟声敲响。
愿你永远像孩子一样无忧无虑，天天开心，平安喜乐。🍎
所有的美好都与你环环相扣。
Love you forever. ❤️`;

// 将文本按标点或长度分割成适合显示的短句
const lines = letterText.split(/[\n，。！]/).filter(line => line.trim().length > 0);
const typingContainer = document.getElementById('typingContainer');

let currentLineIndex = 0;
let currentCharIndex = 0;
let activeLineElement = null;

function typeWriter() {
    // 如果没有当前行元素，创建一个
    if (!activeLineElement) {
        // 安全检查
        if (currentLineIndex >= lines.length) currentLineIndex = 0;

        // 字幕模式：开始新的一行前，清空容器（或只保留最后一行直到淡出）
        // 这里我们选择清空，实现"一句一句"的效果
        typingContainer.innerHTML = '';

        activeLineElement = document.createElement('p');
        activeLineElement.className = 'typing-line subtitle-mode'; // 添加 subtitle-mode 类以便样式控制
        typingContainer.appendChild(activeLineElement);
    }

    const currentLineText = lines[currentLineIndex];
    
    // 添加一个字符
    if (currentCharIndex < currentLineText.length) {
        activeLineElement.textContent += currentLineText.charAt(currentCharIndex);
        currentCharIndex++;
        
        // 打字速度
        setTimeout(typeWriter, Math.random() * 100 + 50);
    } else {
        //这一行打完了
        currentLineIndex++;
        currentCharIndex = 0;
        activeLineElement = null;

        // 检查是否全部播放完毕
        if (currentLineIndex >= lines.length) {
            currentLineIndex = 0;
            // 播放完最后一句，多停留一会儿
            setTimeout(typeWriter, 4000); 
        } else {
            // 行与行之间的停顿（字幕停留时间）
            setTimeout(typeWriter, 2000);
        }
    }
}

// 启动打字机（稍微延迟一点等待树加载）
setTimeout(typeWriter, 1500);

// 初始化画布大小和事件监听
window.addEventListener('resize', resize);
resize();

init();
animate();


// AI 对话功能
const chatTrigger = document.getElementById('chatTrigger');
const chatModal = document.getElementById('chatModal');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const messageList = document.getElementById('messageList');

// API 配置
// const API_KEY = '...'; // Key 已移至后端环境变量，前端不再暴露
const API_URL = '/api/chat'; // 指向 Vercel 的 Serverless Function
const MODEL = 'Pro/Qwen/Qwen2.5-7B-Instruct';

// 切换聊天窗口显示
chatTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止触发背景音乐自动播放
    chatModal.style.display = 'flex';
    chatTrigger.style.display = 'none'; // 打开时隐藏气泡
});

closeChat.addEventListener('click', () => {
    chatModal.style.display = 'none';
    chatTrigger.style.display = 'block'; // 关闭时显示气泡
});

// 发送消息逻辑
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. 添加用户消息
    addMessage(text, 'sent');
    chatInput.value = '';
    
    // 禁用发送按钮，显示等待状态
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    // 2. 调用 API (Vercel 转发)
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                // 'Authorization': `Bearer ${API_KEY}`, // 前端不需要传 Key 了
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: "你是花不缺，用户的男朋友。用户叫二妞，她经常叫你宝宝。你们是网恋情侣关系。今天是圣诞节，你的语气要宠溺、温暖、充满爱意和节日氛围。回复要简短深情，多用emoji。不要太严肃。只有当二妞主动提到“微信”这三个字时，你才告诉她你的微信号是：hbqicu。如果她没提，你绝对不要主动发送微信号。"
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                stream: false,
                max_tokens: 512,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        // 3. 添加 AI 回复
        addMessage(reply, 'received');

    } catch (error) {
        console.error('Chat Error:', error);
        addMessage('抱歉，网络有点小差错，请稍后再试～ 🎄', 'received');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = '发送';
    }
}

// 添加消息到界面
function addMessage(text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    
    // 根据类型选择头像内容
    // 如果是用户(sent)，使用图片 t1.jpg；如果是系统(received)，保持原来的 emoji 或也可以换图
    let avatarContent;
    if (type === 'sent') {
        avatarContent = '<img src="t1.jpg" alt="二妞" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">';
    } else {
        avatarContent = '🎄'; // 花不缺的头像保持 emoji，也可以换图
    }
    
    msgDiv.innerHTML = `
        <div class="avatar">${avatarContent}</div>
        <div class="content">${text}</div>
    `;
    
    messageList.appendChild(msgDiv);
    
    // 滚动到底部
    messageList.scrollTop = messageList.scrollHeight;
}

// 绑定发送事件
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
