import { Patch } from 'immer';
import { AnyArray, AnyObject } from 'immer/dist/types/types-internal';

export type Selector =
  | readonly [string, ...(string | number)[]]
  | readonly [string];

type Request<Type extends string, Data> = Data extends void
  ? {
      id: number;
      type: Type;
    }
  : {
      id: number;
      type: Type;
      data: Data;
    };

type Response<Type extends string, Data> = Data extends void
  ? {
      id: number;
      stype: 'r';
      type: Type;
    }
  : {
      id: number;
      stype: 'r';
      type: Type;
      data: Data;
    };

type Event<Type extends string, Data> = Data extends void
  ? {
      stype: 'e';
      type: Type;
    }
  : {
      stype: 'e';
      type: Type;
      data: Data;
    };

export type KeepAliveRequest = Request<'a', void>;

export type GetFullValueRequest = Request<'fv', string>;
export type SelectValueRequest = Request<'sv', Selector>;

export type MutateValueRequest = Request<
  'm',
  { key: string; patches: Patch[] }
>;

export interface SuccessResponse extends Response<'s', void> {
  type: 's';
}

export type GetFullValueResponse = Response<'fv', AnyObject | AnyArray>;
export type SelectValueResponse = Response<'sv', unknown>;

export type ErrorResponse = Response<'e', unknown>;

export type InfoEvent = Event<
  'i',
  {
    instanceId: string;
    schemaVersion: number;
  }
>;

export type MutateEvent = Event<'m', Patch[]>;

export type RequestMessage =
  | KeepAliveRequest
  | GetFullValueRequest
  | MutateValueRequest
  | SelectValueRequest;
export type ResponseMessage =
  | SuccessResponse
  | ErrorResponse
  | GetFullValueResponse
  | SelectValueResponse;
export type EventMessage = InfoEvent | MutateEvent;
