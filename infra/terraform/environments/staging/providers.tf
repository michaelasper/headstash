provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "headstash"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}
