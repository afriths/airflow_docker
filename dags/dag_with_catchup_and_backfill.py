from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

default_args = {
    'owner': 'afrith',
    'retries': 5,
    'retry_delay': timedelta(minutes=2)
}

with DAG(
    dag_id='dag_with_catchup_and_backfill_v02',
    default_args=default_args,
    description='DAG with catchup and backfill example',
    start_date=datetime(2025, 12, 21),
    schedule='@daily',
    catchup=True
) as dag:
    task1= BashOperator(
        task_id='task1',
        bash_command="echo This is a simple bash command!"
    )
