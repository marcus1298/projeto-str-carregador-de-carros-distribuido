import { OCPPCallMessage, OCPPRequest } from "@/types/ocpp/call";
import { OCPPSocket } from "@/types/ocpp/socket";
import { LoggerService } from "@nestjs/common";
import { MessageMappingProperties } from "@nestjs/websockets";
import { Observable, fromEvent, of } from "rxjs";
import { filter, mergeMap } from 'rxjs/operators';
import { OCPPResponse, OCPPResponseErrorCode } from "../../types/ocpp/call-result";

function ocppCallMessageHandler(
    call: OCPPCallMessage,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
    stationId: string,
    logger: LoggerService,
): Observable<any> {
    const [, uniqueId, action, payload] = call;

    logger.log(`Station: ${stationId} - CALL - ${action} - ${uniqueId}`, {
        stationId,
        messageType: 'CALL',
        action,
        uniqueId,
        payload
    });

    const messageHandler = handlers.find((handler) => handler.message === action);

    if (!messageHandler) {
        return of(OCPPResponse.createError(uniqueId, OCPPResponseErrorCode.NOT_IMPLEMENTED));
    }

    const ocppMessage = new OCPPRequest(uniqueId, payload);

    return process(messageHandler.callback(ocppMessage));
}

export function bindCallHandler(socket: OCPPSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
    logger: LoggerService,
) {
    fromEvent(socket, 'message')
        .pipe(
            filter(
                (buffer: any) =>
                    Array.isArray(JSON.parse(buffer.data)) && JSON.parse(buffer.data)[0] === 2,
            ),
            mergeMap((buffer) =>
                ocppCallMessageHandler(JSON.parse(buffer.data), handlers, process, socket.station.id, logger),
            ),
        )
        .subscribe((response) => {
            socket.sendMessage(response);
        });

}
