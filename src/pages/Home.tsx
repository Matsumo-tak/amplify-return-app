import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

function Home() {
  const { signOut } = useAuthenticator();
  const navigate = useNavigate();
  const [stages, setStages] = useState<{ arn: string; name: string }[]>([]);
  const [selectedArn, setSelectedArn] = useState<string>('');

  // ステージ一覧を取得
  useEffect(() => {
    const fetchStages = async () => {
      const res = await fetch(import.meta.env.VITE_LIST_STAGES_URL);
      const data = await res.json();
      const list = data.stages || [];
      setStages(list);
      if (list.length > 0) {
        setSelectedArn(list[0].arn);
      }
    };
    fetchStages();
  }, []);

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
        <select
          value={selectedArn}
          onChange={(e) => setSelectedArn(e.target.value)}
          style={{ padding: '0.75rem', fontSize: '1rem', width: '100%' }}
        >
          {stages.length === 0 && <option>ステージを読み込み中...</option>}
          {stages.map(s => (
            <option key={s.arn} value={s.arn}>{s.name}</option>
          ))}
        </select>

        <button 
          onClick={() => navigate(`/host?stageArn=${encodeURIComponent(selectedArn)}`)}
          disabled={!selectedArn}
          style={{ 
            width: '100%',
            padding: '1rem 2rem', 
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          配信者として参加
        </button>
        <button 
          onClick={() => navigate(`/viewer?stageArn=${encodeURIComponent(selectedArn)}`)}
          disabled={!selectedArn}
          style={{ 
            width: '100%',
            padding: '1rem 2rem', 
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          視聴者として参加
        </button>
      </div>
      <button onClick={signOut} style={{ marginTop: '2rem' }}>
        Sign out
      </button>
    </main>
  );
}

export default Home;
