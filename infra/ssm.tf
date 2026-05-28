data "aws_ssm_parameter" "database_url" {
  name            = "/${var.app_name}/database-url"
  with_decryption = true
}

# Optional: a non-pooled Neon URL used only by `prisma migrate deploy` during
# the build. If you never run migrations from Amplify, omit this parameter
# and remove the migrate step from amplify.yml.
data "aws_ssm_parameter" "database_url_direct" {
  name            = "/${var.app_name}/database-url-direct"
  with_decryption = true
}

data "aws_ssm_parameter" "session_secret" {
  name            = "/${var.app_name}/session-secret"
  with_decryption = true
}

data "aws_ssm_parameter" "encryption_key" {
  name            = "/${var.app_name}/encryption-key"
  with_decryption = true
}

data "aws_ssm_parameter" "github_access_token" {
  name            = "/${var.app_name}/github-access-token"
  with_decryption = true
}
