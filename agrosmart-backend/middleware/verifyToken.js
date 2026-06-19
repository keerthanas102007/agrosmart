// This file re-exports authMiddleware for backward compatibility
// All routes use authMiddleware.js directly
const verifyToken = require("./authMiddleware");
module.exports = verifyToken;
