export class GetZoneQuery {
  constructor(readonly args: { uid: string; getRef?: boolean; cache?: boolean }) {}
}
