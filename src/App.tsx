import { useEffect, useRef, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { handlePermissions, listAvailableDevices, getMediaStreams } from "./device";
import { joinStage, leaveStage, createStrategy } from "./ivs";
import { Stage } from 'amazon-ivs-web-broadcast';

function App() {
  const { signOut } = useAuthenticator();
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const updateMediaStream = async (videoId?: string, audioId?: string) => {
    const vId = videoId || selectedVideoId;
    const aId = audioId || selectedAudioId;
    if (vId && aId) {
      await getMediaStreams({ video: vId, audio: aId });
      setCameraStream((window as any).cameraStream);
    }
  };

  return (
    <main>
      <h1>IVS Test</h1>
      <button onClick={async () => {
        await handlePermissions();
        await listAvailableDevices();
        const vDevices = (window as any).videoDevices || [];
        const aDevices = (window as any).audioDevices || [];
        setVideoDevices(vDevices);
        setAudioDevices(aDevices);
        if (vDevices.length > 0 && aDevices.length > 0) {
          setSelectedVideoId(vDevices[0].deviceId);
          setSelectedAudioId(aDevices[0].deviceId);
          await getMediaStreams({ video: vDevices[0].deviceId, audio: aDevices[0].deviceId });
          setCameraStream((window as any).cameraStream);
        }
      }} style={{ marginBottom: '1rem' }}>
        カメラ/マイクの使用許可のリクエスト
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <select value={selectedVideoId} onChange={(e) => {
          setSelectedVideoId(e.target.value);
          updateMediaStream(e.target.value, selectedAudioId);
        }}>
          {videoDevices.length === 0 && <option>カメラを選択</option>}
          {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
        </select>
        <select value={selectedAudioId} onChange={(e) => {
          setSelectedAudioId(e.target.value);
          updateMediaStream(selectedVideoId, e.target.value);
        }}>
          {audioDevices.length === 0 && <option>マイクを選択</option>}
          {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
        </select>
      </div>
      {cameraStream && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxWidth: '640px', marginBottom: '1rem' }}
          />
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Stage Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{ padding: '0.5rem', marginRight: '0.5rem', width: '300px' }}
            />
            {!stage ? (
              <button onClick={async () => {
                if (!token || !cameraStream) return;
                const microphoneStream = (window as any).microphoneStream;
                if (!microphoneStream) return;
                
                const audioTrack = microphoneStream.getAudioTracks()[0];
                const videoTrack = cameraStream.getVideoTracks()[0];
                const newStrategy = createStrategy(audioTrack, videoTrack);
                const newStage = await joinStage(token, newStrategy);
                setStrategy(newStrategy);
                setStage(newStage);
                setIsVideoMuted(false);
                setIsAudioMuted(false);
              }}>
                配信開始
              </button>
            ) : (
              <>
                <button 
                  onClick={() => {
                    leaveStage(stage);
                    setStage(null);
                    setStrategy(null);
                  }}
                  style={{ marginRight: '0.5rem' }}
                >
                  配信終了
                </button>
                {strategy && (
                  <>
                    <button 
                      onClick={() => {
                        strategy.videoTrack.setMuted(!isVideoMuted);
                        setIsVideoMuted(!isVideoMuted);
                      }}
                      style={{ marginRight: '0.5rem' }}
                    >
                      {isVideoMuted ? 'カメラON' : 'カメラOFF'}
                    </button>
                    <button 
                      onClick={() => {
                        strategy.audioTrack.setMuted(!isAudioMuted);
                        setIsAudioMuted(!isAudioMuted);
                      }}
                    >
                      {isAudioMuted ? 'マイクON' : 'マイクOFF'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
