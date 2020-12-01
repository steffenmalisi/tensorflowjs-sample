import { LitElement, html, css, internalProperty, query } from 'lit-element';
import * as posenet from '@tensorflow-models/posenet';
import { drawKeypoints } from './pose-drawer.js';

type DetectionConfig = {
  algorithm: 'single-person' | 'multi-person';
  minPoseConfidence: number;
  minPartConfidence: number;
};

/**
 * WebComponent which is used as main app entry.
 */
export class PosenetApp extends LitElement {
  @internalProperty() _loaded = false;
  @internalProperty() _stream: MediaStream | null = null;

  @query('#video', true)
  _video!: HTMLVideoElement;

  @query('#output', true)
  _canvas!: HTMLCanvasElement;

  get _ctx(): CanvasRenderingContext2D | null {
    return this._canvas.getContext('2d');
  }

  _net: posenet.PoseNet | null = null;

  _videoWidth = 600;
  _videoHeight = 500;

  _mobileNetConfig: posenet.ModelConfig = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: 500,
    multiplier: 0.75,
    quantBytes: 2,
  };

  _detectionConfig: DetectionConfig = {
    algorithm: 'single-person',
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  };

  static styles = css``;

  async connectedCallback() {
    super.connectedCallback();

    this._net = await posenet.load(this._mobileNetConfig);

    console.log('Net loaded');

    await this._setupCamera();

    console.log('Camera set up');

    this._loaded = true;
  }

  render() {
    return html`
      <div id="info" style="display:none"></div>
      ${!this._loaded
        ? html`
            <div id="loading" style="display:flex">
              <div class="spinner-text">Loading PoseNet model...</div>
              <div class="sk-spinner sk-spinner-pulse"></div>
            </div>
          `
        : html`
            <div id="main">
              <video
                id="video"
                style="display:none;"
                .srcObject=${this._stream}
                width=${this._videoWidth}
                height=${this._videoHeight}
                playsinline
                @loadedmetadata=${() => this._onCameraSetup()}
              ></video>
              <canvas
                width=${this._videoWidth}
                height=${this._videoHeight}
                id="output"
              ></canvas>
            </div>
          `}
    `;
  }

  private async _setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available'
      );
    }

    this._stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: this._videoWidth,
        height: this._videoHeight,
      },
    });
  }

  private _onCameraSetup() {
    this._video.play();
    console.log('Video play started.');
    this._detectPoseInRealTime();
  }

  private async _detectPoseInRealTime() {
    const ctx = this._ctx;
    const videoWidth = this._videoWidth;
    const videoHeight = this._videoHeight;
    const video = this._video;
    const net = this._net;
    const minPartConfidence = this._detectionConfig.minPartConfidence;
    const algorithm = this._detectionConfig.algorithm;

    async function poseDetectionFrame() {
      if (ctx !== null) {
        const poses = await net?.estimatePoses(video, {
          flipHorizontal: true,
          decodingMethod: algorithm,
        });

        ctx.clearRect(0, 0, videoWidth, videoHeight);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-videoWidth, 0);
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        ctx.restore();

        poses?.forEach(({ keypoints }) => {
          drawKeypoints(keypoints, minPartConfidence, ctx);
        });

        requestAnimationFrame(poseDetectionFrame);
      }
    }
    poseDetectionFrame();
  }
}
