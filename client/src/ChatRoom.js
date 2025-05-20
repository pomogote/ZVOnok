import React, { useEffect, useState, useRef } from 'react';
import { fetchMessages, updateMessage, deleteMessage } from './api';
import createSocket from './socket';
import Call from './Call';
import VoiceRecorder from './VoiceRecorder';

const SOCKET_URL = 'http://localhost:3000';
const API_URL = process.env.REACT_APP_API_URL;

export default function ChatRoom({ token, userId, username, room, onLeave }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [callUser, setCallUser] = useState(null);
    const socketRef = useRef();

    useEffect(() => {
        // 1) Инициализация сокета
        socketRef.current = createSocket(token);
        // 2) Входим в комнату
        socketRef.current.emit('joinRoom', room.id);

        // 3) Подписки на события
        socketRef.current.on('newMessage', msg => {
            setMessages(prev => {
                // если уже есть с таким id — не добавляем
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });
        socketRef.current.on('message-updated', ({ messageId, text }) => {
            setMessages(prev =>
                prev.map(m => (m.id === messageId ? { ...m, text } : m))
            );
        });
        socketRef.current.on('message-deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        });
        socketRef.current.on('incoming-call', ({ fromUserId, fromUserName }) => {
            if (window.confirm(`Входящий звонок от ${fromUserName}. Принять?`)) {
                setCallUser({ id: fromUserId, name: fromUserName, incoming: true });
            }
        });

        // 4) Загрузка истории
        fetchMessages(room.id, token).then(setMessages);

        return () => {
            // снятие всех подписок и дисконнект
            socketRef.current.off('newMessage');
            socketRef.current.off('message-updated');
            socketRef.current.off('message-deleted');
            socketRef.current.off('incoming-call');
            socketRef.current.disconnect();
        };
    }, [room.id, token]);

    const sendMessage = () => {
        if (!text.trim()) return;
        socketRef.current.emit('sendMessage', { text, roomId: room.id });
        setText('');
    };

    const startCall = (targetUserId, targetUserName) => {
        setCallUser({ id: targetUserId, name: targetUserName, incoming: false });
    };

    // обработчик редактирования:
    const onEditClick = async (message) => {
        const newText = prompt('Новый текст сообщения:', message.text);
        if (newText != null && newText !== message.text) {
            try {
                await updateMessage(token, message.id, newText);
                // локально ничего не делаем — ждём socket 'message-updated'
            } catch (error) {
                console.error('Ошибка обновления:', error.response?.data?.error || error.message);
            }
        }
    };

    const onDeleteClick = async (messageId) => {
        if (window.confirm('Удалить сообщение?')) {
            try {
                await deleteMessage(token, messageId);
                // локально ничего не делаем — ждём socket 'message-deleted'
            } catch (error) {
                console.error('Ошибка удаления:', error.response?.data?.error || error.message);
            }
        }
    };

    return (
        <div>
            <h2>Комната: {room.name}</h2>
            <button onClick={onLeave}>Выйти из комнаты</button>

            <div style={{ height: 300, overflowY: 'auto', border: '1px solid #ccc', margin: '10px 0' }}>
                {messages.map(msg => {
                    // имя автора: отдаёт при live-сообщении или из истории
                    const author = msg.sender_name || msg.user_name || 'Unknown';
                    const isMine = String(msg.user_id) === String(userId);

                    return (
                        <div key={msg.id} style={{ position: 'relative', marginBottom: 10 }}>
                            {isMine && (
                                <button
                                    onClick={() => onDeleteClick(msg.id)}
                                    style={{
                                        position: 'absolute', right: 0, top: 0,
                                        background: 'transparent', border: 'none',
                                        cursor: 'pointer', color: '#ff4444'
                                    }}
                                >
                                    ×
                                </button>
                            )}

                            <b>{author}:</b>{' '}
                            {msg.is_voice_message
                                ? <audio controls src={`${SOCKET_URL}${msg.file_url}`} />
                                : msg.text
                            }

                            {/* Редактировать — только текстовые */}
                            {isMine && !msg.is_voice_message && (
                                <button
                                    onClick={() => onEditClick(msg)}
                                    style={{ marginLeft: 10, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                >
                                    ✏️
                                </button>
                            )}

                            {/* Звонок другим */}
                            {!isMine && (
                                <button
                                    style={{ marginLeft: 10 }}
                                    onClick={() => setCallUser({ id: msg.user_id, name: author, incoming: false })}
                                >
                                    Позвонить
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Введите сообщение"
            />
            <button onClick={sendMessage}>Отправить</button>

            <VoiceRecorder roomId={room.id} token={token} onSend={newMsg => setMessages(prev => [...prev, newMsg])} />

            {callUser && (
                <Call
                    socket={socketRef.current}
                    token={token}
                    userId={userId}
                    username={username}
                    roomId={room.id}
                    peerUser={callUser}
                    onEnd={() => setCallUser(null)}
                />
            )}
        </div>
    );
}