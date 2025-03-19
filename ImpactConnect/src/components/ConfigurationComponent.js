import { useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Transfer } from '@dhis2/ui';
import React, { useContext, useEffect, useState } from 'react';
import { config } from '../consts.js';
import ArrowDown from '../icons/arrow-down.svg';
import ArrowUp from '../icons/arrow-up.svg';
import { createOrUpdateDataStore, SharedStateContext } from '../utils.js';
import { Navigation } from './Navigation.js';
import ProgramComponent from './ProgramComponent.js';
import ProgramStageComponent from './ProgramStageComponent.js';

const ConfigurationComponent = () => {
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedProgram,
        setSelectedSharedProgram,
    } = sharedState;

    const [keyExists, setKeyExists] = useState({});
    const [selectedProgram, setSelectedProgram] = useState(selectedSharedProgram);
    const [participantsProgram, setParticipantsProgram] = useState('');
    const [trainingProgram, setTrainingProgram] = useState('');
    const [selectedStage, setSelectedStage] = useState('');
    const [attributes, setAttributes] = useState([]);
    const [trainingAttributes, setTrainingAttributes] = useState([]);
    const [trainingAttributesData, setTrainingAttributesData] = useState([]);
    const [nameAttributes, setNameAttributes] = useState([]);
    const [eventNameAttribute, setEventNameAttribute] = useState('');
    const [eventLocationAttribute, setEventLocationAttribute] = useState('');
    const [activeStage, setActiveStage] = useState('');
    const [filterAttributes, setFilterAttributes] = useState([]);
    const [dataElements, setDataElements] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [selectedDataElements, setSelectedDataElements] = useState([]);
    const [selectedGroupDataElements, setSelectedGroupDataElements] = useState([]);
    const [selectedIndividualDataElements, setSelectedIndividualDataElements] = useState([]);
    const [endDateVisible, setEndDateVisible] = useState(false);
    const [groupEdit, setGroupEdit] = useState(true);
    const [editing, setEditing] = useState(false);
    const [configure1, setConfigure1] = useState(false);
    const [configure2, setConfigure2] = useState(false);
    const [editing1, setEditing1] = useState(false);
    const [stages, setStages] = useState([]);
    const [columnDisplay, setColumnDisplay] = useState(false);

    const engine = useDataEngine();

    const dataStoreQuery = {
        dataStore: {
            resource: `dataStore/${config.dataStoreName}?fields=.`,
        }
    };

    const query = {
        programs: {
            resource: `programs`,
            id: ({id}) => id,
            params: {
                fields: ['id', 'displayName', 'programTrackedEntityAttributes(trackedEntityAttribute(id, displayName))', 'trackedEntityType'],
                paging: 'false'
            },
        }
    }

    const dataElementsQuery = {
        programStage: {
            resource: `programStages`,
            id: ({id}) => id,
            params: ({
                fields: 'programStageDataElements(dataElement(id, name))'
            })
        }
    }

    const stageQuery = {
        programStages: {
            resource: 'programStages',
            params: ({program}) => ({
                fields: ['id', 'displayName'],
                filter: `program.id:eq:${program || '-'}`,
            })
        }
    }

    const {data} = useDataQuery(query, {
        variables: {
            id: participantsProgram
        }
    });

    const {data: trainingData} = useDataQuery(query, {
        variables: {
            id: trainingProgram
        }
    });

    const {data: stageData, refetch: refetchStages} = useDataQuery(stageQuery, {
        variables: {
            program: participantsProgram
        }
    });

    const {
        data: elementsData,
        refetch: refetchDataElements
    } = useDataQuery(dataElementsQuery, {variables: {id: selectedStage}});

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    useEffect(() => {
        if ((data?.programs?.programs || data?.programs?.programTrackedEntityAttributes) && participantsProgram) {
            const attributes = (data.programs?.programs?.find(p => p.id === participantsProgram)?.programTrackedEntityAttributes ||
                data?.programs?.programTrackedEntityAttributes)?.map(attr => {
                return {
                    label: attr.trackedEntityAttribute.displayName,
                    value: attr.trackedEntityAttribute.id
                };
            });
            if (attributes) {
                setAttributes(attributes);
            }
        }
    }, [data, participantsProgram]);

    useEffect(() => {
        if ((trainingData?.programs?.programs || trainingData?.programs?.programTrackedEntityAttributes) && trainingProgram) {
            const attributes = (trainingData.programs?.programs?.find(p => p.id === trainingProgram)?.programTrackedEntityAttributes ||
                trainingData?.programs?.programTrackedEntityAttributes)?.map(attr => {
                return {
                    label: attr.trackedEntityAttribute.displayName,
                    value: attr.trackedEntityAttribute.id
                };
            });
            if (attributes) {
                setTrainingAttributesData(attributes);
            }
        }
    }, [trainingData, trainingProgram]);

    useEffect(() => {
        refetchDataElements({id: selectedStage});
        if (elementsData && elementsData.programStage && elementsData.programStage.programStageDataElements) {
            const dataElements = elementsData.programStage?.programStageDataElements?.map(data => data.dataElement);
            setDataElements(dataElements);
        }
    }, [elementsData, selectedStage]);

    useEffect(() => {
        refetchStages({program: participantsProgram})
        if (stageData && stageData.programStages) {
            setStages(stageData.programStages.programStages)
        }
    }, [participantsProgram, stageData]);

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === `${config.dataStoreKey}`);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setFilterAttributes(entry.value.filterAttributes || []);
                setConfiguredStages(entry.value.configuredStages || {
                    dataElements: [],
                    individualDataElements: [],
                    groupDataElements: [],
                });
                setTrainingAttributes(entry.value.trainingAttributes || []);
                setEndDateVisible(entry.value.endDateVisible)
                setEventLocationAttribute(entry.value.eventLocationAttribute)
                setGroupEdit(entry.value.groupEdit);
                setColumnDisplay(entry.value.columnDisplay);
                setParticipantsProgram(entry.value.participantsProgram);
                setTrainingProgram(entry.value.trainingProgram);
                setActiveStage(entry.value.activeStage);
                setEventNameAttribute(entry.value.eventNameAttribute)
                const exists = keyExists;
                exists[`${config.dataStoreKey}`] = true;
                setKeyExists(exists);
            }
        }
    }, [dataStore]);

    const handleProgramChange = (event) => {
        setSelectedProgram(event);
        setSelectedSharedProgram(event);
        setConfiguredStages({});
        setSelectedDataElements([]);
        setSelectedIndividualDataElements([]);
        setSelectedGroupDataElements([]);
    }

    const participantsProgramChange = (event) => {
        setParticipantsProgram(event);
        dataStoreOperation('participantsProgram', event);
    }

    const trainingProgramChange = (event) => {
        setTrainingProgram(event);
        dataStoreOperation('trainingProgram', event);
    }

    const dataStoreOperation = (type, data) => {
        const value = {
            participantsProgram,
            trainingProgram,
            nameAttributes,
            filterAttributes,
            configuredStages,
            endDateVisible,
            groupEdit,
            columnDisplay,
            trainingAttributes,
            activeStage,
            eventNameAttribute,
            eventLocationAttribute
        }
        value[type] = data;

        createOrUpdateDataStore(engine, value, config.dataStoreName, config.dataStoreKey, keyExists[`${config.dataStoreKey}`] ? 'update' : 'create');
    }

    const moveElement = (array, from, to) => {
        // Remove the element from its original position
        const element = array.splice(from, 1)[0];

        // Insert it at the new position
        array.splice(to, 0, element);

        return array;
    }

    const moveDataElement = (type, from, to) => {
        let source = selectedDataElements;
        if (type === 'group') {
            source = selectedGroupDataElements;
        } else if (type === 'individual') {
            source = selectedIndividualDataElements;
        }
        const dataElements = moveElement(source, from, to);
        if (type === 'group') {
            setSelectedGroupDataElements([...dataElements]);
        } else if (type === 'individual') {
            setSelectedIndividualDataElements([...dataElements]);
        } else {
            setSelectedDataElements([...dataElements]);
        }

        const stages = configuredStages;
        stages[selectedStage] = {
            individualDataElements: type === 'individual' ? dataElements : selectedIndividualDataElements,
            dataElements: type === 'all' ? dataElements : selectedDataElements,
            groupDataElements: type === 'group' ? dataElements : selectedGroupDataElements
        };
        setConfiguredStages(stages);

        dataStoreOperation('configuredStages', stages);
    }

    return (
        <>
            <div className="flex flex-row w-full h-full">
                <div className="page">
                    <Navigation/>
                    <div className="p-6">
                        <div className="flex flex-col w-full">
                            <div className="shadow-sm rounded-md p-2 bg-white mb-2">
                                <div className="w-3/12">
                                    <ProgramComponent
                                        selectedProgram={trainingProgram}
                                        setSelectedProgram={trainingProgramChange}
                                        label={'Training Program'}
                                    />
                                </div>
                            </div>
                            {trainingProgram &&
                                <>
                                    <div className="card">
                                        <label className="label">
                                            {i18n.t('Training Attribute(s)')}
                                        </label>
                                        <Transfer options={trainingAttributesData} selected={trainingAttributes}
                                                  leftHeader={<div className="p-2 font-semibold">Available
                                                      Attributes</div>}
                                                  rightHeader={<div className="p-2 font-semibold">Configured
                                                      Training Attribute(s)</div>}
                                                  onChange={(payload) => {
                                                      setTrainingAttributes(payload.selected);
                                                      dataStoreOperation('trainingAttributes', payload.selected);
                                                  }}
                                                  enableOrderChange
                                        />
                                    </div>
                                    <div className="card">
                                        <div className="w-3/12">
                                            <label className="label">
                                                Event Unique Name Attribute
                                            </label>
                                            <select className="select"
                                                    value={eventNameAttribute}
                                                    onChange={(event) => {
                                                        setEventNameAttribute(event.target.value);
                                                        dataStoreOperation('eventNameAttribute', event.target.value);
                                                    }}>
                                                <option
                                                    selected>Select one
                                                </option>
                                                {(trainingAttributesData || []).map(option => {
                                                        return <>
                                                            <option
                                                                value={option.value}>{option.label}</option>
                                                        </>
                                                    }
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            }
                            <div className="card">
                                <div className="w-3/12">
                                    <ProgramComponent
                                        selectedProgram={participantsProgram}
                                        setSelectedProgram={participantsProgramChange}
                                        label={'Participants\' Program'}
                                    />
                                </div>
                            </div>
                            <div className="card">
                                <label className="label">
                                    {i18n.t('Participant Name Attribute(s)')}
                                </label>
                                <Transfer options={attributes} selected={nameAttributes}
                                          leftHeader={<div className="p-2 font-semibold">Available Attributes</div>}
                                          rightHeader={<div className="p-2 font-semibold">Configured
                                              Name Attribute(s)</div>}
                                          onChange={(payload) => {
                                              setNameAttributes(payload.selected);
                                              dataStoreOperation('nameAttributes', payload.selected);
                                          }}
                                          enableOrderChange
                                />
                            </div>
                            <div className="card">
                                <label className="label">
                                    {i18n.t('Participant Filter Attribute(s)')}
                                </label>
                                <Transfer options={attributes} selected={filterAttributes}
                                          leftHeader={<div className="p-2 font-semibold">Available Attributes</div>}
                                          rightHeader={<div className="p-2 font-semibold">Configured
                                              Filter Attribute(s)</div>}
                                          onChange={(payload) => {
                                              setFilterAttributes(payload.selected);
                                              dataStoreOperation('filterAttributes', payload.selected);
                                          }}
                                          enableOrderChange
                                />
                            </div>
                            {/*<div className="card">
                                <div className="w-3/12">
                                    <label className="label">
                                        Event Location Attribute
                                    </label>
                                    <select className="select"
                                            value={eventLocationAttribute}
                                            onChange={(event) => {
                                                setEventLocationAttribute(event.target.value);
                                                dataStoreOperation('eventLocationAttributes', event.target.value);
                                            }}>
                                        <option
                                            selected>Select one
                                        </option>
                                        {(trainingAttributesData || []).map(option => {
                                                return <>
                                                    <option
                                                        value={option.value}>{option.label}</option>
                                                </>
                                            }
                                        )}
                                    </select>
                                </div>
                            </div>*/}
                            {/*<div className="card">
                                <div
                                    className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={endDateVisible === true}
                                        onChange={(payload) => {
                                            setEndDateVisible(payload.target.checked);
                                            dataStoreOperation('endDateVisible', payload.target.checked);
                                        }}
                                        className="checkbox"/>
                                    <label
                                        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {i18n.t('End Date Visible?')}
                                    </label>
                                </div>
                            </div>*/}
                            <div className="card">
                                <div
                                    className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={groupEdit === true}
                                        onChange={(payload) => {
                                            setGroupEdit(payload.target.checked);
                                            dataStoreOperation('groupEdit', payload.target.checked);
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                    <label
                                        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {i18n.t('Group Action?')}
                                    </label>
                                </div>
                            </div>
                            {/*<div className="card">
                                <div
                                    className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={columnDisplay === true}
                                        onChange={(payload) => {
                                            setColumnDisplay(payload.target.checked);
                                            dataStoreOperation('columnDisplay', payload.target.checked);
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                    <label
                                        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {i18n.t('Display Data Elements as columns in table?')}
                                    </label>
                                </div>
                            </div>*/}
                            <div className="shadow-sm rounded-md p-2 bg-white mb-2">
                                <div className="w-3/12">
                                    <ProgramComponent
                                        selectedProgram={selectedProgram}
                                        setSelectedProgram={handleProgramChange}
                                        label={'Configure Program'}
                                    />
                                </div>
                            </div>
                            <div className="card border-blue-100">
                                {/*<label className="label">
                                    {i18n.t(groupEdit ? 'Configure Program Attributes' : 'Configure Data Elements')}
                                </label>
                                <div className="shadow-md rounded-md p-4 bg-white mb-4">
                                    <label htmlFor="program"
                                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        {i18n.t('Configured Stages')}
                                    </label>
                                    <div className="w-full flex flex-col">
                                        {configuredStages && Object.keys(configuredStages).map((stage) => {
                                            if (stage) {
                                                return <>
                                                    <div className="border-b p-2 bg-gray-100 w-full flex flex-row">
                                                        <div className="w-7/12">
                                                            {stages.find(s => s.id === stage)?.displayName}
                                                        </div>
                                                        <div className="w-5/12 flex-row flex">
                                                            {(groupEdit ? (configuredStages[stage]['groupDataElements'] || []).length > 0 : (configuredStages[stage]['dataElements'] || []).length > 0) &&
                                                                <>
                                                                    <button type="button"
                                                                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                            onClick={() => {
                                                                                setEditing(true);
                                                                                setConfigure1(false);
                                                                                if (groupEdit) {
                                                                                    setSelectedGroupDataElements(configuredStages[stage]['groupDataElements'] || []);
                                                                                } else {
                                                                                    setSelectedDataElements(configuredStages[stage]['dataElements'] || []);
                                                                                }
                                                                                setSelectedStage(stage)
                                                                            }}>Edit Stage
                                                                    </button>
                                                                    <button type="button"
                                                                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                            onClick={() => {
                                                                                setConfigure1(true);
                                                                                setEditing(false);
                                                                                if (groupEdit) {
                                                                                    setSelectedGroupDataElements(configuredStages[stage]['groupDataElements'] || []);
                                                                                } else {
                                                                                    setSelectedDataElements(configuredStages[stage]['dataElements'] || []);
                                                                                }
                                                                                setSelectedStage(stage)
                                                                            }}>Sort Order
                                                                    </button>
                                                                    <button type="button"
                                                                            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                                                                            onClick={() => {
                                                                                const stages = configuredStages
                                                                                delete stages[selectedStage]
                                                                                setConfiguredStages(Object.assign({}, stages));
                                                                                setEditing(false);
                                                                                setSelectedStage('');

                                                                                dataStoreOperation('configuredStages', stages);
                                                                            }}>Delete Stage Config
                                                                    </button>
                                                                </>
                                                            }
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                        })
                                        }
                                    </div>
                                </div>
                                {!editing &&
                                    <div className="w-3/12 flex flex-col">
                                        <div>
                                            <ProgramStageComponent
                                                selectedProgram={selectedProgram}
                                                selectedStage={selectedStage}
                                                setSelectedStage={(selection) => {
                                                    setSelectedStage(selection);
                                                    if (selection) {
                                                        setEditing(true);
                                                        setConfigure2(false);
                                                        setConfigure1(false);
                                                        setSelectedDataElements([]);
                                                        setSelectedGroupDataElements([]);
                                                        setSelectedIndividualDataElements([])

                                                        const stages = configuredStages;
                                                        const stage = stages[selection];
                                                        stages[selection] = {
                                                            individualDataElements: stage ? stage['individualDataElements'] || [] : [],
                                                            dataElements: stage ? stage['dataElements'] || [] : [],
                                                            groupDataElements: stage ? stage['groupDataElements'] || [] : []
                                                        };
                                                        setConfiguredStages(stages);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                }
                                {editing &&
                                    <>
                                        <div className="w-full flex flex-col pt-2">
                                            <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                <div
                                                    className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                    <table
                                                        className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                        <caption
                                                            className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                                                            Data Elements
                                                            <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                                Select data Elements the will be visible for the
                                                                selected stage when
                                                                attending to participants
                                                            </p>
                                                        </caption>
                                                        <thead
                                                            className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                        <tr>
                                                            <th rowSpan={2} className="px-6 py-6">
                                                                <div
                                                                    className="flex items-center mb-4">
                                                                    <input
                                                                        type="checkbox"
                                                                        onChange={(event) => {
                                                                            if (event.target.checked) {
                                                                                setSelectedDataElements(dataElements.map(de => de.id))
                                                                            } else {
                                                                                setSelectedDataElements([])
                                                                            }
                                                                        }}
                                                                        checked={selectedDataElements?.length === dataElements.length}
                                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                </div>
                                                            </th>
                                                            <th data-priority="1" className="px-6 py-3">#</th>
                                                            <th data-priority="2" className="px-6 py-3">
                                                                Data Element
                                                            </th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {dataElements.map((dataElement, index) => {
                                                            return <>
                                                                <tr className="pr-3 text-right odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                                                    <td className="px-6 py-6">
                                                                        <div
                                                                            className="flex items-center mb-4">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={groupEdit ? selectedGroupDataElements?.includes(dataElement.id) : selectedDataElements?.includes(dataElement.id)}
                                                                                onChange={() => {
                                                                                    if (groupEdit) {
                                                                                        if (selectedGroupDataElements?.includes(dataElement.id)) {
                                                                                            setSelectedGroupDataElements(selectedGroupDataElements?.filter(rowId => rowId !== dataElement.id));
                                                                                        } else {
                                                                                            setSelectedGroupDataElements([...selectedGroupDataElements, dataElement.id]);
                                                                                        }
                                                                                    } else {
                                                                                        if (selectedDataElements?.includes(dataElement.id)) {
                                                                                            setSelectedDataElements(selectedDataElements?.filter(rowId => rowId !== dataElement.id));
                                                                                        } else {
                                                                                            setSelectedDataElements([...selectedDataElements, dataElement.id]);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                        </div>
                                                                    </td>
                                                                    <td>{index + 1}</td>
                                                                    <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{dataElement.name}</td>
                                                                </tr>
                                                            </>
                                                        })}
                                                        </tbody>
                                                        <tfoot>
                                                        <tr className="font-semibold text-gray-900 dark:text-white">
                                                            <th scope="row" className="px-6 py-3 text-base">
                                                                {!groupEdit && selectedDataElements?.length > 0 &&
                                                                    <button type="button"
                                                                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                            onClick={() => {
                                                                                const stages = configuredStages;
                                                                                stages[selectedStage] = {
                                                                                    dataElements: selectedDataElements,
                                                                                    individualDataElements: stages[selectedStage]['individualDataElements'],
                                                                                    groupDataElements: stages[selectedStage]['groupDataElements']
                                                                                };
                                                                                setConfiguredStages(stages);
                                                                                setEditing(false);
                                                                                setSelectedStage('');

                                                                                dataStoreOperation('configuredStages', stages);
                                                                            }}>Save stage
                                                                    </button>
                                                                }
                                                                {groupEdit && selectedGroupDataElements?.length > 0 &&
                                                                    <button type="button"
                                                                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                            onClick={() => {
                                                                                const stages = configuredStages;
                                                                                stages[selectedStage] = {
                                                                                    groupDataElements: selectedGroupDataElements,
                                                                                    individualDataElements: stages[selectedStage]['individualDataElements'],
                                                                                    dataElements: stages[selectedStage]['dataElements']
                                                                                };
                                                                                setConfiguredStages(stages);
                                                                                setEditing(false);
                                                                                setSelectedStage('');

                                                                                dataStoreOperation('configuredStages', stages);
                                                                            }}>Save stage
                                                                    </button>
                                                                }
                                                                {configuredStages[selectedStage] &&
                                                                    <button type="button"
                                                                            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                                                                            onClick={() => {
                                                                                const stages = configuredStages
                                                                                if (groupEdit) {
                                                                                    delete stages[selectedStage]['groupDataElement'];
                                                                                } else {
                                                                                    delete stages[selectedStage]['dataElements'];
                                                                                }
                                                                                if (!stages[selectedStage]['individualDataElements'] &&
                                                                                    !stages[selectedStage]['dataElements'] &&
                                                                                    !stages[selectedStage]['groupDataElement']) {
                                                                                    delete stages[selectedStage]
                                                                                }
                                                                                setConfiguredStages(stages);
                                                                                setEditing(false);
                                                                                setSelectedStage('');

                                                                                dataStoreOperation('configuredStages', stages);
                                                                            }}>Delete Stage Config
                                                                    </button>
                                                                }
                                                            </th>
                                                        </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                }
                                {configure1 &&
                                    <div className="w-full flex flex-col pt-2">
                                        <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                            <div
                                                className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                <table
                                                    className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                    <thead
                                                        className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                    <tr>
                                                        <th data-priority="1" className="px-6 py-3">#</th>
                                                        <th data-priority="2" className="px-6 py-3">
                                                            Data Element
                                                        </th>
                                                        <th></th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {((groupEdit ? selectedGroupDataElements : selectedDataElements) || []).map((dataElement, index) => {
                                                        return <>
                                                            <tr className="pr-3 text-right odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                                                <td>{index + 1}</td>
                                                                <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{dataElements.find(de => de.id === dataElement)?.name}</td>
                                                                <td>
                                                                    <div className="flex flex-row">
                                                                        {index < (((groupEdit ? selectedGroupDataElements : selectedDataElements) || []).length - 1) &&
                                                                            <div
                                                                                onClick={() => moveDataElement(groupEdit ? 'group' : 'all', index, index + 1)}>
                                                                                <img width={24} src={ArrowDown}/>
                                                                            </div>
                                                                        }
                                                                        {index === (((groupEdit ? selectedGroupDataElements : selectedDataElements) || []).length - 1) &&
                                                                            <div className="w-6"></div>
                                                                        }
                                                                        {index > 0 &&
                                                                            <div
                                                                                onClick={() => moveDataElement(groupEdit ? 'group' : 'all', index, index - 1)}>
                                                                                <img width={24} src={ArrowUp}/>
                                                                            </div>
                                                                        }
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </>
                                                    })}
                                                    </tbody>
                                                    <tfoot>
                                                    <tr className="font-semibold text-gray-900 dark:text-white">
                                                        <th scope="row" className="px-6 py-3 text-base">
                                                            <button type="button"
                                                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                    onClick={() => {
                                                                        const stages = configuredStages
                                                                        stages[selectedStage] = {
                                                                            dataElements: selectedDataElements,
                                                                            individualDataElements: selectedIndividualDataElements,
                                                                            groupDataElements: selectedGroupDataElements
                                                                        };
                                                                        setConfiguredStages(stages);
                                                                        setSelectedStage('');
                                                                        setConfigure1(false);

                                                                        dataStoreOperation('configuredStages', stages);
                                                                    }}>Close
                                                            </button>
                                                        </th>
                                                    </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                }*/}
                            </div>
                            {groupEdit &&
                                <div className="shadow-sm rounded-md p-4 border border-blue-100 bg-white">
                                    <label htmlFor="program"
                                           className="block mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                        {i18n.t('Configure Participant\'s Data Elements')}
                                    </label>
                                    <div className="shadow-md rounded-md p-4 bg-white mb-4">
                                        <label htmlFor="program"
                                               className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            {i18n.t('Configured Stages')}
                                        </label>
                                        <div className="w-full flex flex-col">
                                            {configuredStages && Object.keys(configuredStages).map((stage) => {
                                                if (stage) {
                                                    return <>
                                                        <div className="border-b p-2 bg-gray-100 w-full flex flex-row">
                                                            <div className="w-7/12">
                                                                {stages.find(s => s.id === stage)?.displayName}
                                                            </div>
                                                            <div className="w-5/12 flex-row flex">
                                                                {(configuredStages[stage]['individualDataElements'] || []).length > 0 &&
                                                                    <>
                                                                        <button type="button"
                                                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                onClick={() => {
                                                                                    setEditing1(true);
                                                                                    setConfigure2(false);
                                                                                    setSelectedIndividualDataElements(configuredStages[stage]['individualDataElements'] || [])
                                                                                    setSelectedStage(stage)
                                                                                }}>Edit Stage
                                                                        </button>
                                                                        <button type="button"
                                                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                onClick={() => {
                                                                                    setConfigure2(true);
                                                                                    setEditing1(false);
                                                                                    setSelectedIndividualDataElements(configuredStages[stage]['groupDataElements'] || []);
                                                                                    setSelectedStage(stage)
                                                                                }}>Sort Order
                                                                        </button>
                                                                        <button type="button"
                                                                                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                                                                                onClick={() => {
                                                                                    const stages = configuredStages
                                                                                    delete stages[selectedStage]['individualDataElements'];
                                                                                    if (!stages[selectedStage]['individualDataElements'] &&
                                                                                        !stages[selectedStage]['dataElements'] &&
                                                                                        !stages[selectedStage]['groupDataElement']) {
                                                                                        delete stages[selectedStage]
                                                                                    }
                                                                                    setConfiguredStages(Object.assign({}, stages));
                                                                                    setEditing1(false);
                                                                                    setSelectedStage('');

                                                                                    dataStoreOperation('configuredStages', stages);
                                                                                }}>Delete Stage Config
                                                                        </button>
                                                                    </>
                                                                }
                                                            </div>
                                                        </div>
                                                    </>
                                                }
                                            })
                                            }
                                        </div>
                                    </div>
                                    {!editing1 &&
                                        <div className="w-3/12 flex flex-col">
                                            <div>
                                                <ProgramStageComponent
                                                    selectedProgram={selectedProgram}
                                                    selectedStage={selectedStage}
                                                    setSelectedStage={(selection) => {
                                                        setSelectedStage(selection);
                                                        if (selection) {
                                                            setEditing1(true);
                                                            setConfigure2(false);
                                                            setSelectedDataElements([]);
                                                            setSelectedIndividualDataElements([]);
                                                            setSelectedGroupDataElements([]);

                                                            const stages = configuredStages;
                                                            const stage = stages[selection];
                                                            stages[selection] = {
                                                                individualDataElements: stage ? stage['individualDataElements'] || [] : [],
                                                                dataElements: stage ? stage['dataElements'] || [] : [],
                                                                groupDataElements: stage ? stage['groupDataElements'] || [] : []
                                                            };
                                                            setConfiguredStages(stages);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    }
                                    {editing1 &&
                                        <>
                                            <div className="w-full flex flex-col pt-2">
                                                <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                    <div
                                                        className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                        <table
                                                            className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                            <caption
                                                                className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                                                                Data Elements
                                                                <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                                    Select data Elements the will be visible for the
                                                                    selected stage when
                                                                    attending to participants
                                                                </p>
                                                            </caption>
                                                            <thead
                                                                className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                            <tr>
                                                                <th rowSpan={2} className="px-6 py-6">
                                                                    <div
                                                                        className="flex items-center mb-4">
                                                                        <input
                                                                            type="checkbox"
                                                                            onChange={(event) => {
                                                                                if (event.target.checked) {
                                                                                    setSelectedIndividualDataElements(dataElements.map(de => de.id))
                                                                                } else {
                                                                                    setSelectedIndividualDataElements([])
                                                                                }
                                                                            }}
                                                                            checked={selectedIndividualDataElements?.length === dataElements.length}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                    </div>
                                                                </th>
                                                                <th data-priority="1" className="px-6 py-3">#</th>
                                                                <th data-priority="2" className="px-6 py-3">
                                                                    Data Element
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {dataElements.map((dataElement, index) => {
                                                                return <>
                                                                    <tr className="pr-3 text-right odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                                                        <td className="px-6 py-6">
                                                                            <div
                                                                                className="flex items-center mb-4">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedIndividualDataElements?.includes(dataElement.id)}
                                                                                    onChange={() => {
                                                                                        if (selectedIndividualDataElements?.includes(dataElement.id)) {
                                                                                            setSelectedIndividualDataElements(selectedIndividualDataElements?.filter(rowId => rowId !== dataElement.id));
                                                                                        } else {
                                                                                            setSelectedIndividualDataElements([...selectedIndividualDataElements, dataElement.id]);
                                                                                        }
                                                                                    }}
                                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                            </div>
                                                                        </td>
                                                                        <td>{index + 1}</td>
                                                                        <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{dataElement.name}</td>
                                                                    </tr>
                                                                </>
                                                            })}
                                                            </tbody>
                                                            <tfoot>
                                                            <tr className="font-semibold text-gray-900 dark:text-white">
                                                                <th scope="row" className="px-6 py-3 text-base">
                                                                    {selectedIndividualDataElements?.length > 0 &&
                                                                        <button type="button"
                                                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                onClick={() => {
                                                                                    const stages = configuredStages;
                                                                                    stages[selectedStage] = {
                                                                                        individualDataElements: selectedIndividualDataElements,
                                                                                        dataElements: stages[selectedStage]['dataElements'],
                                                                                        groupDataElements: stages[selectedStage]['groupDataElements']
                                                                                    };
                                                                                    setConfiguredStages(stages);
                                                                                    setEditing1(false);
                                                                                    setSelectedStage('');

                                                                                    dataStoreOperation('configuredStages', stages);
                                                                                }}>Save stage
                                                                        </button>
                                                                    }
                                                                    {configuredStages[selectedStage] &&
                                                                        <button type="button"
                                                                                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                                                                                onClick={() => {
                                                                                    const stages = configuredStages;
                                                                                    delete stages[selectedStage]['individualDataElements'];
                                                                                    if (!stages[selectedStage]['individualDataElements'] &&
                                                                                        !stages[selectedStage]['dataElements'] &&
                                                                                        !stages[selectedStage]['groupDataElement']) {
                                                                                        delete stages[selectedStage]
                                                                                    }
                                                                                    setConfiguredStages(stages);
                                                                                    setEditing1(false);
                                                                                    setSelectedStage('');

                                                                                    dataStoreOperation('configuredStages', stages);
                                                                                }}>Delete Stage Config
                                                                        </button>
                                                                    }
                                                                </th>
                                                            </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    }
                                    {configure2 &&
                                        <div className="w-full flex flex-col pt-2">
                                            <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                <div
                                                    className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                    <table
                                                        className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                        <thead
                                                            className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                        <tr>
                                                            <th data-priority="1" className="px-6 py-3">#</th>
                                                            <th data-priority="2" className="px-6 py-3">
                                                                Data Element
                                                            </th>
                                                            <th></th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {(selectedIndividualDataElements || []).map((dataElement, index) => {
                                                            return <>
                                                                <tr className="pr-3 text-right odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                                                    <td>{index + 1}</td>
                                                                    <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{dataElements.find(de => de.id === dataElement)?.name}</td>
                                                                    <td>
                                                                        <div className="flex flex-row">
                                                                            {index < (selectedIndividualDataElements.length - 1) &&
                                                                                <div
                                                                                    onClick={() => moveDataElement('individual', index, index + 1)}>
                                                                                    <img width={24} src={ArrowDown}/>
                                                                                </div>
                                                                            }
                                                                            {index === (selectedIndividualDataElements.length - 1) &&
                                                                                <div className="w-6"></div>
                                                                            }
                                                                            {index > 0 &&
                                                                                <div
                                                                                    onClick={() => moveDataElement('individual', index, index - 1)}>
                                                                                    <img width={24} src={ArrowUp}/>
                                                                                </div>
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        })}
                                                        </tbody>
                                                        <tfoot>
                                                        <tr className="font-semibold text-gray-900 dark:text-white">
                                                            <th scope="row" className="px-6 py-3 text-base">
                                                                <button type="button"
                                                                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                        onClick={() => {
                                                                            const stages = configuredStages
                                                                            stages[selectedStage] = {
                                                                                dataElements: selectedDataElements,
                                                                                individualDataElements: selectedIndividualDataElements,
                                                                                groupDataElements: selectedGroupDataElements
                                                                            };
                                                                            setConfiguredStages(stages);
                                                                            setSelectedStage('');
                                                                            setConfigure2(false);

                                                                            dataStoreOperation('configuredStages', stages);
                                                                        }}>Close
                                                                </button>
                                                            </th>
                                                        </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ConfigurationComponent;
