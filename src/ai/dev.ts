

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import '@/ai/flows/suggest-resource-assignment.ts';
import '@/ai/flows/create-ot-from-api.ts';
