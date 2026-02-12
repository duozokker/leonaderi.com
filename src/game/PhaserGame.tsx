import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createOverworldScene } from './scenes/OverworldScene'

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#000000',
      pixelArt: true,
      roundPixels: true,
      width: 960,
      height: 540,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [createOverworldScene()],
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div className="phaser-container" ref={containerRef} />
}
