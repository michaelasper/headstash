output "staging_alb_dns_name" {
  description = "ALB DNS name for staging ingress"
  value       = try(module.staging_ingress[0].alb_dns_name, null)
}

output "staging_alb_zone_id" {
  description = "ALB hosted zone id for Route53 alias"
  value       = try(module.staging_ingress[0].alb_zone_id, null)
}

output "staging_target_group_arn" {
  description = "Target group ARN for staging service wiring"
  value       = try(module.staging_ingress[0].target_group_arn, null)
}

output "staging_route53_record_fqdn" {
  description = "Route53 alias fqdn for staging host"
  value       = try(module.staging_ingress[0].route53_record_fqdn, null)
}
