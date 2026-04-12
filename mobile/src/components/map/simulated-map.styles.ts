import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    backgroundColor: '#f4f4ff',
    borderWidth: 1,
    borderColor: '#d8d8ff',
    overflow: 'hidden',
  },
  grid: {
    height: 240,
    backgroundColor: '#eef0ff',
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    overflow: 'visible',
  },
  dotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    elevation: 3,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  hint: {
    fontSize: 10,
    color: '#7c3aed',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#eef0ff',
  },
});
