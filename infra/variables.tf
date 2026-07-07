variable "app_name" {
  type    = string
  default = "amen-circle"
}

variable "domain_name" {
  type    = string
  default = "amencircle.com"
}

# The previous domain, kept attached to the Amplify app only so it can answer
# with a 301 redirect to the new domain.
variable "legacy_domain_name" {
  type    = string
  default = "amen.ihs.technology"
}

variable "github_repo" {
  type        = string
  description = "owner/repo on GitHub, e.g. iphren/amen-circle"
  default     = "iphren/amen-circle"
}

variable "github_branch" {
  type    = string
  default = "main"
}

# ACM cert ARN in us-east-1 covering var.legacy_domain_name (the existing
# *.ihs.technology cert from the portfolio project). Only used to keep the
# legacy redirect domain on HTTPS; the cert for var.domain_name is created by
# Terraform (see aws_acm_certificate.main).
variable "legacy_certificate_arn" {
  type    = string
  default = "arn:aws:acm:us-east-1:387479857085:certificate/322842ee-8a43-4ff9-900a-f72727639f9d"
}

# Stable public DNS name of the EC2 server that hosts the Docker Compose stack
# (CloudFront's custom origin). Either reuse the origin hostname your other
# apps' distributions already point at, or set var.origin_server_ip and use
# "origin.amencircle.com" here (Terraform then creates the A record).
variable "origin_server_domain" {
  type        = string
  description = "Public DNS name of the EC2 origin server (nginx on port 80)"
}

# Elastic IP of the EC2 origin server. When set, Terraform creates an A record
# origin.<domain> pointing at it (see aws_route53_record.origin). Leave empty
# if origin_server_domain is an existing hostname you manage elsewhere.
variable "origin_server_ip" {
  type        = string
  description = "Elastic IP of the EC2 origin server (optional)"
  default     = ""
}

# Security group of the EC2 origin server (the shared, hand-managed
# "websites" SG — the instance itself is not Terraform-managed). The GitHub
# Actions deploy role may add/remove port-22 ingress rules on it; see
# github-actions.tf.
variable "origin_security_group_id" {
  type        = string
  description = "Security group id of the EC2 origin server"
  default     = "sg-000ab36330d861050"
}

# Full RFC 5322 "From" header used for account-recovery emails (may include a
# display name). The address part must belong to the verified SES identity.
variable "email_from" {
  type    = string
  default = "Amen Circle <no-reply@amencircle.com>"
}

# Bare sending address, used to scope the SES IAM policy via the
# ses:FromAddress condition key (which matches the address only, not the
# display name). Keep the address part in sync with var.email_from.
variable "email_from_address" {
  type    = string
  default = "no-reply@amencircle.com"
}

# Physical postal address shown in the footer of transactional emails —
# expected by anti-spam rules. REPLACE the placeholder with the operator's
# registered address (keep in sync with src/lib/legal.ts).
variable "email_postal_address" {
  type    = string
  default = "[REGISTERED ADDRESS]"
}

# Monitored reply address for transactional email. Empty means the app falls
# back to replying to var.email_from.
variable "email_reply_to" {
  type    = string
  default = ""
}
