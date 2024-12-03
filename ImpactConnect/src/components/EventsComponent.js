import { useAlert, useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Pagination } from '@dhis2/ui';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { config, EVENT_OPTIONS, REPORT } from '../consts.js';
import {
    daysBetween,
    fetchEntities,
    getAttribute,
    getParticipant,
    isObjectEmpty,
    paginate,
    searchEntities,
    sortEntities,
    trackerCreate,
    trackerDelete
} from '../utils.js';
import { DataElementsComponent } from './DataElementsComponent.js';
import { Navigation } from './Navigation.js';
import OrganisationUnitComponent from './OrganisationUnitComponent.js';
import { SearchComponent } from './SearchComponent.js';
import { SpinnerComponent } from './SpinnerComponent.js';
import { VenueComponent } from './VenueComponent.js';

export const EventsComponent = () => {
    const engine = useDataEngine();

    const [selectedVenue, setSelectedVenue] = useState('');
    const [trainings, setTrainings] = useState([]);
    const [selectedTraining, setSelectedTraining] = useState('');
    const [entityType, setEntityType] = useState('');
    const [orgUnit, setOrgUnit] = useState('');
    const [selectedOu, setSelectedOu] = useState();
    const [participants, setParticipants] = useState([]);
    const [entities, setEntities] = useState([]);
    const [selectedEntities, setSelectedEntities] = useState([]);
    const [allEntities, setAllEntities] = useState([]);
    const [trainingAttributes, setTrainingAttributes] = useState([]);
    const [trainingAttributesData, setTrainingAttributesData] = useState([]);
    const [participantsProgram, setParticipantsProgram] = useState('');
    const [trainingProgram, setTrainingProgram] = useState('');
    const [nameAttributes, setNameAttributes] = useState([]);
    const [eventNameAttribute, setEventNameAttribute] = useState('');
    const [page, setPage] = useState(1);
    const [totalEntities, setTotalEntities] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [participantPageSize, setParticipantPageSize] = useState(50);
    const [participantsPage, setParticipantsPage] = useState(0);
    const [pagedParticipants, setPagedParticipants] = useState([]);
    const [groupValues, setGroupValues] = useState({});
    const [orgUnits, setOrgUnits] = useState([]);
    const [events, setEvents] = useState([]);
    const [event, setEvent] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [scrollHeight, setScrollHeight] = useState('350px');
    const [loadingEntities, setLoadingEntities] = useState(false);

    const memoizedData = useMemo(() => {
        return {
            trainingAttributes, groupValues, trainingAttributesData, eventNameAttribute
        };
    }, [trainingAttributes, groupValues, trainingAttributesData, eventNameAttribute]);

    const {show} = useAlert(
        ({msg}) => msg,
        ({type}) => ({[type]: true})
    )

    const dataStoreQuery = {
        dataStore: {
            resource: `dataStore/${config.dataStoreName}?fields=.`,
        }
    };

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

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === `${config.dataStoreKey}`);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setTrainingAttributes(entry.value.trainingAttributes || []);
                setTrainingProgram(entry.value.trainingProgram);
                setParticipantsProgram(entry.value.participantsProgram);
                setEventNameAttribute(entry.value.eventNameAttribute);
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
        if (entityData) {
            if (entityData.entities) {
                setAllEntities(entityData.entities.instances);
                setEntities(entityData.entities.instances);
                setTotalEntities(entityData.entities.total);
                setSelectedEntities([])
            } else {
                setEntities([]);
                setTotalEntities(0);
            }
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
        pageParticipants(1, participantPageSize);
    }, [participants]);

    useEffect(() => {
        setLoadingEntities(false);
    }, [allEntities]);

    useEffect(() => {
        engine.query({
            programs: {
                resource: `programs`,
                params: {
                    fields: ['id, programTrackedEntityAttributes(trackedEntityAttribute(id, valueType,displayName,optionSet(id)))'],
                    paging: 'false'
                },
            }
        }).then(res => {
            if (res && res.programs) {
                const program = res.programs.programs.find(p => p.id === trainingProgram);
                if (program) {
                    const attributes = program.programTrackedEntityAttributes.map(tea => {
                        return tea.trackedEntityAttribute
                    });
                    setTrainingAttributesData(attributes);
                }
            }
        })
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
            setLoading(true);
            const values = {};
            training.attributes.forEach(attr => {
                values[attr.attribute] = attr.value;
            })
            setGroupValues(values);

            setParticipants([]);
            const ids = training.relationships.map(rel => rel.from.trackedEntity.trackedEntity);
            if (ids.length > 0) {
                fetchEntities(engine, ids, 'trackedEntity,orgUnit,attributes').then(value => {
                    const attendees = sortEntities(value.map(v => v.entity), nameAttributes);
                    setParticipants(attendees);
                    setLoading(false);
                });
            } else {
                setLoading(false);
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

    const orgUnitChanged = event => {
        setOrgUnit(event.id);
        setSelectedOu(event.selected)

        setLoadingEntities(true);
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

    const createOrUpdateGroupEvent = useCallback((dataElement, value) => {
        setGroupValues((prevValues) => ({
            ...prevValues,
            [dataElement.id]: value,
        }));
    }, []);

    const uniqueName = () => {
        return `${groupDataElementValue(EVENT_OPTIONS.attributes.event)}_${new Date(groupDataElementValue(EVENT_OPTIONS.attributes.startDate)).toISOString().substring(0, 10)}_${new Date(groupDataElementValue(EVENT_OPTIONS.attributes.endDate)).toISOString().substring(0, 10)}`
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
            }
            if (valueType === 'TRUE_ONLY' && !value) {
                value = null;
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
            attribute: EVENT_OPTIONS.attributes.days,
            value: daysBetween(new Date(groupDataElementValue(EVENT_OPTIONS.attributes.startDate)), new Date(groupDataElementValue(EVENT_OPTIONS.attributes.endDate)))
        });
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
            setSaving(false);
        } else {
            if (response.TRACKED_ENTITY) {
                trackedEntity = response?.TRACKED_ENTITY?.objectReports[0].uid;
            }
            if (trackedEntity) {
                saveRelationships(trackedEntity).then(_ => {
                    setSaving(false);
                    setEntities([]);
                    setSelectedTraining('');
                });

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
            return (!event || !event.relationships?.length) || event?.relationships.find(rel => rel.from.trackedEntity.trackedEntity !== p.trackedEntity)
        }).map(p => {
            return {
                relationshipType: EVENT_OPTIONS.relationshipType,
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

    const validateTraining = () => {
        return Object.keys(groupValues).length > 0 && Object.keys(groupValues).every(key => {
            const valueType = trainingAttributesData.find(ta => ta.id === key).valueType;
            if (valueType === 'TRUE_ONLY' || valueType === 'BOOLEAN') {
                return true;
            }
            if (valueType === 'INTEGER' || valueType === 'NUMBER') {
                const value = parseInt(groupValues[key]);
                return value === 0 || !!value;
            }
            if (valueType === 'INTEGER_ZERO_OR_POSITIVE') {
                const value = parseInt(groupValues[key]);
                return value >= 0;
            }
            if (valueType === 'INTEGER_NEGATIVE') {
                const value = parseInt(groupValues[key]);
                return value < 0;
            }
            if (valueType === 'INTEGER_POSITIVE') {
                const value = parseInt(groupValues[key]);
                return value > 0;
            }
            return !!groupValues[key] && groupValues[key] !== 'Select one';
        });
    }

    const search = (keyword) => {
        if (keyword && keyword.length > 0) {
            const entities = searchEntities(keyword, allEntities, nameAttributes);
            setEntities(entities);
        } else {
            setEntities(allEntities);
        }
    }

    const downloadAttendance = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance',
            {
                headerFooter: {
                    firstFooter: 'By ticking or marking on the column for photo, video and story consent on this attendance list, I allow FHI360 and/or its partners and/or funders to reproduce, publish and/or otherwise use pictures and/or videos of me and/or my story in print and electronic format.'
                },
                pageSetup: {paperSize: 9, orientation: 'landscape'}
            }
        );
        worksheet.columns = [
            {header: 'Name of Participant', key: 'name', width: 50},
            {header: 'Gender', key: 'gender', width: 10},
            {header: 'Do you have any type of disability? Yes/No', key: 'disability', width: 10,},
            {header: 'School', key: 'school', width: 30},
            {header: 'Position', key: 'position', width: 30},
            {header: 'Phone Number', key: 'phone', width: 30},
            {header: 'Photo/Video/Story consent', key: 'consent', width: 20},
            {header: 'Signature', key: 'signature', width: 20}
        ];
        const rows = participants.map(participant => {
            return {
                school: orgUnits.find(ou => ou.id === participant.orgUnit)?.displayName,
                name: getParticipant(participant, nameAttributes),
                phone: getAttribute(participant, REPORT.PHONE),
                gender: getAttribute(participant, REPORT.GENDER) === '1' ? 'M' : 'F',
                position: getAttribute(participant, REPORT.POSITION)
            }
        })

        worksheet.addRows(rows);

        const buffer = await workbook.xlsx.writeBuffer();

        // Save the Excel file
        saveAs(new Blob([buffer]), 'Attendance.xlsx');
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
                                    <div className="flex flex-col w-full mb-2">
                                        <div className="w-full flex flex-row pt-2 gap-x-1">
                                            <div className="w-full flex flex-col card gap-x-1">
                                                <div className="w-3/12 p-3">
                                                    <label htmlFor="stage"
                                                           className="label">
                                                        {i18n.t('Event Venue')}
                                                    </label>
                                                    <VenueComponent
                                                        venueSelected={(venue) => setSelectedVenue(venue)}/>
                                                    {!selectedVenue &&
                                                        <label className="label pl-2 pt-4 text-sm italic">
                                                            Select a venue to begin configuring an event
                                                        </label>
                                                    }
                                                </div>
                                                {selectedVenue &&
                                                    <div
                                                        className="w-full p-8 mt-6 lg:mt-0 rounded shadow bg-white border-t-2 border-blue-500">
                                                        <div
                                                            className="relative overflow-x-auto shadow-md sm:rounded-lg w-full">
                                                            <div
                                                                className="flex flex-row gap-x-2 m-2 border-b-2 border-blue-500">
                                                                <div className="flex items-center mb-4">
                                                                    <input type="radio"
                                                                           checked={editMode === false}
                                                                           name="mode"
                                                                           onClick={() => {
                                                                               setEditMode(false);
                                                                               setGroupValues(Object.assign({}));
                                                                               setParticipants([]);
                                                                           }}
                                                                           className="radio"/>
                                                                    <label htmlFor="default-radio-1"
                                                                           className="label pl-2 pt-2">
                                                                        Configure New Event
                                                                    </label>
                                                                </div>
                                                                <div className="flex items-center mb-4">
                                                                    <input type="radio"
                                                                           name="mode"
                                                                           checked={editMode === true}
                                                                           onClick={() => {
                                                                               setEditMode(true);
                                                                               setGroupValues(Object.assign({}));
                                                                               setSelectedTraining('');
                                                                               setParticipants([]);
                                                                           }}
                                                                           className="radio"/>
                                                                    <label htmlFor="default-radio-2"
                                                                           className="label pl-2 pt-2">
                                                                        Update Existing Event
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            {(trainingAttributes || []).length > 0 && selectedVenue &&
                                                                <div className="flex flex-row justify-end">
                                                                    <button type="button"
                                                                            onClick={saveTraining}
                                                                            disabled={saving || loading}
                                                                            className={loading || saving || !validateTraining() ? 'primary-btn-disabled' : 'primary-btn'}
                                                                    >
                                                                        <div
                                                                            className="flex flex-row">
                                                                            {(saving || loading) &&
                                                                                <div
                                                                                    className="pr-2">
                                                                                    <SpinnerComponent/>
                                                                                </div>
                                                                            }
                                                                            <span>{editMode ? 'Update Event' : 'Create New Event'}</span>
                                                                        </div>
                                                                    </button>
                                                                </div>
                                                            }
                                                            <div className="flex flex-col w-4/12">
                                                                {selectedVenue && editMode &&
                                                                    <div className="w-full p-2">
                                                                        <label htmlFor="program"
                                                                               className="label">
                                                                            Existing Events
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
                                                                {selectedVenue && ((editMode && selectedTraining) || !editMode) &&
                                                                    <DataElementsComponent data={memoizedData}
                                                                                           valueChange={createOrUpdateGroupEvent}/>
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                        {participants && selectedVenue &&
                                            <div className="w-full flex flex-col pt-2">
                                                <div
                                                    className={loading ? 'opacity-20 relative overflow-x-auto shadow-md sm:rounded-l' : 'relative overflow-x-auto shadow-md sm:rounded-l'}>
                                                    {loading &&
                                                        <SpinnerComponent/>
                                                    }
                                                    <div className="flex flex-row justify-end">
                                                        {participants.length > 0 &&
                                                            <button type="button"
                                                                    onClick={downloadAttendance}
                                                                    className="primary-btn"
                                                            >
                                                                Download attendance
                                                            </button>
                                                        }
                                                    </div>
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
                                                                                className="warn-btn"
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
                                        }
                                        {selectedVenue &&
                                            <div className="w-full flex flex-row pt-2">
                                                <div className="w-3/12 p-2 mt-2 mb-2 bg-white">
                                                    <OrganisationUnitComponent
                                                        handleOUChange={orgUnitChanged}
                                                        selectedOU={selectedOu}
                                                    />
                                                    {!orgUnit &&
                                                        <label className="label pl-2 pt-2 text-sm italic">
                                                            Select an Org Unit to get potential attendees
                                                        </label>
                                                    }
                                                </div>
                                                <div className="w-9/12 p-2">
                                                    <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                        <div
                                                            className={loadingEntities ? 'opacity-20 relative overflow-x-auto shadow-md sm:rounded-l' : 'relative overflow-x-auto shadow-md sm:rounded-l'}>
                                                            {loadingEntities &&
                                                                <SpinnerComponent/>
                                                            }
                                                            {orgUnit &&
                                                                <div className="w-3/12">
                                                                    <SearchComponent search={(value) => search(value)}/>
                                                                </div>
                                                            }
                                                            <table
                                                                className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                                <caption
                                                                    className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">

                                                                    <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">

                                                                    </p>
                                                                    {selectedEntities.length > 0 &&
                                                                        <button type="button"
                                                                                className="primary-btn"
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
                                                                                className="checkbox"/>
                                                                        </div>
                                                                    </th>
                                                                    <th data-priority="1"
                                                                        className="px-6 py-3 w-1/12">#
                                                                    </th>
                                                                    <th data-priority="2"
                                                                        className="px-6 py-3 w-6/12">Profile
                                                                    </th>
                                                                    <th className="px-6 py-3 w-2/12">ID Number</th>
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
                                                                                        className="checkbox"/>
                                                                                </div>
                                                                            </td>
                                                                            <td>{index + 1}</td>
                                                                            <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity, nameAttributes)}</td>
                                                                            <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity, ['Bj48LXj8FmH'])}</td>
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
                                                                                onPageChange={(page) => {
                                                                                    setPage(page);
                                                                                    setLoadingEntities(true);
                                                                                }}
                                                                                onPageSizeChange={(size) => {
                                                                                    setPageSize(size);
                                                                                    setLoadingEntities(true);
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
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
