import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import * as QueryHandlers from './queries';

@Module({
  imports: [CqrsModule],
  providers: [
    ...Object.values(QueryHandlers),
  ],
})
export class VoucherModule { }
