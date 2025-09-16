import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Dimensions, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Camera, runAtTargetFps, useCameraDevice, useCameraPermission, useFrameProcessor, type CameraPosition } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';

import type { StaticScreenProps } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import FSDK, { FSDKError } from 'react-native-face-sdk';
import FacesProcessor from './faces_processor';


interface FaceScaleAndOffset {

  scale: number;
  offsetX: number;
  offsetY: number;

}


/** Helper types for navigation type checking */
type HomeProps = StaticScreenProps<undefined>;
type HomeNavigationProp = NativeStackNavigationProp<RootParamList, 'Home'>;


/** Threshold for liveness detection */
const LIVENESS_THRESHOLD = 0.5;

/** Image quality threshold for liveness detection */
const LIVENESS_IMAGE_QUALITY_THRESHOLD = 0.5;


export default function Home(_: HomeProps): ReactNode {
  /** State variables */

  /** Array of react nodes displaying the current faces on screen */
  const [faces, setFaces] = useState<ReactNode[]>([]);

  /** Current camera position. Can be either 'back' or 'front' */
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');

  /** Whether or not the user has denied the camera permission when asked */
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  /** Whether or not the user has requested tracker memory clear */
  const [shouldClearTracker, setShouldClearTracker] = useState(false);

  /** Current scale and offset for the face bounding boxes. If underfined the image dimensions should be requested first */
  const [faceScaleAndOffset, setFaceScaleAndOffset] = useState<FaceScaleAndOffset | undefined>(undefined);

  /** Current scale and offset for the face bounding boxes. If underfined the image dimensions should be requested first */
  const [livenessEnabled, setLivenessEnabled] = useState(FacesProcessor.livenessEnabled);

  /** Whether or not IBeta plugin was initialized */
  const [facesProcessorInitialized, setFacesProcessorInitialized] = useState(false);
  

  /** React Native navigation object for navigating between screens (i.e. naming the face) */
  const navigation = useNavigation<HomeNavigationProp>();


  /** Current selected camera device. Specify filter as the second parameters to better control the selected device */
  const device = useCameraDevice(cameraPosition);

  /** Where or not the user has granted camera permission. Use requestPermission to ask the user for permission */
  const { hasPermission, requestPermission } = useCameraPermission();


  /** Determines the face scale and offset for the given image size. The function is meant to be called from a 'worklet'. */
  const updateFaceScaleAndOffset = useRunOnJS((imageWidth: number, imageHeight: number): void => {
    const windowDimensions = Dimensions.get('window');
    const windowWidth = windowDimensions.width;
    const windowHeight = windowDimensions.height;

    const scaleX = windowWidth  / imageWidth;
    const scaleY = windowHeight / imageHeight;

    if (scaleX < scaleY)
      setFaceScaleAndOffset({
        scale: scaleX,
        offsetX: 0,
        offsetY: (windowHeight - imageHeight * scaleX) / 2
      });
    else
      setFaceScaleAndOffset({
        scale: scaleY,
        offsetX: (windowWidth - imageWidth * scaleY) / 2,
        offsetY: 0
      });
  }, [setFaceScaleAndOffset]);


  /** Obtains image dimensions from a frame and updates the face scale and offset used for drawing. Pass this as a frame processor when the image parameters change */
  const getImageDimensions = useFrameProcessor(frame => {
    'worklet'

    runAtTargetFps(0.5, () => {
      'worklet'
      const image = FSDK.Worklets.LoadImageFromFrame(frame);
      updateFaceScaleAndOffset(FSDK.Worklets.GetImageWidth(image), FSDK.Worklets.GetImageHeight(image));
      FSDK.Worklets.FreeImage(image);
    });
  }, [updateFaceScaleAndOffset]);


  /** Toggle current camera position (back/front). Reset face scale and offset and remove all the rendered faces */
  const toggleCameraPosition = useCallback(() => {
    setCameraPosition(cameraPosition === 'back' ? 'front' : 'back');
    setFaceScaleAndOffset(undefined);
    setFaces([]);
  }, [cameraPosition, setCameraPosition, setFaceScaleAndOffset, setFaces]);


  /** Toggle liveness on/off */
  const toggleLiveness = useCallback(() => {
    FacesProcessor.toggleLiveness();
    setLivenessEnabled(FacesProcessor.livenessEnabled);
  }, [setLivenessEnabled]);

  
  /** Add Clear, Flip and Help buttons to the node */
  const withButtons = useCallback((node: ReactNode): ReactNode => {
    return (
      <View style={styles.container}>
        {node}
        <View style={styles.buttonView}>
          <TouchableOpacity style={styles.button} onPress={() => setShouldClearTracker(true)}>
            <Text style={styles.text}>CLEAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleCameraPosition}>
            <Text style={styles.text}>FLIP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Luxand Face Recognition', helpMessage, [{ text: 'OK' }])}>
            <Text style={styles.text}>HELP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleLiveness}>
            <Text style={styles.text}>{livenessEnabled ? 'LIVENESS ON' : 'LIVENESS OFF'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }, [toggleCameraPosition, setShouldClearTracker, livenessEnabled, toggleLiveness]);


  /** Given a list of face ids creates a ReactNode to show the face bounding box for each id */
  const renderFaces = useCallback((ids: number[]): void => {
    if (faceScaleAndOffset === undefined)
      return;

    const windowWidth = Dimensions.get('window').width;
    setFaces(
      ids.map((faceID, index) => {
        const face = FacesProcessor.getFace(faceID);

        var [x0, y0, x1, y1] = face.bbox.scaled(faceScaleAndOffset.scale).values;

        if (Platform.OS == 'android' && cameraPosition === 'front')
          [x0, x1] = [windowWidth - x1, windowWidth - x0];

        var isLive = true;
        var isError = false;
        var livenessMessage = '';

        if (FacesProcessor.livenessEnabled) {
          isLive = face.liveness > LIVENESS_THRESHOLD;
          livenessMessage = `Liveness: ${face.liveness.toFixed(4)}`;

          if (FacesProcessor.useIBetaLivenessAddon) {
            if (face.livenessError !== undefined) {
              isError = true;
              livenessMessage = `Liveness error: ${face.livenessError}`;
            } else if (face.imageQuality >= 0 && face.imageQuality < LIVENESS_IMAGE_QUALITY_THRESHOLD) {
              isError = true;
              livenessMessage = `Image quality too low: ${face.imageQuality.toFixed(4)}`;
            }
          }
        }

        const color = isError ? 'yellow' : (isLive ? 'green' : 'red');

        const labels: Array<ReactNode> = [];
        if (face.name !== '')
          labels.push(<Text style={{ ...styles.label, color: color }} key={`name${faceID}`}>{face.name}</Text>);

        if (livenessMessage !== '')
          labels.push(<Text style={{ ...styles.label, color: color }} key={`liveness${faceID}`}>{livenessMessage}</Text>);

        return (
          <TouchableOpacity
            key={index}
            style={{
              ...styles.faceBox,
              borderColor: color,
              width: x1 - x0,
              height: y1 - y0,
              left: x0 + faceScaleAndOffset.offsetX,
              top: y0 + faceScaleAndOffset.offsetY,
            }}
            onPress={() => navigation.navigate('Edit', { face: face })}
          >
            {labels}
          </TouchableOpacity>
        );
      })
    );
  }, [faceScaleAndOffset, cameraPosition, navigation]);


  /** Clear tracker memory */
  const clearTracker = useCallback(() => {
    if (!shouldClearTracker)
      return;

    FacesProcessor.clear();
    setShouldClearTracker(false);
  }, [shouldClearTracker, setShouldClearTracker]);


  /** Set the callback to handle detected face ids from FacesProcessor */
  useEffect((): (() => void) => {
    FacesProcessor.onFaceIDsReady(renderFaces);
    return () => FacesProcessor.onFaceIDsReady(undefined);
  }, [renderFaces]);


  /** Save tracker memory on app close */
  useEffect(() => () => FacesProcessor.saveTrackerMemory());


  /** Make sure the FacesProcessor is initialized */
  if (!facesProcessorInitialized) {
    FacesProcessor.initialize()
      .then(() => setFacesProcessorInitialized(true))
      .catch(e => {
        if (e instanceof FSDKError) {
          Alert.alert('FSDK', e.message);
          return;
        }

        throw e;
      });

    return withButtons(<View/>);
  }


  /** If the user has not granted camera permission, request it */
  if (!hasPermission) {
    if (cameraPermissionDenied)
      return withButtons(<Text>Camera is required for the app to work.</Text>);

    requestPermission().then(value => setCameraPermissionDenied(!value));
    return withButtons(<View/>);
  }


  /** If we don't have a camera device for some reason */
  if (device === undefined)
    return withButtons(<Text>No {cameraPosition} camera.</Text>);

  
  /** If we don't have the face scale and offset set, use the frame processor to obtain image dimensions, otherwise detect faces on the image */
  const frameProcessor = faceScaleAndOffset === undefined ? getImageDimensions : FacesProcessor.frameProcessor;

  
  /** If the user has requested tracker memory clear, wait enough time for the camera to stop processing frames and clear tracker memory */
  if (shouldClearTracker)
    setTimeout(clearTracker, 1000);


  /** Display the Camera preview */
  return withButtons(
    <SafeAreaView style={StyleSheet.absoluteFill}>
      <Camera
        device={device}
        resizeMode='contain'
        style={StyleSheet.absoluteFill}
        isActive={!shouldClearTracker}
        frameProcessor={frameProcessor}
      />
      {faces}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black'
  },

  buttonView: {
    left: 0,
    margin: 0,
    top: '90%',
    height: '10%',
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
    textAlignVertical: 'center'
  },

  label: {
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },

  faceBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth * 4,
  }

});

const helpMessage =
  'Just tap any detected face and name it. ' +
  'The app will recognize this face further. ' +
  'For best results, hold the device at arm\'s length. ' +
  'You may slowly rotate the head for the app to memorize you at multiple views. ' +
  'The app can memorize several persons. ' +
  'If a face is not recognized, tap and name it again.\n\n' +
  'The SDK is available for mobile developers: www.luxand.com/facesdk';

