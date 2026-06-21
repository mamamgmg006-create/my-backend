const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_FILE = './users.json';
const MAIN_INVITE_CODE = 'ZG73223';

function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
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
        console.error(error);
    }
}

app.get('/', (req, res) => {
    res.send("Server is running perfectly!");
});

// === REGISTER ===
app.post('/api/register', (req, res) => {
    const { username, contact, password, confirmPassword, inviteCode } = req.body;

    if (!username || !contact || !password || !inviteCode) {
        return res.status(400).json({ success: false, message: "Missing fields!" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match!" });
    }

    const db = readDatabase();
    const isMainCode = (inviteCode === MAIN_INVITE_CODE);
    const isUserCode = db.some(user => user.myInviteCode === inviteCode);

    if (!isMainCode && !isUserCode) {
        return res.status(400).json({ success: false, message: "Invalid Invitation Code!" });
    }

    const userExists = db.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username already exists!" });
    }

    // ကျပန်း ဂဏန်း ၆ လုံး ထုတ်ပေးခြင်း
    let generatedCode;
    let isDuplicate = true;
    while (isDuplicate) {
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        isDuplicate = db.some(user => user.myInviteCode === generatedCode);
    }

    // တည်ဆောက်ပုံ Format ကို အသေ သတ်မှတ်ခြင်း
    const newUser = { 
        username, 
        contact, 
        password, 
        myInviteCode: generatedCode, 
        balance: 10.00 
    };
    
    db.push(newUser);
    writeDatabase(db);
    return res.json({ success: true, message: "Registration successful!" });
});

// === LOGIN ===
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDatabase();
    
    const user = db.find(u => (u.username === username || u.contact === username) && u.password === password);

    if (user) {
        // ဒေတာအမှန်များကို ကွက်တိ ပြန်ပေးလိုက်ခြင်း
        return res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            username: user.username,
            contact: user.contact,
            balance: user.balance,
            myInviteCode: user.myInviteCode
        });
    } else {
        return res.status(400).json({ success: false, message: "Invalid username or password!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));