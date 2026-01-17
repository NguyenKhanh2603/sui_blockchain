import React from "react";
import Badge from "../ui/Badge";
import { statusVariant } from "../../utils/formatters";

function StatusBadge({ status, children }) {
  return (
    <Badge variant={statusVariant(status)}>
      {children || status}
    </Badge>
  );
}

export default StatusBadge;
