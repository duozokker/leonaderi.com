import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createOverworldScene } from './scenes/OverworldScene'
import { resolveRendererPreference } from './rendererMode'

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const renderer = resolveRendererPreference()
    const rendererType = renderer === 'canvas'
      ? Phaser.CANVAS
      : renderer === 'webgl'
        ? Phaser.WEBGL
        : Phaser.AUTO

    const config: Phaser.Types.Core.GameConfig = {
      type: rendererType,
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
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
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
