"use client";

import {Button, Container} from "react-bootstrap";
import NotificationDropdown from "@/layouts/components/topbar/components/NotificationDropdown";
import CustomizerToggler from "@/layouts/components/topbar/components/CustomizerToggler";
import ThemeToggler from "@/layouts/components/topbar/components/ThemeToggler";
import UserProfile from "@/layouts/components/topbar/components/UserProfile";
import {TbMenu4} from "react-icons/tb";
import {useLayoutContext} from "@/context/useLayoutContext";
import Link from "next/link";
import Image from "next/image";

import logo from "@/assets/images/logo.png"
import logoSm from "@/assets/images/logo-sm.png"
import logoDark from "@/assets/images/logo-black.png"



const Topbar = () => {

    const {sidenav, changeSideNavSize, showBackdrop} = useLayoutContext()

    const toggleSideNav = () => {
        const html = document.documentElement;
        const currentSize = html.getAttribute('data-sidenav-size');

        if (currentSize === 'offcanvas') {
            html.classList.toggle('sidebar-enable')
            showBackdrop()
        } else if (sidenav.size === 'compact') {
            changeSideNavSize(currentSize === 'compact' ? 'condensed' : 'compact', false);
        } else {
            changeSideNavSize(currentSize === 'condensed' ? 'default' : 'condensed');
        }
    }

    return (
        <header className="app-topbar">
            <Container fluid className="topbar-menu">
                <div className="d-flex align-items-center gap-2">
                  <Button 
                    onClick={toggleSideNav} 
                    className="sidenav-toggle-button"
                  >
                    <TbMenu4 className="fs-22 text-white" />
                  </Button>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <NotificationDropdown/>

                    <CustomizerToggler/>

                    <ThemeToggler/>

                    <UserProfile/>
                </div>
            </Container>
        </header>
    )
}

export default Topbar