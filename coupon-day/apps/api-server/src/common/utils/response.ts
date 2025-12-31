import type { FastifyReply } from 'fastify';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(
  data: T,
  meta?: SuccessResponse<T>['meta']
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: unknown
): ErrorResponse {
  const error: ErrorResponse['error'] = {
    code,
    message,
  };
  if (details !== undefined) {
    error.details = details;
  }
  return {
    success: false,
    error,
  };
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCodeOrMeta?: number | SuccessResponse<T>['meta'],
  meta?: SuccessResponse<T>['meta']
) {
  let statusCode = 200;
  let actualMeta = meta;

  if (typeof statusCodeOrMeta === 'number') {
    statusCode = statusCodeOrMeta;
  } else if (statusCodeOrMeta) {
    actualMeta = statusCodeOrMeta;
  }

  return reply.status(statusCode).send(successResponse(data, actualMeta));
}

export function sendError(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  return reply.status(statusCode).send(errorResponse(code, message, details));
}
