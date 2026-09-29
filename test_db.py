import psycopg2
import sys

def test_conn(host, password, project_ref):
    try:
        conn = psycopg2.connect(
            host=host,
            port=6543,
            dbname='postgres',
            user=f'postgres.{project_ref}',
            password=password,
            connect_timeout=3
        )
        print(f"SUCCESS: {host}")
        conn.close()
        return True
    except Exception as e:
        print(f"FAILED: {host} - {e}")
        return False

password = "XW$3n#%3B5ChZAn"
project_ref = "asavluxbedcnygttugdu"

regions = [
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-0-eu-west-2.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-us-west-2.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-ap-southeast-2.pooler.supabase.com",
    "aws-0-ap-northeast-1.pooler.supabase.com",
]

for region in regions:
    if test_conn(region, password, project_ref):
        break
