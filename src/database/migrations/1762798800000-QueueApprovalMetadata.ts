import { MigrationInterface, QueryRunner } from 'typeorm';

export class QueueApprovalMetadata1762798800000 implements MigrationInterface {
  name = 'QueueApprovalMetadata1762798800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "borrow_requests" ADD "approved_due_at" TIMESTAMP WITH TIME ZONE',
    );
    await queryRunner.query(
      'ALTER TABLE "borrow_requests" ADD "approval_notes" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "borrow_requests" DROP COLUMN "approval_notes"',
    );
    await queryRunner.query(
      'ALTER TABLE "borrow_requests" DROP COLUMN "approved_due_at"',
    );
  }
}
