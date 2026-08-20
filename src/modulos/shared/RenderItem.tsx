import useLongPress from "@/mk/hooks/useLongPress";

const RenderItem = ({
  children,
  item,
  onClick,
  onLongPress,
}: {
  children: any;
  item: Record<string, any>;
  onClick: Function;
  onLongPress: Function;
}) => {
  const { props } = useLongPress(() => onLongPress(item), 500);
  return (
    <div
      {...props}
      onClick={() => {
        if (onClick) onClick(item);
      }}
    >
      {children}
    </div>
  );
};

export default RenderItem;
