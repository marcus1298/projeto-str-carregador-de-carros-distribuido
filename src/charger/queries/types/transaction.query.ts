import { Transaction, TransactionData } from '@/entities/transaction.entity';
import { User } from '@/entities/user.entity';

interface PointInfo {
  stationId: string;
  pointId: string;
}

export class CreateTransactionQuery {
  constructor(readonly args: Partial<Transaction> & PointInfo & { user: User, voucherId?: string }) { }
}

export class UpdateTransactionQuery {
  constructor(
    readonly args: Partial<Transaction> & { id?: string; } & PointInfo,
  ) { }
}

export class AddTransactionDataQuery {
  constructor(readonly args: { data: TransactionData[] } & PointInfo) { }
}
