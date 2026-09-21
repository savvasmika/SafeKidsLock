import { FamilyRoomState, UnlockRequest, DeviceRole } from '../types';

type EventCallback<T = any> = (data: T) => void;

class PairingService {
  private familyCode: string = 'FAMILY-1001';
  private deviceId: string = '';
  private role: DeviceRole = 'child';
  private deviceName: string = 'Device';
  private sse: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatTimer: any = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private lastKnownState: FamilyRoomState | null = null;

  constructor() {
    this.initDeviceId();
    this.initBroadcastChannel();
  }

  private initDeviceId() {
    if (typeof window === 'undefined') return;
    let storedId = localStorage.getItem('kids_device_id');
    if (!storedId) {
      storedId = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('kids_device_id', storedId);
    }
    this.deviceId = storedId;

    const storedFamily = localStorage.getItem('kids_family_code');
    if (storedFamily) {
      this.familyCode = storedFamily.trim().toUpperCase();
    }

    const storedRole = localStorage.getItem('kids_device_role') as DeviceRole;
    if (storedRole) {
      this.role = storedRole;
    }
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      this.broadcastChannel = new BroadcastChannel(`kids_tablet_sync_${this.familyCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const { type, data } = event.data || {};
        if (type) {
          this.emit(type, data);
        }
      };
    } catch {
      // BroadcastChannel not supported in certain restricted iframes
    }
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getFamilyCode(): string {
    return this.familyCode;
  }

  public setFamilyCode(code: string) {
    const cleanCode = (code || 'FAMILY-1001').trim().toUpperCase();
    this.familyCode = cleanCode;
    localStorage.setItem('kids_family_code', cleanCode);
    
    // Reconnect broadcast channel and SSE
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.initBroadcastChannel();
    this.connectSSE();
    this.joinRoom();
  }

  public setRole(role: DeviceRole, name?: string) {
    this.role = role;
    localStorage.setItem('kids_device_role', role);
    if (name) {
      this.deviceName = name;
    }
    this.joinRoom();
  }

  public getRole(): DeviceRole {
    return this.role;
  }

  public start(role: DeviceRole, name: string) {
    this.role = role;
    this.deviceName = name;
    this.connectSSE();
    this.joinRoom();
    this.startHeartbeat();
  }

  public stop() {
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private connectSSE() {
    if (typeof window === 'undefined') return;
    if (this.sse) {
      this.sse.close();
    }

    try {
      const url = `/api/pair/events?familyCode=${encodeURIComponent(this.familyCode)}&deviceId=${encodeURIComponent(this.deviceId)}&role=${encodeURIComponent(this.role)}`;
      this.sse = new EventSource(url);

      this.sse.addEventListener('room:state', (e) => {
        try {
          const state = JSON.parse(e.data);
          this.lastKnownState = state;
          this.emit('room:state', state);
        } catch {}
      });

      this.sse.addEventListener('unlock:requested', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.emit('unlock:requested', data);
        } catch {}
      });

      this.sse.addEventListener('unlock:approved', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.emit('unlock:approved', data);
        } catch {}
      });

      this.sse.addEventListener('unlock:rejected', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.emit('unlock:rejected', data);
        } catch {}
      });

      this.sse.addEventListener('remote:lock', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.emit('remote:lock', data);
        } catch {}
      });

      this.sse.addEventListener('remote:extend', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.emit('remote:extend', data);
        } catch {}
      });

      this.sse.onerror = () => {
        // SSE auto-reconnects by default in browsers
      };
    } catch (err) {
      console.warn('SSE connection failed, relying on polling/broadcast:', err);
    }
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 6000);
  }

  public async joinRoom(childAvatar: string = '🦊'): Promise<FamilyRoomState | null> {
    try {
      const res = await fetch('/api/pair/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: this.familyCode,
          deviceId: this.deviceId,
          role: this.role === 'parent' ? 'parent' : 'child',
          deviceName: this.deviceName,
          childAvatar,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        this.lastKnownState = data.room;
        this.emit('room:state', data.room);
        return data.room;
      }
    } catch (err) {
      console.warn('Failed to join pairing room:', err);
    }
    return null;
  }

  public async sendHeartbeat(statusUpdate?: any): Promise<FamilyRoomState | null> {
    try {
      const res = await fetch('/api/pair/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: this.familyCode,
          deviceId: this.deviceId,
          role: this.role === 'parent' ? 'parent' : 'child',
          statusUpdate,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        this.lastKnownState = data.room;
        this.emit('room:state', data.room);
        return data.room;
      }
    } catch {}
    return null;
  }

  public async requestUnlock(childName: string, requestedDuration: number = 30): Promise<UnlockRequest | null> {
    try {
      const res = await fetch('/api/pair/request-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: this.familyCode,
          childDeviceId: this.deviceId,
          childName,
          requestedDuration,
        }),
      });
      const data = await res.json();
      if (data.success && data.request) {
        // Broadcast locally too
        this.broadcastLocally('unlock:requested', { request: data.request });
        return data.request;
      }
    } catch (err) {
      console.error('Request unlock error:', err);
    }
    return null;
  }

  public async approveUnlock(requestId: string, durationMinutes: number = 30, autoUnlock: boolean = true, parentName: string = 'Parent'): Promise<boolean> {
    try {
      const res = await fetch('/api/pair/approve-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: this.familyCode,
          requestId,
          durationMinutes,
          autoUnlock,
          parentName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        this.broadcastLocally('unlock:approved', data.payload);
        return true;
      }
    } catch (err) {
      console.error('Approve unlock error:', err);
    }
    return false;
  }

  public async rejectUnlock(requestId: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/pair/reject-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: this.familyCode,
          requestId,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        this.broadcastLocally('unlock:rejected', { requestId, reason });
        return true;
      }
    } catch {}
    return false;
  }

  public async sendRemoteLock(reason?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/pair/remote-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: this.familyCode,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        this.broadcastLocally('remote:lock', { reason });
        return true;
      }
    } catch {}
    return false;
  }

  public async sendRemoteExtend(additionalMinutes: number = 15): Promise<boolean> {
    try {
      const res = await fetch('/api/pair/remote-extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: this.familyCode,
          additionalMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        this.broadcastLocally('remote:extend', { additionalMinutes });
        return true;
      }
    } catch {}
    return false;
  }

  public async fetchState(): Promise<FamilyRoomState | null> {
    try {
      const res = await fetch(`/api/pair/state?familyCode=${encodeURIComponent(this.familyCode)}`);
      const data = await res.json();
      if (data.success && data.room) {
        this.lastKnownState = data.room;
        this.emit('room:state', data.room);
        return data.room;
      }
    } catch {}
    return null;
  }

  private broadcastLocally(type: string, data: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type, data });
      } catch {}
    }
    this.emit(type, data);
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  public getLastKnownState(): FamilyRoomState | null {
    return this.lastKnownState;
  }
}

export const pairingService = new PairingService();
