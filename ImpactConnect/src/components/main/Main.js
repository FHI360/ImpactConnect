import { useAlert, useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { Pagination } from '@dhis2/ui';
import React, { useContext, useEffect, useState } from 'react';
import { config } from '../../consts.js';
import {
    fetchEntities,
    formatDate,
    getParticipant,
    isObjectEmpty,
    paginate,
    provisionOUs,
    SharedStateContext,
    trackerCreate
} from '../../utils.js';
import { DataElementComponent } from '../DataElement.js';
import { Navigation } from '../Navigation.js';
import OrganisationUnitComponent from '../OrganisationUnitComponent.js';
import { TrainingsComponent } from '../TrainingsComponent.js';

export const Main = () => {
    const engine = useDataEngine();
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedOU,
        selectedSharedProgram,
        selectedSharedOrgUnit,
        selectedSharedStage,
    } = sharedState;

    const [selectedOUForQuery, setSelectedOUForQuery] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(selectedSharedProgram);
    const [selectedStage, setSelectedStage] = useState(selectedSharedStage);
    const [dataElements, setDataElements] = useState([]);
    const [participantsProgram, setParticipantsProgram] = useState('');
    const [trainingProgram, setTrainingProgram] = useState('');
    const [eventNameAttribute, setEventNameAttribute] = useState('');
    const [selectedTraining, setSelectedTraining] = useState('');
    const [venue, setVenue] = useState();
    const [selectedVenue, setSelectedVenue] = useState('');
    const [orgUnits, setOrgUnits] = useState([]);
    const [events, setEvents] = useState([]);
    const [dates, setDates] = useState([new Date()]);
    const [startDate, setStateDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);
    const [trainings, setTrainings] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [entities, setEntities] = useState([]);
    const [selectedOU, setSelectedOU] = useState(selectedSharedOU);
    const [nameAttributes, setNameAttributes] = useState([]);
    const [filterAttributes, setFilterAttributes] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [entityAttributes, setEntityAttributes] = useState([]);
    const [groupEdit, setGroupEdit] = useState(false);
    const [edits, setEdits] = useState([]);
    const [originalEdits, setOriginalEdits] = useState([]);
    const [selectedEntities, setSelectedEntities] = useState([]);
    const [repeatable, setRepeatable] = useState(false);
    const [groupValues, setGroupValues] = useState({});
    const [pagedParticipants, setPagedParticipants] = useState([]);

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

    const eventQuery = {
        events: {
            resource: 'tracker/events',
            params: ({program, programStage, start, end}) => {
                start.setUTCHours(0, 0, 0, 0);
                end.setUTCHours(23, 59, 59, 999);
                return ({
                    program: program,
                    programStage: programStage,
                    occurredAfter: start,
                    occurredBefore: end,
                    fields: ['id', 'displayName', 'occurredAt', 'dataElement(id, name)'],
                })
            }
        }
    }

    const dataElementsQuery = {
        programStage: {
            resource: `programStages`,
            params: ({
                fields: 'repeatable, programStageDataElements(dataElement(id, name, valueType, optionSet(id))'
            })
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

    const {data: dataEvent} = useDataQuery(eventQuery, {
        variables: {
            program: selectedProgram,
            programStage: selectedProgram,
            start: startDate,
            end: endDate,
        }
    });

    const {
        data: elementsData
    } = useDataQuery(dataElementsQuery );

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    const {data: orgUnitsData} = useDataQuery(organisationsQuery);

    const {
        data: attributesData,
        refetch: attributesRefetch
    } = useDataQuery(attributesQuery, {variables: {program: selectedProgram}});

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === `${config.dataStoreKey}`);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setFilterAttributes(entry.value.filterAttributes || []);
                setConfiguredStages(entry.value.configuredStages || {});
                setParticipantsProgram(entry.value.participantsProgram);
                setTrainingProgram(entry.value.trainingProgram);
                setGroupEdit(entry.value.groupEdit);
                setEventNameAttribute(entry.value.eventNameAttribute);
            }
        }
    }, [dataStore, selectedProgram]);

    useEffect(() => {

        setSelectedOUForQuery(provisionOUs(selectedOU))

    }, [selectedOU]);

    useEffect(() => {
        if (dataEvent && dataEvent.events) {
            setEvents(dataEvent.events);
            const dates = [];
            dataEvent.events.forEach(event => {
                dates.push(event.occurredAt);
            });

            setDates(dates);
        }

    }, [dataEvent, startDate, endDate, selectedStage, selectedProgram]);

    useEffect(() => {
        if (elementsData && elementsData.programStage && elementsData.programStage.programStages) {
            const dataElements = elementsData.programStage.programStages.flatMap(ps => ps.programStageDataElements.map(data => data.dataElement));
            setDataElements(dataElements);
            //setRepeatable(elementsData.programStage.repeatable);
        }
        setOriginalEdits([]);
        setEdits([]);
    }, [elementsData]);

    useEffect(() => {
        attributesRefetch({program: selectedProgram})
        if (attributesData?.attributes?.trackedEntityAttributes) {
            setEntityAttributes(attributesData?.attributes?.trackedEntityAttributes)
        }
    }, [attributesData, selectedProgram])

    useEffect(() => {
        if (trainingProgram && selectedVenue) {
            engine.query({
                trainings: {
                    resource: 'tracker/trackedEntities',
                    params: {
                        program: trainingProgram,
                        paging: false,
                        fields: 'attributes,trackedEntity',
                        orgUnit: selectedVenue
                    }
                }
            }).then(res => {
                if (res && res.trainings) {
                    const trainings = new Set(res.trainings.instances.flatMap(i => {
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

    }, [trainingProgram, selectedVenue])

    useEffect(() => {
        if (selectedTraining) {
            engine.query({
                training: {
                    resource: `tracker/trackedEntities/${selectedTraining}`,
                    params: {
                        fields: 'attributes,relationships(from(trackedEntity(trackedEntity)))',
                    }
                }
            }).then(res => {
                if (res && res.training) {
                    const ids = res.training.relationships.map(rel => rel.from.trackedEntity.trackedEntity);
                    if (ids.length > 0) {
                        fetchEntities(engine, ids, '*').then(value => {
                            const attendees = value.map(v => v.entity);
                            setEntities(attendees);

                            const currentPage = paginate(attendees, page, pageSize);
                            setPagedParticipants(currentPage);
                        });
                    }
                    res.training.attributes.forEach(attr => {
                        if (attr.attribute === 'CUW9TfQpAu6') {
                            setStateDate(new Date(attr.value))
                        } else if (attr.attribute === 'KPwanQQE4FU') {
                            setEndDate(new Date(attr.value))
                        }
                    })
                }
            })
        }
    }, [selectedTraining])

    useEffect(() => {
        if (orgUnitsData && orgUnitsData.orgUnits) {
            setOrgUnits(orgUnitsData.orgUnits.organisationUnits);
        }
    }, [orgUnitsData]);

    const pageParticipants = (page = 1, size = pageSize) => {
        setPage(page);
        const currentPage = paginate(entities, page, size);
        setPagedParticipants(currentPage);
    }

    const datesBetween = (startDate, endDate) => {
        if (endDate) {
            const dates = [];
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return dates.length;
        } else {
            return 1;
        }
    }

    const groupDataElementValue = (dataElement) => {
        return groupValues[dataElement];
    }

    const dataElementValue = (date, dataElement, entity) => {
        let event = entity.enrollments[0].events?.find(event => event.programStage === selectedStage
            && formatDate(event.occurredAt) === formatDate(date.toISOString()));
        const activeEvent = entity.enrollments[0].events?.find(event => event.programStage === selectedStage);
        const editedEntity = edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);

        if (activeEvent && !repeatable) {
            event = activeEvent;
        }
        if (event) {
            let value;
            if (editedEntity && editedEntity.values.some(v => formatDate(v.date) === formatDate(date) && v.dataElement.id === dataElement)) {
                value = editedEntity.values.find(value => value.dataElement.id === dataElement && formatDate(date) === formatDate(value.date))?.value;
            } else {
                value = event.dataValues.find(dv => dv.dataElement === dataElement)?.value;
            }
            return (value ?? '') + '';

        } else if (editedEntity) {
            return (editedEntity.values.find(value => value.dataElement.id === dataElement && formatDate(date) === formatDate(value.date))?.value ?? '') + '';
        }
        return null;
    }

    const saveEdits = () => {
        const events = [];

        const filterValues = (values, formattedDate) => {
            return values.filter(value => formatDate(value.date) === formattedDate);
        }

        const _edits = edits;
        //If group action and an entity has been selected and not edited, add it here
        if (groupEdit) {
            selectedEntities.forEach(entity => {
                if (!edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity)) {
                    _edits.push({
                            entity,
                            values: [{
                                date: startDate
                            }]
                        }
                    );
                }
            })
        }
        //Loop through each edit records and recreate event data for

        _edits.forEach(edit => {
            Map.groupBy(edit.values, ({date}) => formatDate(date)).keys().forEach(eventDate => {
                let event = edit.entity?.enrollments[0].events?.find(event => event.programStage === selectedStage &&
                    formatDate(event.occurredAt) === eventDate);
                const values = filterValues(edit.values, eventDate);

                if (!event) {
                    const existingEvent = edit.entity.enrollments[0].events?.find(event => event.programStage === selectedStage);
                    if (existingEvent && !repeatable) {
                        event = existingEvent;
                    } else {
                        event = {
                            programStage: selectedStage,
                            enrollment: edit.entity.enrollments[0].enrollment,
                            trackedEntity: edit.entity.trackedEntity,
                            orgUnit: edit.entity.orgUnit,
                            occurredAt: values[0].date.toISOString(),
                            dataValues: []
                        }
                    }
                }

                values.forEach(value => {
                    if (value.dataElement) {
                        const dataValue = event.dataValues.find(dv => dv.dataElement === value.dataElement.id) || {};
                        dataValue.dataElement = value.dataElement.id;
                        dataValue.value = (value.value ?? '') + '';
                        if (value.dataElement.valueType === 'TRUE_ONLY' && !value.value) {
                            dataValue.value = null;
                        }
                        if (value.dataElement.valueType.includes('DATE')) {
                            dataValue.value = value.value ? new Date(value.value).toISOString() : '';
                        }

                        const dataValues = event.dataValues.filter(dv => dv.dataElement !== value.dataElement.id) || [];
                        dataValues.push(dataValue);
                        event.dataValues = dataValues;
                    }
                });

                (configuredStages[selectedStage]['groupDataElements'] || []).map(de => {
                    return {
                        dataElement: de,
                        value: groupDataElementValue(de)
                    }
                }).forEach(de => {
                    const dataValue = event.dataValues.find(dv => dv.dataElement === de.dataElement) || {};
                    dataValue.dataElement = de.dataElement;
                    dataValue.value = (de.value ?? '') + '';
                    const valueType = dataElements.find(d => d.id === de.dataElement)?.valueType ?? '';
                    if (valueType === 'TRUE_ONLY' && !de.value) {
                        dataValue.value = null;
                    }
                    if (valueType.includes('DATE')) {
                        dataValue.value = de.value ? new Date(de.value).toISOString() : '';
                    }

                    const dataValues = event.dataValues.filter(dv => dv.dataElement !== de.dataElement) || [];
                    dataValues.push(dataValue);
                    event.dataValues = dataValues;
                })

                events.push(event);
            });
        });

        trackerCreate(engine, {events}).then((response) => {
            if (response) {
                setEdits([]);
                fetchEntities(engine, entities.map(e => e.trackedEntity), '*').then(value => {
                    const attendees = value.map(v => v.entity);
                    setEntities(attendees);

                    const currentPage = paginate(attendees, page, pageSize);
                    setPagedParticipants(currentPage);
                });
                show({msg: i18n.t('Attendance successfully updated'), type: 'success'});
            } else {
                show({msg: i18n.t('There was an error updating attendance'), type: 'error'});
            }
        });
    }

    // eslint-disable-next-line max-params
    const createOrUpdateEvent = (entity, date, dataElement, value) => {
        if (dataElement.valueType.includes('INTEGER')) {
            value = parseInt(value);
            if (dataElement.valueType === 'INTEGER_ZERO_OR_POSITIVE' && parseInt(value) < 0) {
                alert('Please enter a non-negative integer');
                return;
            }
            if (dataElement.valueType === 'INTEGER_POSITIVE' && parseInt(value) <= 0) {
                alert('Please enter a number greater than 0');
                return;
            }
            if (dataElement.valueType === 'INTEGER_NEGATIVE' && parseInt(value) >= 0) {
                alert('Please enter a number less than 0');
                return;
            }
        }
        const _edits = edits.filter(edit => edit.entity.trackedEntity !== entity.trackedEntity);
        let currentEdit = edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);
        const originalEdit = originalEdits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);
        if (!currentEdit) {
            currentEdit = {
                entity,
                values: []
            };
        }
        const values = currentEdit.values.filter(v => !(v.dataElement.id === dataElement.id && formatDate(date) === formatDate(v.date)));
        values.push({
            value,
            dataElement,
            date
        });
        currentEdit.values = values;

        const values2 = [...values];
        const values1 = [...(Object.assign({}, originalEdits.find(edit => edit.entity.trackedEntity === entity.trackedEntity))?.values ?? [])];
        const editChanged = () => {
            if (values2.length !== values1.length) {
                return true;
            }
            return values1.some(value => {
                const match = values2.find(v => v.dataElement.id === value.dataElement.id && formatDate(v.date) === formatDate(value.date));
                if (!match) {
                    return true;
                }
                if (value.dataElement.valueType === 'TRUE_ONLY' || value.dataElement.valueType === 'BOOLEAN') {
                    return !match.value !== !value.value;
                }
                return ((match.value ?? '') + '') !== ((value.value ?? '') + '');

            })
        }

        if (originalEdit?.entity.trackedEntity !== currentEdit.entity.trackedEntity || editChanged()) {
            _edits.push(currentEdit);

            if (!originalEdit) {
                setOriginalEdits([...originalEdits, {...currentEdit}]);
            } else {
                const _originalEdits = originalEdits.filter(edit => edit.entity.trackedEntity !== entity.trackedEntity);
                const oldValues = {...originalEdit}.values.filter(v => v.dataElement.id === dataElement.id && formatDate(v.date) === formatDate(date));
                const newValues = currentEdit.values.filter(v => !(v.dataElement.id === dataElement.id && formatDate(v.date) === formatDate(date)));
                oldValues.push(...newValues);
                setOriginalEdits([..._originalEdits, Object.assign({}, originalEdit, {values: oldValues})]);
            }
        }

        setEdits(_edits);
    }

    const createOrUpdateIndividualEvent = (entity, dataElement, value) => {
        createOrUpdateEvent(entity, startDate, dataElement, value);
    }

    const createOrUpdateGroupEvent = (dataElement, value) => {
        const values = groupValues;
        values[dataElement.id] = value;
        setGroupValues(Object.assign({}, values));
    }

    const individualDataElementsForDates = () => {
        const configuredDataElements = [];
        switch (datesBetween(startDate, endDate)) {
            case 1:
                configuredDataElements.push('xC0qvYXW3kB');
                break;
            case 2:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m']);
                break;
            case 3:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB']);
                break;
            case 4:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw']);
                break;
            case 5:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko']);
                break;
            case 6:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC']);
                break;
            case 7:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9']);
                break;
            case 8:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9', 'nz0xDT9pdgw']);
                break;
            case 9:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9', 'nz0xDT9pdgw', 'SdP4s8SRDX1']);
                break;
            case 10:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9', 'nz0xDT9pdgw', 'SdP4s8SRDX1', 'aX5CYDBVHBF']);
                break;
        }

        return configuredDataElements;
    }

    const handleVenueChange = event => {
        setSelectedVenue(event.id);
        setVenue(event.selected)
    }

    const attributeMap = () => {
        return {
            CUW9TfQpAu6: 'uaQMciOOeWp',
            KPwanQQE4FU: 'ydubZaoEeMy',
            CJ7g6K9Ukvf: 'UfMZ6XN7PS7',
            rlCta8FG2fz: 'e0RUQ4dgkgL'
        };
    }

    return (
        <>
            <div className="flex flex-row w-full h-full">
                <div className="page">
                    <Navigation/>
                    <div className="p-6">
                        <div className="mx-auto w-full">
                            <div className="w-full">
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
                                    {selectedVenue && trainings && trainings.length > 0 &&
                                        <div className="w-full">
                                            <TrainingsComponent trainings={trainings}
                                                                trainingSelected={(training) => setSelectedTraining(training)}/>
                                        </div>
                                    }
                                </div>
                                <div className="flex flex-col">
                                    {entities.length > 0 &&
                                        <div className="card">
                                            <div
                                                className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={groupEdit === true}
                                                    onChange={(payload) => {
                                                        setGroupEdit(payload.target.checked);
                                                    }}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                <label
                                                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                                    {i18n.t('Group Action?')}
                                                </label>
                                            </div>
                                        </div>
                                    }
                                    <div className="flex flex-col w-full mb-2">
                                        {groupEdit && entities.length > 0 &&
                                            <div className="card">
                                                <div className="flex flex-col w-3/12 p-6">
                                                    <label htmlFor="program"
                                                           className="label pb-2">
                                                        Attendance
                                                    </label>
                                                    {individualDataElementsForDates().map((id) => {
                                                        const de = dataElements.find(e => e.id === id)
                                                        return <>
                                                            <div
                                                                className="flex flex-col my-auto pl-4">
                                                                <DataElementComponent
                                                                    value={groupDataElementValue(de.id)}
                                                                    dataElement={de}
                                                                    readonly={selectedEntities.length === 0}
                                                                    valueChanged={(d, v) => {
                                                                        createOrUpdateGroupEvent(de, v)
                                                                    }
                                                                    }
                                                                />
                                                            </div>
                                                        </>
                                                    })}
                                                </div>
                                            </div>
                                        }
                                        {entities.length > 0 &&
                                            <div className="w-full flex flex-col pt-2">
                                                <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                    <div
                                                        className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                        <table
                                                            className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                            <caption
                                                                className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">

                                                                <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">

                                                                </p>
                                                                <div className="flex flex-row justify-end">
                                                                    {((groupEdit && !isObjectEmpty(groupValues) && selectedEntities.length > 0) || (!groupEdit && edits.length > 0)) &&
                                                                        <button type="button"
                                                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                onClick={saveEdits}>Save Attendance
                                                                        </button>
                                                                    }
                                                                </div>
                                                            </caption>
                                                            <thead
                                                                className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                            {!groupEdit &&
                                                                <tr>
                                                                    <td colSpan={4}
                                                                        rowSpan={1}></td>
                                                                    {individualDataElementsForDates().map((id, idx) => {
                                                                        const de = dataElements.find(e => e.id === id)
                                                                        return <th key={idx}
                                                                                   rowSpan={5}
                                                                                   style={{width: `${41.66 / datesBetween(startDate, endDate)}%`}}
                                                                                   className="py-3 h-48">
                                                                        <span
                                                                            className="whitespace-nowrap block text-left -rotate-90 w-16 pb-4">{de?.name}</span>
                                                                        </th>
                                                                    })}
                                                                </tr>
                                                            }
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
                                                                                    setEdits([])
                                                                                }
                                                                            }}
                                                                            checked={selectedEntities.length === entities.length}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                    </div>
                                                                </th>
                                                                <th data-priority="1" className="px-6 py-3 w-1/12">#
                                                                </th>
                                                                <th data-priority="2"
                                                                    className="px-6 py-3 w-3/12">Profile
                                                                </th>
                                                                <th data-priority="2"
                                                                    className="px-6 py-3 w-2/12">Org Unit
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {pagedParticipants.map((entity, index) => {
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
                                                                                            setEdits(edits.filter(edit => edit.entity.trackedEntity !== entity.trackedEntity))
                                                                                        } else {
                                                                                            setSelectedEntities([...selectedEntities, entity]);

                                                                                            let currentEdit = edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);
                                                                                            if (!currentEdit) {
                                                                                                currentEdit = {
                                                                                                    entity
                                                                                                };
                                                                                            }
                                                                                            const sample = edits[0];
                                                                                            if (sample) {
                                                                                                currentEdit.values = sample.values;

                                                                                                setEdits([...edits, currentEdit]);
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                            </div>
                                                                        </td>
                                                                        <td>{index + 1}</td>
                                                                        <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity, nameAttributes)}</td>
                                                                        <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{orgUnits.find(ou => ou.id === entity.orgUnit)?.displayName}</td>
                                                                        {!groupEdit && dataElements.length > 0 && individualDataElementsForDates().map((cde, idx2) => {
                                                                            const de = dataElements.find(de => de.id === cde);
                                                                            return <>
                                                                                <td>
                                                                                    <div
                                                                                        className="flex flex-col my-auto pl-4">
                                                                                        <DataElementComponent
                                                                                            key={idx2}
                                                                                            value={dataElementValue(startDate, de.id, entity)}
                                                                                            dataElement={de}
                                                                                            labelVisible={false}
                                                                                            valueChanged={(d, v) => {
                                                                                                createOrUpdateIndividualEvent(entity, de, v)
                                                                                            }}/>
                                                                                    </div>
                                                                                </td>
                                                                            </>
                                                                        })}
                                                                    </tr>
                                                                </>
                                                            })}
                                                            </tbody>
                                                            <tfoot>
                                                            <tr>
                                                                <th className="w-full p-2"
                                                                    colSpan={!groupEdit ? datesBetween(startDate, endDate) + 4: 4}>
                                                                    <div
                                                                        className="flex flex-row w-full justify-end">
                                                                        <Pagination
                                                                            page={page}
                                                                            pageCount={Math.ceil(entities.length / pageSize)}
                                                                            pageSize={pageSize}
                                                                            total={entities.length}
                                                                            onPageChange={(page) => pageParticipants(page)}
                                                                            onPageSizeChange={(size) => {
                                                                                setPage(1);
                                                                                setPageSize(size);
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
