import os   

import psycopg
import dotenv

# gcp 관련 라이브러리 설치
# gcp 관련 환경변수 설정
# 환경 변수에 따라서 분기. 
dotenv.load_dotenv(".env.development")
DATABASE_URL = os.getenv("DATABASE_URL")

def connection_test():
    with psycopg.connect(DATABASE_URL) as conn:
        
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print(f"PostgreSQL version: {version[0]}")

def postgres_connection_test():    
    with psycopg.connect(DATABASE_URL) as conn:
        
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM activity_log;")
            rows = cur.fetchall()
            print(f"Number of rows in activity_log: {len(rows)}")
            for row in rows:
                print(row)

def etl_process():
    # extract: supabase 에서 데이터 가져오기 

    # load: supabase 에서 가져온 데이터를 gcp bigquery에 적재하기.

    # transform: gcp bigquery에 적재후 전처리 하기
    pass


if __name__ == "__main__":
    connection_test()
    postgres_connection_test()