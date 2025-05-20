import React, { useEffect, useState, useRef } from 'react';
import { fetchMessages } from './api';
import Call from './Call';
import axios from 'axios';
import createSocket from './socket';

const SOCKET_URL = 'http://localhost:3000';
const API_URL = process.env.REACT_APP_API_URL;

export default function ChatRoom({ token, userId, username, room, onLeave }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [callUser, setCallUser] = useState(null);
    const socketRef = useRef();

    useEffect(() => {

        //подключение к токену
        socketRef.current = createSocket(token);
        socketRef.current.emit('joinRoom', room.id);

        socketRef.current.on('newMessage', (msg) => {
            console.log('[Клиент] Новое сообщение:', msg);
            setMessages(prev => [...prev, msg]);
        });

        socketRef.current.on('message-deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        });

        socketRef.current.on('incoming-call', ({ fromUserId, fromUserName }) => {
            if (window.confirm(`Входящий звонок от ${fromUserName}. Принять?`)) {
                setCallUser({ id: fromUserId, name: fromUserName, incoming: true });
            }
        });
        fetchMessages(room.id, token).then(setMessages);

        return () => {
            // Исправлено: правильный порядок очистки
            socketRef.current.off('message-deleted');
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

    const handleDeleteMessage = async (messageId) => {
        if (window.confirm('Удалить это сообщение?')) {
            try {
                await axios.delete(`${API_URL}/api/chat/messages/${messageId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(prev => prev.filter(m => m.id !== messageId));
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
                {messages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: '10px', position: 'relative' }}>
                        {/* Добавлена кнопка удаления */}
                        {msg.user_id === userId && (
                            <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#ff4444'
                                }}
                            >
                                ×
                            </button>
                        )}
                        <b>{msg.sender_name || 'User'}:</b>{' '}
                        {msg.is_voice_message ? (
                            <audio controls src={`http://localhost:3000${msg.file_url}`} />
                        ) : (
                            msg.text
                        )}
                        {/* Кнопка звонка */}
                        {msg.user_id !== userId && (

                            <button style={{ marginLeft: 10 }} onClick={() => startCall(msg.user_id, msg.user_name)}>
                                Позвонить
                            </button>
                        )}
                    </div>

                ))}
                {messages.map((msg, idx) => (
                    <div key={msg.id} style={{ marginBottom: '10px', position: 'relative' }}>
                        {msg.user_id === userId && (
                            <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#ff4444'
                                }}
                            >
                                ×
                            </button>
                        )}
                        {/* Остальное содержимое сообщения */}
                    </div>
                ))}
            </div>
            <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Введите сообщение"
            />
            <button onClick={sendMessage}>Отправить</button>
            <VoiceRecorder
                roomId={room.id}
                token={token}
                onSend={(newMsg) => {
                    setMessages(prev => [...prev, newMsg]);
                }}
            />

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

function VoiceRecorder({ roomId, token, onSend }) {
    const API_URL = process.env.REACT_APP_API_URL;
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new window.MediaRecorder(stream);
        setMediaRecorder(recorder);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunksRef.current.push(e.data);
            }
        };
        recorder.onstop = async () => {
            if (audioChunksRef.current.length === 0) {
                alert("Не удалось записать аудио. Попробуйте ещё раз.");
                return;
            }
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('voice', blob, `recording.webm`);
            formData.append('roomId', roomId);

            const res = await axios.post(
                `${API_URL}/api/chat/voice`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onSend) onSend(res.data);
        };
        recorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setRecording(false);
        }
    };

    return (
        <div>
            {!recording ? (
                <button onClick={startRecording}>🎤 Записать голос</button>
            ) : (
                <button onClick={stopRecording}>⏹️ Остановить</button>
            )}
        </div>
    );
}