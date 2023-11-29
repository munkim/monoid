output "lambda_function_name" {
  value = module.monoid_lambda_staging.lambda_function_name
}

output "lambda_function_arn" {
  value = module.monoid_lambda_staging.lambda_function_arn
}

output "lambda_function_invoke_arn" {
  value = module.monoid_lambda_staging.lambda_function_invoke_arn
}

output "lambda_function_version" {
  value = module.monoid_lambda_staging.lambda_function_version
}

output "lambda_function_last_modified" {
  value = module.monoid_lambda_staging.lambda_function_last_modified
}

output "lambda_function_environment" {
  value = module.monoid_lambda_staging.lambda_function_environment
  sensitive = true
}

output "lambda_function_url" {
  value = module.monoid_lambda_staging.lambda_function_url
}