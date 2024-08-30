const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // 没有token，表示用户未登录，继续处理请求
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, '80728899'); // 替换为你的JWT密钥
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        req.user = user; // 将用户信息存储在请求对象中
        next();
    } catch (error) {
        console.error('Token 验证失败:', error);
        return res.status(403).json({ message: '无效的令牌' });
    }
};

module.exports = authenticateToken;
