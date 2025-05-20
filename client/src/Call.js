import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';

export default function Call({ socket, token, userId, username, roomId, peerUser, onEnd }) {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const myVideo = useRef(null);
  const userVideo = useRef(null);

  useEffect(() => {
    // Проверка поддержки медиаустройств
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Браузер не поддерживает доступ к медиаустройствам');
      return;
    }

    let currentPeer = null;
    let currentStream = null;

    const initializeCall = async () => {
      try {
        // Получаем медиапоток
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        setStream(currentStream);
        myVideo.current.srcObject = currentStream;

        // Инициализация Peer соединения
        const isInitiator = !peerUser.incoming;
        currentPeer = new Peer({
          initiator: isInitiator,
          trickle: false,
          stream: currentStream
        });

        // Обработка сигналов WebRTC
        currentPeer.on('signal', data => {
          socket.emit('webrtc-signal', {
            roomId,
            toUserId: peerUser.id,
            fromUserId: userId,
            signal: data
          });
        });

        currentPeer.on('stream', userStream => {
          userVideo.current.srcObject = userStream;
        });

        // Обработка входящих сигналов
        const signalHandler = ({ signal }) => currentPeer.signal(signal);
        socket.on('webrtc-signal', signalHandler);

        // Инициируем/принимаем звонок
        if (isInitiator) {
          socket.emit('initiate-call', {
            targetUserId: peerUser.id,
            roomId,
            fromUserName: username
          });
        } else {
          socket.emit('accept-call', {
            callId: peerUser.callId,
            fromUserId: userId,
            roomId
          });
        }

        setPeer(currentPeer);

      } catch (error) {
        console.error('Ошибка инициализации звонка:', error);
        handleMediaError(error);
      }
    };

    const handleMediaError = (error) => {
      let errorMessage = 'Ошибка доступа к устройствам:';
      
      if (error.name === 'NotFoundError') {
        errorMessage += '\n- Устройства не найдены';
      } else if (error.name === 'NotAllowedError') {
        errorMessage += '\n- Доступ запрещен';
      } else {
        errorMessage += '\n- Неизвестная ошибка';
      }

      alert(`${errorMessage}\nПроверьте:\n1. Разрешения браузера\n2. Подключенные устройства\n3. HTTPS соединение`);
      onEnd();
    };

    initializeCall();

    // Очистка при размонтировании
    return () => {
      if (currentPeer) {
        currentPeer.destroy();
        socket.off('webrtc-signal');
      }
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Пустой массив зависимостей - монтируется один раз

  return (
    <div style={{ border: '2px solid blue', padding: 10, margin: 10 }}>
      <h3>Звонок с {peerUser.name}</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        <video ref={myVideo} autoPlay muted playsInline style={{ width: 150 }} />
        <video ref={userVideo} autoPlay playsInline style={{ width: 150 }} />
      </div>
      <button onClick={onEnd}>Завершить звонок</button>
    </div>
  );
}