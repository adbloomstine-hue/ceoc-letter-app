import { useRef, useEffect, useCallback } from 'react'
import SignaturePadLib from 'signature_pad'

export default function SignaturePad({ onSignatureChange }) {
  const canvasRef = useRef(null)
  const padRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d').scale(ratio, ratio)

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: '#1a1a2e',
    })

    padRef.current.addEventListener('endStroke', () => {
      if (onSignatureChange) {
        onSignatureChange(padRef.current.toDataURL())
      }
    })

    return () => {
      if (padRef.current) padRef.current.off()
    }
  }, [])

  const clear = useCallback(() => {
    if (padRef.current) {
      padRef.current.clear()
      if (onSignatureChange) onSignatureChange(null)
    }
  }, [onSignatureChange])

  return (
    <div>
      <label className="block text-sm font-medium text-navy-800 mb-1">
        Digital Signature <span className="text-red-500">*</span>
      </label>
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height: '150px' }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-400">Draw your signature above</span>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-gold-600 hover:text-gold-700 font-medium"
        >
          Clear Signature
        </button>
      </div>
    </div>
  )
}
