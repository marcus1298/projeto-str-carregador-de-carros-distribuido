
export enum FirmwareStatus {
    Downloaded = 'Downloaded',
    DownloadFailed = 'DownloadFailed',
    Downloading = 'Downloading',
    Idle = 'Idle',
    InstallationFailed = 'InstallationFailed',
    Installing = 'Installing',
}


export enum RemoteStartStopStatus {
    Accepted = 'Accepted',
    Rejected = 'Rejected',
}

export enum TransactionEvent {
    Ended = 'Ended',
    Started = 'Started',
}

export enum TriggerReason {
    Authorized = 'Authorized',
    CablePluggedIn = 'CablePluggedIn',
    ChargingRateChanged = 'ChargingRateChanged',
    Deauthorized = 'Deauthorized',
    EnergyLimitReached = 'EnergyLimitReached',
    EVCommunicationLost = 'EVCommunicationLost',
    EVDisconnected = 'EVDisconnected',
    MeterValueClock = 'MeterValueClock',
    MeterValuePeriodic = 'MeterValuePeriodic',
    TimeLimitReached = 'TimeLimitReached',
}

export enum TimeUnit {
    Second = 'Second',
    Minute = 'Minute',
    Hour = 'Hour',
    Day = 'Day',
    Month = 'Month',
    Year = 'Year',
}