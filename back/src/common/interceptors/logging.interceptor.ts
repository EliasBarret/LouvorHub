import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();
    this.logger.log(`→ ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - now;
          this.logger.log(`✓ ${method} ${url} → ${ms}ms`);
        },
        error: (err) => {
          const ms = Date.now() - now;
          const status = err?.status ?? err?.response?.statusCode ?? 500;
          this.logger.warn(`✗ ${method} ${url} → ${status} (${ms}ms) ${err?.message ?? ''}`);
        },
      }),
    );
  }
}
