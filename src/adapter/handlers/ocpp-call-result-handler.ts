import { OCPPSocket } from "@/types/ocpp/socket";
import { MessageMappingProperties } from "@nestjs/websockets";
import { Observable, fromEvent, of } from "rxjs";
import { filter, mergeMap } from 'rxjs/operators';
import { OCPPCallResultMessage, OCPPResponse, OCPPResponseErrorCode } from "../../types/ocpp/call-result";
import { LoggerService } from "@nestjs/common";


function occpCallResultHandler(
    call: OCPPCallResultMessage,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
    stationId: string,
    logger: LoggerService,
): Observable<any> {
    const [, uniqueId, response] = call;

    const [action, transactionId] = uniqueId.split('::');

    logger.log(`Station: ${stationId} - CALLRESULT - ${action} - ${transactionId}`, {
        stationId,
        messageType: 'CALLRESULT',
        response,
        uniqueId,
    });

    const resultAction = `${action}Result`;
    const messageHandler = handlers.find((handler) => handler.message === resultAction);

    if (!messageHandler) {
        return of(OCPPResponse.createError(uniqueId, OCPPResponseErrorCode.NOT_IMPLEMENTED));
    }

    return process(
        messageHandler.callback({
            ...(response ?? {}),
            uniqueId,
            transactionId: Number(transactionId),
        }),
    );
}


export function bindCallResultHandler(socket: OCPPSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
    logger: LoggerService,
) {

    fromEvent(socket, 'message')
        .pipe(
            filter(
                (buffer: any) =>
                    Array.isArray(JSON.parse(buffer.data)) && JSON.parse(buffer.data)[0] === 3,
            ),
            mergeMap((buffer) =>
                occpCallResultHandler(JSON.parse(buffer.data), handlers, process, socket.station.id, logger),
            ),
            filter((result) => result),
        )
        .subscribe((response) => {
            socket.sendMessage(response);
        });

}

