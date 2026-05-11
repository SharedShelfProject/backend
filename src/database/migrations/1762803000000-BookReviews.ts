import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookReviews1762803000000 implements MigrationInterface {
  name = 'BookReviews1762803000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "book_reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "rating" integer NOT NULL,
        "comment" text,
        "book_id" uuid NOT NULL,
        "loan_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        CONSTRAINT "PK_book_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_book_review_loan" UNIQUE ("loan_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_book_reviews_book_id" ON "book_reviews" ("book_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_book_reviews_loan_id" ON "book_reviews" ("loan_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_book_reviews_author_id" ON "book_reviews" ("author_id")',
    );
    await queryRunner.query(`
      ALTER TABLE "book_reviews"
      ADD CONSTRAINT "FK_book_reviews_book_id"
      FOREIGN KEY ("book_id") REFERENCES "books"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "book_reviews"
      ADD CONSTRAINT "FK_book_reviews_loan_id"
      FOREIGN KEY ("loan_id") REFERENCES "loans"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "book_reviews"
      ADD CONSTRAINT "FK_book_reviews_author_id"
      FOREIGN KEY ("author_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "book_reviews" DROP CONSTRAINT "FK_book_reviews_author_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "book_reviews" DROP CONSTRAINT "FK_book_reviews_loan_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "book_reviews" DROP CONSTRAINT "FK_book_reviews_book_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_book_reviews_author_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_book_reviews_loan_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_book_reviews_book_id"',
    );
    await queryRunner.query('DROP TABLE "book_reviews"');
  }
}
