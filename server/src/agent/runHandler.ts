import { NextFunction, Request, Response } from 'express';
import type { AppError } from '../types';

export type ExpressHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

interface HandlerResult {
  status: number;
  data: unknown;
}

interface MockResponse {
  statusCode: number;
  status(code: number): MockResponse;
  set(): MockResponse;
  send(data: unknown): void;
  json(payload: unknown): void;
}

export async function runHandler(handler: ExpressHandler, req: Request): Promise<HandlerResult> {
  return new Promise((resolve, reject) => {
    const res: MockResponse = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      set() {
        return this;
      },
      send(data: unknown) {
        resolve({ status: this.statusCode, data });
      },
      json(payload: unknown) {
        resolve({ status: this.statusCode, data: payload });
      },
    };

    const next = (err?: AppError) => {
      if (err?.statusCode) {
        resolve({ status: err.statusCode, data: { message: err.message } });
        return;
      }
      reject(err);
    };

    Promise.resolve(handler(req, res as unknown as Response, next as NextFunction)).catch(reject);
  });
}
