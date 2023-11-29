data "terraform_remote_state" "vpc" {
  backend = "s3"

  config = {
    bucket          = "monoid-terraform"
    key             = var.vpc_tfstate_key
    region          = "us-east-1"
    dynamodb_table  = "terraform_statelock"
  }
}

data "terraform_remote_state" "rds" {
  backend = "s3"

  config = {
    bucket          = "monoid-terraform"
    key             = var.rds_tfstate_key
    region          = "us-east-1"
    dynamodb_table  = "terraform_statelock"
  }
}

data "terraform_remote_state" "eventbridge_role" {
  backend = "s3"

  config = {
    bucket          = "monoid-terraform"
    key             = var.eventbridge_tfstate_key
    region          = "us-east-1"
    dynamodb_table  = "terraform_statelock"
  }
}

data "aws_secretsmanager_secret_version" "creds" {
  secret_id = data.terraform_remote_state.rds.outputs.rds_secret_id
}

data "aws_caller_identity" "current" {}