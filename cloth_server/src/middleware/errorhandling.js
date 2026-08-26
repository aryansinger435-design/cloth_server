import { errorResponse } from '../utilization/response.js';

export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return errorResponse(res, messages.join(', '), 400);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return errorResponse(res, `${field} already exists`, 400);
    }

    // JWT errors are handled in auth middleware

    return errorResponse(res, err.message || 'Internal Server Error', err.status || 500);
};