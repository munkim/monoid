output "lambda_function_name" {
  value = aws_lambda_function.monoid_backend_lambda.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.monoid_backend_lambda.arn
}

output "lambda_function_invoke_arn" {
  value = aws_lambda_function.monoid_backend_lambda.invoke_arn
}

output "lambda_function_version" {
  value = aws_lambda_function.monoid_backend_lambda.version
}

output "lambda_function_last_modified" {
  value = aws_lambda_function.monoid_backend_lambda.last_modified
}

output "lambda_function_environment" {
  value = aws_lambda_function.monoid_backend_lambda.environment
  sensitive = true
}

output "lambda_function_url" {
  value = aws_lambda_function_url.monoid_backend_lambda_url.function_url
}