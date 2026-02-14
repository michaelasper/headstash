module "networking" {
  source      = "../../modules/networking"
  environment = "prod"
  cidr_block  = "10.30.0.0/16"
}

module "app_runtime" {
  source      = "../../modules/app_runtime"
  environment = "prod"
  image_tag   = "stable"
}

module "state_backend" {
  source      = "../../modules/state_backend"
  environment = "prod"
}
