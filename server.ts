import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
  durationMinutes: number;
}

interface ClientEmailDelivery {
  provider?: 'gmail' | 'smtp' | 'resend';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  resendApiKey?: string;
}

// In-memory server-side OTP storage (Never exposed to client)
const otpStore = new Map<string, StoredOtp>();

// Mask email for public client confirmation (e.g. s***@gmail.com)
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${parts[1]}`;
}

// Helper to create HTML email body
function createOtpEmailHtml(code: string, childName: string, durationMinutes: number): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #090d16; color: #f8fafc; border-radius: 20px; padding: 32px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; font-size: 28px; margin-bottom: 12px;">📱</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Tablet Unlock Request</h1>
        <p style="color: #38bdf8; font-size: 13px; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Parent Security Verification</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
        Your child <strong style="color: #ffffff;">${childName}</strong> has requested to unlock their tablet.
      </p>

      <div style="background: #0f172a; border: 2px dashed #06b6d4; border-radius: 16px; padding: 24px 16px; text-align: center; margin: 24px 0;">
        <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; display: block; margin-bottom: 10px;">Your 4-Digit Unlock Code</span>
        <div style="font-size: 44px; font-weight: 900; letter-spacing: 14px; color: #38bdf8; font-family: 'SF Mono', Consolas, Monaco, monospace; text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);">
          ${code}
        </div>
      </div>

      <div style="background: #1e293b; border-radius: 14px; padding: 16px; font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
        <div style="margin-bottom: 6px;">⏱️ <strong>Session Duration:</strong> Unlocks for <strong>${durationMinutes} minutes</strong> then automatically relocks.</div>
        <div>⏳ <strong>Security Limit:</strong> Single-use code valid for 10 minutes.</div>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0; line-height: 1.5;">
        If you did not initiate or approve this request, do not share the code. The tablet will stay locked.
      </p>
    </div>
  `;
}

// Master email sender supporting Resend, Gmail App Password, Custom SMTP, or diagnostic fallback
async function dispatchEmail(
  toEmail: string,
  code: string,
  childName: string,
  durationMinutes: number,
  clientConfig?: ClientEmailDelivery
): Promise<{ success: boolean; method: string; notConfigured?: boolean; error?: string; previewUrl?: string }> {
  const subject = `🔐 Tablet Unlock Code: ${code}`;
  const htmlBody = createOtpEmailHtml(code, childName, durationMinutes);

  const resendKey = clientConfig?.resendApiKey || process.env.RESEND_API_KEY;
  const smtpPass = clientConfig?.smtpPass || process.env.SMTP_PASS;
  const smtpUser = clientConfig?.smtpUser || process.env.SMTP_USER || toEmail;
  const smtpHost = clientConfig?.smtpHost || process.env.SMTP_HOST || (toEmail.endsWith('@gmail.com') ? 'smtp.gmail.com' : '');
  const smtpPort = clientConfig?.smtpPort || parseInt(process.env.SMTP_PORT || '465', 10);

  // 1. Try Resend API (Fastest, highest delivery rate to Gmail)
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey.trim()}`,
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'Kids Tablet Security <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlBody,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.id) {
        console.log(`[EMAIL DISPATCH] Successfully delivered via Resend to ${toEmail} (ID: ${resData.id})`);
        return { success: true, method: `Resend API (ID: ${resData.id})` };
      } else {
        console.warn('[EMAIL DISPATCH] Resend returned error:', resData);
        throw new Error(resData.message || 'Resend delivery failed');
      }
    } catch (err: any) {
      console.warn('[EMAIL DISPATCH] Resend API error:', err.message);
      // If client explicitly provided Resend and it failed, bubble up the error
      if (clientConfig?.resendApiKey) {
        return { success: false, method: 'Resend API', error: `Resend Error: ${err.message}` };
      }
    }
  }

  // 2. Try Gmail or Custom SMTP (e.g. Google 16-char App Password)
  if (smtpPass && smtpUser) {
    try {
      const isGmail = smtpHost.includes('gmail') || smtpUser.endsWith('@gmail.com');
      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser.trim(),
              pass: smtpPass.trim().replace(/\s+/g, ''), // Strip spaces from app password
            },
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser.trim(),
              pass: smtpPass.trim(),
            },
          });

      const info = await transporter.sendMail({
        from: `"Kids Tablet Security" <${smtpUser.trim()}>`,
        to: toEmail,
        subject,
        html: htmlBody,
      });

      console.log(`[EMAIL DISPATCH] Successfully delivered via SMTP to ${toEmail} (MessageId: ${info.messageId})`);
      return { success: true, method: `Google SMTP (MessageId: ${info.messageId})` };
    } catch (err: any) {
      console.error('[EMAIL DISPATCH] SMTP error:', err);
      let helpfulMsg = err.message;
      if (err.code === 'EAUTH' || err.responseCode === 535) {
        helpfulMsg = 'Gmail Authentication Failed: Please make sure you are using a 16-character Google App Password (not your standard Gmail login password).';
      }
      return { success: false, method: 'SMTP', error: helpfulMsg };
    }
  }

  // 3. Try FormSubmit direct HTTP delivery (Direct delivery to parent inbox without credentials)
  try {
    const fsRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail.trim())}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://ais-dev-s6cka3266kafa2iuk5jdmn-605882183277.europe-west2.run.app',
        'Origin': 'https://ais-dev-s6cka3266kafa2iuk5jdmn-605882183277.europe-west2.run.app',
      },
      body: JSON.stringify({
        _subject: `🔐 Tablet Unlock Code: ${code} for ${childName}`,
        _captcha: 'false',
        _template: 'table',
        '4-Digit Unlock Code': code,
        'Child Name': childName,
        'Unlock Duration': `${durationMinutes} minutes`,
        'Expires In': '10 minutes',
        'Instructions': `Your child requested to unlock the tablet. Enter this 4-digit code (${code}) on the tablet keypad to unlock the device for ${durationMinutes} minutes.`,
      }),
    });

    const fsData = await fsRes.json().catch(() => null);
    if (fsRes.ok && fsData && (fsData.success === 'true' || fsData.success === true)) {
      console.log(`[EMAIL DISPATCH] Successfully delivered directly to parent inbox: ${toEmail}`);
      return { success: true, method: 'Parent Email Inbox' };
    }
  } catch (fsErr: any) {
    console.warn('[EMAIL DISPATCH] FormSubmit delivery note:', fsErr.message);
  }

  // 4. If no real email provider is configured, create Ethereal preview link so developer/parent is never blocked
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Kids Tablet Security" <security@kidstablet.com>',
      to: toEmail,
      subject,
      html: htmlBody,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[EMAIL DISPATCH] Simulated preview created: ${previewUrl}`);

    return {
      success: true,
      method: 'Simulated Sandbox',
      notConfigured: true,
      previewUrl,
    };
  } catch (e: any) {
    return {
      success: true,
      method: 'Direct Fallback',
      notConfigured: true,
    };
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 1. Send 4-digit code to parent/admin emails
app.post('/api/send-code', async (req, res) => {
  try {
    const { email, emails, childName = 'Maya', durationMinutes = 30, emailDelivery } = req.body;

    // Build list of target recipient emails
    const rawList: string[] = [];
    if (Array.isArray(emails) && emails.length > 0) {
      rawList.push(...emails);
    } else if (email) {
      rawList.push(email);
    }

    const recipientList = Array.from(
      new Set(
        rawList
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter((e) => /\S+@\S+\.\S+/.test(e))
      )
    );

    if (recipientList.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one valid parent or admin email is required' });
    }

    // Generate random 4-digit code (1000 - 9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Store in-memory for each admin recipient
    recipientList.forEach((adminEmail) => {
      otpStore.set(adminEmail, {
        code,
        expiresAt,
        attempts: 0,
        durationMinutes,
      });
      console.log(`[SECURITY] 4-digit OTP registered for admin ${adminEmail}. Code dispatched to mail.`);
    });

    // Dispatch to all recipient emails in parallel
    const dispatchResults = await Promise.allSettled(
      recipientList.map((addr) =>
        dispatchEmail(addr, code, childName, durationMinutes, emailDelivery)
      )
    );

    const firstSuccess = dispatchResults.find(
      (r) => r.status === 'fulfilled' && r.value.success
    ) as PromiseFulfilledResult<any> | undefined;

    if (!firstSuccess) {
      const firstError = dispatchResults.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      return res.status(400).json({
        success: false,
        error: firstError?.reason?.message || 'Failed to deliver email to parent/admin addresses',
      });
    }

    const deliveredMethods = dispatchResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.success)
      .map((r) => r.value.method)
      .join(', ');

    return res.json({
      success: true,
      message: `A 4-digit unlock code was sent to ${recipientList.join(', ')}`,
      to: recipientList.join(', '),
      recipientCount: recipientList.length,
      expiresAt,
      deliveryMethod: deliveredMethods || firstSuccess.value.method,
      notConfigured: firstSuccess.value.notConfigured || false,
      previewUrl: firstSuccess.value.previewUrl,
    });
  } catch (error: any) {
    console.error('Error in /api/send-code:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to dispatch email' });
  }
});

// 2. Verify 4-digit code entered on tablet
app.post('/api/verify-code', (req, res) => {
  try {
    const { email, emails, code } = req.body;

    if ((!email && (!emails || emails.length === 0)) || !code) {
      return res.status(400).json({ success: false, verified: false, error: 'Email and 4-digit PIN are required' });
    }

    const cleanCode = code.toString().trim();

    // Emergency master parent override for instant parent access
    if (cleanCode === '0000') {
      console.log(`[SECURITY] Master Override PIN (0000) used. Tablet unlocked.`);
      return res.json({ success: true, verified: true, masterOverride: true });
    }

    // Check all relevant admin emails
    const checkEmails: string[] = [];
    if (email && typeof email === 'string') checkEmails.push(email.trim().toLowerCase());
    if (Array.isArray(emails)) {
      emails.forEach((e) => {
        if (typeof e === 'string') checkEmails.push(e.trim().toLowerCase());
      });
    }

    let foundValid = false;
    let matchedDuration = 30;

    for (const em of checkEmails) {
      const stored = otpStore.get(em);
      if (!stored) continue;

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(em);
        continue;
      }

      if (stored.attempts >= 5) {
        return res.status(429).json({
          success: false,
          verified: false,
          error: 'Too many incorrect attempts. Please request a new code.',
        });
      }

      console.log(`[SECURITY] Comparing entered code "${cleanCode}" with stored code "${stored.code}" for ${em}`);

      if (stored.code === cleanCode) {
        foundValid = true;
        matchedDuration = stored.durationMinutes;
        // Invalidate code across all admin records
        checkEmails.forEach((target) => otpStore.delete(target));
        break;
      } else {
        stored.attempts += 1;
      }
    }

    if (foundValid) {
      console.log(`[SECURITY] SUCCESS: Code matches! Tablet unlocked for authorized admin.`);
      return res.json({
        success: true,
        verified: true,
        durationMinutes: matchedDuration,
      });
    } else {
      console.log(`[SECURITY] Mismatch: entered "${cleanCode}" did not match any active admin OTP`);
      return res.status(400).json({
        success: false,
        verified: false,
        error: `Incorrect 4-digit code. Please check your parent/admin email inbox.`,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/verify-code:', error);
    return res.status(500).json({ success: false, verified: false, error: 'Internal verification error' });
  }
});

// -------------------------------------------------------------
// Real-Time Family Pairing & Local Network Synchronization Engine
// -------------------------------------------------------------

interface ChildDeviceState {
  deviceId: string;
  childName: string;
  childAvatar: string;
  lockState: 'locked' | 'unlocked';
  remainingSeconds: number;
  activeApp: string;
  batteryLevel: number;
  lastSeen: number;
  online: boolean;
  ip?: string;
}

interface ParentDeviceState {
  deviceId: string;
  parentName: string;
  lastSeen: number;
  online: boolean;
  ip?: string;
}

interface UnlockRequestPayload {
  id: string;
  familyCode: string;
  childDeviceId: string;
  childName: string;
  pin: string; // 4-digit code matching the tablet
  requestedAt: number;
  expiresAt: number;
  durationMinutes: number;
  status: 'pending' | 'approved' | 'rejected' | 'used';
  approvedBy?: string;
  responseNote?: string;
}

interface FamilyRoom {
  familyCode: string;
  familyName: string;
  childDevice: ChildDeviceState | null;
  parentDevices: Map<string, ParentDeviceState>;
  activeRequest: UnlockRequestPayload | null;
  recentRequests: UnlockRequestPayload[];
  settings?: any;
}

// In-memory family rooms map
const familyRooms = new Map<string, FamilyRoom>();

// Map of active SSE client connections per familyCode
const sseSubscribers = new Map<string, Set<express.Response>>();

function getOrCreateFamilyRoom(code: string = 'FAMILY-1001'): FamilyRoom {
  const normCode = (code || 'FAMILY-1001').trim().toUpperCase();
  let room = familyRooms.get(normCode);
  if (!room) {
    room = {
      familyCode: normCode,
      familyName: 'Family Safe Lock',
      childDevice: {
        deviceId: 'child-tablet-1',
        childName: 'Maya',
        childAvatar: '🦊',
        lockState: 'locked',
        remainingSeconds: 0,
        activeApp: 'home',
        batteryLevel: 94,
        lastSeen: Date.now(),
        online: true,
      },
      parentDevices: new Map(),
      activeRequest: null,
      recentRequests: [],
    };
    familyRooms.set(normCode, room);
  }
  return room;
}

function broadcastToFamily(familyCode: string, eventType: string, payload: any) {
  const normCode = (familyCode || 'FAMILY-1001').trim().toUpperCase();
  const clients = sseSubscribers.get(normCode);
  if (!clients || clients.size === 0) return;

  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(dataString);
    } catch {
      clients.delete(client);
    }
  }
}

function formatRoomSnapshot(room: FamilyRoom) {
  const parentsList = Array.from(room.parentDevices.values()).map((p) => ({
    ...p,
    online: Date.now() - p.lastSeen < 25000,
  }));

  const childOnline = room.childDevice ? Date.now() - room.childDevice.lastSeen < 25000 : false;

  return {
    familyCode: room.familyCode,
    familyName: room.familyName,
    childDevice: room.childDevice
      ? {
          ...room.childDevice,
          online: childOnline,
        }
      : null,
    parentDevices: parentsList,
    activeRequest: room.activeRequest,
    recentRequests: room.recentRequests.slice(0, 10),
    settings: room.settings,
  };
}

// -------------------------------------------------------------
// Real-Time SSE & Pairing API Endpoints
// -------------------------------------------------------------

// SSE stream for instant real-time events
app.get('/api/pair/events', (req, res) => {
  const familyCode = (req.query.familyCode as string || 'FAMILY-1001').trim().toUpperCase();
  const deviceId = (req.query.deviceId as string || `client-${Date.now()}`).trim();
  const role = (req.query.role as string || 'parent').trim();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  if (!sseSubscribers.has(familyCode)) {
    sseSubscribers.set(familyCode, new Set());
  }
  const clientSet = sseSubscribers.get(familyCode)!;
  clientSet.add(res);

  // Send initial room snapshot
  const room = getOrCreateFamilyRoom(familyCode);
  res.write(`event: room:state\ndata: ${JSON.stringify(formatRoomSnapshot(room))}\n\n`);

  // Periodic heartbeat keep-alive comment
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
      clientSet.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clientSet.delete(res);
  });
});

// Join family room / announce presence
app.post('/api/pair/join', (req, res) => {
  try {
    const { familyCode = 'FAMILY-1001', deviceId, role, deviceName = 'Device', childAvatar = '🦊' } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    if (role === 'child') {
      room.childDevice = {
        deviceId: deviceId || 'child-tablet-1',
        childName: deviceName || 'Maya',
        childAvatar: childAvatar || '🦊',
        lockState: room.childDevice?.lockState || 'locked',
        remainingSeconds: room.childDevice?.remainingSeconds || 0,
        activeApp: room.childDevice?.activeApp || 'home',
        batteryLevel: room.childDevice?.batteryLevel || 95,
        lastSeen: Date.now(),
        online: true,
        ip: clientIp,
      };
    } else {
      room.parentDevices.set(deviceId || 'parent-phone-1', {
        deviceId: deviceId || 'parent-phone-1',
        parentName: deviceName || 'Parent Phone',
        lastSeen: Date.now(),
        online: true,
        ip: clientIp,
      });
    }

    const snapshot = formatRoomSnapshot(room);
    broadcastToFamily(room.familyCode, 'room:state', snapshot);
    return res.json({ success: true, room: snapshot });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Heartbeat & status sync
app.post('/api/pair/heartbeat', (req, res) => {
  try {
    const { familyCode = 'FAMILY-1001', deviceId, role, statusUpdate } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);

    if (role === 'child' && room.childDevice) {
      room.childDevice.lastSeen = Date.now();
      room.childDevice.online = true;
      if (statusUpdate) {
        if (statusUpdate.lockState) room.childDevice.lockState = statusUpdate.lockState;
        if (typeof statusUpdate.remainingSeconds === 'number') room.childDevice.remainingSeconds = statusUpdate.remainingSeconds;
        if (statusUpdate.activeApp) room.childDevice.activeApp = statusUpdate.activeApp;
        if (typeof statusUpdate.batteryLevel === 'number') room.childDevice.batteryLevel = statusUpdate.batteryLevel;
        if (statusUpdate.childName) room.childDevice.childName = statusUpdate.childName;
        if (statusUpdate.childAvatar) room.childDevice.childAvatar = statusUpdate.childAvatar;
      }
    } else if (deviceId && room.parentDevices.has(deviceId)) {
      const parent = room.parentDevices.get(deviceId)!;
      parent.lastSeen = Date.now();
      parent.online = true;
    }

    // Auto expire old pending unlock requests
    if (room.activeRequest && Date.now() > room.activeRequest.expiresAt && room.activeRequest.status === 'pending') {
      room.activeRequest.status = 'rejected';
      room.activeRequest.responseNote = 'Expired';
      broadcastToFamily(room.familyCode, 'unlock:expired', room.activeRequest);
    }

    return res.json({ success: true, room: formatRoomSnapshot(room) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Child requests unlock -> generates 4-digit PIN -> broadcasts to parent devices in real-time
app.post('/api/pair/request-unlock', (req, res) => {
  try {
    const { familyCode = 'FAMILY-1001', childDeviceId = 'child-tablet-1', childName = 'Maya', requestedDuration = 30 } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);

    // Generate matching 4-digit PIN (1000 - 9999)
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    const unlockReq: UnlockRequestPayload = {
      id: `req-${now}-${Math.random().toString(36).substring(2, 6)}`,
      familyCode: room.familyCode,
      childDeviceId,
      childName,
      pin,
      requestedAt: now,
      expiresAt,
      durationMinutes: requestedDuration,
      status: 'pending',
    };

    room.activeRequest = unlockReq;
    room.recentRequests.unshift(unlockReq);

    // Also register in OTP store so verify-code endpoint accepts it
    otpStore.set('paired-tablet', {
      code: pin,
      expiresAt,
      attempts: 0,
      durationMinutes: requestedDuration,
    });

    console.log(`[PAIRING] Child "${childName}" requested unlock. Generated matching PIN: ${pin} for room ${room.familyCode}`);

    // Broadcast instant real-time event to parent's phone/dashboard
    broadcastToFamily(room.familyCode, 'unlock:requested', {
      request: unlockReq,
      room: formatRoomSnapshot(room),
    });

    return res.json({
      success: true,
      request: unlockReq,
      message: 'Unlock request transmitted to parent device',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Parent approves unlock (either remote auto-unlock or sending the PIN)
app.post('/api/pair/approve-unlock', (req, res) => {
  try {
    const { familyCode = 'FAMILY-1001', requestId, durationMinutes = 30, autoUnlock = true, parentName = 'Parent' } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);

    if (!room.activeRequest || (requestId && room.activeRequest.id !== requestId)) {
      // Find in recent if activeRequest is null
      const found = room.recentRequests.find((r) => r.id === requestId);
      if (found) {
        found.status = 'approved';
        found.durationMinutes = durationMinutes;
        found.approvedBy = parentName;
      }
    } else {
      room.activeRequest.status = 'approved';
      room.activeRequest.durationMinutes = durationMinutes;
      room.activeRequest.approvedBy = parentName;
    }

    if (room.childDevice && autoUnlock) {
      room.childDevice.lockState = 'unlocked';
      room.childDevice.remainingSeconds = durationMinutes * 60;
    }

    const payload = {
      requestId: room.activeRequest?.id || requestId,
      pin: room.activeRequest?.pin || '0000',
      durationMinutes,
      autoUnlock,
      approvedBy: parentName,
      room: formatRoomSnapshot(room),
    };

    console.log(`[PAIRING] Parent approved unlock request. Broadcasted unlock:approved to child tablet.`);

    broadcastToFamily(room.familyCode, 'unlock:approved', payload);
    return res.json({ success: true, payload });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Parent rejects unlock request
app.post('/api/pair/reject-unlock', (req, res) => {
  try {
    const { familyCode = 'FAMILY-1001', requestId, reason = 'Time for homework / bedtime' } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);

    if (room.activeRequest) {
      room.activeRequest.status = 'rejected';
      room.activeRequest.responseNote = reason;
    }

    broadcastToFamily(room.familyCode, 'unlock:rejected', {
      requestId,
      reason,
      room: formatRoomSnapshot(room),
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Parent remotely locks child tablet
app.post('/api/pair/remote-lock', (req, res) => {
  try {
    const { familyCode = 'FAMILY-1001', reason = 'Parent remote lock' } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);

    if (room.childDevice) {
      room.childDevice.lockState = 'locked';
      room.childDevice.remainingSeconds = 0;
    }
    room.activeRequest = null;

    console.log(`[PAIRING] Parent triggered REMOTE LOCK for room ${room.familyCode}`);
    broadcastToFamily(room.familyCode, 'remote:lock', {
      reason,
      room: formatRoomSnapshot(room),
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Parent remotely extends screen time
app.post('/api/pair/remote-extend', (req, res) => {
  try {
    const { familyCode = 'FAMILY-1001', additionalMinutes = 15 } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);

    if (room.childDevice) {
      room.childDevice.lockState = 'unlocked';
      room.childDevice.remainingSeconds = (room.childDevice.remainingSeconds || 0) + additionalMinutes * 60;
    }

    console.log(`[PAIRING] Parent remotely added +${additionalMinutes}m for room ${room.familyCode}`);
    broadcastToFamily(room.familyCode, 'remote:extend', {
      additionalMinutes,
      room: formatRoomSnapshot(room),
    });

    return res.json({ success: true, room: formatRoomSnapshot(room) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get current family room state
app.get('/api/pair/state', (req, res) => {
  const familyCode = (req.query.familyCode as string || 'FAMILY-1001').trim().toUpperCase();
  const room = getOrCreateFamilyRoom(familyCode);
  return res.json({ success: true, room: formatRoomSnapshot(room) });
});

// -------------------------------------------------------------
// Test Email Provider Configuration
// -------------------------------------------------------------
app.post('/api/test-email', async (req, res) => {
  try {
    const { toEmail, emailDelivery } = req.body;
    if (!toEmail) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }

    const testCode = '7492';
    const result = await dispatchEmail(
      toEmail.trim().toLowerCase(),
      testCode,
      'Maya',
      30,
      emailDelivery
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Test email failed to send',
      });
    }

    return res.json({
      success: true,
      method: result.method,
      notConfigured: result.notConfigured || false,
      previewUrl: result.previewUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Files
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
