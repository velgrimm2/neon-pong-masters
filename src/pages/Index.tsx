import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "../game/config";

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) return;

    const config = createGameConfig(container);
    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen bg-background overflow-hidden flex items-center justify-center"
    />
  );
};

export default Index;
