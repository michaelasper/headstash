aws_region = "us-east-1"

# Enable once VPC/subnets/cert/zone are ready for apply.
enable_staging_ingress = false

staging_name_prefix             = "headstash-staging"
staging_vpc_id                  = ""
staging_public_subnet_ids       = []
staging_alb_security_group_ids  = []
staging_target_attachment_ids   = []
staging_target_port             = 3000
staging_health_check_path       = "/api/health"
staging_certificate_arn         = ""
staging_route53_zone_id         = ""
staging_hostname                = "staging.headstash.app"
staging_create_ipv6_alias       = true
staging_alb_deletion_protection = false
