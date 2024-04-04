import { OCPPResponse } from "@/types/ocpp/call-result";

export class HeartbeatRequest {
  currentTime: string;
}

export class HeartbeatResponse extends OCPPResponse {
  currentTime: string;

  constructor(uniqueId: string) {
    super(uniqueId);
    this.currentTime = new Date().toJSON();
  }
}
