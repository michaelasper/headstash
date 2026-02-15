variable "aws_region" {
  type        = string
  description = "AWS region for staging deployment"
  default     = "us-east-1"
}

variable "enable_staging_ingress" {
  type        = bool
  description = "Enable ALB + Route53 staging ingress resources"
  default     = false
}

variable "staging_name_prefix" {
  type        = string
  description = "Resource name prefix for staging ingress resources"
  default     = "headstash-staging"
}

variable "staging_vpc_id" {
  type        = string
  description = "VPC ID used by staging ALB target group"
  default     = ""
}

variable "staging_public_subnet_ids" {
  type        = list(string)
  description = "Public subnets where staging ALB should be placed"
  default     = []
}

variable "staging_alb_security_group_ids" {
  type        = list(string)
  description = "Security group IDs for staging ALB"
  default     = []
}

variable "staging_target_attachment_ids" {
  type        = list(string)
  description = "Optional target IDs to attach directly to the ALB target group"
  default     = []
}

variable "staging_target_port" {
  type        = number
  description = "Target group port for staging app traffic"
  default     = 3000
}

variable "staging_health_check_path" {
  type        = string
  description = "Health check path for ALB target group"
  default     = "/api/health"
}

variable "staging_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for staging HTTPS listener"
  default     = ""
}

variable "staging_route53_zone_id" {
  type        = string
  description = "Route53 hosted zone ID for staging hostname alias"
  default     = ""
}

variable "staging_hostname" {
  type        = string
  description = "Route53 DNS hostname for staging ingress"
  default     = "staging.headstash.app"
}

variable "staging_create_ipv6_alias" {
  type        = bool
  description = "Create AAAA Route53 alias for staging host"
  default     = true
}

variable "staging_alb_deletion_protection" {
  type        = bool
  description = "Enable deletion protection on staging ALB"
  default     = false
}
