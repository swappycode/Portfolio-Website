/**
 * Global error handling middleware
 * Catches and handles errors passed via next(error)
 */
export default (err, req, res, next) => {
    // Log the error stack for debugging
    console.error(err.stack);

    // Set default status code if not provided
    const statusCode = err.statusCode || err.status || 500;

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};