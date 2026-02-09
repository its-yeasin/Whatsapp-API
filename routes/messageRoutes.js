const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const messageController = require("../controllers/messageController");
const { authenticateApiKey } = require("../middleware/auth");

// Apply API key authentication if API_KEY is set in .env
if (process.env.API_KEY) {
  router.use(authenticateApiKey);
}

/**
 * @route   POST /api/messages/send
 * @desc    Send a single WhatsApp message
 * @access  Public (or Protected with API key)
 */
router.post(
  "/send",
  [
    body("phoneNumber")
      .notEmpty()
      .withMessage("Phone number is required")
      .isString()
      .withMessage("Phone number must be a string")
      .matches(/^[\+]?[0-9]{10,15}$/)
      .withMessage("Invalid phone number format. Include country code."),
    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isString()
      .withMessage("Message must be a string")
      .isLength({ min: 1, max: 4096 })
      .withMessage("Message must be between 1 and 4096 characters"),
  ],
  messageController.sendMessage,
);

/**
 * @route   POST /api/messages/send-bulk
 * @desc    Send multiple WhatsApp messages
 * @access  Public (or Protected with API key)
 */
router.post(
  "/send-bulk",
  [
    body("messages")
      .isArray({ min: 1, max: 100 })
      .withMessage("Messages must be an array with 1-100 items"),
    body("messages.*.phoneNumber")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[\+]?[0-9]{10,15}$/)
      .withMessage("Invalid phone number format"),
    body("messages.*.message")
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 1, max: 4096 })
      .withMessage("Message must be between 1 and 4096 characters"),
  ],
  messageController.sendBulkMessages,
);

/**
 * @route   GET /api/messages/:messageId
 * @desc    Get status of a specific message
 * @access  Public (or Protected with API key)
 */
router.get("/:messageId", messageController.getMessageStatus);

/**
 * @route   GET /api/messages
 * @desc    Get all messages with optional filters
 * @access  Public (or Protected with API key)
 */
router.get("/", messageController.getAllMessages);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a specific message
 * @access  Public (or Protected with API key)
 */
router.delete("/:messageId", messageController.deleteMessage);

/**
 * @route   POST /api/messages/cleanup
 * @desc    Clean up old messages
 * @access  Public (or Protected with API key)
 */
router.post(
  "/cleanup",
  [
    body("daysOld")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("daysOld must be between 1 and 365"),
  ],
  messageController.cleanupOldMessages,
);

module.exports = router;
