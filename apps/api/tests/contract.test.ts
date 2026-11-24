import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import SwaggerParser from '@apidevtools/swagger-parser';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES, USER_ROLES } from '@evidy/shared';

test('OpenAPI 3.1 is valid and matches the shared roles, statuses and types', async () => {
  const path = fileURLToPath(new URL('../../../spec/openapi.yaml', import.meta.url));
  const spec = await SwaggerParser.validate(path);
  assert.equal(Object.keys(spec.paths ?? {}).length, 17);
  assert.ok('components' in spec);
  const schemas = spec.components?.schemas;
  for (const [name, values] of Object.entries({
    UserRole: USER_ROLES,
    DocumentStatus: DOCUMENT_STATUSES,
    DocumentType: DOCUMENT_TYPES,
  })) {
    const schema = schemas?.[name];
    assert.ok(schema && 'enum' in schema);
    assert.deepEqual([...(schema.enum ?? [])].sort(), [...values].sort());
  }
});
