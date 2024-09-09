import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import ConfigurationComponent from './components/ConfigurationComponent.js';
import { Main } from './components/main/Main.js';
import { footerText } from './consts.js';
import SetupStateProvider from './SetupStateProvider.js';
import './index.css';

const MyApp = () => (
    <SetupStateProvider>
        <HashRouter>
            <div>
                <div className="w-full bg-white">
                    <Routes>
                        <Route
                            exact
                            path="/"
                            element={<Main/>}
                        />
                        <Route
                            configure
                            exact
                            path="/configure"
                            element={<ConfigurationComponent/>}
                        />
                        {/* defaulting if unmatched */}
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Routes>
                </div>

                <footer>
                    <div className="flex items-center">
                        <p className="mx-auto font-semibold">{footerText}</p>
                    </div>
                </footer>
            </div>
        </HashRouter>
    </SetupStateProvider>
)

export default MyApp
