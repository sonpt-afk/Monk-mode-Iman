const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@vercel/kv');

const app = express();
const port = 3000;

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// --- Database Initialization Logic ---
// This function ensures the database is initialized before any operation.
async function getDatabase() {
  let db = await kv.get('db');
  if (!db) {
    console.log('Database not found, initializing with static JSON data...');
    
    const initialDb = {
        user_profile: {
            name: "Web Developer",
            start_date: new Date().toISOString().split('T')[0],
            current_month: 1,
            days_completed: 0,
            streak_count: 0
        },
        daily_targets: {
            deep_work_hours: 3,
            phone_screen_time: 1,
            exercise_sessions_per_week: 5,
            sleep_hours: 8,
            meditation_minutes: 10
        },
        daily_logs: [],
        motivational_quotes: [
            "Kỷ luật là lựa chọn giữa thứ bạn muốn bây giờ và thứ bạn muốn nhất.",
            "Bạn không vươn tới mức độ của mục tiêu. Bạn rơi xuống mức độ của hệ thống.",
            "Đầu tư tốt nhất bạn có thể làm là đầu tư vào chính mình.",
            "Tập trung là lợi thế cạnh tranh tối thượng trong thế giới hiện đại.",
            "Những cải thiện nhỏ hàng ngày dẫn đến kết quả tuyệt vời theo thời gian."
        ],
        achievement_badges: [
            {name: "Early Riser", description: "Thức dậy lúc 6h trong 7 ngày liền", earned: false},
            {name: "Deep Work Master", description: "Hoàn thành 3+ giờ deep work trong 7 ngày", earned: false},
            {name: "Phone Detox", description: "Giữ thời gian sử dụng điện thoại dưới 1h trong 14 ngày", earned: false},
            {name: "Exercise Streak", description: "Tập thể dục 5 ngày/tuần trong 4 tuần", earned: false},
            {name: "Sleep Champion", description: "Ngủ 7-8h trong 21 ngày liền", earned: false}
        ],
        monk_mode_curriculum: JSON.parse(await fs.readFile(path.join(__dirname, 'monk_mode_curriculum.json'), 'utf-8')),
        daily_schedule: JSON.parse(await fs.readFile(path.join(__dirname, 'daily_schedule.json'), 'utf-8')),
        health_checklist: JSON.parse(await fs.readFile(path.join(__dirname, 'health_checklist.json'), 'utf-8')),
        anti_distraction_system: JSON.parse(await fs.readFile(path.join(__dirname, 'anti_distraction_system.json'), 'utf-8')),
        tracking_dashboard: JSON.parse(await fs.readFile(path.join(__dirname, 'tracking_dashboard.json'), 'utf-8')),
        monk_mode_flashcards: JSON.parse(await fs.readFile(path.join(__dirname, 'monk_mode_flashcards.json'), 'utf-8')),
        monthly_milestones: [] // Thêm trường này
    };

    await kv.set('db', initialDb);
    db = initialDb;
    console.log('Database initialized successfully.');
  }
  return db;
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API to get all data
app.get('/api/data', async (req, res) => {
    try {
        const data = await getDatabase();
        res.json(data);
    } catch (error) {
        console.error('Error reading database:', error);
        res.status(500).json({ message: 'Error reading database' });
    }
});

// API to save daily log
app.post('/api/log', async (req, res) => {
    try {
        const dailyLog = req.body;
        const db = await getDatabase();

        const existingIndex = db.daily_logs.findIndex(log => log.date === dailyLog.date);

        if (existingIndex >= 0) {
            db.daily_logs[existingIndex] = dailyLog;
        } else {
            db.daily_logs.push(dailyLog);
        }

        db.user_profile.days_completed = db.daily_logs.length;
        db.user_profile.streak_count = db.daily_logs.length; 

        await kv.set('db', db);
        res.json({ message: 'Log saved successfully', data: db });

    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ message: 'Error saving log' });
    }
});

// For local development, we can remove the VERCEL check and just listen
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
