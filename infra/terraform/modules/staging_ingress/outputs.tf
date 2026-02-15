output "alb_arn" {
  description = "Staging ALB ARN"
  value       = aws_lb.this.arn
}

output "alb_dns_name" {
  description = "Staging ALB DNS name"
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID exposed by the ALB"
  value       = aws_lb.this.zone_id
}

output "target_group_arn" {
  description = "Target group ARN for staging service attachments"
  value       = aws_lb_target_group.app.arn
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "HTTPS listener ARN when certificate is configured"
  value       = try(aws_lb_listener.https[0].arn, null)
}

output "route53_record_fqdn" {
  description = "Route53 alias FQDN if zone id was provided"
  value       = try(aws_route53_record.staging_alias_a[0].fqdn, null)
}
