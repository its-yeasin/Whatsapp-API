/**
 * API Key Authentication Middleware
 * Checks for API key in headers or query parameters
 */
exports.authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error:
        "API key is required. Provide it in X-API-Key header or apiKey query parameter.",
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: "Invalid API key",
    });
  }

  next();
};
