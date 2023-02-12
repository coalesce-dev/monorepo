import {
  ErrorResponse,
  GetFullValueResponse,
  RequestMessage,
  SuccessResponse,
} from '@coalesce.dev/store-core';

export function createSuccessResponse(req: RequestMessage): SuccessResponse {
  return {
    stype: 'r',
    type: 's',
    id: req.id,
  };
}

export function createFullValueResponse(
  req: RequestMessage,
  value: GetFullValueResponse['data']
): GetFullValueResponse {
  return {
    stype: 'r',
    type: 'fv',
    id: req.id,
    data: value,
  };
}

export function createErrorResponse(
  req: RequestMessage,
  err: ErrorResponse['data']
): ErrorResponse {
  return {
    stype: 'r',
    type: 'e',
    id: req.id,
    data: err,
  };
}
