# Hands-Free Turn Recovery Design

## Intent

Keep a healthy hands-free interview running when one transcription item or Realtime response fails.

## Behavior

- A transcription failure is recoverable: keep the peer, channel, and microphone alive; preserve the latest partial transcript; return to listening; tell the user to repeat or continue.
- A Realtime event-level error is recoverable while the peer and data channel remain open: end the failed response, return to listening, and report a turn-level problem.
- Playback failure remains recoverable and must not be described as a microphone-permission failure.
- Actual microphone-ended, peer failed/disconnected/closed, and data-channel error/close events remain terminal.
- Terminal and recoverable errors display distinct, truthful guidance.

## Approaches

- Selected: recover at the event boundary and reserve teardown for transport failures. The transport already reports its own terminal state independently.
- Rejected: reconnect after every event error, which risks parallel sessions and duplicated turns.
- Rejected: copy-only changes, which would leave the healthy session unnecessarily destroyed.
