import { isObject, isString } from 'class-validator';

export function parseRequest(request: any) {
  try {
    let body: any;

    body = isString(request.body) ? JSON.parse(request.body) : request.body;
  
    body = isObject(body) ? body : {};
  
    return {
      ...(body ?? {}),
      ...(request.query ?? {}),
    };
  } catch (e) {
    return {};
  }
}
