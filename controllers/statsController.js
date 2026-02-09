const { getMessagesRef } = require("../config/firebase");

/**
 * Get overall message statistics
 */
exports.getStats = async (req, res) => {
  try {
    const messagesRef = getMessagesRef();
    const snapshot = await messagesRef.once("value");

    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      sent: 0,
      error: 0,
      byDate: {},
      bySource: {},
    };

    if (!snapshot.exists()) {
      return res.json({
        success: true,
        data: stats,
      });
    }

    snapshot.forEach((child) => {
      const msg = child.val();
      stats.total++;

      // Count by status
      if (msg.status) {
        stats[msg.status] = (stats[msg.status] || 0) + 1;
      }

      // Count by date
      if (msg.createdAt) {
        const date = new Date(msg.createdAt).toISOString().split("T")[0];
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
      }

      // Count by source
      const source = msg.source || "unknown";
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get statistics",
    });
  }
};

/**
 * Get recent messages statistics (last 24 hours)
 */
exports.getRecentStats = async (req, res) => {
  try {
    const messagesRef = getMessagesRef();
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;

    const snapshot = await messagesRef
      .orderByChild("createdAt")
      .startAt(last24Hours)
      .once("value");

    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      sent: 0,
      error: 0,
      hourly: {},
    };

    if (!snapshot.exists()) {
      return res.json({
        success: true,
        data: stats,
        timeframe: "Last 24 hours",
      });
    }

    snapshot.forEach((child) => {
      const msg = child.val();
      stats.total++;

      // Count by status
      if (msg.status) {
        stats[msg.status] = (stats[msg.status] || 0) + 1;
      }

      // Count by hour
      if (msg.createdAt) {
        const hour = new Date(msg.createdAt).getHours();
        stats.hourly[hour] = (stats.hourly[hour] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats,
      timeframe: "Last 24 hours",
    });
  } catch (error) {
    console.error("Error getting recent stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get recent statistics",
    });
  }
};
