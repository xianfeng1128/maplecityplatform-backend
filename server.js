// server.js 中的相关部分
const express = require('express');
const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const ticketRoutes = require('./routes/tickets');
const authRoutes = require('./routes/auth'); // 引入 auth 路由

const app = express();

// 增加请求体大小限制
app.use(express.json({ limit: '10mb' }));  // 设置 JSON 请求体大小限制为 10MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));  // 设置 URL-encoded 请求体大小限制为 10MB

// 配置 CORS
const allowedOrigins = [
    'https://www.xfkenzify.com:3002',
    'https://www.xfkenzify.com:4329',  // 添加多个允许的来源
    'https://www.xfkenzify.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,  // 允许发送 cookie 等认证信息
};

app.use(cors(corsOptions));

// 加载 SSL 证书和密钥
const sslOptions = {
    cert: fs.readFileSync('D:/maplebug/cert.pem'),
    key: fs.readFileSync('D:/maplebug/key.pem'),
};

// 提供静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 配置 Multer 用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// 使用 tickets 路由
app.use('/tickets', ticketRoutes);

// 使用 auth 路由
app.use('/api/auth', authRoutes);

// 文件上传接口
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        const filePath = req.file.path.replace(/\\/g, '/');  // 确保 URL 中使用正斜杠
        res.status(200).json({ url: `https://www.xfkenzify.com:5000/${filePath}` });
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// 连接 MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/tickets', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));

// 创建 HTTPS 服务器
https.createServer(sslOptions, app).listen(5000, () => {
    console.log('Server running on https://localhost:5000');
});
