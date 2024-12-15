declare module '@vladmandic/face-api' {
  export const nets: {
    faceLandmark68Net: {
      loadFromUri(uri: string): Promise<void>;
    };
    faceRecognitionNet: {
      loadFromUri(uri: string): Promise<void>;
    };
    ssdMobilenetv1: {
      loadFromUri(uri: string): Promise<void>;
    };
  };

  export const tf: {
    setBackend(backendName: string): Promise<boolean>;
    ready(): Promise<void>;
    getBackend(): string;
  };

  export interface IPoint {
    x: number;
    y: number;
  }

  export interface IRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface IBox extends IRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }

  export interface IFaceDetection {
    score: number;
    box: IBox;
  }

  export interface IFaceLandmarks {
    positions: IPoint[];
    shift: IPoint;
  }

  export interface WithFaceDetection<T> {
    detection: IFaceDetection;
  }

  export interface WithFaceLandmarks<T> extends WithFaceDetection<T> {
    landmarks: IFaceLandmarks;
  }

  export interface WithFaceDescriptor<T> extends WithFaceLandmarks<T> {
    descriptor: Float32Array;
  }

  export class SsdMobilenetv1Options {
    constructor(options?: {
      minConfidence?: number;
      maxResults?: number;
    });
  }

  export function detectSingleFace(
    input: HTMLVideoElement | HTMLImageElement,
    options?: SsdMobilenetv1Options
  ): FaceDetection;

  export class FaceDetection {
    withFaceLandmarks(): FaceLandmarks;
  }

  export class FaceLandmarks {
    withFaceDescriptor(): Promise<WithFaceDescriptor<{}>>;
  }

  export namespace draw {
    export interface DrawBoxOptions {
      label?: string;
      drawLines?: boolean;
      lineWidth?: number;
      boxColor?: string;
      lineColor?: string;
      drawLabelOptions?: {
        anchorPosition?: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
        backgroundColor?: string;
        fontColor?: string;
        fontSize?: number;
        padding?: number;
      };
    }

    export class DrawBox {
      constructor(box: IBox, options?: DrawBoxOptions);
      draw(canvas: HTMLCanvasElement): void;
    }

    export function drawFaceLandmarks(
      canvas: HTMLCanvasElement | HTMLElement,
      detection: WithFaceLandmarks<{}>
    ): void;
  }

  export function euclideanDistance(arr1: Float32Array, arr2: Float32Array): number;
} 