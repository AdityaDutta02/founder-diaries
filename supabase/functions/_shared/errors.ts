export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown, functionName: string): Response {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const message = isAppError ? error.message : "Internal server error";

  console.error(JSON.stringify({
    level: "error",
    functionName,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  }));

  return new Response(
    JSON.stringify({ error: message, details: isAppError ? error.details : undefined }),
    { status: statusCode, headers: { "Content-Type": "application/json" } }
  );
}
