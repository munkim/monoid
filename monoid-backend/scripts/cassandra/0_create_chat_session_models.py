"""
Script to create tables on ScyllaDB (Cassandra)
"""
import os
import boto3
from pprint import pprint 
from cassandra.cluster import Cluster, ExecutionProfile, EXEC_PROFILE_DEFAULT
from ssl import SSLContext, PROTOCOL_TLSv1_2 , CERT_REQUIRED
from cassandra_sigv4.auth import SigV4AuthProvider
from cassandra import ConsistencyLevel


from monoid_backend.config import settings
from monoid_backend.core.cassandra import get_cassandra_cluster

if settings.CASSANDRA_HOST != "" and settings.CASSANDRA_PORT != "":
    cluster = get_cassandra_cluster(settings.CASSANDRA_HOST, settings.CASSANDRA_PORT)
    session = cluster.connect()
else:
    raise Exception('CASSANDRA_HOST and CASSANDRA_PORT must be set in .env')

print('Creating a keyspace...')
session.execute(
    "CREATE KEYSPACE IF NOT EXISTS monoid WITH REPLICATION = { \
        'class' : 'SimpleStrategy' \
    };"
)
print('Successfully created a keyspace!')


print('\nCreating Tables')
session.execute(
    """
    CREATE TABLE IF NOT EXISTS monoid.chat_session (
        chat_session_uuid UUID,
        account_uuid UUID,
        agent_id INT,
        title TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        is_scheduled BOOLEAN,
        PRIMARY KEY ((account_uuid, agent_id), chat_session_uuid)
    ); 
    """
)
print('Successfully created a table called chat_session')

session.execute(
    """
    CREATE TABLE IF NOT EXISTS monoid.chat_message (
        chat_session_uuid UUID,
        message_uuid UUID,
        account_uuid UUID,
        agent_id INT,
        role TEXT, 
        content TEXT, 
        message_type TEXT, 
        action_name TEXT, 
        content_length INT,
        action_type TEXT,
        message_author_name TEXT,
        message_author_type TEXT,
        nesting_level INT,
        created_at TIMESTAMP,
        PRIMARY KEY (chat_session_uuid, created_at)
    ) WITH CLUSTERING ORDER BY (created_at ASC);
    """
)
print('Successfully created a table called chat_message')
