from invoke import task, Collection
import os
from datetime import datetime

# Directory to be zipped in the first step
dependencies_path = ".venv/lib/python3.9/site-packages"
versions_dir = "lambda_versions/test"
app_path = "monoid_backend"
zip_version_filename = f"monoid_lambda_{datetime.now().strftime('%Y%m%d_%H%m')}.zip"
project_root_path = '.'
output_path = os.path.join(versions_dir, zip_version_filename)
aws_account_url = "530558162619.dkr.ecr.us-east-1.amazonaws.com"
ecr_repo_url = f"{aws_account_url}/monoid_lambda"

@task
def build_zip(c, project_root_path=project_root_path, app_path=app_path, dependencies_path=dependencies_path, output_path=output_path):
    project_root_abspath = os.path.abspath(project_root_path)
    versions_dir = os.path.dirname(output_path)
    full_versions_dirpath = os.path.join(project_root_abspath, versions_dir)
    full_output_path = os.path.join(project_root_abspath, output_path)
    if not os.path.exists(full_versions_dirpath): os.makedirs(full_versions_dirpath)
    if os.path.exists(full_output_path): os.remove(full_output_path)

    full_dependencies_path = os.path.join(project_root_abspath, dependencies_path)
    full_app_path = os.path.join(project_root_abspath, app_path)
    c.run(f"cd {full_dependencies_path} && zip -r9 -q {full_output_path} . -x *__pycache__* && cd -")
    c.run(f"cd {project_root_abspath} && zip -g {full_output_path} -r {app_path} -x *__pycache__* && cd -")
    c.run(f"zip -g {full_output_path} -r {full_app_path}/* -x *__pycache__* ")


@task
def build_container(
    c, 
    project_root_path=project_root_path, 
    ecr_repo_url=ecr_repo_url,
    version='latest',
    aws_account_url=aws_account_url,
):
    project_root_abspath = os.path.abspath(project_root_path)
    print(ecr_repo_url)
    c.run(
        f"""
        cd {project_root_abspath} && 
        poetry export --without-hashes --format=requirements.txt -o _poetry_generated_requirements.txt &&
        docker buildx build \
            --platform linux/amd64 \
            -t {ecr_repo_url}:{version} \
            -f ./Dockerfile . \
            --load && \
        aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin {aws_account_url} && \
        docker push {ecr_repo_url}:{version}
        """
    )
