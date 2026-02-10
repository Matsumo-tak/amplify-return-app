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
      gap: '2rem',
      padding: '1rem'
    }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', textAlign: 'center' }}>IVS配信アプリ</h1>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
        maxWidth: '400px'
      }}>
        <Link to="/host" style={{ textDecoration: 'none' }}>
          <button style={{ 
            width: '100%',
            padding: '1rem 2rem', 
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}>
            配信者として参加
          </button>
        </Link>
        <Link to="/viewer" style={{ textDecoration: 'none' }}>
          <button style={{ 
            width: '100%',
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
