import { useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Transfer } from '@dhis2/ui';
import React, { useContext, useEffect, useState } from 'react';
import { config, MainTitle } from '../consts.js';
import { SharedStateContext } from '../utils.js';
import { Navigation } from './Navigation.js';
import OrganisationUnitComponent from './OrganisationUnitComponent.js';
import ProgramComponent from './ProgramComponent.js';
import ProgramStageComponent from './ProgramStageComponent.js';

const ConfigurationComponent = () => {
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedOU,
        setSelectedSharedOU,
        selectedSharedProgram,
        setSelectedSharedProgram,
        selectedSharedOrgUnit,
        setSelectedSharedOrgUnit
    } = sharedState;

    const [selectedOU, setSelectedOU] = useState(selectedSharedOU);
    const [keyExists, setKeyExists] = useState({});
    const [orgUnit, setOrgUnit] = useState('');
    const [selectedProgram, setSelectedProgram] = useState(selectedSharedProgram);
    const [selectedStage, setSelectedStage] = useState('');
    const [attributes, setAttributes] = useState([]);
    const [nameAttributes, setNameAttributes] = useState([]);
    const [filterAttributes, setFilterAttributes] = useState([]);
    const [dataElements, setDataElements] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [selectedDataElements, setSelectedDataElements] = useState([]);
    const [endDateVisible, setEndDateVisible] = useState(false);
    const [groupEdit, setGroupEdit] = useState(false);
    const [editing, setEditing] = useState(false);
    const [stages, setStages] = useState([]);

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
            id: selectedProgram
        }
    });

    const {data: stageData, refetch: refetchStages} = useDataQuery(stageQuery, {
        variables: {
            program: selectedProgram
        }
    });

    const {
        data: elementsData,
        refetch: refetchDataElements
    } = useDataQuery(dataElementsQuery, {variables: {id: selectedStage}});

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    useEffect(() => {
        if ((data?.programs?.programs || data?.programs?.programTrackedEntityAttributes) && selectedProgram) {
            const attributes = (data.programs?.programs?.find(p => p.id === selectedProgram)?.programTrackedEntityAttributes ||
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
    }, [data, selectedProgram]);

    useEffect(() => {
        refetchDataElements({id: selectedStage});
        if (elementsData && elementsData.programStage && elementsData.programStage.programStageDataElements) {
            const dataElements = elementsData.programStage?.programStageDataElements?.map(data => data.dataElement);
            setDataElements(dataElements);
        }
    }, [elementsData, selectedStage]);

    useEffect(() => {
        refetchStages({program: selectedProgram})
        if (stageData && stageData.programStages) {
            setStages(stageData.programStages.programStages)
        }
    }, [selectedProgram, stageData]);

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === selectedProgram);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setFilterAttributes(entry.value.filterAttributes || []);
                setConfiguredStages(entry.value.configuredStages || {})
                setEndDateVisible(entry.value.endDateVisible)
                setGroupEdit(entry.value.groupEdit);
                const exists = keyExists;
                exists[selectedProgram] = true;
                setKeyExists(exists);
            }
        }
    }, [dataStore, selectedProgram]);

    const handleOUChange = event => {
        setOrgUnit(event.id);
        setSelectedSharedOrgUnit(event.id);
        setSelectedOU(event.selected);
        setSelectedSharedOU(event.selected)
        if (!event.checked) {
            setSelectedSharedOrgUnit('')
        }
    };

    const handleProgramChange = (event) => {
        setSelectedProgram(event);
        setSelectedSharedProgram(event);
        setConfiguredStages({});
        setSelectedDataElements([])
    }

    const dataStoreOperation = (type, data) => {
        const value = {
            nameAttributes,
            filterAttributes,
            configuredStages,
            endDateVisible,
            groupEdit
        }
        value[type] = data;
        const mutation = {
            resource: `dataStore/${config.dataStoreName}/${selectedProgram}`,
            type: keyExists[selectedProgram] ? 'update' : 'create',
            data: value
        }
        engine.mutate(mutation)
    }

    return (
        <>
            <div className="flex flex-row w-full h-full">
                <div
                    className="w-2/12 bg-[#f8f4f3] p-4 z-50 transition-transform">
                    <a href="#" className="flex items-center pb-4 border-b border-b-gray-800">

                        <h2 className="font-bold text-2xl">{MainTitle}</h2>
                    </a>
                    <OrganisationUnitComponent
                        handleOUChange={handleOUChange}
                        selectedOU={selectedOU}
                    />
                </div>
                <div className="w-10/12 ml-4 mr-4 p-4 bg-gray-200 min-h-screen transition-all rounded-md">
                    <Navigation/>
                    <div className="p-6">
                        <div className="flex flex-col w-full">
                            <div className="shadow-sm rounded-md p-2 bg-white mb-2">
                                <div className="w-3/12">
                                    <ProgramComponent
                                        selectedProgram={selectedProgram}
                                        setSelectedProgram={handleProgramChange}
                                        disabled={!selectedSharedOrgUnit}
                                    />
                                </div>
                            </div>
                            <div className="shadow-sm rounded-md p-2 bg-white mb-2">
                                <label htmlFor="program"
                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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

                            <div className="shadow-sm rounded-md p-2 bg-white mb-2">
                                <label htmlFor="program"
                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                            <div className="shadow-sm rounded-md p-3 bg-white mb-2">
                                <div
                                    className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={endDateVisible === true}
                                        onChange={(payload) => {
                                            setEndDateVisible(payload.target.checked);
                                            dataStoreOperation('endDateVisible', payload.target.checked);
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                    <label
                                        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {i18n.t('End Date Visible?')}
                                    </label>
                                </div>
                            </div>
                            <div className="shadow-sm rounded-md p-3 bg-white mb-2">
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
                            <div className="shadow-sm rounded-md p-4 border border-blue-100 bg-white">
                                <label htmlFor="program"
                                       className="block mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    {i18n.t('Configure Data Elements')}
                                </label>
                                <div className="shadow-md rounded-md p-4 bg-white mb-4">
                                    <label htmlFor="program"
                                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        {i18n.t('Configured Stages')}
                                    </label>
                                    <div className="w-full flex flex-col">
                                        {Object.keys(configuredStages).map((stage, index) => {
                                            return <>
                                                <div className="border-b p-2 bg-gray-100 w-full flex flex-row">
                                                    <div className="w-7/12">
                                                        {stages.find(s => s.id === stage)?.displayName}
                                                    </div>
                                                    <div className="w-5/12 flex-row flex">
                                                        <button type="button"
                                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                onClick={() => {
                                                                    setEditing(true)
                                                                    setSelectedDataElements(configuredStages[stage])
                                                                    setSelectedStage(stage)
                                                                }}>Edit stage
                                                        </button>
                                                        <button type="button"
                                                                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                                                                onClick={() => {
                                                                    const stages = configuredStages
                                                                    delete stages[selectedStage]
                                                                    setConfiguredStages(stages);
                                                                    setEditing(false);
                                                                    setSelectedStage('');

                                                                    dataStoreOperation('configuredStages', stages);
                                                                }}>Delete stage
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        })
                                        }
                                    </div>
                                </div>
                                <div className="w-3/12 flex flex-col">
                                    <div>
                                        <ProgramStageComponent
                                            selectedProgram={selectedProgram}
                                            selectedStage={selectedStage}
                                            setSelectedStage={(selection) => {
                                                setSelectedStage(selection);
                                                if (selection) {
                                                    setEditing(true)
                                                    setSelectedDataElements([])
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {editing &&
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
                                                                    checked={selectedDataElements.length === dataElements.length}
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
                                                                            checked={selectedDataElements.includes(dataElement.id)}
                                                                            onChange={() => {
                                                                                if (selectedDataElements.includes(dataElement.id)) {
                                                                                    setSelectedDataElements(selectedDataElements.filter(rowId => rowId !== dataElement.id));
                                                                                } else {
                                                                                    setSelectedDataElements([...selectedDataElements, dataElement.id]);
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
                                                            {selectedDataElements.length &&
                                                                <button type="button"
                                                                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                        onClick={() => {
                                                                            const stages = configuredStages
                                                                            stages[selectedStage] = selectedDataElements;
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
                                                                            delete stages[selectedStage]
                                                                            setConfiguredStages(stages);
                                                                            setEditing(false);
                                                                            setSelectedStage('');

                                                                            dataStoreOperation('configuredStages', stages);
                                                                        }}>Delete stage
                                                                </button>
                                                            }
                                                        </th>
                                                    </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ConfigurationComponent;
