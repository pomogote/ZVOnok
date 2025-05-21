import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import './css/ConferenceCall.css';

export default function ConferenceCall({ socket, userId, username = 'User', roomId, onEnd }) {
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState([]);
    const [error, setError] = useState('');
    const peersRef = useRef([]);
    const myVideo = useRef(null);

    // Screen sharing states
    const [screenSharing, setScreenSharing] = useState(false);
    const [screenTrack, setScreenTrack] = useState(null);
    const [cameraTrack, setCameraTrack] = useState(null);
    const [screenSharingByPeer, setScreenSharingByPeer] = useState({});

    useEffect(() => {
        const init = async () => {
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
                const combined = new MediaStream([
                    ...(audioStream?.getTracks() || []),
                    ...(videoStream?.getTracks() || [])
                ]);
                setStream(combined);
                if (videoStream && videoStream.getVideoTracks().length) {
                    setCameraTrack(videoStream.getVideoTracks()[0]);
                }
                if (myVideo.current) myVideo.current.srcObject = combined;
                socket.emit('join-conference', { roomId, peerId: socket.id });
            } catch (err) {
                setError(`Initialization error: ${err.message}`);
            }
        };
        init();

        socket.on('new-conference-participant', ({ peerId }) => {
            if (peerId === socket.id) return;
            if (peersRef.current.some(p => p.peerId === peerId)) return;
            const peer = new Peer({ initiator: true, trickle: false, stream });
            peer.on('signal', signal => {
                socket.emit('webrtc-signal', { target: peerId, senderId: socket.id, signal, roomId });
            });
            peer.on('error', e => console.error('Peer error:', e));
            peersRef.current.push({ peerId, peer });
            setPeers(prev => [...prev, { peerId, peer }]);
        });

        socket.on('webrtc-signal', ({ senderId, signal }) => {
            if (senderId === socket.id) return;
            const existing = peersRef.current.find(p => p.peerId === senderId);
            if (existing) {
                existing.peer.signal(signal);
            } else {
                const peer = new Peer({ initiator: false, trickle: false, stream });
                peer.on('signal', sig => {
                    socket.emit('webrtc-signal', { target: senderId, senderId: socket.id, signal: sig, roomId });
                });
                peer.on('error', e => console.error('Peer error:', e));
                peer.signal(signal);
                peersRef.current.push({ peerId: senderId, peer });
                setPeers(prev => [...prev, { peerId: senderId, peer }]);
            }
        });

        socket.on('conference-participant-left', ({ peerId }) => {
            peersRef.current = peersRef.current.filter(p => p.peerId !== peerId);
            setPeers(prev => prev.filter(p => p.peerId !== peerId));
            setScreenSharingByPeer(prev => {
                const next = { ...prev };
                delete next[peerId];
                return next;
            });
        });

        // Screen share
        socket.on('screen-share', ({ peerId }) => {
            setScreenSharingByPeer(prev => ({ ...prev, [peerId]: true }));
        });
        socket.on('screen-share-stop', ({ peerId }) => {
            setScreenSharingByPeer(prev => {
                const next = { ...prev };
                delete next[peerId];
                return next;
            });
        });
        socket.on('screen-share-joined', ({ requesterId }) => {
            const peerObj = peersRef.current.find(p => p.peerId === requesterId);
            if (peerObj && screenTrack && cameraTrack && !peerObj.peer.destroyed) {
                try {
                    peerObj.peer.replaceTrack(cameraTrack, screenTrack, stream);
                } catch (e) {
                    console.error('Failed replaceTrack on join:', e);
                }
            }
        });

        return () => {
            socket.off('new-conference-participant');
            socket.off('webrtc-signal');
            socket.off('conference-participant-left');
            socket.off('screen-share');
            socket.off('screen-share-stop');
            socket.off('screen-share-joined');
            stream?.getTracks().forEach(t => t.stop());
            peersRef.current.forEach(p => p.peer.destroy());
        };
    }, [socket, stream, screenTrack, cameraTrack]);

    const toggleMedia = type => {
        const tracks = stream?.getTracks().filter(t => t.kind === type);
        if (!tracks?.length) return;
        tracks.forEach(t => (t.enabled = !t.enabled));
        setStream(new MediaStream(stream.getTracks()));
    };

    const toggleScreenShare = async () => {
        if (!screenSharing) {
            try {
                const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const [track] = display.getVideoTracks();
                setScreenTrack(track);
                setScreenSharing(true);
                peersRef.current.forEach(({ peer }) => {
                    if (!peer.destroyed) peer.replaceTrack(cameraTrack, track, stream);
                });
                socket.emit('screen-share', { roomId, peerId: socket.id });
            } catch (err) {
                console.error('Screen share error:', err);
            }
        } else {
            if (screenTrack) screenTrack.stop();
            setScreenSharing(false);
            peersRef.current.forEach(({ peer }) => {
                if (!peer.destroyed) peer.replaceTrack(screenTrack, cameraTrack, stream);
            });
            socket.emit('screen-share-stop', { roomId, peerId: socket.id });
        }
    };

    return (
        <div className="conference-container">
            <h3 className="conference-title">Конференция: {roomId}</h3>
            {error && <div className="error-message">{error}</div>}
            <div className="video-grid">
                {stream && stream.getVideoTracks().length > 0 ? (
                    <video ref={myVideo} autoPlay muted playsInline className="self-video" />
                ) : (
                    <div className="user-avatar"><span>{username[0].toUpperCase()}</span></div>
                )}
                {peers.map(({ peerId, peer }) => (
                    <div key={peerId} style={{ position: 'relative' }}>
                        <Video peer={peer} />
                        {screenSharingByPeer[peerId] && (
                            <button
                                className="screen-join-btn"
                                onClick={() => socket.emit('screen-share-join', { roomId, targetPeerId: peerId })}
                            >Смотреть экран</button>
                        )}
                    </div>
                ))}
            </div>
            <div className="controls">
                <button onClick={() => toggleMedia('audio')} className={`control-button ${stream?.getAudioTracks().length ? 'active' : ''}`}>🔊</button>
                <button onClick={() => toggleMedia('video')} className={`control-button ${stream?.getVideoTracks().length ? 'active' : ''}`}>📷</button>
                <button
                    onClick={toggleScreenShare}
                    className="control-button"
                    title={screenSharing ? 'Остановить демонстрацию экрана' : 'Демонстрация экрана'}
                >📺</button>
                <button onClick={onEnd} className="end-button">Завершить</button>
            </div>
        </div>
    );
}

function Video({ peer }) {
    const ref = useRef();
    useEffect(() => {
        const handleStream = stream => {
            console.log('📺 got remote stream for peer', peer);
            ref.current.srcObject = stream;
        };
        peer.on('stream', handleStream);
        return () => peer.off('stream', handleStream);
    }, [peer]);
    return <video ref={ref} autoPlay playsInline className="peer-video" />;
}
