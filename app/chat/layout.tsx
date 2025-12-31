import type { Metadata } from "next"

import AppWrapper from "@/components/AppWrapper"
import { ChildrenType } from "@/types"
import { appDescription, appTitle } from "@/helpers"

// 🔥 Estilos globales del dashboard (OK aquí)
import "flatpickr/dist/flatpickr.css"
import "simplebar-react/dist/simplebar.min.css"
import "jsvectormap/dist/css/jsvectormap.min.css"
import "@/assets/scss/app.scss"

export const metadata: Metadata = {
  title: appTitle,
  description: appDescription,
}

const DashboardLayout = ({ children }: ChildrenType) => {
  return (
    <AppWrapper>
      {children}
    </AppWrapper>
  )
}

export default DashboardLayout
