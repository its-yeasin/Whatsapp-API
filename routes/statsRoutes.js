const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const { authenticateApiKey } = require("../middleware/auth");

// Apply API key authentication if API_KEY is set in .env
if (process.env.API_KEY) {
  router.use(authenticateApiKey);
}

/**
 * @route   GET /api/stats
 * @desc    Get message statistics
 * @access  Public (or Protected with API key)
 */
router.get("/", statsController.getStats);

/**
 * @route   GET /api/stats/recent
 * @desc    Get recent messages statistics
 * @access  Public (or Protected with API key)
 */
router.get("/recent", statsController.getRecentStats);

module.exports = router;
