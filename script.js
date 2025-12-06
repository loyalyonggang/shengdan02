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
}
window.addEventListener('resize', resize);
resize();

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
        const treeHeight = 350; // 树更高
        const topY = -200; // 树顶位置
        const normalizedY = (this.y - topY) / treeHeight;
        
        const maxRadius = 180; // 树更宽
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
        // 调整垂直位置，让树向上移动
        const y2d = this.y * scale + height / 2 - 20; 

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
    if (currentLineIndex >= lines.length) return; // 结束

    // 如果没有当前行元素，创建一个
    if (!activeLineElement) {
        activeLineElement = document.createElement('p');
        activeLineElement.className = 'typing-line';
        typingContainer.appendChild(activeLineElement);
        
        // 保持只有三行：如果有超过3个子元素，移除第一个
        if (typingContainer.children.length > 3) {
            const firstChild = typingContainer.firstElementChild;
            firstChild.classList.add('fade-out'); // 添加淡出动画类
            setTimeout(() => {
                if (firstChild && firstChild.parentNode === typingContainer) {
                    typingContainer.removeChild(firstChild);
                }
            }, 500); // 这里的事件要和 CSS 动画时间匹配
        }
    }

    const currentLineText = lines[currentLineIndex];
    
    // 添加一个字符
    if (currentCharIndex < currentLineText.length) {
        activeLineElement.textContent += currentLineText.charAt(currentCharIndex);
        currentCharIndex++;
        
        // 打字速度随机
        setTimeout(typeWriter, Math.random() * 100 + 50);
    } else {
        //这一行打完了
        currentLineIndex++;
        currentCharIndex = 0;
        activeLineElement = null;
        // 行与行之间的停顿
        setTimeout(typeWriter, 1000);
    }
}

// 启动打字机（稍微延迟一点等待树加载）
setTimeout(typeWriter, 1500);

init();
animate();
