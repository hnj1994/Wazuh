import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function ChartFrame({ title, description, children, action }: ChartFrameProps) {
  return (
    <Card className="bg-card/90 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
