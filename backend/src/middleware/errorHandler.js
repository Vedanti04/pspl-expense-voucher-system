/**
 * Global application error handling middleware.
 */
export function errorHandler(err, _req, res, _next) {
  console.error("[Server Error]", err);

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Signature file size exceeds maximum limit of 2MB." });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred on the server.";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
}
