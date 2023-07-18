import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';

export const loggerConfig = {
  pinoHttp: {
    level: 'debug',
    safe: true,
    timestamp: true,
    quietReqLogger: true,
    customProps: () => ({
      context: 'HTTP',
    }),
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
      },
    },

    customLogLevel: function (_: any, res: any, err: any) {
      if (
        res.statusCode >= HttpStatus.BAD_REQUEST &&
        res.statusCode < HttpStatus.INTERNAL_SERVER_ERROR
      ) {
        return 'warn';
      } else if (res.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR || err) {
        return 'error';
      } else if (
        res.statusCode >= HttpStatus.AMBIGUOUS &&
        res.statusCode < HttpStatus.BAD_REQUEST
      ) {
        return 'silent';
      }
      return 'info';
    },

    genReqId: function (req: any, res: any) {
      if (!req || !res) return randomUUID();
      const id = req.id
        ? req.id.toString()
        : req.headers['x-request-id'] ||
          req.headers['X-Request-Id'] ||
          randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
  },
};
