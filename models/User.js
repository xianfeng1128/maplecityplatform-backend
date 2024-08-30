const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    contact: { type: String, required: true, unique: true }, // 修改字段名为 contact
    password: { type: String, required: true },
    ip: { type: String, default: '未知' },
    ipLocation: { type: String, default: '未知' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
