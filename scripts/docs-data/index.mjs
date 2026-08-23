import path from 'path';
import { generateOverview } from './gen-overview.mjs';
import { generateArch } from './gen-arch.mjs';
import { generateData } from './gen-data.mjs';
import { generateGeoOffline } from './gen-geo-offline.mjs';
import { generateApiTesting } from './gen-api-testing.mjs';
import { generateOpsRef } from './gen-ops-ref.mjs';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');

console.log('Generating complete documentation tree into:', DOCS_DIR);

generateOverview(DOCS_DIR);
generateArch(DOCS_DIR);
generateData(DOCS_DIR);
generateGeoOffline(DOCS_DIR);
generateApiTesting(DOCS_DIR);
generateOpsRef(DOCS_DIR);

console.log('All 19 documentation sections successfully generated!');
