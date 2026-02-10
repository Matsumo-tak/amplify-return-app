import { useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';

function Viewer() {
  const { signOut } = useAuthenticator();
  const navigate = useNavigate();

  return (
    <main>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')}>← ホームに戻る</button>
      </div>
      <h1>視聴者モード</h1>
      <p>視聴者用の機能はこれから実装します</p>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default Viewer;
