'use client';

// 延迟导入 face-api
let faceapi: typeof import('@vladmandic/face-api') | null = null;

// 动态导入 face-api
const loadFaceApi = async () => {
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api');
  }
  return faceapi;
};

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 添加更详细的类型定义
interface IBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

// 修改接口定义
interface IFaceLandmarks {
  positions: Point[];
  shift: Point;
}

interface Point {
  x: number;
  y: number;
}

interface IFaceDetection {
  box: IBox;
  score: number;
  landmarks?: IFaceLandmarks;
}

interface WithFaceLandmarks<T = {}> {
  detection: IFaceDetection;
  landmarks: IFaceLandmarks;
  descriptor: Float32Array;
  withFaceDescriptor(): WithFaceLandmarks<T>;
}

export class FaceCapture {
  private static video: HTMLVideoElement | null = null;
  private static stream: MediaStream | null = null;
  private static canvas: HTMLCanvasElement | null = null;
  private static isModelLoaded = false;
  private static isBackendInitialized = false;
  private static isInitialized = false;

  // 检查浏览器是否支持所需的API
  private static checkBrowserSupport(): boolean {
    const support = {
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      enumerateDevices: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices),
      webgl: !!window.WebGLRenderingContext
    };

    console.log('浏览器支持情况:', support);

    if (!support.getUserMedia) {
      throw new Error('您的浏览器不支持摄像头访问，请使用最新版本的Chrome、Firefox或Edge浏览器。');
    }

    if (!support.webgl) {
      throw new Error('您的浏览器不支持WebGL，人脸识别可能无法正常工作');
    }

    return true;
  }

  // 测试摄像头
  static async testCamera(): Promise<void> {
    try {
      // 检查浏览器支持
      this.checkBrowserSupport();

      // 列出所有媒体设备
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('发现视频设备数量:', videoDevices.length);
      console.log('所有视频设备:', videoDevices.map(d => ({
        deviceId: d.deviceId,
        label: d.label || '未命名设备',
        kind: d.kind
      })));

      if (videoDevices.length === 0) {
        throw new Error('未检测到摄像头设备');
      }

      // 尝试访问摄像头
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      // 创建临时视频元素
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      console.log('摄像头测试成功:', {
        width: video.videoWidth,
        height: video.videoHeight,
        deviceId: stream.getVideoTracks()[0].getSettings().deviceId,
        label: stream.getVideoTracks()[0].label
      });

      // 清理资源
      stream.getTracks().forEach(track => track.stop());
      video.remove();
      
    } catch (error) {
      console.error('摄像头测试失败:', error);
      throw error;
    }
  }

  private static async initializeBackend() {
    if (this.isBackendInitialized) return;

    try {
      this.checkBrowserSupport();
      const api = await loadFaceApi();

      // 配置 TensorFlow
      await api.tf.setBackend('webgl');
      await api.tf.ready();
      
      console.log('TensorFlow 后端初始化成功: webgl');
      this.isBackendInitialized = true;
    } catch (error) {
      console.error('TensorFlow 后端初始化失败:', error);
      throw new Error('TensorFlow 初始化失败，请刷新页面重试');
    }
  }

  static {
    // 只在浏览器环境下预加载模型
    if (isBrowser) {
      console.log('开始预加载人脸识别模型...');
      this.loadModels().catch(error => {
        console.warn('模型预加载失败，将在使用时重试:', error);
      });
    }
  }

  static async loadModels() {
    if (!isBrowser) return;
    if (this.isModelLoaded) return;

    try {
      const api = await loadFaceApi();
      await this.initializeBackend();
      
      // 使用 CDN 路径或本地路径
      const modelPath = process.env.NEXT_PUBLIC_MODEL_CDN_URL || 
                       window.location.origin + '/models';
      
      console.log('正在加载模型，路径:', modelPath);

      // 按优先级顺序加载型
      try {
        // 首先加载检测模型，这是最重要的
        console.log('人脸检测模型...');
        const detectPromise = api.nets.ssdMobilenetv1.loadFromUri(modelPath);
        
        // 然后并行加载其他模型
        const [landmarkPromise, recognitionPromise] = [
          api.nets.faceLandmark68Net.loadFromUri(modelPath),
          api.nets.faceRecognitionNet.loadFromUri(modelPath)
        ];

        // 等待检测模型加载完成
        await detectPromise;
        console.log('人脸检测模型加载完成');

        // 等待其他模型加载完成
        await Promise.all([landmarkPromise, recognitionPromise]);
        console.log('所有模型加载完成');

      } catch (modelError: unknown) {
        console.error('模型加载失败:', modelError);
        const errorMessage = modelError instanceof Error 
          ? modelError.message 
          : '未知错误';
        throw new Error(`模型加载失败: ${errorMessage}`);
      }

      this.isModelLoaded = true;
    } catch (error) {
      console.error('加载人脸识别模型失败:', error);
      throw error;
    }
  }

  static async setupVideo() {
    if (!this.video) {
      this.video = document.createElement('video');
      this.video.style.display = 'none';
      document.body.appendChild(this.video);
    }

    try {
      // 首先尝试获取摄像头列表
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('检测到的视频设备:', videoDevices.map(d => ({
        deviceId: d.deviceId,
        label: d.label || '未命名设备'
      })));

      // 构建视频约束
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 320 },  // 降低分辨率
          height: { ideal: 240 }, // 降低分辨率
          frameRate: { ideal: 15 } // 降低帧率
        }
      };

      // 如果有可用的摄像头，使用第一个
      if (videoDevices.length > 0) {
        (constraints.video as MediaTrackConstraints).deviceId = videoDevices[0].deviceId;
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      // 等待视频加载完
      await new Promise<void>((resolve, reject) => {
        if (!this.video) return reject(new Error('视频元素未初始化'));
        
        if (this.video.readyState === 4) {
          resolve();
        } else {
          this.video.onloadeddata = () => resolve();
          this.video.onerror = () => reject(new Error('视频加载失败'));
        }

        // 设置超时
        setTimeout(() => reject(new Error('视频加载超时')), 10000);
      });

      await this.video.play();
      console.log('摄像头初始化成功');

    } catch (error: unknown) {
      console.error('获取摄像头失败:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('摄像头权限被拒绝。请在浏览器设置中允许访问摄像头，然后刷新页面重试。');
        } else if (error.name === 'NotFoundError') {
          throw new Error('未找到可用的摄像头设备。请确保摄像头已连接并且没有被其他应用程序占用。');
        } else if (error.name === 'NotReadableError') {
          throw new Error('无法访问摄像头。可能是因为摄像头被其他应用程序占用，请关闭他使用摄像头的应用后试。');
        } else {
          throw new Error(`摄像头初始化失败: ${error.message}`);
        }
      } else {
        throw new Error('摄像头初始化失败: 未知错误');
      }
    }
  }

  static async detectFace() {
    if (!this.video) throw new Error('视频元素未初始化');

    try {
      const api = await loadFaceApi();
      // 在检测之前确保视频已经有足够的帧
      const checkVideoReady = async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('无法创建画布上下文');

        canvas.width = this.video!.videoWidth;
        canvas.height = this.video!.videoHeight;
        context.drawImage(this.video!, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let hasContent = false;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
            hasContent = true;
            break;
          }
        }
        canvas.remove();
        return hasContent;
      };

      // 增加等待时间
      let ready = false;
      for (let i = 0; i < 20 && !ready; i++) { // 增加到20次尝试
        ready = await checkVideoReady();
        if (!ready) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 增加等待时间
        }
      }

      const options = new api.SsdMobilenetv1Options({
        minConfidence: 0.3, // 降低置信度阈值
        maxResults: 1
      });

      // 修改检测方法的调用
      const detection = await api.detectSingleFace(this.video, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.warn('未检测到人脸，重试中...');
        throw new Error('未检测到人脸，请确保光线充足且正面对着摄像头');
      }

      return detection;
    } catch (error) {
      console.error('人脸检测失败:', error);
      throw error;
    }
  }

  static async initialize() {
    if (this.isInitialized) return;
    
    await this.loadModels();
    await this.setupVideo();
    this.isInitialized = true;
  }

  static async capture(showPreview = false): Promise<Float32Array> {
    if (!isBrowser) {
      throw new Error('FaceCapture 只能在浏览器环境中使用');
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 增加预热时间
      }

      let detection = null;
      let attempts = 5; // 增加尝试次数
      
      while (attempts > 0 && !detection) {
        try {
          if (attempts < 5) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          detection = await this.detectFace();
          if (detection) break;
        } catch (error) {
          attempts--;
          if (attempts === 0) {
            this.cleanup();
            throw error;
          }
        }
      }

      if (!detection) {
        throw new Error('未能成功检测到人脸');
      }

      const faceDescriptor = detection.descriptor;

      if (showPreview) {
        if (!this.canvas) {
          this.canvas = document.createElement('canvas');
          this.canvas.width = this.video!.videoWidth;
          this.canvas.height = this.video!.videoHeight;
          this.canvas.style.position = 'fixed';
          this.canvas.style.top = '50%';
          this.canvas.style.left = '50%';
          this.canvas.style.transform = 'translate(-50%, -50%)';
          this.canvas.style.zIndex = '1000';
          this.canvas.style.maxWidth = '100%';
          this.canvas.style.maxHeight = '100%';
          document.body.appendChild(this.canvas);
        }

        const ctx = this.canvas.getContext('2d');
        if (ctx) {
          const api = await loadFaceApi();
          ctx.drawImage(this.video!, 0, 0);

          // 修改绘制部分
          const drawBox = new api.draw.DrawBox(detection.detection.box, {
            label: '人脸',
            lineWidth: 2,
            boxColor: 'blue'
          });
          
          drawBox.draw(this.canvas);
          
          // 使用 detection 作为参数
          api.draw.drawFaceLandmarks(this.canvas, detection);

          setTimeout(() => {
            this.cleanup();
          }, 5000);
        }
      } else {
        this.cleanup();
      }

      return faceDescriptor;
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  static cleanup() {
    console.log('开始清理摄像头资源...');
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`摄像头轨道 ${track.id} 已关闭`);
      });
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
      this.video = null;
      console.log('视频元素已移除');
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      console.log('预览画布已移除');
    }

    // 重置初始化状态
    this.isInitialized = false;
  }

  static async compareFaces(face1: Float32Array, face2: Float32Array): Promise<number> {
    const api = await loadFaceApi();
    return api.euclideanDistance(face1, face2);
  }
}

// 导出一个空的服务器端实现
export const ServerFaceCapture = {
  capture: () => Promise.reject(new Error('FaceCapture 不能在服务器端使用')),
  loadModels: () => Promise.reject(new Error('FaceCapture 不能在服务器端使用')),
};

// 根据环境导出不同的实现
export default isBrowser ? FaceCapture : ServerFaceCapture; 