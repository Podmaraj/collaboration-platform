import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

interface ErrorBody {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorBody: ErrorBody = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorBody = {
          code: this.statusToCode(status),
          message: exceptionResponse,
        };
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;

        // NestJS ValidationPipe errors
        if (Array.isArray(resp['message'])) {
          errorBody = {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: this.formatValidationErrors(resp['message'] as string[]),
          };
        } else {
          errorBody = {
            code: (resp['code'] as string) ?? this.statusToCode(status),
            message: (resp['message'] as string) ?? exception.message,
          };
        }
      }
    } else if (exception instanceof Error) {
      // Log internal errors but don't expose stack traces
      this.logger.error(exception.message, exception.stack);
    }

    reply.status(status).send({
      success: false,
      error: errorBody,
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }

  private formatValidationErrors(messages: string[]): Array<{ field: string; message: string }> {
    return messages.map((msg) => {
      // NestJS validation messages are typically "fieldName must be..."
      const parts = msg.split(' ');
      return { field: parts[0] ?? 'unknown', message: msg };
    });
  }
}
