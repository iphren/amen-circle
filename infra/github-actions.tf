# GitHub Actions deploy access (.github/workflows/deploy.yml).
#
# The deploy job SSHes into the EC2 origin server, but its security group
# keeps port 22 closed to the internet. Instead of allowlisting GitHub's vast
# runner IP pool, the job assumes this role via GitHub's OIDC federation (no
# AWS keys stored in GitHub), opens port 22 to the runner's own /32 for the
# duration of the deploy, and revokes the rule in an always() cleanup step.
#
# The role trusts only workflow runs in this repo's "production" environment,
# and its policy can only add/remove ingress rules on the one security group.

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  # AWS validates GitHub's OIDC cert against trusted root CAs and ignores
  # these thumbprints, but the provider API still requires the field.
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
  tags = local.common_tags
}

resource "aws_iam_role" "github_deploy" {
  name = "${var.app_name}-deploy"
  tags = local.common_tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "GitHubActionsProductionDeploys"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          # The deploy job runs with `environment: production`; that (not the
          # branch) is what GitHub encodes in the sub claim.
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:environment:production"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_deploy" {
  name = "ephemeral-ssh-ingress"
  role = aws_iam_role.github_deploy.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "ManageSshIngressOnOriginSg"
      Effect = "Allow"
      Action = [
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
      ]
      Resource = "arn:aws:ec2:${local.region}:${local.account_id}:security-group/${var.origin_security_group_id}"
    }]
  })
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}
