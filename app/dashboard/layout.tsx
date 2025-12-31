import AppWrapper from "@/components/AppWrapper"
import { LayoutProvider } from "@/context/useLayoutContext"

import "flatpickr/dist/flatpickr.css"
import "simplebar-react/dist/simplebar.min.css"
import "jsvectormap/dist/css/jsvectormap.min.css"
import "@/assets/scss/app.scss"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LayoutProvider>
      <AppWrapper>{children}</AppWrapper>
    </LayoutProvider>
  )
}
