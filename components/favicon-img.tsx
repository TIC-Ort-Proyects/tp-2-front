"use client";

export function FaviconImg({ hostname }: { hostname: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
      alt=""
      className="size-8 rounded-lg"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
