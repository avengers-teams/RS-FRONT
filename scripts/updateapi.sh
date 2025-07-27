pnpm dlx openapi-typescript src/types/json/openapi.json --default-non-nullable --output src/types/openapi.ts;
node scripts/dereference_openapi.js
echo "Updated API schemas."
