const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs'); // ဖိုင်ထဲမှာ ဒေတာအသေသိမ်းရန် စနစ်သုံးထားသည်

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.options('*', cors());

const DATA_FILE = './users.json';
const MAIN_INVITE_CODE = 'ZG73223';

// ဒေတာဖတ်ခြင်းနှင့် သိမ်းဆည်းခြင်း လုပ်ဆောင်ချက်များ
function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.stringify(data) === '{}' || !data ? [] : JSON.parse(data);
    } catch (error) {
        console.error("Database read error:", error);
        return [];
    }
}

function writeDatabase(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Database write error:", error);
    }
}

app.get('/', (req, res) => {
    res.send("Server is running perfectly with permanent file storage!");
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

    // ဖိတ်ခေါ်ကုဒ် မှန်မမှန် စစ်ဆေးခြင်း
    const isMainCode = (inviteCode === MAIN_INVITE_CODE);
    const isUserCode = db.some(user => user.userInviteCode === inviteCode);

    if (!isMainCode && !isUserCode) {
        return res.status(400).json({ success: false, message: "Registration Failed: Invalid Invitation Code!" });
    }

    // Username ထပ်မထပ် စစ်ဆေးခြင်း
    const userExists = db.find(user => user.username === username || user.contact === contact);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username or Contact already exists!" });
    }

    // ကျပန်း ဂဏန်း ၆ လုံး ဖိတ်ခေါ်ကုဒ် ထုတ်ပေးခြင်း
    let generatedCode;
    let isDuplicate = true;
    while (isDuplicate) {
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        isDuplicate = db.some(user => user.userInviteCode === generatedCode);
    }

    // User သစ်ကို အမြဲတမ်း ဖိုင်ထဲသို့ သိမ်းဆည်းခြင်း
    const newUser = { 
        username: username, 
        contact: contact, 
        password: password, 
        userInviteCode: generatedCode,
        balance: 10.00 
    };
    
    db.push(newUser);
    writeDatabase(db);
    
    console.log("Registered successfully:", username, "Code:", generatedCode);
    return res.json({ success: true, message: "Registration successful! Please login." });
});

// === LOGIN ENDPOINT ===
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password!" });
    }

    const db = readDatabase();
    
    // အကောင့်ကို ရှာဖွေခြင်း
    const user = db.find(u => (u.username === username || u.contact === username) && u.password === password);

    if (user) {
        // ဒေတာအမှန်များကို လုံးဝ အပြည့်အစုံ ဖော်ပြပေးရန် ပို့ပေးခြင်း
        return res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            username: user.username,
            contact: user.contact,
            balance: user.balance,
            userInviteCode: user.userInviteCode
        });
    } else {
        return res.status(400).json({ success: false, message: "Invalid username or password!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});