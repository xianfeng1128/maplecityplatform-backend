const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const sanitizeHtml = require('sanitize-html');
const axios = require('axios');

// 获取 IP 属地信息的函数
async function getIpLocation(ip) {
    const cleanedIp = ip.replace('::ffff:', ''); // 移除 '::ffff:'
    try {
        const response = await axios.get(`https://api.vore.top/api/IPdata?ip=${cleanedIp}`);
        const ipData = response.data?.ipdata;
        if (ipData) {
            return `${ipData.info1}-${ipData.info2}-${ipData.info3}-${ipData.isp}`;
        } else {
            return '未知';
        }
    } catch (error) {
        console.error('获取IP属地时出错:', error);
        return '未知';
    }
}


// 获取所有工单，带分页、筛选和排序功能
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, sort = 'desc', category, status, sortBy = 'createdAt' } = req.query;

    try {
        const query = {};
        if (category) query.category = category;
        if (status) query.status = status;

        const sortOption = sort === 'asc' ? 1 : -1;

        // 获取置顶工单
        const topTickets = await Ticket.find({ status: '置顶' });

        // 获取普通工单，并根据分页和排序参数进行处理
        const tickets = await Ticket.find(query)
            .sort({ [sortBy]: sortOption })  // 按照传递的字段进行排序
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalTickets = await Ticket.countDocuments(query);
        const totalPages = Math.ceil(totalTickets / limit);

        // 获取类别和状态的统计信息
        const categories = await Ticket.aggregate([
            { $match: query },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        const statuses = await Ticket.aggregate([
            { $match: query },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            topTickets,
            tickets,
            totalPages,
            categories: categories.map(c => ({ category: c._id, count: c.count })),
            statuses: statuses.map(s => ({ status: s._id, count: s.count })),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 更新阅读数
router.patch('/:id/views', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).send({ message: '工单未找到' });
        }
        ticket.views += 1;
        await ticket.save();
        res.status(200).send(ticket);
    } catch (error) {
        res.status(500).send({ message: '更新阅读数时出错' });
    }
});

// 创建新工单
router.post('/', async (req, res) => {
    const { title, description, category, subCategory, coordinates, createdAt } = req.body;
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '未知'; // 获取用户的IP地址

    try {
        const ipLocation = await getIpLocation(userIp); // 在创建时获取IP属地

        const ticket = new Ticket({
            title,
            description,
            category,
            subCategory: subCategory || '其他建议',
            coordinates,
            status: '已创建',
            createdAt,
            userIp, // 保存用户IP地址
            ipLocation, // 保存IP属地信息
        });

        const newTicket = await ticket.save();
        res.status(201).json(newTicket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 获取单个工单
router.get('/:id', getTicket, async (req, res) => {
    const sanitizedReplies = res.ticket.replies.map(reply => ({
        ...reply._doc,
        message: sanitizeHtml(reply.message),
    }));

    // 如果旧的工单没有subCategory，则设置为"其他建议"
    if (!res.ticket.subCategory && res.ticket.category === '优化建议') {
        res.ticket.subCategory = '其他建议';
    }

    res.json({ 
        ...res.ticket._doc, 
        replies: sanitizedReplies,
    });
});

// 添加回复
router.post('/:id/replies', getTicket, async (req, res) => {
    const { reply, user } = req.body;
    const timestamp = new Date();
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '未知'; // 获取用户的IP地址

    const sanitizedReply = sanitizeHtml(reply);

    // 获取回复的IP属地信息
    const ipLocation = await getIpLocation(userIp);

    res.ticket.replies.push({ message: sanitizedReply, user, timestamp, ip: userIp, ipLocation }); // 保存回复的IP地址和属地信息

    try {
        const updatedTicket = await res.ticket.save();
        res.status(201).json(updatedTicket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;



// 删除回复
router.delete('/:id/replies/:replyId', getTicket, async (req, res) => {
    try {
        const ticket = res.ticket;
        const replyId = req.params.replyId;

        ticket.replies = ticket.replies.filter(reply => reply._id.toString() !== replyId);

        await ticket.save();
        res.json({ message: '回复已删除' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '删除回复时出错' });
    }
});

// 更新工单状态
router.patch('/:id/status', getTicket, async (req, res) => {
    if (req.body.status != null) {
        res.ticket.status = req.body.status;
    }

    try {
        const updatedTicket = await res.ticket.save();
        res.json(updatedTicket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 删除工单
router.delete('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: '工单未找到' });
        }
        res.json({ message: '工单已删除' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '删除工单时出错' });
    }
});

// 中间件函数：通过ID获取工单，并尝试获取IP属地信息
async function getTicket(req, res, next) {
    let ticket;
    try {
        ticket = await Ticket.findById(req.params.id);
        if (ticket == null) {
            return res.status(404).json({ message: '找不到工单' });
        }

        // 如果IP属地是"未知"，尝试获取并更新数据库
        if (ticket.ipLocation === '未知') {
            const ipLocation = await getIpLocation(ticket.userIp);
            if (ipLocation !== '未知') {
                ticket.ipLocation = ipLocation;
                await ticket.save(); // 保存更新后的IP属地信息
            }
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.ticket = ticket;
    next();
}

module.exports = router;
