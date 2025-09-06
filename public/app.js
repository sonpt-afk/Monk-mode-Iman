// Monk Mode Dashboard JavaScript
class MonkModeDashboard {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.charts = {};
        this.data = {};
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderOverview();
        this.renderMonthlyMilestones();
        this.setupCharts();
        this.loadTodayData();
        this.updateWeeklyStats();
    }

    // Data Management
    async loadData() {
        try {
            const response = await fetch('/api/data');
            this.data = await response.json();
            // Add default targets if not present
            this.data.daily_targets = this.data.daily_targets || {
                deep_work_hours: 3,
                phone_screen_time: 1,
                exercise_sessions_per_week: 5,
                sleep_hours: 8,
                meditation_minutes: 10
            };
        } catch (error) {
            console.error('Failed to load data from server:', error);
            this.showAchievementModal('Không thể tải dữ liệu từ server. Vui lòng thử lại.');
        }
    }

    async saveData(dailyLog) {
        try {
            const response = await fetch('/api/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dailyLog),
            });
            const result = await response.json();
            this.data = result.data; // Update local data with server response
            return true;
        } catch (error) {
            console.error('Failed to save data to server:', error);
            this.showAchievementModal('Lỗi: Không thể lưu dữ liệu lên server.');
            return false;
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });

        // Daily form submission
        document.getElementById('dailyLogForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDailyLog();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Export data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideModal();
        });

        // Exercise toggle
        document.getElementById('dailyExercise').addEventListener('change', (e) => {
            const exerciseType = document.getElementById('dailyExerciseType');
            if (e.target.value === 'true') {
                exerciseType.style.display = 'block';
                exerciseType.focus();
            } else {
                exerciseType.style.display = 'none';
            }
        });
    }

    // Navigation
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Update charts if needed
        if (tabName === 'weekly') {
            this.updateWeeklyChart();
        }
    }

    // Overview Rendering
    renderOverview() {
        const profile = this.data.user_profile;
        
        document.getElementById('currentMonth').textContent = profile.current_month;
        document.getElementById('daysCompleted').textContent = profile.days_completed;
        document.getElementById('streakCount').textContent = profile.streak_count;

        // Display motivational quote
        const quotes = this.data.motivational_quotes;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('dailyQuote').textContent = randomQuote;

        // Update today's metrics
        this.updateTodayMetrics();
    }

    updateTodayMetrics() {
        const todayLog = this.getTodayLog();
        const targets = this.data.daily_targets;

        // Deep Work
        const deepWorkValue = todayLog ? todayLog.deep_work_hours : 0;
        this.updateProgressRing('deepWorkCircle', deepWorkValue / targets.deep_work_hours);
        document.getElementById('deepWorkValue').textContent = deepWorkValue.toFixed(1);

        // Screen Time
        const screenTimeValue = todayLog ? todayLog.phone_screen_time : 0;
        const screenTimeProgress = Math.min(screenTimeValue / targets.phone_screen_time, 1);
        this.updateProgressRing('screenTimeCircle', screenTimeProgress, screenTimeValue > targets.phone_screen_time);
        document.getElementById('screenTimeValue').textContent = screenTimeValue.toFixed(1);

        // Exercise
        const exerciseDone = todayLog ? todayLog.exercise_done : false;
        const exerciseIndicator = document.getElementById('exerciseIndicator');
        const exerciseStatus = document.getElementById('exerciseStatus');
        const exerciseType = document.getElementById('exerciseType');
        
        if (exerciseDone) {
            exerciseStatus.textContent = 'Đã hoàn thành';
            exerciseStatus.classList.add('completed');
            exerciseType.value = todayLog.exercise_type || '';
            exerciseIndicator.closest('.metric-card').classList.add('success');
        } else {
            exerciseStatus.textContent = 'Chưa hoàn thành';
            exerciseStatus.classList.remove('completed');
            exerciseType.value = '';
            exerciseIndicator.closest('.metric-card').classList.remove('success');
        }

        // Sleep
        const sleepValue = todayLog ? todayLog.sleep_hours : 0;
        const sleepQuality = todayLog ? todayLog.sleep_quality : 0;
        document.getElementById('sleepValue').textContent = sleepValue.toFixed(1);
        document.getElementById('sleepQuality').textContent = sleepQuality;
    }

    updateProgressRing(elementId, progress, isWarning = false) {
        const circle = document.getElementById(elementId);
        const circumference = 2 * Math.PI * 40; // radius = 40
        const offset = circumference - (progress * circumference);
        
        circle.style.strokeDashoffset = offset;
        
        if (isWarning) {
            circle.style.stroke = 'var(--color-warning)';
        } else if (progress >= 1) {
            circle.style.stroke = 'var(--color-success)';
        } else {
            circle.style.stroke = 'var(--color-primary)';
        }
    }

    // Daily Log Management
    getTodayLog() {
        return this.data.daily_logs.find(log => log.date === this.currentDate);
    }

    loadTodayData() {
        const todayLog = this.getTodayLog();
        if (todayLog) {
            document.getElementById('dailyDeepWork').value = todayLog.deep_work_hours;
            document.getElementById('dailyScreenTime').value = todayLog.phone_screen_time;
            document.getElementById('dailyExercise').value = todayLog.exercise_done.toString();
            document.getElementById('dailyExerciseType').value = todayLog.exercise_type || '';
            document.getElementById('dailySleep').value = todayLog.sleep_hours;
            document.getElementById('dailySleepQuality').value = todayLog.sleep_quality;
            document.getElementById('dailyMood').value = todayLog.mood_score;
            document.getElementById('dailyMeditation').value = todayLog.meditation_done.toString();
            document.getElementById('dailyNotes').value = todayLog.notes || '';
        }
    }

    saveDailyLog() {
        const formData = {
            date: this.currentDate,
            deep_work_hours: parseFloat(document.getElementById('dailyDeepWork').value) || 0,
            phone_screen_time: parseFloat(document.getElementById('dailyScreenTime').value) || 0,
            exercise_done: document.getElementById('dailyExercise').value === 'true',
            exercise_type: document.getElementById('dailyExerciseType').value || '',
            sleep_hours: parseFloat(document.getElementById('dailySleep').value) || 0,
            sleep_quality: parseInt(document.getElementById('dailySleepQuality').value) || 0,
            mood_score: parseFloat(document.getElementById('dailyMood').value) || 0,
            meditation_done: document.getElementById('dailyMeditation').value === 'true',
            notes: document.getElementById('dailyNotes').value || ''
        };

        // Update or add log
        const existingIndex = this.data.daily_logs.findIndex(log => log.date === this.currentDate);
        if (existingIndex >= 0) {
            this.data.daily_logs[existingIndex] = formData;
        } else {
            this.data.daily_logs.push(formData);
        }

        this.saveData();
        this.updateTodayMetrics();
        this.updateWeeklyStats();
        this.checkAchievements();
        
        // Show success message
        this.showAchievementModal('✅ Đã lưu dữ liệu ngày hôm nay thành công!');
    }

    // Weekly Stats
    updateWeeklyStats() {
        const last7Days = this.getLast7DaysLogs();
        
        const avgDeepWork = last7Days.reduce((sum, log) => sum + log.deep_work_hours, 0) / last7Days.length;
        const exerciseDays = last7Days.filter(log => log.exercise_done).length;
        const avgSleep = last7Days.reduce((sum, log) => sum + log.sleep_hours, 0) / last7Days.length;

        document.getElementById('weeklyDeepWork').textContent = avgDeepWork.toFixed(1) + 'h';
        document.getElementById('weeklyExercise').textContent = `${exerciseDays}/7`;
        document.getElementById('weeklySleep').textContent = avgSleep.toFixed(1) + 'h';
    }

    getLast7DaysLogs() {
        const logs = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const log = this.data.daily_logs.find(l => l.date === dateStr);
            logs.push(log || {
                date: dateStr,
                deep_work_hours: 0,
                phone_screen_time: 0,
                exercise_done: false,
                sleep_hours: 0,
                mood_score: 5
            });
        }
        return logs;
    }

    // Charts
    setupCharts() {
        this.setupWeeklyChart();
        this.setupWeeklyDetailChart();
    }

    setupWeeklyChart() {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        const last7Days = this.getLast7DaysLogs();
        
        const labels = last7Days.map(log => {
            const date = new Date(log.date);
            return date.toLocaleDateString('vi-VN', { weekday: 'short' });
        });

        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Deep Work (h)',
                        data: last7Days.map(log => log.deep_work_hours),
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Screen Time (h)',
                        data: last7Days.map(log => log.phone_screen_time),
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Sleep (h)',
                        data: last7Days.map(log => log.sleep_hours),
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'var(--color-text)'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--color-text-secondary)'
                        },
                        grid: {
                            color: 'var(--color-border)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--color-text-secondary)'
                        },
                        grid: {
                            color: 'var(--color-border)'
                        }
                    }
                }
            }
        });
    }

    setupWeeklyDetailChart() {
        const ctx = document.getElementById('weeklyDetailChart').getContext('2d');
        const last7Days = this.getLast7DaysLogs();
        
        const labels = last7Days.map(log => {
            const date = new Date(log.date);
            return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
        });

        this.charts.weeklyDetail = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Mood Score',
                        data: last7Days.map(log => log.mood_score),
                        backgroundColor: '#5D878F',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--color-text)'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: 'var(--color-text-secondary)'
                        },
                        grid: {
                            color: 'var(--color-border)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--color-text-secondary)'
                        },
                        grid: {
                            color: 'var(--color-border)'
                        }
                    }
                }
            }
        });
    }

    updateWeeklyChart() {
        if (this.charts.weeklyDetail) {
            const last7Days = this.getLast7DaysLogs();
            this.charts.weeklyDetail.data.datasets[0].data = last7Days.map(log => log.mood_score);
            this.charts.weeklyDetail.update();
        }
    }

    // Monthly Milestones
    renderMonthlyMilestones() {
        const container = document.getElementById('monthlyMilestones');
        container.innerHTML = '';

        this.data.monthly_milestones.forEach(milestone => {
            const milestoneEl = document.createElement('div');
            milestoneEl.className = 'milestone-card card';
            milestoneEl.style.borderLeftColor = milestone.color;

            const statusClass = milestone.status.replace('_', '-');
            const statusText = milestone.status === 'in_progress' ? 'Đang thực hiện' :
                             milestone.status === 'completed' ? 'Hoàn thành' : 'Chưa bắt đầu';

            milestoneEl.innerHTML = `
                <div class="card__body">
                    <div class="milestone-header">
                        <div>
                            <h3 class="milestone-title">Tháng ${milestone.month}: ${milestone.title}</h3>
                            <span class="status status--${statusClass}">${statusText}</span>
                        </div>
                        <div class="milestone-progress">${milestone.completion_rate}%</div>
                    </div>
                    <div class="milestone-goals">
                        ${milestone.key_goals.map(goal => `
                            <div class="goal-item">
                                <span class="goal-text">${goal.goal}</span>
                                <div class="goal-status">
                                    <div class="goal-progress-bar">
                                        <div class="goal-progress-fill" style="width: ${goal.progress}%"></div>
                                    </div>
                                    <span class="goal-check ${goal.completed ? 'completed' : 'pending'}">
                                        ${goal.completed ? '✅' : '⏳'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            container.appendChild(milestoneEl);
        });
    }

    // Achievements
    checkAchievements() {
        const badges = this.data.achievement_badges;
        let newAchievements = [];

        // Check Early Riser achievement
        const last7Days = this.getLast7DaysLogs();
        if (last7Days.length >= 7 && !badges[0].earned) {
            // Simplified check - assume user is early riser if deep work > 0
            const earlyRiserDays = last7Days.filter(log => log.deep_work_hours > 0).length;
            if (earlyRiserDays >= 7) {
                badges[0].earned = true;
                newAchievements.push('🌅 Early Riser Badge đã mở khóa!');
            }
        }

        // Check Deep Work Master
        if (last7Days.length >= 7 && !badges[1].earned) {
            const deepWorkDays = last7Days.filter(log => log.deep_work_hours >= 3).length;
            if (deepWorkDays >= 7) {
                badges[1].earned = true;
                newAchievements.push('🎯 Deep Work Master Badge đã mở khóa!');
            }
        }

        // Check Phone Detox
        const last14Days = this.data.daily_logs.slice(-14);
        if (last14Days.length >= 14 && !badges[2].earned) {
            const phoneDisciplineDays = last14Days.filter(log => log.phone_screen_time <= 1).length;
            if (phoneDisciplineDays >= 14) {
                badges[2].earned = true;
                newAchievements.push('📱 Phone Detox Badge đã mở khóa!');
            }
        }

        if (newAchievements.length > 0) {
            this.showAchievementModal(newAchievements.join('\n'));
            this.saveData();
        }
    }

    // UI Utils
    showAchievementModal(text) {
        document.getElementById('achievementText').textContent = text;
        document.getElementById('achievementModal').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('achievementModal').classList.add('hidden');
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        
        const themeButton = document.getElementById('themeToggle');
        themeButton.textContent = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
        
        localStorage.setItem('theme', newTheme);
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `monk-mode-data-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        const themeButton = document.getElementById('themeToggle');
        themeButton.textContent = savedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }

    // Initialize dashboard
    window.dashboard = new MonkModeDashboard();
});