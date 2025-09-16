import { Face } from './faces_processor';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState, type ReactNode } from 'react';
import type { StaticScreenProps } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, Button, StyleSheet, Text, TextInput } from "react-native";

type EditProps = StaticScreenProps<{ face: Face }>;
type EditNavigationProp = NativeStackNavigationProp<RootParamList, 'Edit'>;

export default function Edit({ route }: EditProps): ReactNode {
  const face = route.params.face;

  const [name, setName] = useState(face.name);
  const navigation = useNavigation<EditNavigationProp>();

  useEffect(() => {
    face.lock();
    return () => face.unlock();
  });

  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
      <Text style={{ textAlign: 'center' }}>Input the name</Text>
      <TextInput
        value={name}
        style={{ height: 40, borderColor: 'black', borderWidth: StyleSheet.hairlineWidth, margin: 10 }}
        onChangeText={setName}
      />
      <Button
        title="Save"
        onPress={() => {
          face.name = name;
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}
