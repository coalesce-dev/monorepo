import {
  ErrorResponse,
  GetFullValueResponse,
  RequestMessage,
  SelectValueResponse,
  SuccessResponse,
} from '@coalesce.dev/store-common';

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

export function createSelectValueResponse(
  req: RequestMessage,
  value: SelectValueResponse['data']
): SelectValueResponse {
  return {
    stype: 'r',
    type: 'sv',
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
