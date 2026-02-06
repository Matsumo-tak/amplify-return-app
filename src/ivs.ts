// カメラとマイクの使用許可をリクエスト
async function handlePermissions() {
  let permissions = {
    audio: false,
    video: false,
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    for (const track of stream.getTracks()) {
      track.stop();
    }
    permissions = { video: true, audio: true };
  } catch (err) {
    permissions = { video: false, audio: false };
    console.error(err instanceof Error ? err.message : String(err));
  }
  // If we still don't have permissions after requesting them display the error message
  if (!permissions.video) {
    console.error('Failed to get video permissions.');
  } else if (!permissions.audio) {
    console.error('Failed to get audio permissions.');
  }
}

// カメラとマイクのデバイス一覧取得
async function listAvailableDevices() {
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
async function getMediaStreams() {
  (window as any).cameraStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: (window as any).videoDevices[0].deviceId,
      width: {
        ideal: videoConfiguration.maxWidth,
      },
      height: {
        ideal: videoConfiguration.maxHeight,
      },
    },
  });
  (window as any).microphoneStream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: (window as any).audioDevices[0].deviceId },
  });
}