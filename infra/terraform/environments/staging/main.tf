module "networking" {
  source      = "../../modules/networking"
  environment = "staging"
  cidr_block  = "10.20.0.0/16"
}

module "app_runtime" {
  source      = "../../modules/app_runtime"
  environment = "staging"
  image_tag   = "latest"
}

module "state_backend" {
  source      = "../../modules/state_backend"
  environment = "staging"
}

module "staging_ingress" {
  count = var.enable_staging_ingress ? 1 : 0

  source      = "../../modules/staging_ingress"
  environment = "staging"

  name_prefix                = var.staging_name_prefix
  vpc_id                     = var.staging_vpc_id
  public_subnet_ids          = var.staging_public_subnet_ids
  security_group_ids         = var.staging_alb_security_group_ids
  target_attachment_ids      = var.staging_target_attachment_ids
  target_port                = var.staging_target_port
  health_check_path          = var.staging_health_check_path
  certificate_arn            = var.staging_certificate_arn
  route53_zone_id            = var.staging_route53_zone_id
  record_name                = var.staging_hostname
  create_ipv6_alias          = var.staging_create_ipv6_alias
  enable_deletion_protection = var.staging_alb_deletion_protection
}
