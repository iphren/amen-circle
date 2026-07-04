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

# Amplify WEB_COMPUTE SSR does NOT expose an assumable execution role to the
# runtime AWS SDK (the iam_service_role_arn above is only for builds/logging), so
# a role policy can't grant the SSR Lambda SES access. Instead we use a tightly
# scoped IAM user and pass its static access key to the app as env vars. The key
# only permits sending from the one verified address.
resource "aws_iam_user" "ses_sender" {
  name = "${var.app_name}-ses-sender"
  tags = local.common_tags
}

resource "aws_iam_user_policy" "ses_sender" {
  name = "ses-send-recovery-email"
  user = aws_iam_user.ses_sender.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "SendRecoveryEmail"
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = aws_sesv2_email_identity.recovery.arn
      Condition = {
        StringEquals = { "ses:FromAddress" = var.email_from_address }
      }
    }]
  })
}

resource "aws_iam_access_key" "ses_sender" {
  user = aws_iam_user.ses_sender.name
}

data "aws_route53_zone" "root" {
  name         = "${var.domain_name}."
  private_zone = false
}

# Zone of the legacy domain, still needed for the redirect CNAME.
data "aws_route53_zone" "legacy" {
  name         = "ihs.technology."
  private_zone = false
}

# TLS cert for the new domain (apex + wildcard, so www is covered). Amplify
# only accepts custom certificates from us-east-1, hence the aliased provider.
resource "aws_acm_certificate" "main" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = data.aws_route53_zone.root.zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 300
  records         = [each.value.record]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "main" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}

# SES domain identity (in the app's region, eu-west-2) for recovery emails.
# Easy DKIM is enabled by default; publish the three CNAME tokens below.
#
# NOTE: a brand-new SES account starts in the *sandbox* and can only send to
# verified recipients. Request production access in the SES console (one-time,
# not Terraformable) before recovery email reaches arbitrary users.
resource "aws_sesv2_email_identity" "recovery" {
  email_identity = var.domain_name
}

resource "aws_route53_record" "ses_dkim" {
  count   = 3
  zone_id = data.aws_route53_zone.root.zone_id
  name    = "${aws_sesv2_email_identity.recovery.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["${aws_sesv2_email_identity.recovery.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

# Custom MAIL FROM subdomain so SPF aligns to our domain (not amazonses.com) and
# clients stop showing the "via amazonses.com" annotation. Falls back to the SES
# default if the MX lookup fails, so a DNS hiccup never blocks sending.
resource "aws_sesv2_email_identity_mail_from_attributes" "recovery" {
  email_identity         = aws_sesv2_email_identity.recovery.email_identity
  mail_from_domain       = "mail.${var.domain_name}"
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

resource "aws_route53_record" "ses_mail_from_mx" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = "mail.${var.domain_name}"
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.${local.region}.amazonses.com"]
}

resource "aws_route53_record" "ses_mail_from_spf" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = "mail.${var.domain_name}"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# DMARC tells mailbox providers we manage the domain and what to do with
# unauthenticated mail. Start at p=none (monitor only — never quarantines
# legitimate mail); tighten to quarantine/reject once you've confirmed
# alignment. DKIM already aligns, so DMARC passes.
resource "aws_route53_record" "ses_dmarc" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none;"]
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

  # Host-based 301s: www and the legacy domain both land on the apex.
  custom_rule {
    source = "https://www.${var.domain_name}"
    target = "https://${var.domain_name}"
    status = "301"
  }

  custom_rule {
    source = "https://${var.legacy_domain_name}"
    target = "https://${var.domain_name}"
    status = "301"
  }

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
    DATABASE_URL        = data.aws_ssm_parameter.database_url.value
    DATABASE_URL_DIRECT = data.aws_ssm_parameter.database_url_direct.value
    SESSION_SECRET      = data.aws_ssm_parameter.session_secret.value
    ENCRYPTION_KEY      = data.aws_ssm_parameter.encryption_key.value
    WEBAUTHN_RPID       = var.domain_name
    WEBAUTHN_ORIGIN     = "https://${var.domain_name}"
    EMAIL_FROM          = var.email_from
    # Postal address + reply-to for the transactional email footer; also
    # snapshotted into runtime-env.json by amplify.yml for the SSR Lambda.
    EMAIL_POSTAL_ADDRESS = var.email_postal_address
    EMAIL_REPLY_TO       = var.email_reply_to
    # SSR runtime has no role credentials, so the SES client uses these explicit
    # keys (non-reserved names; AWS_* env vars are reserved by Lambda).
    SES_REGION              = local.region
    SES_ACCESS_KEY_ID       = aws_iam_access_key.ses_sender.id
    SES_SECRET_ACCESS_KEY   = aws_iam_access_key.ses_sender.secret
    NEXT_TELEMETRY_DISABLED = "1"
  }
}

resource "aws_amplify_domain_association" "main" {
  app_id      = aws_amplify_app.main.id
  domain_name = var.domain_name

  certificate_settings {
    type                   = "CUSTOM"
    custom_certificate_arn = aws_acm_certificate_validation.main.certificate_arn
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }
}

# Keeps the old hostname attached to the app (with its existing cert) so the
# 301 custom rule above can answer it over valid HTTPS.
resource "aws_amplify_domain_association" "legacy" {
  app_id      = aws_amplify_app.main.id
  domain_name = var.legacy_domain_name

  certificate_settings {
    type                   = "CUSTOM"
    custom_certificate_arn = var.legacy_certificate_arn
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }
}

locals {
  # Amplify reports each sub_domain's DNS target as "<prefix> CNAME <host>";
  # pull out the CloudFront hostname for the apex entry.
  apex_dns_record = one([for s in aws_amplify_domain_association.main.sub_domain : s.dns_record if s.prefix == ""])
  apex_cloudfront = element(split(" ", local.apex_dns_record), length(split(" ", local.apex_dns_record)) - 1)
}

# The apex can't be a CNAME, so alias straight to the app's CloudFront
# distribution. Z2FDTNDATAQYW2 is CloudFront's fixed hosted zone ID.
resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = local.apex_cloudfront
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["${var.github_branch}.${aws_amplify_app.main.id}.amplifyapp.com"]
}

resource "aws_route53_record" "legacy" {
  zone_id = data.aws_route53_zone.legacy.zone_id
  name    = var.legacy_domain_name
  type    = "CNAME"
  ttl     = 300
  records = ["${var.github_branch}.${aws_amplify_app.main.id}.amplifyapp.com"]
}
