import { Stage, LocalStageStream, SubscribeType, StageEvents, StageConnectionState } from 'amazon-ivs-web-broadcast';

// Stageに参加
export async function joinStage(token: string, strategy: any) {
  const stage = new Stage(token, strategy);
  setupStageEvents(stage);
  await stage.join();
  return stage;
}

// Stageから退出
export function leaveStage(stage: Stage) {
  stage.leave();
}

// Strategyを作成
export function createStrategy(audioTrack: MediaStreamTrack, videoTrack: MediaStreamTrack) {
  const myAudioTrack = new LocalStageStream(audioTrack);
  const myVideoTrack = new LocalStageStream(videoTrack);

  return {
    audioTrack: myAudioTrack,
    videoTrack: myVideoTrack,
    stageStreamsToPublish() {
      return [this.audioTrack, this.videoTrack];
    },
    shouldPublishParticipant() {
      return true;
    },
    shouldSubscribeToParticipant() {
      return SubscribeType.AUDIO_VIDEO;
    }
  };
}

// Stageのイベントハンドラーを設定
function setupStageEvents(stage: Stage) {
  stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
    if (state === StageConnectionState.ERRORED) {
      console.error('Stage connection error');
    }
  });
}

