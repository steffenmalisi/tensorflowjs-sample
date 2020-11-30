import * as posenet from '@tensorflow-models/posenet';

function _drawPoint(
  ctx: CanvasRenderingContext2D,
  y: number,
  x: number,
  r: number,
  color: string
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawKeypoints(
  keypoints: posenet.Keypoint[],
  minConfidence: number,
  ctx: CanvasRenderingContext2D,
  scale = 1
) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    _drawPoint(ctx, y * scale, x * scale, 3, '#00FFFF');
  }
}
