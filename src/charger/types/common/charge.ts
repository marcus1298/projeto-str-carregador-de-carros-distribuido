
export enum ChargingRateUnit {
    A = 'A',
    W = 'W',
}

export class ChargingSchedule {
    duration?: number;
    startSchedule?: string;
    chargingRateUnit: ChargingRateUnit;
    chargingSchedulePeriod: ChargingSchedulePeriod[];
}

export class ChargingSchedulePeriod {
    startPeriod: number;
    limit: number;
    numberPhases?: number;
}

export class ChargingProfileOptions {
    chargingProfilePriority?: number;
    transactionId?: number;
    stackLevel?: number;
    chargingProfilePurpose?: ChargingProfilePurpose;
    chargingProfileKind?: ChargingProfileKind;
}

export enum ChargingProfilePurpose {
    ChargePointMaxProfile = 'ChargePointMaxProfile',
    TxDefaultProfile = 'TxDefaultProfile',
    TxProfile = 'TxProfile',
    ChargePointProfile = 'ChargePointProfile',
}

export enum ChargingProfileKind {
    Absolute = 'Absolute',
    Recurring = 'Recurring',
    Relative = 'Relative',
}


export class ChargingProfile {
    chargingProfileId: number;
    transactionId?: number;
    stackLevel: number;
    chargingProfilePurpose: ChargingProfilePurpose;
    chargingProfileKind?: ChargingProfileKind;
    validFrom?: string;
    validTo?: string;
    chargingSchedule: ChargingSchedule;
    chargingProfileOptions?: ChargingProfileOptions;
}