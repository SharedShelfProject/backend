import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(
      "CREATE TYPE \"public\".\"groups_visibility_enum\" AS ENUM('open', 'private')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"group_memberships_role_enum\" AS ENUM('owner', 'admin', 'member')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"group_memberships_status_enum\" AS ENUM('pending', 'active', 'blocked')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"books_status_enum\" AS ENUM('available', 'queued', 'borrowed', 'unavailable')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"borrow_requests_status_enum\" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'expired', 'fulfilled')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"loans_status_enum\" AS ENUM('active', 'returned', 'overdue', 'lost')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"notifications_type_enum\" AS ENUM('request_created', 'request_approved', 'request_rejected', 'loan_reminder', 'loan_overdue', 'book_returned')",
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "email" character varying(150) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "username" character varying(100) NOT NULL,
        "bio" text,
        "avatar_url" character varying(255),
        "reputation_score" integer NOT NULL DEFAULT '0',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(150) NOT NULL,
        "description" text,
        "visibility" "public"."groups_visibility_enum" NOT NULL DEFAULT 'private',
        "invite_code" character varying(32),
        "owner_id" uuid NOT NULL,
        CONSTRAINT "PK_groups_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "group_memberships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "role" "public"."group_memberships_role_enum" NOT NULL DEFAULT 'member',
        "status" "public"."group_memberships_status_enum" NOT NULL DEFAULT 'pending',
        "joined_at" TIMESTAMP WITH TIME ZONE,
        "group_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_group_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_group_membership_group_user" UNIQUE ("group_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "books" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "title" character varying(200) NOT NULL,
        "author" character varying(150) NOT NULL,
        "isbn" character varying(30),
        "genre" character varying(100),
        "publication_year" integer,
        "language" character varying(50),
        "description" text,
        "cover_url" character varying(255),
        "condition" character varying(50),
        "status" "public"."books_status_enum" NOT NULL DEFAULT 'available',
        "owner_id" uuid NOT NULL,
        CONSTRAINT "PK_books_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "group_books" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_visible" boolean NOT NULL DEFAULT true,
        "added_at" TIMESTAMP WITH TIME ZONE,
        "group_id" uuid NOT NULL,
        "book_id" uuid NOT NULL,
        CONSTRAINT "PK_group_books_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_group_book_group_book" UNIQUE ("group_id", "book_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "borrow_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "status" "public"."borrow_requests_status_enum" NOT NULL DEFAULT 'pending',
        "queue_position" integer NOT NULL,
        "message" text,
        "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "book_id" uuid NOT NULL,
        "group_book_id" uuid NOT NULL,
        "requester_id" uuid NOT NULL,
        CONSTRAINT "PK_borrow_requests_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "loans" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "borrowed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "due_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "returned_at" TIMESTAMP WITH TIME ZONE,
        "status" "public"."loans_status_enum" NOT NULL DEFAULT 'active',
        "notes" text,
        "book_id" uuid NOT NULL,
        "group_id" uuid NOT NULL,
        "borrower_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        CONSTRAINT "PK_loans_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "type" "public"."notifications_type_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "body" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "scheduled_for" TIMESTAMP WITH TIME ZONE,
        "sent_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "loan_id" uuid,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);

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
      'CREATE INDEX "IDX_groups_owner_id" ON "groups" ("owner_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_group_memberships_group_id" ON "group_memberships" ("group_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_group_memberships_user_id" ON "group_memberships" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_books_owner_id" ON "books" ("owner_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_group_books_group_id" ON "group_books" ("group_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_group_books_book_id" ON "group_books" ("book_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_borrow_requests_book_id" ON "borrow_requests" ("book_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_borrow_requests_group_book_id" ON "borrow_requests" ("group_book_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_borrow_requests_requester_id" ON "borrow_requests" ("requester_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_borrow_requests_queue" ON "borrow_requests" ("group_book_id", "queue_position")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_loans_book_id" ON "loans" ("book_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_loans_group_id" ON "loans" ("group_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_loans_borrower_id" ON "loans" ("borrower_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_loans_owner_id" ON "loans" ("owner_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_notifications_loan_id" ON "notifications" ("loan_id")',
    );
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
      ALTER TABLE "groups"
      ADD CONSTRAINT "FK_groups_owner_id"
      FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "group_memberships"
      ADD CONSTRAINT "FK_group_memberships_group_id"
      FOREIGN KEY ("group_id") REFERENCES "groups"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "group_memberships"
      ADD CONSTRAINT "FK_group_memberships_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "books"
      ADD CONSTRAINT "FK_books_owner_id"
      FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "group_books"
      ADD CONSTRAINT "FK_group_books_group_id"
      FOREIGN KEY ("group_id") REFERENCES "groups"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "group_books"
      ADD CONSTRAINT "FK_group_books_book_id"
      FOREIGN KEY ("book_id") REFERENCES "books"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "borrow_requests"
      ADD CONSTRAINT "FK_borrow_requests_book_id"
      FOREIGN KEY ("book_id") REFERENCES "books"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "borrow_requests"
      ADD CONSTRAINT "FK_borrow_requests_group_book_id"
      FOREIGN KEY ("group_book_id") REFERENCES "group_books"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "borrow_requests"
      ADD CONSTRAINT "FK_borrow_requests_requester_id"
      FOREIGN KEY ("requester_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "loans"
      ADD CONSTRAINT "FK_loans_book_id"
      FOREIGN KEY ("book_id") REFERENCES "books"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "loans"
      ADD CONSTRAINT "FK_loans_group_id"
      FOREIGN KEY ("group_id") REFERENCES "groups"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "loans"
      ADD CONSTRAINT "FK_loans_borrower_id"
      FOREIGN KEY ("borrower_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "loans"
      ADD CONSTRAINT "FK_loans_owner_id"
      FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_loan_id"
      FOREIGN KEY ("loan_id") REFERENCES "loans"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
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
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reputation_reviews"
      ADD CONSTRAINT "FK_reputation_reviews_subject_id"
      FOREIGN KEY ("subject_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reputation_reviews" DROP CONSTRAINT "FK_reputation_reviews_subject_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "reputation_reviews" DROP CONSTRAINT "FK_reputation_reviews_author_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "reputation_reviews" DROP CONSTRAINT "FK_reputation_reviews_loan_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_loan_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "loans" DROP CONSTRAINT "FK_loans_owner_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "loans" DROP CONSTRAINT "FK_loans_borrower_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "loans" DROP CONSTRAINT "FK_loans_group_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "loans" DROP CONSTRAINT "FK_loans_book_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "borrow_requests" DROP CONSTRAINT "FK_borrow_requests_requester_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "borrow_requests" DROP CONSTRAINT "FK_borrow_requests_group_book_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "borrow_requests" DROP CONSTRAINT "FK_borrow_requests_book_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "group_books" DROP CONSTRAINT "FK_group_books_book_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "group_books" DROP CONSTRAINT "FK_group_books_group_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" DROP CONSTRAINT "FK_books_owner_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "group_memberships" DROP CONSTRAINT "FK_group_memberships_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "group_memberships" DROP CONSTRAINT "FK_group_memberships_group_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "groups" DROP CONSTRAINT "FK_groups_owner_id"',
    );

    await queryRunner.query(
      'DROP INDEX "public"."IDX_reputation_reviews_subject_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_reputation_reviews_author_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_reputation_reviews_loan_id"',
    );
    await queryRunner.query('DROP INDEX "public"."IDX_notifications_loan_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_notifications_user_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_loans_owner_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_loans_borrower_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_loans_group_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_loans_book_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_borrow_requests_queue"');
    await queryRunner.query(
      'DROP INDEX "public"."IDX_borrow_requests_requester_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_borrow_requests_group_book_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_borrow_requests_book_id"',
    );
    await queryRunner.query('DROP INDEX "public"."IDX_group_books_book_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_group_books_group_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_books_owner_id"');
    await queryRunner.query(
      'DROP INDEX "public"."IDX_group_memberships_user_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_group_memberships_group_id"',
    );
    await queryRunner.query('DROP INDEX "public"."IDX_groups_owner_id"');

    await queryRunner.query('DROP TABLE "reputation_reviews"');
    await queryRunner.query('DROP TABLE "notifications"');
    await queryRunner.query('DROP TABLE "loans"');
    await queryRunner.query('DROP TABLE "borrow_requests"');
    await queryRunner.query('DROP TABLE "group_books"');
    await queryRunner.query('DROP TABLE "books"');
    await queryRunner.query('DROP TABLE "group_memberships"');
    await queryRunner.query('DROP TABLE "groups"');
    await queryRunner.query('DROP TABLE "users"');

    await queryRunner.query('DROP TYPE "public"."notifications_type_enum"');
    await queryRunner.query('DROP TYPE "public"."loans_status_enum"');
    await queryRunner.query('DROP TYPE "public"."borrow_requests_status_enum"');
    await queryRunner.query('DROP TYPE "public"."books_status_enum"');
    await queryRunner.query(
      'DROP TYPE "public"."group_memberships_status_enum"',
    );
    await queryRunner.query(
      'DROP TYPE "public"."group_memberships_role_enum"',
    );
    await queryRunner.query('DROP TYPE "public"."groups_visibility_enum"');
  }
}
