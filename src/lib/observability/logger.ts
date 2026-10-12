export type LogLevel = 'info' | 'warn' | 'error';

export interface StructuredLogPayload {
  level: LogLevel;
  event: string;
  service?: string;
  environment?: string;
  request_id?: string;
  route?: string;
  duration_ms?: number;
  status_code?: number;
  error_code?: string;
}

const ALLOWED_LOG_KEYS: (keyof StructuredLogPayload)[] = [
  'level',
  'event',
  'service',
  'environment',
  'request_id',
  'route',
  'duration_ms',
  'status_code',
  'error_code',
];

export function logStructured(payload: StructuredLogPayload): void {
  const sanitized: Partial<StructuredLogPayload> = {
    service: payload.service ?? 'diyspur-web',
    environment: payload.environment ?? process.env.NODE_ENV ?? 'development',
  };

  for (const key of ALLOWED_LOG_KEYS) {
    const val = payload[key];
    if (val !== undefined && val !== null) {
      if (typeof val === 'string') {
        sanitized[key] = val.slice(0, 200) as never;
      } else if (typeof val === 'number' && Number.isFinite(val)) {
        sanitized[key] = val as never;
      }
    }
  }

  const jsonLine = JSON.stringify(sanitized);

  if (payload.level === 'error') {
    console.error(jsonLine);
  } else if (payload.level === 'warn') {
    console.warn(jsonLine);
  } else {
    console.info(jsonLine);
  }
}
