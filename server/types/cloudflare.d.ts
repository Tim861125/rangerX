/// <reference types="@cloudflare/workers-types" />
/// <reference path="./worker-configuration.d.ts" />

declare module 'h3' {
  interface H3EventContext {
    cloudflare?: {
      request: Request
      env: Env
      context: ExecutionContext
    }
  }
}

export {}
