class WebRTCService {
  constructor() {
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { 
        urls: 'turn:your-turn-server.com',
        username: 'user',
        credential: 'password'
      }
    ];
  }

  getICEServers() {
    return this.iceServers;
  }

  generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

module.exports = new WebRTCService();