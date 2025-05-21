import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import './css/ConferenceCall.css';

export default function ConferenceCall({ socket, userId, username = 'User', roomId, onEnd }) {
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState([]);
    const [error, setError] = useState('');
    const peersRef = useRef([]);
    const myVideo = useRef(null);

    const initMedia = async () => {
        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);

            const combinedStream = new MediaStream([
                ...(audioStream?.getTracks() || []),
                ...(videoStream?.getTracks() || [])
            ]);

            setStream(combinedStream);
            if (videoStream) myVideo.current.srcObject = combinedStream;

            socket.emit('join-conference', roomId);

        } catch (err) {
            setError(`Ошибка инициализации: ${err.message}`);
        }
    };

    const handleNewParticipant = (peerId) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream || undefined,
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        });

        peer.on('signal', signal => {
            socket.emit('webrtc-signal', { targetPeerId: peerId, signal, roomId });
        });

        peer.on('error', err => console.error('Peer error:', err));

        peersRef.current.push({ peerId, peer });
        setPeers(prev => [...prev, { peerId, peer }]);
    };

    useEffect(() => {
        initMedia();

        socket.on('new-participant', handleNewParticipant);
        socket.on('webrtc-signal', ({ senderId, signal }) => {
            const peerObj = peersRef.current.find(p => p.peerId === senderId);
            if (peerObj?.peer) peerObj.peer.signal(signal);
        });

        socket.on('participant-left', ({ peerId }) => {
            peersRef.current = peersRef.current.filter(p => {
                if (p.peerId === peerId) {
                    p.peer.destroy();
                    return false;
                }
                return true;
            });
            setPeers(prev => prev.filter(p => p.peerId !== peerId));
        });

        return () => {
            socket.off('new-participant');
            socket.off('webrtc-signal');
            socket.off('participant-left');
            stream?.getTracks().forEach(track => track.stop());
            peersRef.current.forEach(p => p.peer.destroy());
        };
    }, []);

    const toggleMedia = async (type) => {
        const hasTrack = stream?.getTracks().some(t => t.kind === type);

        if (hasTrack) {
            stream.getTracks()
                .filter(t => t.kind === type)
                .forEach(t => t.stop());
        } else {
            const newStream = await navigator.mediaDevices.getUserMedia({ [type]: true })
                .catch(() => null);

            if (newStream) {
                const updatedStream = new MediaStream([
                    ...stream?.getTracks() || [],
                    ...newStream.getTracks()
                ]);
                setStream(updatedStream);
                if (type === 'video') myVideo.current.srcObject = updatedStream;
            }
        }
    };

    return (
        <div className="conference-container">
            <h3 className="conference-title">Конференция: {roomId}</h3>

            {error && (
                <div className="error-message">
                    {error}
                    <button
                        onClick={initMedia}
                        className="retry-button">
                        Повторить попытку
                    </button>
                </div>
            )}

            <div className="video-grid">
                {stream?.getVideoTracks().length > 0 ? (
                    <video ref={myVideo} autoPlay muted playsInline className="self-video" />
                ) : (
                    <div className="user-avatar">
                        <span>{(username?.[0] || 'U').toUpperCase()}</span>
                    </div>

                )}

                {peers.map(({ peer, peerId }) => (
                    <Video key={peerId} peer={peer} />
                ))}
            </div>

            <div className="controls">
                <button
                    onClick={() => toggleMedia('audio')}
                    className={`control-button ${stream?.getAudioTracks().length ? 'active' : ''}`}>
                    {stream?.getAudioTracks().length ? '🔊' : '🔇'}
                </button>

                <button
                    onClick={() => toggleMedia('video')}
                    className={`control-button ${stream?.getVideoTracks().length ? 'active' : ''}`}>
                    {stream?.getVideoTracks().length ? '📷' : '📵'}
                </button>

                <button
                    onClick={onEnd}
                    className="end-button">
                    Завершить
                </button>
            </div>
        </div>
    );
}

function Video({ peer }) {
    const ref = useRef();

    useEffect(() => {
        const handleStream = stream => ref.current.srcObject = stream;
        peer.on('stream', handleStream);
        return () => peer.off('stream', handleStream);
    }, []);

    return <video ref={ref} autoPlay playsInline className="peer-video" />;
}