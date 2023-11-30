import boto3
from typing import List
from ssl import SSLContext, PROTOCOL_TLSv1_2 , CERT_REQUIRED
from cassandra_sigv4.auth import SigV4AuthProvider
from cassandra import ConsistencyLevel
from cassandra.cluster import Cluster, Session, ExecutionProfile, EXEC_PROFILE_DEFAULT
from monoid_backend.config import settings

def get_aws_keyspaces_cluster():
    profile = ExecutionProfile(
        consistency_level=ConsistencyLevel.LOCAL_QUORUM
    )
    ssl_context = SSLContext(PROTOCOL_TLSv1_2)
    ssl_context.load_verify_locations('monoid_backend/core/secret/sf-class2-root.crt')
    ssl_context.verify_mode = CERT_REQUIRED
    
    boto_session = boto3.Session()
    auth_provider = SigV4AuthProvider(boto_session)
    return Cluster(
        ['cassandra.us-east-1.amazonaws.com'], 
        execution_profiles={EXEC_PROFILE_DEFAULT: profile},
        ssl_context=ssl_context, 
        auth_provider=auth_provider,
        port=9142
    )

def get_cassandra_cluster(hosts: List[str], port: str) -> Cluster:
    return Cluster(
        [hosts],
        port=port
    )


async def get_cassandra_session() -> Session:
    # Production uses AWS Keyspaces
    if settings.CASSANDRA_HOST != "" and settings.CASSANDRA_PORT != "":
        cluster = get_cassandra_cluster(settings.CASSANDRA_HOST, settings.CASSANDRA_PORT)
    else:
        cluster = get_aws_keyspaces_cluster()
    session = cluster.connect()
    
    yield session

