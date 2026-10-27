import { User } from "@prisma/client";
import "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user: User;
      company: Company | null;
      auth?: {
        rftoken_id: string;
      };
    }
  }
}

export {};
