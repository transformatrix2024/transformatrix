import { Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Shown in place of a feature until its environment variables are set.
export function NotConfigured({
  title,
  description,
  vars,
}: {
  title: string;
  description: React.ReactNode;
  vars: { name: string; hint: React.ReactNode }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3 text-sm">
          {vars.map((v) => (
            <li key={v.name} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <code className="w-fit shrink-0 self-start rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {v.name}
              </code>
              <span className="text-muted-foreground">{v.hint}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Add them in Vercel → Settings → Environment Variables, then redeploy.
        </p>
      </CardContent>
    </Card>
  );
}
