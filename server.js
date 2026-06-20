const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let usersDatabase = [];

// Register Endpoint
app.post('/api/register', (req, res) => {
    const { username, contact, password, confirmPassword, inviteCode } = req.body;

    // အချက်အလက်များ မပါလာပါက တားဆီးရန်
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

// ပုံသေ 3000 အစား Render ပေးမယ့် Port သို့မဟုတ် 3000 ဟု ပြောင်းလဲခြင်း
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});