class CallService {
  constructor() {
    this.activeCalls = new Map(); // callId -> { initiatorId, targetId, roomId, status }
  }

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
}

module.exports = new CallService();