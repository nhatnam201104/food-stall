import { Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Màn hình Đăng ký</Text>
      <Link href="/(tabs)" style={{ color: 'blue', marginTop: 20 }}>
        Vào thẳng Trang chủ (Demo)
      </Link>
    </View>
  );
}