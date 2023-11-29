import json
import gzip
import jwt

from monoid_backend.config import settings

def encode_json(data):
    # Encode the compressed data as a JWT
    encoded_data = jwt.encode(data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_HASH_ALGORITHM)

    return encoded_data


def decode_json(encoded_data):
    # Decode the JWT and get the compressed data
    decoded_data = jwt.decode(encoded_data, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_HASH_ALGORITHM])

    return decoded_data
