data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  common_tags = {
    Project   = var.app_name
    ManagedBy = "terraform"
  }
}

resource "aws_iam_role" "amplify_service" {
  name = "${var.app_name}-amplify-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "amplify_service_cloudwatch" {
  name = "cloudwatch-logs"
  role = aws_iam_role.amplify_service.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "PushLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/amplify/*:log-stream:*"
      },
      {
        Sid      = "CreateLogGroup"
        Effect   = "Allow"
        Action   = "logs:CreateLogGroup"
        Resource = "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/amplify/*"
      },
      {
        Sid      = "DescribeLogGroups"
        Effect   = "Allow"
        Action   = "logs:DescribeLogGroups"
        Resource = "arn:aws:logs:${local.region}:${local.account_id}:log-group:*"
      }
    ]
  })
}

data "aws_route53_zone" "root" {
  name         = "ihs.technology."
  private_zone = false
}

resource "aws_amplify_app" "main" {
  name         = var.app_name
  repository   = "https://github.com/${var.github_repo}"
  access_token = data.aws_ssm_parameter.github_access_token.value
  platform     = "WEB_COMPUTE"

  build_spec = file("${path.module}/../amplify.yml")

  environment_variables = {
    NODE_VERSION = "22"
  }

  iam_service_role_arn        = aws_iam_role.amplify_service.arn
  enable_auto_branch_creation = false

  tags = local.common_tags
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.github_branch
  framework   = "Next.js - SSR"
  stage       = "PRODUCTION"

  enable_auto_build           = true
  enable_pull_request_preview = false

  environment_variables = {
    DATABASE_URL            = data.aws_ssm_parameter.database_url.value
    DATABASE_URL_DIRECT     = data.aws_ssm_parameter.database_url_direct.value
    SESSION_SECRET          = data.aws_ssm_parameter.session_secret.value
    ENCRYPTION_KEY          = data.aws_ssm_parameter.encryption_key.value
    WEBAUTHN_RPID           = var.domain_name
    WEBAUTHN_ORIGIN         = "https://${var.domain_name}"
    NEXT_TELEMETRY_DISABLED = "1"
  }
}

resource "aws_amplify_domain_association" "main" {
  app_id      = aws_amplify_app.main.id
  domain_name = var.domain_name

  certificate_settings {
    type                   = "CUSTOM"
    custom_certificate_arn = var.certificate_arn
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = var.domain_name
  type    = "CNAME"
  ttl     = 300
  records = ["${var.github_branch}.${aws_amplify_app.main.id}.amplifyapp.com"]
}
