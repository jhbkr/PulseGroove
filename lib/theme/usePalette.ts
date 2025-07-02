import { useEffect, useState } from "react";
// @ts-ignore
const Vibrant = require("node-vibrant");

export function usePalette(imageUrl?: string) {
  const [palette, setPalette] = useState<any>(null);

  useEffect(() => {
    if (!imageUrl) return;
    Vibrant.from(imageUrl).getPalette().then((palette: any) => {
      setPalette(palette);
    });
  }, [imageUrl]);

  return palette;
} 