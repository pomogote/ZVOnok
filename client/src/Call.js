import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';

export default function Call({ socket, token, userId, username, roomId, peerUser, onEnd }) {
  const [stream, setStream] = useState();
  const [peer, setPeer] = useState();
  const myVideo = useRef();
  const userVideo = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
      setStream(currentStream);
      myVideo.current.srcObject = currentStream;

      if (!peerUser.incoming) {
        // Инициатор звонка
        const p = new Peer({ initiator: true, trickle: false, stream: currentStream });
        p.on('signal', data => {
          socket.emit('webrtc-signal', {
            roomId,
            toUserId: peerUser.id,
            fromUserId: userId,
            signal: data
          });
        });
        p.on('stream', userStream => {
          userVideo.current.srcObject = userStream;
        });
        setPeer(p);

        socket.emit('initiate-call', {
          targetUserId: peerUser.id,
          roomId,
          fromUserName: username
        });

        socket.on('webrtc-signal', ({ signal }) => {
          p.signal(signal);
        });
      } else {
        // Принимающий звонок
        const p = new Peer({ initiator: false, trickle: false, stream: currentStream });
        p.on('signal', data => {
          socket.emit('webrtc-signal', {
            roomId,
            toUserId: peerUser.id,
            fromUserId: userId,
            signal: data
          });
        });
        p.on('stream', userStream => {
          userVideo.current.srcObject = userStream;
        });
        setPeer(p);

        socket.on('webrtc-signal', ({ signal }) => {
          p.signal(signal);
        });

        socket.emit('accept-call', {
          fromUserId: userId,
          targetUserId: peerUser.id,
          roomId
        });
      }
    });

    return () => {
      if (peer) peer.destroy();
      if (stream) stream.getTracks().forEach(track => track.stop());
      socket.off('webrtc-signal');
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{border:'2px solid blue', padding:10, margin:10}}>
      <h3>Звонок с {peerUser.name}</h3>
      <div style={{display:'flex', gap:10}}>
        <video ref={myVideo} autoPlay muted style={{width:150}} />
        <video ref={userVideo} autoPlay style={{width:150}} />
      </div>
      <button onClick={onEnd}>Завершить звонок</button>
    </div>
  );
}
