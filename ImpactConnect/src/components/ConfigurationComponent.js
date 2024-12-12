import { useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Transfer } from '@dhis2/ui';
import React, { useContext, useEffect, useState } from 'react';
import { config } from '../consts.js';
import { createOrUpdateDataStore, SharedStateContext } from '../utils.js';
import { ConfiguredDataElements } from './ConfiguredDataElements.js';
import { ConfiguredStagesComponent } from './ConfiguredStagesComponent.js';
import { DataElementSortComponent } from './DataElementSortComponent.js';
import { Navigation } from './Navigation.js';
import NotFoundPage from './NotFoundPage.js';
import ProgramComponent from './ProgramComponent.js';
import ProgramStageComponent from './ProgramStageComponent.js';

const ConfigurationComponent = () => {
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedProgram,
        setSelectedSharedProgram,
        selectedSharedIsAdmin
    } = sharedState;

    if (!selectedSharedIsAdmin) {
        // Render the 404 page if the user doesn't have permission
        return <NotFoundPage />;
    }

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
    const [configureMode, setConfigureMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [stages, setStages] = useState([]);
    const [columnDisplay, setColumnDisplay] = useState(false);
    const [scrollHeight, setScrollHeight] = useState('350px');
    const [configuredCondition, setSelectedConfiguredCondition] = useState([]);

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
                setEventNameAttribute(entry.value.eventNameAttribute);
                setSelectedConfiguredCondition(entry.value.configuredCondition || []);
                const exists = keyExists;
                exists[`${config.dataStoreKey}`] = true;
                setKeyExists(exists);
            }
        }
    }, [dataStore]);

    useEffect(() => {
        const adjustScrollHeight = () => {
            const height = window.innerHeight;
            if (height < 800) {
                setScrollHeight('350px');
            } else {
                setScrollHeight('700px');
            }
        };

        // Adjust scrollHeight initially
        adjustScrollHeight();

        // Add event listener to adjust on resize
        window.addEventListener('resize', adjustScrollHeight);

        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener('resize', adjustScrollHeight);
        };
    }, []);

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
            eventLocationAttribute,
            configuredCondition
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
                            <div className="card mb-2">
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
                            {/*<div className="card">
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
                                        className="checkbox"/>
                                    <label
                                        className="label pl-2 pt-2">
                                        {i18n.t('Group Action?')}
                                    </label>
                                </div>
                            </div>
                            {/*<div className="card mb-2">
                                <div className="w-3/12">
                                    <ProgramComponent
                                        selectedProgram={selectedProgram}
                                        setSelectedProgram={handleProgramChange}
                                        label={'Configure Program'}
                                    />
                                </div>
                            </div>*/}
                            {trainingProgram &&
                                <div className="shadow-sm rounded-md p-4 border border-blue-100 bg-white">
                                    <label htmlFor="program"
                                           className="block mb-2 text-sm font-semibold text-gray-900 ">
                                        {i18n.t('Configure Event attributes')}
                                    </label>
                                    <div className="shadow-md rounded-md p-4 bg-white mb-4">
                                        <label htmlFor="program"
                                               className="block mb-2 text-sm font-medium text-gray-900 ">
                                            {i18n.t('Configured Stages')}
                                        </label>
                                        <div className="w-full flex flex-col">
                                            {!configureMode &&
                                                <>
                                                    <div className="w-3/12 flex flex-col">
                                                        <div>
                                                            <ProgramStageComponent
                                                                selectedProgram={selectedProgram}
                                                                selectedStage={selectedStage}
                                                                filteredStages={Object.keys(configuredStages).filter(s => {
                                                                    const stage = configuredStages[s];
                                                                    return (stage['individualDataElements'] || []).length > 0;
                                                                })}
                                                                setSelectedStage={(selection) => {
                                                                    // Set the selected stage
                                                                    setSelectedStage(selection);

                                                                    if (selection) {
                                                                        // Update UI modes based on selection
                                                                        setEditMode(true);
                                                                        setConfigureMode(false);

                                                                        // Clear any previously selected elements
                                                                        setSelectedDataElements([]);
                                                                        setSelectedIndividualDataElements([]);
                                                                        setSelectedGroupDataElements([]);

                                                                        // Create a shallow copy of configuredStages to avoid mutating the state directly
                                                                        const updatedStages = { ...configuredStages };

                                                                        // Retrieve the existing stage configuration or initialize with default structure
                                                                        const stage = updatedStages[selection] || {
                                                                            individualDataElements: [],
                                                                            dataElements: [],
                                                                            groupDataElements: []
                                                                        };

                                                                        // Set the selected stage with updated or default values
                                                                        updatedStages[selection] = {
                                                                            individualDataElements: stage.individualDataElements,
                                                                            dataElements: stage.dataElements,
                                                                            groupDataElements: stage.groupDataElements
                                                                        };

                                                                        // Update the configured stages with the modified stage data
                                                                        setConfiguredStages(updatedStages);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                            {!editMode && !configureMode &&
                                                <ConfiguredStagesComponent stages={stages} configuredStages={configuredStages}
                                                                           single={true}
                                                                           onSort={(stage) => {
                                                                               setConfigureMode(true);
                                                                               setEditMode(false);
                                                                               setSelectedIndividualDataElements(configuredStages[stage]['individualDataElements'] || []);
                                                                               setSelectedStage(stage)
                                                                           }}
                                                                           onEdit={(stage) => {
                                                                               setEditMode(true);
                                                                               setConfigureMode(false);
                                                                               setSelectedIndividualDataElements(configuredStages[stage]['individualDataElements'] || [])
                                                                               setSelectedStage(stage)
                                                                           }}/>
                                            }
                                        </div>
                                    </div>
                                    {editMode &&
                                        <div className="w-full flex flex-col pt-2">
                                            <ConfiguredDataElements
                                                dataElements={dataElements}
                                                configuredStages={configuredStages}
                                                caption={'Select data Elements the will be visible for the selected stage when attending to participants'}
                                                selectedStage={selectedStage}
                                                checkDataElements={selectedIndividualDataElements}
                                                configuredCondition={configuredCondition}
                                                setSelectedConfiguredCondition={setSelectedConfiguredCondition}
                                                onSelectAll={(checked) => {
                                                    if (checked) {
                                                        setSelectedIndividualDataElements(dataElements.map(de => de.id))
                                                    } else {
                                                        setSelectedIndividualDataElements([])
                                                    }
                                                }}
                                                onSelect={(de) => {
                                                    if (selectedIndividualDataElements?.includes(de)) {
                                                        setSelectedIndividualDataElements(selectedIndividualDataElements?.filter(rowId => rowId !== de));
                                                    } else {
                                                        setSelectedIndividualDataElements([...selectedIndividualDataElements, de]);
                                                    }
                                                }}
                                                onDelete={()=> {
                                                    const stages = configuredStages;
                                                    delete stages[selectedStage]['individualDataElements'];
                                                    if (!stages[selectedStage]['individualDataElements'] &&
                                                        !stages[selectedStage]['dataElements'] &&
                                                        !stages[selectedStage]['groupDataElement']) {
                                                        delete stages[selectedStage]
                                                    }
                                                    setConfiguredStages(stages);
                                                    setEditMode(false);
                                                    setSelectedStage('');

                                                    dataStoreOperation('configuredStages', stages);
                                                }}
                                                onSave={() => {
                                                    const updated = {
                                                        ...configuredStages,
                                                        [selectedStage]: {
                                                            ...configuredStages[selectedStage],  // Retain existing properties
                                                            individualDataElements: [...selectedIndividualDataElements], // Clone array to prevent reference issues
                                                        }
                                                    }
                                                    dataStoreOperation('configuredStages', updated);
                                                    setEditMode(false);
                                                    setConfigureMode(true)
                                                }}
                                            />
                                        </div>
                                    }
                                    {configureMode &&
                                        <div className="w-full flex flex-col pt-2">
                                            <DataElementSortComponent
                                                dataElements={dataElements}
                                                checkDataElements={selectedIndividualDataElements}
                                                moveDataElement={(from, to) => moveDataElement('individual', from, to)}
                                                onClose={() => {
                                                    // Create a shallow copy of configuredStages to avoid mutating the original state directly
                                                    const updatedStages = { ...configuredStages };

                                                    if (selectedStage) {
                                                        // Set the selected stage with current selections
                                                        updatedStages[selectedStage] = {
                                                            dataElements: selectedDataElements,
                                                            individualDataElements: selectedIndividualDataElements,
                                                            groupDataElements: selectedGroupDataElements,
                                                        };

                                                        // Update the configured stages with modified data
                                                        setConfiguredStages(updatedStages);
                                                    }

                                                    // Clear the selected stage and reset modes
                                                    setSelectedStage('');
                                                    setConfigureMode(false);
                                                    setEditMode(false);
                                                }}
                                            />
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
