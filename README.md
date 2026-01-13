## [FaceSDK](https://www.luxand.com/facesdk/?utm_source=github&utm_medium=readmd&utm_campaign=header) · [CloudAPI](https://luxand.cloud/?utm_source=github&utm_medium=readmd&utm_campaign=header) · [LinkedIn](https://www.linkedin.com/company/luxand-inc.) · [Contact](mailto:support@luxand.com)


<table style="border-collapse: collapse; border: none;">

<img src="images/nist.png" align="left" width="145"> 

### NIST-approved

Luxand's FaceSDK ranked within the top 21.8% by the National Institute of Standards and Technology (NIST) during the Face Recognition Vendor Test (FRVT).

<img src="images/ibeta.png" align="left" width="143">

### iBeta Certified Liveness

The iBeta certified Liveness add-on for FaceSDK aced Level 1 Presentation Attack Detection (PAD) testing, following ISO/IEC 30107-3 standards. 

# FaceSDK \- React Native (iOS, Android)

## ![image1](images/image1.jpg) ![image2](images/image2.jpg) 

## Improved Face Detection and Recognition

The accuracy of face detection and recognition is significantly improved. Note that the face template size has been increased to 2068 bytes and the recognition threshold has been reduced. Threshold values as low as 0.8 provide good results in our tests.

Use the following classes and functions to use the improved algorithms.

```ts
export interface Point {
  x: number;
  y: number;
}

export interface FacePosition {
  xc: number;
  yc: number;
  w: number;
  angle: number;
}

export interface Face {
  bbox: { p0: Point; p1: Point };
  features: Point[];
}
```

*Use `Face` instead of `TFacePosition` class when working with improved face detection. Points `p0` and `p1` correspond to top left and bottom right corner coordinates of the face bounding box. `features` contain 5 points detected on the face: eye centers, nose and mouth corners. Use `Face[]` when working with the `DetectMultipleFaces2` function.*

```ts
FSDK.DetectFace2(image: number): Face;
```

*Detects a single face on the given image. If multiple faces are present, the function returns the one with the highest confidence.*

```ts
FSDK.DetectMultipleFaces2(image: number, maxFaces?: number): Face[];
```

*Detects multiple faces on the given image. The faces are sorted by confidence in descending order.*

```ts
FSDK.GetFaceTemplate2(image: number): FaceTemplate;
```

*Obtains a face template for the face with the most confidence on the image (as returned by `DetectFace2` function). Note that the face template size is 2068 bytes.*

```ts
FSDK.GetFaceTemplateInRegion2(image: number, face: Face): FaceTemplate;
```

*Obtains a face template for the given `face`. Note that the face template size is 2068 bytes.*

### Configuring Improved Face Detection and Recognition

Parameters of the improved face detection and recognition are set using the `FSDK.SetParameter` or `FSDK.SetMultipleParameters` functions (see [documentation](https://www.luxand.com/facesdk/documentation/configuration.php)). The available parameters are listed below.

#### Face Detection

| Parameter | Description | Default Value | Accepted Values |
| :---      | :---        |     :---:     | :---            |
| FaceDetection2Model | Path to the face detection model file to load | default | File path or the string `"default"` |
| FaceDetection2Threshold | Face detection threshold | 0.64 | Floating point value from the range [0, 1] |
| FaceDetection2BatchSize | Number of image patches processed at the same time for face detection | 1 | Positive integer |
| FaceDetection2PatchSize | Size of a single image patch | 640 | Positive integer. Higher values decrease performance, but allow detection of smaller faces |
| FaceDetection2PatchMode | Image patching algorithm to use | fast | <p>`"fast"` &mdash; resizes the image to `FaceDetection2PatchSize` and performs detection on a single patch</p> <p>`"full"` &mdash; splits the image into overlapping patches of size `FaceDetection2PatchSize` and performs detection on every patch separately combing the results afterwards</p> <p>`"mixed"` &mdash; if the image size is at least twice as big as `FaceDetection2PatchSize` chooses `"full"` otherwise chooses `"fast"` |
| FaceDetection2ComputationDelegate | Computation delegate to use for face detection | cpu | <p>`"none"` &mdash; run on CPU without SIMD optimizations</p> <p>`"cpu"` &mdash; run on CPU with SIMD optimizations</p> <p>`"gpu"` &mdash; run on GPU</p> <p>`"nnapi"` &mdash; run using [NNAPI](https://developer.android.com/ndk/guides/neuralnetworks)</p> |

#### Face Recognition

| Parameter | Description | Default Value | Accepted Values |
| :---      | :---        |     :---:     | :---            |
| FaceRecognition2Model | Path to the face recognition model file to load | default | File path or the string `"default"` |
| FaceRecognition2UseFlipTest | Additionally use mirrored image when creating face template | false | `"false"` or `"true"` |
| FaceRecognition2ComputationDelegate | Computation delegate to use for face recognition | cpu | <p>`"none"` &mdash; run on CPU without SIMD optimizations</p> <p>`"cpu"` &mdash; run on CPU with SIMD optimizations</p> <p>`"gpu"` &mdash; run on GPU</p> <p>`"nnapi"` &mdash; run using [NNAPI](https://developer.android.com/ndk/guides/neuralnetworks)</p> |

### Activating Improved Face Detection and Recognition in Tracker

To activate improved face detection and recognition in Tracker set `DetectionVersion` Tracker parameter to `2`

```ts
tracker.setParameter('DetectionVersion', 2);
```

Note that this parameter cannot be set for a non-empty Tracker, i.e. it must be set before the first call to `FSDK.FeedFrame`. Additionally, face detection and recognition parameters (as described [above](#set-parameters-of-the-improved-face-detection-and-recognition)) can be set using the `FSDK.SetTrackerParameter` and `FSDK.SetTrackerMultipleParameters` functions (see [documentation](https://www.luxand.com/facesdk/documentation/trackerfunctions.php#FSDK_SetTrackerParameter)).

## Managing Face Templates in Tracker Memory

The following functions can be used to synchronize Tracker Memory between different devices.

Since the list of IDs in the Tracker may change during operation (for example, two IDs may be merged), it is not recommended to work with the Tracker (i.e., call `FSDK.FeedFrame`) while using the following functions. Also, you must call the following function beforehand (see [FAQ](https://www.luxand.com/facesdk/faq.php)):

```ts
tracker.setParameter("VideoFeedDiscontinuity", false);
```
Below is the list of functions for direct access to the Tracker Memory face templates.

```ts
tracker.getIDsCount(): number;
```

*Returns the number of `IDs` (persons) in the Tracker's database.*

```ts
tracker.getAllIDs(): number[]
```

*Returns a list of all the `IDs` in the Tracker.*

```ts
tracker.getIDByFaceID(faceID: number): number;
```

*Returns the person `ID` for the given `FaceID`. This function may be useful when the person `ID` changes during Tracker operation while the `FaceID` of the template remains unchanged, or when the `ID` is simply unknown. The `FaceID` always remains unchanged.*

```ts
tracker.getFaceIDsCountForID(id: number): number;
```

*Returns the number of face templates in the Tracker's database for the specified `ID` (person).*

```ts
tracker.getFaceIDsForID(id: number): number[];
```

*Returns a list of all the `FaceIDs` for the specified `ID` (person).*

```ts
tracker.getFaceTemplate(faceID: number): FaceTemplate;
```

*Returns the face template for the specified `FaceID`.*

```ts
tracker.createID(template: FaceTemplate): TrackerID;
```

*Creates a new person `ID` and adds the provided template to it. Returns the new person `ID` and the associated `FaceID`. `FaceID` may be null, in which case the argument is unused.*

```ts
tracker.addFaceTemplate(id: number, template: FaceTemplate): void;
```

*Adds a new template to an existing person ID and returns the `FaceID`. `FaceID` may be null, in which case the argument is unused.* 

```ts
tracker.deleteFace(faceID: number): void;
```

*Deletes the face template with the specified `FaceID`. If this is the last template for the person, the person `ID` will also be removed.*

```ts
tracker.getFaceImage(faceID: number): Image;
```

*Returns the face image for the specified `FaceID`. The image is grayscale and the dimensions are 96x96. If the image is not present, the function returns the error code `FSDKE_IMAGE_NOT_PRESENT`.*

```ts
tracker.setFaceImage(faceID: number, image: Image): void;
```

*Sets the face image for the specified `FaceID`. The dimensions of the provided `Image` must be 96x96. The `Image` may have any format supported by FSDK. If an image already exists for the `FaceID`, it will be replaced. This function should only be used with an `Image` obtained with `FSDK.GetTrackerFaceImage`.*

```ts
tracker.deleteFaceImage(faceID: number): void;
```

*Deletes the face image for the specified `FaceID` from the `tracker's` database. If no image is present, the function does nothing.*

```ts
export interface IDSimilarity {
  id: number;
  similarity: number;
}

tracker.matchFaces(template: FaceTemplate, threshold: number, maxSize: number = 256): IDSimilarity[];
```

*Fills `Buffer` with person `IDs` from the `tracker’s` memory that have a face `similarity` score above the `Threshold`. Each entry contains the person `ID` and the respective face `similarity`. Entries are added in descending order, so the `ID` with the highest `similarity` score appears first. The parameter `Count` is set to the number of entries filled into the `Buffer`.*

## iBeta Certified Liveness Addon

The sample also demonstrates [iBeta Certified Liveness Addon](https://www.luxand.com/facesdk/documentation/certifiedliveness.php) usage.  

## Worklets fix
Replace line 19 in `example/node_modules/react-native-vision-camera/src/frame-processors/runAsync.ts`
```ts
const asyncContext = Worklets.createContext('VisionCamera.async')
```
with
```ts
const asyncContext = Worklets.defaultContext
```

This allows `runAsync` function to work in release builds.

## Running the sample

Before you start, ensure you have the following installed on your machine:

 - Node.js (https://nodejs.org)
 - npm (Node Package Manager, usually installed with Node.js), yarn (npm install -g yarn)
 - Xcode (for iOS development)

Install the dependencies:

```bash
cd example
yarn install
```

### iOS

For iOS you also need to install CocoaPods:

```bash
cd example/ios
pod install
```

You have two options to run the Sample on iOS:

#### Option 1: Using React Native CLI

Run the app using the React Native CLI:

```bash
yarn example ios
```

This will launch the app on the iOS simulator or a connected device.

#### Option 2: Using Xcode

1. Open Xcode on your Mac.

2. Open the iOS project by navigating to the "ios" folder and double-clicking the `.xcworkspace` file.

3. Once Xcode is open, select the target device or simulator you want to run the app on from the dropdown menu in the top-left corner.

4. Click the "Run" button (▶️) to build and run the app on the selected device/simulator.

If you encounter any issues during the setup or while running the app, please check the following:

- Ensure you have installed CocoaPods, Node.js, npm, yarn.

- Make sure the correct target device/simulator is selected in Xcode if you're using Option 2 for running the app.

### Android

You need to install CMake and NDK (v28.2.13676358) using the Android Package Manager. You have two options to run the Sample app on Android:

##### Option 1: Using React Native CLI

Run the app using the React Native CLI:

```bash
yarn example android
```

This will launch the app on the Android emulator or a connected Android device.

##### Option 2: Using Android Studio

1. Open Android Studio on your computer.

2. Click on "Open an existing Android Studio project" or "File" > "Open" from the top menu.

3. Navigate to the "example/android" folder and select it.

4. Wait for Android Studio to index the files and download any necessary Gradle dependencies. This might take a few minutes.

5. Once everything is set up, you should see a green "Run" button (▶️) at the top. Beside it, there's a dropdown menu. From this dropdown, you can select the Android emulator you've previously set up or any connected Android device.

6. Click the "Run" button (▶️) to build and run the app on the selected device/emulator.

**Note**: Before running the app on a real device, ensure that your device has USB Debugging enabled and is set to "File Transfer" mode. You might also need to confirm a prompt on your device to allow USB debugging from your computer.