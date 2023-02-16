import { Patch } from 'immer';

interface IdReqRes {
  id: number;
}

export interface KeepAliveRequest extends IdReqRes {
  type: 'alive';
}

export interface GetDataRequest extends IdReqRes {
  type: 'data';
}

export interface AppendDataRequest extends IdReqRes {
  type: 'append';
  item: number;
}

export interface RemoveDataRequest extends IdReqRes {
  type: 'remove';
  index: number;
}

export type RequestMessage =
  | KeepAliveRequest
  | GetDataRequest
  | AppendDataRequest
  | RemoveDataRequest;

export interface GetDataResponse extends IdReqRes {
  type: 'data';
  data: number[];
}

export interface GenericSuccessResponse extends IdReqRes {
  type: 'success';
}

export interface DataUpdatedEvent {
  id?: never;
  data: { patches: Patch[] };
  type: 'update';
}

export interface WorkerInfoEvent {
  id?: never;
  data: { instance: string };
  type: 'info';
}

export type ResponseMessage = GetDataResponse | GenericSuccessResponse;
export type EventMessage = DataUpdatedEvent | WorkerInfoEvent;
export type ResponseEventMessage = ResponseMessage | EventMessage;
