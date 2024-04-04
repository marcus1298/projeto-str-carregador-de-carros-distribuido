import { BLACKLIST_KEY } from '@/types/constants/blacklist';
import { ArgumentsHost, Catch, HttpException, HttpServer, LoggerService } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Cache } from 'cache-manager';
import * as RequestIp from 'request-ip';

class CustomerFriendlyException extends HttpException {
  constructor(statusCode = 400, message?: string) {
    if (!message || message.length > 100) {
      message = '';
    }

    message +=
      '\nNão foi possível realizar seu pedido.\n' +
      'Por favor tente novamente mais tarde ou entre em contato com nosso antendimento.';

    super(message, statusCode);
  }
}

@Catch()
export class HttpExceptionsFilter extends BaseExceptionFilter<HttpException> {
  constructor(private cacheManager: Cache, private readonly logger: LoggerService, server: HttpServer) {
    super(server);
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    try {
      this.logger.error(exception);

      const blacklist = await this.cacheManager.get<string[]>(BLACKLIST_KEY) ?? [];
      const httpContext = host.switchToHttp();
      const request = httpContext.getRequest<Request>();


      const status = exception?.getStatus?.() ?? 500;


      if (status === 404) {
        const ip = RequestIp.getClientIp(request);

        const atempts = (await this.cacheManager.get<number>(`notfound::${String(ip)}`)) ?? 0;

        if (atempts >= 10) {
          console.log('Blacklisting IP: ', ip)
          blacklist.push(ip);
          await this.cacheManager.set(BLACKLIST_KEY, blacklist, 24 * 60 * 60 * 1000);
        } else {
          await this.cacheManager.set(`notfound::${String(ip)}`, (atempts + 1), 10 * 1000);
        }
      }

      if (status < 500) {
        super.catch(new CustomerFriendlyException(status, exception.message), host);
      } else {
        super.catch(new CustomerFriendlyException(), host);
      }
    } catch (e) {
      console.log(e);
    }
  }
}
