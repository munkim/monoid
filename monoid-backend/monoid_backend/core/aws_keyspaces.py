import boto3
from ssl import SSLContext, PROTOCOL_TLSv1_2 , CERT_REQUIRED
from cassandra_sigv4.auth import SigV4AuthProvider
from cassandra import ConsistencyLevel
from cassandra.cluster import Cluster, Session, ExecutionProfile, EXEC_PROFILE_DEFAULT

def get_cluster():
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

async def get_cassandra_session() -> Session:
    cluster = get_cluster()
    session = cluster.connect()
    yield session

