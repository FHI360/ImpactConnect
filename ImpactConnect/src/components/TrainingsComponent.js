import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { DataElementComponent } from './DataElement.js';

export const TrainingsComponent = ({trainings, trainingSelected}) => {
    const [selectedTraining, setSelectedTraining] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [dataElements, setDataElements] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [groupValues, setGroupValues] = useState({});
    const [selectedStage, setSelectedStage] = useState('');

    useEffect(() => {

    }, [selectedTraining]);

    const groupDataElementValue = (dataElement) => {
        return groupValues[dataElement];
    }

    return (
        <>
            <div className="pb-2">
                <label htmlFor="program"
                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Training
                </label>
                <select
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={selectedTraining}
                    onChange={(event) => {
                        setSelectedTraining(event.target.value);
                        trainingSelected(event.target.value);
                    }}>
                    <option
                        selected>Select one
                    </option>
                    {trainings.map(option => {
                            return <>
                                <option
                                    value={option.id}>{option.label}</option>
                            </>
                        }
                    )}
                </select>
            </div>
            {selectedTraining &&
            <div className="p-2">
                <h2 onClick={() => setCollapsed(!collapsed)}>
                    <button type="button"
                            className="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3"
                            data-accordion-target="#accordion-collapse-body-1" aria-expanded="true"
                            aria-controls="accordion-collapse-body-1">
                        <span>What is Flowbite?</span>
                        {collapsed &&
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true"
                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M9 5 5 1 1 5"/>
                            </svg>
                        }
                        {!collapsed &&
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true"
                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M9 5 5 1 1 5"/>
                            </svg>
                        }

                    </button>
                </h2>
                <div className={collapsed ? '' : 'hidden'} >
                    <div className="p-5 border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                        {configuredStages[selectedStage] && (configuredStages[selectedStage]['groupDataElements'] || []).length > 0 &&
                            <div className="w-full flex flex-col pt-2">
                                <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                    <div
                                        className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                        <div className="w-3/12 p-2">
                                            {dataElements.length > 0 && (configuredStages[selectedStage]['groupDataElements'] || []).map((cde, idx) => {
                                                const de = dataElements.find(de => de.id === cde);
                                                return <>
                                                    <DataElementComponent key={idx}
                                                                          value={groupDataElementValue(cde)}
                                                                          dataElement={de}
                                                                          labelVisible={true}
                                                                          readonly={true}/>
                                                </>
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
            }
        </>
    )
}

TrainingsComponent.propTypes = {
    trainingSelected: PropTypes.func,
    trainings: PropTypes.array
};
