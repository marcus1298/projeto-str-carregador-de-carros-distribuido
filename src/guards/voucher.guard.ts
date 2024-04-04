import { ChargerGateway } from '@/charger/charger.gateway';
import { UserVoucher } from '@/entities/user.entity';
import { Voucher } from '@/entities/voucher.entity';
import { GetUserVoucherQuery, GetVoucherQuery } from '@/voucher/queries/types/voucher.query';
import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

@Injectable()
export class VoucherGuard implements CanActivate {
  constructor(private readonly queryBus: QueryBus, private readonly chargerGateway: ChargerGateway) { }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const { csId } = request.params;

    const stationMapValue = this.chargerGateway.stationsMap.get(csId);

    if (!stationMapValue) {
      return false;
    }

    const { voucherId } = request.query;

    const chargerStation = stationMapValue.station;

    if (chargerStation.onlyVoucher) {
      if (!voucherId) {
        throw new BadRequestException('É necessário informar um voucher para iniciar o carregamento nesta estação.');
      }

      const voucher = await this.queryBus.execute<GetVoucherQuery, Voucher>(new GetVoucherQuery({ voucherId, cache: false }));

      if (!voucher) {
        throw new BadRequestException('Voucher inválido.');
      }

      if (voucher.expiresAt && voucher.expiresAt < Date.now()) {
        throw new BadRequestException('Voucher expirado.');
      }

      if (voucher.maxGlobalUsages && voucher.maxGlobalUsages <= voucher.globalUsages) {
        throw new BadRequestException('Voucher não disponível.');
      }
      const uid = request.uid;

      const userVoucher = await this.queryBus.execute<GetVoucherQuery, UserVoucher>(new GetUserVoucherQuery({ voucherId, uid, cache: false }));

      if (userVoucher && (voucher.maxUsagesPerUser === 0 || (!!voucher.maxUsagesPerUser && userVoucher.totalUsages >= voucher.maxUsagesPerUser))) {
        throw new BadRequestException('Utilização do Voucher Esgotado.');
      }
    }

    return true;
  }
}
