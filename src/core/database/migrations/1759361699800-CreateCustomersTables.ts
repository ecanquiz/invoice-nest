import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomersTables1759361699800 implements MigrationInterface {
  name = 'CreateCustomersTables1759361699800'

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID UNIQUE NOT NULL,
        "customer_code" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);    

    await queryRunner.query(`
      CREATE TABLE "customer_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customer_id" UUID UNIQUE NOT NULL,
        "phone" VARCHAR(20),
        "birth_date" DATE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "customer_communication_preferences" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customer_id" UUID UNIQUE NOT NULL,
        "receive_notifications" BOOLEAN DEFAULT true,
        "receive_newsletter" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "customer_wine_preferences" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customer_id" UUID NOT NULL,
        "wine_type" VARCHAR NOT NULL CHECK (wine_type IN ('white', 'rose', 'sparkling', 'red')),
        "created_at" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        UNIQUE("customer_id", "wine_type")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_customers_user_id" ON "customers" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_customer_profiles_customer_id" ON "customer_profiles" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_customer_comm_prefs_customer_id" ON "customer_communication_preferences" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_customer_wine_prefs_customer_id" ON "customer_wine_preferences" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_customer_wine_prefs_type" ON "customer_wine_preferences" ("wine_type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "customer_wine_preferences"`);
    await queryRunner.query(`DROP TABLE "customer_communication_preferences"`);
    await queryRunner.query(`DROP TABLE "customer_profiles"`);
    await queryRunner.query(`DROP TABLE "customers"`);
  }
}
