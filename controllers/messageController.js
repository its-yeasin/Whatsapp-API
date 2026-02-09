const { validationResult } = require("express-validator");
const { getMessagesRef } = require("../config/firebase");

/**
 * Send a single WhatsApp message
 */
exports.sendMessage = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { phoneNumber, message } = req.body;

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Create message in Firebase
    const messagesRef = getMessagesRef();
    const newMessageRef = messagesRef.push();

    const messageData = {
      phoneNumber: cleanPhone.startsWith("+") ? cleanPhone : "+" + cleanPhone,
      message: message,
      status: "pending",
      createdAt: Date.now(),
      source: "api",
    };

    await newMessageRef.set(messageData);

    // Listen for status updates (optional - for immediate feedback)
    const statusPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        newMessageRef.off("value");
        resolve({ status: "queued", timeout: true });
      }, 5000);

      newMessageRef.on("value", (snapshot) => {
        const data = snapshot.val();
        if (data && data.status !== "pending") {
          clearTimeout(timeout);
          newMessageRef.off("value");
          resolve(data);
        }
      });
    });

    res.status(201).json({
      success: true,
      message: "Message queued successfully",
      data: {
        messageId: newMessageRef.key,
        phoneNumber: messageData.phoneNumber,
        status: "pending",
        createdAt: messageData.createdAt,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send message",
    });
  }
};

/**
 * Send bulk WhatsApp messages
 */
exports.sendBulkMessages = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { messages } = req.body;
    const messagesRef = getMessagesRef();
    const results = [];

    // Process each message
    for (const msg of messages) {
      const cleanPhone = msg.phoneNumber.replace(/\D/g, "");
      const newMessageRef = messagesRef.push();

      const messageData = {
        phoneNumber: cleanPhone.startsWith("+") ? cleanPhone : "+" + cleanPhone,
        message: msg.message,
        status: "pending",
        createdAt: Date.now(),
        source: "api-bulk",
      };

      await newMessageRef.set(messageData);

      results.push({
        messageId: newMessageRef.key,
        phoneNumber: messageData.phoneNumber,
        status: "queued",
      });
    }

    res.status(201).json({
      success: true,
      message: `${results.length} messages queued successfully`,
      data: {
        total: results.length,
        messages: results,
      },
    });
  } catch (error) {
    console.error("Error sending bulk messages:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send bulk messages",
    });
  }
};

/**
 * Get message status
 */
exports.getMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const messagesRef = getMessagesRef();
    const snapshot = await messagesRef.child(messageId).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    const data = snapshot.val();
    res.json({
      success: true,
      data: {
        messageId: messageId,
        ...data,
      },
    });
  } catch (error) {
    console.error("Error getting message status:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get message status",
    });
  }
};

/**
 * Get all messages with optional filters
 */
exports.getAllMessages = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const messagesRef = getMessagesRef();

    let query = messagesRef
      .orderByChild("createdAt")
      .limitToLast(parseInt(limit));
    const snapshot = await query.once("value");

    if (!snapshot.exists()) {
      return res.json({
        success: true,
        data: {
          total: 0,
          messages: [],
        },
      });
    }

    let messages = [];
    snapshot.forEach((child) => {
      const msg = child.val();
      if (!status || msg.status === status) {
        messages.push({
          messageId: child.key,
          ...msg,
        });
      }
    });

    // Sort by createdAt descending (most recent first)
    messages.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      data: {
        total: messages.length,
        messages: messages,
      },
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get messages",
    });
  }
};

/**
 * Delete a message
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const messagesRef = getMessagesRef();
    const snapshot = await messagesRef.child(messageId).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    await messagesRef.child(messageId).remove();

    res.json({
      success: true,
      message: "Message deleted successfully",
      data: {
        messageId: messageId,
      },
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete message",
    });
  }
};

/**
 * Clean up old messages
 */
exports.cleanupOldMessages = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { daysOld = 7 } = req.body;
    const messagesRef = getMessagesRef();
    const snapshot = await messagesRef.once("value");

    if (!snapshot.exists()) {
      return res.json({
        success: true,
        message: "No messages to clean up",
        data: { deletedCount: 0 },
      });
    }

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    const deletePromises = [];
    snapshot.forEach((child) => {
      const msg = child.val();
      if (
        msg.createdAt < cutoffTime &&
        (msg.status === "sent" || msg.status === "error")
      ) {
        deletePromises.push(messagesRef.child(child.key).remove());
        deletedCount++;
      }
    });

    await Promise.all(deletePromises);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old messages`,
      data: {
        deletedCount: deletedCount,
        daysOld: daysOld,
      },
    });
  } catch (error) {
    console.error("Error cleaning up messages:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to clean up messages",
    });
  }
};
