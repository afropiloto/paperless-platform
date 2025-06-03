import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, body, files, fields } = request;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    const isMultipart = headers['content-type']?.includes('multipart/form-data');

    this.logger.log({message: 'Incoming Request', method: method, url: url, controller: controller, handler: handler, headers: headers,
      ...(isMultipart ? {
        files: files,
        fields: fields
      } : {
        body
      })});



    return next.handle().pipe(
      tap(() => this.logger.log(`Completed Request: ${method} ${url}`)),
    );
  }
}
