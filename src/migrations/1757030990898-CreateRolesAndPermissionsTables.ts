import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRolesAndPermissionsTables1757030990898 implements MigrationInterface {
    name = 'CreateRolesAndPermissionsTables1757030990898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Permissions table
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" VARCHAR NOT NULL UNIQUE,
                "description" VARCHAR,
                "module" VARCHAR NOT NULL,
                "action" VARCHAR NOT NULL,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Role table
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" VARCHAR NOT NULL UNIQUE,
                "description" VARCHAR,
                "isActive" BOOLEAN DEFAULT true,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);

        // Intermediate table role_permissions
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" UUID NOT NULL,
                "permission_id" UUID NOT NULL,
                PRIMARY KEY ("role_id", "permission_id"),
                FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
                FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
            )
        `);

        // Intermediate table user_roles
        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_id" UUID NOT NULL,
                "role_id" UUID NOT NULL,
                PRIMARY KEY ("user_id", "role_id"),
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }
}
