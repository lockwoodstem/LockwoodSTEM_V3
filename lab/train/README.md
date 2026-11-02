# Custom Vision Training — LockwoodSTEM

Open `/lab/train/` for the browser-based Model Builder, or use the **Custom trained models** panel at `/lab/`.

## Classroom workflow

1. Create at least two named classes (for example Gear and Cube). Add a background/none category if it is useful for the experiment.
2. Collect five or more labeled images per class to make a first model; use 50–100 varied images per class for a more realistic starting point. Capture webcam images or upload JPEG, PNG or WebP files. Training images are center-cropped to 224 × 224 pixels.
3. Click **Train classifier**. TensorFlow.js loads a MobileNet v2 feature extractor, computes image embeddings, and trains a normalized nearest-centroid classifier. One out of every five images in each class is held out for evaluation; the display reports test accuracy and test-set size. This is a classroom training method, not a calibrated deep-learning detector. Change angle, distance, lighting and background in test images to assess generalization.
4. Click **Export model** to download a portable JSON classifier. **Import model** restores it. The latest model is also saved in browser IndexedDB for the Programming Studio.
5. In `/lab/`, start the webcam and select **Load saved classifier**. Predictions and confidence-like scores appear in the Custom trained models panel. The Python starter program **Custom trained classifier** uses `get_custom_prediction()` inside `process_frame(frame)`.
6. For object detection datasets, select an image and object label, drag bounding boxes, then choose **Export annotated ZIP**. It contains 224 × 224 JPEG crops and COCO-format `annotations.json`. Train a detector in a separate suitable tool; this Studio does **not** train a custom bounding-box detector.

## Local storage, limits and safety

- Class labels and JPEG image samples stay in IndexedDB for this browser profile. The application does not deliberately upload these images to any LockwoodSTEM server. Browser JavaScript and model files are downloaded from CDNs (TensorFlow.js and MobileNet; JSZip for ZIP export).
- Dataset limit: 600 images, 20 classes, 10 MB per uploaded image. Larger collections should be split into separate exported datasets. The gallery displays the last 120 images for performance.
- Do not collect identifiable student face images without school approval, appropriate permissions, and a defined retention policy. Prefer classroom objects, manufactured parts and markers.
- Shared devices may clear storage. Export the classifier and annotated ZIP before leaving. There is no cloud sync or instructor dashboard for this data.
- Predicted scores are not calibrated probabilities. Low test accuracy or performance issues require collecting more diverse examples and retesting on unseen images.
- No automatic movement commands should depend exclusively on image classification. Robotics hardware still needs supervision and a physical emergency stop.
- The full model pipeline requires HTTPS, a webcam-enabled browser and school-network access to the configured CDN model dependencies. Webcam/AI performance on school devices must be piloted.

## Developer verification

```sh
node --check lab/train/store.js
node --check lab/train/train.js
node --check lab/lab-classifier.js
node --check lab/lab.js
node --check lab/worker-v2.js
```

The GitHub workflow `Unified Lab QA` validates syntax and static links. Classroom functional acceptance should include adding classes, importing images, training, evaluation, model export/import, reloading the page, live classifier use in Studio, drawing annotations, and inspecting COCO output in an external annotator.
