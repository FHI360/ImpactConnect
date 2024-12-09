import { useDataEngine } from '@dhis2/app-runtime';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { DataElementComponent } from './DataElement.js';

export const TrainingsComponent = ({program, trainings, trainingSelected, loading}) => {
    const engine = useDataEngine();
    const [selectedTraining, setSelectedTraining] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [attributes, setAttributes] = useState([]);
    const [entityAttributes, setEntityAttributes] = useState([]);

    useEffect(() => {
        if (selectedTraining) {
            engine.query({
                trainings: {
                    resource: `tracker/trackedEntities/${selectedTraining}`,
                    params: {
                        fields: 'attributes',
                        program
                    }
                }
            }).then(res => {
                setAttributes(res.trainings.attributes);
            });

            engine.query({
                attributes: {
                    resource: `trackedEntityAttributes`,
                    params: ({program}) => ({
                        fields: ['id', 'displayName', 'optionSet(id)', 'valueType'],
                        paging: 'false',
                        program: program
                    }),
                }
            }).then(res => {
                setEntityAttributes(res.attributes.trackedEntityAttributes);
            })
        }
    }, [selectedTraining]);

    return (
        <>
            <div className="pb-2 w-3/12">
                <label htmlFor="program"
                       className="label">
                    Available Events
                </label>
                <select
                    className="select"
                    value={selectedTraining}
                    onChange={(event) => {
                        setSelectedTraining(event.target.value);
                        trainingSelected(event.target.value);
                    }}>
                    {loading ? (
                        <option>Loading...</option>
                    ) : (
                        <>
                            <option
                                selected>Select training
                            </option>
                            {trainings.sort((t1, t2) => t1?.label?.localeCompare(t2?.label)).map(option => {
                                    return <>
                                        <option
                                            value={option.id}>{option.label}</option>
                                    </>
                                }
                            )}
                        </>
                    )}
                </select>
            </div>
            {selectedTraining &&
                <div className="">
                    <h2 onClick={() => setCollapsed(!collapsed)}>
                        <button type="button"
                                className="bg-white flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 hover:bg-gray-100 gap-3"
                                data-accordion-target="#accordion-collapse-body-1" aria-expanded="true"
                                aria-controls="accordion-collapse-body-1">
                            <span>{trainings.find(t => t.id === selectedTraining)?.label}</span>
                            {collapsed &&
                                <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true"
                                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                          stroke-width="2"
                                          d="M9 5 5 1 1 5"/>
                                </svg>
                            }
                            {!collapsed &&
                                <svg data-accordion-icon className="w-3 h-3 shrink-0" aria-hidden="true"
                                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                          stroke-width="2"
                                          d="M9 5 5 1 1 5"/>
                                </svg>
                            }
                        </button>
                    </h2>
                    <div className={collapsed ? '' : 'hidden'}>
                        <div
                            className="bg-white border border-b-0 border-gray-200 ">
                            {(attributes || []).length > 0 &&
                                <div className="w-full flex flex-col pt-2">
                                    <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                        <div
                                            className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                            <div className="w-3/12 p-2">
                                                {attributes.map((attr, idx) => {
                                                    const de = entityAttributes.find(ea => ea.id === attr.attribute);
                                                    return <>
                                                        <DataElementComponent key={idx}
                                                                              value={attr.value}
                                                                              label={attr.displayName}
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
    loading: PropTypes.bool,
    program: PropTypes.string,
    trainingSelected: PropTypes.func,
    trainings: PropTypes.array
};
