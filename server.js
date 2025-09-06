const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@vercel/kv');

const app = express();
const port = 3000;

// Use Vercel KV client if environment variables are set, otherwise fallback to a local file mock for development
const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : {
      // Mock KV for local development
      _dbPath: path.join(__dirname, 'db.json'),
      async get(key) {
        try {
            const data = await fs.readFile(this._dbPath, 'utf-8');
            const db = JSON.parse(data);
            return db;
        } catch (e) { return null; }
      },
      async set(key, value) {
        await fs.writeFile(this._dbPath, JSON.stringify(value, null, 2));
      }
  };

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API to get all data
app.get('/api/data', async (req, res) => {
    try {
        const data = await kv.get('db');
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
        const db = await kv.get('db');

        if (!db) {
            return res.status(500).json({ message: 'Database not initialized' });
        }

        const existingIndex = db.daily_logs.findIndex(log => log.date === dailyLog.date);

        if (existingIndex >= 0) {
            db.daily_logs[existingIndex] = dailyLog;
        } else {
            db.daily_logs.push(dailyLog);
        }

        db.user_profile.days_completed = db.daily_logs.length;
        // A more complex streak logic would be needed for a real app
        db.user_profile.streak_count = db.daily_logs.length; 

        await kv.set('db', db);
        res.json({ message: 'Log saved successfully', data: db });

    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ message: 'Error saving log' });
    }
});

// Load initial static data into db.json if it's empty
const initializeDatabase = async () => {
    try {
        const db = await kv.get('db');

        if (db && db.monk_mode_curriculum && Object.keys(db.monk_mode_curriculum).length > 0) {
            console.log('Database already initialized.');
            return;
        }

        console.log('Initializing database with static JSON data...');
        
        const initialDb = {
            user_profile: {
                name: "Web Developer",
                start_date: new Date().toISOString().split('T')[0],
                current_month: 1,
                days_completed: 0,
                streak_count: 0
            },
            daily_logs: [],
            monk_mode_curriculum: JSON.parse(await fs.readFile(path.join(__dirname, 'monk_mode_curriculum.json'), 'utf-8')),
            daily_schedule: JSON.parse(await fs.readFile(path.join(__dirname, 'daily_schedule.json'), 'utf-8')),
            health_checklist: JSON.parse(await fs.readFile(path.join(__dirname, 'health_checklist.json'), 'utf-8')),
            anti_distraction_system: JSON.parse(await fs.readFile(path.join(__dirname, 'anti_distraction_system.json'), 'utf-8')),
            tracking_dashboard: JSON.parse(await fs.readFile(path.join(__dirname, 'tracking_dashboard.json'), 'utf-8')),
            monk_mode_flashcards: JSON.parse(await fs.readFile(path.join(__dirname, 'monk_mode_flashcards.json'), 'utf-8'))
        };

        await kv.set('db', initialDb);
        console.log('Database initialized successfully.');

    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// For Vercel, the server needs to export the app.
// For local development, we listen on a port.
if (process.env.VERCEL) {
    initializeDatabase().then(() => console.log('Vercel init complete.'));
} else {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        initializeDatabase();
    });
}

module.exports = app;
