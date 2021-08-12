
terraform {
  required_version = "0.13.2"
  backend "s3" {
    region         = "ap-southeast-2"
    key            = "covcough/terraform.tfstate"
    bucket         = "san-acloud"
  }
}

