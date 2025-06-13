import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url} = request;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const body = context.switchToHttp().getRequest().body;

    this.logger.debug({message: 'Incoming Request', method: method, url: url, controller: controller, handler: handler, body: body});



    return next.handle().pipe(
      tap(() => this.logger.debug(`Completed Request: ${method} ${url}`)),
    );
  }
}
