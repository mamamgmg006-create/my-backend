const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// CORS Error မတက်စေရန် စနစ်အပြည့်ထည့်ထားခြင်း
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === CLOUD DATABASE (MONGODB) ===
const MONGO_URI = "mongodb+srv://tiktokuser:tiktokpass123@cluster0.v8jzk.mongodb.net/tiktokPlatform?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Connected to cloud MongoDB successfully!"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Database တွင် သိမ်းဆည်းမည့် ပုံစံ (Schema)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    contact: { type: String, required: true },
    password: { type: String, required: true },
    myInviteCode: { type: String, required: true, unique: true }, // ကိုယ်ပိုင် ဖိတ်ခေါ်ကုဒ် ဂဏန်း ၆ လုံး
    balance: { type: Number, default: 10.00 } // အကောင့်ဖွင့်လျှင် Free $10 ပေးမည်
});

const User = mongoose.model('User', userSchema);
const MAIN_INVITE_CODE = 'ZG73223'; // စာရင်းသွင်းရန် ပင်မကုဒ်

app.get('/', (req, res) => {
    res.send("Server is running on Cloud Database!");
});

// === REGISTER (အကောင့်ဖွင့်ခြင်း) ===
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
        const inviteCodeExists = await User.findOne({ myInviteCode: inviteCode });

        if (!isMainCode && !inviteCodeExists) {
            return res.status(400).json({ success: false, message: "Invalid Invitation Code!" });
        }

        // Username ထပ်မထပ် စစ်ဆေးခြင်း
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Username already exists!" });
        }

        // စနစ်မှ ကျပန်း ဂဏန်း ၆ လုံး ထုတ်ပေးခြင်း
        let generatedCode;
        let isDuplicate = true;
        while (isDuplicate) {
            generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            const codeCheck = await User.findOne({ myInviteCode: generatedCode });
            if (!codeCheck) isDuplicate = false;
        }

        // သိမ်းဆည်းခြင်း
        const newUser = new User({
            username,
            contact,
            password,
            myInviteCode: generatedCode,
            balance: 10.00
        });

        await newUser.save();
        return res.json({ success: true, message: "Registration successful! Please login." });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// === LOGIN (အကောင့်ဝင်ခြင်း) ===
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({
            $or: [{ username: username }, { contact: username }],
            password: password
        });

        if (user) {
            // Frontend သို့ ဒေတာအမှန်များ ကွက်တိ ပို့ပေးခြင်း
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
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));