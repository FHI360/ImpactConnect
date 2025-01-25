import React from 'react';
import { customImage } from '../utils.js'
import { Navigation } from './Navigation.js';

const NotFoundPage = () => {
    const homePath = () => {
        return (window.location + '').split('#')[0];
    }
    return (
        <div className="flex flex-row w-full h-full">
            <div className="page">
                <Navigation/>
                <div className="flex flex-col items-center justify-center h-screen bg-white">
                    {customImage('404')}
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                    <p className="text-xl text-gray-600 mb-4">Page Not Found</p>
                    <a href={homePath()} className="mt-4 text-blue-500 hover:underline">
                        Go back to the homepage
                    </a>
                </div>
            </div>
        </div>

    );
};

export default NotFoundPage;
