// src/components/ui/Onboarding.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  AccessibilityInfo,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft, Check, Sparkles, X } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { OnboardingStep } from '../../constants/onboardingSteps';

export interface OnboardingProps {
  visible: boolean;
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  showProgress?: boolean;
  swipeEnabled?: boolean;
  primaryButtonText?: string;
  skipButtonText?: string;
  nextButtonText?: string;
  backButtonText?: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  visible,
  steps,
  onComplete,
  onSkip,
  showSkip = true,
  showProgress = true,
  swipeEnabled = true,
  primaryButtonText = 'Get Started',
  skipButtonText = 'Skip Tour',
  nextButtonText = 'Next',
  backButtonText = 'Back',
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const step = steps[currentStep];
    if (step) {
      AccessibilityInfo.announceForAccessibility(
        `${step.title}. Step ${currentStep + 1} of ${steps.length}.`
      );
    }
  }, [currentStep, visible, steps]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * screenWidth,
        animated: true,
      });
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: prevStep * screenWidth,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const renderProgressDots = () => {
    if (!showProgress) return null;

    return (
      <View
        style={styles.progressContainer}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          return (
            <TouchableOpacity
              key={step.id}
              onPress={() => {
                setCurrentStep(index);
                scrollViewRef.current?.scrollTo({
                  x: index * screenWidth,
                  animated: true,
                });
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <View
                style={[
                  styles.progressDot,
                  isActive
                    ? [styles.progressDotActive, { backgroundColor: step.accentColor || Colors.brand }]
                    : styles.progressDotInactive,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStep = (step: OnboardingStep, index: number) => {
    return (
      <View
        key={step.id}
        style={[
          styles.stepContainer,
          { width: screenWidth },
        ]}
      >
        <View style={styles.cardContentWrap}>
          {/* Visual Icon / Hero Area */}
          <View style={styles.visualContainer}>
            <View style={styles.glowAura} />
            {step.icon}
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <View style={[styles.tagBadge, { borderColor: `${step.accentColor}40`, backgroundColor: `${step.accentColor}18` }]}>
              <Sparkles size={10} color={step.accentColor} />
              <Text style={[styles.tagText, { color: step.accentColor }]}>{step.tag}</Text>
            </View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Top App Header with Step Count & Skip Button */}
        <View style={styles.topBar}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              TOUR {currentStep + 1} OF {steps.length}
            </Text>
          </View>

          {showSkip && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.skipBtnText}>{skipButtonText}</Text>
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Swipeable Slides ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={swipeEnabled}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const newStep = Math.round(
              event.nativeEvent.contentOffset.x / screenWidth
            );
            setCurrentStep(newStep);
          }}
          style={styles.scrollArea}
        >
          {steps.map((step, index) => renderStep(step, index))}
        </ScrollView>

        {/* Progress Indicator Dots */}
        {renderProgressDots()}

        {/* Action Controls: Back & Next / Get Started */}
        <View style={styles.buttonContainer}>
          {!isFirstStep && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={15} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>{backButtonText}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextBtn,
              isFirstStep && styles.nextBtnFull,
              isLastStep && styles.nextBtnFinal,
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>
              {isLastStep ? primaryButtonText : nextButtonText}
            </Text>
            {isLastStep ? (
              <Check size={16} color={Colors.white} strokeWidth={2.5} />
            ) : (
              <ArrowRight size={15} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D14',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    zIndex: 10,
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  scrollArea: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContentWrap: {
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
    paddingVertical: 20,
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(94, 106, 210, 0.06)',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 14,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  progressDot: {
    height: 7,
    borderRadius: 4,
  },
  progressDotInactive: {
    width: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  progressDotActive: {
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 10,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnFull: {
    flex: 1,
  },
  nextBtnFinal: {
    backgroundColor: Colors.income,
    shadowColor: Colors.income,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
