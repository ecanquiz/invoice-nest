import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToUsers1756933288572 implements MigrationInterface {
    name = 'AddDeletedAtToUsers1756933288572'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "deletedAt"
        `);
    }
}
