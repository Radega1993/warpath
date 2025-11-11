import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Filtro de excepciones global para capturar errores en Sentry
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Capturar en Sentry solo si es un error del servidor (500+)
        if (status >= 500) {
            Sentry.captureException(exception, {
                tags: {
                    path: request.url,
                    method: request.method,
                },
                extra: {
                    body: request.body,
                    query: request.query,
                    params: request.params,
                },
            });
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }
}

