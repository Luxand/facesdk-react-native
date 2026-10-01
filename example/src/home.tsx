import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  type TargetCameraPosition,
} from 'react-native-vision-camera';

import type { StaticScreenProps } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import FSDK from 'react-native-facesdk';
import FacesProcessor, {
  LivenessStatus,
  processFrame,
  shouldMeasureBlur,
} from './faces_processor';

import { scheduleOnRN } from 'react-native-worklets';

/** Maps the camera image onto the preview. The camera fills the preview, so the parts of the image that stick out are cropped away by the offsets */
interface ScaleAndOffset {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

/** Helper types for navigation type checking */
type HomeProps = StaticScreenProps<undefined>;
type HomeNavigationProp = NativeStackNavigationProp<RootParamList, 'Home'>;

/** How fast the displayed FPS follows the instant one */
const FPS_SMOOTHING = 0.1;

/** Height of a single label under a face box, used to decide whether the labels still fit on screen */
const LABEL_HEIGHT = 20;

/** Where the button bar starts, in percent of the preview height */
const BUTTON_BAR_TOP_PERCENT = 90;

export default function Home(_: HomeProps): ReactNode {
  /** Height of the system navigation bar and of anything else overlapping the preview */
  const insets = useSafeAreaInsets();

  /** State variables */

  /** Array of react nodes displaying the current faces on screen */
  const [faces, setFaces] = useState<ReactNode[]>([]);

  /** Current camera position. Can be either 'back' or 'front' */
  const [cameraPosition, setCameraPosition] = useState<TargetCameraPosition>('back');

  /** Whether or not the user has denied the camera permission when asked */
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  /** Whether or not the user has requested tracker memory clear */
  const [shouldClearTracker, setShouldClearTracker] = useState(false);

  /** Current scale and offset for the face bounding boxes. While the scale is 0 the image dimensions are not known yet */
  const [scaleAndOffset, setScaleAndOffset] = useState<ScaleAndOffset>({ scale: 0, offsetX: 0, offsetY: 0, width: 0, height: 0 });

  /** Size of the camera preview on screen, measured by onLayout */
  const [viewSize, setViewSize] = useState<Size | undefined>(undefined);

  /** Whether or not liveness detection is currently enabled */
  const [livenessEnabled, setLivenessEnabled] = useState(FacesProcessor.livenessEnabled);

  /** Whether or not FaceSDK, the tracker and the iBeta plugin have been initialized */
  const [facesProcessorInitialized, setFacesProcessorInitialized] = useState(false);

  /** React Native navigation object for navigating between screens (i.e. naming the face) */
  const navigation = useNavigation<HomeNavigationProp>();

  /** Current selected camera device. Specify filter as the second parameters to better control the selected device */
  const device = useCameraDevice(cameraPosition);

  /** Whether or not the user has granted camera permission. Use requestPermission to ask the user for permission */
  const { hasPermission, requestPermission } = useCameraPermission();

  /** Determines the face scale and offset for the given image size. The camera preview covers the view, so the image is scaled by the larger of the two ratios and centred */
  const updateScaleAndOffset = useCallback(
    (imageWidth: number, imageHeight: number): void => {
      if (viewSize === undefined) return;

      const scale = Math.max(
        viewSize.width / imageWidth,
        viewSize.height / imageHeight
      );

      setScaleAndOffset({
        scale,
        offsetX: (viewSize.width - imageWidth * scale) / 2,
        offsetY: (viewSize.height - imageHeight * scale) / 2,
        width: imageWidth,
        height: imageHeight,
      });
    },
    [viewSize]
  );

  /** A worklet cannot capture classes, so read the tracker handle here and pass it into the frame processor as a plain number */
  const trackerHandle = facesProcessorInitialized ? FacesProcessor.trackerHandle : -1;

  /** The same goes for the liveness settings: read them here and pass a plain boolean */
  const measureBlur = shouldMeasureBlur(livenessEnabled);

  /** Camera output that runs face detection on every frame. Dropping frames while busy lets the preview run at more FPS than face detection */
  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    enablePhysicalBufferRotation: true,
    dropFramesWhileBusy: true,
    onFrame(frame) {
      'worklet';

      /** The frame size is only known once the camera delivers a frame, and may change when the camera is reconfigured */
      if (frame.width != scaleAndOffset.width || frame.height != scaleAndOffset.height)
        scheduleOnRN(updateScaleAndOffset, frame.width, frame.height);

      if (trackerHandle >= 0)
        processFrame(frame, trackerHandle, measureBlur);

      frame.dispose();
    },
  });

  /** Toggle current camera position (back/front). Reset face scale and offset and remove all the rendered faces */
  const toggleCameraPosition = useCallback(() => {
    setCameraPosition(cameraPosition === 'back' ? 'front' : 'back');
    setScaleAndOffset({
      scale: 0,
      offsetX: 0,
      offsetY: 0,
      width: 0,
      height: 0,
    });
    setFaces([]);
  }, [cameraPosition, setCameraPosition, setScaleAndOffset, setFaces]);

  /** Toggle liveness on/off */
  const toggleLiveness = useCallback(() => {
    FacesProcessor.toggleLiveness();
    setLivenessEnabled(FacesProcessor.livenessEnabled);
  }, [setLivenessEnabled]);

  /** Add Clear, Flip and Help buttons to the node */
  const withButtons = useCallback(
    (node: ReactNode): ReactNode => {
      return (
        <View style={styles.container}>
          {node}
          <View style={[styles.buttonView, { bottom: insets.bottom }]}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShouldClearTracker(true)}
            >
              <Text style={styles.text}>CLEAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={toggleCameraPosition}
            >
              <Text style={styles.text}>FLIP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                Alert.alert('Luxand Face Recognition', helpMessage, [
                  { text: 'OK' },
                ])
              }
            >
              <Text style={styles.text}>HELP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={toggleLiveness}>
              <Text style={styles.text}>
                {livenessEnabled ? 'LIVENESS ON' : 'LIVENESS OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [
      toggleCameraPosition,
      setShouldClearTracker,
      livenessEnabled,
      toggleLiveness,
    ]
  );

  /** Smoothed rate of processed frames and the time the previous one was reported */
  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef(0);

  /** Called once per processed frame: updates the FPS the same way the Flutter sample does */
  const sampleFPS = useCallback((): void => {
    const now = Date.now();
    const elapsed = now - lastFrameTime.current;
    lastFrameTime.current = now;

    if (elapsed <= 0 || elapsed === now) return;

    const instant = 1000 / elapsed;
    setFps((current) => (current === 0 ? instant : current + (instant - current) * FPS_SMOOTHING));
  }, []);

  /** Given a list of face ids creates a ReactNode to show the face bounding box for each id */
  const renderFaces = useCallback(
    (ids: number[]): void => {
      sampleFPS();

      if (scaleAndOffset.scale === 0 || viewSize === undefined) return;

      setFaces(
        ids.map((faceID, index) => {
          const face = FacesProcessor.getFace(faceID);

          let [x0, y0, x1, y1] = face.bbox.scaled(scaleAndOffset.scale).values;

          /**
           * The front camera preview is mirrored on both platforms, but the frames handed to the
           * frame processor are not, so the boxes have to be flipped back. The image spans
           * `viewSize.width - 2 * offsetX` here, since the offset has not been applied yet.
           */
          if (cameraPosition === 'front')
            [x0, x1] = [
              viewSize.width - x1! - 2 * scaleAndOffset.offsetX,
              viewSize.width - x0! - 2 * scaleAndOffset.offsetX,
            ];

          /**
           * A face with a low image quality or a blurred face gets no liveness verdict: the
           * reason is shown in yellow instead. Without a Liveness attribute there is nothing to report
           */
          let color = 'green';
          let livenessMessage = '';
          let qualityMessage = '';

          switch (face.livenessStatus) {
            case LivenessStatus.LIVE:
              livenessMessage = `Live (probability: ${face.liveness.toFixed(3)})`;
              break;

            case LivenessStatus.FAKE:
              if (face.livenessError !== undefined) {
                color = 'yellow';
                livenessMessage = face.livenessError;
              } else {
                color = 'red';
                livenessMessage = `Fake (probability: ${face.liveness.toFixed(3)})`;
              }
              break;

            case LivenessStatus.BLURRED:
              color = 'yellow';
              livenessMessage = `Low sharpness: ${face.sharpness.toFixed(1)}`;
              break;

            case LivenessStatus.LOW_QUALITY:
              color = 'yellow';
              break;

            case LivenessStatus.UNKNOWN:
              break;
          }

          if (face.livenessStatus !== LivenessStatus.UNKNOWN && face.imageQuality >= 0)
            qualityMessage = `${face.livenessStatus === LivenessStatus.LOW_QUALITY ? 'Low Quality' : 'Quality'}: ${face.imageQuality.toFixed(3)}`;

          const labels: Array<ReactNode> = [];
          const addLabel = (key: string, text: string) =>
            labels.push(
              <Text style={{ ...styles.label, color: color }} key={`${key}${faceID}`}>
                {text}
              </Text>
            );

          if (face.name !== '') addLabel('name', face.name);
          if (livenessMessage !== '') addLabel('liveness', livenessMessage);
          if (qualityMessage !== '') addLabel('quality', qualityMessage);

          /** Put the labels below the box, unless they would end up behind the button bar */
          const labelsFitBelow =
            y1! + scaleAndOffset.offsetY + labels.length * LABEL_HEIGHT <=
            (viewSize.height * BUTTON_BAR_TOP_PERCENT) / 100;

          return (
            <TouchableOpacity
              key={index}
              style={{
                ...styles.faceBox,
                borderColor: color,
                width: x1! - x0!,
                height: y1! - y0!,
                left: x0 + scaleAndOffset.offsetX,
                top: y0 + scaleAndOffset.offsetY,
              }}
              onPress={() => navigation.navigate('Edit', { face: face })}
            >
              <View
                style={labelsFitBelow ? styles.labelsBelow : styles.labelsAbove}
              >
                {labels}
              </View>
            </TouchableOpacity>
          );
        })
      );
    },
    [scaleAndOffset, viewSize, cameraPosition, navigation, sampleFPS]
  );

  /** Clear tracker memory */
  const clearTracker = useCallback(() => {
    if (!shouldClearTracker) return;

    FacesProcessor.clear();
    setShouldClearTracker(false);
  }, [shouldClearTracker, setShouldClearTracker]);

  /** Set the callback to handle detected face ids from FacesProcessor */
  useEffect((): (() => void) => {
    FacesProcessor.onFaceIDsReady(renderFaces);
    return () => FacesProcessor.onFaceIDsReady(undefined);
  }, [renderFaces]);

  /**
   * Save tracker memory when the app leaves the foreground. Without the dependency array this
   * effect's cleanup runs before every re-render — that is once per camera frame — and each call
   * serializes the whole tracker memory to disk. The system kills a backgrounded app without
   * unmounting React, so the AppState listener, not the cleanup, is what actually saves.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') FacesProcessor.saveTrackerMemory();
    });

    return () => {
      subscription.remove();
      FacesProcessor.saveTrackerMemory();
    };
  }, []);

  /** Make sure the FacesProcessor is initialized */
  if (!facesProcessorInitialized) {
    FacesProcessor.initialize()
      .then(() => setFacesProcessorInitialized(true))
      .catch((e) => {
        if (e instanceof FSDK.Error) {
          Alert.alert('FSDK', e.message);
          return;
        }

        throw e;
      });

    return withButtons(<View />);
  }

  /** If the user has not granted camera permission, request it */
  if (!hasPermission) {
    if (cameraPermissionDenied)
      return withButtons(<Text>Camera is required for the app to work.</Text>);

    requestPermission().then((value) => setCameraPermissionDenied(!value));
    return withButtons(<View />);
  }

  /** If we don't have a camera device for some reason */
  if (device === undefined)
    return withButtons(<Text>No {cameraPosition} camera.</Text>);

  /** If the user has requested tracker memory clear, wait enough time for the camera to stop processing frames and clear tracker memory */
  if (shouldClearTracker) setTimeout(clearTracker, 1000);

  /** iBeta liveness initialization status, shown under the FPS */
  const iBetaInitResult = FacesProcessor.iBetaInitResult;
  const iBetaInitialized = iBetaInitResult === FSDK.ERROR.OK;
  const iBetaStatus =
    iBetaInitResult === undefined ? null : (
      <Text style={[styles.iBetaStatus, { color: iBetaInitialized ? 'lightgreen' : 'red' }]}>
        {iBetaInitialized
          ? 'iBeta Liveness initialized'
          : `iBeta Liveness Not Initialized (${iBetaInitResult})`}
      </Text>
    );

  /** Display the Camera preview */
  return withButtons(
    <View style={StyleSheet.absoluteFill}>
      <Camera
        device={device}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        isActive={!shouldClearTracker}
        outputs={[frameOutput]}
        onLayout={(e) => setViewSize(e.nativeEvent.layout)}
      />
      {faces}
      <View style={[styles.statusView, { top: insets.top + 10 }]} pointerEvents="none">
        <Text style={styles.fps}>{fps.toFixed(1)}</Text>
        {iBetaStatus}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },

  buttonView: {
    left: 0,
    margin: 0,
    // Anchored to the bottom rather than to `top`, so that the safe area inset applied
    // inline lifts the whole bar instead of squashing it.
    height: `${100 - BUTTON_BAR_TOP_PERCENT}%`,
    width: '100%',
    flexDirection: 'row',
    position: 'absolute',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },

  button: {
    margin: 5,
    flex: 0.75,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a6a6a6',
  },

  text: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  labelsBelow: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  labelsAbove: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  statusView: {
    position: 'absolute',
    left: 10,
  },

  fps: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'lightgreen',
  },

  iBetaStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  label: {
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  faceBox: {
    position: 'absolute',
    overflow: 'visible',
    borderWidth: StyleSheet.hairlineWidth * 4,
  },
});

const helpMessage =
  'Just tap any detected face and name it. ' +
  'The app will recognize this face further. ' +
  "For best results, hold the device at arm's length. " +
  'You may slowly rotate the head for the app to memorize you at multiple views. ' +
  'The app can memorize several persons. ' +
  'If a face is not recognized, tap and name it again.\n\n' +
  'The SDK is available for mobile developers: www.luxand.com/facesdk';
