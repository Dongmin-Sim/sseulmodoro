from typing import List
import google.cloud.bigquery as bigquery

def get_bigquery_client():
    return bigquery.Client()

def create_dataset(client, new_dataset_id):
    new_dataset = bigquery.Dataset(new_dataset_id)

    dataset = client.create_dataset(
        dataset=new_dataset, 
        exists_ok=True, 
        timeout=30)
    print("Created dataset {}.{}".format(client.project, dataset.new_dataset_id))

def create_table(client, new_table_id, schema):
    table_obj = bigquery.Table(new_table_id, schema=schema)
    table = client.create_table(table_obj, exists_ok=True, timeout=30)
    print(
        "Table Created: {}.{}.{}".format(table.project, table.dataset_id, table.table_id)
    )
