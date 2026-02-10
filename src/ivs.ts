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

// Strategyを作成（配信者用：映像と音声）
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

// Strategyを作成（視聴者用：音声のみ、または視聴専用）
export function createViewerStrategy(audioTrack: MediaStreamTrack | null) {
  const myAudioTrack = audioTrack ? new LocalStageStream(audioTrack) : null;

  return {
    audioTrack: myAudioTrack,
    stageStreamsToPublish() {
      // 音声トラックがある場合のみ配信
      return myAudioTrack ? [myAudioTrack] : [];
    },
    shouldPublishParticipant() {
      return true;
    },
    shouldSubscribeToParticipant() {
      // 他の参加者の映像と音声を受信
      return SubscribeType.AUDIO_VIDEO;
    }
  };
}

// Stageのイベントハンドラーを設定（配信者用：参加者の入退出を通知）
export function setupHostStageEvents(
  stage: Stage,
  onParticipantJoined: (participantId: string, userId: string) => void,
  onParticipantLeft: (participantId: string) => void
) {
  stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
    console.log('接続状態が変化:', state);
    if (state === StageConnectionState.ERRORED) {
      console.error('Stage connection error');
    }
  });

  stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, (participant) => {
    console.log('参加者が参加しました:', participant.id, 'userId:', participant.userId, 'isLocal:', participant.isLocal);
    if (!participant.isLocal) {
      onParticipantJoined(participant.id, participant.userId || participant.id);
    }
  });

  stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, (participant) => {
    console.log('参加者が退出しました:', participant.id);
    onParticipantLeft(participant.id);
  });
}

// Stageのイベントハンドラーを設定（内部用）
function setupStageEvents(stage: Stage) {
  stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
    if (state === StageConnectionState.ERRORED) {
      console.error('Stage connection error');
    }
  });
}

// Stageのイベントハンドラーを設定（視聴者用：リモート参加者のストリームを受信）
export function setupViewerStageEvents(
  stage: Stage, 
  onRemoteStreamAdded: (participantId: string, stream: MediaStream) => void,
  onRemoteStreamRemoved: (participantId: string) => void
) {
  // 接続状態の変化
  stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
    console.log('接続状態が変化:', state);
    if (state === StageConnectionState.ERRORED) {
      console.error('Stage connection error');
    }
  });

  // 参加者が参加したとき
  stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, (participant) => {
    console.log('参加者が参加しました:', participant.id, 'isLocal:', participant.isLocal);
  });

  // 参加者が退出したとき
  stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, (participant) => {
    console.log('参加者が退出しました:', participant.id);
    onRemoteStreamRemoved(participant.id);
  });

  // 参加者の配信状態が変化したとき
  stage.on(StageEvents.STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED, (participant, state) => {
    console.log('配信状態が変化:', participant.id, state);
  });

  // 参加者のサブスクライブ状態が変化したとき
  stage.on(StageEvents.STAGE_PARTICIPANT_SUBSCRIBE_STATE_CHANGED, (participant, state) => {
    console.log('サブスクライブ状態が変化:', participant.id, state);
  });

  // 参加者のストリームが追加されたとき
  stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, (participant, streams) => {
    console.log('ストリームが追加されました:', participant.id, 'isLocal:', participant.isLocal, streams);
    
    // ローカル参加者（自分）は除外
    if (participant.isLocal) {
      console.log('ローカル参加者なのでスキップ');
      return;
    }
    
    // MediaStreamを作成
    const mediaStream = new MediaStream();
    streams.forEach(stream => {
      stream.mediaStreamTrack && mediaStream.addTrack(stream.mediaStreamTrack);
    });
    
    onRemoteStreamAdded(participant.id, mediaStream);
  });

  // 参加者のストリームが削除されたとき
  stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED, (participant) => {
    console.log('ストリームが削除されました:', participant.id);
    onRemoteStreamRemoved(participant.id);
  });
}

