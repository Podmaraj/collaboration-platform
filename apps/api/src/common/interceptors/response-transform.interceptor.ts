import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response already has the success envelope, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiSuccessResponse<T>;
        }

        // If the response has a meta field (paginated), extract it
        if (data && typeof data === 'object' && 'meta' in data && 'data' in data) {
          return {
            success: true,
            data: (data as { data: T }).data,
            meta: (data as { meta: Record<string, unknown> }).meta,
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
