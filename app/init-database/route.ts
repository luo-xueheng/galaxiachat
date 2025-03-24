import bcrypt from "bcryptjs"; 
import { db } from "@vercel/postgres";

import { link_view_users } from "../lib/placeholder-data";

const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await client.sql`
    CREATE TABLE IF NOT EXISTS link_view_users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    link_view_users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      return client.sql`
        INSERT INTO link_view_users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}


export async function GET() {
  try {
    await client.sql`BEGIN`;
    await seedUsers();
    await client.sql`COMMIT`;

    return Response.json({ message: "创建成功" });
  } catch (error) {
    await client.sql`ROLLBACK`;

    return Response.json({ error }, { status: 500 });
  }
}