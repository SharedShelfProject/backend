import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUnusedTables1762804200000 implements MigrationInterface {
  name = 'DropUnusedTables1762804200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "reputation_reviews" CASCADE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reputation_reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "rating" integer NOT NULL,
        "reputation_delta" integer NOT NULL DEFAULT '0',
        "comment" text,
        "loan_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        CONSTRAINT "PK_reputation_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reputation_review_loan_author" UNIQUE ("loan_id", "author_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_reputation_reviews_loan_id" ON "reputation_reviews" ("loan_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_reputation_reviews_author_id" ON "reputation_reviews" ("author_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_reputation_reviews_subject_id" ON "reputation_reviews" ("subject_id")',
    );
    await queryRunner.query(`
      ALTER TABLE "reputation_reviews"
      ADD CONSTRAINT "FK_reputation_reviews_loan_id"
      FOREIGN KEY ("loan_id") REFERENCES "loans"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reputation_reviews"
      ADD CONSTRAINT "FK_reputation_reviews_author_id"
      FOREIGN KEY ("author_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reputation_reviews"
      ADD CONSTRAINT "FK_reputation_reviews_subject_id"
      FOREIGN KEY ("subject_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "token" character varying(512) NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "FK_refresh_tokens_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }
}
