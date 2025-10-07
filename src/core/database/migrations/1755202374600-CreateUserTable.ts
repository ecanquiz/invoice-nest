import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1755202374600 implements MigrationInterface {
    name = 'CreateUserTable1755202374600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" character varying(255) NOT NULL,
            "password" character varying NOT NULL,
            "name" character varying(100),
            "is_email_verified" boolean NOT NULL DEFAULT false,
            "email_verification_token" character varying(255),
            "password_reset_token" character varying(255),
            "password_reset_expires" TIMESTAMP WITH TIME ZONE,
            "avatar" character varying(255),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
