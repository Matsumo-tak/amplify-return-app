import { useEffect, useRef, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handlePermissions, listAvailableDevices, getMediaStreams } from "../device";
import { leaveStage, createViewerStrategy, setupViewerStageEvents } from "../ivs";
import { Stage } from 'amazon-ivs-web-broadcast';

function Viewer() {
  const { user } = useAuthenticator();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageArn = searchParams.get('stageArn') || '';
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [token, setToken] = useState<string>('');
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, MediaStream>>(new Map());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    remoteParticipants.forEach((stream, participantId) => {
      const videoElement = videoRefs.current.get(participantId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteParticipants]);

  return (
    <main style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')}>← ホームに戻る</button>
      </div>
      <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>視聴者モード</h1>
      
      <div>
        <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>配信映像</h2>
        {remoteParticipants.size === 0 ? (
          <p>送り返しがありません</p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', 
            gap: '1rem' 
          }}>
            {Array.from(remoteParticipants.keys()).map(participantId => (
              <div key={participantId}>
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(participantId, el);
                  }}
                  autoPlay
                  playsInline
                  style={{ width: '100%', backgroundColor: '#000', aspectRatio: '16/9' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1rem', maxWidth: '400px' }}>
        <select 
          value={selectedAudioId} 
          onChange={async (e) => {
            setSelectedAudioId(e.target.value);
            await getMediaStreams({ audio: e.target.value });
            setMicrophoneStream((window as any).microphoneStream);
          }}
          style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem' }}
        >
          {audioDevices.length === 0 && <option>マイクを選択</option>}
          {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
        </select>

        <button onClick={async () => {
          await handlePermissions();
          await listAvailableDevices();
          const aDevices = (window as any).audioDevices || [];
          setAudioDevices(aDevices);
          if (aDevices.length > 0) {
            setSelectedAudioId(aDevices[0].deviceId);
            await getMediaStreams({ audio: aDevices[0].deviceId });
            setMicrophoneStream((window as any).microphoneStream);
            
            // 既に配信中の場合は再接続
            if (stage && token) {
              console.log('マイク追加のため再接続します...');
              // 一旦退出
              leaveStage(stage);
              setStage(null);
              setStrategy(null);
              
              // 少し待ってから再接続
              setTimeout(async () => {
                const audioTrack = (window as any).microphoneStream?.getAudioTracks()[0] || null;
                const newStrategy = createViewerStrategy(audioTrack);
                if (newStrategy.audioTrack) {
                  newStrategy.audioTrack.setMuted(true);
                }
                
                const newStage = new Stage(token, newStrategy);
                
                setupViewerStageEvents(
                  newStage,
                  (participantId, stream) => {
                    setRemoteParticipants(prev => new Map(prev).set(participantId, stream));
                  },
                  (participantId) => {
                    setRemoteParticipants(prev => {
                      const newMap = new Map(prev);
                      newMap.delete(participantId);
                      return newMap;
                    });
                  }
                );
                
                await newStage.join();
                
                setStrategy(newStrategy);
                setStage(newStage);
                setIsAudioMuted(true);
              }, 500);
            }
          }
        }} style={{ width: '100%', maxWidth: '400px', padding: '0.75rem' }}>
          マイクの使用許可のリクエスト
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {!stage ? (
          <button onClick={async () => {
            // Lambda関数URLからトークンを取得
            const res = await fetch(import.meta.env.VITE_CREATE_STAGE_TOKEN_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user?.signInDetails?.loginId ?? '', stageArn }),
            });
            const data = await res.json();
            const fetchedToken = data.token;
            if (!fetchedToken) return;
            setToken(fetchedToken);
            
            // マイクがある場合はそれを使用、ない場合はnullで進む
            const audioTrack = microphoneStream?.getAudioTracks()[0] || null;
            const newStrategy = createViewerStrategy(audioTrack);
            if (newStrategy.audioTrack) {
              newStrategy.audioTrack.setMuted(true);
            }
            
            const newStage = new Stage(fetchedToken, newStrategy);
            
            setupViewerStageEvents(
              newStage,
              (participantId, stream) => {
                setRemoteParticipants(prev => new Map(prev).set(participantId, stream));
              },
              (participantId) => {
                setRemoteParticipants(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(participantId);
                  return newMap;
                });
              }
            );
            
            await newStage.join();
            
            setStrategy(newStrategy);
            setStage(newStage);
            setIsAudioMuted(true);
          }} style={{ padding: '0.75rem 1.5rem' }}>
            視聴開始
          </button>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button 
              onClick={() => {
                leaveStage(stage);
                setStage(null);
                setStrategy(null);
                setRemoteParticipants(new Map());
              }}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              視聴終了
            </button>
            {strategy && strategy.audioTrack && microphoneStream && (
              <button 
                onClick={() => {
                  strategy.audioTrack.setMuted(!isAudioMuted);
                  setIsAudioMuted(!isAudioMuted);
                }}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isAudioMuted ? 'マイクON' : 'マイクOFF'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Viewer;
