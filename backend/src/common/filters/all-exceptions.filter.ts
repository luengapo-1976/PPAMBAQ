import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const clientMessage = isHttpException
      ? exception.getResponse()
      : 'Ocurrió un error inesperado. Intenta nuevamente más tarde.';

    this.logger.error(
      {
        method: request.method,
        path: request.url,
        status,
        error: isHttpException ? exception.message : exception,
      },
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof clientMessage === 'string'
          ? clientMessage
          : ((clientMessage as { message?: unknown }).message ?? clientMessage),
    });
  }
}
