
# Backend - 枫城在线内容平台

## 介绍
这是“枫城在线内容平台”的后端部分，使用 Node.js 和 Express.js 构建，负责处理用户请求、工单管理、用户注册与登录等功能。数据存储在 MongoDB 中。

## 目录结构
```plaintext
backend/
├── models/             # Mongoose 模型
├── routes/             # Express 路由
├── uploads/            # 文件上传存储
├── server.js           # 主服务器文件
├── package.json        # 依赖和脚本
└── ...                 # 其他配置文件
```

## 安装和运行

### 先决条件
- [Node.js](https://nodejs.org/) 和 npm
- [MongoDB](https://www.mongodb.com/)

### 安装依赖
```bash
npm install
```

### 启动服务器
```bash
node server.js
```

### 使用 HTTPS
在 `server.js` 中加载 SSL 证书 (`cert.pem` 和 `key.pem`)，以支持 HTTPS 请求。

## API 端点

### 用户管理
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 工单管理
- `GET /tickets` - 获取所有工单
- `POST /tickets` - 创建新工单
- `PATCH /tickets/:id/status` - 更新工单状态
- `POST /tickets/:id/replies` - 添加工单回复

### 文件上传
- `POST /upload` - 上传文件

## 技术栈
- Node.js
- Express.js
- MongoDB
- Mongoose

## 环境变量
```plaintext
MONGODB_URI=mongodb://localhost:27017/tickets
JWT_SECRET=your_jwt_secret
```

## 贡献
如果您发现问题或有改进建议，请提交 Issue 或 Pull Request。

## 许可证
MIT License
