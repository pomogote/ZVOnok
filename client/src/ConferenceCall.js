import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import './css/ConferenceCall.css';

export default function ConferenceCall({ socket, userId, username = 'User', roomId, onEnd }) {
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState([]);
    const [error, setError] = useState('');
    const peersRef = useRef([]);
    const myVideo = useRef(null);

    useEffect(() => {
        // Инициализация медиа и подключение к конференции
        const init = async () => {
            try {
                // Получаем аудио и видео потоки
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
                const combined = new MediaStream([
                    ...(audioStream?.getTracks() || []),
                    ...(videoStream?.getTracks() || [])
                ]);
                setStream(combined);
                if (myVideo.current) myVideo.current.srcObject = combined;

                // После получения потока подключаемся к комнате
                socket.emit('join-conference', { roomId, peerId: socket.id });
            } catch (err) {
                setError(`Ошибка инициализации: ${err.message}`);
            }
        };
        init();

        // Обработчики сигналов WebRTC
        socket.on('new-conference-participant', ({ peerId }) => {
            // Игнорируем себя
            if (peerId === socket.id) return;
            // Если уже есть peer с таким id, не повторяем
            if (peersRef.current.some(p => p.peerId === peerId)) return;

            const peer = new Peer({ initiator: true, trickle: false, stream });
            peer.on('signal', signal => {
                socket.emit('webrtc-signal', { target: peerId, senderId: socket.id, signal, roomId });
            });
            peer.on('error', e => console.error('Peer error:', e));

            peersRef.current.push({ peerId, peer });
            setPeers(list => [...list, { peerId, peer }]);
        });

        socket.on('webrtc-signal', ({ senderId, signal }) => {
            // Игнорируем собственные сигналлы
            if (senderId === socket.id) return;
            // Если peer существует — передаём сигнал, иначе создаём приёмник
            let item = peersRef.current.find(p => p.peerId === senderId);
            if (item) {
                item.peer.signal(signal);
            } else {
                const peer = new Peer({ initiator: false, trickle: false, stream });
                peer.on('signal', sig => {
                    socket.emit('webrtc-signal', { target: senderId, senderId: socket.id, signal: sig, roomId });
                });
                peer.on('error', e => console.error('Peer error:', e));
                peer.signal(signal);

                peersRef.current.push({ peerId: senderId, peer });
                setPeers(list => [...list, { peerId: senderId, peer }]);
            }
        });

        socket.on('conference-participant-left', ({ peerId }) => {
            peersRef.current = peersRef.current.filter(p => {
                if (p.peerId === peerId) {
                    p.peer.destroy();
                    return false;
                }
                return true;
            });
            setPeers(list => list.filter(p => p.peerId !== peerId));
        });

        return () => {
            socket.off('new-conference-participant');
            socket.off('webrtc-signal');
            socket.off('conference-participant-left');
            stream?.getTracks().forEach(t => t.stop());
            peersRef.current.forEach(p => p.peer.destroy());
        };
    }, [socket, stream]);

    const toggleMedia = async type => {
        const has = stream?.getTracks().some(t => t.kind === type && t.enabled);
        if (has) {
            stream.getTracks().filter(t => t.kind === type).forEach(t => t.stop());
            setStream(new MediaStream(stream.getTracks().filter(t => t.readyState === 'live')));
        } else {
            const newStream = await navigator.mediaDevices.getUserMedia({ [type]: true }).catch(() => null);
            if (newStream) {
                const updated = new MediaStream([...(stream?.getTracks() || []), ...newStream.getTracks()]);
                setStream(updated);
                if (type === 'video' && myVideo.current) myVideo.current.srcObject = updated;
            }
        }
    };

    return (
        <div className="conference-container">
            <h3 className="conference-title">Конференция: {roomId}</h3>
            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => window.location.reload()} className="retry-button">Повторить</button>
                </div>
            )}
            <div className="video-grid">
                {stream && stream.getVideoTracks().length > 0 ? (
                    <video ref={myVideo} autoPlay muted playsInline className="self-video" />
                ) : (
                    <div className="user-avatar"><span>{username[0].toUpperCase()}</span></div>
                )}
                {peers.map(({ peerId, peer }) => (<Video key={peerId} peer={peer} />))}
            </div>
            <div className="controls">
                <button onClick={() => toggleMedia('audio')} className={`control-button ${stream?.getAudioTracks().length ? 'active' : ''}`}>🔊</button>
                <button onClick={() => toggleMedia('video')} className={`control-button ${stream?.getVideoTracks().length ? 'active' : ''}`}>📷</button>
                <button onClick={onEnd} className="end-button">Завершить</button>
            </div>
        </div>
    );
}

function Video({ peer }) {
    const ref = useRef();
    useEffect(() => {
        const handleStream = stream => { ref.current.srcObject = stream; };
        peer.on('stream', handleStream);
        return () => peer.off('stream', handleStream);
    }, [peer]);
    return <video ref={ref} autoPlay playsInline className="peer-video" />;
}
