/**
 * Server-Sent Events (SSE) Manager — EduCore School Platform
 *
 * Provides SSE-based realtime event delivery scoped per school (tenant).
 *
 * Features:
 * - HTTP-based streaming (works through proxies/firewalls)
 * - Automatic reconnection support via Last-Event-ID
 * - JWT-authenticated connections
 * - School-scoped (multi-tenant) event delivery
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { eventBus } = require("./EventEmitter");

class SSEManager {
  constructor() {
    this.clients = new Map(); // clientId -> { res, schoolId, userId, metadata }
    this.schoolClients = new Map(); // schoolId -> Set of clientIds

    this.eventHistory = new Map(); // schoolId -> Array of events
    this.maxHistoryPerSchool = 100;

    this.heartbeatInterval = 15000;
    this.heartbeatTimers = new Map();

    this.allowedOrigins = this.buildAllowedOrigins();

    this.schoolEventListener = this.handleSchoolEvent.bind(this);
  }

  buildAllowedOrigins() {
    const defaults = [
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    const fromEnv = String(process.env.CORS_ORIGINS || process.env.CORS_ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    return new Set([...defaults, ...fromEnv]);
  }

  isAllowedOrigin(origin = "") {
    const normalized = String(origin || "").trim();
    if (!normalized) return false;
    return this.allowedOrigins.has(normalized);
  }

  getEventUserId(payload = {}) {
    return (
      payload?.data?.userId ||
      payload?.userId ||
      payload?.metadata?.userId ||
      null
    );
  }

  handleSchoolEvent(schoolId, payload) {
    const normalizedSchoolId = schoolId?.toString
      ? schoolId.toString()
      : String(schoolId);

    const clientIds = this.schoolClients.get(normalizedSchoolId);
    if (!clientIds || clientIds.size === 0) return;

    const eventId =
      payload?.id || `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    this.storeEvent(normalizedSchoolId, eventId, "event", payload);

    clientIds.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (!client) return;
      this.sendEvent(client.res, "event", payload, eventId);
    });
  }

  createRouter() {
    const express = require("express");
    const router = express.Router();
    router.get("/events", this.handleConnection.bind(this));
    router.get("/stats", (req, res) => res.json(this.getStats()));
    return router;
  }

  handleConnection(req, res) {
    const cookieHeader = req.headers.cookie || "";
    const cookies = this.parseCookies(cookieHeader);

    const token =
      cookies.token ||
      req.query.token ||
      req.headers["authorization"]?.replace("Bearer ", "");

    const requestOrigin = req.headers.origin || "";
    if (requestOrigin && !this.isAllowedOrigin(requestOrigin)) {
      return res.status(403).json({ error: "Forbidden origin" });
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const clientId = this.generateClientId();
    // Support both old decoded.id (userId) and new format; schoolId from decoded.schoolId or populated user
    const userId = decoded.id || decoded.userId;
    const schoolId = decoded.schoolId || decoded.school;

    if (!schoolId) {
      return res.status(403).json({ error: "No school context in token" });
    }

    const normalizedSchoolId = schoolId?.toString
      ? schoolId.toString()
      : String(schoolId);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...(requestOrigin && this.isAllowedOrigin(requestOrigin)
        ? { "Access-Control-Allow-Origin": requestOrigin }
        : {}),
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Cache-Control",
      Vary: "Origin",
      "X-Accel-Buffering": "no",
    });

    this.clients.set(clientId, {
      res,
      schoolId: normalizedSchoolId,
      userId,
      tokenData: decoded,
      connectedAt: Date.now(),
      lastEventId: req.headers["last-event-id"] || null,
      metadata: { ip: req.ip, userAgent: req.get("User-Agent") },
    });

    if (!this.schoolClients.has(normalizedSchoolId)) {
      this.schoolClients.set(normalizedSchoolId, new Set());
    }
    this.schoolClients.get(normalizedSchoolId).add(clientId);

    eventBus.registerClient(clientId, normalizedSchoolId, {
      emit: (event, data) => this.sendToClient(clientId, event, data),
    });

    console.log(
      `[SSEManager] Client connected: ${clientId} (School: ${normalizedSchoolId}, Total: ${this.schoolClients.get(normalizedSchoolId).size})`
    );

    this.sendEvent(res, "connected", {
      clientId,
      message: "Connected to EduCore realtime updates",
      timestamp: Date.now(),
    });

    const lastEventId = req.headers["last-event-id"];
    if (lastEventId) {
      this.replayEvents(clientId, normalizedSchoolId, lastEventId);
    }

    this.startClientHeartbeat(clientId);

    req.on("close", () => this.handleDisconnect(clientId));
    req.on("error", (error) => this.handleError(clientId, error));
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      this.stopClientHeartbeat(clientId);

      const schoolClients = this.schoolClients.get(client.schoolId);
      if (schoolClients) {
        schoolClients.delete(clientId);
        if (schoolClients.size === 0) {
          this.schoolClients.delete(client.schoolId);
        }
      }

      eventBus.unregisterClient(clientId);
      this.clients.delete(clientId);
      console.log(`[SSEManager] Client disconnected: ${clientId}`);
    }
  }

  handleError(clientId, error) {
    console.error(`[SSEManager] Client ${clientId} error:`, error.message);
    this.handleDisconnect(clientId);
  }

  parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      const name = parts[0]?.trim();
      const value = parts.slice(1).join("=").trim();
      if (name) cookies[name] = decodeURIComponent(value);
    });
    return cookies;
  }

  sendEvent(res, eventType, data, eventId = null) {
    if (!res.writable) return false;
    try {
      const id = eventId || `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      res.write(`id: ${id}\nevent: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch (error) {
      console.error("[SSEManager] Error sending event:", error);
      return false;
    }
  }

  sendToClient(clientId, eventType, data) {
    const client = this.clients.get(clientId);
    if (!client) return false;
    const eventId = data?.id || `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.storeEvent(client.schoolId, eventId, eventType, data);
    return this.sendEvent(client.res, eventType, data, eventId);
  }

  broadcastToSchool(schoolId, eventType, data) {
    const normalizedSchoolId = schoolId?.toString
      ? schoolId.toString()
      : String(schoolId);

    const clientIds = this.schoolClients.get(normalizedSchoolId);
    if (!clientIds || clientIds.size === 0) return 0;

    const eventId = data?.id || `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.storeEvent(normalizedSchoolId, eventId, eventType, data);

    let sentCount = 0;
    clientIds.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && this.sendEvent(client.res, eventType, data, eventId)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  storeEvent(schoolId, eventId, eventType, data) {
    if (!this.eventHistory.has(schoolId)) {
      this.eventHistory.set(schoolId, []);
    }
    const history = this.eventHistory.get(schoolId);
    history.push({ id: eventId, type: eventType, data, timestamp: Date.now() });
    if (history.length > this.maxHistoryPerSchool) {
      history.splice(0, history.length - this.maxHistoryPerSchool);
    }
  }

  replayEvents(clientId, schoolId, lastEventId) {
    const history = this.eventHistory.get(schoolId);
    if (!history || history.length === 0) return;

    const client = this.clients.get(clientId);
    if (!client) return;

    const lastIndex = history.findIndex((e) => e.id === lastEventId);
    if (lastIndex === -1) {
      this.sendEvent(client.res, "replay_failed", {
        message: "Too many missed events, full refresh recommended",
      });
      return;
    }

    const missedEvents = history.slice(lastIndex + 1);
    missedEvents.forEach((event) => {
      this.sendEvent(client.res, event.type, event.data, event.id);
    });
    this.sendEvent(client.res, "replay_complete", { replayedCount: missedEvents.length });
  }

  startClientHeartbeat(clientId) {
    const timer = setInterval(() => {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          if (client.res.writable) {
            client.res.write(`: heartbeat ${Date.now()}\n\n`);
          } else {
            this.handleDisconnect(clientId);
          }
        } catch {
          this.handleDisconnect(clientId);
        }
      } else {
        this.stopClientHeartbeat(clientId);
      }
    }, this.heartbeatInterval);
    this.heartbeatTimers.set(clientId, timer);
  }

  stopClientHeartbeat(clientId) {
    const timer = this.heartbeatTimers.get(clientId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(clientId);
    }
  }

  generateClientId() {
    return `sse_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      schoolCount: this.schoolClients.size,
      clientsBySchool: Object.fromEntries(
        Array.from(this.schoolClients.entries()).map(([id, set]) => [id, set.size])
      ),
      eventHistorySize: Object.fromEntries(
        Array.from(this.eventHistory.entries()).map(([id, arr]) => [id, arr.length])
      ),
    };
  }

  initialize() {
    eventBus.off("school_event", this.schoolEventListener);
    eventBus.on("school_event", this.schoolEventListener);
    console.log("[SSEManager] Initialized (school-scoped)");
    return this;
  }

  shutdown() {
    eventBus.off("school_event", this.schoolEventListener);

    this.heartbeatTimers.forEach((timer) => clearInterval(timer));
    this.heartbeatTimers.clear();

    this.clients.forEach((client) => {
      try {
        this.sendEvent(client.res, "shutdown", {
          message: "Server shutting down",
          reconnectIn: 5000,
        });
        client.res.end();
      } catch {
        // ignore
      }
    });

    this.clients.clear();
    this.schoolClients.clear();
    console.log("[SSEManager] Shutdown complete");
  }
}

const sseManager = new SSEManager();

module.exports = { SSEManager, sseManager };
