
resource "aws_iam_role" "monoid_eventbridge_lambda" {
  name = "${var.env}-eventbridge-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "scheduler.amazonaws.com"
      }
      }
    ]
  })
}


data "aws_iam_policy_document" "eventbridge_policy" {
  statement {
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction"
    ]
    resources = [
      "arn:aws:lambda:us-east-1:530558162619:function:*",
    ]
  }
}


resource "aws_iam_policy" "eventbridge_policy" {
  name = "${var.env}-eventbridge-lambda-policy"
  policy = data.aws_iam_policy_document.eventbridge_policy.json
}


resource "aws_iam_role_policy_attachment" "eventbridge_policy" {
  role       = aws_iam_role.monoid_eventbridge_lambda.name
  policy_arn = aws_iam_policy.eventbridge_policy.arn
}