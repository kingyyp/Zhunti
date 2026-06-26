let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 播放清脆引磬
function playChime() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 1.5);
}

// 儀式邏輯
async function startRitual() {
    playChime();
    await new Promise(r => setTimeout(r, 2000));
    playChime();
}

// 數據管理與里程碑
function updateDisplay() {
    let total = parseInt(localStorage.getItem('zhunti_total_count') || '0');
    document.getElementById('totalCountDisplay').textContent = total.toLocaleString();
    
    let label = document.getElementById('milestoneText');
    if (total >= 300000) {
        let next = (Math.floor(total / 500000) + 1) * 500000;
        label.textContent = `精進模式：邁向 ${next.toLocaleString()} 遍！`;
    } else if (total >= 200000) {
        label.textContent = `目標：30 萬遍圓滿`;
    } else {
        label.textContent = `目標：10 萬遍圓滿`;
    }
    renderCalendar();
}

// 數據導入
function importData() {
    let input = prompt("請輸入您的總念誦次數：");
    if (input !== null && !isNaN(input)) {
        localStorage.setItem('zhunti_total_count', input);
        updateDisplay();
    }
}

// 日曆顯示 (演示用，顯示當天已實作)
function renderCalendar() {
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';
    const today = new Date().getDate();
    for(let i=1; i<=30; i++) {
        let div = document.createElement('div');
        div.className = 'day' + (i === today ? ' has-practice' : '');
        div.textContent = i;
        cal.appendChild(div);
    }
}

updateDisplay();
