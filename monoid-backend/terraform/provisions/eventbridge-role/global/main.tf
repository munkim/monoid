terraform {
  backend "s3" {
    bucket         = "monoid-terraform"
    key            = "eventbridge-role/global/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform_statelock"
    profile        = "monoid"
  }
}


provider "aws" {
  region = "us-east-1"
  profile = "monoid"

  default_tags {
    tags = {
      Owner = "Monoid"
    }
  }
}


module "monoid_eventbridge_role_global" {
  source        = "../../../platform/eventbridge-role"
  env           = "global"
}