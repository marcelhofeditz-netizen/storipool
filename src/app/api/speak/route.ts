import handler from '@/legacy/speak.js';
import { runLegacy } from '@/lib/legacy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = (req: Request) => runLegacy(handler, req);
export const POST = (req: Request) => runLegacy(handler, req);
