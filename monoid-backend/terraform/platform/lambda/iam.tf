locals {
  account_id = data.aws_caller_identity.current.account_id
}

resource "aws_iam_role" "monoid_backend_lambda" {
  name = "${var.env}-monoid-backend-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

# Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_execution_policy" {
  role       = aws_iam_role.monoid_backend_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


data "aws_iam_policy_document" "lambda_rds_policy" {
  statement {
    effect = "Allow"
    actions = [
      "rds-db:connect"
    ]
    resources = [
      "arn:aws:rds-db:${var.aws_region}:${local.account_id}:dbuser:${data.terraform_remote_state.rds.outputs.rds_proxy_arn}/*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = [
      "*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "cassandra:*"
    ]
    resources = [
      "*"
    ]
  }
}


resource "aws_iam_policy" "lambda_db_policy" {
  name = "${var.env}-lambda-db-policy"
  policy = data.aws_iam_policy_document.lambda_rds_policy.json
}

# Lambda 
resource "aws_iam_role_policy_attachment" "lambda_db_policy" {
  role       = aws_iam_role.monoid_backend_lambda.name
  policy_arn = aws_iam_policy.lambda_db_policy.arn
}