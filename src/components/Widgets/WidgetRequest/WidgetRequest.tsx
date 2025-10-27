import React, { JSX } from "react";
import styles from "./RequestWidget.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";

// Interface for each item in the widget
interface RequestItem {
  id?: string | number;
  name: string;
  description: string;
  imageUrl?: string | null;
  level?: "high" | "medium" | "low"; // Used only for alerts
}

// Props for the RequestWidget component
interface RequestWidgetProps {
  title: string;
  items: RequestItem[];
  viewAllText?: string;
  onViewAll: () => void;
  type: "request" | "alert";
}

/**
 * RequestWidget - A customizable component for displaying requests and alerts
 *
 * @param {RequestWidgetProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const RequestWidget: React.FC<RequestWidgetProps> = ({
  title,
  items = [],
  viewAllText = "View all",
  onViewAll,
  type = "request",
}) => {
  // Function to render the status element based on the widget type
  const renderStatus = (item: RequestItem): JSX.Element | null => {
    if (type === "request") {
      return (
        <div className={styles.reviewButton}>
          <span>Review</span>
        </div>
      );
    } else if (type === "alert" && item.level) {
      // Get the appropriate status class based on level
      let statusClass: string;
      let statusText: string;

      switch (item.level) {
        case "high":
          statusClass = styles.highLevel;
          statusText = "High level";
          break;
        case "medium":
          statusClass = styles.mediumLevel;
          statusText = "Medium level";
          break;
        case "low":
          statusClass = styles.lowLevel;
          statusText = "Low level";
          break;
        default:
          statusClass = styles.mediumLevel;
          statusText = "Medium level";
      }

      return (
        <div className={`${styles.levelIndicator} ${statusClass}`}>
          <span>{statusText}</span>
        </div>
      );
    }

    return null;
  };

  // Generate initials from name if no image is available
  const getInitials = (name: string): string => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.viewAllContainer}>
          <span className={styles.viewAllText} onClick={onViewAll}>
            {viewAllText}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {items.map((item, index) => (
          <div key={item.id || index} className={styles.item}>
            <div className={styles.avatar}>
              {item.imageUrl ? (
                <Avatar
                  hasImage={1}
                  src={item.imageUrl}
                  name={item.name}
                  w={48}
                  h={48}
                />
              ) : (
                <div className={styles.initialsAvatar}>
                  <span>{getInitials(item.name)}</span>
                </div>
              )}
            </div>

            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemDescription}>{item.description}</span>
            </div>

            {renderStatus(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestWidget;
