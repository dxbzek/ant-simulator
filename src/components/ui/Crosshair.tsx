export default function Crosshair() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="relative w-6 h-6">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/70 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 h-full w-[2px] bg-white/70 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}
