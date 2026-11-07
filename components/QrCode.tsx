"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  alt: string;
  className?: string;
};

export default function QrCode({ value, alt, className = "" }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: 480,
      margin: 1,
      color: { dark: "#001a14ff", light: "#ffffffff" },
    })
      .then((next) => {
        if (alive) setUrl(next);
      })
      .catch(() => {
        if (alive) setUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [value]);

  if (!url) {
    return <div aria-hidden className={`${className} animate-pulse bg-white/20`} />;
  }
  // Data-URL QR codes are tiny and static — next/image adds no value here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}
