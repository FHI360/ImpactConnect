import { useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { CalendarInput } from '@dhis2/ui';
import React, { useContext, useEffect, useState } from 'react';
import { config, MainTitle } from '../../consts.js';
import { provisionOUs, SharedStateContext } from '../../utils.js';
import { Navigation } from '../Navigation.js';
import OrganisationUnitComponent from '../OrganisationUnitComponent.js';
import ProgramComponent from '../ProgramComponent.js';
import ProgramStageComponent from '../ProgramStageComponent.js';

export const Main = () => {
    const engine = useDataEngine();
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedOU,
        setSelectedSharedOU,
        selectedSharedProgram,
        setSelectedSharedProgram,
        selectedSharedOrgUnit,
        setSelectedSharedOrgUnit
    } = sharedState;

    const [selectedOUForQuery, setSelectedOUForQuery] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(selectedSharedProgram);
    const [selectedStage, setSelectedStage] = useState('');
    const [dataElements, setDataElements] = useState([]);
    const [orgUnit, setOrgUnit] = useState(selectedSharedOrgUnit);
    const [events, setEvents] = useState([]);
    const [dates, setDates] = useState([new Date()]);
    const [startDate, setStateDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [dateEntities, setDateEntities] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [entities, setEntities] = useState([]);
    const [allEntities, setAllEntities] = useState([]);
    const [filterValue, setFilterValue] = useState({});
    const [scrollHeight, setScrollHeight] = useState('350px');
    const [selectedOU, setSelectedOU] = useState(selectedSharedOU);
    const [nameAttributes, setNameAttributes] = useState([]);
    const [filterAttributes, setFilterAttributes] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [entityAttributes, setEntityAttributes] = useState([]);
    const [attributeOptions, setAttributeOptions] = useState({});
    const [endDateVisible, setEndDateVisible] = useState(false);
    const [edits, setEdits] = useState([]);
    const [originalEdits, setOriginalEdits] = useState([]);

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
            id: ({id}) => id,
            params: ({
                fields: 'programStageDataElements(dataElement(id, name, valueType))'
            })
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
                    fields: ['*'],
                })
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

    const {data: entityData, refetch} = useDataQuery(entitiesQuery, {
        variables: {
            program: selectedProgram,
            orgUnit: orgUnit,
            page,
            pageSize
        }
    });

    const {
        data: elementsData,
        refetch: refetchDataElements
    } = useDataQuery(dataElementsQuery, {variables: {id: selectedStage}});

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    const {
        data: attributesData,
        refetch: attributesRefetch
    } = useDataQuery(attributesQuery, {variables: {program: selectedProgram}});

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === selectedProgram);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setFilterAttributes(entry.value.filterAttributes || []);
                setConfiguredStages(entry.value.configuredStages || {});
                setEndDateVisible(entry.value.endDateVisible);
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
        refetchDataElements({id: selectedStage});
        if (elementsData && elementsData.programStage && elementsData.programStage.programStageDataElements) {
            const dataElements = elementsData.programStage.programStageDataElements.map(data => data.dataElement);
            setDataElements(dataElements);
        }
        setOriginalEdits([]);
        setEdits([]);
    }, [elementsData, selectedStage]);

    useEffect(() => {
        if (entityData && entityData.entities) {
            setAllEntities(entityData.entities.instances);
            if (filterValue && Object.keys(filterValue).length) {
                Object.keys(filterValue).forEach(key => {
                    const entities = entityData.entities.instances.filter(entity => {
                        const attribute = entity.attributes.find(attr => attr.attribute === key);
                        return attribute && attribute.value + '' === filterValue[key] + '';
                    });

                    setEntities(entities);
                })
            } else {
                setEntities(entityData.entities.instances);
            }
        } else {
            setEntities([])
        }
    }, [orgUnit, selectedProgram, entityData, page, pageSize]);

    useEffect(() => {
        setPage(1);
        refetch({page: 1, pageSize: pageSize, program: selectedProgram, orgUnit: orgUnit});
    }, [orgUnit, selectedProgram, pageSize, page])

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

    useEffect(() => {
        attributesRefetch({program: selectedProgram})
        if (attributesData?.attributes?.trackedEntityAttributes) {
            setEntityAttributes(attributesData?.attributes?.trackedEntityAttributes)
        }
    }, [attributesData, selectedProgram])

    /***
     * Org Units Selection Function. Responsible populating OrgUnitsSelected with selected OrgUnits
     *
     */
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
    }

    const stateDateChanged = event => {
        const startDate = new Date(event.calendarDateString)
        setStateDate(startDate);
        calculateDatesBetween(startDate, endDate);
    }

    const endDateChanged = event => {
        const endDate = new Date(event.calendarDateString);
        setEndDate(endDate)
        calculateDatesBetween(startDate, endDate);
    }

    const filterEntities = (filterAttr, value) => {
        const filterAttributes = filterValue;
        filterAttributes[filterAttr] = value;
        setFilterValue(filterAttributes);

        if (value) {
            const entities = allEntities.filter(entity => {
                const attribute = entity.attributes.find(attr => attr.attribute === filterAttr);
                return attribute && attribute.value + '' === value + '';
            });

            setEntities(entities);
        } else {
            setEntities(allEntities)
        }
    }

    const calculateDatesBetween = (startDate, endDate) => {
        const dates = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        setDates(dates);
    }

    const formDate = (date) => {
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
        }).format(date);
    }

    const getParticipant = (entity) => {
        return nameAttributes.map(attr => {
            return entity.enrollments[0].attributes?.find(attribute => attribute.attribute === attr)?.value
        }).join(' ')
    }

    const dataElementValue = (dataElement, entity) => {
        const event = entity.enrollments[0].events?.find(event => event.programStage === selectedStage);
        const editedEntity = edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity)

        if (event) {
            let value;
            if (editedEntity) {
                value = editedEntity.values.find(value => value.dataElement.id === dataElement)?.value;
            } else {
                value = event.dataValues.find(dv => dv.dataElement === dataElement)?.value;
            }
            return (value ?? '') + '';

        } else if (editedEntity) {
            return (editedEntity.values.find(value => value.dataElement.id === dataElement)?.value ?? '') + '';
        }
        return null;
    }

    const selectDate = (date, checked) => {
        const dates = dateEntities;
        if (checked) {
            dates[date] = entities.map(e => e.trackedEntity);
        } else {
            dates[date] = [];
        }

        setDateEntities(dates);
    }

    const dateChecked = (entity, date) => {
        return dateEntities[date]?.includes(entity.trackedEntity)
    }

    const checkEntity = (entity, date, checked) => {
        const dates = dateEntities;
        let entities = dateEntities[date];
        if (checked) {
            entities.push(entity.trackedEntity);
        } else {
            entities = entities.filter(e => e.trackedEntity !== entity.trackedEntity);
        }
        dates[date] = entities;
        setDateEntities(dates);
    }

    const saveEdits = () => {
        const events = [];
        edits.forEach(edit => {
            let event = edit.entity.enrollments[0].events?.find(event => event.programStage === selectedStage);
            if (!event) {
                event = {
                    programStage: selectedStage,
                    enrollment: edit.entity.enrollments[0].enrollment,
                    trackedEntity: edit.entity.trackedEntity,
                    orgUnit: edit.entity.orgUnit,
                    occurredAt: edit.date.toISOString(),
                    dataValues: []
                }
            }
            edit.values.forEach(value => {
                const dataValue = event.dataValues.find(dv => dv.dataElement === value.dataElement.id) || {};
                dataValue.dataElement = edit.dataElement.id;
                dataValue.value = (edit.value ?? '') + '';
                if (edit.dataElement.valueType === 'TRUE_ONLY' && !edit.value) {
                    dataValue.value = null;
                }
                if (edit.dataElement.valueType.includes('DATE')) {
                    dataValue.value = edit.value ? edit.value.toISOString() : '';
                }

                const dataValues = event.dataValues.filter(dv => dv.dataElement !== value.dataElement.id) || [];
                dataValues.push(dataValue);
                event.dataValues = dataValues;
            });

            events.push(event);
        })

        engine.mutate({
            resource: 'tracker',
            type: 'create',
            params: {
                async: false
            },
            data: {
                events
            }
        }).then((response) => {
            if (response.status === 'OK') {
                setEdits([]);
                refetch({
                    program: selectedProgram,
                    orgUnit: orgUnit,
                    page,
                    pageSize
                })
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
        const values = currentEdit.values.filter(v => v.dataElement.id !== dataElement.id);
        values.push({
            value,
            dataElement,
            date
        });
        currentEdit.values = values;

        const mappedValues = (entity) => {
            return entity.values.map(v => {
                return {
                    value: v.value,
                    dataElement: v.dataElement.id,
                }
            });
        }
        const mappedValuesEquals = (values2, values1) => {
            let equals = false;
            values1.forEach(v => {
                const corr = values2.find(v2 => v2.dataElement === v.dataElement);
                equals = corr?.value === v.value;
            })
            return equals;
        }
        if (originalEdit?.entity.trackedEntity !== currentEdit.entity.trackedEntity ||
            !mappedValuesEquals(mappedValues(originalEdit), mappedValues(currentEdit))) {
            _edits.push(currentEdit);

            if (!originalEdit) {
                setOriginalEdits([...originalEdits, currentEdit]);
            } else {
                const _originalEdits = originalEdits.filter(edit => edit.entity.trackedEntity !== entity.trackedEntity);
                const oldValues = originalEdit.values.filter(v => v.dataElement.id === dataElement.id);
                const newValues = currentEdit.values.filter(v => v.dataElement.id !== dataElement.id);
                oldValues.push(...newValues);
                originalEdit.values = oldValues;

                setOriginalEdits([..._originalEdits, originalEdit]);
            }
        }

        setEdits(_edits);
    }

    return (
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
            <div className="w-10/12 ml-4 mr-4 p-4 bg-gray-100 min-h-screen transition-all rounded-md">
                <Navigation/>
                <div className="p-6">
                    <div className="mx-auto w-full">
                        <div className="w-full">
                            <div className="flex flex-col">
                                <div className="flex flex-col gap-1 mb-2">
                                    <div className="w-3/12 rounded-md bg-white p-3">
                                        <div>
                                            <ProgramComponent
                                                selectedProgram={selectedProgram}
                                                setSelectedProgram={handleProgramChange}
                                                disabled={!selectedSharedOrgUnit}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-3/12 rounded-md bg-white p-3">
                                        <div>
                                            <ProgramStageComponent
                                                selectedProgram={selectedProgram}
                                                selectedStage={selectedStage}
                                                setSelectedStage={setSelectedStage}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-md bg-white p-3 mb-2 w-3/12">
                                    <label htmlFor="stage"
                                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white border-b-2 border-b-gray-800">
                                        {i18n.t('Entity Filter')}
                                    </label>
                                    <div className="p-2">
                                        {filterAttributes.map((attr) => {
                                            const entityAttribute = entityAttributes.find(ea => ea.id === attr);
                                            if (entityAttribute) {
                                                if (entityAttribute.optionSet?.id) {
                                                    const optionsQuery = {
                                                        optionSets: {
                                                            resource: 'optionSets',
                                                            id: entityAttribute.optionSet.id,
                                                            params: {
                                                                fields: 'id,options(code,displayName)',
                                                            }
                                                        }
                                                    }
                                                    engine.query(optionsQuery).then(d => {
                                                        const ao = attributeOptions;
                                                        ao[attr] = d.optionSets?.options || [];
                                                        setAttributeOptions(ao);
                                                    });
                                                    return <>
                                                        <div className="flex mb-2">
                                                            <div>
                                                                <label htmlFor="program"
                                                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                    {i18n.t(`Select ${entityAttributes.find(a => a.id === attr)?.displayName}`)}
                                                                </label>
                                                                <select id="program"
                                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                                        value={filterValue[attr]}
                                                                        onChange={(event) => filterEntities(attr, event.target.value)}>
                                                                    <option
                                                                        selected>Choose {entityAttributes.find(a => a.id === attr)?.displayName}</option>
                                                                    {(attributeOptions[attr] || []).map(option => {
                                                                            return <>
                                                                                <option
                                                                                    value={option.code}>{option.displayName}</option>
                                                                            </>
                                                                        }
                                                                    )}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </>
                                                } else {
                                                    if (attr.valueType === 'TRUE_ONLY' || attr.valueType === 'BOOLEAN') {
                                                        return <>
                                                            <div
                                                                className="flex items-center mb-2">
                                                                <input
                                                                    type="checkbox"
                                                                    onChange={(event) => filterEntities(attr, event.target.checked)}
                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                <label
                                                                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                                                    {entityAttributes.find(a => a.id === attr)?.displayName}
                                                                </label>
                                                            </div>
                                                        </>
                                                    }
                                                    if (attr.valueType.includes('INTEGER') || attr.valueType === 'NUMBER') {
                                                        return <>
                                                            <div
                                                                className="mb-2">
                                                                <label
                                                                    className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                    {entityAttributes.find(a => a.id === attr)?.displayName}
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    onChange={(event) => filterEntities(attr, event.target.value)}
                                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                                                            </div>
                                                        </>
                                                    }
                                                    if (attr.valueType.includes('TEXT')) {
                                                        return <>
                                                            <div
                                                                className="mb-2">
                                                                <label
                                                                    className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                    {entityAttributes.find(a => a.id === attr)?.displayName}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    onChange={(event) => filterEntities(attr, event.target.value)}
                                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                                                            </div>
                                                        </>
                                                    }
                                                    if (attr.valueType.includes('DATE')) {
                                                        return <>
                                                            <div className="mb-2">
                                                                <label
                                                                    className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                    {entityAttributes.find(a => a.id === attr)?.displayName}
                                                                </label>
                                                                <CalendarInput
                                                                    label=""
                                                                    calendar="gregory"
                                                                    onDateSelect={(event) => filterEntities(attr, new Date(event.calendarDateString).toISOString())}
                                                                />
                                                            </div>
                                                        </>
                                                    }
                                                }
                                            }
                                        })}
                                        {!Object.keys(filterAttributes).length &&
                                            <span>
                                                {i18n.t('No Entity Filter')}
                                            </span>
                                        }
                                    </div>
                                </div>
                                <div className="flex flex-col w-full mb-2">
                                    <div className="w-3/12 rounded-md bg-white p-3 flex flex-row gap-4">
                                        <div className="flex flex-col">
                                            <label
                                                className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                {endDateVisible ? 'Event Start Date' : 'Event Date'}
                                            </label>
                                            <CalendarInput
                                                label=""
                                                calendar="gregory"
                                                date={startDate.toISOString().slice(0, 10)}
                                                onDateSelect={stateDateChanged}
                                            />
                                        </div>
                                        {endDateVisible &&
                                            <div className="flex flex-col">
                                                <label
                                                    className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                    {'Event End Date'}
                                                </label>
                                                <CalendarInput
                                                    label=""
                                                    calendar="gregory"
                                                    date={endDate.toISOString().slice(0, 10)}
                                                    max={new Date().toISOString().slice(0, 10)}
                                                    onDateSelect={endDateChanged}
                                                />
                                            </div>
                                        }
                                    </div>
                                    <div className="w-full flex flex-col pt-2">
                                        <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                <table
                                                    className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                    <caption
                                                        className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">

                                                        <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">

                                                        </p>
                                                        <div className="flex flex-row justify-end">
                                                            {edits.length !== 0 &&
                                                                <button type="button"
                                                                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                        onClick={saveEdits}>Save Records
                                                                </button>
                                                            }
                                                        </div>
                                                    </caption>
                                                    <thead
                                                        className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                    <tr>
                                                        <th rowSpan={2} className="px-6 py-6">
                                                            <div
                                                                className="flex items-center mb-4">
                                                                <input
                                                                    type="checkbox"
                                                                    value=""
                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                            </div>
                                                        </th>
                                                        <th data-priority="1" className="px-6 py-3" rowSpan={2}>#
                                                        </th>
                                                        <th data-priority="2" className="px-6 py-3"
                                                            rowSpan={2}>Participant
                                                        </th>
                                                        <th data-priority="3"
                                                            className="px-6 py-3 mx-auto text-center"
                                                            colSpan={dates.length}>
                                                            Event dates
                                                        </th>
                                                    </tr>
                                                    <tr>
                                                        {dates.map((date, idx) => {
                                                            return <th key={idx}
                                                                       className="px-6 py-3">
                                                                <div className="flex flex-row gap-1">
                                                                    {/*<div
                                                                        className="flex items-center mb-4">
                                                                        <input
                                                                            type="checkbox"
                                                                            value=""
                                                                            onChange={(event) => {
                                                                                selectDate(date, event.target.checked)
                                                                            }}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                    </div>*/}
                                                                    {endDateVisible && formDate(date)}
                                                                </div>
                                                            </th>
                                                        })}
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
                                                                            value=""
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                    </div>
                                                                </td>
                                                                <td>{index + 1}</td>
                                                                <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity)}</td>
                                                                {dates.map((date, idx) => {
                                                                    return <>
                                                                        <td key={idx} className="px-6 py-4">
                                                                            <div className="flex flex-row">
                                                                                {/* <div
                                                                                    className="w-1/12 flex flex-col">
                                                                                    <div
                                                                                        className="flex items-center mb-4">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={dateChecked(entity, date) === true}
                                                                                            onChange={(event) => {
                                                                                                checkEntity(entity, date, event.target.checked)
                                                                                            }}
                                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                                    </div>
                                                                                </div>*/}
                                                                                <div
                                                                                    className="w-11/12 flex flex-col">
                                                                                    <div
                                                                                        className="flex flex-col gap-1">
                                                                                        {dataElements.map(de => {
                                                                                            const configuredDataElements = configuredStages[selectedStage] || [];
                                                                                            if ((de.valueType === 'TRUE_ONLY' || de.valueType === 'BOOLEAN') && configuredDataElements.includes(de.id)) {
                                                                                                return <>
                                                                                                    <div
                                                                                                        className="flex items-center mb-4">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            checked={dataElementValue(de.id, entity) === 'true'}
                                                                                                            onChange={(event) => createOrUpdateEvent(entity, date, de, event.target.checked)}
                                                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                                                        <label
                                                                                                            className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                                                                                            {de.name}
                                                                                                        </label>
                                                                                                    </div>
                                                                                                </>
                                                                                            }
                                                                                            if ((de.valueType.includes('INTEGER') || de.valueType === 'NUMBER') && configuredDataElements.includes(de.id)) {
                                                                                                return <>
                                                                                                    <div
                                                                                                        className="mb-5">
                                                                                                        <label
                                                                                                            className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                                                            {de.name}
                                                                                                        </label>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            value={dataElementValue(de.id, entity)}
                                                                                                            onChange={(event) => createOrUpdateEvent(entity, date, de, event.target.value)}
                                                                                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                                                                                                    </div>
                                                                                                </>
                                                                                            }
                                                                                            if (de.valueType.includes('TEXT') && configuredDataElements.includes(de.id)) {
                                                                                                return <>
                                                                                                    <div
                                                                                                        className="mb-5">
                                                                                                        <label
                                                                                                            className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                                                            {de.name}
                                                                                                        </label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={dataElementValue(de.id, entity)}
                                                                                                            onChange={(event) => createOrUpdateEvent(entity, date, de, event.target.value)}
                                                                                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                                                                                                    </div>
                                                                                                </>
                                                                                            }
                                                                                            if (de.valueType.includes('DATE') && configuredDataElements.includes(de.id)) {
                                                                                                return <>
                                                                                                    <div
                                                                                                        className="mb-5 flex flex-col">
                                                                                                        <label
                                                                                                            className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                                                            {de.name}
                                                                                                        </label>
                                                                                                        <CalendarInput
                                                                                                            calendar="gregory"
                                                                                                            label=""
                                                                                                            date={dataElementValue(de.id, entity)}
                                                                                                            onDateSelect={(event) => createOrUpdateEvent(entity, date, de, new Date(event.calendarDateString).toISOString())}
                                                                                                        />
                                                                                                    </div>
                                                                                                </>
                                                                                            }
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </>
                                                                })}
                                                            </tr>
                                                        </>
                                                    })}
                                                    </tbody>
                                                    <tfoot>
                                                    <tr className="font-semibold text-gray-900 dark:text-white">
                                                        <th scope="row" className="px-6 py-3 text-base">

                                                        </th>
                                                    </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
