import jwt from 'jsonwebtoken';
import { errorResponse } from '../utilization/response.js';

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return errorResponse(res, 'Access denied. No token provided.', 401);
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 'Invalid token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 'Token expired', 401);
        }
        return errorResponse(res, 'Authentication failed', 401);
    }
};

// Role-based middleware
export const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return errorResponse(res, 'Access denied. Admin only.', 403);
    }
    next();
};