/* GET /api/openapi.json — the machine-readable contract.

   Public: an integrator has to be able to read the contract before they have
   credentials, and it describes shapes, not data. */
import { openapi } from '@/lib/openapi';

export const dynamic = 'force-static';

export async function GET() {
  return Response.json(openapi, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
