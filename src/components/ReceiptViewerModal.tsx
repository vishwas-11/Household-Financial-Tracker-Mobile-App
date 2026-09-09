// src/components/ReceiptViewerModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface ReceiptViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  visible,
  imageUrl,
  onClose,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const insets = useSafeAreaInsets();

  // Reset state when imageUrl changes (do NOT use onLoadStart - causes infinite loop on react-native-web)
  const lastImageUrlRef = React.useRef<string | null>(null);
  if (imageUrl !== lastImageUrlRef.current) {
    lastImageUrlRef.current = imageUrl;
    // Synchronous reset before paint - safe because it's a ref comparison
  }

  React.useEffect(() => {
    if (visible) {
      setLoading(!!imageUrl);
      setHasError(false);
    }
  }, [visible, imageUrl]);

  if (!visible || !imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Attached Receipt</Text>
              <Text style={styles.subtitle}>Supabase File Storage</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Image Container */}
          <View style={styles.imageWrapper}>
            {loading && !hasError && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={Colors.brand} />
              </View>
            )}

            {hasError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Receipt Image Unavailable</Text>
                <Text style={styles.errorSubtitle}>
                  The image file could not be rendered. It may be expired, unreachable, or in an unsupported format.
                </Text>
                <TouchableOpacity
                  style={styles.errorActionBtn}
                  onPress={() => Linking.openURL(imageUrl)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.errorActionText}>Open Link in Browser</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
              />
            )}
          </View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText} numberOfLines={1}>
              {imageUrl}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  loader: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 340,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.brand,
  },
  errorActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
});

