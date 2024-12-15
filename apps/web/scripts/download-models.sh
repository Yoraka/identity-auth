#!/bin/bash

# 创建模型目录
mkdir -p public/models

# 进入模型目录
cd public/models

# 下载模型文件
models=(
  "face_landmark_68_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
  "face_recognition_model-weights_manifest.json"
  "ssd_mobilenetv1_model-shard1"
  "ssd_mobilenetv1_model-shard2"
  "ssd_mobilenetv1_model-weights_manifest.json"
)

base_url="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

for model in "${models[@]}"; do
  echo "Downloading $model..."
  wget -N "$base_url/$model"
done

echo "All models downloaded successfully!" 