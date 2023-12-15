# Monoid Backend 

## 🌱 QuickSetup Guide

### Prerequisites
- Postgres 15+
- Cassandra 
- Python 3.8+
- Poetry (Python library)

### Local Env Setup 

#### Postgres Setup
1. Install Postgres. 

    Using Docker (recommended):

    ```
    docker run --name monoid-postgres -p 5432:5432 -e POSTGRES_PASSWORD=pgpassword -d postgres
    ```

#### Cassandra Setup
1. Install Cassandra. 

    Using Docker (recommended):
    ```
    docker run --name cass --network cass-network -d -e CASSANDRA_BROADCAST_ADDRESS=127.0.0.1 -p 9042:9042 cassandra:latest
    ```
    
    Note: Production uses AWS Keyspaces, which requires certificates (`global-bundle.pem` and `sf-class2-root.crt`) under `monoid_backend/core/secret/`. If using other services such as ScyllaDB or DataStax, modify the functions in [monoid_backend/core/cassandra.py](monoid_backend/core/cassandra.py).


#### Docker Compose
Alternatively, you can set up both postgres and Cassandra once using docker-compose, you can run

``` 
docker compose up
 ```

#### Application Setup
1. Copy `.env.example` with a name `.env`.
    ```
    cp .env.example .env
    ```
    
2. Change all values in `.env`.

3. Install dependencies using [Poetry](https://python-poetry.org/docs/).
    ```
    poetry install
    ```

4. Migrate Postgres. (Ensure `.env` is updated.)
    ```
    alembic upgrade head
    ```

5. Migrate Cassandra. (Ensure `.env` is updated.)
    ```
    # Run from monoid/monoid_backend
    python scripts/cassandra/0_create_chat_session_models.py
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
