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
