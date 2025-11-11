import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

/**
 * Interceptor para capturar errores no manejados en Sentry
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((error) => {
                // Capturar errores en Sentry
                Sentry.captureException(error, {
                    tags: {
                        context: context.getClass().name,
                        handler: context.getHandler().name,
                    },
                });
                return throwError(() => error);
            }),
        );
    }
}

