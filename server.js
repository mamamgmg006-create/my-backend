const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// လုံးဝ အမှားမတက်စေရန် CORS စနစ်ကို သေသေချာချာ ခွင့်ပြုပေးခြင်း
app.use(cors({
    origin: '*', // ဘယ် Website ကမဆို လှမ်းပို့တာကို လက်ခံမည်
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Pre-flight requests (OPTIONS) ကို အလိုအလျောက် အောင်မြင်အောင် လုပ်ပေးခြင်း
app.options('*', cors());

let usersDatabase = [];

// Base Route (Server အလုပ်လုပ်၊ မလုပ် စမ်းသပ်ရန်)
app.get('/', (req, res) => {
    res.send("Server is running perfectly!");
});

// Register Endpoint အပိုင်း (ကုဒ်အမှန် စစ်ဆေးရန်နှင့် အကောင့်သစ်ကို $10 BONUS ပေးရန်)
app.post('/api/register', (req, res) => {
    const { username, contact, password, confirmPassword, inviteCode } = req.body;

    if (!username || !contact || !password || !inviteCode) {
        return res.status(400).json({ success: false, message: "Missing required fields!" });
    }

    // သင်တောင်းဆိုထားသော ပင်မ ဖိတ်ခေါ်ကုဒ် ZG73223 ကို ဤနေရာတွင် တင်းကျပ်စွာ စစ်ဆေးခြင်း
    if (inviteCode !== 'ZG73223') {
        return res.status(400).json({ success: false, message: "Registration Failed: Invalid Invitation Code!" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match!" });
    }

    const userExists = usersDatabase.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username already exists!" });
    }

    // User တစ်ဦးချင်းစီအတွက် ကိုယ်ပိုင် Random Invite Code တစ်ခု အလိုအလျောက် ထုတ်ပေးခြင်း
    const userInviteCode = "INV" + Math.floor(10000 + Math.random() * 90000);

    // ဒေတာထဲသို့ $10.00 လက်ဆောင် ထည့်သွင်းသိမ်းဆည်းခြင်း
    usersDatabase.push({ 
        username, 
        contact, 
        password, 
        inviteCode, 
        userInviteCode, 
        balance: 10.00 
    });
    
    console.log("Updated Database:", usersDatabase);
    return res.json({ success: true, message: "Registration successful!" });
});

// Login Endpoint အပိုင်း (Profile အတွက် အချက်အလက်အပြည့်အစုံ ပြန်ပို့ပေးရန်)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password!" });
    }

    const user = usersDatabase.find(u => (u.username === username || u.contact === username) && u.password === password);

    if (user) {
        return res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            username: user.username,
            contact: user.contact,
            balance: user.balance || 10.00,
            userInviteCode: user.userInviteCode || "INV88291" // ကိုယ်ပိုင် ဖိတ်ခေါ်ကုဒ်
        });
    } else {
        return res.status(400).json({ success: false, message: "Invalid username or password!" });
    }
});