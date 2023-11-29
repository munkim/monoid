FROM public.ecr.aws/lambda/python:3.9
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.7.1 /lambda-adapter /opt/extensions/lambda-adapter

# Install requirements output by Poetry
# Use PIP instead of Poetry, which failed to build successfully on AWS Lambda
COPY ./_poetry_generated_requirements.txt ./_poetry_generated_requirements.txt
RUN pip install -r ./_poetry_generated_requirements.txt 

COPY ./monoid_backend ./monoid_backend

# AWS Lambda Adapter to enable streaming responses
# CMD ["monoid_backend.main.handler"]
ENTRYPOINT ["python", "-m", "monoid_backend.main"]