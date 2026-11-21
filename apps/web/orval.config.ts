import { defineConfig } from 'orval';

export default defineConfig({
  cocinaApi: {
    input: {
      target: '../api/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated/endpoints.ts',
      schemas: 'src/shared/api/generated/models',
      client: 'fetch',
      clean: true,
      indexFiles: true,
      override: {
        mutator: {
          path: 'src/shared/api/custom-fetch.ts',
          name: 'customFetch',
        },
        fetch: {
          serializeResponseHeaders: true,
        },
      },
    },
  },
});
