import { ExtractUser, UserPipe } from '@/charger/pipes/user.pipe';
import { User } from '@/entities/user.entity';
import { AuthGuard } from '@/guards/auth.guard';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ActivateVoucherQuery } from './queries/types/user.query';

@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly queryBus: QueryBus) { }

  @HttpCode(204)
  @Post('/voucher/redeem')
  async startTransaction(
    @ExtractUser(UserPipe) user: User,
    @Body('registrationCode') registrationCode: string,
  ) {
    try {
      const result = await this.queryBus.execute<ActivateVoucherQuery, any>(new ActivateVoucherQuery({ uid: user.id, registrationCode }));
      
      if (result.error) {
        throw new BadRequestException(result.error);
      }

    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }

      throw new BadRequestException('Erro ao ativar voucher.');
    }
  }
}