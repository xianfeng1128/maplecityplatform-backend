import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../components/Header';

const ChatRoom = () => {
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatting, setIsChatting] = useState(!!username);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (isChatting) {
            loadMessages();
            const interval = setInterval(loadMessages, 3000); // 每3秒刷新一次消息
            return () => clearInterval(interval);
        }
    }, [isChatting]);

    const loadMessages = async (loadMore = false) => {
        try {
            const response = await axios.get('https://www.xfkenzify.com:5000/chat/messages', {
                params: { offset: loadMore ? messages.length : 0 }
            });
            setMessages(loadMore ? [...messages, ...response.data] : response.data);
            if (!loadMore) {
                scrollToBottom();
            }
        } catch (error) {
            console.error('加载消息时出错:', error);
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        try {
            const response = await axios.post('https://www.xfkenzify.com:5000/chat/messages', {
                username,
                message: newMessage
            });
            setMessages([...messages, response.data]);
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('发送消息时出错:', error);
        }
    };

    const handleScroll = (e) => {
        if (e.target.scrollTop === 0) {
            loadMessages(true);
        }
    };

    const handleEnterChat = () => {
        localStorage.setItem('username', username);
        setIsChatting(true);
    };

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.chatContainer}>
                {!isChatting ? (
                    <div style={styles.loginContainer}>
                        <h2>请输入您的名字进入聊天室</h2>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="名字"
                            style={styles.input}
                        />
                        <button onClick={handleEnterChat} style={styles.enterButton}>
                            进入聊天
                        </button>
                    </div>
                ) : (
                    <div style={styles.chatBox}>
                        <div style={styles.messages} onScroll={handleScroll}>
                            {messages.map((msg, index) => (
                                <div key={index} style={styles.message}>
                                    <strong>{msg.username}:</strong> {msg.message}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div style={styles.inputContainer}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="输入消息"
                                style={styles.input}
                            />
                            <button onClick={handleSendMessage} style={styles.sendButton}>
                                发送
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#ffffff',
        color: '#000000',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    chatContainer: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: '60px', // 为冻结的页眉留出空间
    },
    loginContainer: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        border: '1px solid #ccc',
        borderRadius: '4px',
    },
    enterButton: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#6200ee',
        color: '#fff',
        fontSize: '16px',
        cursor: 'pointer',
    },
    chatBox: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column-reverse',
        justifyContent: 'flex-end',
    },
    messages: {
        flex: '1',
        overflowY: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column-reverse',
    },
    message: {
        padding: '5px 0',
    },
    inputContainer: {
        display: 'flex',
        padding: '10px',
        borderTop: '1px solid #ccc',
        backgroundColor: '#ffffff', // 白色背景
        position: 'fixed', // 固定在屏幕最下端
        bottom: 0,
        width: '100%',
        maxWidth: '800px',
        left: '50%',
        transform: 'translateX(-50%)',
    },
    sendButton: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#6200ee',
        color: '#fff',
        fontSize: '16px',
        cursor: 'pointer',
    },
};

export default ChatRoom;
