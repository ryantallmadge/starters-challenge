import type { Response } from "express";

export function returnJson(res: Response, obj: unknown, code?: number): void {
  res.setHeader("Content-Type", "application/json");
  if (code) {
    res.status(code);
    res.send(JSON.stringify(obj));
    res.end();
    return;
  }
  res.end(JSON.stringify({ data: obj }));
}
