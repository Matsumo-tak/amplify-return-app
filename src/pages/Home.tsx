import { Link } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

function Home() {
  const { signOut } = useAuthenticator();

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '2rem'
    }}>
      <h1>IVS配信アプリ</h1>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/host">
          <button style={{ 
            padding: '1rem 2rem', 
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}>
            配信者として参加
          </button>
        </Link>
        <Link to="/viewer">
          <button style={{ 
            padding: '1rem 2rem', 
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}>
            視聴者として参加
          </button>
        </Link>
      </div>
      <button onClick={signOut} style={{ marginTop: '2rem' }}>
        Sign out
      </button>
    </main>
  );
}

export default Home;
