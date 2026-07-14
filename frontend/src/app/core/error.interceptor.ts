import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ApiError {
  statusCode: number;
  message: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        typeof error.error?.message === 'string'
          ? error.error.message
          : 'Ocurrió un error inesperado. Intenta nuevamente más tarde.';

      const apiError: ApiError = { statusCode: error.status, message };
      return throwError(() => apiError);
    }),
  );
};
