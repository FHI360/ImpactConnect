import { useAlert, useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Pagination } from '@dhis2/ui';
import React, { useContext, useEffect, useState } from 'react';
import { config } from '../consts.js';
import {
    createOrUpdateDataStore,
    fetchEntities,
    getParticipant,
    isObjectEmpty,
    paginate,
    SharedStateContext,
    trackerCreate,
    trackerDelete
} from '../utils.js';
import { DataElementComponent } from './DataElement.js';
import { Navigation } from './Navigation.js';
import OrganisationUnitComponent from './OrganisationUnitComponent.js';

export const EventsComponent = () => {
    const engine = useDataEngine();
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedStage,
        setSelectedSharedStage
    } = sharedState;

    const [selectedStage, setSelectedStage] = useState(selectedSharedStage);
    const [venue, setVenue] = useState();
    const [selectedVenue, setSelectedVenue] = useState('');
    const [trainings, setTrainings] = useState([]);
    const [selectedTraining, setSelectedTraining] = useState('');
    const [dataElements, setDataElements] = useState([]);
    const [entityType, setEntityType] = useState('');
    const [orgUnit, setOrgUnit] = useState('');
    const [selectedOu, setSelectedOu] = useState();
    const [participants, setParticipants] = useState([]);
    const [entities, setEntities] = useState([]);
    const [selectedEntities, setSelectedEntities] = useState([]);
    const [allEntities, setAllEntities] = useState([]);
    const [trainingAttributes, setTrainingAttributes] = useState([]);
    const [trainingAttributesData, setTrainingAttributesData] = useState([]);
    const [activeStage, setActiveStage] = useState('');
    const [participantsProgram, setParticipantsProgram] = useState('');
    const [trainingProgram, setTrainingProgram] = useState('');
    const [nameAttributes, setNameAttributes] = useState([]);
    const [filterAttributes, setFilterAttributes] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [eventNameAttribute, setEventNameAttribute] = useState('');
    const [page, setPage] = useState(1);
    const [totalEntities, setTotalEntities] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [participantPageSize, setParticipantPageSize] = useState(50);
    const [participantsPage, setParticipantsPage] = useState(0);
    const [pagedParticipants, setPagedParticipants] = useState([]);
    const [endDateVisible, setEndDateVisible] = useState(false);
    const [groupEdit, setGroupEdit] = useState(false);
    const [columnDisplay, setColumnDisplay] = useState(false);
    const [groupValues, setGroupValues] = useState({});
    const [orgUnits, setOrgUnits] = useState([]);
    const [events, setEvents] = useState([]);
    const [event, setEvent] = useState({});
    const [saving, setSaving] = useState(false);

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
                    fields: 'trackedEntity,attributes,orgUnit',
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
        data: dataTrainingAttributes,
    } = useDataQuery(attributesQuery, {variables: {program: trainingProgram}});

    const {data: entityData, refetch} = useDataQuery(entitiesQuery, {
        variables: {
            program: participantsProgram,
            orgUnit: orgUnit,
            page,
            pageSize
        }
    });

    const {data: orgUnitsData} = useDataQuery(organisationsQuery);

    const {data: programData} = useDataQuery({
        programs: {
            resource: `programs`,
            params: {
                fields: 'id, trackedEntityType(id)',
                paging: false
            }
        }
    });

    const {
        data: elementsData,
        refetch: refetchDataElements
    } = useDataQuery(dataElementsQuery, {variables: {id: selectedStage}});

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    const {data: programAttributes} = useDataQuery({
        programs: {
            resource: `programs`,
            params: {
                fields: ['id, programTrackedEntityAttributes(trackedEntityAttribute(id, valueType))'],
                paging: 'false'
            },
        }
    })

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === `${config.dataStoreKey}`);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setFilterAttributes(entry.value.filterAttributes || []);
                setTrainingAttributes(entry.value.trainingAttributes || []);
                setConfiguredStages(entry.value.configuredStages || {});
                setTrainingProgram(entry.value.trainingProgram);
                setParticipantsProgram(entry.value.participantsProgram);
                setEndDateVisible(entry.value.endDateVisible);
                setColumnDisplay(entry.value.columnDisplay);
                setGroupEdit(entry.value.groupEdit);
                setActiveStage(entry.value.activeStage);
                setSelectedStage(entry.value.activeStage);
                setEventNameAttribute(entry.value.eventNameAttribute)
            }
        }
    }, [dataStore]);

    useEffect(() => {
        if (orgUnitsData && orgUnitsData.orgUnits) {
            setOrgUnits(orgUnitsData.orgUnits.organisationUnits);
        }
    }, [orgUnitsData]);

    useEffect(() => {
        if (programData && programData.programs) {
            setEntityType(programData.programs.programs.find(p => p.id === trainingProgram)?.trackedEntityType.id)
        }
    }, [trainingProgram]);

    useEffect(() => {
        if (entityData && entityData.entities) {
            setAllEntities(entityData.entities.instances);
            setEntities(entityData.entities.instances);
            setTotalEntities(entityData.entities.total);
        } else {
            setEntities([]);
            setTotalEntities(0);
        }
    }, [orgUnit, participantsProgram, entityData, page, pageSize]);

    useEffect(() => {
        setPage(1);
        refetch({page: 1, pageSize: pageSize, program: participantsProgram, orgUnit: orgUnit});
    }, [orgUnit, participantsProgram]);

    useEffect(() => {
        refetch({page, pageSize: pageSize, program: participantsProgram, orgUnit: orgUnit});
    }, [pageSize, page])

    useEffect(() => {
        if (dataTrainingAttributes?.attributes?.trackedEntityAttributes) {
            setTrainingAttributesData(dataTrainingAttributes?.attributes?.trackedEntityAttributes)
        }
    }, [trainingAttributesData, trainingProgram]);

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

    useEffect(() => {
        if (programAttributes && programAttributes.programs) {
            const program = programAttributes.programs.programs.find(p => p.id === trainingProgram);
            if (program) {
                const attributes = program.programTrackedEntityAttributes.map(tea => {
                    return {
                        id: tea.trackedEntityAttribute.id,
                        valueType: tea.trackedEntityAttribute.valueType
                    }
                });
                setTrainingAttributesData(attributes);
            }
        }

    }, [trainingProgram]);

    useEffect(() => {
        if (trainingProgram && selectedVenue) {
            fetchEvents().then(eventData => {
                if (eventData && eventData.events) {
                    setEvents(eventData.events.instances);

                    const trainings = new Set(eventData.events.instances.flatMap(i => {
                        return i.attributes.map(attr => {
                            attr['trackedEntity'] = i.trackedEntity;
                            return attr;
                        })
                    }).filter(attr => attr.attribute === eventNameAttribute).map(attr => {
                        return {
                            id: attr.trackedEntity,
                            label: attr.value
                        }
                    }));
                    setTrainings(Array.from(trainings));
                }
            })
        }

    }, [entityType, selectedVenue]);

    useEffect(() => {
        const training = events.find(evt => evt.trackedEntity === selectedTraining);
        if (training) {
            const values = {};
            training.attributes.forEach(attr => {
                values[attr.attribute] = attr.value;
            })
            setGroupValues(values);

            const ids = training.relationships.map(rel => rel.from.trackedEntity.trackedEntity);
            if (ids.length > 0) {
                fetchEntities(engine, ids, 'trackedEntity,orgUnit,attributes').then(value => {
                    const attendees = value.map(v => v.entity);
                    setParticipants(attendees);
                });
            }
        }

        if (selectedTraining) {
            fetchEntities(engine, [selectedTraining], '*').then(value => {
                const trainings = value.map(v => v.entity);
                if (trainings && trainings.length) {
                    setEvent(trainings[0])
                }
            });
        }
    }, [selectedTraining]);

    const orgUnitChanged = event => {
        setOrgUnit(event.id);
        setSelectedOu(event.selected)
    }

    const handleVenueChange = event => {
        setSelectedVenue(event.id);
        setVenue(event.selected)
    }

    const dataStoreOperation = (type, data) => {
        const value = {
            nameAttributes,
            filterAttributes,
            configuredStages,
            endDateVisible,
            groupEdit,
            columnDisplay,
            trainingAttributes,
            trainingProgram,
            participantsProgram,
            activeStage,
            eventNameAttribute
        }
        value[type] = data;

        createOrUpdateDataStore(engine, value, config.dataStoreName, config.dataStoreKey, 'update');
    }

    const addSelection = () => {
        const _participants = participants.filter(entity => !selectedEntities.find(participant => participant.trackedEntity
            === entity.trackedEntity));
        _participants.push(...selectedEntities);
        setParticipants([..._participants]);
    }

    const groupDataElementValue = (attribute) => {
        return groupValues[attribute];
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

    const uniqueName = () => {
        return `${groupDataElementValue('CJ7g6K9Ukvf')}_${new Date(groupDataElementValue('CUW9TfQpAu6')).toISOString().substring(0, 10)}_${new Date(groupDataElementValue('KPwanQQE4FU')).toISOString().substring(0, 10)}`
    }

    const pageParticipants = (page = 1, size = participantPageSize) => {
        setParticipantsPage(page);
        const currentPage = paginate(participants, page, size);
        setPagedParticipants(currentPage);
    }

    const saveTraining = async () => {
        setSaving(true);
        const attributes = trainingAttributes.map(attr => {
            const valueType = trainingAttributesData.find(ta => ta.id === attr).valueType;
            let value = groupDataElementValue(attr);

            if (value && valueType) {
                if (valueType.includes('DATE')) {
                    value = new Date(value).toISOString()
                }
                if (valueType === 'TRUE_ONLY' && !value) {
                    value = null;
                }
            }

            if (attr === eventNameAttribute) {
                value = uniqueName();
            }

            return {
                valueType,
                attribute: attr,
                value
            }
        });

        attributes.push({
            attribute: 'oIZRuzzHXxa',
            value: 4
        })
        attributes.push({
            attribute: 'tdhHgS70Vkk',
            value: '20'
        })

        let entity = {
            orgUnit: selectedVenue,
            trackedEntityType: entityType,
            trackedEntity: selectedTraining,
            attributes: attributes,
            enrollments: [
                {
                    program: trainingProgram,
                    orgUnit: selectedVenue,
                    status: 'ACTIVE',
                    occurredAt: new Date().toISOString(),
                    enrolledAt: new Date().toISOString(),
                    attributes
                }
            ]
        }

        let trackedEntity = selectedTraining;

        if (event && !isObjectEmpty(event)) {
            event.enrollments[0].attributes = attributes;
            event.attributes = attributes;
            entity = event;
        }
        const response = await trackerCreate(engine, {
            trackedEntities: [entity]
        });
        if (!response) {
            show({msg: i18n.t('There was an error updating records'), type: 'error'});
        } else {
            if (response.TRACKED_ENTITY) {
                trackedEntity = response?.TRACKED_ENTITY?.objectReports[0].uid;
            }
            if (trackedEntity) {
                saveRelationships(trackedEntity).then(_ => setSaving(false));

                fetchEvents().then(eventData => {
                    if (eventData && eventData.events) {
                        setEvents(eventData.events.instances);
                        setSelectedTraining(trackedEntity);
                    }
                });
            }
            show({msg: i18n.t('Event successfully updated'), type: 'success'});
        }
    }

    const saveRelationships = (trackedEntity) => {
        const relationships = participants.filter(p => {
            return event.relationships.find(rel => rel.from.trackedEntity.trackedEntity !== p.trackedEntity)
        }).map(p => {
            return {
                relationshipType: 'iBFMyo4S0Nn',
                from: {
                    trackedEntity: {
                        trackedEntity: p.trackedEntity
                    }
                },
                to: {
                    trackedEntity: {
                        trackedEntity: trackedEntity
                    }
                }
            }
        });
        return trackerCreate(engine, {
            relationships
        });
    }

    const removeParticipant = async (entity) => {
        setParticipants(participants.filter(p => p.trackedEntity !== entity.trackedEntity));
        pageParticipants();

        const training = events.find(evt => evt.trackedEntity === selectedTraining);
        if (training) {
            const relationship = training.relationships.find(rel => rel?.from?.trackedEntity?.trackedEntity === entity.trackedEntity)?.relationship;
            if (relationship) {
                const response = await trackerDelete(engine, {
                    relationships: [{
                        relationship
                    }]
                });
                if (response) {
                    show({msg: i18n.t('Attendee successfully removed'), type: 'success'});
                } else {
                    show({msg: i18n.t('There was an error removing attendee'), type: 'error'});
                }
                /*engine.mutate({
                    resource: 'tracker',
                    type: 'create',
                    params: {
                        async: false,
                        importStrategy: 'delete'
                    },
                    data: {
                        relationships: [{
                            relationship
                        }]
                    }
                });*/
            }
        }
    }

    const fetchEvents = () => {
        return engine.query({
            events: {
                resource: `tracker/trackedEntities`,
                params: ({orgUnit}) => ({
                    program: trainingProgram,
                    fields: 'trackedEntity,attributes,relationships(relationship,from(trackedEntity(trackedEntity)))',
                    orgUnit,
                    paging: false
                })
            }
        }, {
            variables: {
                orgUnit: selectedVenue
            }
        });
    }

    return (
        <>
            <div className="flex flex-row w-full h-full">
                <div className="page">
                    <Navigation/>
                    <div className="p-6">
                        <div className="mx-auto w-full">
                            <div className="w-full">
                                <div className="flex flex-col">
                                    {/*<div className="flex flex-col gap-1 mb-2">
                                        <div className="flex flex-row w-full rounded-md bg-white p-3 gap-x-1">
                                            <div className="w-3/12">
                                                <ProgramStageComponent
                                                    selectedProgram={participantsProgram}
                                                    selectedStage={selectedStage}
                                                    setSelectedStage={(stage) => {
                                                        setSelectedStage(stage)
                                                        setActiveStage(stage);
                                                        dataStoreOperation('activeStage', stage);
                                                        setSelectedSharedStage(stage)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>*/}
                                    <div className="flex flex-row card gap-x-1">
                                        <div className="w-3/12 p-3">
                                            <label htmlFor="stage"
                                                   className="label">
                                                {i18n.t('Venue')}
                                            </label>
                                            <OrganisationUnitComponent
                                                handleOUChange={handleVenueChange}
                                                selectedOU={venue}
                                            />
                                        </div>
                                        {selectedVenue &&
                                            <div className="w-3/12">
                                                <label htmlFor="program"
                                                       className="label">
                                                    Events
                                                </label>
                                                <select
                                                    className="select"
                                                    value={selectedTraining}
                                                    onChange={(event) => {
                                                        setSelectedTraining(event.target.value);
                                                    }}>
                                                    <option
                                                        selected>Select event
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
                                        }
                                    </div>
                                    {selectedStage &&
                                        <div className="flex flex-col w-full mb-2">
                                            {(trainingAttributes || []).length > 0 &&
                                                <div className="w-full flex flex-col pt-2">
                                                    <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                        <div
                                                            className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                            {selectedVenue &&
                                                                <div className="flex flex-row justify-end">
                                                                    {selectedTraining &&
                                                                        <button type="button"
                                                                                onClick={() => {
                                                                                    setParticipants([]);
                                                                                    setPagedParticipants([]);
                                                                                    setEvent({})
                                                                                    setSelectedTraining('');
                                                                                    setGroupValues({});
                                                                                }}
                                                                                disabled={saving === true}
                                                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                        >New Event
                                                                        </button>
                                                                    }
                                                                    <button type="button"
                                                                            onClick={saveTraining}
                                                                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                    >Save /Update Event
                                                                    </button>
                                                                </div>
                                                            }
                                                            {(trainingAttributes || []).map((cde, idx) => {
                                                                const de = trainingAttributesData.find(ta => ta.id === cde);
                                                                if (de && cde !== eventNameAttribute) {
                                                                    return <>
                                                                        <div className="w-3/12 p-2">
                                                                            <DataElementComponent key={idx}
                                                                                                  value={groupDataElementValue(cde)}
                                                                                                  dataElement={de}
                                                                                                  labelVisible={true}
                                                                                                  valueChanged={createOrUpdateGroupEvent}/>
                                                                        </div>
                                                                    </>
                                                                }
                                                            })}
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
                                                                    <th data-priority="1"
                                                                        className="px-6 py-3 w-1/12">#
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
                                                                            <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity, nameAttributes)}</td>
                                                                            <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{orgUnits.find(ou => ou.id === entity.orgUnit)?.displayName}</td>
                                                                            <td>
                                                                                <button type="button"
                                                                                        className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"
                                                                                        onClick={() => {
                                                                                            removeParticipant(entity)
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
                                                                                pageCount={Math.ceil(participants.length / participantPageSize)}
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
                                                        handleOUChange={orgUnitChanged}
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
                                                                                Attendee(s)
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
                                                                                <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity, nameAttributes)}</td>
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
                                                                                    pageCount={Math.ceil(totalEntities / pageSize)}
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
