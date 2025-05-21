class CallService {
  constructor() {
    this.activeCalls = new Map(); // callId -> { initiatorId, targetId, roomId, status }
    this.conferenceRooms = new Map(); // roomId → Set<userId>
  }

  // Методы для 1:1 звонков
  initiateCall(initiatorId, targetId, roomId) {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.activeCalls.set(callId, {
      initiatorId,
      targetId,
      roomId,
      status: 'ringing'
    });
    return callId;
  }

  acceptCall(callId, userId) {
    const call = this.activeCalls.get(callId);
    if (call && call.targetId === userId) {
      call.status = 'active';
      return true;
    }
    return false;
  }

  // Методы для конференций
  joinConference(roomId, userId) {
    if (!this.conferenceRooms.has(roomId)) {
      this.conferenceRooms.set(roomId, new Set());
    }
    this.conferenceRooms.get(roomId).add(userId);
  }

  leaveConference(roomId, userId) {
    if (this.conferenceRooms.has(roomId)) {
      this.conferenceRooms.get(roomId).delete(userId);
      if (this.conferenceRooms.get(roomId).size === 0) {
        this.conferenceRooms.delete(roomId);
      }
    }
  }

  // Дополнительный метод для проверки конференции
  getConferenceParticipants(roomId) {
    const participants = this.conferenceRooms.get(roomId);
    return participants ? Array.from(participants) : [];
  }
}

module.exports = new CallService();