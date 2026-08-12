import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { AppError, ErrorBody } from "./error-response";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const body = this.toBody(exception);
    res.status(this.statusOf(exception)).json(body);
  }

  private statusOf(exception: unknown): number {
    if (exception instanceof AppError) return exception.status;
    if (exception instanceof HttpException) return exception.getStatus();
    return 500;
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof AppError) {
      return { code: exception.code, message: exception.message, fieldErrors: exception.fieldErrors };
    }
    if (exception instanceof HttpException) {
      return { code: "HTTP_ERROR", message: exception.message, fieldErrors: null };
    }
    return { code: "INTERNAL_ERROR", message: "Something went wrong", fieldErrors: null };
  }
}
