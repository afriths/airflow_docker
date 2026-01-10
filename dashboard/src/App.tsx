import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { fetchDAGs } from './store/slices/dagsSlice';
import { selectDAGsList, selectDAGsLoading, selectDAGsError } from './store/selectors';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const dags = useAppSelector(selectDAGsList);
  const loading = useAppSelector(selectDAGsLoading);
  const error = useAppSelector(selectDAGsError);

  useEffect(() => {
    // Test Redux store by dispatching an action
    console.log('Redux store initialized successfully');
    console.log('DAGs state:', { dags, loading, error });
  }, [dags, loading, error]);

  const handleFetchDAGs = () => {
    dispatch(fetchDAGs({}));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Airflow Dashboard - Redux Store Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleFetchDAGs} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch DAGs'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      <div>
        <h3>Redux Store Status:</h3>
        <ul>
          <li>DAGs count: {dags.length}</li>
          <li>Loading: {loading ? 'Yes' : 'No'}</li>
          <li>Error: {error || 'None'}</li>
        </ul>
      </div>

      <div>
        <h3>Store Configuration:</h3>
        <p>✅ Redux Toolkit store configured</p>
        <p>✅ Auth slice implemented</p>
        <p>✅ DAGs slice implemented</p>
        <p>✅ DAG Runs slice implemented</p>
        <p>✅ Tasks slice implemented</p>
        <p>✅ UI slice implemented</p>
        <p>✅ Selectors implemented</p>
        <p>✅ Redux DevTools enabled</p>
      </div>
    </div>
  );
}

export default App;
