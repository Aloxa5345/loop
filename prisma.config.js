require("dotenv/config");
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    engine: "classic",
    seed: {
        run: 'ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed.ts',
    },
});
