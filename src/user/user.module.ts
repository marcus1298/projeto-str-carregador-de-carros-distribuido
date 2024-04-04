import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import * as QueryHandlers from './queries';
import { UserController } from './user.controller';

@Module({
  imports: [CqrsModule],
  providers: [
    ...Object.values(QueryHandlers),
  ],
  controllers: [UserController],
})
export class UserModule { }
