//CameraScreen.js

import React, { useEffect, useRef, useState } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFValue as rf } from "react-native-responsive-fontsize";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Button,
} from "react-native";
import { connect } from "react-redux";
import { AntDesign } from "@expo/vector-icons";
import { Camera, CameraType } from "expo-camera";
import DoubleClick from "react-native-double-tap";
import * as FaceDetector from "expo-face-detector";
import { captureRef } from "react-native-view-shot";
import { manipulateAsync, FlipType, SaveFormat } from "expo-image-manipulator";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

const CameraScreen = (props) => {
  const [type, setType] = useState(CameraType.front);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [faces, setFaces] = useState([]);
  const [recognisedFaces, setRecognisedFaces] = useState([]);
  const [tempFaces, setTempFaces] = useState([]);
  const [currentSnap, setCurrentSnap] = useState(null);
  const [customisedImage, setCustomisedImage] = useState(null);
  const [recogniseApiCalls, setRecogniseApiCalls] = useState(0);
  const [ready, setReady] = useState(false);
  const BASE_URL = "https://api.kairos.com/";
  const snapRef = useRef();
  const user1Ref = useRef();
  const HEADERS = {
    Accept: "application/json",
    "Content-Type": "application/json",
    app_id: "77b3022b",
    app_key: "8e579b903ac9b8e01844984137c33c2e",
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  // console.log(hp("100%"));

  const p = (img, imgURI, savedImg) => {
    try {
      (async () => {
        const customWH = {
          w: savedImg?.width / wp("100%"),
          h: savedImg?.height / hp("100%"),
        };
        let faceOptions = {
          originX: Math.round(customWH.w * tempFaces[0]?.bounds?.origin?.x),
          originY: Math.round(customWH.h * tempFaces[0]?.bounds?.origin?.y),
          width:
            Math.round(customWH.h * tempFaces[0]?.bounds?.size?.width) * 1.2,
          height:
            Math.round(customWH.h * tempFaces[0]?.bounds?.size?.height) * 1.1,
        };
        const manipResult = await manipulateAsync(
          imgURI,
          [{ flip: FlipType.Horizontal }, { crop: faceOptions }],
          {
            format: SaveFormat.PNG,
            compress: 1,
            base64: true,
          }
        );
        setCurrentSnap(manipResult?.uri);
        onRecognise(manipResult?.base64);
        setReady(true);
      })();
    } catch (e) {}
  };

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraType = () => {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const _onFacesDetected = async (props) => {
    try {
      let _faces = props?.faces;
      if (_faces?.length == 0) {
        return null;
      }
      if (faces?.length == 0) {
        // onCapture();
        setTempFaces(_faces);
      }
      await _faces?.map((item, index) => {
        if (item?.loading == undefined) {
          item["loading"] = true;
        }
      });
      setFaces([..._faces]);
    } catch (e) {
      console.log(e.message);
    }
  };
  // console.log(recognisedFaces);
  // console.log(tempFaces[0]?.bounds?.origin);

  const onCapture = async (e) => {
    setRecogniseApiCalls(1);
    await snapRef.current.takePictureAsync({
      base64: false,
      onPictureSaved: (e) => p(e?.base64, e?.uri, e),
    });
    // setImages([...images, e.uri]);
    // await onRecognise(e.uri);
  };

  const onRecognise = async (img) => {
    try {
      const rawResponse = await fetch(`${BASE_URL}recognize`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          image: img,
          gallery_name: "MyGallery",
        }),
      });
      const content = await rawResponse.json();
      addDetectedUser(content?.images);
    } catch (e) {
      // console.log(e.messase);
    }
  };

  // add detected user to faces list

  const addDetectedUser = async (data) => {
    let tempData = data[0]?.transaction;
    tempData["expoFaceID"] = await tempFaces[0]?.faceID;
    setRecognisedFaces((prev) => [...prev, tempData]);
    // setTempFaces([]);
    setRecogniseApiCalls(1);
  };

  const onAddNewPerson = async () => {
    snapRef.current.takePictureAsync({
      base64: true,
      onPictureSaved: (e) => onRecognise(e?.base64),
    });
  };
  // console.log(tempFaces[0]?.faceID);

  const FaceDetectCard = (props) => {
    return (
      <View style={[styles.facesBox, { ...props?.style }]}>
        <View style={[styles.locationPin, { ...props?.profile }]}>
          <View style={styles.locationPinCurve}></View>
          <View style={styles.locationPinImg}>
            <Image
              defaultSource={require("../assets/profile.jpg")}
              source={require("../assets/profile.jpg")}
              resizeMode="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        </View>
        {!props?.loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <View style={styles.facesBoxContent}>
              <Text style={styles.facesBoxTitle}>
                {props?.userData?.subject_id || "Zeeshan Karim"}
              </Text>
              <Text style={styles.facesBoxText}>
                {props?.userData?.face_id || "Software Dev"}
              </Text>
            </View>
            <TouchableOpacity style={styles.facesBoxBtn}>
              <AntDesign name="adduser" size={20} color="black" />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const FaceDetectPin = (props) => {
    return (
      <View style={[styles.locationPin, { ...props?.profile }]}>
        <View style={styles.locationPinCurve}></View>
        <View style={styles.locationPinImg}>
          <Image
            defaultSource={require("../assets/profile.jpg")}
            source={require("../assets/profile.jpg")}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={snapRef}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.accurate,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
        style={styles.camera}
        type={type}
        onFacesDetected={(faces) => _onFacesDetected(faces)}
      >
        {faces?.map((item, index) => {
          let width = item?.bounds?.size?.width;
          let faceOptions = {
            left: item?.bounds?.origin?.x,
            top: item?.bounds?.origin?.y - hp("10%"),
            width: item?.bounds?.size?.width + wp("20%"),
            height: item?.bounds?.size?.height / 3,
          };
          let profile = {
            width: width,
            height: width,
            left: item?.bounds?.origin?.x,
            top: item?.bounds?.origin?.y - width - hp("5%"),
          };
          let profile2 = {
            width: width / 3,
            height: width / 3,
          };
          let userData = recognisedFaces?.filter((e) => {
            return e.expoFaceID == item?.faceID;
          });
          return (
            <View key={index}>
              <View key={index}>
                {width > 130 ? (
                  <FaceDetectCard
                    userData={userData[0]}
                    loading={!userData?.length > 0}
                    data={item}
                    style={faceOptions}
                    profile={profile2}
                  />
                ) : (
                  <FaceDetectPin
                    userData={userData[0]}
                    loading={!userData?.length > 0}
                    data={item}
                    profile={profile}
                  />
                )}
              </View>
            </View>
          );
        })}
        <DoubleClick doubleTap={toggleCameraType} delay={200}>
          <View style={styles.touchableLayer}></View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => onAddNewPerson()}
          >
            <Text style={styles.newBtnText}>Add new Person</Text>
          </TouchableOpacity>
        </DoubleClick>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp("3%"),
  },
  camera: {
    flex: 1,
  },
  touchableLayer: {
    width: wp("100%"),
    height: hp("100%"),
  },
  facesBox: {
    width: wp("55%"),
    height: hp("7%"),
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    flexDirection: "row",
  },
  facesBoxTitle: {
    fontSize: "18%",
    color: "#fff",
  },
  facesBoxText: {
    fontSize: "15%",
    color: "#fff",
  },
  facesBoxContent: {
    alignItems: "center",
    flex: 0.9,
    left: "35%",
  },
  facesBoxBtnText: {
    fontSize: "15%",
    color: "#222",
  },
  facesBoxBtn: {
    width: 45,
    height: 45,
    backgroundColor: "yellow",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    marginTop: 5,
    paddingHorizontal: 10,
  },
  locationPin: {
    width: wp("18%"),
    height: wp("18%"),
    backgroundColor: "#EFC65C",
    borderRadius: 100,
    position: "absolute",
    zIndex: 9999,
    left: "-10%",
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  locationPinCurve: {
    width: "50%",
    height: "50%",
    backgroundColor: "#EFC65C",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  locationPinImg: {
    width: "60%",
    height: "60%",
    backgroundColor: "#fff",
    borderRadius: 100,
    overflow: "hidden",
    transform: [{ rotate: "45deg" }],
  },
  newBtn: {
    width: wp("40%"),
    height: hp("5%"),
    borderRadius: 5,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: hp("10%"),
    alignSelf: "center",
  },
  newBtnText: {
    fontSize: rf(14),
    color: "#222",
    fontWeight: "600",
  },
  snapRectangleWrapper: {
    borderWidth: 1,
    borderColor: "red",
    position: "absolute",
  },
});
const mapStateToProps = (state) => ({
  errors: state.errors.errors,
});
export default connect(mapStateToProps, {})(CameraScreen);
