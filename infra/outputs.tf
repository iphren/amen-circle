output "amplify_app_id" {
  value = aws_amplify_app.main.id
}

output "amplify_default_url" {
  value = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.main.default_domain}"
}

output "custom_domain_url" {
  value = "https://${var.domain_name}"
}
