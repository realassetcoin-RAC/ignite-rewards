import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for API endpoints
 * Validates request body against provided Zod schema
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the request body
      const validatedData = schema.parse(req.body);
      
      // Replace the original body with validated data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors for client
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formattedErrors
        });
      }
      
      // Handle other errors
      return res.status(500).json({
        success: false,
        error: 'Internal server error during validation'
      });
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: formattedErrors
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error during query validation'
      });
    }
  };
};

/**
 * Validate URL parameters
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: formattedErrors
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error during parameter validation'
      });
    }
  };
};

/**
 * Sanitize input data to prevent XSS and injection attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Sanitize request body, query, and params
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};

/**
 * Rate limiting middleware
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requestCounts.get(clientId);
    
    if (!record || now > record.resetTime) {
      requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error);
  
  // Handle validation errors
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    });
  }
  
  // Handle database errors
  if (error.code === 'PGRST116') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
  }
  
  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }
  
  if (error.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Foreign key constraint violation',
      message: 'Referenced record does not exist'
    });
  }
  
  // Handle authentication errors
  if (error.status === 401) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  if (error.status === 403) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
