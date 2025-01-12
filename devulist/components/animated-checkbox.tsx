import React, { useEffect } from 'react';
import { useSharedValue, useAnimatedProps, withTiming, interpolateColor, Easing } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import {Svg, Path, Defs, ClipPath, G, Rect} from 'react-native-svg'

const MARGIN = 10
const vWidth = 64 + MARGIN
const vHeight = 64 + MARGIN
const checkMarkPath = "M2 73.6005L31.6565 94C47.4733 60.9387 85.8855 -3.21421 113 4.66422"
const outlineBoxPath = "M12 2C17.2186 2.57984 22.464 4.70863 28 5C31.559 5.18732 34.8442 6 38.5 6C44.4867 6 50.1815 6.3213 56.0556 7.05556C63.029 7.92723 69.8966 8 77 8C82.941 8 87.7478 7.20845 93.5556 6.22222C95.6925 5.85935 105.179 3.2379 105.889 6.61111C108.374 18.4157 104.111 30.9238 104.111 42.5556C104.111 50.2534 108 57.5137 108 65.2222C108 68.6481 108 72.0741 108 75.5C108 82.8529 106 89.7939 106 97.0556C106 102.479 94.2642 100 90 100C86.1428 100 82.2387 100.259 78.4444 99.5C68.9183 97.5948 58.3562 102.484 49.2222 99.7778C40.9167 97.3169 32.2034 100 24 100C22.6982 100 16.4293 100.753 16.0556 99.4444C15.4629 97.3701 14 94.9903 14 93C14 89.7541 15.2071 83.4366 13.4444 80.6667C12.2157 78.7358 11 76.6972 11 74C11 67.2874 10 60.5956 10 54C10 50.1481 10 46.2963 10 42.4444C10 38.4983 8 37.9632 8 34.2222C8 30.6481 8 27.0741 8 23.5C8 22.2347 9.44957 17.188 10.2222 16.2222C13.4407 12.1991 13 7.08136 13 2"
const checked = true

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  checked: boolean;
  outlineBoxPath: string;
  checkMarkPath: string;
}

const AnimatedCheckbox = () => {
// const AnimatedCheckbox = ({ checked, outlineBoxPath, checkMarkPath }: Props) => {

  const checkmarkColor = "#000000";
  const highlightColor = "#ff0000";
  const boxOutlineColor = "#000000";

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, {
      duration: 500,
      easing: Easing.linear,
    });
  }, [checked]);

  const animatedBoxProps = useAnimatedProps(() => ({
    stroke: interpolateColor(
      progress.value,
      [0, 1],
      [boxOutlineColor, highlightColor],
      'RGB'
    ),
    fill: interpolateColor(
      progress.value,
      [0, 1],
      ['#000000', highlightColor],
      'RGB'
    ),
  }));

  return (
    <Svg width="114" height="100" viewBox="0 0 114 100" fill="none">
      {/* Static Box Outline */}
      <Path
        d={outlineBoxPath}
        stroke="black"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Animated Box */}
      <AnimatedPath
        d={outlineBoxPath}
        strokeWidth={7}
        strokeLinejoin="round"
        strokeLinecap="round"
        animatedProps={animatedBoxProps}
      />
      {/* Checkmark Path */}
      <Path
        d={checkMarkPath}
        stroke={checkmarkColor}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default AnimatedCheckbox;