// src/pages/ChatPage.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import VoiceRecorder from '../components/VoiceRecorder';

export default function ChatPage({ socket }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket || !currentRoom) return;

    socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => socket.off('newMessage');
  }, [socket, currentRoom]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    await axios.post('/chat/messages', {
      text: inputMessage,
      roomId: currentRoom
    });
    setInputMessage('');
  };

  const sendVoiceMessage = async (audioBlob) => {
    const formData = new FormData();
    formData.append('voice', audioBlob, 'voice.mp3');
    formData.append('roomId', currentRoom);

    await axios.post('/chat/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };

  return (
    <div className="chat-container">
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender_id === user.id ? 'own' : ''}`}>
            {msg.is_voice_message ? (
              <audio controls src={msg.file_url} />
            ) : (
              <p>{msg.text}</p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input">
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <VoiceRecorder onRecordingComplete={sendVoiceMessage} />
        <button onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
}