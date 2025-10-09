import CardSkeleton, {
  TableSkeleton,
  WidgetSkeleton,
} from "../Skeleton/Skeleton";

interface SkeletonAdapter {
  [key: string]: React.FC<any>;
}

export type SkeletonType = "CardSkeleton" | "TableSkeleton" | "WidgetSkeleton";

const SkeletonComponents: SkeletonAdapter = {
  CardSkeleton: CardSkeleton,
  TableSkeleton: TableSkeleton,
  WidgetSkeleton: WidgetSkeleton,
};

const SkeletonAdapterComponent: React.FC<{ type: SkeletonType }> = ({
  type,
}) => {
  const SkeletonComponent = SkeletonComponents[type];
  return <SkeletonComponent />;
};

export default SkeletonAdapterComponent;
