// supabase/functions/backup-trigger/index.ts
// Phase 1 stub — real pg_dump logic added in Phase 1.5 OTA

interface BackupRequest {
  triggered_by: string;
  phase: string;
}

interface BackupResponse {
  status: 'success' | 'skipped';
  message: string;
  triggered_by: string;
  phase: string;
  timestamp: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = (await req.json()) as BackupRequest;

  const response: BackupResponse = {
    status: 'skipped',
    message: 'Backup stub — Phase 1.5 will implement full pg_dump to Storage',
    triggered_by: body.triggered_by ?? 'unknown',
    phase: body.phase ?? 'unknown',
    timestamp: new Date().toISOString(),
  };

  console.log('[backup-trigger]', {
    triggered_by: response.triggered_by,
    phase: response.phase,
    status: response.status,
  });

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
