import os 

import dotenv
import psycopg
import google.cloud.bigquery as bigquery

from pathlib import Path

BASE = Path(__file__).resolve().parent.parent.parent   # pipeline/ 경로

dotenv.load_dotenv(BASE / ".env")
dotenv.load_dotenv(BASE / (".env.production" if os.getenv("ENV") == "production" else ".env.development"))

def bigquery_connection_test():
    # bigquer 클라이언트 생성
    client = bigquery.Client()
    print(f"project: {client.project}")

    query_job = client.query("SELECT 1 AS ok")  # 테이블 참조 없는 쿼리
    rows = query_job.result()                   # 쿼리 완료 대기

    for row in rows:
        print(f"BigQuery 연결 OK — project: {client.project}, result: {row.ok}")
    

def test_list_resources():
    """
    bigquery 클라이언트를 생성하고, 프로젝트의 데이터셋과 테이블을 나열하는 예제입니다.
     - 프로젝트에 데이터셋이 없으면 "데이터셋 없음 (새 프로젝트)" 메시지를 출력하고, 기본 데이터셋을 생성합니다.
     - 각 데이터셋과 해당 데이터셋의 테이블을 나열합니다.
     - 이 예제는 BigQuery 클라이언트가 올바르게 인증되고 프로젝트에 액세스할 수 있는지
    """
    client = bigquery.Client()
    print(f"project: {client.project}")

    datasets = list(client.list_datasets())
    if not datasets:
        print("데이터셋 없음 (새 프로젝트)")

        # 기본 데이터 셋 생성
        dataset_id = f"{client.project}.test_dataset"
        test_create_dataset(client, dataset_id, datasets)

        # 기본 데이터 테이블 생성
        table_id = f"{dataset_id}.test_table"
        test_create_table(client, table_id)

    print(f"데이터셋 {len(datasets)}개:")
    for ds in datasets:
        tables = list(client.list_tables(ds.dataset_id))
        print(f"  - {ds.dataset_id} (테이블 {len(tables)}개)")
        for t in tables:
            print(f"      - {t.table_id}")


def test_create_dataset(client, dataset_id, datasets):
    new_dataset = bigquery.Dataset(dataset_id)

    dataset = client.create_dataset(dataset=new_dataset, exists_ok=True, timeout=30)
    datasets.append(dataset)
    print("Created Default dataset {}.{}".format(client.project, dataset.dataset_id))

def test_create_table(client, table_id):
    schema = [
            bigquery.SchemaField("id", "INTEGER", mode="REQUIRED"),
            bigquery.SchemaField("name", "STRING", mode="REQUIRED"),
        ]
    table = bigquery.Table(table_id, schema=schema)
    table = client.create_table_from_ddl(table, exists_ok=True, timeout=30)
    print(
        "Created table {}.{}.{}".format(table.project, table.dataset_id, table.table_id)
    )


def connection_test(db_url):
    with psycopg.connect(db_url) as conn:
        
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print(f"PostgreSQL version: {version[0]}")

def postgres_connection_test(db_url):    
    with psycopg.connect(db_url) as conn:
        
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM activity_log;")
            rows = cur.fetchall()
            print(f"Number of rows in activity_log: {len(rows)}")
            for row in rows:
                print(row)


if __name__ == "__main__":
    bigquery_connection_test()
    test_list_resources()