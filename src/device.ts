// カメラとマイクの使用許可をリクエスト
export async function handlePermissions() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
  }
}

// カメラとマイクのデバイス一覧取得
export async function listAvailableDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  (window as any).videoDevices = devices.filter((d) => d.kind === 'videoinput');
  (window as any).audioDevices = devices.filter((d) => d.kind === 'audioinput');
}

const videoConfiguration = {
  maxWidth: 1280,
  maxHeight: 720,
  maxFramerate: 30,
}

// 指定したカメラとマイクからMediaStreamを取得
export async function getMediaStreams(deviceId?: { video?: string; audio?: string }) {
  (window as any).cameraStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: deviceId?.video || (window as any).videoDevices[0]?.deviceId,
      width: {
        ideal: videoConfiguration.maxWidth,
      },
      height: {
        ideal: videoConfiguration.maxHeight,
      },
    },
  });
  (window as any).microphoneStream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: deviceId?.audio || (window as any).audioDevices[0]?.deviceId },
  });
}

