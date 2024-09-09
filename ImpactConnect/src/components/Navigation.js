import React from 'react'
import { Link, useMatch, useNavigate, } from 'react-router-dom';

function NavigationItem({to, children, ...props}) {
    // function to navigate to different route
    const navigate = useNavigate()


    // "null" when not active, "object" when active
    const routeMatch = useMatch(to)

    // path is matched if routeMatch is not null ${isActive ? "active" : ""}  customLinkActive
    const isActive = Boolean(routeMatch)
    const onClick = () => navigate(to)
    // console.log({children})
    // console.log({...props})

    return (
        <button type="button"
                onClick={onClick}
                className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <Link to={to} {...props}>
                {children}
            </Link>
        </button>
    )
}

export const Navigation = () => (
    <div
        className="relative top-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
            <NavigationItem to="/">
                <span
                    className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Home</span>
            </NavigationItem>
            <NavigationItem to="/configure">Configuration</NavigationItem>
        </div>
    </div>
)
