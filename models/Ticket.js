const mongoose = require('mongoose');

// 定义回复的Schema
const replySchema = new mongoose.Schema({
    message: { type: String, required: true },
    user: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ip: { type: String, default: '未知' },  // 添加IP字段，默认值为"未知"
    ipLocation: { type: String, default: '未知' }  // 添加IP属地字段，默认值为"未知"
});

// 定义工单的Schema
const ticketSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, default: '其他建议' }, // 添加 subCategory 字段，默认为 '其他建议'
    coordinates: {
        x: { type: String },
        y: { type: String },
        z: { type: String },
    },
    status: { type: String, required: true },
    replies: [replySchema],  // 嵌入的回复Schema
    views: { type: Number, default: 0 },  // 添加 views 字段
    createdAt: { type: Date, default: Date.now },  // 确保已有创建时间
    userIp: { type: String, default: '未知' },  // 添加用户IP字段，默认值为"未知"
    ipLocation: { type: String, default: '未知' }  // 添加IP属地字段，默认值为"未知"
});

module.exports = mongoose.model('Ticket', ticketSchema);
