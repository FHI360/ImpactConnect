import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import ConfigurationComponent from './components/ConfigurationComponent.js';
import { EventsComponent } from './components/EventsComponent.js';
import { ImportExportComponent } from './components/ImportExportComponent.js';
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
                        <Route
                            configure
                            exact
                            path="/events"
                            element={<EventsComponent/>}
                        />
                        <Route
                            configure
                            exact
                            path="/import"
                            element={<ImportExportComponent/>}
                        />
                        {/* defaulting if unmatched */}
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Routes>
                </div>

                <footer>
                    <div className="flex flex-col items-center">
                        {/*{customImage('logo')}*/}
                        <p className="mx-auto font-semibold">{footerText}</p>
                    </div>
                </footer>
            </div>
        </HashRouter>
    </SetupStateProvider>
)

export default MyApp
