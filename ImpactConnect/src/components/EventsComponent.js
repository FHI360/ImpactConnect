import { useAlert, useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Pagination } from '@dhis2/ui';
import React, { useContext, useEffect, useState } from 'react';
import { config, MainTitle } from '../consts.js';
import { SharedStateContext } from '../utils.js';
import { DataElementComponent } from './DataElement.js';
import { Navigation } from './Navigation.js';
import OrganisationUnitComponent from './OrganisationUnitComponent.js';
import ProgramStageComponent from './ProgramStageComponent.js';

export const paginate = (array, pageNumber, pageSize) => {
    const startIndex = (pageNumber - 1) * pageSize;
    return array.slice(startIndex, startIndex + pageSize);
}

export const EventsComponent = () => {
    const engine = useDataEngine();
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedOU,
        setSelectedSharedOU,
        selectedSharedProgram,
        setSelectedSharedOrgUnit,
        selectedSharedStage,
        setSelectedSharedStage
    } = sharedState;

    const [selectedProgram, setSelectedProgram] = useState(selectedSharedProgram);
    const [selectedStage, setSelectedStage] = useState(selectedSharedStage);
    const [dataElements, setDataElements] = useState([]);
    const [orgUnit, setOrgUnit] = useState('');
    const [selectedOu, setSelectedOu] = useState();
    const [participants, setParticipants] = useState([]);
    const [entities, setEntities] = useState([]);
    const [selectedEntities, setSelectedEntities] = useState([]);
    const [allEntities, setAllEntities] = useState([]);
    const [filterValue, setFilterValue] = useState({});
    const [selectedOU, setSelectedOU] = useState(selectedSharedOU);
    const [nameAttributes, setNameAttributes] = useState([]);
    const [filterAttributes, setFilterAttributes] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [entityAttributes, setEntityAttributes] = useState([]);
    const [page, setPage] = useState(1);
    const [totalEntities, setTotalEntites] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [participantPageSize, setParticipantPageSize] = useState(50);
    const [participantsPage, setParticipantsPage] = useState(0);
    const [pagedParticipants, setPagedParticipants] = useState([]);
    const [endDateVisible, setEndDateVisible] = useState(false);
    const [groupEdit, setGroupEdit] = useState(false);
    const [columnDisplay, setColumnDisplay] = useState(false);
    const [groupValues, setGroupValues] = useState({});
    const [orgUnits, setOrgUnits] = useState([]);

    const {show} = useAlert(
        ({msg}) => msg,
        ({type}) => ({[type]: true})
    )

    const dataStoreQuery = {
        dataStore: {
            resource: `dataStore/${config.dataStoreName}?fields=.`,
        }
    };

    const attributesQuery = {
        attributes: {
            resource: `trackedEntityAttributes`,
            params: ({program}) => ({
                fields: ['id', 'displayName', 'optionSet(id)', 'valueType'],
                paging: 'false',
                program: program
            }),
        }
    }

    const organisationsQuery = {
        orgUnits: {
            resource: `organisationUnits`,
            params: {
                fields: ['id', 'displayName'],
                paging: 'false',
            }
        }
    }

    const entitiesQuery = {
        entities: {
            resource: 'tracker/trackedEntities',
            params: ({orgUnit, program, page, pageSize}) => {
                return ({
                    program: program,
                    orgUnit: orgUnit,
                    pageSize: pageSize,
                    page: page,
                    paging: true,
                    totalPages: true,
                    fields: ['*'],
                })
            }
        }
    }

    const dataElementsQuery = {
        programStage: {
            resource: `programStages`,
            id: ({id}) => id,
            params: ({
                fields: 'programStageDataElements(dataElement(id, name, valueType, optionSet(id))'
            })
        }
    }

    const {
        data: attributesData,
        refetch: attributesRefetch
    } = useDataQuery(attributesQuery, {variables: {program: selectedProgram}});

    const {data: entityData, refetch} = useDataQuery(entitiesQuery, {
        variables: {
            program: selectedProgram,
            orgUnit: orgUnit,
            page,
            pageSize
        }
    });

    const {data: orgUnitsData} = useDataQuery(organisationsQuery);

    const {
        data: elementsData,
        refetch: refetchDataElements
    } = useDataQuery(dataElementsQuery, {variables: {id: selectedStage}});

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === `${config.dataStoreKey}`);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setFilterAttributes(entry.value.filterAttributes || []);
                setConfiguredStages(entry.value.configuredStages || {});
                setEndDateVisible(entry.value.endDateVisible);
                setColumnDisplay(entry.value.columnDisplay);
                setGroupEdit(entry.value.groupEdit);
                setSelectedProgram(entry.value.program)
            }
        }
    }, [dataStore]);

    useEffect(() => {
        if (orgUnitsData && orgUnitsData.orgUnits) {
            setOrgUnits(orgUnitsData.orgUnits.organisationUnits);
        }
    }, []);

    useEffect(() => {
        if (entityData && entityData.entities) {
            setAllEntities(entityData.entities.instances);
            setEntities(entityData.entities.instances);
            setTotalEntites(entityData.entities.total);
        } else {
            setEntities([]);
            setTotalEntites(0);
        }
    }, [orgUnit, selectedProgram, entityData, page, pageSize]);

    useEffect(() => {
        setPage(1);
        refetch({page: 1, pageSize: pageSize, program: selectedProgram, orgUnit: orgUnit});
    }, [orgUnit, selectedProgram]);

    useEffect(() => {
        refetch({page, pageSize: pageSize, program: selectedProgram, orgUnit: orgUnit});
    }, [pageSize, page])

    useEffect(() => {
        attributesRefetch({program: selectedProgram})
        if (attributesData?.attributes?.trackedEntityAttributes) {
            setEntityAttributes(attributesData?.attributes?.trackedEntityAttributes)
        }
    }, [attributesData, selectedProgram]);

    useEffect(() => {
        refetchDataElements({id: selectedStage});
        if (elementsData && elementsData.programStage && elementsData.programStage.programStageDataElements) {
            const dataElements = elementsData.programStage.programStageDataElements.map(data => data.dataElement);
            setDataElements(dataElements);
        }
    }, [elementsData, selectedStage]);

    useEffect(() => {
        pageParticipants(1, participantPageSize);
    }, [participants]);

    /***
     * Org Units Selection Function. Responsible populating OrgUnitsSelected with selected OrgUnits
     *
     */
    const handleOUChange = event => {
        setSelectedSharedOrgUnit(event.id);
        setSelectedOU(event.selected);
        setSelectedSharedOU(event.selected)
        if (!event.checked) {
            setSelectedSharedOrgUnit('')
        }
    };

    const handleEntityOUChange = event => {
        setOrgUnit(event.id);
        setSelectedOu(event.selected)
    }

    const dataStoreOperation = (type, data) => {
        const value = {
            nameAttributes,
            filterAttributes,
            configuredStages,
            endDateVisible,
            groupEdit,
            columnDisplay
        }
        value[type] = data;
        const mutation = {
            resource: `dataStore/${config.dataStoreName}/${selectedProgram}`,
            type: 'update',
            data: value
        }
        engine.mutate(mutation).then(_ => {
            show({msg: i18n.t('Event successfully saved'), type: 'success'});
        });
    }

    const getParticipant = (entity) => {
        return nameAttributes.map(attr => {
            return entity.enrollments[0].attributes?.find(attribute => attribute.attribute === attr)?.value
        }).join(' ')
    }

    const addSelection = () => {
        const _participants = participants.filter(entity => !participants.find(participant => participant.trackedEntity
            === entity.trackedEntity));
        _participants.push(...selectedEntities);
        setParticipants([..._participants]);
    }

    const groupDataElementValue = (dataElement) => {
        return groupValues[dataElement];
    }

    const createOrUpdateGroupEvent = (dataElement, value) => {
        const values = groupValues;
        values[dataElement.id] = value;
        setGroupValues(Object.assign({}, values));
    }

    const filterEntities = () => {
        const entities = allEntities.filter(entity => {
            const filter = Object.keys(filterAttributes).map(filterAttr => {
                const value = filterAttributes[filterAttr];
                if (value && (value + '').length > 0) {
                    const attribute = entity.attributes.find(attr => attr.attribute === filterAttr);
                    return attribute && attribute.value + '' === value + '';
                }
                return true;
            })

            return !filter.length || filter.every(f => f);

        });
        setEntities(entities);
    }

    const pageParticipants = (page = 1, size = participantPageSize) => {
        setParticipantsPage(page);
        const currentPage = paginate(participants, page, size);
        setPagedParticipants(currentPage);
    }

    const saveEvent = () => {
      /*
      {
      //"relationship": "pHHu9HUgBJE",
      // "relationshipName": "Participants - Trainings",
      // "relationshipType": "iBFMyo4S0Nn",
   "from": {
     "trackedEntity": { "trackedEntity": "ABCDEF12345" }//Entity
   },
   "to": {
     "trackedEntity": { "trackedEntity": "FEDCBA12345" } //Training
   }
}
       */
        const event = {
            programStage: selectedStage,
            orgUnit: orgUnit,
            occurredAt: values[0].date.toISOString(),
            dataValues: []
        }
    }

    return (
        <>
            <div className="flex flex-row w-full h-full">
                <div className="w-2/12 bg-[#f8f4f3] p-4 z-50 transition-transform">
                    <a href="#" className="flex items-center pb-4 border-b border-b-gray-800">

                        <h2 className="font-bold text-2xl">{MainTitle}</h2>
                    </a>
                </div>
                <div className="w-10/12 ml-4 mr-4 p-4 bg-gray-100 min-h-screen transition-all rounded-md">
                    <Navigation/>
                    <div className="p-6">
                        <div className="mx-auto w-full">
                            <div className="w-full">
                                <div className="flex flex-col">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <div className="flex flex-row w-full rounded-md bg-white p-3 gap-x-1">
                                            <div className="w-3/12">
                                                <ProgramStageComponent
                                                    selectedProgram={selectedProgram}
                                                    selectedStage={selectedStage}
                                                    setSelectedStage={(stage) => {
                                                        setSelectedStage(stage)
                                                        setSelectedSharedStage(stage)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {Object.keys(filterAttributes).length > 0 &&
                                        <div className="rounded-md bg-white p-3 mb-2 w-full gap-x-1">
                                            <label htmlFor="stage"
                                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white border-b-2 border-b-gray-800">
                                                {i18n.t('Entity Filter')}
                                            </label>
                                            <div className="p-2 flex flex-row flex-wrap">
                                                {filterAttributes.map((attr, idx) => {
                                                    const entityAttribute = entityAttributes.find(ea => ea.id === attr);
                                                    if (entityAttribute) {
                                                        return <>
                                                            <DataElementComponent key={idx}
                                                                                  dataElement={attr}
                                                                                  labelVisible={true}
                                                                                  value={filterValue[attr]}
                                                                                  label={entityAttributes.find(a => a.id === attr)?.displayName}
                                                                                  valueChanged={(_, v) => {
                                                                                      const filterAttributes = filterValue;
                                                                                      filterAttributes[attr] = v;
                                                                                      setFilterValue(filterAttributes);

                                                                                      filterEntities();
                                                                                  }}/>
                                                        </>
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    }
                                    {selectedStage &&
                                        <div className="flex flex-col w-full mb-2">
                                            {configuredStages[selectedStage] && (configuredStages[selectedStage]['groupDataElements'] || []).length > 0 &&
                                                <div className="w-full flex flex-col pt-2">
                                                    <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                        {/*{configuredStages[selectedStage] && Object.keys(configuredStages[selectedStage]['templates'] || {}).length > 0 &&
                                                            <div className="w-3/12">
                                                                <label htmlFor="stage"
                                                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                    {i18n.t('Select Saved Event')}
                                                                </label>
                                                                <select id="stage"
                                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                                        value={selectedTemplate}
                                                                        onChange={(event) => handleTemplateChange(event.target.value)}>
                                                                    <option selected>Choose event</option>
                                                                    {Object.keys(configuredStages[selectedStage]['templates'] || {}).map((name) => (
                                                                            <option label={name} value={name} key={name}/>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        }*/}
                                                        <div
                                                            className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                            <div className="flex flex-row justify-end">
                                                                <button type="button"
                                                                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                >Save /Update Event
                                                                </button>
                                                            </div>
                                                            <div className="w-3/12 p-2">
                                                                {dataElements.length > 0 && (configuredStages[selectedStage]['groupDataElements'] || []).map((cde, idx) => {
                                                                    const de = dataElements.find(de => de.id === cde);
                                                                    return <>
                                                                        <DataElementComponent key={idx}
                                                                                              value={groupDataElementValue(cde)}
                                                                                              dataElement={de}
                                                                                              labelVisible={true}
                                                                                              valueChanged={createOrUpdateGroupEvent}/>
                                                                    </>
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                            {participants &&
                                                <div className="w-full flex flex-col pt-2">
                                                    <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                        <div
                                                            className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                            <table
                                                                className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                                <caption
                                                                    className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">

                                                                    <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                                        Training /Workshop participants
                                                                    </p>
                                                                </caption>
                                                                <thead
                                                                    className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                                <tr>
                                                                    <th data-priority="1" className="px-6 py-3 w-1/12">#
                                                                    </th>
                                                                    <th data-priority="2"
                                                                        className="px-6 py-3 w-6/12">Profile
                                                                    </th>
                                                                    <th data-priority="2"
                                                                        className="px-6 py-3 w-3/12">Org Unit
                                                                    </th>
                                                                    <th className="w-2/12"></th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {pagedParticipants.map((entity, index) => {
                                                                    return <>
                                                                        <tr className="pr-3 text-right odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                                                            <td>{index + 1}</td>
                                                                            <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity)}</td>
                                                                            <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{orgUnits.find(ou => ou.id === entity.orgUnit)?.displayName}</td>
                                                                            <td>
                                                                                <button type="button"
                                                                                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                        onClick={() => {
                                                                                            setParticipants(participants.filter(p => p.trackedEntity !== entity.trackedEntity));
                                                                                            pageParticipants();
                                                                                        }}>Remove
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    </>
                                                                })}
                                                                </tbody>
                                                                <tfoot>
                                                                <tr>
                                                                    <th className="w-full p-2" colSpan={4}>
                                                                        <div
                                                                            className="flex flex-row w-full justify-end">
                                                                            <Pagination
                                                                                page={participantsPage}
                                                                                pageSize={participantPageSize}
                                                                                total={participants.length}
                                                                                onPageChange={(page) => pageParticipants(page)}
                                                                                onPageSizeChange={(size) => {
                                                                                    setParticipantsPage(1);
                                                                                    setParticipantPageSize(size);
                                                                                    pageParticipants(1, size);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </th>
                                                                </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                            <div className="w-full flex flex-row pt-2">
                                                <div className="w-3/12 p-2 bg-white">
                                                    <OrganisationUnitComponent
                                                        handleOUChange={handleEntityOUChange}
                                                        selectedOU={selectedOu}
                                                    />
                                                </div>
                                                <div className="w-9/12 p-2">
                                                    {selectedStage &&
                                                        <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                            <div
                                                                className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                                <table
                                                                    className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                                    <caption
                                                                        className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">

                                                                        <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">

                                                                        </p>
                                                                        {selectedEntities.length > 0 &&
                                                                            <button type="button"
                                                                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                    onClick={addSelection}>Add
                                                                                Participant(s)
                                                                            </button>
                                                                        }
                                                                    </caption>
                                                                    <thead
                                                                        className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                                    <tr>
                                                                        <th className="px-6 py-6 w-1/12">
                                                                            <div
                                                                                className="flex items-center mb-4">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    onChange={(event) => {
                                                                                        if (event.target.checked) {
                                                                                            setSelectedEntities(entities)
                                                                                        } else {
                                                                                            setSelectedEntities([])
                                                                                        }
                                                                                    }}
                                                                                    checked={selectedEntities.length === entities.length}
                                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                            </div>
                                                                        </th>
                                                                        <th data-priority="1"
                                                                            className="px-6 py-3 w-1/12">#
                                                                        </th>
                                                                        <th data-priority="2"
                                                                            className="px-6 py-3 w-6/12">Profile
                                                                        </th>
                                                                        <th data-priority="2"
                                                                            className="px-6 py-3 w-4/12">Org Unit
                                                                        </th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {entities.map((entity, index) => {
                                                                        return <>
                                                                            <tr className="pr-3 text-right odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                                                                <td className="px-6 py-6">
                                                                                    <div
                                                                                        className="flex items-center mb-4">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={selectedEntities.map(e => e.trackedEntity).includes(entity.trackedEntity)}
                                                                                            onChange={() => {
                                                                                                if (selectedEntities.map(e => e.trackedEntity).includes(entity.trackedEntity)) {
                                                                                                    setSelectedEntities(selectedEntities.filter(rowId => rowId.trackedEntity !== entity.trackedEntity));
                                                                                                } else {
                                                                                                    setSelectedEntities([...selectedEntities, entity]);
                                                                                                }
                                                                                            }}
                                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                                    </div>
                                                                                </td>
                                                                                <td>{index + 1}</td>
                                                                                <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity)}</td>
                                                                                <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{orgUnits.find(ou => ou.id === entity.orgUnit)?.displayName}</td>
                                                                            </tr>
                                                                        </>
                                                                    })}
                                                                    </tbody>
                                                                    <tfoot>
                                                                    <tr>
                                                                        <th className="w-full p-2" colSpan={4}>
                                                                            <div
                                                                                className="flex flex-row w-full justify-end">
                                                                                <Pagination
                                                                                    page={page}
                                                                                    pageSize={pageSize}
                                                                                    total={totalEntities}
                                                                                    onPageChange={(page) => setPage(page)}
                                                                                    onPageSizeChange={(size) => setPageSize(size)}
                                                                                />
                                                                            </div>
                                                                        </th>
                                                                    </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
