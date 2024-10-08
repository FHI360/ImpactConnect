import classnames from 'classnames';
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
    const classess = classnames({
            'block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700': !isActive
        },
        {'block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500': isActive}
    )

    return (
        <button type="button"
                onClick={onClick}
                className={classess}>
            <Link to={to} {...props}>
                {children}
            </Link>
        </button>
    )
}

export const Navigation = () => {
    return <>
        <div
            className="relative top-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                <NavigationItem to="/">
                    <span>Home</span>
                </NavigationItem>
                <NavigationItem to="/configure">
                    <span>Configuration</span>
                </NavigationItem>
            </div>
        </div>
    </>
}
