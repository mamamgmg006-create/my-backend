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

// Register Endpoint
app.post('/api/register', (req, res) => {
    const { username, contact, password, confirmPassword, inviteCode } = req.body;

    if (!username || !contact || !password) {
        return res.status(400).json({ success: false, message: "Missing required fields!" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match!" });
    }

    const userExists = usersDatabase.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username already exists!" });
    }

    usersDatabase.push({ username, contact, password, inviteCode });
    console.log("Updated Database:", usersDatabase);
    
    return res.json({ success: true, message: "Registration successful!" });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password!" });
    }

    const user = usersDatabase.find(u => (u.username === username || u.contact === username) && u.password === password);

    if (user) {
        return res.json({ success: true, message: `Welcome back, ${user.username}!` });
    } else {
        return res.status(400).json({ success: false, message: "Invalid username or password!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});