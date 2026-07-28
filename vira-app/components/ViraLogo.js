import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../lib/theme';

export default function ViraLogo({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 4 L9 20 L13 20 L21 4 L17 4 L11.5 15.5 C11 16.5 12.5 17 13 16 L19 4"
        fill="none"
        stroke={COLORS.accent}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
