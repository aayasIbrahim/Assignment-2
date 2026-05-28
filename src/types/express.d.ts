import type { RUser } from "./index";

// 1. Open the global scope to modify or add types available across the entire project
declare global {
  // 2. Target the existing 'Express' namespace to inject custom properties
  namespace Express {
    // 3. Extend the built-in 'Request' interface (Declaration Merging)
    interface Request {
      user?: RUser & {
        id: string;
      };
      // 4. Add an optional 'cookies' object represented as key-value pairs of strings (populated by cookie-parser)
      cookies?: Record<string, string>;
    }
  }
}

export {};
