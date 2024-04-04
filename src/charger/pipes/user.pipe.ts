import { GetUserQuery } from '@/user/queries/types/user.query';
import {
  ArgumentMetadata,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

export const ExtractUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.uid;
  },
);

@Injectable()
export class UserPipe implements PipeTransform {
  public constructor(private readonly queryBus: QueryBus) { }

  public async transform(uid: string, _metadata: ArgumentMetadata) {
    try {
      return await this.queryBus.execute(new GetUserQuery({ uid, cache: false }));
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid uid');
    }
  }
}
