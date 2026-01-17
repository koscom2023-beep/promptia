"use client";

import { useEffect } from "react";

interface AdSenseUnitProps {
  adSlot: string;
  adFormat: string;
  style?: React.CSSProperties;
  className?: string;
}

export function AdSenseUnit({
  adSlot,
  adFormat,
  style,
  className = "",
}: AdSenseUnitProps) {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense 오류:", err);
    }
  }, []);

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXX"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
