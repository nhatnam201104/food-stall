import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fafafa',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  skipBtn: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  emptyIcon: { fontSize: 24 },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  poiName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  triggerLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playNowBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  playNowText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
});
