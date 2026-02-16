import * as React from "react"

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

const MOBILE_MAX = 768
const TABLET_MAX = 1024

function getDeviceType(width: number): DeviceType {
  if (width < MOBILE_MAX) return 'mobile'
  if (width < TABLET_MAX) return 'tablet'
  return 'desktop'
}

export function useDeviceType(): DeviceType {
  const [device, setDevice] = React.useState<DeviceType>(() =>
    typeof window !== 'undefined' ? getDeviceType(window.innerWidth) : 'desktop'
  )

  React.useEffect(() => {
    const onResize = () => {
      setDevice(getDeviceType(window.innerWidth))
    }

    const mqlMobile = window.matchMedia(`(max-width: ${MOBILE_MAX - 1}px)`)
    const mqlTablet = window.matchMedia(`(max-width: ${TABLET_MAX - 1}px)`)

    mqlMobile.addEventListener("change", onResize)
    mqlTablet.addEventListener("change", onResize)

    return () => {
      mqlMobile.removeEventListener("change", onResize)
      mqlTablet.removeEventListener("change", onResize)
    }
  }, [])

  return device
}
