from datetime import datetime, timedelta
from airflow import DAG

from airflow.operators.bash import BashOperator

default_args = {
    'owner':"afrith",
    'retries':5,
    'retry_delay':timedelta(minutes=5)
}

with DAG(
    dag_id='dag_with_cron_expression_v04',
    default_args=default_args,
    start_date=datetime(2025, 12, 16),
    schedule='0 3 * * Tue',
    catchup=True
) as dag:
    task1 = BashOperator(
        task_id='task1',
        bash_command="echo dag with cron expression!"
    )
    task1