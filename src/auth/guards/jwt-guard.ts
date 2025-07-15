import {
  CanActivate,
  ExecutionContext,
  Injectable, Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtService.name);
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    try {
      request.user = this.jwtService.verify(token);
      return true;
    } catch (error) {
      this.logger.error({message: "JWT verification failed", error});
      
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired.');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token format.');
      } else {
        throw new UnauthorizedException('Invalid token.');
      }
    }
  }
}
