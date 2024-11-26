import React from 'react'
import { Link, useMatch, useNavigate, } from 'react-router-dom';
import classes from '../App.module.css'

function NavigationItem({to, children, ...props}) {
    // function to navigate to different route
    const navigate = useNavigate()

    // "null" when not active, "object" when active
    const routeMatch = useMatch(to)

    // path is matched if routeMatch is not null ${isActive ? "active" : ""}  customLinkActive
    const isActive = Boolean(routeMatch)
    const onClick = () => navigate(to);

    return (
        <li className={(isActive ? ` ${classes.customLinkActive}` : '')} onClick={onClick}>
            <Link to={to} {...props}>
                {children}
            </Link>
        </li>
    )
}

export const Navigation = () => {
    return <>
        <div>
            <nav className={classes.nav}>
                <ul>
                    <NavigationItem to="/">Home</NavigationItem>
                    <NavigationItem to="/events">Events</NavigationItem>
                    <NavigationItem to="/configure">Configuration</NavigationItem>
                </ul>
            </nav>
        </div>
    </>
}
