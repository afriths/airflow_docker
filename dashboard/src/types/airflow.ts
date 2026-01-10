/**
 * Airflow API Response Types
 * Based on Airflow REST API v2 specifications
 */

// Core Airflow entities
export type TaskState = 
  | 'success' 
  | 'failed' 
  | 'running' 
  | 'queued' 
  | 'skipped' 
  | 'up_for_retry' 
  | 'up_for_reschedule' 
  | 'upstream_failed' 
  | 'deferred' 
  | 'removed';

export type DAGRunState = 
  | 'success' 
  | 'failed' 
  | 'running' 
  | 'queued';

export type DAGRunType = 
  | 'manual' 
  | 'scheduled' 
  | 'dataset_triggered' 
  | 'backfill';

// Schedule interval types
export interface ScheduleInterval {
  __type: 'CronExpression' | 'TimeDelta' | 'DatasetSchedule';
  value: string | number | object;
}

export interface Tag {
  name: string;
  color?: string;
}

// DAG API Response
export interface AirflowDAGResponse {
  dag_id: string;
  root_dag_id: string | null;
  is_paused: boolean;
  is_subdag: boolean;
  fileloc: string;
  file_token: string;
  owners: string[];
  description: string | null;
  schedule_interval: ScheduleInterval | null;
  tags: Tag[];
  catchup: boolean;
  orientation: string;
  concurrency: number;
  start_date: string | null;
  end_date: string | null;
  max_active_runs: number;
  max_active_tasks: number;
  has_task_concurrency_limits: boolean;
  has_import_errors: boolean;
  next_dagrun: string | null;
  next_dagrun_data_interval_start: string | null;
  next_dagrun_data_interval_end: string | null;
  next_dagrun_create_after: string | null;
}

// DAG Run API Response
export interface AirflowDAGRunResponse {
  dag_run_id: string;
  dag_id: string;
  logical_date: string;
  execution_date: string;
  start_date: string | null;
  end_date: string | null;
  data_interval_start: string | null;
  data_interval_end: string | null;
  last_scheduling_decision: string | null;
  run_type: DAGRunType;
  state: DAGRunState;
  external_trigger: boolean;
  triggered_by: string | null;
  conf: object | null;
  note: string | null;
}

// Task Instance API Response
export interface AirflowTaskInstanceResponse {
  task_id: string;
  dag_id: string;
  dag_run_id: string;
  execution_date: string;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  state: TaskState | null;
  try_number: number;
  max_tries: number;
  hostname: string | null;
  unixname: string | null;
  pool: string;
  pool_slots: number;
  queue: string | null;
  priority_weight: number;
  operator: string;
  queued_dttm: string | null;
  pid: number | null;
  executor_config: object | null;
  sla_miss: object | null;
  rendered_fields: object | null;
  trigger: object | null;
  triggerer_job: object | null;
  note: string | null;
}

// Collection responses
export interface AirflowDAGCollection {
  dags: AirflowDAGResponse[];
  total_entries: number;
}

export interface AirflowDAGRunCollection {
  dag_runs: AirflowDAGRunResponse[];
  total_entries: number;
}

export interface AirflowTaskInstanceCollection {
  task_instances: AirflowTaskInstanceResponse[];
  total_entries: number;
}

// Error response
export interface AirflowErrorResponse {
  detail: string;
  status: number;
  title: string;
  type: string;
}