import { StyleSheet, Text, View } from "react-native";
import { Provider } from "react-redux";
import store from "./state-management/store";
import { AppNavigator } from "./routes/AppNavigator";

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
