/**
 * Central Event Emitter System — EduCore School Platform
 *
 * Provides a centralized event bus for school domain events.
 * Handles event delivery via SSE to connected clients.
 *
 * Features:
 * - Event payload schemas with versioning
 * - Idempotency handling via event IDs
 * - Retry logic with exponential backoff
 * - Event ordering per school
 * - HMAC signature for security
 */

const EventEmitter = require("events");
const crypto = require("crypto");

const EventTypes = {
  // Attendance events
  ATTENDANCE_MARKED: "attendance.marked",
  STUDENT_ABSENT: "student.absent",
  ATTENDANCE_SUMMARY_READY: "attendance.summary_ready",

  // Result / exam events
  RESULTS_RELEASED: "results.released",
  REPORT_CARD_READY: "report_card.ready",
  EXAM_PUBLISHED: "exam.published",
  SCORES_ENTERED: "scores.entered",
  RESULTS_COMPUTED: "results.computed",

  // Payment events
  PAYMENT_RECEIVED: "payment.received",
  FEE_DEFAULTER_ALERT: "fee.defaulter_alert",
  PAYSTACK_PAYMENT_VERIFIED: "payment.paystack_verified",

  // AI events
  AI_LESSON_GENERATED: "ai.lesson_generated",
  AI_QUESTIONS_GENERATED: "ai.questions_generated",
  AI_TIMETABLE_GENERATED: "ai.timetable_generated",
  AI_GRADING_COMPLETE: "ai.grading_complete",

  // Communication events
  ANNOUNCEMENT_CREATED: "announcement.created",
  SMS_SENT: "sms.sent",
  WHATSAPP_SENT: "whatsapp.sent",

  // Sync events
  SYNC_COMPLETED: "sync.completed",
  SYNC_CONFLICT: "sync.conflict",

  // Auth events
  SESSION_EXPIRED: "auth.session_expired",
  USER_LOGGED_OUT: "auth.user_logged_out",
  USER_INVITED: "auth.user_invited",
  ACCOUNT_DEACTIVATED: "auth.account_deactivated",

  // School management events
  SCHOOL_SETTINGS_UPDATED: "school.settings_updated",
  STUDENT_ENROLLED: "student.enrolled",
  STUDENT_PROMOTED: "student.promoted",
  TEACHER_ASSIGNED: "teacher.assigned",
  CLASS_UPDATED: "class.updated",

  // Library events
  BOOK_BORROWED: "library.book_borrowed",
  BOOK_RETURNED: "library.book_returned",
  BOOK_OVERDUE: "library.book_overdue",

  // Behavior events
  BEHAVIOR_LOGGED: "behavior.logged",
  PARENT_NOTIFIED: "parent.notified",

  // Dashboard / stats
  STATS_UPDATED: "dashboard.stats_updated",
  ACTIVITY_LOGGED: "activity.logged",
};

const SCHEMA_VERSION = "2.0.0";

const generateEventId = () =>
  `evt_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

const generateSignature = (payload, secret) => {
  const hmac = crypto.createHmac(
    "sha256",
    secret || process.env.EVENT_SECRET || "default-secret"
  );
  hmac.update(JSON.stringify(payload));
  return hmac.digest("hex");
};

const verifySignature = (payload, signature, secret) => {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

const createEventPayload = (eventType, data, metadata = {}) => {
  const timestamp = Date.now();
  const eventId = generateEventId();

  const payload = {
    id: eventId,
    type: eventType,
    version: SCHEMA_VERSION,
    timestamp,
    data,
    metadata: {
      ...metadata,
      source: metadata.source || "educore-api",
      environment: process.env.NODE_ENV || "development",
    },
  };

  payload.signature = generateSignature(payload, process.env.EVENT_SECRET);
  return payload;
};

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);

    this.processedEvents = new Map();
    this.maxEventHistory = 1000;

    this.pendingRetries = new Map();
    this.sequenceNumbers = new Map();
    this.connectedClients = new Map();

    this.eventBatches = new Map();
    this.batchInterval = 100;
    this.batchSize = 10;

    this.semanticEvents = new Map();
    this.semanticDedupeWindowMs = 2000;
  }

  shouldSkipSemanticDuplicate(eventType, schoolId, data, metadata = {}) {
    const source = String(metadata?.source || "");
    if (!source) return false;

    const supportsCrossSourceDedupe =
      source === "event_middleware" || source === "change_stream";
    if (!supportsCrossSourceDedupe) return false;

    const primaryId =
      metadata?.dedupeKey ||
      (data?._id ? `${eventType}:${String(data._id)}` : "");

    if (!primaryId) return false;

    const semanticKey = `${schoolId}:${primaryId}`;
    const now = Date.now();
    const seen = this.semanticEvents.get(semanticKey);

    if (
      seen &&
      seen.source !== source &&
      now - seen.timestamp <= this.semanticDedupeWindowMs
    ) {
      return true;
    }

    this.semanticEvents.set(semanticKey, { source, timestamp: now });

    if (this.semanticEvents.size > this.maxEventHistory) {
      const entries = Array.from(this.semanticEvents.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries
        .slice(0, entries.length - this.maxEventHistory)
        .forEach(([key]) => this.semanticEvents.delete(key));
    }

    return false;
  }

  getNextSequence(schoolId) {
    const current = this.sequenceNumbers.get(schoolId) || 0;
    const next = current + 1;
    this.sequenceNumbers.set(schoolId, next);
    return next;
  }

  isEventProcessed(eventId) {
    return this.processedEvents.has(eventId);
  }

  markEventProcessed(eventId) {
    this.processedEvents.set(eventId, Date.now());
    if (this.processedEvents.size > this.maxEventHistory) {
      const entries = Array.from(this.processedEvents.entries());
      entries.sort((a, b) => a[1] - b[1]);
      entries
        .slice(0, entries.length - this.maxEventHistory)
        .forEach(([id]) => this.processedEvents.delete(id));
    }
  }

  emitSchoolEvent(eventType, schoolId, data, metadata = {}) {
    const normalizedSchoolId = schoolId?.toString
      ? schoolId.toString()
      : String(schoolId);

    if (
      this.shouldSkipSemanticDuplicate(
        eventType,
        normalizedSchoolId,
        data,
        metadata
      )
    ) {
      return null;
    }

    const sequence = this.getNextSequence(normalizedSchoolId);
    const enrichedMetadata = { ...metadata, schoolId: normalizedSchoolId, sequence };
    const payload = createEventPayload(eventType, data, enrichedMetadata);

    if (this.isEventProcessed(payload.id)) {
      return null;
    }

    this.markEventProcessed(payload.id);
    this.addToBatch(normalizedSchoolId, payload);
    return payload;
  }

  // Alias for backwards-compatible callers during migration
  emitBusinessEvent(eventType, schoolId, data, metadata = {}) {
    return this.emitSchoolEvent(eventType, schoolId, data, metadata);
  }

  addToBatch(schoolId, payload) {
    if (!this.eventBatches.has(schoolId)) {
      this.eventBatches.set(schoolId, []);
      setTimeout(() => this.flushBatch(schoolId), this.batchInterval);
    }

    const batch = this.eventBatches.get(schoolId);
    batch.push(payload);

    if (batch.length >= this.batchSize) {
      this.flushBatch(schoolId);
    }
  }

  flushBatch(schoolId) {
    const batch = this.eventBatches.get(schoolId);
    if (!batch || batch.length === 0) return;

    const coalesced = this.coalesceEvents(batch);
    coalesced.forEach((payload) => {
      this.emit("school_event", schoolId, payload);
      this.emit(payload.type, schoolId, payload);
    });

    this.eventBatches.delete(schoolId);
  }

  coalesceEvents(events) {
    const coalesced = new Map();
    events.forEach((event) => {
      if (event.type === EventTypes.STATS_UPDATED) {
        coalesced.set(`${event.type}:${event.metadata?.schoolId}`, event);
      } else if (event.type === EventTypes.ATTENDANCE_MARKED) {
        coalesced.set(`${event.type}:${event.data?.classId}`, event);
      } else {
        coalesced.set(event.id, event);
      }
    });
    return Array.from(coalesced.values());
  }

  registerClient(clientId, schoolId, socket) {
    this.connectedClients.set(clientId, {
      schoolId,
      socket,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
    });
  }

  unregisterClient(clientId) {
    this.connectedClients.delete(clientId);
  }

  getSchoolClients(schoolId) {
    return Array.from(this.connectedClients.entries())
      .filter(([, client]) => client.schoolId === schoolId)
      .map(([id, client]) => ({ id, ...client }));
  }

  // Backwards-compatible alias
  getBusinessClients(schoolId) {
    return this.getSchoolClients(schoolId);
  }

  scheduleRetry(eventId, schoolId, payload, attempt = 1) {
    const maxAttempts = 5;
    const baseDelay = 1000;

    if (attempt > maxAttempts) {
      this.pendingRetries.delete(eventId);
      return;
    }

    const delay = baseDelay * Math.pow(2, attempt - 1);
    const timeoutId = setTimeout(() => {
      this.emitToClients(schoolId, payload);
      this.pendingRetries.delete(eventId);
    }, delay);

    this.pendingRetries.set(eventId, { timeoutId, attempt, schoolId, payload });
  }

  cancelRetry(eventId) {
    const retry = this.pendingRetries.get(eventId);
    if (retry) {
      clearTimeout(retry.timeoutId);
      this.pendingRetries.delete(eventId);
    }
  }

  emitToClients(schoolId, payload) {
    const clients = this.getSchoolClients(schoolId);
    clients.forEach((client) => {
      try {
        if (client.socket && typeof client.socket.emit === "function") {
          client.socket.emit("event", payload);
        }
      } catch (error) {
        console.error(`[EventBus] Error sending to client ${client.id}:`, error);
      }
    });
  }
}

const eventBus = new EventBus();

module.exports = {
  eventBus,
  EventTypes,
  createEventPayload,
  generateSignature,
  verifySignature,
  SCHEMA_VERSION,
};
