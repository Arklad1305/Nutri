export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex space-x-1.5">
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></div>
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></div>
      </div>
      <span className="text-sm text-dark-muted animate-pulse">Analizando...</span>
    </div>
  )
}
