// src/VoiceRecorder.js
import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function VoiceRecorder({ roomId, token, onSend }) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        if (!audioChunksRef.current.length) {
          alert("Не удалось записать аудио. Попробуйте ещё раз.");
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('voice', blob, `recording.webm`);
        formData.append('roomId', roomId);

        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/chat/voice`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (onSend) onSend(res.data);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Ошибка доступа к микрофону:', err);
      alert('Не удалось получить доступ к микрофону.');
    }
  };

  
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      {!recording
        ? <button onClick={startRecording}>🎤 Записать голос</button>
        : <button onClick={stopRecording}>⏹️ Остановить</button>
      }
    </div>
  );
}
