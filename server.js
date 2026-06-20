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

// Register Endpoint အပိုင်းကို ဤသို့ပြင်ပါ (အစပိုင်းတွင် $10.00 Bonus ပေးရန်)
app.post('/api/register', (req, res) => {
    const { username, contact, password, confirmPassword, inviteCode } = req.body;
    // ... (ရှိပြီးသား validation များအတိုင်းထားပါ) ...

    // ဒေတာအသစ်ထဲတွင် $10.00 လက်ဆောင် ထည့်ပေးလိုက်ခြင်း
    usersDatabase.push({ username, contact, password, inviteCode, balance: 10.00 });
    return res.json({ success: true, message: "Registration successful!" });
});

// Login Endpoint အပိုင်းကို ဤသို့ပြင်ပါ (Contact နှင့် Balance များကို အင်္ဂလိပ်လို ပြန်ပို့ပေးရန်)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = usersDatabase.find(u => (u.username === username || u.contact === username) && u.password === password);

    if (user) {
        return res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            username: user.username,
            contact: user.contact, // Frontend Profile တွင် ပြသရန်အတွက်ဖြစ်သည်
            balance: user.balance || 10.00 // Dollar စနစ် လက်ကျန်ငွေ
        });
    } else {
        return res.status(400).json({ success: false, message: "Invalid username or password!" });
    }
});