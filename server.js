const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// CORS Setting အပြည့်အစုံ
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === CLOUD DATABASE (MONGODB) ချိတ်ဆက်ခြင်း ===
// Server ဘယ်လောက်ပဲ ပိတ်ပိတ် ဒေတာ လုံးဝ မပျက်တော့ပါ။
const MONGO_URI = "mongodb+srv://tiktokuser:tiktokpass123@cluster0.v8jzk.mongodb.net/tiktokPlatform?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Connected to cloud MongoDB successfully!"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Database Schema သတ်မှတ်ခြင်း
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    contact: { type: String, required: true },
    password: { type: String, required: true },
    userInviteCode: { type: String, required: true, unique: true },
    balance: { type: Number, default: 10.00 }
});

const User = mongoose.model('User', userSchema);

const MAIN_INVITE_CODE = 'ZG73223';

app.get('/', (req, res) => {
    res.send("Server is running on Cloud Database!");
});

// === REGISTER ENDPOINT ===
app.post('/api/register', async (req, res) => {
    try {
        const { username, contact, password, confirmPassword, inviteCode } = req.body;

        if (!username || !contact || !password || !inviteCode) {
            return res.status(400).json({ success: false, message: "Missing required fields!" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match!" });
        }

        // ဖိတ်ခေါ်ကုဒ် စစ်ဆေးခြင်း
        const isMainCode = (inviteCode === MAIN_INVITE_CODE);
        const inviteCodeExists = await User.findOne({ userInviteCode: inviteCode });

        if (!isMainCode && !inviteCodeExists) {
            return res.status(400).json({ success: false, message: "Registration Failed: Invalid Invitation Code!" });
        }

        // Username ရှိပြီးသားလား စစ်ဆေးခြင်း
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Username already exists!" });
        }

        // မထပ်မယ့် ကျပန်းဂဏန်း ၆ လုံး ထုတ်ပေးခြင်း
        let generatedCode;
        let isDuplicate = true;
        while (isDuplicate) {
            generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            const codeCheck = await User.findOne({ userInviteCode: generatedCode });
            if (!codeCheck) isDuplicate = false;
        }

        // Database ထဲသို့ အသေသိမ်းဆည်းခြင်း
        const newUser = new User({
            username,
            contact,
            password,
            userInviteCode: generatedCode,
            balance: 10.00
        });

        await newUser.save();
        return res.json({ success: true, message: "Registration successful!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// === LOGIN ENDPOINT ===
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields!" });
        }

        // User ရှာဖွေခြင်း
        const user = await User.findOne({
            $or: [{ username: username }, { contact: username }],
            password: password
        });

        if (user) {
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

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});