import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserReputationDefaults1762800600000 implements MigrationInterface {
  name = 'UserReputationDefaults1762800600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "reputation_score" SET DEFAULT 100`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "reputation_score" = 100 WHERE "reputation_score" = 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "reputation_score" = 0 WHERE "reputation_score" = 100`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "reputation_score" SET DEFAULT 0`,
    );
  }
}
