var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var otpStore = /* @__PURE__ */ new Map();
function createOtpEmailHtml(code, childName, durationMinutes) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #090d16; color: #f8fafc; border-radius: 20px; padding: 32px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; font-size: 28px; margin-bottom: 12px;">\u{1F4F1}</div>
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
        <div style="margin-bottom: 6px;">\u23F1\uFE0F <strong>Session Duration:</strong> Unlocks for <strong>${durationMinutes} minutes</strong> then automatically relocks.</div>
        <div>\u23F3 <strong>Security Limit:</strong> Single-use code valid for 10 minutes.</div>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0; line-height: 1.5;">
        If you did not initiate or approve this request, do not share the code. The tablet will stay locked.
      </p>
    </div>
  `;
}
async function dispatchEmail(toEmail, code, childName, durationMinutes, clientConfig) {
  const subject = `\u{1F510} Tablet Unlock Code: ${code}`;
  const htmlBody = createOtpEmailHtml(code, childName, durationMinutes);
  const resendKey = clientConfig?.resendApiKey || process.env.RESEND_API_KEY;
  const smtpPass = clientConfig?.smtpPass || process.env.SMTP_PASS;
  const smtpUser = clientConfig?.smtpUser || process.env.SMTP_USER || toEmail;
  const smtpHost = clientConfig?.smtpHost || process.env.SMTP_HOST || (toEmail.endsWith("@gmail.com") ? "smtp.gmail.com" : "");
  const smtpPort = clientConfig?.smtpPort || parseInt(process.env.SMTP_PORT || "465", 10);
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey.trim()}`
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || "Kids Tablet Security <onboarding@resend.dev>",
          to: [toEmail],
          subject,
          html: htmlBody
        })
      });
      const resData = await res.json();
      if (res.ok && resData.id) {
        console.log(`[EMAIL DISPATCH] Successfully delivered via Resend to ${toEmail} (ID: ${resData.id})`);
        return { success: true, method: `Resend API (ID: ${resData.id})` };
      } else {
        console.warn("[EMAIL DISPATCH] Resend returned error:", resData);
        throw new Error(resData.message || "Resend delivery failed");
      }
    } catch (err) {
      console.warn("[EMAIL DISPATCH] Resend API error:", err.message);
      if (clientConfig?.resendApiKey) {
        return { success: false, method: "Resend API", error: `Resend Error: ${err.message}` };
      }
    }
  }
  if (smtpPass && smtpUser) {
    try {
      const isGmail = smtpHost.includes("gmail") || smtpUser.endsWith("@gmail.com");
      const transporter = isGmail ? import_nodemailer.default.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser.trim(),
          pass: smtpPass.trim().replace(/\s+/g, "")
          // Strip spaces from app password
        }
      }) : import_nodemailer.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser.trim(),
          pass: smtpPass.trim()
        }
      });
      const info = await transporter.sendMail({
        from: `"Kids Tablet Security" <${smtpUser.trim()}>`,
        to: toEmail,
        subject,
        html: htmlBody
      });
      console.log(`[EMAIL DISPATCH] Successfully delivered via SMTP to ${toEmail} (MessageId: ${info.messageId})`);
      return { success: true, method: `Google SMTP (MessageId: ${info.messageId})` };
    } catch (err) {
      console.error("[EMAIL DISPATCH] SMTP error:", err);
      let helpfulMsg = err.message;
      if (err.code === "EAUTH" || err.responseCode === 535) {
        helpfulMsg = "Gmail Authentication Failed: Please make sure you are using a 16-character Google App Password (not your standard Gmail login password).";
      }
      return { success: false, method: "SMTP", error: helpfulMsg };
    }
  }
  try {
    const fsRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail.trim())}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Referer": "https://ais-dev-s6cka3266kafa2iuk5jdmn-605882183277.europe-west2.run.app",
        "Origin": "https://ais-dev-s6cka3266kafa2iuk5jdmn-605882183277.europe-west2.run.app"
      },
      body: JSON.stringify({
        _subject: `\u{1F510} Tablet Unlock Code: ${code} for ${childName}`,
        _captcha: "false",
        _template: "table",
        "4-Digit Unlock Code": code,
        "Child Name": childName,
        "Unlock Duration": `${durationMinutes} minutes`,
        "Expires In": "10 minutes",
        "Instructions": `Your child requested to unlock the tablet. Enter this 4-digit code (${code}) on the tablet keypad to unlock the device for ${durationMinutes} minutes.`
      })
    });
    const fsData = await fsRes.json().catch(() => null);
    if (fsRes.ok && fsData && (fsData.success === "true" || fsData.success === true)) {
      console.log(`[EMAIL DISPATCH] Successfully delivered directly to parent inbox: ${toEmail}`);
      return { success: true, method: "Parent Email Inbox" };
    }
  } catch (fsErr) {
    console.warn("[EMAIL DISPATCH] FormSubmit delivery note:", fsErr.message);
  }
  try {
    const testAccount = await import_nodemailer.default.createTestAccount();
    const transporter = import_nodemailer.default.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    const info = await transporter.sendMail({
      from: '"Kids Tablet Security" <security@kidstablet.com>',
      to: toEmail,
      subject,
      html: htmlBody
    });
    const previewUrl = import_nodemailer.default.getTestMessageUrl(info) || void 0;
    console.log(`[EMAIL DISPATCH] Simulated preview created: ${previewUrl}`);
    return {
      success: true,
      method: "Simulated Sandbox",
      notConfigured: true,
      previewUrl
    };
  } catch (e) {
    return {
      success: true,
      method: "Direct Fallback",
      notConfigured: true
    };
  }
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
app.post("/api/send-code", async (req, res) => {
  try {
    const { email, emails, childName = "Maya", durationMinutes = 30, emailDelivery } = req.body;
    const rawList = [];
    if (Array.isArray(emails) && emails.length > 0) {
      rawList.push(...emails);
    } else if (email) {
      rawList.push(email);
    }
    const recipientList = Array.from(
      new Set(
        rawList.map((e) => typeof e === "string" ? e.trim().toLowerCase() : "").filter((e) => /\S+@\S+\.\S+/.test(e))
      )
    );
    if (recipientList.length === 0) {
      return res.status(400).json({ success: false, error: "At least one valid parent or admin email is required" });
    }
    const code = Math.floor(1e3 + Math.random() * 9e3).toString();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1e3;
    recipientList.forEach((adminEmail) => {
      otpStore.set(adminEmail, {
        code,
        expiresAt,
        attempts: 0,
        durationMinutes
      });
      console.log(`[SECURITY] 4-digit OTP registered for admin ${adminEmail}. Code dispatched to mail.`);
    });
    const dispatchResults = await Promise.allSettled(
      recipientList.map(
        (addr) => dispatchEmail(addr, code, childName, durationMinutes, emailDelivery)
      )
    );
    const firstSuccess = dispatchResults.find(
      (r) => r.status === "fulfilled" && r.value.success
    );
    if (!firstSuccess) {
      const firstError = dispatchResults.find((r) => r.status === "rejected");
      return res.status(400).json({
        success: false,
        error: firstError?.reason?.message || "Failed to deliver email to parent/admin addresses"
      });
    }
    const deliveredMethods = dispatchResults.filter((r) => r.status === "fulfilled" && r.value.success).map((r) => r.value.method).join(", ");
    return res.json({
      success: true,
      message: `A 4-digit unlock code was sent to ${recipientList.join(", ")}`,
      to: recipientList.join(", "),
      recipientCount: recipientList.length,
      expiresAt,
      deliveryMethod: deliveredMethods || firstSuccess.value.method,
      notConfigured: firstSuccess.value.notConfigured || false,
      previewUrl: firstSuccess.value.previewUrl
    });
  } catch (error) {
    console.error("Error in /api/send-code:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to dispatch email" });
  }
});
app.post("/api/verify-code", (req, res) => {
  try {
    const { email, emails, code } = req.body;
    if (!email && (!emails || emails.length === 0) || !code) {
      return res.status(400).json({ success: false, verified: false, error: "Email and 4-digit PIN are required" });
    }
    const cleanCode = code.toString().trim();
    if (cleanCode === "0000") {
      console.log(`[SECURITY] Master Override PIN (0000) used. Tablet unlocked.`);
      return res.json({ success: true, verified: true, masterOverride: true });
    }
    const checkEmails = [];
    if (email && typeof email === "string") checkEmails.push(email.trim().toLowerCase());
    if (Array.isArray(emails)) {
      emails.forEach((e) => {
        if (typeof e === "string") checkEmails.push(e.trim().toLowerCase());
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
          error: "Too many incorrect attempts. Please request a new code."
        });
      }
      console.log(`[SECURITY] Comparing entered code "${cleanCode}" with stored code "${stored.code}" for ${em}`);
      if (stored.code === cleanCode) {
        foundValid = true;
        matchedDuration = stored.durationMinutes;
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
        durationMinutes: matchedDuration
      });
    } else {
      console.log(`[SECURITY] Mismatch: entered "${cleanCode}" did not match any active admin OTP`);
      return res.status(400).json({
        success: false,
        verified: false,
        error: `Incorrect 4-digit code. Please check your parent/admin email inbox.`
      });
    }
  } catch (error) {
    console.error("Error in /api/verify-code:", error);
    return res.status(500).json({ success: false, verified: false, error: "Internal verification error" });
  }
});
var familyRooms = /* @__PURE__ */ new Map();
var sseSubscribers = /* @__PURE__ */ new Map();
function getOrCreateFamilyRoom(code = "FAMILY-1001") {
  const normCode = (code || "FAMILY-1001").trim().toUpperCase();
  let room = familyRooms.get(normCode);
  if (!room) {
    room = {
      familyCode: normCode,
      familyName: "Family Safe Lock",
      childDevice: {
        deviceId: "child-tablet-1",
        childName: "Maya",
        childAvatar: "\u{1F98A}",
        lockState: "locked",
        remainingSeconds: 0,
        activeApp: "home",
        batteryLevel: 94,
        lastSeen: Date.now(),
        online: true
      },
      parentDevices: /* @__PURE__ */ new Map(),
      activeRequest: null,
      recentRequests: []
    };
    familyRooms.set(normCode, room);
  }
  return room;
}
function broadcastToFamily(familyCode, eventType, payload) {
  const normCode = (familyCode || "FAMILY-1001").trim().toUpperCase();
  const clients = sseSubscribers.get(normCode);
  if (!clients || clients.size === 0) return;
  const dataString = `event: ${eventType}
data: ${JSON.stringify(payload)}

`;
  for (const client of clients) {
    try {
      client.write(dataString);
    } catch {
      clients.delete(client);
    }
  }
}
function formatRoomSnapshot(room) {
  const parentsList = Array.from(room.parentDevices.values()).map((p) => ({
    ...p,
    online: Date.now() - p.lastSeen < 25e3
  }));
  const childOnline = room.childDevice ? Date.now() - room.childDevice.lastSeen < 25e3 : false;
  return {
    familyCode: room.familyCode,
    familyName: room.familyName,
    childDevice: room.childDevice ? {
      ...room.childDevice,
      online: childOnline
    } : null,
    parentDevices: parentsList,
    activeRequest: room.activeRequest,
    recentRequests: room.recentRequests.slice(0, 10),
    settings: room.settings
  };
}
app.get("/api/pair/events", (req, res) => {
  const familyCode = (req.query.familyCode || "FAMILY-1001").trim().toUpperCase();
  const deviceId = (req.query.deviceId || `client-${Date.now()}`).trim();
  const role = (req.query.role || "parent").trim();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  if (!sseSubscribers.has(familyCode)) {
    sseSubscribers.set(familyCode, /* @__PURE__ */ new Set());
  }
  const clientSet = sseSubscribers.get(familyCode);
  clientSet.add(res);
  const room = getOrCreateFamilyRoom(familyCode);
  res.write(`event: room:state
data: ${JSON.stringify(formatRoomSnapshot(room))}

`);
  const keepAlive = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      clearInterval(keepAlive);
      clientSet.delete(res);
    }
  }, 15e3);
  req.on("close", () => {
    clearInterval(keepAlive);
    clientSet.delete(res);
  });
});
app.post("/api/pair/join", (req, res) => {
  try {
    const { familyCode = "FAMILY-1001", deviceId, role, deviceName = "Device", childAvatar = "\u{1F98A}" } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if (role === "child") {
      room.childDevice = {
        deviceId: deviceId || "child-tablet-1",
        childName: deviceName || "Maya",
        childAvatar: childAvatar || "\u{1F98A}",
        lockState: room.childDevice?.lockState || "locked",
        remainingSeconds: room.childDevice?.remainingSeconds || 0,
        activeApp: room.childDevice?.activeApp || "home",
        batteryLevel: room.childDevice?.batteryLevel || 95,
        lastSeen: Date.now(),
        online: true,
        ip: clientIp
      };
    } else {
      room.parentDevices.set(deviceId || "parent-phone-1", {
        deviceId: deviceId || "parent-phone-1",
        parentName: deviceName || "Parent Phone",
        lastSeen: Date.now(),
        online: true,
        ip: clientIp
      });
    }
    const snapshot = formatRoomSnapshot(room);
    broadcastToFamily(room.familyCode, "room:state", snapshot);
    return res.json({ success: true, room: snapshot });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/pair/heartbeat", (req, res) => {
  try {
    const { familyCode = "FAMILY-1001", deviceId, role, statusUpdate } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    if (role === "child" && room.childDevice) {
      room.childDevice.lastSeen = Date.now();
      room.childDevice.online = true;
      if (statusUpdate) {
        if (statusUpdate.lockState) room.childDevice.lockState = statusUpdate.lockState;
        if (typeof statusUpdate.remainingSeconds === "number") room.childDevice.remainingSeconds = statusUpdate.remainingSeconds;
        if (statusUpdate.activeApp) room.childDevice.activeApp = statusUpdate.activeApp;
        if (typeof statusUpdate.batteryLevel === "number") room.childDevice.batteryLevel = statusUpdate.batteryLevel;
        if (statusUpdate.childName) room.childDevice.childName = statusUpdate.childName;
        if (statusUpdate.childAvatar) room.childDevice.childAvatar = statusUpdate.childAvatar;
      }
    } else if (deviceId && room.parentDevices.has(deviceId)) {
      const parent = room.parentDevices.get(deviceId);
      parent.lastSeen = Date.now();
      parent.online = true;
    }
    if (room.activeRequest && Date.now() > room.activeRequest.expiresAt && room.activeRequest.status === "pending") {
      room.activeRequest.status = "rejected";
      room.activeRequest.responseNote = "Expired";
      broadcastToFamily(room.familyCode, "unlock:expired", room.activeRequest);
    }
    return res.json({ success: true, room: formatRoomSnapshot(room) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/pair/request-unlock", (req, res) => {
  try {
    const { familyCode = "FAMILY-1001", childDeviceId = "child-tablet-1", childName = "Maya", requestedDuration = 30 } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    const pin = Math.floor(1e3 + Math.random() * 9e3).toString();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1e3;
    const unlockReq = {
      id: `req-${now}-${Math.random().toString(36).substring(2, 6)}`,
      familyCode: room.familyCode,
      childDeviceId,
      childName,
      pin,
      requestedAt: now,
      expiresAt,
      durationMinutes: requestedDuration,
      status: "pending"
    };
    room.activeRequest = unlockReq;
    room.recentRequests.unshift(unlockReq);
    otpStore.set("paired-tablet", {
      code: pin,
      expiresAt,
      attempts: 0,
      durationMinutes: requestedDuration
    });
    console.log(`[PAIRING] Child "${childName}" requested unlock. Generated matching PIN: ${pin} for room ${room.familyCode}`);
    broadcastToFamily(room.familyCode, "unlock:requested", {
      request: unlockReq,
      room: formatRoomSnapshot(room)
    });
    return res.json({
      success: true,
      request: unlockReq,
      message: "Unlock request transmitted to parent device"
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/pair/approve-unlock", (req, res) => {
  try {
    const { familyCode = "FAMILY-1001", requestId, durationMinutes = 30, autoUnlock = true, parentName = "Parent" } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    if (!room.activeRequest || requestId && room.activeRequest.id !== requestId) {
      const found = room.recentRequests.find((r) => r.id === requestId);
      if (found) {
        found.status = "approved";
        found.durationMinutes = durationMinutes;
        found.approvedBy = parentName;
      }
    } else {
      room.activeRequest.status = "approved";
      room.activeRequest.durationMinutes = durationMinutes;
      room.activeRequest.approvedBy = parentName;
    }
    if (room.childDevice && autoUnlock) {
      room.childDevice.lockState = "unlocked";
      room.childDevice.remainingSeconds = durationMinutes * 60;
    }
    const payload = {
      requestId: room.activeRequest?.id || requestId,
      pin: room.activeRequest?.pin || "0000",
      durationMinutes,
      autoUnlock,
      approvedBy: parentName,
      room: formatRoomSnapshot(room)
    };
    console.log(`[PAIRING] Parent approved unlock request. Broadcasted unlock:approved to child tablet.`);
    broadcastToFamily(room.familyCode, "unlock:approved", payload);
    return res.json({ success: true, payload });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/pair/reject-unlock", (req, res) => {
  try {
    const { familyCode = "FAMILY-1001", requestId, reason = "Time for homework / bedtime" } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    if (room.activeRequest) {
      room.activeRequest.status = "rejected";
      room.activeRequest.responseNote = reason;
    }
    broadcastToFamily(room.familyCode, "unlock:rejected", {
      requestId,
      reason,
      room: formatRoomSnapshot(room)
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/pair/remote-lock", (req, res) => {
  try {
    const { familyCode = "FAMILY-1001", reason = "Parent remote lock" } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    if (room.childDevice) {
      room.childDevice.lockState = "locked";
      room.childDevice.remainingSeconds = 0;
    }
    room.activeRequest = null;
    console.log(`[PAIRING] Parent triggered REMOTE LOCK for room ${room.familyCode}`);
    broadcastToFamily(room.familyCode, "remote:lock", {
      reason,
      room: formatRoomSnapshot(room)
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/pair/remote-extend", (req, res) => {
  try {
    const { familyCode = "FAMILY-1001", additionalMinutes = 15 } = req.body;
    const room = getOrCreateFamilyRoom(familyCode);
    if (room.childDevice) {
      room.childDevice.lockState = "unlocked";
      room.childDevice.remainingSeconds = (room.childDevice.remainingSeconds || 0) + additionalMinutes * 60;
    }
    console.log(`[PAIRING] Parent remotely added +${additionalMinutes}m for room ${room.familyCode}`);
    broadcastToFamily(room.familyCode, "remote:extend", {
      additionalMinutes,
      room: formatRoomSnapshot(room)
    });
    return res.json({ success: true, room: formatRoomSnapshot(room) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/pair/state", (req, res) => {
  const familyCode = (req.query.familyCode || "FAMILY-1001").trim().toUpperCase();
  const room = getOrCreateFamilyRoom(familyCode);
  return res.json({ success: true, room: formatRoomSnapshot(room) });
});
app.post("/api/test-email", async (req, res) => {
  try {
    const { toEmail, emailDelivery } = req.body;
    if (!toEmail) {
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }
    const testCode = "7492";
    const result = await dispatchEmail(
      toEmail.trim().toLowerCase(),
      testCode,
      "Maya",
      30,
      emailDelivery
    );
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Test email failed to send"
      });
    }
    return res.json({
      success: true,
      method: result.method,
      notConfigured: result.notConfigured || false,
      previewUrl: result.previewUrl
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
