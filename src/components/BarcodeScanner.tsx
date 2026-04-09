import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { ScanBarcode, X, Loader2 } from 'lucide-react'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onClose: () => void
  isProcessing?: boolean
}

// Overlay modal con cámara para escanear códigos de barras EAN/UPC
export function BarcodeScanner({ onBarcodeDetected, onClose, isProcessing }: BarcodeScannerProps) {
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasDetected = useRef(false)
  const containerId = 'barcode-reader'

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop()
      }
      scannerRef.current?.clear()
    } catch {
      // Ignore cleanup errors
    }
    scannerRef.current = null
  }, [])

  useEffect(() => {
    let mounted = true

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
          verbose: false,
        })

        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 120 } },
          (decodedText) => {
            if (hasDetected.current) return
            hasDetected.current = true
            onBarcodeDetected(decodedText)
          },
          undefined
        )

        if (mounted) setScanning(true)
      } catch (err) {
        if (!mounted) return
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setError('Permiso de cámara denegado. Habilítalo en la configuración del navegador.')
        } else if (msg.includes('NotFoundError')) {
          setError('No se encontró una cámara en este dispositivo.')
        } else {
          setError(`Error al iniciar cámara: ${msg}`)
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      stopScanner()
    }
  }, [onBarcodeDetected, stopScanner])

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <ScanBarcode className="w-5 h-5 text-primary" />
          <span className="text-white font-semibold text-sm">Escanear código de barras</span>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="relative w-full max-w-sm mx-4">
        <div
          id={containerId}
          className="w-full rounded-2xl overflow-hidden bg-dark-card border border-dark-border/40"
          style={{ minHeight: '280px' }}
        />

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-white text-sm font-medium">Buscando producto...</span>
          </div>
        )}
      </div>

      {/* Status messages */}
      <div className="mt-4 px-6 text-center">
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : scanning && !isProcessing ? (
          <p className="text-dark-muted text-sm">
            Apunta la cámara al código de barras del producto
          </p>
        ) : !scanning && !error ? (
          <p className="text-dark-muted text-sm animate-pulse">Iniciando cámara...</p>
        ) : null}
      </div>
    </div>
  )
}
