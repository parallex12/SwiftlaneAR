
//AddUser.js
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
} from "react-native";
import { connect } from "react-redux";
import { AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FaceDetector from "expo-face-detector";
import * as FileSystem from "expo-file-system";

const AddUser = (props) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const BASE_URL = "https://api.kairos.com/";
  const HEADERS = {
    Accept: "application/json",
    "Content-Type": "application/json",
    app_id: "77b3022b",
    app_key: "8e579b903ac9b8e01844984137c33c2e",
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this appp to access your camera!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync();

    if (!result.canceled) {
      let faces = await FaceDetector.detectFacesAsync(result.assets[0].uri, {});

      if (faces?.faces?.length == 0) {
        alert("No Face Detected");
        setImage(null);
        return;
      }
      const base64 = await FileSystem.readAsStringAsync(faces?.image?.uri, {
        encoding: "base64",
      });
      enroll(Math.floor(Math.random() * 100000), base64);
      setImage(result.assets[0].uri);
    }
  };

  const enroll = async (userId, base64) => {
    setLoading(true);
    await fetch(`${BASE_URL}enroll`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        image: base64,
        subject_id: `MySocial_${userId}`,
        gallery_name: "MyGallery",
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res.images);
        setLoading(false);
      })
      .catch((e) => {
        console.log(e.message);
        setLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#222" />}
      <TouchableOpacity style={styles.profileWrapper} onPress={pickImage}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.profile}
            resizeMode="cover"
          />
        ) : (
          <AntDesign name="camera" size={rf(30)} color="#222" />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => props?.navigation?.navigate("CameraScreen")}
      >
        <Text style={styles.btnText}>
          {image ? "Continue" : "Already Enrolled (Continue)"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileWrapper: {
    width: wp("50%"),
    height: wp("50%"),
    borderRadius: wp("50%"),
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  profile: {
    width: "100%",
    height: "100%",
  },
  btn: {
    minWidth: wp("40%"),
    height: hp("5%"),
    borderRadius: 5,
    backgroundColor: "skyblue",
    alignItems: "center",
    justifyContent: "center",
    top: hp("5%"),
    paddingHorizontal: wp("3%"),
  },
});
const mapStateToProps = (state) => ({
  errors: state.errors.errors,
});
export default connect(mapStateToProps, {})(AddUser);
