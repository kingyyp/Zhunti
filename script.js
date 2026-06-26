<script>
    const recordBtn = document.getElementById('recordBtn');
    const recordStatus = document.getElementById('recordStatus');
    const modeRadios = document.getElementsByName('mode');
    const targetCountDiv = document.getElementById('targetCountDiv');
    const targetCountSelect = document.getElementById('targetCount');
    const currentCountDisplay = document.getElementById('currentCount');
    const totalCountDisplay = document.getElementById('totalCount');
    const progressBar = document.getElementById('progressBar');
    const progressBarText = document.getElementById('progressBarText');
    const progressText = document.getElementById('progressText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const manualCountBtn = document.getElementById('manualCountBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const nativeAudio = document.getElementById('nativeAudio');
    const milestoneTargetLabel = document.getElementById('milestoneTargetLabel');
    
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonthLabel = document.getElementById('calendarMonthLabel');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    const userNameInput = document.getElementById('userName');
    const targetObjectInput = document.getElementById('targetObject');
    
    const bgMusicSelect = document.getElementById('bgMusicSelect');
    const speedSelect = document.getElementById('speedSelect');
    const alertIntervalSelect = document.getElementById('alertInterval');
    const toastAlert = document.getElementById('toastAlert');
    const alertMessage = document.getElementById('alertMessage');

    let mediaRecorder = null;
    let audioChunks = [];
    let audioUrl = null;
    
    let isPlaying = false;
    let isRecording = false;
    let count = 0;
    let target = 108;
    let isInfinite = false;
    let toastTimer = null;
    
    // 日曆導航狀態
    let currentNavDate = new Date();

    const alertQuotes = [
        "請集中精神，收攝身心，專注於咒音，莫隨妄想分心流轉。",
        "此時不向身中覓，更待何時度此身？請收回散亂的心，專注當下。",
        "念從心起，聲從口出，音從耳入。心口如一，方能感應道交。",
        "莫隨燈花空計數，一聲佛咒一清涼。打起精神，專注持誦！"
    ];

    let audioCtx = null;

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playChimeSound() {
        initAudioContext();
        const now = audioCtx.currentTime;
        const frequencies = [440, 659, 880, 1320]; 
        const gains = [0.5, 0.3, 0.15, 0.05];
        
        const sourceGain = audioCtx.createGain();
        sourceGain.gain.setValueAtTime(0, now);
        sourceGain.gain.linearRampToValueAtTime(1.0, now + 0.008); 
        sourceGain.gain.exponentialRampToValueAtTime(0.2, now + 0.3);
        sourceGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0); 

        frequencies.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const oscGain = audioCtx.createGain();
            osc.type = index === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, now);
            oscGain.gain.setValueAtTime(gains[index], now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + (3.0 - index * 0.5));
            osc.connect(oscGain);
            oscGain.connect(sourceGain);
            osc.start(now);
            osc.stop(now + 3.0);
        });

        const delayNode = audioCtx.createDelay(1.0);
        delayNode.delayTime.setValueAtTime(0.35, now);
        const feedbackGain = audioCtx.createGain();
        feedbackGain.gain.setValueAtTime(0.42, now); 

        const masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);

        sourceGain.connect(masterGain);
        sourceGain.connect(delayNode);
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode); 
        feedbackGain.connect(masterGain);
    }

    function playSyntheticBg(type, isPreview = false) {
        initAudioContext();
        const now = audioCtx.currentTime;
        
        if (type === 'muyu') {
            let osc = audioCtx.createOscillator();
            let oscSub = audioCtx.createOscillator(); 
            let gain = audioCtx.createGain();
            
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(165, now); 
            
            oscSub.type = 'triangle';
            oscSub.frequency.setValueAtTime(82.5, now); 
            
            osc.connect(gain);
            oscSub.connect(gain);
            gain.connect(audioCtx.destination);
            
            gain.gain.setValueAtTime(2.2, now); 
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(); oscSub.start();
            osc.stop(now + 0.25); oscSub.stop(now + 0.25);
        } else if (type === 'assembly') {
            const baseFreqs = [65.4, 73.4, 98.0, 130.8]; 
            const duration = isPreview ? 2.5 : 1.5; 
            
            const sourceGain = audioCtx.createGain();
            sourceGain.gain.setValueAtTime(0, now);
            sourceGain.gain.linearRampToValueAtTime(0.25, now + 0.2); 
            sourceGain.gain.exponentialRampToValueAtTime(0.1, now + duration - 0.5);
            sourceGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            baseFreqs.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                osc.detune.setValueAtTime((i - 1.5) * 8, now); 
                osc.connect(sourceGain);
                osc.start(now);
                osc.stop(now + duration);
            });

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(150, now);

            const delayNode = audioCtx.createDelay(1.0);
            delayNode.delayTime.setValueAtTime(0.4, now); 
            const feedbackGain = audioCtx.createGain();
            feedbackGain.gain.setValueAtTime(0.35, now); 

            const masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);

            sourceGain.connect(filter);
            filter.connect(masterGain); 
            filter.connect(delayNode);  
            delayNode.connect(feedbackGain);
            feedbackGain.connect(delayNode);
            feedbackGain.connect(masterGain);
        }
    }

    bgMusicSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val !== 'none') {
            playSyntheticBg(val, true);
        }
    });

    function triggerBgSound() {
        const bgType = bgMusicSelect.value;
        if (bgType === 'none' || !isPlaying) return;
        playSyntheticBg(bgType, false);
    }

    function renderTotalStats() {
        const total = parseInt(localStorage.getItem('zhunti_total_count') || '0');
        totalCountDisplay.textContent = total.toLocaleString();
        
        let currentMilestoneTarget = 100000; 
        let rewardText = "";

        if (total >= 100000 && total < 200000) {
            currentMilestoneTarget = 200000; 
            rewardText = "🎉 已圓滿達成 10 萬遍功德！";
            milestoneTargetLabel.style.color = "#d9534f"; 
            milestoneTargetLabel.textContent = `下一階段目標：20 萬遍`;
        } else if (total >= 200000) {
            currentMilestoneTarget = 1000000; 
            rewardText = "🎉 已圓滿達成 20 萬遍！邁向百萬大圓滿！";
            milestoneTargetLabel.style.color = "#ff00ff";
            milestoneTargetLabel.textContent = `極致終點目標：100 萬遍`;
        } else {
            milestoneTargetLabel.style.color = "#b28500";
            milestoneTargetLabel.textContent = `目標里程碑：10 萬遍`;
        }
        
        let pct = (total / currentMilestoneTarget) * 100;
        if (pct > 100) pct = 100;
        
        progressBar.style.width = `${pct}%`;
        
        if (rewardText !== "") {
            progressBarText.textContent = `${rewardText} | 本階進度: ${pct.toFixed(2)}%`;
        } else {
            progressBarText.textContent = `終身功德總進度: ${pct.toFixed(2)}% (距${currentMilestoneTarget.toLocaleString()}遍)`;
        }
    }

    function addTotalCount(amount) {
        const currentTotal = parseInt(localStorage.getItem('zhunti_total_count') || '0');
        const newTotal = currentTotal + amount;
        
        if (currentTotal < 100000 && newTotal >= 100000) {
            alert("✨ 功德無量！您已成功達成第一個「10萬遍」準提神咒修持里程碑！下一階段20萬遍目標已自動解鎖，請繼續精進！");
        } else if (currentTotal < 200000 && newTotal >= 200000) {
            alert("✨ 嘆未曾有！您已成功圓滿「20萬遍」準提神咒修持！終極「百萬遍」目標已自動開啟，願同證菩提！");
        }

        localStorage.setItem('zhunti_total_count', newTotal);
        renderTotalStats();
    }

    manualCountBtn.addEventListener('click', () => {
        playChimeSound(); 
        count++;
        currentCountDisplay.textContent = count;
        addTotalCount(1);
        updateProgress();
        saveLiveCountToToday(1); // 實時記錄進度到今天

        const alertTrigger = parseInt(alertIntervalSelect.value);
        if (alertTrigger > 0 && count % alertTrigger === 0) {
            triggerToastPopup();
        }
    });

    function updateAllDedications() {
        const name = userNameInput.value || "某某某";
        const targetObj = targetObjectInput.value || "累劫冤親債主";
        
        document.getElementById('log-mirror').innerHTML = `信士 <span class="highlight">${name}</span> 願以此誦咒功德，迴向這面準提鏡，願佛光常照，護衛家門，令內外清淨，災障消除，諸願圓成。`;
        document.getElementById('log-blessing').innerHTML = `信士 <span class="highlight">${name}</span> 願以此誦咒功德，迴向給 <span class="highlight">${targetObj}</span>，希望蒙佛加持、業障消除、福慧雙增、常遇善友、如意自在，諸願圓成。`;
        document.getElementById('log-academic').innerHTML = `信士 <span class="highlight">${name}</span> 願以此誦咒功德，迴向給自己，希望智慧增長、思路靈敏、考試順利、金榜提名、心願達成。`;
        document.getElementById('log-relationship').innerHTML = `信士 <span class="highlight">${name}</span> 願以此誦咒功德，迴向給自己',希望我可以人天敬愛、得善諸緣、婚戀順利，所求自在。`;
        document.getElementById('log-wealth').innerHTML = `信士 <span class="highlight">${name}</span> 願以此誦咒功德，迴向給自己，希望財源富足、福德增長、運程順遂，所求圓滿。`;
    }

    userNameInput.addEventListener('input', updateAllDedications);
    targetObjectInput.addEventListener('input', updateAllDedications);

    function loadSavedAudio() {
        const savedAudioBase64 = localStorage.getItem('zhunti_saved_audio');
        if (savedAudioBase64) {
            nativeAudio.src = savedAudioBase64;
            nativeAudio.load();
            recordStatus.textContent = "✨ 已自動載入上次的準提法音！隨時可以開始";
            startBtn.disabled = false;
        }
    }

    recordBtn.addEventListener('click', async () => {
        initAudioContext();
        if (!isRecording) {
            audioChunks = [];
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                let options = { mimeType: 'audio/mp4' };
                if (!MediaRecorder.isTypeSupported('audio/mp4') && MediaRecorder.isTypeSupported('audio/webm')) {
                    options = { mimeType: 'audio/webm' };
                }

                mediaRecorder = new MediaRecorder(stream, options);
                mediaRecorder.ondataavailable = event => { if (event.data.size > 0) audioChunks.push(event.data); };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: options.mimeType });
                    
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = function() {
                        const base64data = reader.result;
                        try {
                            localStorage.setItem('zhunti_saved_audio', base64data);
                            nativeAudio.src = base64data;
                            nativeAudio.load();
                            recordStatus.textContent = "✅ 準提法音錄製成功，並已永久儲存！";
                        } catch(e) {
                            if (audioUrl) URL.revokeObjectURL(audioUrl);
                            audioUrl = URL.createObjectURL(audioBlob);
                            nativeAudio.src = audioUrl;
                            nativeAudio.load();
                            recordStatus.textContent = "✅ 錄製成功（因檔案過大僅限本次使用，建議錄製控制在3秒內以自動儲存）";
                        }
                        startBtn.disabled = false;
                    }
                    
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                recordBtn.textContent = "⏹️ 錄完再點擊一下 (停止)";
                recordBtn.classList.add('recording');
                recordStatus.textContent = "🎙️ 正在錄製準提咒...請唸誦...";
                startBtn.disabled = true;
            } catch (err) {
                alert("無法開啟麥克風，請檢查權限設定。");
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            recordBtn.textContent = "🔴 重新錄製準提咒";
            recordBtn.classList.remove('recording');
        }
    });

    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            isInfinite = (e.target.value === 'infinite');
            targetCountDiv.style.display = isInfinite ? 'none' : 'block';
        });
    });

    nativeAudio.addEventListener('ended', () => {
        if (!isPlaying) return;

        count++;
        currentCountDisplay.textContent = count;
        addTotalCount(1);
        updateProgress();
        saveLiveCountToToday(1); // 自動連播也實時同步到今天的日曆

        const alertTrigger = parseInt(alertIntervalSelect.value);
        if (alertTrigger > 0 && count % alertTrigger === 0) {
            triggerToastPopup(); 
        }

        if (!isInfinite && count >= target) {
            finishSession();
            return;
        }

        const speedInterval = parseInt(speedSelect.value);
        setTimeout(() => {
            if (isPlaying) {
                triggerBgSound();
                nativeAudio.currentTime = 0;
                nativeAudio.play().catch(e => console.log(e));
            }
        }, speedInterval);
    });

    function updateProgress() {
        if (isInfinite) {
            progressText.textContent = `大悲修持中（無限循環）...`;
        } else {
            progressText.textContent = `目標：${target} 次 / 已完成：${Math.round((count/target)*100)}%`;
        }
    }

    function triggerToastPopup() {
        alertMessage.textContent = alertQuotes[Math.floor(Math.random() * alertQuotes.length)];
        toastAlert.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastAlert.classList.remove('show');
        }, 5000);
    }

    startBtn.addEventListener('click', () => {
        if (!nativeAudio.src) return;
        initAudioContext();

        isPlaying = true;
        count = 0;
        target = parseInt(targetCountSelect.value);

        currentCountDisplay.textContent = count;
        updateProgress();

        startBtn.disabled = true;
        stopBtn.disabled = false;
        recordBtn.disabled = false;

        triggerBgSound();
        nativeAudio.currentTime = 0;
        nativeAudio.play().then(() => {
            nativeAudio.volume = 1.0;
        }).catch(err => {
            stopAudio();
        });
    });

    stopBtn.addEventListener('click', () => {
        stopAudio();
        progressText.textContent = "修持手動暫停";
        saveHistory(count, false);
    });

    function stopAudio() {
        isPlaying = false;
        nativeAudio.pause();
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    function finishSession() {
        stopAudio();
        progressText.textContent = "🎉 功德圓滿，請及時迴向！";
        saveHistory(count, true);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    // 【新增與重構】日曆核心打卡儲存邏輯
    function getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function saveLiveCountToToday(amount) {
        const historyMap = JSON.parse(localStorage.getItem('zhunti_cal_history') || '{}');
        const todayKey = getTodayKey();
        historyMap[todayKey] = (historyMap[todayKey] || 0) + amount;
        localStorage.setItem('zhunti_cal_history', JSON.stringify(historyMap));
        renderCalendar();
    }

    function saveHistory(finalCount, isCompleted) {
        if (finalCount === 0) return;
        // 同步保留一份日誌型紀錄，確保舊系統相容
        const history = JSON.parse(localStorage.getItem('zhunti_rec_history') || '[]');
        const log = {
            date: new Date().toLocaleString('zh-HK'),
            count: finalCount,
            status: isCompleted ? "功德圓滿" : "中途結束"
        };
        history.unshift(log);
        localStorage.setItem('zhunti_rec_history', JSON.stringify(history));
        
        renderCalendar();
    }

    // 【全新功能】打卡日曆渲染引擎
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        
        const year = currentNavDate.getFullYear();
        const month = currentNavDate.getMonth();
        
        calendarMonthLabel.textContent = `${year} 年 ${month + 1} 月`;
        
        // 渲染星期標籤
        const labels = ['日', '一', '二', '三', '四', '五', '六'];
        labels.forEach(l => {
            const div = document.createElement('div');
            div.className = 'calendar-day-label';
            div.textContent = l;
            calendarGrid.appendChild(div);
        });
        
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        // 渲染前置空白
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-cell empty';
            calendarGrid.appendChild(emptyCell);
        }
        
        // 讀取歷史日曆打卡數據
        const historyMap = JSON.parse(localStorage.getItem('zhunti_cal_history') || '{}');
        const todayStr = getTodayKey();
        
        // 渲染天數
        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.textContent = day;
            
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const totalOnDay = historyMap[dateKey] || 0;
            
            if (totalOnDay > 0) {
                cell.classList.add('has-practice');
                
                // 特殊提示框
                const tooltip = document.createElement('span');
                tooltip.className = 'tooltip';
                tooltip.textContent = `已精進持誦 ${totalOnDay} 遍`;
                cell.appendChild(tooltip);
                
                // 如果是今天，加入閃爍激勵
                if (dateKey === todayStr) {
                    cell.classList.add('today-practiced');
                }
            }
            
            calendarGrid.appendChild(cell);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentNavDate.setMonth(currentNavDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentNavDate.setMonth(currentNavDate.getMonth() + 1);
        renderCalendar();
    });

    clearHistoryBtn.addEventListener('click', () => {
        if(confirm('確定要清除所有每日持誦打卡紀錄？（注意：終身累計總數量將被安全保留）')) {
            localStorage.removeItem('zhunti_rec_history');
            localStorage.removeItem('zhunti_cal_history');
            renderCalendar();
        }
    });

    updateAllDedications();
    renderCalendar();
    renderTotalStats();
    loadSavedAudio(); 
</script>
