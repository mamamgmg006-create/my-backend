const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// === CLOUD DATABASE CONNECTION ===
const MONGO_URI = "mongodb+srv://tiktokuser:tiktokpass123@cluster0.v8jzk.mongodb.net/tiktokPlatform?retryWrites=true&w=majority";
mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Cloud MongoDB Connected!"))
    .catch(err => console.error("❌ DB Error:", err));

// Database Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    contact: { type: String, required: true },
    password: { type: String, required: true },
    myInviteCode: { type: String, required: true },
    balance: { type: Number, default: 10.00 }
});
const User = mongoose.model('User', userSchema);

// === LOGIN API ===
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({
            $or: [{ username: username }, { contact: username }],
            password: password
        });

        if (user) {
            // ဒေတာ ပို့ပေးတဲ့နေရာမှာ Object တိုက်ရိုက်ချပြပေးခြင်း
            return res.json({
                success: true,
                message: "Login Successful!",
                username: user.username,
                contact: user.contact,
                balance: Number(user.balance) || 10.00,
                myInviteCode: user.myInviteCode
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid credentials!" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// === REGISTER API ===
app.post('/api/register', async (req, res) => {
    try {
        const { username, contact, password, inviteCode } = req.body;
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ success: false, message: "Username exists!" });

        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newUser = new User({ username, contact, password, myInviteCode: generatedCode, balance: 10.00 });
        await newUser.save();
        
        return res.json({ success: true, message: "Registered Successfully!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));