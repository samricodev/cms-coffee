import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

const url =
  process.env.TEST_DATABASE_URL ??
  "postgresql://cms:cms@localhost:5433/cms_test";

const nombre = new URL(url).pathname.slice(1);

async function main() {
  const admin = new Client({
    connectionString: url.replace(`/${nombre}`, "/postgres"),
  });

  await admin.connect();

  const existe = await admin.query(
    "select 1 from pg_database where datname = $1",
    [nombre],
  );

  if (existe.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${nombre}"`);
    console.log(`Base de datos "${nombre}" creada.`);
  }

  await admin.end();

  const pool = new Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  await pool.end();

  console.log(`Migraciones al día en "${nombre}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
