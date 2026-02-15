output "state_key" {
  value       = "${var.environment}/terraform.tfstate"
  description = "Recommended state key path"
}
