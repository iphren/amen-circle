# Nightly database backups: scripts/backup-db.sh on the EC2 server streams a
# pg_dump to this bucket via cron. The IAM user is write-only (PutObject, no
# read/list/delete) so a compromised server cannot exfiltrate or destroy
# backup history; objects age out via the lifecycle rule instead.

resource "aws_s3_bucket" "backups" {
  bucket = "${var.app_name}-backups-${local.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-dumps"
    status = "Enabled"

    filter {
      prefix = "db/"
    }

    # Keep in sync with the privacy policy's retention statements.
    expiration {
      days = 30
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_iam_user" "backup_writer" {
  name = "${var.app_name}-backup-writer"
  tags = local.common_tags
}

resource "aws_iam_user_policy" "backup_writer" {
  name = "put-db-dumps"
  user = aws_iam_user.backup_writer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "WriteDumps"
      Effect   = "Allow"
      Action   = "s3:PutObject"
      Resource = "${aws_s3_bucket.backups.arn}/db/*"
    }]
  })
}

resource "aws_iam_access_key" "backup_writer" {
  user = aws_iam_user.backup_writer.name
}

output "backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "backup_access_key_id" {
  value = aws_iam_access_key.backup_writer.id
}

output "backup_secret_access_key" {
  value     = aws_iam_access_key.backup_writer.secret
  sensitive = true
}
