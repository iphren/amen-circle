output "amplify_app_id" {
  value = aws_amplify_app.main.id
}

output "amplify_default_url" {
  value = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.main.default_domain}"
}

output "custom_domain_url" {
  value = "https://${var.domain_name}"
}

# Pre-cutover test hostname for the EC2-backed stack (add it temporarily to
# the nginx server_name to smoke-test end to end before touching DNS).
output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "legacy_redirect_domain_name" {
  value = aws_cloudfront_distribution.legacy_redirect.domain_name
}
