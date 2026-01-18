// ========================================
// Syntra Frontend Application
// ========================================

const API_BASE = 'http://127.0.0.1:5000/api';

// Emotion icons mapping
const EMOTION_ICONS = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    sleepy: '😴',
    hungry: '🍽️'
};

// Suggestions for each emotion
const EMOTION_SUGGESTIONS = {
    happy: 'Your child seems content and happy. This is a great time for play or learning activities!',
    sad: 'Your child may be feeling down. Consider offering comfort, a hug, or engaging in a calming activity.',
    anxious: 'Your child may be feeling anxious. Try creating a calm environment and offering reassurance.',
    sleepy: 'Your child appears tired. It might be a good time for a nap or quiet rest.',
    hungry: 'Your child might be hungry. Consider offering a meal or snack.'
};

// ========================================
// Dashboard State
// ========================================
let isMonitoring = false;
let monitorInterval = null;
let sessionStartTime = null;
let sampleCount = 0;
let emotionCounts = { happy: 0, sad: 0, anxious: 0, sleepy: 0, hungry: 0 };
let recentEmotions = [];
let eegDataPoints = [];
const MAX_DATA_POINTS = 50;
let animationFrameId = null;
let glowPhase = 0;

// ========================================
// Initialize based on current page
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.toLowerCase();
    const href = window.location.href.toLowerCase();
    
    // Check both pathname and full href for file:// protocol compatibility
    if (path.includes('dashboard') || href.includes('dashboard')) {
        console.log('[Syntra] Initializing dashboard...');
        initDashboard();
    } else if (path.includes('history') || href.includes('history')) {
        console.log('[Syntra] Initializing history...');
        initHistory();
    } else if (path.includes('analysis') || href.includes('analysis')) {
        console.log('[Syntra] Initializing analysis...');
        initAnalysis();
    }
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});

// ========================================
// Dashboard Functions
// ========================================
function initDashboard() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const channelSelect = document.getElementById('channelSelect');
    
    if (startBtn) {
        startBtn.addEventListener('click', startMonitoring);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopMonitoring);
    }
    
    if (channelSelect) {
        channelSelect.addEventListener('change', updateChart);
    }
    
    // Check API connection
    checkConnection();
    
    // Initialize chart
    initChart();
}

async function checkConnection() {
    const statusIndicator = document.getElementById('connectionStatus');
    const connectionText = document.getElementById('connectionText');
    
    try {
        const response = await fetch(`${API_BASE}/emotions`);
        if (response.ok) {
            statusIndicator.classList.add('connected');
            statusIndicator.classList.remove('error');
            connectionText.textContent = 'Connected';
        } else {
            throw new Error('API error');
        }
    } catch (error) {
        statusIndicator.classList.add('error');
        statusIndicator.classList.remove('connected');
        connectionText.textContent = 'Disconnected';
    }
}

function startMonitoring() {
    isMonitoring = true;
    sessionStartTime = new Date();
    sampleCount = 0;
    emotionCounts = { happy: 0, sad: 0, anxious: 0, sleepy: 0, hungry: 0 };
    recentEmotions = [];
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    // Start fetching data
    fetchData();
    monitorInterval = setInterval(fetchData, 2000);
    
    // Start session timer
    updateSessionTimer();
    setInterval(updateSessionTimer, 1000);
}

function stopMonitoring() {
    isMonitoring = false;
    
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
    
    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}

async function fetchData() {
    if (!isMonitoring) return;
    
    try {
        const response = await fetch(`${API_BASE}/simulate`);
        const data = await response.json();
        
        if (data.success) {
            updateEmotionDisplay(data);
            updateBandPowers(data.band_powers);
            updateChart(data.eeg_data);
            updateRecentEmotions(data.emotion);
            updateSessionStats();
            
            sampleCount++;
            emotionCounts[data.emotion]++;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

let lastEmotion = null;

function updateEmotionDisplay(data) {
    const emotionIcon = document.getElementById('emotionIcon');
    const emotionLabel = document.getElementById('emotionLabel');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');
    const suggestionText = document.getElementById('suggestionText');
    const emotionDisplay = document.getElementById('emotionDisplay');
    
    const emotion = data.emotion;
    const confidence = Math.round(data.confidence * 100);
    
    // Check if emotion changed for animation trigger
    const emotionChanged = lastEmotion !== emotion;
    lastEmotion = emotion;
    
    // Update icon with animation
    if (emotionChanged) {
        emotionIcon.classList.add('emotion-pulse');
        emotionDisplay.classList.add('emotion-changed');
        
        setTimeout(() => {
            emotionIcon.classList.remove('emotion-pulse');
            emotionDisplay.classList.remove('emotion-changed');
        }, 600);
    }
    
    emotionIcon.innerHTML = `<span>${EMOTION_ICONS[emotion]}</span>`;
    emotionIcon.className = `emotion-icon ${emotion}${emotionChanged ? ' emotion-pulse' : ''}`;
    
    // Update label with typing effect on change
    if (emotionChanged) {
        const newLabel = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        emotionLabel.style.opacity = '0';
        emotionLabel.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            emotionLabel.textContent = newLabel;
            emotionLabel.style.opacity = '1';
            emotionLabel.style.transform = 'translateY(0)';
        }, 150);
    } else {
        emotionLabel.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    }
    
    // Animate confidence bar
    confidenceFill.style.width = `${confidence}%`;
    confidenceValue.textContent = `${confidence}%`;
    
    // Animate suggestion box on emotion change
    if (emotionChanged && suggestionText) {
        const suggestionBox = document.getElementById('suggestionBox');
        suggestionBox.classList.add('suggestion-update');
        suggestionText.textContent = EMOTION_SUGGESTIONS[emotion];
        
        setTimeout(() => {
            suggestionBox.classList.remove('suggestion-update');
        }, 500);
    }
}

function updateBandPowers(bandPowers) {
    if (!bandPowers) return;
    
    const bands = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
    const maxPower = Math.max(...Object.values(bandPowers));
    
    bands.forEach((band, index) => {
        const bar = document.getElementById(`${band}Bar`);
        const value = document.getElementById(`${band}Value`);
        const item = bar?.parentElement?.parentElement;
        
        if (bar && value) {
            const percentage = (bandPowers[band] / maxPower) * 100;
            
            // Staggered animation
            setTimeout(() => {
                bar.style.width = `${percentage}%`;
                
                // Add shimmer effect for high activity
                if (percentage > 70) {
                    bar.classList.add('band-high-activity');
                } else {
                    bar.classList.remove('band-high-activity');
                }
                
                // Animate value change
                const currentVal = parseFloat(value.textContent) || 0;
                const targetVal = bandPowers[band];
                animateValue(value, currentVal, targetVal, 300);
            }, index * 50);
        }
    });
}

// Helper function to animate numeric values
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;
        
        element.textContent = current.toFixed(1);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateRecentEmotions(emotion) {
    recentEmotions.unshift(emotion);
    if (recentEmotions.length > 10) {
        recentEmotions.pop();
    }
    
    const container = document.getElementById('recentEmotions');
    if (!container) return;
    
    container.innerHTML = recentEmotions.map((e, index) => `
        <span class="emotion-tag ${e} ${index === 0 ? 'emotion-tag-new' : ''}" style="animation-delay: ${index * 30}ms">
            ${EMOTION_ICONS[e]} ${e}
        </span>
    `).join('');
}

function updateSessionTimer() {
    if (!sessionStartTime) return;
    
    const now = new Date();
    const diff = Math.floor((now - sessionStartTime) / 1000);
    const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');
    
    const durationEl = document.getElementById('sessionDuration');
    if (durationEl) {
        durationEl.textContent = `${minutes}:${seconds}`;
    }
}

function updateSessionStats() {
    const sampleCountEl = document.getElementById('sampleCount');
    const dominantEmotionEl = document.getElementById('dominantEmotion');
    
    if (sampleCountEl) {
        sampleCountEl.textContent = sampleCount;
    }
    
    if (dominantEmotionEl) {
        const dominant = Object.entries(emotionCounts).reduce((a, b) => 
            b[1] > a[1] ? b : a
        );
        dominantEmotionEl.textContent = dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1);
    }
}

// ========================================
// Chart Functions
// ========================================
let chart = null;

function initChart() {
    const canvas = document.getElementById('eegChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Simple canvas-based chart
    chart = {
        ctx: ctx,
        canvas: canvas,
        data: []
    };
    
    // Set canvas size
    resizeChart();
    window.addEventListener('resize', resizeChart);
    
    // Draw initial empty chart
    drawChart();
}

function resizeChart() {
    if (!chart) return;
    
    const wrapper = chart.canvas.parentElement;
    chart.canvas.width = wrapper.clientWidth;
    chart.canvas.height = wrapper.clientHeight;
    drawChart();
}

function updateChart(newData) {
    if (!chart) return;
    
    if (newData && newData.Fp1 !== undefined) {
        // Add new data point
        eegDataPoints.push({
            Fp1: newData.Fp1,
            AF3: newData.AF3,
            F3: newData.F3,
            timestamp: Date.now()
        });
        
        // Keep only recent data points
        if (eegDataPoints.length > MAX_DATA_POINTS) {
            eegDataPoints.shift();
        }
    }
    
    drawChart();
}

// Animation frame ID for smooth rendering

function drawChart() {
    if (!chart) return;
    
    const ctx = chart.ctx;
    const canvas = chart.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#F8FAFC');
    bgGradient.addColorStop(1, '#EDF2F7');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw animated grid
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Vertical grid lines with subtle animation
    const gridOffset = (Date.now() / 100) % (width / 10);
    for (let i = -1; i <= 11; i++) {
        const x = (width / 10) * i + gridOffset;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    if (eegDataPoints.length < 2) {
        // Draw animated placeholder
        ctx.fillStyle = '#718096';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        
        // Pulsing text effect
        const alpha = 0.5 + Math.sin(Date.now() / 500) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillText('Start monitoring to see EEG signals', width / 2, height / 2);
        ctx.globalAlpha = 1;
        
        // Request next frame for animation
        if (isMonitoring) {
            animationFrameId = requestAnimationFrame(drawChart);
        }
        return;
    }
    
    // Get selected channel
    const channelSelect = document.getElementById('channelSelect');
    const selectedChannel = channelSelect ? channelSelect.value : 'Fp1';
    
    // Draw signal lines with glow effect
    const channels = selectedChannel === 'all' 
        ? ['Fp1', 'AF3', 'F3'] 
        : [selectedChannel];
    
    const colors = {
        Fp1: { main: '#E78F81', glow: 'rgba(231, 143, 129, 0.4)' },
        AF3: { main: '#63B3ED', glow: 'rgba(99, 179, 237, 0.4)' },
        F3: { main: '#68D391', glow: 'rgba(104, 211, 145, 0.4)' },
        F7: { main: '#F6AD55', glow: 'rgba(246, 173, 85, 0.4)' },
        FC5: { main: '#B794F4', glow: 'rgba(183, 148, 244, 0.4)' },
        FC1: { main: '#FC8181', glow: 'rgba(252, 129, 129, 0.4)' },
        C3: { main: '#4FD1C5', glow: 'rgba(79, 209, 197, 0.4)' },
        T7: { main: '#F687B3', glow: 'rgba(246, 135, 179, 0.4)' },
        CP5: { main: '#9F7AEA', glow: 'rgba(159, 122, 234, 0.4)' },
        CP1: { main: '#48BB78', glow: 'rgba(72, 187, 120, 0.4)' },
        P3: { main: '#ED8936', glow: 'rgba(237, 137, 54, 0.4)' },
        P7: { main: '#667EEA', glow: 'rgba(102, 126, 234, 0.4)' },
        PO3: { main: '#38B2AC', glow: 'rgba(56, 178, 172, 0.4)' },
        O1: { main: '#E53E3E', glow: 'rgba(229, 62, 62, 0.4)' }
    };
    
    // Update glow phase for animation
    glowPhase = (glowPhase + 0.05) % (Math.PI * 2);
    const glowIntensity = 4 + Math.sin(glowPhase) * 2;
    
    channels.forEach((channel, channelIndex) => {
        if (!eegDataPoints[0][channel]) return;
        
        const colorSet = colors[channel] || { main: '#E78F81', glow: 'rgba(231, 143, 129, 0.4)' };
        
        const values = eegDataPoints.map(d => d[channel] || 0);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;
        
        const yOffset = channels.length > 1 ? (height / channels.length) * channelIndex : 0;
        const yHeight = channels.length > 1 ? height / channels.length : height;
        
        // Draw glow effect first
        ctx.strokeStyle = colorSet.glow;
        ctx.lineWidth = glowIntensity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        eegDataPoints.forEach((point, index) => {
            const x = (index / (MAX_DATA_POINTS - 1)) * width;
            const normalizedY = (point[channel] - minVal) / range;
            const y = yOffset + yHeight - (normalizedY * yHeight * 0.8) - (yHeight * 0.1);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                // Smooth curve using quadratic bezier
                const prevPoint = eegDataPoints[index - 1];
                const prevX = ((index - 1) / (MAX_DATA_POINTS - 1)) * width;
                const prevNormalizedY = (prevPoint[channel] - minVal) / range;
                const prevY = yOffset + yHeight - (prevNormalizedY * yHeight * 0.8) - (yHeight * 0.1);
                
                const cpX = (prevX + x) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
            }
        });
        ctx.stroke();
        
        // Draw main line
        ctx.strokeStyle = colorSet.main;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        
        eegDataPoints.forEach((point, index) => {
            const x = (index / (MAX_DATA_POINTS - 1)) * width;
            const normalizedY = (point[channel] - minVal) / range;
            const y = yOffset + yHeight - (normalizedY * yHeight * 0.8) - (yHeight * 0.1);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevPoint = eegDataPoints[index - 1];
                const prevX = ((index - 1) / (MAX_DATA_POINTS - 1)) * width;
                const prevNormalizedY = (prevPoint[channel] - minVal) / range;
                const prevY = yOffset + yHeight - (prevNormalizedY * yHeight * 0.8) - (yHeight * 0.1);
                
                const cpX = (prevX + x) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
            }
        });
        ctx.stroke();
        
        // Draw leading dot at the end of the line
        if (eegDataPoints.length > 0) {
            const lastPoint = eegDataPoints[eegDataPoints.length - 1];
            const lastX = width;
            const lastNormalizedY = (lastPoint[channel] - minVal) / range;
            const lastY = yOffset + yHeight - (lastNormalizedY * yHeight * 0.8) - (yHeight * 0.1);
            
            // Outer glow
            ctx.beginPath();
            ctx.arc(lastX, lastY, 6 + Math.sin(glowPhase) * 2, 0, Math.PI * 2);
            ctx.fillStyle = colorSet.glow;
            ctx.fill();
            
            // Inner dot
            ctx.beginPath();
            ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
            ctx.fillStyle = colorSet.main;
            ctx.fill();
        }
        
        // Draw channel label with background
        const labelText = channel;
        ctx.font = 'bold 11px Inter';
        const textWidth = ctx.measureText(labelText).width;
        
        // Label background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(8, yOffset + 8, textWidth + 12, 20);
        ctx.strokeStyle = colorSet.main;
        ctx.lineWidth = 2;
        ctx.strokeRect(8, yOffset + 8, textWidth + 12, 20);
        
        // Label text
        ctx.fillStyle = colorSet.main;
        ctx.textAlign = 'left';
        ctx.fillText(labelText, 14, yOffset + 22);
    });
    
    // Continue animation loop when monitoring
    if (isMonitoring) {
        animationFrameId = requestAnimationFrame(drawChart);
    }
}

// ========================================
// History Page Functions
// ========================================
function initHistory() {
    const refreshBtn = document.getElementById('refreshHistory');
    const clearBtn = document.getElementById('clearHistory');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadHistory);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearHistory);
    }
    
    loadHistory();
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/history`);
        const data = await response.json();
        
        if (data.success) {
            displayHistory(data.history);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function displayHistory(history) {
    const totalRecords = document.getElementById('totalRecords');
    const mostCommon = document.getElementById('mostCommon');
    const avgConfidence = document.getElementById('avgConfidence');
    const tableBody = document.getElementById('historyTableBody');
    
    if (history.length === 0) {
        if (totalRecords) totalRecords.textContent = '0';
        if (mostCommon) mostCommon.textContent = '--';
        if (avgConfidence) avgConfidence.textContent = '--%';
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No history records yet. Start monitoring to collect data.</td></tr>';
        }
        return;
    }
    
    // Calculate stats
    const emotionCounts = {};
    let totalConfidence = 0;
    
    history.forEach(record => {
        emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + 1;
        totalConfidence += record.confidence || 0;
    });
    
    const dominant = Object.entries(emotionCounts).reduce((a, b) => 
        b[1] > a[1] ? b : a
    );
    
    // Update summary
    if (totalRecords) totalRecords.textContent = history.length;
    if (mostCommon) mostCommon.textContent = dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1);
    if (avgConfidence) avgConfidence.textContent = `${Math.round((totalConfidence / history.length) * 100)}%`;
    
    // Update distribution chart
    updateDistributionChart(emotionCounts, history.length);
    
    // Update table
    if (tableBody) {
        tableBody.innerHTML = history.slice(0, 50).map(record => `
            <tr>
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td>
                    <span class="emotion-tag ${record.emotion}">
                        ${EMOTION_ICONS[record.emotion]} ${record.emotion}
                    </span>
                </td>
                <td>${Math.round((record.confidence || 0) * 100)}%</td>
                <td>${record.method || 'rule-based'}</td>
            </tr>
        `).join('');
    }
}

function updateDistributionChart(counts, total) {
    const emotions = ['happy', 'sad', 'anxious', 'sleepy', 'hungry'];
    
    emotions.forEach(emotion => {
        const segment = document.getElementById(`${emotion}Segment`);
        if (segment) {
            const percentage = ((counts[emotion] || 0) / total) * 100;
            segment.style.width = `${percentage}%`;
        }
    });
}

async function clearHistory() {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/history`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadHistory();
        }
    } catch (error) {
        console.error('Error clearing history:', error);
    }
}

// ========================================
// Analysis Page Functions
// ========================================
let uploadedData = null;
const EEG_CHANNELS = ['Fp1', 'AF3', 'F3', 'F7', 'FC5', 'FC1', 'C3', 'T7', 'CP5', 'CP1', 'P3', 'P7', 'PO3', 'O1'];

function initAnalysis() {
    // Check connection
    checkConnection();
    
    // Initialize channel tags
    initChannelTags();
    
    // Setup upload zone
    setupUploadZone();
    
    // Setup sample buttons
    setupSampleButtons();
    
    // Setup action buttons
    setupAnalysisActions();
}

function initChannelTags() {
    const container = document.getElementById('channelTags');
    if (!container) return;
    
    container.innerHTML = EEG_CHANNELS.map(channel => 
        `<span class="channel-tag">${channel}</span>`
    ).join('');
}

function setupUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const removeFileBtn = document.getElementById('removeFile');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!uploadZone || !fileInput) return;
    
    // Click to upload
    uploadZone.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Remove file
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetUpload();
        });
    }
    
    // Analyze button
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeData);
    }
}

function handleFileUpload(file) {
    const validTypes = ['text/csv', 'application/json', 'text/plain'];
    const validExtensions = ['.csv', '.json', '.txt'];
    
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension) {
        alert('Please upload a CSV, JSON, or TXT file.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        const parsedData = parseEEGData(content, file.name);
        
        if (parsedData && parsedData.length > 0) {
            uploadedData = parsedData;
            showFilePreview(file, parsedData);
            document.getElementById('analyzeBtn').disabled = false;
        } else {
            alert('Could not parse the file. Please ensure it contains valid EEG data.');
        }
    };
    
    reader.readAsText(file);
}

function parseEEGData(content, filename) {
    try {
        if (filename.endsWith('.json')) {
            return parseJSONData(content);
        } else {
            return parseCSVData(content);
        }
    } catch (error) {
        console.error('Error parsing data:', error);
        return null;
    }
}

function parseCSVData(content) {
    const lines = content.trim().split('\n');
    const data = [];
    
    // Check if first line is header
    const firstLine = lines[0].split(/[,\t\s]+/).map(v => v.trim());
    const hasHeader = firstLine.some(v => isNaN(parseFloat(v)));
    
    const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const values = lines[i].split(/[,\t\s]+/).map(v => parseFloat(v.trim()));
        
        if (values.length >= 14 && values.every(v => !isNaN(v))) {
            data.push(values.slice(0, 14));
        } else if (values.length > 0 && values.some(v => !isNaN(v))) {
            // Pad with zeros if less than 14 channels
            const paddedValues = [...values.filter(v => !isNaN(v))];
            while (paddedValues.length < 14) {
                paddedValues.push(0);
            }
            data.push(paddedValues.slice(0, 14));
        }
    }
    
    return data;
}

function parseJSONData(content) {
    const json = JSON.parse(content);
    
    // Handle array of arrays
    if (Array.isArray(json) && Array.isArray(json[0])) {
        return json.map(row => row.slice(0, 14));
    }
    
    // Handle array of objects with channel names
    if (Array.isArray(json) && typeof json[0] === 'object') {
        return json.map(row => {
            return EEG_CHANNELS.map(ch => row[ch] || 0);
        });
    }
    
    // Handle single sample as object
    if (typeof json === 'object' && !Array.isArray(json)) {
        const values = EEG_CHANNELS.map(ch => json[ch] || 0);
        return [values];
    }
    
    // Handle single array
    if (Array.isArray(json) && typeof json[0] === 'number') {
        return [json.slice(0, 14)];
    }
    
    return null;
}

function showFilePreview(file, data) {
    const uploadZone = document.getElementById('uploadZone');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const previewHead = document.getElementById('previewHead');
    const previewBody = document.getElementById('previewBody');
    const previewInfo = document.getElementById('previewInfo');
    
    uploadZone.style.display = 'none';
    filePreview.style.display = 'block';
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Create table header
    previewHead.innerHTML = `<tr>${EEG_CHANNELS.map(ch => `<th>${ch}</th>`).join('')}</tr>`;
    
    // Create table body (show first 5 rows)
    const previewRows = data.slice(0, 5);
    previewBody.innerHTML = previewRows.map(row => 
        `<tr>${row.map(v => `<td>${v.toFixed(2)}</td>`).join('')}</tr>`
    ).join('');
    
    previewInfo.textContent = `Showing ${previewRows.length} of ${data.length} samples`;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function resetUpload() {
    uploadedData = null;
    
    const uploadZone = document.getElementById('uploadZone');
    const filePreview = document.getElementById('filePreview');
    const fileInput = document.getElementById('fileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    uploadZone.style.display = 'block';
    filePreview.style.display = 'none';
    fileInput.value = '';
    analyzeBtn.disabled = true;
}

function setupSampleButtons() {
    const sampleButtons = document.querySelectorAll('.btn-sample');
    
    sampleButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const emotion = btn.dataset.emotion;
            await loadSampleData(emotion);
        });
    });
}

async function loadSampleData(emotion) {
    showLoading();
    
    try {
        // Fetch simulated data from the API
        const response = await fetch(`${API_BASE}/simulate?emotion=${emotion}`);
        const data = await response.json();
        
        if (data.success && data.eeg_data) {
            // Convert the dict format to array
            const eegArray = EEG_CHANNELS.map(ch => data.eeg_data[ch] || 0);
            uploadedData = [eegArray];
            
            // Show results directly since we already have classification
            displayResults({
                emotion: data.emotion,
                confidence: data.confidence,
                need: data.need,
                emoji: data.emoji,
                band_powers: data.band_powers,
                probabilities: generateProbabilities(data.emotion, data.confidence)
            });
        }
    } catch (error) {
        console.error('Error loading sample data:', error);
        hideLoading();
        alert('Error loading sample data. Please ensure the backend is running.');
    }
}

function generateProbabilities(emotion, confidence) {
    const emotions = ['happy', 'sad', 'anxious', 'sleepy', 'hungry'];
    const probs = {};
    
    // Assign remaining probability to other emotions
    const remaining = 1 - confidence;
    const otherCount = emotions.length - 1;
    
    emotions.forEach(e => {
        if (e === emotion) {
            probs[e] = confidence;
        } else {
            probs[e] = remaining / otherCount + (Math.random() * 0.05 - 0.025);
        }
    });
    
    return probs;
}

async function analyzeData() {
    if (!uploadedData || uploadedData.length === 0) {
        alert('Please upload data first.');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/classify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eeg_data: uploadedData,
                use_model: true
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        displayResults(result);
    } catch (error) {
        console.error('Error analyzing data:', error);
        hideLoading();
        alert('Error analyzing data: ' + error.message);
    }
}

function showLoading() {
    document.getElementById('resultsPlaceholder').style.display = 'none';
    document.getElementById('resultsContent').style.display = 'none';
    document.getElementById('resultsLoading').style.display = 'block';
    
    // Animate loading steps
    const steps = ['step1', 'step2', 'step3'];
    let currentStep = 0;
    
    const stepInterval = setInterval(() => {
        if (currentStep > 0) {
            document.getElementById(steps[currentStep - 1]).classList.remove('active');
            document.getElementById(steps[currentStep - 1]).classList.add('done');
        }
        
        if (currentStep < steps.length) {
            document.getElementById(steps[currentStep]).classList.add('active');
            currentStep++;
        } else {
            clearInterval(stepInterval);
        }
    }, 600);
}

function hideLoading() {
    document.getElementById('resultsLoading').style.display = 'none';
    
    // Reset step states
    ['step1', 'step2', 'step3'].forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('active', 'done');
    });
}

function displayResults(result) {
    setTimeout(() => {
        hideLoading();
        document.getElementById('resultsContent').style.display = 'block';
        
        // Update emotion display
        const emotionIcon = document.getElementById('resultEmotionIcon');
        const emotionLabel = document.getElementById('resultEmotionLabel');
        const emotionNeed = document.getElementById('resultNeed');
        
        emotionIcon.innerHTML = `<span>${result.emoji || EMOTION_ICONS[result.emotion]}</span>`;
        emotionIcon.className = `emotion-icon-large ${result.emotion}`;
        emotionLabel.textContent = result.emotion.charAt(0).toUpperCase() + result.emotion.slice(1);
        emotionNeed.textContent = result.need || EMOTION_SUGGESTIONS[result.emotion];
        
        // Update confidence circle
        const confidence = Math.round(result.confidence * 100);
        const confidenceProgress = document.getElementById('confidenceProgress');
        const confidenceText = document.getElementById('resultConfidence');
        
        // Calculate stroke-dashoffset (283 is circumference of circle with r=45)
        const offset = 283 - (283 * confidence / 100);
        confidenceProgress.style.strokeDashoffset = offset;
        confidenceText.textContent = `${confidence}%`;
        
        // Update band powers
        if (result.band_powers) {
            updateResultBandPowers(result.band_powers);
        }
        
        // Update probabilities
        if (result.probabilities) {
            updateProbabilities(result.probabilities, result.emotion);
        }
        
        // Update suggestion
        const suggestionText = document.getElementById('resultSuggestionText');
        suggestionText.textContent = EMOTION_SUGGESTIONS[result.emotion];
        
    }, 1800); // Wait for loading animation
}

function updateResultBandPowers(bandPowers) {
    const bands = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
    const maxPower = Math.max(...Object.values(bandPowers));
    
    bands.forEach((band, index) => {
        const bar = document.getElementById(`result${band.charAt(0).toUpperCase() + band.slice(1)}Bar`);
        const value = document.getElementById(`result${band.charAt(0).toUpperCase() + band.slice(1)}Value`);
        
        if (bar && value) {
            const percentage = (bandPowers[band] / maxPower) * 100;
            
            // Animate with stagger
            setTimeout(() => {
                bar.style.height = `${percentage}%`;
                value.textContent = bandPowers[band].toFixed(1);
            }, index * 100);
        }
    });
}

function updateProbabilities(probs, highlightEmotion) {
    const grid = document.getElementById('probabilitiesGrid');
    if (!grid) return;
    
    const emotions = ['happy', 'sad', 'anxious', 'sleepy', 'hungry'];
    
    grid.innerHTML = emotions.map((emotion, index) => {
        const prob = Math.round((probs[emotion] || 0) * 100);
        const isHighlight = emotion === highlightEmotion;
        
        return `
            <div class="probability-item ${isHighlight ? 'highlight' : ''}" style="animation-delay: ${index * 100}ms">
                <span class="emoji">${EMOTION_ICONS[emotion]}</span>
                <span class="label">${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
                <span class="value">${prob}%</span>
            </div>
        `;
    }).join('');
}

function setupAnalysisActions() {
    const downloadBtn = document.getElementById('downloadReport');
    const newAnalysisBtn = document.getElementById('newAnalysis');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadReport);
    }
    
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            resetUpload();
            document.getElementById('resultsContent').style.display = 'none';
            document.getElementById('resultsPlaceholder').style.display = 'block';
        });
    }
}

function downloadReport() {
    const emotionLabel = document.getElementById('resultEmotionLabel').textContent;
    const confidence = document.getElementById('resultConfidence').textContent;
    const suggestion = document.getElementById('resultSuggestionText').textContent;
    
    const report = `
SYNTRA EEG Analysis Report
==========================
Generated: ${new Date().toLocaleString()}

Detected Emotion: ${emotionLabel}
Confidence: ${confidence}

Caregiver Suggestion:
${suggestion}

---
This report was generated by Syntra - Bridging Minds, Building Understanding
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syntra-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
