variable "environment" {
  description = "Environment name used for tags and naming"
  type        = string
}

variable "name_prefix" {
  description = "Resource name prefix override (defaults to headstash-<environment>)"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "VPC ID for ALB target group"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB placement"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security groups attached to the ALB"
  type        = list(string)
  default     = []
}

variable "internal" {
  description = "Whether the ALB is internal"
  type        = bool
  default     = false
}

variable "enable_deletion_protection" {
  description = "Enable ALB deletion protection"
  type        = bool
  default     = false
}

variable "idle_timeout" {
  description = "ALB idle timeout in seconds"
  type        = number
  default     = 60
}

variable "target_type" {
  description = "Target group target type"
  type        = string
  default     = "ip"

  validation {
    condition     = contains(["instance", "ip", "lambda", "alb"], var.target_type)
    error_message = "target_type must be one of instance, ip, lambda, or alb."
  }
}

variable "target_port" {
  description = "Target group port"
  type        = number
  default     = 3000
}

variable "target_protocol" {
  description = "Target group protocol"
  type        = string
  default     = "HTTP"

  validation {
    condition     = contains(["HTTP", "HTTPS"], var.target_protocol)
    error_message = "target_protocol must be HTTP or HTTPS."
  }
}

variable "health_check_path" {
  description = "HTTP health check path"
  type        = string
  default     = "/api/health"
}

variable "health_check_matcher" {
  description = "Allowed HTTP code matcher for health check"
  type        = string
  default     = "200-399"
}

variable "target_attachment_ids" {
  description = "Optional target IDs to pre-attach to target group"
  type        = list(string)
  default     = []
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener (optional)"
  type        = string
  default     = ""
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for staging alias record (optional)"
  type        = string
  default     = ""
}

variable "record_name" {
  description = "Route53 DNS record name for staging"
  type        = string
  default     = "staging.headstash.app"
}

variable "create_ipv6_alias" {
  description = "Whether to create AAAA alias alongside A record"
  type        = bool
  default     = true
}
