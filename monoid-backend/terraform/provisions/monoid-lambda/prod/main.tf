terraform {
  backend "s3" {
    bucket         = "monoid-terraform"
    key            = "monoid-lambda/prod/terraform.tfstate"
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

module "monoid_lambda_prod" {
  source        = "../../../platform/lambda"
  env           = "prod"
  jwt_secret_key = var.jwt_secret_key
  vpc_tfstate_key = "vpc/prod/terraform.tfstate"
  rds_tfstate_key = "rds/prod/terraform.tfstate"
  eventbridge_tfstate_key = "eventbridge-role/global/terraform.tfstate"
  google_oauth_client_id = var.google_oauth_client_id
  google_oauth_client_secret = var.google_oauth_client_secret
  google_oauth_redirect_uri = var.google_oauth_redirect_uri
  openai_api_key = var.openai_api_key
  sentry_dsn = var.sentry_dsn
  docs_url = var.docs_url
}
