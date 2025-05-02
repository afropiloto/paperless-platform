import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

/*
We are catching all here and checking for the Mongo Exception because
the error thrown from Mongoose is not typed as MongoServerError or similar
This isn't very satisfactory but seems to be the only workaround at the moment
 */

@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    if (exception.constructor.name === "MongoServerError") {
      const mongoError = exception as MongoError;


      // Check for duplicate key error code (11000)
      if (mongoError.code === 11000) {
        const keyValue = mongoError['keyValue'];
        const field = Object.keys(keyValue)[0];

        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `The value for field '${field}': '${keyValue[field]} is already in use.'`,
          error: 'Bad Request',
          details: keyValue
        });
      }

      // Handle other MongoDB errors
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: mongoError.message,
        error: 'Internal Server Error'
      });
    }

    // Deal with non-Mongo errors
    // ToDo: This is quite ugly so may replace the catch-all with checks in the controllers.
    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      // Use the status code and message from HttpException
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      // Support string or object response structures
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else {
        message = errorResponse['message'] || exception.message;
      }
    } else {
      // Fallback for non-HttpExceptions
      // @ts-ignore
      status = (exception.status && typeof exception.status === 'number')
        // @ts-ignore
        ? exception.status
        : HttpStatus.INTERNAL_SERVER_ERROR;

      // @ts-ignore
      message = exception.message || 'Internal server error';
    }

    // Respond with a JSON structure
    response.status(status).json({
      statusCode: status,
      message: message,
      path: request.url,
    });
  }
}