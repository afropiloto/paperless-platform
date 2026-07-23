export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-accent/50 p-6 rounded-full mb-6">
        <h1 className="text-4xl font-bold text-muted-foreground/30">Coming Soon</h1>
      </div>
      <h2 className="text-2xl font-bold mb-2">Module under development</h2>
      <p className="text-muted-foreground max-w-md">
        This section is part of the broader Paperless platform but isn't required for the DvP settlement MVP flow.
      </p>
    </div>
  );
}