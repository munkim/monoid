# Monoid Backend 

## 🌱 QuickSetup Guide

### Prerequisites
- Postgres 15+
- Cassandra (AWS Keyspaces)
- Python 3.8+
- Poetry (Python library)

### Local Env Setup 
0. Install local version of Postgres. For simplicity and safety, we recommend using Docker. 

    If using Docker: 

    ```
    docker run --name monoid-postgres -p 5432:5432 -e POSTGRES_PASSWORD=pgpassword -d postgres
    ```

1. Add cassandra related certificates (`global-bundle.pem` and `sf-class2-root.crt`) under `monoid_backend/core/secret/`. Those certificates can be acquired from AWS Keyspaces.

    Note: If using other services such as ScyllaDB, DataStax, or even a local instance, you may want to change `get_cluster()` function in [monoid_backend/core/aws_keyspaces.py](monoid_backend/core/aws_keyspaces.py).

2. Copy `.env.example` with a name `.env`.
    ```
    cp .env.example .env
    ```
3. Change all values in `.env`.
4. Install dependencies using [Poetry](https://python-poetry.org/docs/).
    ```
    poetry install
    ```

### Run server
```
poetry run uvicorn monoid_backend.main:app --port 8080 --reload
```

## 💽 Postgres DB Migrations (using Alembic)
When creating a new or making changes to an existing RDB model, you would need to migrate your database.


1. Create your migration version

    Option 1: Automatically create new revisions.
    ```
    alembic revision -- autogenerate -m "COMMIT MESSAGE"
    ```

    Option 2: Write a custom migrations (manually edit `upgrade()` and `downgrade()`)

    ```
    alembic revision -m "COMMIT MESSAGE"
    ```

2. Upgrade to your latest version
    ```
    alembic upgrade head
    ```

For more info, please refer to [Alembic's doc](https://alembic.sqlalchemy.org/en/latest/).

## 🗒️ Documentation
Coming soon.
