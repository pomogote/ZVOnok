// src/pages/CallPage.js
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import axios from 'axios';

export default function CallPage({ socket, roomId }) {
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const [screenSharing, setScreenSharing] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        userVideo.current.srcObject = stream;
        
        socket.emit('joinVoiceRoom', roomId);
        
        socket.on('new-peer', ({ peerId }) => {
          const peer = createPeer(peerId, socket.id, stream);
          peersRef.current.push({ peerId, peer });
          setPeers(users => [...users, { peerId, stream: null }]);
        });

        socket.on('webrtc-signal', ({ senderId, signal }) => {
          const peer = peersRef.current.find(p => p.peerId === senderId)?.peer;
          peer.signal(signal);
        });

        socket.on('peer-disconnected', ({ peerId }) => {
          const peerObj = peersRef.current.find(p => p.peerId === peerId);
          if (peerObj) {
            peerObj.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerId !== peerId);
            setPeers(users => users.filter(u => u.peerId !== peerId));
          }
        });
      });

    return () => {
      socket.off('new-peer');
      socket.off('webrtc-signal');
      socket.off('peer-disconnected');
    };
  }, []);

  const createPeer = (remoteId, localId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    
    peer.on('signal', signal => {
      socket.emit('webrtc-signal', { 
        targetPeerId: remoteId, 
        signal,
        roomId 
      });
    });

    peer.on('stream', remoteStream => {
      setPeers(users => users.map(u => 
        u.peerId === remoteId ? { ...u, stream: remoteStream } : u
      ));
    });

    return peer;
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      userVideo.current.srcObject = stream;
    } else {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      userVideo.current.srcObject = screenStream;
      peersRef.current.forEach(({ peer }) => {
        peer.replaceTrack(
          peer.streams[0].getVideoTracks()[0],
          screenStream.getVideoTracks()[0],
          userVideo.current.srcObject
        );
      });
    }
    setScreenSharing(!screenSharing);
  };

  return (
    <div className="call-container">
      <div className="video-grid">
        <video 
          ref={userVideo} 
          autoPlay 
          muted 
          className="local-video"
        />
        
        {peers.map(peer => (
          <video
            key={peer.peerId}
            ref={ref => ref && (ref.srcObject = peer.stream)}
            autoPlay
            className="remote-video"
          />
        ))}
      </div>

      <div className="call-controls">
        <button onClick={toggleScreenShare}>
          {screenSharing ? 'Stop Sharing' : 'Share Screen'}
        </button>
      </div>
    </div>
  );
}