variable "app_name" {
  type    = string
  default = "amen-circle"
}

variable "domain_name" {
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

# ACM cert ARN that covers var.domain_name. Reuse the existing
# *.ihs.technology cert from the portfolio project if it has SANs that
# include amen.ihs.technology, otherwise request a new one in us-east-1.
variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1 covering the domain"
}
