import { OCPPCall, OCPPCallMessage } from "./call";
import { OCPPCallResultMessage, OCPPResponse } from "./call-result";

export class OCPPMultipleMessageBuilder {
  private results: Array<OCPPCallMessage | OCPPCallResultMessage>;

  constructor() {
    this.results = [];
  }

  public isEmpty() {
    return this.results.length === 0;
  }

  public addCall(call: OCPPCall) {
    this.results.push(call.create());
    return this;
  }

  public addResult(response: OCPPResponse) {
    this.results.push(response.createResult());
    return this;
  }

  public build() {
    return this.results;
  }
}
