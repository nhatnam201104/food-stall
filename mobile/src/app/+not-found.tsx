import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>Trang này không tồn tại.</Text>
        <Link href="/">
          <Text style={{ color: 'blue', marginTop: 15 }}>Quay lại trang chủ</Text>
        </Link>
      </View>
    </>
  );
}