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

# Shared secret proving a request came through CloudFront: injected as the
# X-Origin-Verify origin header and checked by nginx on the EC2 server
# (deploy/nginx-amencircle.conf). Create it manually before the first apply:
#   aws ssm put-parameter --name /amen-circle/origin-verify-secret \
#     --type SecureString --value "$(openssl rand -hex 32)"
# Rotation requires updating the nginx conf on the server AND re-applying.
data "aws_ssm_parameter" "origin_verify_secret" {
  name            = "/${var.app_name}/origin-verify-secret"
  with_decryption = true
}
