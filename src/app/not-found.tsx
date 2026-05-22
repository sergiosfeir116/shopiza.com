import { EmptyState } from "@/components/ui/empty-state";
import { APP_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="container-shell py-12">
      <EmptyState
        title="We couldn’t find that page"
        description={`The route you requested does not exist, or the content was moved to another part of ${APP_NAME}.`}
        ctaLabel="Go back home"
        ctaHref="/"
      />
    </div>
  );
}
