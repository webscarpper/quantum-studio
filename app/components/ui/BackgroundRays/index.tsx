import styles from './styles.module.scss';
import { classNames } from '~/utils/classNames'; // For merging class names

interface BackgroundRaysProps {
  className?: string;
}

const BackgroundRays: React.FC<BackgroundRaysProps> = ({ className }) => {
  return (
    <div className={classNames(styles.rayContainer, className)}>
      {/* Using two layers for the aurora effect */}
      <div className={`${styles.auroraLayer} ${styles.auroraLayer1}`}></div>
      <div className={`${styles.auroraLayer} ${styles.auroraLayer2}`}></div>
    </div>
  );
};

export default BackgroundRays;
