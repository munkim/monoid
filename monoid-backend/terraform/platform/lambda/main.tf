resource "time_static" "newtime" {
  triggers = {
    always_run = timestamp()
  }
}

locals {
  # datetime = formatdate("YYYYMMDD_hhmm", timestamp())
  datetime = formatdate("YYYYMMDD-hhmm", time_static.newtime.rfc3339)
  project_root_path = "../../../../"
  lambda_version = "${var.env}-${local.datetime}"
  secret_username = jsondecode(
    data.aws_secretsmanager_secret_version.creds.secret_string
  ).username
  secret_password = jsondecode(
    data.aws_secretsmanager_secret_version.creds.secret_string
  ).password
}


data "aws_ecr_repository" "monoid_lambda" {
  name = "monoid-lambda"
}

resource "null_resource" "trigger_script" {
  triggers = {
    always_run = timestamp()
  }
  provisioner "local-exec" {
    command = "invoke build-container -p ${local.project_root_path} -e ${data.aws_ecr_repository.monoid_lambda.repository_url} -v ${local.lambda_version}"
  }
}


resource "aws_lambda_function" "monoid_backend_lambda" {
  function_name = "${var.env}-monoid-backend-lambda"

  timeout       = 300 # seconds
  image_uri     = "${data.aws_ecr_repository.monoid_lambda.repository_url}:${local.lambda_version}"
  package_type  = "Image"

  role = aws_iam_role.monoid_backend_lambda.arn
  memory_size = 2000 # MB
  
  environment {
    variables = {
      # Base
      VERSION                   = local.lambda_version,
      DOCS_URL                  = var.docs_url,
      MONOID_ENVIRONMENT        = var.env,
      
      # Encoding / Decoding
      JWT_HASH_ALGORITHM        = var.jwt_hash_algorithm,
      JWT_SECRET_KEY            = var.jwt_secret_key,

      # External APIs
      OPENAI_API_KEY            = var.openai_api_key
      SENTRY_DSN                = var.sentry_dsn,

      # Google OAuth
      GOOGLE_OAUTH_CLIENT_ID      = var.google_oauth_client_id,
      GOOGLE_OAUTH_CLIENT_SECRET  = var.google_oauth_client_secret,
      GOOGLE_OAUTH_REDIRECT_URI   = var.google_oauth_redirect_uri,

      # Database
      DB_ENDPOINT               = data.terraform_remote_state.rds.outputs.rds_proxy_endpoint,
      DB_PORT                   = data.terraform_remote_state.rds.outputs.rds_port,
      DB_USERNAME               = local.secret_username,
      DB_PASSWORD               = local.secret_password,
      DB_NAME                   = data.terraform_remote_state.rds.outputs.rds_database_name,

      # Optional: AWS Eventbridge
      AWS_ACCOUNT_ID            = data.aws_caller_identity.current.account_id,

      # For Lambda Web Adapter (LWA)
      AWS_LWA_INVOKE_MODE       = "RESPONSE_STREAM",
      AWS_LWA_PORT              = 8080,

      # For Eventbridge, hacky way to get the ARN of the lambda function (since self-reference is not allowed)
      LAMBDA_FUNCTION_INVOKE_ARN        = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:530558162619:function:${var.env}-monoid-backend-lambda/invocations",
      MONOID_AWS_EVENTBRIDGE_ROLE_ARN   = data.terraform_remote_state.eventbridge_role.outputs.aws_iam_role_arn,
    }
  }

  tags = {
    Name        = "monoid-backend-lambda"
    Environment = var.env
    UpdatedAt   = local.datetime
    Origin      = "monoid-backend/terraform_lambda/platform/lambda/main.tf"
  }

  vpc_config {
    security_group_ids = [data.terraform_remote_state.rds.outputs.lambda_rds_access_security_group_id]
    subnet_ids         = slice(data.terraform_remote_state.vpc.outputs.public_subnets, 0, 3)
  }

  depends_on = [ null_resource.trigger_script ]
}


resource "aws_cloudwatch_log_group" "monoid_backend_lambda" {
  name = "/aws/lambda/${aws_lambda_function.monoid_backend_lambda.function_name}"
  retention_in_days = 30
}


resource "aws_lambda_function_url" "monoid_backend_lambda_url" {
  function_name      = aws_lambda_function.monoid_backend_lambda.function_name
  authorization_type = "NONE"
  invoke_mode        = "RESPONSE_STREAM"
}