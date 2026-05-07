import markLogo from '../../assets/logo/mark.png';
import wordmarkLogo from '../../assets/logo/wordmark.png';

type BrandLogoVariant = 'mark' | 'wordmark';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  imageClassName?: string;
  alt?: string;
}

const variantClasses: Record<BrandLogoVariant, string> = {
  mark: 'h-12 w-12',
  wordmark: 'h-16 w-auto',
};

const BrandLogo = ({
  variant = 'wordmark',
  className = '',
  imageClassName = '',
  alt = 'MedInOne logo',
}: BrandLogoProps) => {
  const source = variant === 'mark' ? markLogo : wordmarkLogo;

  return (
    <div className={`flex shrink-0 items-center ${className}`}>
      <img
        src={source}
        alt={alt}
        className={`block object-contain ${variantClasses[variant]} ${imageClassName}`}
        draggable={false}
      />
    </div>
  );
};

export default BrandLogo;
