const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT密钥
const JWT_SECRET = '80728899';

// 获取 IP 属地信息的函数
async function getIpLocation(ip) {
    const cleanedIp = ip.replace('::ffff:', '');
    try {
        const response = await axios.get(`https://webapi-pc.meitu.com/common/ip_location?ip=${cleanedIp}`);
        const ipData = response.data?.data?.[cleanedIp];
        if (ipData) {
            return `${ipData.province}-${ipData.city}-${ipData.isp}`;
        } else {
            return '未知';
        }
    } catch (error) {
        console.error('获取IP属地时出错:', error);
        return '未知';
    }
}

// 注册路由
router.post('/register', async (req, res) => {
    try {
        const { username, contact, password } = req.body;

        if (!username || !contact || !password) {
            return res.status(400).json({ message: '请填写所有必需字段' });
        }

        // 检查用户是否已经存在
        const existingUser = await User.findOne({ contact });
        if (existingUser) {
            return res.status(400).json({ message: '该手机号/QQ号已被注册' });
        }

        // 获取用户IP和IP属地信息
        const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '未知';
        const ipLocation = await getIpLocation(userIp);

        // 创建新用户
        const newUser = new User({
            username,
            contact,
            password,
            ip: userIp,
            ipLocation
        });

        await newUser.save();

        // 登录成功后生成JWT
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

        // 设置cookie（httpOnly，确保客户端无法通过JS访问）
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.status(201).json({ message: '注册成功', username: newUser.username });
    } catch (error) {
        console.error('注册时出错:', error);
        res.status(500).json({ message: '服务器错误，请稍后再试' });
    }
});
// 登录路由
router.post('/login', async (req, res) => {
    const { contact, password } = req.body;

    try {
        const user = await User.findOne({ contact }); // 使用 contact 字段来查找用户
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        if (password !== user.password) {
            return res.status(400).json({ message: '密码不正确' });
        }

        // 登录成功后生成JWT
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // 设置cookie（httpOnly，确保客户端无法通过JS访问）
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.json({ message: '登录成功', username: user.username });
    } catch (err) {
        console.error('服务器错误：', err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;
