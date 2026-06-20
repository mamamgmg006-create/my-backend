const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_FILE = './users.json';
const MAIN_INVITE_CODE = 'ZG73223';

// ဒေတာဘေ့စ် ဖတ်/ရေး စနစ်
function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        return [];
    }
}

function writeDatabase(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Write error:", error);
    }
}

app.get('/', (req, res) => {
    res.send("Server is running smoothly!");
});

// === REGISTER ENDPOINT ===
app.post('/api/register', (req, res) => {
    const { username, contact, password, confirmPassword, inviteCode } = req.body;

    if (!username || !contact || !password || !inviteCode) {
        return res.status(400).json({ success: false, message: "Missing required fields!" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match!" });
    }

    const db = readDatabase();
    const isMainCode = (inviteCode === MAIN_INVITE_CODE);
    const isUserCode = db.some(user => user.myGeneratedCode === inviteCode);

    if (!isMainCode && !isUserCode) {
        return res.status(400).json({ success: false, message: "Registration Failed: Invalid Invitation Code!" });
    }

    const userExists = db.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username already exists!" });
    }

    // === ကျပန်း ဂဏန်း ၆ လုံး ထုတ်ပေးခြင်း စနစ်စစ်စစ် ===
    let generatedCode;
    let isDuplicate = true;
    while (isDuplicate) {
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        isDuplicate = db.some(user => user.myGeneratedCode === generatedCode);
    }

    // ဒေတာအချက်အလက်များကို ပုံသေသိမ်းဆည်းခြင်း
    const newUser = { 
        username, 
        contact, 
        password, 
        myGeneratedCode: generatedCode, // ဂဏန်း ၆ လုံး ကုဒ်သစ်
        balance: 10.00 
    };
    
    db.push(newUser);
    writeDatabase(db);
    
    console.log("Updated Database: ", db); // Render Logs တွင် ကြည့်ရန်
    return res.json({ success: true, message: "Registration successful! Please login." });
});

// === LOGIN ENDPOINT ===
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDatabase();
    
    const user = db.find(u => (u.username === username || u.contact === username) && u.password === password);

    if (user) {
        // အလွန်အရေးကြီးသည်- ဒေတာများကို Frontend ဆီသို့ ကွက်တိ ပြန်ပို့ပေးခြင်း
        return res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            username: user.username,
            contact: user.contact,
            balance: user.balance,
            myGeneratedCode: user.myGeneratedCode // ဤနေရာမှတစ်ဆင့် Frontend သို့ ပို့ပေးသည်
        });
    } else {
        return res.status(400).json({ success: false, message: "Invalid username or password!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});