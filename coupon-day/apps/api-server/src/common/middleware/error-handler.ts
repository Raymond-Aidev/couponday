import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';
import { isDev } from '../../config/env.js';

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error in development
  if (isDev) {
    console.error('Error:', error);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send(
      errorResponse(ErrorCodes.VALIDATION_001.code, ErrorCodes.VALIDATION_001.message, {
        issues: error.issues,
      })
    );
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(errorResponse(error.code, error.message, error.details));
  }

  // Handle Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send(
      errorResponse(ErrorCodes.VALIDATION_001.code, ErrorCodes.VALIDATION_001.message, {
        validation: error.validation,
      })
    );
  }

  // Handle JWT errors
  if (error.name === 'UnauthorizedError' || error.message.includes('jwt')) {
    return reply.status(401).send(errorResponse(ErrorCodes.AUTH_003.code, ErrorCodes.AUTH_003.message));
  }

  // Default server error
  return reply.status(500).send(
    errorResponse(
      ErrorCodes.SERVER_001.code,
      isDev ? error.message : ErrorCodes.SERVER_001.message,
      isDev ? { stack: error.stack } : undefined
    )
  );
}
