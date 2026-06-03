export function Loader() {
  return (
    <div className="flex items-center justify-center py-5">
      <div className="h-[18px] w-[120px] animate-pulse rounded-full bg-[rgba(var(--vs-text),0.12)]" />
      <span className="sr-only">載入中...</span>
    </div>
  )
}
