const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.options('*', cors());

// စမ်းသပ်ရန်အတွက် ယာယီ ဒေတာဘေ့စ်
let usersDatabase = [];

// ပင်မ ဖိတ်ခေါ်ကုဒ်
const MAIN_INVITE_CODE = 'ZG73223';

app.get('/', (req, res) => {
    res.send("Server is running perfectly!");
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

    // ၁။ ဝင်လာသော ဖိတ်ခေါ်ကုဒ်သည် ပင်မကုဒ် (ZG73223) ဟုတ်မဟုတ် စစ်ဆေးသည်
    const isMainCode = (inviteCode === MAIN_INVITE_CODE);
    
    // ၂။ သို့မဟုတ် တခြား User တွေရဲ့ ကိုယ်ပိုင်ကုဒ် ဟုတ်မဟုတ် စစ်ဆေးသည်
    const isUserCode = usersDatabase.some(user => user.userInviteCode === inviteCode);

    // ကုဒ်နှစ်ခုလုံး မဟုတ်ပါက ပယ်ချမည်
    if (!isMainCode && !isUserCode) {
        return res.status(400).json({ success: false, message: "Registration Failed: Invalid Invitation Code!" });
    }

    // Username ထပ်မထပ် စစ်ဆေးခြင်း
    const userExists = usersDatabase.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username already exists!" });
    }

    // === ကျပန်း ဂဏန်း ၆ လုံး ဖိတ်ခေါ်ကုဒ် ထုတ်ပေးခြင်း (မထပ်စေရန် စစ်ဆေးပြီးမှ ထုတ်ပေးသည်) ===
    let generatedCode;
    let isDuplicate = true;
    while (isDuplicate) {
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit string
        isDuplicate = usersDatabase.some(user => user.userInviteCode === generatedCode);
    }

    // ဒေတာအသစ် သိမ်းဆည်းခြင်း (စကတည်းက $10.00 ပေးထားမည်)
    usersDatabase.push({ 
        username: username, 
        contact: contact, 
        password: password, 
        userInviteCode: generatedCode, // ကိုယ်ပိုင် ၆ လုံးကုဒ်
        balance: 10.00 
    });
    
    console.log("Updated Database:", usersDatabase);
    return res.json({ success: true, message: "Registration successful!" });
});

// === LOGIN ENDPOINT ===
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password!" });
    }

    // Username သို့မဟုတ် ဖုန်း/အီးမေးလ်ဖြင့် ရှာဖွေခြင်း
    const user = usersDatabase.find(u => (u.username === username || u.contact === username) && u.password === password);

    if (user) {
        // Frontend Profile ဆီသို့ အချက်အလက်များ လွှဲပြောင်းပေးပို့ခြင်း
        return res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            username: user.username,
            contact: user.contact, // ဒေတာအမှန် ပြန်ပို့ပေးရန်
            balance: user.balance,
            userInviteCode: user.userInviteCode // ကိုယ်ပိုင် ၆ လုံးကုဒ် ပြန်ပို့ပေးရန်
        });
    } else {
        return res.status(400).json({ success: false, message: "Invalid username or password!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});