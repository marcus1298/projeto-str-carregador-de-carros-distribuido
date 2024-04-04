import { OCPPCall } from "@/types/ocpp/call";
import { OCPPResponse } from "@/types/ocpp/call-result";

export class TriggerMessageCall extends OCPPCall {
  constructor(private readonly requestedMessage: string, private readonly connectorId: number) {
    super('TriggerMessage');
  }
}
export class GetConfigurationCall extends OCPPCall {
  constructor() {
    super('GetConfiguration');
  }
}

class ConfigurationKey {
  key: string;
  readonly readonly: boolean;
  value: string;
}
export class GetConfigurationResponse extends OCPPResponse {
  readonly configurationKey: ConfigurationKey[];

  constructor(uniqueId: string) {
    super(uniqueId);
  }
}

export class ChangeConfigurationCall extends OCPPCall {
  constructor(private readonly key: string, private readonly value: string | number | boolean) {
    super('ChangeConfiguration');
  }
}
