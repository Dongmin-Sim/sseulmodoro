from google.cloud import bigquery


def read_watermark(client: bigquery.Client, table_name:str) -> int | None:
    sql = f"""
          SELECT watermark_value
          FROM `{client.project}.meta.watermark_store`
          WHERE source_name = @table_name
          ORDER BY marked_at DESC
          LIMIT 1
          """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("table_name", "STRING", table_name),
        ]
    )
    rows = client.query(sql, job_config=job_config).result()
    row = next(iter(rows), None)
    return int(row[0]) if row else None


def update_watermark(client: bigquery.Client, table_name:str, watermark:int) -> None:
    sql = f"""
          INSERT INTO `{client.project}.meta.watermark_store` (source_name, watermark_value)
          VALUES (@table_name, @watermark)
          """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("table_name", "STRING", table_name),
            bigquery.ScalarQueryParameter("watermark", "STRING", str(watermark)),
        ]
    )
    client.query(sql, job_config=job_config).result()
